/**
 * AI search check: the check list, the result shape api/scan.ts returns, and the
 * small helpers the component and tests share. The checks themselves run on the
 * server (a browser can't read another site), so the labels here only drive the
 * "checking" list while the scan runs. Keep ids and order in step with api/scan.ts.
 */

export type CheckId =
  | 'robots' | 'llms' | 'sitemap' | 'nojs' | 'org' | 'schema' | 'headings' | 'meta' | 'canonical' | 'faq' | 'fresh' | 'speed'
  | 'semantic' | 'forms' | 'facts' | 'links' | 'mcp';

export type Group = 'site' | 'agent';

export const GROUPS: { id: Group; label: string; blurb: string }[] = [
  { id: 'site', label: 'Site readiness', blurb: 'How easily AI tools can reach, read and understand your pages.' },
  { id: 'agent', label: 'Agent readiness', blurb: 'How easily an AI agent could find your pricing or get in touch for someone.' },
];

export const CHECKS: { id: CheckId; group: Group; label: string }[] = [
  { id: 'robots', group: 'site', label: 'AI crawlers allowed in robots.txt' },
  { id: 'llms', group: 'site', label: 'An llms.txt file' },
  { id: 'sitemap', group: 'site', label: 'A sitemap AI tools can follow' },
  { id: 'nojs', group: 'site', label: 'Content that loads without JavaScript' },
  { id: 'org', group: 'site', label: 'Organisation schema' },
  { id: 'schema', group: 'site', label: 'Page schema' },
  { id: 'headings', group: 'site', label: 'One h1 and a clear heading outline' },
  { id: 'meta', group: 'site', label: 'Titles and descriptions' },
  { id: 'canonical', group: 'site', label: 'Canonical links' },
  { id: 'faq', group: 'site', label: 'Questions and answers on the page' },
  { id: 'fresh', group: 'site', label: 'Recently updated content' },
  { id: 'speed', group: 'site', label: 'Page weight and response time' },
  { id: 'semantic', group: 'agent', label: 'Pages built from meaningful HTML' },
  { id: 'forms', group: 'agent', label: 'Forms an agent can fill in' },
  { id: 'facts', group: 'agent', label: 'Pricing and contact details in the HTML' },
  { id: 'links', group: 'agent', label: 'Link text that says where it goes' },
  { id: 'mcp', group: 'agent', label: 'An MCP server or .well-known file, as a bonus' },
];

export type Check = { id: CheckId; group: Group; label: string; pass: boolean; detail: string; bonus?: boolean };
export type Fix = { id: CheckId; title: string; body: string; effort: string };

export type ScanResult = {
  ok: true;
  site: string;
  host: string;
  brand: string;
  checkedAt: string;
  score: { site: { got: number; of: number }; agent: { got: number; of: number } };
  summary: { headline: string; body: string };
  top: Fix[];
  checks: Check[];
};

export type ScanError = { ok: false; error: string; message?: string };

/** "https://www.Acme.com/about?x" → "www.acme.com". Empty when it isn't a web address. */
export function normaliseSite(input: string): string {
  let s = (input || '').trim().toLowerCase();
  if (!s || s.length > 253 || /\s/.test(s)) return '';
  if (!/^https?:\/\//.test(s)) s = `https://${s}`;
  try {
    const h = new URL(s).hostname.replace(/\.$/, '');
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) && /\.[a-z]{2,}$/.test(h) ? h : '';
  } catch {
    return '';
  }
}

/** The link that reruns the check for a site (also what the report email links to). */
export function shareUrl(base: string, host: string): string {
  const u = new URL(base);
  u.search = '';
  u.hash = '';
  u.searchParams.set('site', host);
  return u.toString();
}

export function isResult(v: unknown): v is ScanResult {
  const r = v as ScanResult;
  return !!r && r.ok === true && typeof r.host === 'string' && Array.isArray(r.checks) && !!r.score?.site && !!r.score?.agent;
}

/** The three questions the email answers, shown before they ask (the middle one is filled in on our side). */
export function previewQuestions(brand: string, competitor: string): string[] {
  const them = competitor.trim() || 'your main competitor';
  return [`What is ${brand}?`, 'Which companies are best for what you do?', `${brand} or ${them}: which should I choose?`];
}
