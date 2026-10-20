/**
 * Project Calculator: question model + pricing. Pure, framework-free.
 *
 * Ported from the tools.shrink.studio calculator (shrink-tools
 * src/lib/calculator/model.ts, retired at launch). Plain-language questions map
 * to effort in role-days, priced off the Shrink rate card the internal scoping
 * tool uses (shrink-tools src/lib/estimator-data/config.json). Floors follow
 * the published Pricing page: Development from £15,000, Optimisation from
 * £5,000 a month, Compound £10,000 a month.
 *
 * Output: a low to high range, what moved the figure (pages, integrations,
 * timing, plus the rest), where the money goes, and the next step (a call or a
 * brief) with a package pointer where one fits.
 *
 * Tune questions and effort weights here; the component renders generically.
 */

// --- Rate card ---------------------------------------------------------------

const OVERHEAD_PER_DAY = 107.6;

const ROLES: Record<string, { baseCostDay: number; markupPct: number }> = {
  founder: { baseCostDay: 600, markupPct: 0.4 },
  'senior-dev': { baseCostDay: 560, markupPct: 0.2 },
  'mid-dev': { baseCostDay: 400, markupPct: 0.3 },
  'senior-designer': { baseCostDay: 500, markupPct: 0.3 },
  'mid-designer': { baseCostDay: 350, markupPct: 0.3 },
  pm: { baseCostDay: 250, markupPct: 0.4 },
};

/** clientDayRate = (baseCostDay + overheadPerDay) × (1 + markupPct) */
export function dayRate(roleId: string): number {
  const r = ROLES[roleId];
  if (!r) return 0;
  const total = r.baseCostDay + OVERHEAD_PER_DAY;
  return total + total * r.markupPct;
}

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

const isSite = (a: Answers) => a.type === 'marketing-site' || a.type === 'redesign';
const isApp = (a: Answers) => a.type === 'web-app';
const isRetainer = (a: Answers) => a.type === 'optimisation';
const isProject = (a: Answers) => isSite(a) || isApp(a);

