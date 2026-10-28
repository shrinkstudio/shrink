/**
 * AI search check: reads a site the way an AI crawler does and scores it.
 *
 * POST { site: "acme.com" } → two scores (site readiness, agent readiness), the
 * three changes that would help most, and all 17 checks. Free and on screen, no
 * email needed. The AI Search Check code component calls this; api/forms.ts calls
 * it again when someone asks for the emailed report (so the email is built from
 * our own scan, never from text the browser sent).
 *
 * Reads only public pages: the homepage, robots.txt, llms.txt, the sitemap,
 * /.well-known files and up to four key pages linked from the homepage. Private
 * and local addresses are refused at every redirect hop.
 *
 * Stays self-contained (no relative imports): Vercel runs api/ files unbundled.
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/* browsers allowed to call this (server-to-server calls send no Origin) */
const ORIGIN_RE = /^(https:\/\/((www\.)?shrink\.studio|[a-z0-9-]+\.webflow\.io)|http:\/\/localhost(:\d+)?)$/;
const UA = 'ShrinkAISearchCheck/1.0 (+https://www.shrink.studio/tools/ai-search-check)';
const FETCH_MS = 8000;
const MAX_BYTES = 2_000_000;
const CACHE_MS = 30 * 60 * 1000;
const DAYS_FRESH = 180;

/* the AI crawlers that decide whether you can show up in AI answers */
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended'];

export type CheckId =
  | 'robots' | 'llms' | 'sitemap' | 'nojs' | 'org' | 'schema' | 'headings' | 'meta' | 'canonical' | 'faq' | 'fresh' | 'speed'
  | 'semantic' | 'forms' | 'facts' | 'links' | 'mcp';

export type Check = {
  id: CheckId;
  group: 'site' | 'agent';
  label: string;
  pass: boolean;
  /** what we found, in a sentence */
  detail: string;
  /** a bonus can only add to a score */
  bonus?: boolean;
};

export type Fix = { id: CheckId; title: string; body: string; effort: string };

export type ScanResult = {
  ok: true;
  site: string;
  host: string;
  brand: string;
  description: string;
  checkedAt: string;
  pages: string[];
  score: { site: { got: number; of: number }; agent: { got: number; of: number } };
  summary: { headline: string; body: string };
  top: Fix[];
  checks: Check[];
};

/* ---------- labels and fixes (the copy the page and the email show) ---------- */

const LABELS: Record<CheckId, string> = {
  robots: 'AI crawlers allowed in robots.txt',
  llms: 'An llms.txt file',
  sitemap: 'A sitemap AI tools can follow',
  nojs: 'Content that loads without JavaScript',
  org: 'Organisation schema',
  schema: 'Page schema',
  headings: 'One h1 and a clear heading outline',
  meta: 'Titles and descriptions',
  canonical: 'Canonical links',
  faq: 'Questions and answers on the page',
  fresh: 'Recently updated content',
  speed: 'Page weight and response time',
  semantic: 'Pages built from meaningful HTML',
  forms: 'Forms an agent can fill in',
  facts: 'Pricing and contact details in the HTML',
  links: 'Link text that says where it goes',
  mcp: 'An MCP server or .well-known file, as a bonus',
};

/* most helpful first: the order the top three are picked in */
const PRIORITY: CheckId[] = ['robots', 'nojs', 'org', 'facts', 'meta', 'headings', 'llms', 'sitemap', 'faq', 'schema', 'canonical', 'speed', 'forms', 'links', 'semantic', 'fresh'];

