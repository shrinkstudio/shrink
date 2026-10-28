/**
 * "Ready to brief a build?" readiness quiz logic. Pure + framework-free.
 * Ported from the old tools.shrink.studio quiz (src/lib/quiz) so the embedded
 * Webflow component matches the proven tool: two-axis scoring (Readiness / 9 +
 * Urgency / 6), a jobs-to-be-done list, a recommended engagement, and a
 * shareable-result link.
 *
 * Keep questions, scoring, and copy here: the component reads it, Ben refines it.
 */

export type Dimension =
  | 'moment'
  | 'clarity'
  | 'gapExternal'
  | 'gapInternal'
  | 'jtbd'
  | 'team'
  | 'shape';

export type QuestionType = 'single' | 'multi';

export interface QuestionOption {
  id: string;
  label: string;
  score?: number;
}

export interface Question {
  id: string;
  dimension: Dimension;
  type: QuestionType;
  prompt: string;
  helper?: string;
  options: QuestionOption[];
  maxSelections?: number;
}

export type Answers = Record<string, string | string[]>;

export const QUESTIONS: Question[] = [
  {
    id: 'moment',
    dimension: 'moment',
    type: 'single',
    prompt: 'Where are you with funding?',
    helper: 'We mostly work with venture-backed teams, so this helps us suggest the right timing.',
    options: [
      { id: 'pre-raise', label: 'Pre-seed, or still to raise', score: 0 },
      { id: 'recent-seed', label: 'Raised seed in the last 6 months', score: 3 },
      { id: 'mid-cycle', label: 'Raised seed or Series A 6 to 18 months ago', score: 3 },
      { id: 'post-cycle', label: 'Raised more than 18 months ago', score: 2 },
      { id: 'bootstrapped', label: 'Self-funded, with revenue coming in', score: 1 },
    ],
  },
  {
    id: 'clarity',
    dimension: 'clarity',
    type: 'single',
    prompt: 'Who is your homepage written for today?',
    helper: "The strongest sites speak from the customer's side, about their world and what they need.",
    options: [
      { id: 'customer', label: 'Our customers, in their words', score: 3 },
      { id: 'mixed', label: 'A mix, depending on the page', score: 2 },
      { id: 'ours', label: 'Mostly about our product', score: 1 },
      { id: 'unclear', label: "We're still working that out", score: 0 },
    ],
  },
  {
    id: 'gap-external',
    dimension: 'gapExternal',
    type: 'single',
    prompt: 'When an investor or a big prospect looks you up, how does the site feel?',
    options: [
      { id: 'confident', label: "We'd happily send them straight to it", score: 0 },
      { id: 'does-job', label: 'It does the job', score: 1 },
      { id: 'rather-not', label: "We'd like it to say more about where we are now", score: 2 },
      { id: 'hurts', label: "It's some way behind where the company is", score: 3 },
    ],
  },
  {
    id: 'gap-internal',
    dimension: 'gapInternal',
    type: 'single',
    prompt: 'Can your marketing team build the pages they need?',
    options: [
      { id: 'yes-kit', label: 'Yes, landing and campaign pages are easy', score: 0 },
      { id: 'sort-of', label: 'Mostly, with a bit of help', score: 1 },
      { id: 'work-around', label: 'They often work around the site', score: 2 },
      { id: 'no-team', label: 'Our marketing team is still to come', score: 3 },
    ],
  },
  {
    id: 'jtbd',
    dimension: 'jtbd',
    type: 'multi',
    prompt: 'What should the next site help you do?',
    helper: "Pick up to three, and we'll put them at the heart of your result.",
    maxSelections: 3,
    options: [
      { id: 'convert-demos', label: 'Turn visitors into demo or trial requests' },
      { id: 'land-enterprise', label: 'Win enterprise customers' },
      { id: 'support-recruiting', label: 'Help with hiring' },
      { id: 'brief-investors', label: 'Support the next funding round' },
      { id: 'launch-narratives', label: 'Launch new products and stories' },
      { id: 'marketing-experiments', label: 'Let marketing test ideas quickly' },
      { id: 'company-story', label: 'Tell the company story well' },
    ],
  },
  {
    id: 'team',
    dimension: 'team',
    type: 'single',
    prompt: 'Who would own the project on your side?',
    options: [
      { id: 'named-time', label: 'Someone named, with time set aside', score: 3 },
      { id: 'named-no-time', label: 'Someone named, though their time is tight', score: 2 },
      { id: 'whoever', label: 'Whoever is free that week', score: 1 },
      { id: 'no-one', label: "We'd need to decide that", score: 0 },
    ],
  },
  {
    id: 'shape',
    dimension: 'shape',
    type: 'single',
    prompt: 'What sounds closest to what you need?',
    helper: 'Any answer works here. It helps us suggest the right place to start.',
    options: [
      { id: 'rebuild', label: 'A full rebuild' },
      { id: 'sprint', label: 'Focused work on specific parts of the site' },
      { id: 'discovery', label: 'Some thinking first, then a build' },
      { id: 'unsure', label: "We'd like help deciding" },
    ],
  },
];

