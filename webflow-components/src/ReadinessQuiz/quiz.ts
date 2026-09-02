/**
 * "Ready to brief a build?" — readiness quiz logic. Pure + testable: no React,
 * no DOM. Seven questions, each scored 0–3, mapped to a readiness band plus the
 * gaps worth closing and where we'd start.
 *
 * Aimed at Shrink's ICP: venture-backed B2B software teams, Seed–Series B,
 * weighing a website redesign. Honest read, not a sales pitch.
 */

export interface Option {
  label: string;
  points: number;
}

export interface Question {
  id: string;
  /* dimension of readiness this probes */
  dimension: string;
  question: string;
  options: Option[];
  /* surfaced in results when the chosen option scores at or below GAP_THRESHOLD */
  gap: string;
}

/* An answer scoring this low flags its dimension as a gap. */
export const GAP_THRESHOLD = 1;

export const QUESTIONS: Question[] = [
  {
    id: 'stage',
    dimension: 'Timing',
    question: "Where's the business right now?",
    options: [
      { label: 'Pre-seed or bootstrapping', points: 0 },
      { label: 'Recently closed a Seed round', points: 2 },
      { label: 'Series A or B, scaling', points: 3 },
      { label: 'Mid-raise, closing soon', points: 2 },
    ],
    gap: 'Timing. A redesign lands best just after a raise, when there is budget and a clear next chapter to build toward.',
  },
  {
    id: 'trigger',
    dimension: 'Motivation',
    question: "What's prompting a new site?",
    options: [
      { label: 'It looks dated next to where we are now', points: 2 },
      { label: "We've repositioned or changed who we sell to", points: 3 },
      { label: "We're chasing bigger, more considered deals", points: 3 },
      { label: 'Nothing specific, just curious', points: 0 },
    ],
    gap: 'Motivation. Without a clear trigger a rebuild tends to stall. Pin down the one thing the new site has to fix.',
  },
  {
    id: 'positioning',
    dimension: 'Positioning',
    question: 'How clear is your positioning and messaging?',
    options: [
      { label: 'Sharp. We could write the homepage today', points: 3 },
      { label: 'Mostly there, needs tightening', points: 2 },
      { label: 'It shifts depending on who is talking', points: 1 },
      { label: 'Honestly, unclear', points: 0 },
    ],
    gap: 'Positioning. A site cannot fix a fuzzy story. Nail the message first, then design around it.',
  },
  {
    id: 'content',
    dimension: 'Content',
    question: 'Do you have the content and proof ready: case studies, product story, visuals?',
    options: [
      { label: 'Yes, in good shape', points: 3 },
      { label: 'Some of it, gaps to fill', points: 2 },
      { label: "Very little, we'd start from scratch", points: 1 },
      { label: 'No, and no one owns it', points: 0 },
    ],
    gap: 'Content. Great design dies without substance. Line up your proof and product narrative early.',
  },
  {
    id: 'ownership',
    dimension: 'Ownership',
    question: "Who's driving this internally?",
    options: [
      { label: 'A founder or exec, hands-on', points: 3 },
      { label: 'A marketing lead with real authority', points: 3 },
      { label: "Someone, but they're stretched thin", points: 1 },
      { label: 'No clear owner yet', points: 0 },
    ],
    gap: 'Ownership. Builds without an engaged internal owner drift. Name a decision-maker before you start.',
  },
  {
    id: 'timeline',
    dimension: 'Timeline',
    question: 'When do you need it live?',
    options: [
      { label: 'Flexible. We want it right', points: 3 },
      { label: 'Next two to three months', points: 3 },
      { label: 'Yesterday, tied to a launch', points: 2 },
      { label: 'No timeline in mind', points: 1 },
    ],
    gap: 'Timeline. Set a real target date. Open-ended projects rarely ship.',
  },
  {
    id: 'measure',
    dimension: 'Measurement',
    question: 'How will you know the new site worked?',
    options: [
      { label: 'Clear metrics: demos, signups, pipeline', points: 3 },
      { label: 'A rough sense, not tracked yet', points: 1 },
      { label: 'It will just look and feel better', points: 1 },
      { label: 'Not sure', points: 0 },
    ],
    gap: "Measurement. Decide what 'better' means in numbers, or you will never know if it paid off.",
  },
];

export const MAX_SCORE = QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.points)),
  0,
);

export type Band = 'not-yet' | 'getting-close' | 'ready';

export interface Result {
  score: number;
  max: number;
  percent: number;
  band: Band;
  bandLabel: string;
  bandBlurb: string;
  gaps: string[];
  recommendation: string;
}

const BANDS: Record<Band, { label: string; blurb: string; recommendation: string }> = {
  'not-yet': {
    label: 'Not yet',
    blurb: 'A full rebuild now would be building on sand. Worth firming up the basics first.',
    recommendation:
      "Hold off on a full rebuild. Start with positioning and proof. We can help you get there, or point you to what to fix first, no pressure.",
  },
  'getting-close': {
    label: 'Getting close',
    blurb: "You're nearly there. A few gaps to close and you'd be in a strong spot to brief.",
    recommendation:
      'A short positioning and content working session to close the gaps above, then straight into design.',
  },
  ready: {
    label: 'Ready to brief',
    blurb: "You're in a strong spot. The inputs are there, so a build would move fast.",
    recommendation:
      'A focused discovery sprint: audit, a positioning check, and a plan for the pages that move the needle.',
  },
};

function bandFor(score: number, max: number): Band {
  const pct = score / max;
  if (pct < 0.38) return 'not-yet';
  if (pct < 0.72) return 'getting-close';
  return 'ready';
}

/**
 * Score a completed quiz. `answers` holds the chosen option index for each
 * question, in QUESTIONS order. Missing/invalid answers count as zero.
 */
export function scoreQuiz(answers: Array<number | null>): Result {
  let score = 0;
  const gaps: string[] = [];

  QUESTIONS.forEach((q, i) => {
    const choice = answers[i];
    const opt = choice != null ? q.options[choice] : undefined;
    const points = opt ? opt.points : 0;
    score += points;
    if (points <= GAP_THRESHOLD) gaps.push(q.gap);
  });

  const max = MAX_SCORE;
  const band = bandFor(score, max);
  const meta = BANDS[band];

  return {
    score,
    max,
    percent: Math.round((score / max) * 100),
    band,
    bandLabel: meta.label,
    bandBlurb: meta.blurb,
    gaps,
    recommendation: meta.recommendation,
  };
}