function fixFor(c: Check, ctx: { blocked: string[]; seconds: string; kb: number; slow: boolean; generic: number }): Fix {
  const f: Record<Exclude<CheckId, 'mcp'>, [string, string, string]> = {
    robots: [
      'Let AI crawlers read your site',
      `Your robots.txt asks ${list(ctx.blocked.slice(0, 3))} to stay away. Welcoming them in lets AI tools read your pages and quote you.`,
      'Quick fix',
    ],
    llms: [
      'Add an llms.txt file',
      'A short llms.txt at the root of your site gives AI tools a plain summary of who you are, with links to your most useful pages.',
      'An hour or two',
    ],
    sitemap: [
      'Publish a sitemap',
      'A sitemap.xml, linked from robots.txt, helps AI crawlers find every page worth reading, including the new ones.',
      'Quick fix',
    ],
    nojs: [
      'Show your words without JavaScript',
      'Most of your homepage appears only after JavaScript runs, and many AI crawlers read the raw HTML. Rendering the words on the server lets them see what your visitors see.',
      'A few days',
    ],
    org: [
      'Tell AI tools who you are',
      'A short block of Organisation schema gives AI tools your name, what you do and where to find you, in a form they can trust.',
      'An hour or two',
    ],
    schema: [
      'Describe your key pages with schema',
      'Schema such as Service, Product or FAQPage on your key pages helps AI tools understand what each page is for.',
      'A day or two',
    ],
    headings: [
      'Give each page one clear heading',
      'One h1 and a tidy outline of h2s helps AI tools work out what a page is about, and pull the right section into an answer.',
      'An hour or two',
    ],
    meta: [
      'Write a title and description for every page',
      'A clear title and a one-sentence description are often the first thing an AI tool reads about a page, so they shape how it describes you.',
      'An hour or two',
    ],
    canonical: [
      'Add canonical links',
      'A canonical link on each page tells AI tools which address is the real one, so your pages are never in competition with copies of themselves.',
      'Quick fix',
    ],
    faq: [
      'Answer the questions buyers ask',
      'AI tools love a clear question with a direct answer. A short FAQ on your key pages gives them something easy to quote.',
      'A day or two',
    ],
    fresh: [
      'Show that your content is current',
      'Dated updates, recent articles and a modified date in your schema tell AI tools your information is up to date.',
      'Ongoing',
    ],
    speed: [
      'Speed up your homepage',
      `${ctx.slow ? `Your homepage took ${ctx.seconds} seconds to load for us.` : `Your homepage HTML weighs ${ctx.kb.toLocaleString('en-GB')} KB.`} Faster, lighter pages get read more often and more fully by AI crawlers.`,
      'A day or two',
    ],
    semantic: [
      'Use meaningful HTML',
      'Landmarks such as main and nav help AI agents find the important part of each page and skip past the rest.',
      'An hour or two',
    ],
    forms: [
      'Make your forms easy for agents',
      'A contact or demo form where every field has a proper label lets an AI agent get in touch for someone.',
      'An hour or two',
    ],
    facts: [
      'Put pricing and contact details in the page',
      'When an AI agent is asked to compare options or get in touch, it looks for prices and contact details in the HTML. Making both easy to find helps it recommend you.',
      'A day or two',
    ],
    links: [
      'Use link text that says where it goes',
      `${ctx.generic} of your links say things like “Learn more”. Text such as “See our pricing” tells AI agents where each link leads.`,
      'An hour or two',
    ],
  };
  const [title, body, effort] = f[c.id as Exclude<CheckId, 'mcp'>];
  return { id: c.id, title, body, effort };
}

function summaryFor(passed: number, of: number) {
  const ratio = passed / of;
  if (ratio >= 0.85)
    return {
      headline: "You're in great shape",
      body: 'AI tools can reach, read and understand your site well. The changes below are small polish that would help them recommend you even more often.',
    };
  if (ratio >= 0.6)
    return {
      headline: "You're in good shape, with a few easy wins",
      body: 'AI tools can reach and read most of your site. The changes below would help them understand what you do, and recommend you more often.',
    };
  if (ratio >= 0.35)
    return {
      headline: 'A solid start, with some quick wins',
      body: 'AI tools can find your site, and a handful of changes would make it much easier for them to read and recommend you. These three would help most.',
    };
  return {
    headline: "There's plenty of room to grow here",
    body: 'AI tools will find your site hard to read today, and the good news is that most of it is quick to put right. Start with the three changes below.',
  };
}

/* ---------- handler ---------- */

const cache = new Map<string, { at: number; result: ScanResult }>();
const recent = new Map<string, number[]>();