export const QUESTIONS: Question[] = [
  {
    id: 'type',
    type: 'single',
    prompt: 'What are you looking to build?',
    helper: "We'll tailor the questions from here.",
    options: [
      { id: 'marketing-site', label: 'A new marketing website', hint: 'Brochure or product site' },
      { id: 'redesign', label: 'A redesign of our existing site', hint: 'Rebuild, same content shape' },
      { id: 'web-app', label: 'A web app or product', hint: 'Logins, data, custom logic' },
      { id: 'optimisation', label: 'Ongoing growth and optimisation', hint: 'A monthly retainer' },
    ],
  },
  // --- Website branch --------------------------------------------------------
  {
    id: 'pages',
    type: 'single',
    prompt: 'Roughly how big is the site?',
    helper: 'A rough count of unique page designs, so a blog counts once.',
    visibleWhen: isSite,
    options: [
      { id: 'small', label: '1 to 5 pages', hint: 'Landing or compact site' },
      { id: 'medium', label: '6 to 12 pages', hint: 'Typical company site' },
      { id: 'large', label: '13 to 25 pages', hint: 'Content-rich' },
      { id: 'xl', label: '25 pages or more', hint: 'Large or multi-section' },
    ],
  },
  {
    id: 'design',
    type: 'single',
    prompt: 'How much design do you need?',
    visibleWhen: isSite,
    options: [
      { id: 'full', label: 'Design it from scratch', hint: 'New look, built around your brand' },
      { id: 'partial', label: 'We have a brand, apply it', hint: 'Style guide exists, no UI yet' },
      { id: 'none', label: "We'll provide finished designs", hint: 'Build only' },
    ],
  },
  {
    id: 'cms',
    type: 'single',
    prompt: 'Will it have content you update regularly?',
    helper: 'Blog, case studies, careers, resources: anything CMS-driven.',
    visibleWhen: isSite,
    options: [
      { id: 'yes', label: "Yes, we'll publish often", hint: 'CMS collections and templates' },
      { id: 'no', label: 'Mostly static', hint: 'Fixed pages' },
    ],
  },
  // --- Web app branch --------------------------------------------------------
  {
    id: 'appSize',
    type: 'single',
    prompt: 'How big is the product?',
    helper: 'Roughly how much there is to design and build.',
    visibleWhen: isApp,
    options: [
      { id: 'mvp', label: 'An MVP or first version', hint: 'Prove the core idea' },
      { id: 'standard', label: 'A full v1 product', hint: 'Several connected features' },
      { id: 'large', label: 'A large platform', hint: 'Many roles and workflows' },
    ],
  },
  {
    id: 'appModules',
    type: 'multi',
    prompt: 'Which of these does it need?',
    helper: 'Pick all that apply.',
    optional: true,
    visibleWhen: isApp,
    options: [
      { id: 'auth', label: 'User accounts and logins' },
      { id: 'payments', label: 'Payments or billing' },
      { id: 'dashboard', label: 'Dashboards and data views' },
      { id: 'integrations', label: 'Third-party integrations' },
      { id: 'admin', label: 'Admin or back-office tools' },
    ],
  },
  // --- Optimisation branch ---------------------------------------------------
  {
    id: 'optIntensity',
    type: 'single',
    prompt: 'How hands-on should we be?',
    visibleWhen: isRetainer,
    options: [
      { id: 'standard', label: 'A focused programme', hint: 'CRO, AEO and ongoing development, one stream at a time' },
      { id: 'compound', label: 'Compound', hint: 'CRO and AEO every month, on one cycle' },
    ],
  },
  // --- Shared extras (websites + apps) ---------------------------------------
  {
    id: 'extras',
    type: 'multi',
    prompt: 'Anything else to factor in?',
    helper: 'Optional. Pick any that apply.',
    optional: true,
    visibleWhen: isProject,
    options: [
      { id: 'interactions', label: 'Rich animation and interaction' },
      { id: 'integrations', label: 'CRM, forms and marketing integrations' },
      { id: 'migration', label: 'Migrate existing content' },
      { id: 'copywriting', label: 'Copywriting help' },
      { id: 'a11y', label: 'Accessibility audit (WCAG)' },
    ],
  },
  {
    id: 'discovery',
    type: 'single',
    prompt: 'Do you want a discovery phase first?',
    helper: 'Where we pin down positioning, structure and goals before building.',
    visibleWhen: isProject,
    options: [
      { id: 'none', label: 'We know what we want', hint: 'Straight to the build' },
      { id: 'focused', label: 'A focused discovery', hint: 'Two weeks, one brief: the Clarity Sprint' },
      { id: 'deep', label: 'Full discovery and research', hint: 'Research-led' },
    ],
  },
  {
    id: 'timing',
    type: 'single',
    prompt: 'When does it need to be live?',
    helper: 'A Development build takes 6 to 10 weeks once the scope is fixed.',
    visibleWhen: isProject,
    options: [
      { id: 'flexible', label: 'No fixed date', hint: 'We plan it into the next open slot' },
      { id: 'quarter', label: 'In the next 2 to 3 months', hint: 'The usual run' },
      { id: 'fast', label: 'In under 6 weeks', hint: 'A compressed schedule, priced for it' },
    ],
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

// --- Effort -> cost ----------------------------------------------------------

export type Line = { area: string; min: number; max: number };

const PAGE_FACTOR: Record<string, number> = { small: 1, medium: 1.8, large: 3, xl: 4.5 };
const APP_FACTOR: Record<string, number> = { mvp: 1, standard: 2.1, large: 3.4 };
const TIMING_FACTOR: Record<string, number> = { flexible: 1, quarter: 1, fast: 1.15 };

export const SITE_FLOOR = 15000;
export const APP_FLOOR = 30000;
export const RETAINERS: Record<string, { monthly: number; label: string }> = {
  standard: { monthly: 5000, label: 'Optimisation retainer' },
  compound: { monthly: 10000, label: 'Compound' },
};

type Alloc = { roleId: string; min: number; max: number };

function pushLine(acc: Line[], area: string, alloc: Alloc[]) {
  const min = alloc.reduce((s, x) => s + dayRate(x.roleId) * x.min, 0);
  const max = alloc.reduce((s, x) => s + dayRate(x.roleId) * x.max, 0);
  const existing = acc.find((l) => l.area === area);
  if (existing) {
    existing.min += min;
    existing.max += max;
  } else {
    acc.push({ area, min, max });
  }
}

export function roundTo(n: number, step = 500): number {
  return Math.round(n / step) * step;
}

export type Estimate =
  | { kind: 'range'; low: number; high: number; lines: Line[]; note?: string }
  | { kind: 'recurring'; monthly: number; label: string; note: string }
  | null;

function rawRange(a: Answers): { low: number; high: number; lines: Line[]; note?: string } | null {
  const type = a.type as string | undefined;
  if (!type || type === 'optimisation') return null;

  const lines: Line[] = [];
  const timing = TIMING_FACTOR[(a.timing as string) || 'flexible'] ?? 1;

  if (type === 'web-app') {
    const size = a.appSize as string | undefined;
    if (!size) return null;
    const f = APP_FACTOR[size] ?? 2.1;
    const modules = (a.appModules as string[]) || [];

    pushLine(lines, 'Discovery and UX', [
      { roleId: 'founder', min: 2 * f, max: 3 * f },
      { roleId: 'senior-designer', min: 3 * f, max: 5 * f },
    ]);
    pushLine(lines, 'Product design', [
      { roleId: 'senior-designer', min: 5 * f, max: 9 * f },
      { roleId: 'mid-designer', min: 2 * f, max: 5 * f },
    ]);
    pushLine(lines, 'Front-end build', [
      { roleId: 'senior-dev', min: 6 * f, max: 12 * f },
      { roleId: 'mid-dev', min: 5 * f, max: 12 * f },
    ]);
    pushLine(lines, 'Backend and infrastructure', [{ roleId: 'senior-dev', min: 4 * f, max: 10 * f }]);
    if (modules.includes('auth')) pushLine(lines, 'Accounts and auth', [{ roleId: 'senior-dev', min: 3, max: 6 }]);
    if (modules.includes('payments')) pushLine(lines, 'Payments and billing', [{ roleId: 'senior-dev', min: 4, max: 8 }]);
    if (modules.includes('dashboard')) {
      pushLine(lines, 'Dashboards and data', [
        { roleId: 'senior-dev', min: 4, max: 9 },
        { roleId: 'mid-dev', min: 2, max: 5 },
      ]);
    }
    if (modules.includes('integrations')) pushLine(lines, 'Integrations', [{ roleId: 'senior-dev', min: 3, max: 8 }]);
    if (modules.includes('admin')) pushLine(lines, 'Admin tools', [{ roleId: 'mid-dev', min: 3, max: 7 }]);
    pushLine(lines, 'QA and project management', [
      { roleId: 'senior-dev', min: 3 * f, max: 5 * f },
      { roleId: 'pm', min: 5 * f, max: 9 * f },
      { roleId: 'founder', min: 2, max: 3 },
    ]);
    addDiscovery(lines, a);
    addExtras(lines, a);
    return finish(lines, APP_FLOOR, timing, "Products vary a lot, so treat this as a starting range. We'll firm it up on a call.");
  }

  const pages = a.pages as string | undefined;
  const design = a.design as string | undefined;
  const cms = a.cms as string | undefined;
  if (!pages || !design || !cms) return null;
  const pf = PAGE_FACTOR[pages] ?? 1.8;

  if (design === 'full') {
    pushLine(lines, 'Design', [
      { roleId: 'senior-designer', min: 3, max: 5 }, // design system
      { roleId: 'senior-designer', min: 2.5 * pf, max: 4.5 * pf }, // wireframes + UI
      { roleId: 'mid-designer', min: 1 * pf, max: 2 * pf },
      { roleId: 'senior-designer', min: 2, max: 4 }, // revisions
    ]);
  } else if (design === 'partial') {
    pushLine(lines, 'Design', [
      { roleId: 'senior-designer', min: 1.5 * pf, max: 2.5 * pf },
      { roleId: 'mid-designer', min: 1 * pf, max: 2 * pf },
    ]);
  }

  pushLine(lines, 'Build', [
    { roleId: 'senior-dev', min: 1, max: 2 }, // setup
    { roleId: 'senior-dev', min: 3 * pf, max: 5 * pf }, // front-end
    { roleId: 'mid-dev', min: 2 * pf, max: 4 * pf },
    { roleId: 'senior-dev', min: 1.5, max: 3 }, // responsive
  ]);

  if (cms === 'yes') pushLine(lines, 'CMS', [{ roleId: 'senior-dev', min: 2.5 + pf, max: 4 + 1.5 * pf }]);

  pushLine(lines, 'QA, launch and project management', [
    { roleId: 'senior-dev', min: 2, max: 3 },
    { roleId: 'pm', min: 3 + pf, max: 5 + 1.5 * pf },
    { roleId: 'founder', min: 1, max: 2 },
  ]);

  addDiscovery(lines, a);
  addExtras(lines, a);
  return finish(lines, SITE_FLOOR, timing);
}

function finish(lines: Line[], floor: number, timing: number, note?: string) {
  if (timing !== 1) {
    const base = lines.reduce((s, l) => ({ min: s.min + l.min, max: s.max + l.max }), { min: 0, max: 0 });
    lines.push({ area: 'Fast turnaround', min: base.min * (timing - 1), max: base.max * (timing - 1) });
  }
  const low = Math.max(roundTo(lines.reduce((s, l) => s + l.min, 0)), floor);
  const high = Math.max(roundTo(lines.reduce((s, l) => s + l.max, 0)), low);
  return {
    low,
    high,
    lines: lines.map((l) => ({ ...l, min: roundTo(l.min), max: roundTo(l.max) })),
    note,
  };
}

function addDiscovery(lines: Line[], a: Answers) {
  const d = a.discovery as string | undefined;
  if (d === 'focused') {
    pushLine(lines, 'Discovery', [
      { roleId: 'founder', min: 3, max: 4 },
      { roleId: 'senior-designer', min: 1.5, max: 2 },
      { roleId: 'pm', min: 1.5, max: 2 },
    ]);
  } else if (d === 'deep') {
    pushLine(lines, 'Discovery', [
      { roleId: 'founder', min: 8, max: 10 },
      { roleId: 'senior-designer', min: 6, max: 8 },
      { roleId: 'pm', min: 5, max: 6 },
    ]);
  }
}

function addExtras(lines: Line[], a: Answers) {
  const extras = (a.extras as string[]) || [];
  if (extras.includes('interactions')) pushLine(lines, 'Animation and interaction', [{ roleId: 'senior-dev', min: 3, max: 6 }]);
  if (extras.includes('integrations')) pushLine(lines, 'Integrations', [{ roleId: 'senior-dev', min: 2, max: 6 }]);
  if (extras.includes('migration')) {
    pushLine(lines, 'Content migration', [
      { roleId: 'pm', min: 1, max: 2 },
      { roleId: 'mid-dev', min: 1, max: 4 },
    ]);
  }
  if (extras.includes('copywriting')) {
    pushLine(lines, 'Copywriting', [
      { roleId: 'founder', min: 2, max: 3 },
      { roleId: 'pm', min: 1, max: 4 },
    ]);
  }
  if (extras.includes('a11y')) pushLine(lines, 'Accessibility audit', [{ roleId: 'senior-dev', min: 2, max: 3 }]);
}

export function computeEstimate(a: Answers): Estimate {
  if (a.type === 'optimisation') {
    const tier = RETAINERS[(a.optIntensity as string) || ''];
    if (!tier) return null;
    return {
      kind: 'recurring',
      monthly: tier.monthly,
      label: tier.label,
      note: 'A rolling monthly retainer with a three-month initial term. Every programme starts with a free audit.',
    };
  }
  const r = rawRange(a);
  return r ? { kind: 'range', ...r } : null;
}

// --- What moved the figure ---------------------------------------------------

export type Driver = {
  id: 'pages' | 'integrations' | 'timing' | 'design' | 'cms' | 'discovery' | 'extras' | 'size' | 'modules';
  label: string;
  /** What was chosen, in the user's words. */
  choice: string;
  /** Added to the low / high figure versus the lightest option. */
  low: number;
  high: number;
  /** One line on why it matters. */
  note: string;
};

function labelOf(qid: string, id: string | undefined): string {
  const q = QUESTIONS.find((x) => x.id === qid);
  return q?.options.find((o) => o.id === id)?.label || 'Not set';
}

function delta(a: Answers, patch: Answers): { low: number; high: number } {
  const here = rawRange(a);
  const there = rawRange({ ...a, ...patch });
  if (!here || !there) return { low: 0, high: 0 };
  return { low: Math.max(0, here.low - there.low), high: Math.max(0, here.high - there.high) };
}

/**
 * The three promised levers first (pages, integrations, timing), then the rest
 * of what the answers added. Each is the cost above the lightest option.
 */
export function computeDrivers(a: Answers): Driver[] {
  if (!a.type || a.type === 'optimisation') return [];
  const out: Driver[] = [];
  const extras = (a.extras as string[]) || [];
  const modules = (a.appModules as string[]) || [];

  if (isSite(a)) {
    const d = delta(a, { pages: 'small' });
    out.push({
      id: 'pages',
      label: 'Pages',
      choice: labelOf('pages', a.pages as string),
      ...d,
      note: a.pages === 'small'
        ? 'The smallest count. Every unique page design adds design, build and QA time.'
        : 'The biggest lever. Design, build and QA all scale with unique page designs.',
    });
  } else {
    const d = delta(a, { appSize: 'mvp' });
    out.push({
      id: 'size',
      label: 'Product size',
      choice: labelOf('appSize', a.appSize as string),
      ...d,
      note: 'Screens, flows and states scale every phase, from UX to QA.',
    });
  }

  {
    const hasIntegrations = extras.includes('integrations') || modules.includes('integrations');
    const patch: Answers = {
      extras: extras.filter((x) => x !== 'integrations'),
      appModules: modules.filter((x) => x !== 'integrations'),
    };
    const d = hasIntegrations ? delta(a, patch) : { low: 0, high: 0 };
    out.push({
      id: 'integrations',
      label: 'Integrations',
      choice: hasIntegrations ? 'CRM, forms and third-party tools' : 'None added',
      ...d,
      note: hasIntegrations
        ? 'Each system the site talks to needs mapping, testing and a fallback.'
        : 'Add CRM, forms or analytics tools and this line grows.',
    });
  }

  {
    const d = delta(a, { timing: 'flexible' });
    out.push({
      id: 'timing',
      label: 'Timing',
      choice: labelOf('timing', a.timing as string),
      ...d,
      note: a.timing === 'fast'
        ? 'Under six weeks means the team clears the deck, so it carries a premium.'
        : 'A standard schedule, so no premium. Under six weeks would add about 15%.',
    });
  }

  if (isSite(a)) {
    if (a.design && a.design !== 'none') {
      out.push({
        id: 'design',
        label: 'Design',
        choice: labelOf('design', a.design as string),
        ...delta(a, { design: 'none' }),
        note: a.design === 'full'
          ? 'A design system, wireframes, UI and revisions, built around your brand.'
          : 'Applying your existing brand to new page designs.',
      });
    }
    if (a.cms === 'yes') {
      out.push({
        id: 'cms',
        label: 'CMS',
        choice: labelOf('cms', a.cms as string),
        ...delta(a, { cms: 'no' }),
        note: 'Collections, templates and the editing experience your team will use.',
      });
    }
  } else if (modules.filter((m) => m !== 'integrations').length) {
    out.push({
      id: 'modules',
      label: 'Product modules',
      choice: modules
        .filter((m) => m !== 'integrations')
        .map((m) => labelOf('appModules', m))
        .join(', '),
      ...delta(a, { appModules: modules.filter((m) => m === 'integrations') }),
      note: 'Accounts, payments, dashboards and admin tools are each a build in their own right.',
    });
  }

  if (a.discovery && a.discovery !== 'none') {
    out.push({
      id: 'discovery',
      label: 'Discovery',
      choice: labelOf('discovery', a.discovery as string),
      ...delta(a, { discovery: 'none' }),
      note: 'Positioning, structure and goals agreed before anything is designed.',
    });
  }

  const otherExtras = extras.filter((x) => x !== 'integrations');
  if (otherExtras.length) {
    out.push({
      id: 'extras',
      label: 'Extras',
      choice: otherExtras.map((x) => labelOf('extras', x)).join(', '),
      ...delta(a, { extras: extras.filter((x) => x === 'integrations') }),
      note: 'Animation, migration, copy and audits, priced as their own lines.',
    });
  }

  return out;
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

export const CALL_THRESHOLD = 25000;

export function computeNextStep(
  a: Answers,
  est: Estimate,
  links: { call: string; brief: string; compoundCall: string },
): NextStep | null {
  if (!est) return null;

  if (est.kind === 'recurring') {
    const compound = a.optIntensity === 'compound';
    return {
      kind: 'call',
      title: 'Book a call',
      body: compound
        ? 'Compound starts with a free audit of your site, so the first month already has a plan.'
        : 'Every retainer starts with a free audit, so the first month already has a plan.',
      href: compound ? links.compoundCall : links.call,
      label: compound ? 'Book a Compound call' : 'Book an intro call',
      package: compound
        ? {
            name: 'Compound',
            price: '£10,000 a month',
            href: '/packages/compound',
            body: 'CRO and AEO every month, on one cycle, with a monthly report.',
          }
        : undefined,
    };
  }

  const site = isSite(a);
  const seedFit = site && (a.pages === 'small' || a.pages === 'medium') && a.design !== 'none';
  const sprintFit = site && a.discovery === 'focused';

  const pkg = seedFit
    ? {
        name: 'Seed Website',
        price: '£20,000, fixed',
        href: '/packages/seed-website',
        body: 'Up to eight pages, a CMS your team owns, live in six weeks. If the site fits in eight pages, this is the fixed-price route.',
      }
    : sprintFit
      ? {
          name: 'Clarity Sprint',
          price: '£3,500',
          href: '/packages/clarity-sprint',
          body: 'Two weeks, one brief your team can build from. The discovery you picked, as a fixed package.',
        }
      : undefined;

  const needsCall = !site || est.low >= CALL_THRESHOLD || a.discovery === 'deep';
  if (needsCall) {
    return {
      kind: 'call',
      title: 'Book a call',
      body: !site
        ? 'Products need a conversation before a number means much. Thirty minutes is enough to turn this into a proper scope.'
        : 'At this size the scope decides the price. A 30-minute call turns this range into a fixed proposal, usually within a few days.',
      href: links.call,
      label: 'Book an intro call',
      package: pkg,
    };
  }
  return {
    kind: 'brief',
    title: 'Send a brief',
    body: 'A site this size we can scope from a written brief. Tell us what it has to do and you will hear back within a working day.',
    href: links.brief,
    label: 'Send a brief',
    package: pkg,
  };
}

// --- Formatting + lead notes -------------------------------------------------

export const fmtGBP = (n: number): string => '£' + Math.round(n).toLocaleString('en-GB');

/** "£34,000 to £60,000", or a single figure when the range collapses. */
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