export const QUESTION_COUNT = QUESTIONS.length;

// -------------------------------------------------------------------
// Scoring
// -------------------------------------------------------------------

export type ResultState = 'ready' | 'close' | 'not_yet';

export interface ScoreBreakdown {
  moment: number;
  clarity: number;
  team: number;
  gapExternal: number;
  gapInternal: number;
  readiness: number; // moment + clarity + team, out of 9
  urgency: number; // gapExternal + gapInternal, out of 6
}

export interface RecommendedEngagement {
  id: 'seed-website' | 'clarity-sprint' | 'discovery' | 'audit' | 'resource';
  label: string;
  blurb: string;
  /** Shown beside the label, eg. "£15,000, fixed"; empty for the guides. */
  price: string;
  /** Deal value in Shrink OS for ready and close results. */
  value: number;
  /** Package or service page for the recommendation. */
  href: string;
  linkLabel: string;
}

export interface QuizResult {
  state: ResultState;
  scores: ScoreBreakdown;
  jtbd: string[]; // selected option labels
  shape: string | null;
  eyebrow: string;
  headline: string;
  diagnosis: string;
  readinessNote: string;
  urgencyNote: string;
  jtbdLabel: string;
  recommendedEngagement: RecommendedEngagement;
}

export const READINESS_MAX = 9;
export const URGENCY_MAX = 6;

function scoreOf(questionId: string, answers: Answers): number {
  const q = QUESTIONS.find((x) => x.id === questionId);
  if (!q) return 0;
  const ans = answers[questionId];
  if (typeof ans !== 'string') return 0;
  return q.options.find((o) => o.id === ans)?.score ?? 0;
}

function dimensionScore(dim: Dimension, answers: Answers): number {
  const q = QUESTIONS.find((x) => x.dimension === dim);
  return q ? scoreOf(q.id, answers) : 0;
}

export function computeScores(answers: Answers): ScoreBreakdown {
  const moment = dimensionScore('moment', answers);
  const clarity = dimensionScore('clarity', answers);
  const team = dimensionScore('team', answers);
  const gapExternal = dimensionScore('gapExternal', answers);
  const gapInternal = dimensionScore('gapInternal', answers);
  return {
    moment,
    clarity,
    team,
    gapExternal,
    gapInternal,
    readiness: moment + clarity + team,
    urgency: gapExternal + gapInternal,
  };
}

function deriveState(s: ScoreBreakdown): ResultState {
  if (s.moment < 2) return 'not_yet';
  if (s.clarity >= 2 && s.team >= 2) return 'ready';
  return 'close';
}

function buildHeadline(state: ResultState): string {
  if (state === 'ready') return "You're ready to brief a build.";
  if (state === 'close') return "You're close, and a little groundwork will help.";
  return "It's early, and that's a good time to plan.";
}

function buildDiagnosis(state: ResultState, s: ScoreBreakdown, urgent: boolean): string {
  if (state === 'ready') {
    if (urgent) {
      return 'Your brief, your team and your timing all line up, and your current site has some catching up to do, so moving soon will pay off.';
    }
    return 'Your brief, your team and your timing all line up. This is a great point to brief a build.';
  }
  if (state === 'close') {
    const weakClarity = s.clarity < 2;
    const weakTeam = s.team < 2;
    if (weakClarity && weakTeam) {
      return 'Your funding is in place. Agreeing who the site is for, and who owns it inside the team, will make the build quicker and the result stronger.';
    }
    if (weakClarity) {
      return 'Your timing and your team are in place. The next step is agreeing who the site speaks to and what it needs to say.';
    }
    return 'Your thinking is clear. The next step is giving someone inside the team the time to own the build.';
  }
  return "A full rebuild can wait for now. There's useful groundwork you can do in the meantime, so you're ready when the time comes.";
}

function readinessNote(readiness: number): string {
  if (readiness >= 7) return 'Clear on what and why';
  if (readiness >= 4) return 'Most of the pieces are in place';
  return 'Still taking shape';
}

function urgencyNote(urgency: number): string {
  if (urgency >= 4) return 'The site is behind the company';
  if (urgency >= 2) return 'Some catching up to do';
  return 'The site is keeping up well';
}