export function OPTIONS(request: Request): Response {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function POST(request: Request): Promise<Response> {
  const headers = cors(request);
  const origin = request.headers.get('origin');
  if (origin && !headers['Access-Control-Allow-Origin']) return json({ ok: false, error: 'origin' }, 403);
  if (tooMany(request)) return json({ ok: false, error: 'slow down', message: "You've run a few checks in a row. Please give it a few minutes and try again." }, 429, headers);

  let site = '';
  try {
    site = String((await request.json())?.site || '');
  } catch {
    return json({ ok: false, error: 'bad json' }, 400, headers);
  }
  const host = normaliseHost(site);
  if (!host) return json({ ok: false, error: 'site', message: 'Please enter a website address, such as yourcompany.com.' }, 400, headers);

  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < CACHE_MS) return json(hit.result, 200, headers);

  try {
    const result = await scan(host);
    if (result === 'blocked')
      return json({ ok: false, error: 'blocked', message: `${host} turned our checker away. A firewall that blocks us often blocks AI crawlers too, so it's worth a look, and we're happy to help.` }, 422, headers);
    if (!result) return json({ ok: false, error: 'unreachable', message: `We had trouble reaching ${host}. Please check the address and try again.` }, 422, headers);
    cache.set(host, { at: Date.now(), result });
    cache.set(result.host, { at: Date.now(), result });
    if (cache.size > 500) cache.clear();
    return json(result, 200, headers);
  } catch (err) {
    console.error('scan failed', host, err);
    return json({ ok: false, error: 'failed', message: 'Something went wrong on our side. Please try again in a moment.' }, 500, headers);
  }
}

/* ---------- the scan ---------- */

