/**
 * Project Calculator: question model + pricing. Pure, framework-free.
 *
 * Priced from a price book anchored on the packages (agreed with Ben, 28 Oct
 * 2026): the Seed Website is the base, every scope item adds a fixed amount,
 * and one band of 7% either side is applied once at the end, rounded to £500.
 * Web apps and very large sites go straight to a call. Retainers are the three
 * tiers: Care, Growth and Compound.
 *
 * Output: an estimate, every line that makes it up, and the next step (a call
 * or a brief) with a package pointer where one fits.
 *
 * Tune prices and copy here; the component renders generically.
 */

// --- Price book (ex VAT) -------------------------------------------------------

export const BASE = 15000;
export const BAND = 0.07;
export const CALL_THRESHOLD = 25000;
export const CLARITY_SPRINT = 3500;

const TEMPLATES: Record<string, number> = { 'up-to-8': 0, '9-15': 3000, '16-25': 6000 };
const CMS: Record<string, number> = { 'up-to-2': 0, '3-4': 1500, '5-plus': 2250 };
const DESIGN: Record<string, number> = { brand: 0, direction: 3500, system: 5000 };
const MIGRATION: Record<string, number> = { none: 0, 'up-to-50': 1000, '50-200': 2000, '200-plus': 4000 };
const INTEGRATION = 1000;
const EXTRAS: Record<string, number> = { motion: 2000, a11y: 1500, 'lang-2': 2500, 'lang-3': 5000 };

export const RETAINERS: Record<string, { monthly: number; label: string; body: string }> = {
  care: {
    monthly: 1500,
    label: 'Care',
    body: 'Monitoring, fixes and suggested improvements every month.',
  },
  growth: {
    monthly: 3000,
    label: 'Growth',
    body: 'A CRO or AEO programme alongside ongoing development, planned month by month.',
  },
  compound: {
    monthly: 7000,
    label: 'Compound',
    body: "CRO and AEO together every month, with a report on what changed and what's next.",
  },
};

// --- Question model ----------------------------------------------------------

export type Option = { id: string; label: string; hint?: string };

export type Question = {
  id: string;
  type: 'single' | 'multi';
  prompt: string;
  helper?: string;
  options: Option[];
  /** Multi-selects may be left empty. */
  optional?: boolean;
  /** Only ask this when the predicate passes. */
  visibleWhen?: (a: Answers) => boolean;
};

export type Answers = Record<string, string | string[]>;

const isSite = (a: Answers) => a.type === 'new-site' || a.type === 'rebuild';
const isRetainer = (a: Answers) => a.type === 'retainer';