const SEED: RecommendedEngagement = {
  id: 'seed-website',
  label: 'Seed Website',
  blurb: 'A fixed scope and a fixed price, live in six weeks. The simplest route to a site that works for where you are now.',
  price: '£15,000, fixed',
  value: 15000,
  href: '/packages/seed-website',
  linkLabel: 'See the Seed Website',
};
const SPRINT = (blurb: string): RecommendedEngagement => ({
  id: 'clarity-sprint',
  label: 'Clarity Sprint',
  blurb,
  price: '£3,500',
  value: 3500,
  href: '/packages/clarity-sprint',
  linkLabel: 'See the Clarity Sprint',
});
const DISCOVERY = (blurb: string): RecommendedEngagement => ({
  id: 'discovery',
  label: 'Discovery',
  blurb,
  price: 'From £3,500',
  value: 3500,
  href: '/services/discovery',
  linkLabel: 'See Discovery',
});

function recommendEngagement(
  state: ResultState,
  s: ScoreBreakdown,
  shape: string | null,
): RecommendedEngagement {
  if (state === 'ready') {
    if (shape === 'sprint') return SPRINT('Two focused weeks on the parts of the site that matter most right now.');
    if (shape === 'discovery') return DISCOVERY('We get the thinking right together first, then build from a clear plan.');
    return SEED;
  }
  if (state === 'close') {
    if (s.clarity < 2) {
      return SPRINT('Two weeks to agree who the site speaks to and what it says, so the build starts from a brief your whole team supports.');
    }
    return DISCOVERY('A short piece of discovery to agree ownership and scope, so the build has a clear owner from day one.');
  }
  return {
    id: 'resource',
    label: 'Our guides',
    blurb: "Practical guides on positioning, site structure and AI search, so you're ready when the time comes.",
    price: '',
    value: 0,
    href: '/resources',
    linkLabel: 'Read the guides',
  };
}

function jtbdLabels(answers: Answers): string[] {
  const ids = answers['jtbd'];
  if (!Array.isArray(ids)) return [];
  const q = QUESTIONS.find((x) => x.id === 'jtbd');
  if (!q) return [];
  return ids
    .map((id) => q.options.find((o) => o.id === id)?.label)
    .filter((x): x is string => Boolean(x));
}

export function computeResult(answers: Answers): QuizResult {
  const scores = computeScores(answers);
  const state = deriveState(scores);
  const urgent = scores.urgency >= 4;
  const shapeRaw = answers['shape'];
  const shape = typeof shapeRaw === 'string' ? shapeRaw : null;

  return {
    state,
    scores,
    jtbd: jtbdLabels(answers),
    shape,
    eyebrow: 'Your result',
    headline: buildHeadline(state),
    diagnosis: buildDiagnosis(state, scores, urgent),
    readinessNote: readinessNote(scores.readiness),
    urgencyNote: urgencyNote(scores.urgency),
    jtbdLabel: state === 'ready' ? 'What the next site needs to do' : 'What to agree before you brief',
    recommendedEngagement: recommendEngagement(state, scores, shape),
  };
}

// -------------------------------------------------------------------
// Shareable result link (base64url-encoded answers), client-only.
// -------------------------------------------------------------------

function toBase64Url(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function encodeAnswers(answers: Answers): string {
  return toBase64Url(JSON.stringify(answers));
}

/** Reverse of encodeAnswers; null when the data isn't a valid answer set. */
export function decodeAnswers(data: string): Answers | null {
  try {
    const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const parsed = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const out: Answers = {};
    for (const q of QUESTIONS) {
      const ids = new Set(q.options.map((o) => o.id));
      const v = parsed[q.id];
      if (q.type === 'single' && typeof v === 'string' && ids.has(v)) out[q.id] = v;
      if (q.type === 'multi' && Array.isArray(v)) {
        const picks = v.filter((x) => typeof x === 'string' && ids.has(x));
        if (picks.length) out[q.id] = picks.slice(0, q.maxSelections ?? picks.length);
      }
    }
    return QUESTIONS.every((q) => q.id in out) ? out : null;
  } catch {
    return null;
  }
}

/** `${page}?d=<answers>&ref=<lead id>`: the quiz page rehydrates straight into results. */
export function buildShareUrl(base: string, answers: Answers, ref?: string): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('d', encodeAnswers(answers));
  if (ref) url.searchParams.set('ref', ref);
  return url.toString();
}

/** Readable question/answer pairs for the lead notes. */
export function describeAnswers(answers: Answers): { question: string; answer: string }[] {
  return QUESTIONS.map((q) => {
    const v = answers[q.id];
    const picks = Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
    const labels = picks.map((id) => q.options.find((o) => o.id === id)?.label).filter(Boolean);
    return { question: q.prompt, answer: labels.join('; ') };
  });
}