/** The scan, or 'blocked' when the site turns automated visitors away, or null when it can't be reached. */
export async function scan(inputHost: string): Promise<ScanResult | 'blocked' | null> {
  const home = (await get(`https://${inputHost}/`, { accept: 'text/html' })) || (await get(`http://${inputHost}/`, { accept: 'text/html' }));
  if (home && [401, 403, 429, 503].includes(home.status)) return 'blocked';
  if (!home || home.status >= 400 || !home.text) return null;
  const base = new URL(home.url);
  const origin = base.origin;
  const host = base.hostname;

  const [robots, llms, sitemapDefault, wkMcp, wkPlugin] = await Promise.all([
    get(`${origin}/robots.txt`, { accept: 'text/plain' }),
    get(`${origin}/llms.txt`, { accept: 'text/plain' }),
    get(`${origin}/sitemap.xml`, { accept: 'application/xml' }),
    get(`${origin}/.well-known/mcp.json`, { accept: 'application/json', max: 200_000 }),
    get(`${origin}/.well-known/ai-plugin.json`, { accept: 'application/json', max: 200_000 }),
  ]);
  const robotsText = robots && robots.status < 400 && !looksHtml(robots.text) ? robots.text : '';

  // sitemap: robots.txt says where it is, else /sitemap.xml
  const declared = [...robotsText.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  let sitemap = sitemapDefault;
  if (declared[0] && declared[0] !== `${origin}/sitemap.xml`) {
    const s = await get(declared[0], { accept: 'application/xml' });
    if (s) sitemap = s;
  }
  const sitemapText = sitemap && sitemap.status < 400 && /<(urlset|sitemapindex)\b/i.test(sitemap.text) ? sitemap.text : '';

  // up to four key pages linked from the homepage
  const keyUrls = keyPages(home.text, base);
  const pages = (await Promise.all(keyUrls.map((u) => get(u, { accept: 'text/html' })))).filter(
    (p): p is Fetched => !!p && p.status < 400 && !!p.text && looksHtml(p.text),
  );
  const all = [home, ...pages];

  const checks: Check[] = [];
  const add = (id: CheckId, pass: boolean, detail: string, bonus = false) =>
    checks.push({ id, group: ['semantic', 'forms', 'facts', 'links', 'mcp'].includes(id) ? 'agent' : 'site', label: LABELS[id], pass, detail, ...(bonus ? { bonus } : {}) });

  // 1 robots
  const blocked = AI_BOTS.filter((b) => robotsBlocks(robotsText, b));
  add(
    'robots',
    blocked.length === 0,
    !robotsText
      ? 'There is no robots.txt, so AI crawlers are free to read your site.'
      : blocked.length
        ? `Your robots.txt blocks ${list(blocked)}.`
        : 'Your robots.txt lets the main AI crawlers in.',
  );

  // 2 llms.txt
  const llmsOk = !!llms && llms.status < 400 && llms.text.trim().length > 20 && !looksHtml(llms.text);
  add('llms', llmsOk, llmsOk ? 'You have an llms.txt file.' : 'We could not find an llms.txt file.');

  // 3 sitemap
  const sitemapUrls = (sitemapText.match(/<loc>/gi) || []).length;
  add('sitemap', !!sitemapText, sitemapText ? `Your sitemap lists ${sitemapUrls} ${sitemapUrls === 1 ? 'address' : 'addresses'}.` : 'We could not find a sitemap.');

  // 4 content without JavaScript
  const words = visibleText(home.text).split(/\s+/).filter((w) => /\w/.test(w)).length;
  const h1Raw = tags(home.text, 'h1').some((t) => visibleText(t.inner).length > 2);
  add('nojs', words >= 150 && h1Raw, words >= 150 && h1Raw ? `Your homepage has about ${words} words in the raw HTML.` : `Your homepage has only about ${words} words before JavaScript runs.`);

  // 5 Organisation schema / 6 page schema
  const types = all.map((p) => ldTypes(p.text));
  const hasOrg = types.some((t) => t.some((x) => /^(Organization|Corporation|LocalBusiness|ProfessionalService|NGO|EducationalOrganization|OnlineBusiness)$/.test(x)));
  add('org', hasOrg, hasOrg ? 'We found Organisation schema.' : 'We could not find Organisation schema.');
  const pageTypes = [...new Set(types.flat().filter((x) => !/^(Organization|Corporation|WebSite|SearchAction|ImageObject|PostalAddress|ContactPoint|EntryPoint|Person|Place|ListItem|Thing|Country|Continent|City|State|AdministrativeArea|GeoCoordinates|GeoShape|Question|Answer)$/.test(x)))];
  add('schema', pageTypes.length > 0, pageTypes.length ? `Your pages use ${list(pageTypes.slice(0, 4))} schema.` : 'Your pages carry no page-level schema yet.');

  // 7 headings
  const h1s = tags(home.text, 'h1').length;
  const h2s = tags(home.text, 'h2').length;
  add('headings', h1s === 1 && h2s >= 2, `Your homepage has ${h1s} h1 ${h1s === 1 ? 'heading' : 'headings'} and ${h2s} h2s.`);

  // 8 titles and descriptions
  const metaOk = all.filter((p) => {
    const title = visibleText(tags(p.text, 'title')[0]?.inner || '');
    const desc = metaContent(p.text, 'description');
    return title.length >= 10 && title.length <= 75 && desc.length >= 50 && desc.length <= 180;
  }).length;
  add('meta', metaOk === all.length, `${metaOk} of the ${all.length} pages we read have a clear title and description.`);

  // 9 canonicals
  const canon = all.filter((p) => {
    const href = tags(p.text, 'link').find((l) => /\bcanonical\b/i.test(l.attrs.rel || ''))?.attrs.href;
    try {
      return !!href && new URL(href, p.url).hostname.replace(/^www\./, '') === host.replace(/^www\./, '');
    } catch {
      return false;
    }
  }).length;
  add('canonical', canon === all.length, `${canon} of the ${all.length} pages we read have a canonical link.`);

  // 10 questions and answers
  const questions = all.reduce((n, p) => n + [...tags(p.text, 'h2'), ...tags(p.text, 'h3'), ...tags(p.text, 'summary')].filter((t) => visibleText(t.inner).trim().endsWith('?')).length, 0);
  const faqSchema = types.flat().includes('FAQPage');
  const details = all.some((p) => /<details\b/i.test(p.text));
  add('faq', faqSchema || questions >= 3 || details, faqSchema ? 'You have FAQ schema.' : questions >= 3 || details ? 'Your pages answer questions directly.' : 'We found few questions answered on the pages we read.');

  // 11 freshness
  const newest = newestDate([
    ...[...sitemapText.matchAll(/<lastmod>([^<]+)<\/lastmod>/gi)].map((m) => m[1]),
    ...all.flatMap((p) => [...p.text.matchAll(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/g)].map((m) => m[1])),
    ...all.map((p) => metaContent(p.text, 'article:modified_time', 'property')),
    ...all.map((p) => p.headers.get('last-modified') || ''),
  ]);
  const days = newest ? Math.floor((Date.now() - newest) / 86400000) : Infinity;
  add('fresh', days <= DAYS_FRESH, Number.isFinite(days) ? `Your most recent update we could see is ${days <= 1 ? 'from the last day' : `${days} days old`}.` : 'We could not find a recent update date.');

  // 12 speed and weight
  const kb = Math.round(home.bytes / 1024);
  const seconds = (home.ms / 1000).toFixed(1);
  add('speed', home.ms < 2000 && home.bytes < 900_000, `Your homepage HTML loaded in ${seconds} seconds and weighs ${kb} KB.`);

  // 13 meaningful HTML
  const sem = all.filter((p) => /<main\b/i.test(p.text) && /<nav\b/i.test(p.text)).length;
  add('semantic', sem === all.length, sem === all.length ? 'Your pages use main and nav landmarks.' : `${sem} of the ${all.length} pages we read use main and nav landmarks.`);

  // 14 forms
  const forms = all.flatMap((p) => formsIn(p.text));
  const labelled = forms.filter((f) => f.fields > 0 && f.labelled / f.fields >= 0.8).length;
  add('forms', forms.length > 0 && labelled > 0, forms.length === 0 ? 'We found no form on the pages we read.' : `${labelled} of ${forms.length} forms have a label on every field.`);

  // 15 pricing and contact details
  const contact = all.some((p) => /href=["']?(mailto:|tel:)/i.test(p.text)) || pages.some((p) => /contact|get-in-touch|demo|book/i.test(new URL(p.url).pathname));
  const pricingPage = pages.find((p) => /pric|plans/i.test(new URL(p.url).pathname));
  // prices in the HTML, or an honest "talk to us" (enterprise pricing is a fine answer)
  const pricingText = pricingPage ? visibleText(pricingPage.text) : '';
  const priced = !pricingPage || /[£$€]\s?\d|\d\s?(gbp|usd|eur)\b|free\b|get a quote|request a quote|contact sales|talk to (us|sales)|book a (call|demo)/i.test(pricingText);
  add(
    'facts',
    contact && priced,
    !contact
      ? 'We could not find contact details in the HTML.'
      : !priced
        ? 'Your pricing page shows no prices in the HTML.'
        : pricingPage
          ? 'Your prices and contact details are in the HTML.'
          : 'Your contact details are in the HTML.',
  );

  // 16 link text
  const anchors = all.flatMap((p) => tags(p.text, 'a').filter((a) => a.attrs.href && !a.attrs.href.startsWith('#')));
  const generic = anchors.filter((a) => {
    const text = (visibleText(a.inner) || a.attrs['aria-label'] || a.attrs.title || '').trim().toLowerCase();
    return !text || /^(click here|here|read more|learn more|more|find out more|see more|discover more|view more|this|link)\.?$/.test(text);
  }).length;
  const share = anchors.length ? generic / anchors.length : 0;
  add('links', share <= 0.1, generic ? `${generic} of ${anchors.length} links have vague or empty text.` : 'Your links say where they lead.');

  // 17 bonus: MCP or .well-known
  const wk = [wkMcp, wkPlugin].some((r) => !!r && r.status < 400 && /^\s*\{/.test(r.text));
  const mcpLink = /mcp/i.test(llms?.text || '') || all.some((p) => /rel=["']?mcp/i.test(p.text));
  add('mcp', wk || mcpLink, wk || mcpLink ? 'You publish a way for AI agents to connect.' : 'A bonus for later: an MCP server or .well-known file lets agents connect directly.', true);

  // scores: the bonus adds a point and never costs one
  const site = checks.filter((c) => c.group === 'site');
  const agent = checks.filter((c) => c.group === 'agent');
  const core = checks.filter((c) => !c.bonus);
  const score = {
    site: { got: site.filter((c) => c.pass).length, of: site.length },
    agent: { got: agent.filter((c) => c.pass).length, of: agent.length },
  };
  const ctx = { blocked, seconds, kb, slow: home.ms >= 2000, generic };
  const top = PRIORITY.map((id) => checks.find((c) => c.id === id && !c.pass))
    .filter((c): c is Check => !!c)
    .slice(0, 3)
    .map((c) => fixFor(c, ctx));

  return {
    ok: true,
    site: origin,
    host,
    brand: brandOf(home.text, host),
    description: (metaContent(home.text, 'description') || metaContent(home.text, 'og:description', 'property')).slice(0, 300),
    checkedAt: new Date().toISOString(),
    pages: all.map((p) => p.url),
    score,
    summary: summaryFor(core.filter((c) => c.pass).length, core.length),
    top,
    checks,
  };
}

/* ---------- fetching (public addresses only) ---------- */

type Fetched = { url: string; status: number; headers: Headers; text: string; ms: number; bytes: number };

const publicHosts = new Map<string, boolean>();

async function isPublicHost(hostname: string): Promise<boolean> {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (publicHosts.has(h)) return publicHosts.get(h)!;
  let ok = false;
  if (!/^(localhost|.*\.(localhost|local|internal|lan|home|corp|test|invalid))$/.test(h)) {
    try {
      const addrs = isIP(h) ? [{ address: h }] : await lookup(h, { all: true });
      ok = addrs.length > 0 && addrs.every((a) => isPublicIp(a.address));
    } catch {
      ok = false;
    }
  }
  publicHosts.set(h, ok);
  if (publicHosts.size > 2000) publicHosts.clear();
  return ok;
}

function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19))
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return isPublicIp(v.slice(7));
  return !(v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('ff'));
}

async function get(url: string, o: { accept?: string; max?: number } = {}): Promise<Fetched | null> {
  let hopStart = Date.now();
  let current = url;
  try {
    for (let hop = 0; hop < 5; hop++) {
      const u = new URL(current);
      if (!/^https?:$/.test(u.protocol) || (u.port && !['80', '443'].includes(u.port))) return null;
      if (!(await isPublicHost(u.hostname))) return null;
      hopStart = Date.now();
      const res = await fetch(current, {
        redirect: 'manual',
        headers: { 'User-Agent': UA, Accept: o.accept ? `${o.accept},*/*;q=0.5` : '*/*' },
        signal: AbortSignal.timeout(FETCH_MS),
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location')!, current).toString();
        await res.body?.cancel().catch(() => undefined);
        continue;
      }
      const { text, bytes } = await readCapped(res, o.max ?? MAX_BYTES);
      // time for the final page only, so a redirect from acme.com to www doesn't count against them
      return { url: current, status: res.status, headers: res.headers, text, ms: Date.now() - hopStart, bytes };
    }
  } catch {
    return null;
  }
  return null;
}

async function readCapped(res: Response, max: number) {
  if (!res.body) return { text: '', bytes: 0 };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > max) {
      await reader.cancel().catch(() => undefined);
      break;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(Math.min(bytes, max));
  let at = 0;
  for (const c of chunks) {
    all.set(c.subarray(0, all.length - at), at);
    at += c.byteLength;
    if (at >= all.length) break;
  }
  return { text: new TextDecoder().decode(all), bytes };
}

/* ---------- HTML and text helpers (no DOM in a function, so small and forgiving) ---------- */

export function normaliseHost(input: string): string {
  let s = input.trim().toLowerCase();
  if (!s || s.length > 253) return '';
  if (!/^https?:\/\//.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    const h = u.hostname.replace(/\.$/, '');
    if (isIP(h) || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) || !/\.[a-z]{2,}$/.test(h)) return '';
    return h;
  } catch {
    return '';
  }
}

type Tag = { attrs: Record<string, string>; inner: string };

export function tags(html: string, name: string): Tag[] {
  const out: Tag[] = [];
  const selfClosing = ['meta', 'link', 'input'].includes(name);
  const re = selfClosing ? new RegExp(`<${name}\\b([^>]*)>`, 'gi') : new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)</${name}>`, 'gi');
  for (const m of html.matchAll(re)) out.push({ attrs: attrs(m[1]), inner: selfClosing ? '' : m[2] });
  return out;
}

function attrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of s.matchAll(/([\w:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) out[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? m[5] ?? '');
  return out;
}

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function visibleText(html: string): string {
  return decode(
    html
      .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function looksHtml(s: string) {
  return /^\s*(<!doctype html|<html|<head|<body)/i.test(s);
}

function metaContent(html: string, key: string, attr: 'name' | 'property' = 'name'): string {
  const m = tags(html, 'meta').find((t) => (t.attrs[attr] || t.attrs.name || t.attrs.property || '').toLowerCase() === key);
  return (m?.attrs.content || '').trim();
}

export function ldTypes(html: string): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    const t = o['@type'];
    if (typeof t === 'string') out.push(t);
    if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.push(x));
    Object.values(o).forEach((x) => typeof x === 'object' && walk(x));
  };
  for (const t of tags(html, 'script')) {
    if (!/ld\+json/i.test(t.attrs.type || '')) continue;
    try {
      walk(JSON.parse(t.inner.trim()));
    } catch {
      // a broken block counts for nothing
    }
  }
  return out;
}

/** True when robots.txt disallows the whole site for this bot (its own group, or * when it has none). */
export function robotsBlocks(robots: string, bot: string): boolean {
  if (!robots) return false;
  const groups: { agents: string[]; rules: [string, string][] }[] = [];
  let cur: { agents: string[]; rules: [string, string][] } | null = null;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') {
      if (!cur || cur.rules.length) groups.push((cur = { agents: [], rules: [] }));
      cur.agents.push(val.toLowerCase());
    } else if ((key === 'allow' || key === 'disallow') && cur) {
      cur.rules.push([key, val]);
    }
  }
  const mine = groups.filter((g) => g.agents.includes(bot.toLowerCase()));
  const use = mine.length ? mine : groups.filter((g) => g.agents.includes('*'));
  const rules = use.flatMap((g) => g.rules);
  const blocksRoot = rules.some(([k, v]) => k === 'disallow' && (v === '/' || v === '/*'));
  const allowsRoot = rules.some(([k, v]) => k === 'allow' && (v === '/' || v === '/*' || v === '/$'));
  return blocksRoot && !allowsRoot;
}

function keyPages(html: string, base: URL): string[] {
  const kinds: [RegExp, string][] = [
    [/\/(pricing|plans|prices)(\/|$)/i, 'pricing'],
    [/\/(contact|get-in-touch|demo|book-a-demo|talk-to-us|book)(\/|-|$)/i, 'contact'],
    [/\/(about|company|team|our-story)(\/|$)/i, 'about'],
    [/\/(product|platform|features|solutions|services|how-it-works)(\/|$)/i, 'product'],
  ];
  const found = new Map<string, string>();
  for (const a of tags(html, 'a')) {
    let u: URL;
    try {
      u = new URL(a.attrs.href || '', base);
    } catch {
      continue;
    }
    if (u.hostname !== base.hostname || u.pathname === '/' || u.pathname === base.pathname) continue;
    for (const [re, kind] of kinds) if (!found.has(kind) && re.test(u.pathname)) found.set(kind, `${u.origin}${u.pathname}`);
  }
  return [...found.values()].slice(0, 4);
}

function formsIn(html: string) {
  return tags(html, 'form').map((f) => {
    const inputs = [...f.inner.matchAll(/<(input|textarea|select)\b([^>]*)>/gi)]
      .map((m) => attrs(m[2]))
      .filter((a) => !/^(hidden|submit|button|image|reset)$/i.test(a.type || ''));
    const labelFor = new Set(tags(f.inner, 'label').map((l) => l.attrs.for).filter(Boolean));
    const wrapped = tags(f.inner, 'label').filter((l) => /<(input|textarea|select)\b/i.test(l.inner)).length;
    const named = inputs.filter((a) => (a.id && labelFor.has(a.id)) || a['aria-label'] || a['aria-labelledby'] || a.title).length;
    return { fields: inputs.length, labelled: Math.min(inputs.length, named + wrapped) };
  });
}

function newestDate(values: string[]): number {
  const now = Date.now() + 86400000;
  return values.reduce((best, v) => {
    const t = Date.parse((v || '').trim());
    return Number.isFinite(t) && t < now && t > best ? t : best;
  }, 0);
}

function brandOf(html: string, host: string): string {
  const site = metaContent(html, 'og:site_name', 'property');
  if (site) return site.slice(0, 60);
  const title = visibleText(tags(html, 'title')[0]?.inner || '');
  const label = host.replace(/^www\./, '').split('.')[0];
  const part = title.split(/\s[|–—\-:·]\s/).find((p) => p.toLowerCase().replace(/\s/g, '').includes(label.replace(/-/g, '')));
  return (part || label.charAt(0).toUpperCase() + label.slice(1)).trim().slice(0, 60);
}

function list(items: string[]) {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/* ---------- plumbing ---------- */

function tooMany(request: Request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > 8;
}

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  if (!ORIGIN_RE.test(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}