export const QUESTIONS: Question[] = [
  {
    id: 'type',
    type: 'single',
    prompt: 'What are you planning?',
    helper: "We'll shape the next few questions around your answer.",
    options: [
      { id: 'new-site', label: 'A new marketing website', hint: 'For a launch, a raise or a new direction' },
      { id: 'rebuild', label: 'A rebuild of our current site', hint: 'Your current site, rebuilt' },
      { id: 'web-app', label: 'A web app or product', hint: "We'll talk this one through with you on a call" },
      { id: 'retainer', label: 'Ongoing support and growth', hint: 'A monthly retainer once the site is live' },
    ],
  },
  // --- Website ---------------------------------------------------------------
  {
    id: 'templates',
    type: 'single',
    prompt: 'How many different page layouts will you need?',
    helper: 'Count each layout once. A blog or a set of case studies is one template, however many posts it holds.',
    visibleWhen: isSite,
    options: [
      { id: 'up-to-8', label: 'Up to 8', hint: 'Home, product, pricing, about and a few more' },
      { id: '9-15', label: '9 to 15', hint: 'A fuller site with several product or solution pages' },
      { id: '16-25', label: '16 to 25', hint: 'A large site for several audiences or products' },
      { id: '25-plus', label: 'More than 25', hint: "We'll scope a site this size with you on a call" },
    ],
  },
  {
    id: 'cms',
    type: 'single',
    prompt: 'How many kinds of content will your team publish?',
    helper: 'Blog posts, case studies, careers and resources each count as one.',
    visibleWhen: isSite,
    options: [
      { id: 'up-to-2', label: 'One or two', hint: 'Included in the base' },
      { id: '3-4', label: 'Three or four' },
      { id: '5-plus', label: 'Five or more' },
    ],
  },
  {
    id: 'design',
    type: 'single',
    prompt: 'Where are you with design?',
    visibleWhen: isSite,
    options: [
      { id: 'brand', label: 'We have a brand you can apply', hint: 'Logo, colours and type are settled' },
      { id: 'direction', label: "We'd like a fresh design direction", hint: 'A new look, designed around your brand' },
      { id: 'system', label: 'We need a full design system', hint: 'A component library your team can build with' },
    ],
  },
  {
    id: 'platform',
    type: 'single',
    prompt: 'What is your site built on today?',
    helper: 'This helps us plan the move.',
    visibleWhen: isSite,
    options: [
      { id: 'none', label: "We're starting fresh" },
      { id: 'webflow', label: 'Webflow' },
      { id: 'wordpress', label: 'WordPress' },
      { id: 'other', label: 'Something else' },
    ],
  },
  {
    id: 'migration',
    type: 'single',
    prompt: 'How much content are we bringing across?',
    helper: 'Pages, posts and case studies we move, tidy and redirect.',
    visibleWhen: (a) => isSite(a) && !!a.platform && a.platform !== 'none',
    options: [
      { id: 'none', label: "Very little, we'll start afresh" },
      { id: 'up-to-50', label: 'Up to 50 pages and posts' },
      { id: '50-200', label: '50 to 200' },
      { id: '200-plus', label: 'More than 200' },
    ],
  },
  {
    id: 'integrations',
    type: 'multi',
    prompt: 'Which tools should the site connect to?',
    helper: 'Pick any that apply. We set each one up, map it and test it.',
    optional: true,
    visibleWhen: isSite,
    options: [
      { id: 'crm', label: 'A CRM, such as HubSpot or Salesforce' },
      { id: 'analytics', label: 'Analytics and tag management, such as GA4' },
      { id: 'booking', label: 'Booking or scheduling, such as Cal.com' },
      { id: 'product', label: 'Sign-up or login for your product' },
      { id: 'other', label: 'Other marketing tools' },
    ],
  },
  {
    id: 'extras',
    type: 'multi',
    prompt: 'Is there anything else to plan for?',
    helper: 'Optional. Pick any that apply.',
    optional: true,
    visibleWhen: isSite,
    options: [
      { id: 'motion', label: 'Rich motion and interaction' },
      { id: 'a11y', label: 'An accessibility audit to WCAG 2.2 AA' },
      { id: 'lang-2', label: 'A second language' },
      { id: 'lang-3', label: 'Three or more languages' },
    ],
  },
  {
    id: 'brief',
    type: 'single',
    prompt: 'How settled is the brief?',
    helper: 'What the site needs to say, who it is for and what it should help people do.',
    visibleWhen: isSite,
    options: [
      { id: 'agreed', label: 'Agreed across the team' },
      { id: 'mostly', label: 'Mostly there, with a few open questions' },
      { id: 'open', label: "Still open, and we'd value some help" },
    ],
  },
  {
    id: 'timing',
    type: 'single',
    prompt: 'When would you like to launch?',
    helper: "This helps us plan the team. A faster launch can change the price, and we'll always talk it through with you first.",
    visibleWhen: isSite,
    options: [
      { id: 'flexible', label: "Whenever it's ready" },
      { id: 'quarter', label: 'In the next two to three months' },
      { id: 'fast', label: 'In under six weeks', hint: "We'll tell you what's realistic, and what it means for the price" },
    ],
  },
  // --- Retainer --------------------------------------------------------------
  {
    id: 'tier',
    type: 'single',
    prompt: 'Which kind of support sounds right?',
    visibleWhen: isRetainer,
    options: Object.entries(RETAINERS).map(([id, r]) => ({
      id,
      label: `${r.label}, ${fmtGBP(r.monthly)} a month`,
      hint: r.body,
    })),
  },
];

/** The questions to ask for a given set of answers (branching). */
export function visibleQuestions(a: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.visibleWhen || q.visibleWhen(a));
}

/** True once every visible question has an answer (optional multis may be empty). */
export function isComplete(a: Answers): boolean {
  return visibleQuestions(a).every((q) => {
    const v = a[q.id];
    if (q.type === 'multi') return q.optional ? true : Array.isArray(v) && v.length > 0;
    return typeof v === 'string' && v.length > 0;
  });
}

// --- Estimate ----------------------------------------------------------------

export type Line = {
  id: string;
  /** What the line is, in the user's words. */
  label: string;
  /** What they chose. */
  choice: string;
  amount: number;
  /** One helpful sentence on what it covers. */
  note: string;
};

export type Estimate =
  | { kind: 'range'; low: number; high: number; total: number; lines: Line[]; sprint: number; note: string }
  | { kind: 'recurring'; tier: string; monthly: number; label: string; note: string }
  | { kind: 'call'; reason: 'web-app' | 'large'; from?: number; note: string }
  | null;

export function roundTo(n: number, step = 500): number {
  return Math.round(n / step) * step;
}

