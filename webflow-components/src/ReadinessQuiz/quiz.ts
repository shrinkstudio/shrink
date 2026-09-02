/**
 * "Ready to brief a build?" — readiness quiz logic. Pure + framework-free.
 * Ported from the live tools.shrink.studio quiz (src/lib/quiz) so the embedded
 * Webflow component matches the proven tool: two-axis scoring (Readiness / 9 +
 * Urgency / 6), a jobs-to-be-done list, a recommended engagement, and a
 * shareable-result link.
 *
 * Keep questions, scoring, and copy here — the component reads it, Ben refines it.
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
    prompt: 'Where are you in the funding journey?',
    helper: 'We work with venture-backed teams. This helps us tell you if now is the moment.',
    options: [
      { id: 'pre-raise', label: "Pre-seed, or haven't raised yet", score: 0 },
      { id: 'recent-seed', label: 'Recently raised seed (within 6 months)', score: 3 },
      { id: 'mid-cycle', label: 'Raised seed or Series A 6–18 months ago', score: 3 },
      { id: 'post-cycle', label: 'Raised over 18 months ago', score: 2 },
      { id: 'bootstrapped', label: 'Bootstrapped, post-revenue', score: 1 },
    ],
  },
  {
    id: 'clarity',
    dimension: 'clarity',
    type: 'single',
    prompt: "Whose homepage are you writing — yours, or your customer's?",
    helper: "The sharpest sites are written from the customer's point of view, not the product's.",
    options: [
      { id: 'customer', label: "Our customer's — their problems, their world", score: 3 },
      { id: 'mixed', label: 'A mix, depending where you look', score: 2 },
      { id: 'ours', label: 'Ours — our product, our story', score: 1 },
      { id: 'unclear', label: "Honestly, we haven't worked that out yet", score: 0 },
    ],
  },
  {
    id: 'gap-external',
    dimension: 'gapExternal',
    type: 'single',
    prompt: 'When an investor or enterprise prospect Googles you, does the site hold up?',
    options: [
      { id: 'confident', label: "Confidently — we'd point them straight at it", score: 0 },
      { id: 'does-job', label: 'It does the job', score: 1 },
      { id: 'rather-not', label: "We'd rather they didn't look too hard", score: 2 },
      { id: 'hurts', label: 'It actively hurts us', score: 3 },
    ],
  },
  {
    id: 'gap-internal',
    dimension: 'gapInternal',
    type: 'single',
    prompt: 'Does your marketing team have somewhere to point campaigns?',
    options: [
      { id: 'yes-kit', label: 'Yes — landing pages, sector pages, the full kit', score: 0 },
      { id: 'sort-of', label: 'Sort of — they make it work', score: 1 },
      { id: 'work-around', label: 'They mostly work around the site', score: 2 },
      { id: 'no-team', label: "There isn't really a marketing team yet", score: 3 },
    ],
  },
  {
    id: 'jtbd',
    dimension: 'jtbd',
    type: 'multi',
    prompt: 'What does the next site need to do?',
    helper: "Pick up to three. We'll play these back as the priorities your build has to deliver on.",
    maxSelections: 3,
    options: [
      { id: 'convert-demos', label: 'Convert demo or trial requests' },
      { id: 'land-enterprise', label: 'Land enterprise prospects' },
      { id: 'support-recruiting', label: 'Support hiring and recruiting' },
      { id: 'brief-investors', label: 'Brief investors on the next round' },
      { id: 'launch-narratives', label: 'Launch new product narratives' },
      { id: 'marketing-experiments', label: 'Let marketing experiment fast' },
      { id: 'company-story', label: 'Tell the company story properly' },
    ],
  },
  {
    id: 'team',
    dimension: 'team',
    type: 'single',
    prompt: 'Who owns this internally — and have they got the time?',
    options: [
      { id: 'named-time', label: 'Named owner with time carved out', score: 3 },
      { id: 'named-no-time', label: 'Named owner, but no real time', score: 2 },
      { id: 'whoever', label: "Whoever's free that week", score: 1 },
      { id: 'no-one', label: 'No one yet', score: 0 },
    ],
  },
  {
    id: 'shape',
    dimension: 'shape',
    type: 'single',
    prompt: 'What feels closest to what you need?',
    helper: 'There are no wrong answers. We use this to point you at the right starting point.',
    options: [
      { id: 'rebuild', label: 'A full rebuild' },
      { id: 'sprint', label: 'A targeted sprint on specific gaps' },
      { id: 'discovery', label: 'Discovery first, build later' },
      { id: 'unsure', label: 'Honestly, not sure' },
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
  cta: string;
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
  if (state === 'ready') return "You're at the moment.";
  if (state === 'close') return "Close — but the brief isn't there yet.";
  return 'Not the moment yet — but worth laying the groundwork.';
}

function buildDiagnosis(state: ResultState, s: ScoreBreakdown, urgent: boolean): string {
  if (state === 'ready') {
    if (urgent) {
      return "The brief is there, the team's there, and the gap between where you are and what's expected is wide enough that moving sooner pays off.";
    }
    return 'Clarity, team, and timing all line up. This is the point where briefing a build pays the most.';
  }
  if (state === 'close') {
    const weakClarity = s.clarity < 2;
    const weakTeam = s.team < 2;
    if (weakClarity && weakTeam) {
      return "The funding's there, but the brief isn't yet. Positioning and team ownership need to land before a build is worth briefing.";
    }
    if (weakClarity) {
      return "The timing and team are there. What's missing is the clarity — whose homepage you're writing and what it has to say.";
    }
    return 'The thinking is there. What is missing is someone inside the company who owns the build with real time to give it.';
  }
  return "Now isn't the moment for a full rebuild, but there's groundwork worth doing so you're ready when it is.";
}

function readinessNote(readiness: number): string {
  if (readiness >= 7) return 'Clear on what and why.';
  if (readiness >= 4) return 'The pieces are mostly there.';
  return 'Still finding the shape.';
}

function urgencyNote(urgency: number): string {
  if (urgency >= 4) return 'The window is open now.';
  if (urgency >= 2) return 'A gap worth closing.';
  return 'No pressing gap yet.';
}

function recommendEngagement(
  state: ResultState,
  s: ScoreBreakdown,
  shape: string | null,
): RecommendedEngagement {
  if (state === 'ready') {
    if (shape === 'sprint') {
      return {
        id: 'clarity-sprint',
        label: 'Clarity Sprint',
        blurb: 'A focused sprint on the specific gaps holding the site back.',
        cta: 'Send us the brief',
      };
    }
    if (shape === 'discovery') {
      return {
        id: 'discovery',
        label: 'Discovery',
        blurb: 'Get the thinking right first, then build with a clear plan.',
        cta: 'Send us the brief',
      };
    }
    return {
      id: 'seed-website',
      label: 'Seed Website',
      blurb: 'Fixed scope, fixed price, six weeks. The productised route for a Seed-stage build.',
      cta: 'Send us the brief',
    };
  }
  if (state === 'close') {
    if (s.clarity < 2) {
      return {
        id: 'clarity-sprint',
        label: 'Clarity Sprint',
        blurb: 'Nail whose homepage you are writing and what it has to say, before you build.',
        cta: 'Book a free audit',
      };
    }
    return {
      id: 'discovery',
      label: 'Discovery',
      blurb: 'A short piece of discovery to line up ownership and scope before a build.',
      cta: 'Book a free audit',
    };
  }
  return {
    id: 'resource',
    label: 'The funding moment',
    blurb: 'Groundwork worth doing now, so you are ready to brief when the moment comes.',
    cta: 'Book a free audit',
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
    eyebrow: 'Your readiness',
    headline: buildHeadline(state),
    diagnosis: buildDiagnosis(state, scores, urgent),
    readinessNote: readinessNote(scores.readiness),
    urgencyNote: urgencyNote(scores.urgency),
    jtbdLabel: state === 'ready' ? 'What the next site needs' : 'What to nail before briefing',
    recommendedEngagement: recommendEngagement(state, scores, shape),
  };
}

// -------------------------------------------------------------------
// Shareable result link (base64url-encoded answers), client-only.
// -------------------------------------------------------------------

export function slugifyCompany(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'anon';
}

function toBase64Url(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function encodeAnswers(answers: Answers): string {
  return toBase64Url(JSON.stringify(answers));
}

/** `${base}/quiz/r/<slug>?d=<data>` — points at the tools.shrink.studio result route. */
export function buildShareUrl(base: string, company: string, answers: Answers): string {
  const root = base.replace(/\/+$/, '');
  return `${root}/quiz/r/${slugifyCompany(company)}?d=${encodeAnswers(answers)}`;
}