function labelOf(qid: string, id: string | undefined): string {
  const q = QUESTIONS.find((x) => x.id === qid);
  return q?.options.find((o) => o.id === id)?.label || 'Not set';
}

/** Every priced line for a site, base first. */
export function siteLines(a: Answers): Line[] {
  const lines: Line[] = [
    {
      id: 'base',
      label: 'Seed Website base',
      choice: 'Up to 8 templates, two content types, your brand applied',
      amount: BASE,
      note: 'Design, build, CMS and launch in about six weeks, on a site your team can run.',
    },
  ];
  const add = (id: string, label: string, choice: string, amount: number, note: string) => {
    if (amount > 0) lines.push({ id, label, choice, amount, note });
  };
  const t = a.templates as string;
  add('templates', 'Page templates', labelOf('templates', t), TEMPLATES[t] ?? 0, 'Each layout is designed, built and tested on every screen size.');
  const c = a.cms as string;
  add('cms', 'Content types', labelOf('cms', c), CMS[c] ?? 0, 'Each type of content gets its own template, set up so your team can publish it.');
  const d = a.design as string;
  add(
    'design',
    'Design direction',
    labelOf('design', d),
    DESIGN[d] ?? 0,
    d === 'system'
      ? 'A design system and component library, so new pages are quick to build and always on brand.'
      : 'A new look, designed around your brand and your buyers.',
  );
  const m = a.platform && a.platform !== 'none' ? (a.migration as string) : 'none';
  add('migration', 'Content migration', labelOf('migration', m), MIGRATION[m] ?? 0, 'Moved, tidied and redirected, so you keep your search rankings.');
  for (const id of (a.integrations as string[]) || []) {
    add(`integration-${id}`, 'Integration', labelOf('integrations', id), INTEGRATION, 'Set up and tested, so leads and data go straight into the tools your team uses.');
  }
  const extras = (a.extras as string[]) || [];
  for (const id of extras) {
    if (id === 'lang-2' && extras.includes('lang-3')) continue;
    const notes: Record<string, string> = {
      motion: 'Animation that helps explain the product, without slowing the site down.',
      a11y: 'An audit and the fixes it finds, so the site works for everyone who visits.',
      'lang-2': 'Localised pages, navigation and search settings for a second market.',
      'lang-3': 'Localised pages, navigation and search settings for each market you serve.',
    };
    const labels: Record<string, string> = { motion: 'Motion', a11y: 'Accessibility', 'lang-2': 'Languages', 'lang-3': 'Languages' };
    add(`extra-${id}`, labels[id] || 'Extra', labelOf('extras', id), EXTRAS[id] ?? 0, notes[id] || '');
  }
  return lines;
}

/** The band, applied once. Never below the Seed Website price; the bare Seed scope is its fixed price. */
function range(lines: Line[]) {
  const total = lines.reduce((s, l) => s + l.amount, 0);
  if (total <= BASE) return { total, low: BASE, high: BASE };
  return { total, low: Math.max(BASE, roundTo(total * (1 - BAND))), high: roundTo(total * (1 + BAND)) };
}

export function computeEstimate(a: Answers): Estimate {
  if (!a.type) return null;
  if (a.type === 'web-app') {
    return {
      kind: 'call',
      reason: 'web-app',
      note: "It's hard to price a product from a few questions, so we'd rather hear about yours first. Thirty minutes is usually enough to agree a scope and a rough range.",
    };
  }
  if (isRetainer(a)) {
    const tier = RETAINERS[(a.tier as string) || ''];
    if (!tier) return null;
    return {
      kind: 'recurring',
      tier: a.tier as string,
      monthly: tier.monthly,
      label: tier.label,
      note: 'A monthly retainer with a three-month first term. Every retainer starts with a free audit of your site.',
    };
  }
  if (!isComplete(a)) return null;
  if (a.templates === '25-plus') {
    const { low } = range(siteLines({ ...a, templates: '16-25' }));
    return {
      kind: 'call',
      reason: 'large',
      from: low,
      note: "For a site this size, we'd want to look at the content and who it's for before we quote. We'll scope it with you on a call, then send a fixed proposal.",
    };
  }
  const lines = siteLines(a);
  const { total, low, high } = range(lines);
  const note =
    a.timing === 'fast'
      ? "An estimate for the site as you described it, before VAT. Under six weeks is possible for smaller sites, though a faster launch can change the price, so we'll talk it through with you."
      : 'An estimate for the site as you described it, before VAT. Your final price comes in a fixed proposal, once we have agreed the scope together.';
  return { kind: 'range', low, high, total, lines, sprint: a.brief === 'open' ? CLARITY_SPRINT : 0, note };
}

// --- Next step ---------------------------------------------------------------

export type NextStep = {
  kind: 'call' | 'brief';
  title: string;
  body: string;
  href: string;
  label: string;
  /** A package that fits this scope, if one does. */
  package?: { name: string; price: string; href: string; body: string };
};

const SEED = {
  name: 'Seed Website',
  price: '£15,000, fixed',
  href: '/packages/seed-website',
  body: 'Up to eight page templates, a CMS your team owns and launch in six weeks, at a fixed price.',
};
const SPRINT = {
  name: 'Clarity Sprint',
  price: '£3,500',
  href: '/packages/clarity-sprint',
  body: 'Two weeks to agree the brief with your team, before the build starts.',
};
const COMPOUND = {
  name: 'Compound',
  price: '£7,000 a month',
  href: '/packages/compound',
  body: "CRO and AEO together every month, with a report on what changed and what's next.",
};

export function computeNextStep(
  a: Answers,
  est: Estimate,
  links: { call: string; brief: string; compoundCall: string },
): NextStep | null {
  if (!est) return null;

  if (est.kind === 'recurring') {
    const compound = est.tier === 'compound';
    return {
      kind: 'call',
      title: 'Book a call',
      body: 'Every retainer starts with a free audit of your site. A short call is the best place to start.',
      href: compound ? links.compoundCall : links.call,
      label: compound ? 'Book a Compound call' : 'Book an intro call',
      package: compound ? COMPOUND : undefined,
    };
  }

  if (est.kind === 'call') {
    return {
      kind: 'call',
      title: "Let's talk it through",
      body: est.note,
      href: links.call,
      label: 'Book an intro call',
    };
  }

  const seedFit =
    a.templates === 'up-to-8' &&
    a.design === 'brand' &&
    !((a.extras as string[]) || []).some((x) => x.startsWith('lang'));
  const sprintFit = a.brief === 'open' || a.brief === 'mostly';
  const pkg = sprintFit ? SPRINT : seedFit ? SEED : undefined;

  if (est.total >= CALL_THRESHOLD) {
    return {
      kind: 'call',
      title: 'Book a 30-minute call',
      body: "At this size, a short conversation is the quickest way to a fixed proposal. We'll go through the scope together, and you'll usually have the proposal within a few days.",
      href: links.call,
      label: 'Book an intro call',
      package: pkg,
    };
  }
  return {
    kind: 'brief',
    title: 'Send us a brief',
    body: "A site this size we can usually scope from a written brief. Tell us what it needs to do, and we'll come back to you within a working day.",
    href: links.brief,
    label: 'Send a brief',
    package: pkg,
  };
}

// --- Share link ----------------------------------------------------------------

function toBase64Url(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeAnswers(a: Answers): string {
  return toBase64Url(JSON.stringify(a));
}

/** Reverse of encodeAnswers; null unless it decodes to a complete, valid answer set. */
export function decodeAnswers(data: string): Answers | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/')))));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const out: Answers = {};
    for (const q of QUESTIONS) {
      const ids = new Set(q.options.map((o) => o.id));
      const v = parsed[q.id];
      if (q.type === 'single' && typeof v === 'string' && ids.has(v)) out[q.id] = v;
      if (q.type === 'multi' && Array.isArray(v)) out[q.id] = v.filter((x) => typeof x === 'string' && ids.has(x));
    }
    return out.type && isComplete(out) ? out : null;
  } catch {
    return null;
  }
}

/** `<base>?estimate=<answers>&ref=<lead id>`; ref ties a reopen back to the lead. */
export function shareUrl(base: string, a: Answers, ref?: string): string {
  const q = new URLSearchParams({ estimate: encodeAnswers(a) });
  if (ref) q.set('ref', ref);
  return `${base}?${q.toString()}`;
}

// --- Formatting + lead notes -------------------------------------------------

// a declaration, so QUESTIONS can use it at module load
export function fmtGBP(n: number): string {
  return '£' + Math.round(n).toLocaleString('en-GB');
}

/** "£26,500 to £30,500", or a single figure when the range collapses. */
export function fmtRange(low: number, high: number): string {
  return low === high ? fmtGBP(low) : `${fmtGBP(low)} to ${fmtGBP(high)}`;
}

/** Readable question/answer pairs for the lead notes (visible questions only). */
export function describeAnswers(a: Answers): { question: string; answer: string }[] {
  return visibleQuestions(a).map((q) => {
    const v = a[q.id];
    const picks = Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
    const labels = picks.map((id) => q.options.find((o) => o.id === id)?.label).filter(Boolean);
    return { question: q.prompt, answer: labels.join('; ') || (q.optional ? 'None' : '') };
  });
}
