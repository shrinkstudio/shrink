/**
 * Scoring sanity checks for the Readiness Quiz. Run: npm test
 * Model: Readiness = moment+clarity+team (/9), Urgency = gapExternal+gapInternal (/6).
 */
import assert from 'node:assert/strict';
import {
  QUESTIONS,
  QUESTION_COUNT,
  READINESS_MAX,
  URGENCY_MAX,
  computeResult,
  computeScores,
  buildShareUrl,
  decodeAnswers,
  describeAnswers,
  type Answers,
} from '../src/ReadinessQuiz/quiz.ts';

let passed = 0;
const it = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log(`  ok — ${name}`);
};

const opt = (qid: string, pick: 'best' | 'worst') => {
  const q = QUESTIONS.find((x) => x.id === qid)!;
  const scored = q.options.filter((o) => typeof o.score === 'number');
  const pool = scored.length ? scored : q.options;
  const sorted = [...pool].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return (pick === 'best' ? sorted[0] : sorted[sorted.length - 1]).id;
};

it('7 questions, maxes are 9 and 6', () => {
  assert.equal(QUESTION_COUNT, 7);
  assert.equal(READINESS_MAX, 9);
  assert.equal(URGENCY_MAX, 6);
});

it('best readiness answers => readiness 9, ready', () => {
  const answers: Answers = {
    moment: opt('moment', 'best'),
    clarity: opt('clarity', 'best'),
    team: opt('team', 'best'),
    'gap-external': opt('gap-external', 'best'),
    'gap-internal': opt('gap-internal', 'best'),
    jtbd: ['land-enterprise', 'brief-investors'],
    shape: 'rebuild',
  };
  const s = computeScores(answers);
  assert.equal(s.readiness, 9);
  assert.equal(s.urgency, 6); // best gap answers here are the highest-urgency ones
  const r = computeResult(answers);
  assert.equal(r.state, 'ready');
  assert.equal(r.recommendedEngagement.id, 'seed-website');
  assert.deepEqual(r.jtbd, ['Win enterprise customers', 'Support the next funding round']);
});

it('pre-raise => not_yet regardless of the rest', () => {
  const answers: Answers = {
    moment: 'pre-raise', // score 0
    clarity: opt('clarity', 'best'),
    team: opt('team', 'best'),
    'gap-external': 'hurts',
    'gap-internal': 'no-team',
    jtbd: ['company-story'],
    shape: 'discovery',
  };
  const r = computeResult(answers);
  assert.equal(r.state, 'not_yet');
  assert.equal(r.recommendedEngagement.id, 'resource');
});

it('funded but weak clarity => close + clarity sprint', () => {
  const answers: Answers = {
    moment: 'recent-seed', // 3
    clarity: 'unclear', // 0
    team: 'named-time', // 3
    'gap-external': 'does-job',
    'gap-internal': 'sort-of',
    jtbd: ['convert-demos'],
    shape: 'rebuild',
  };
  const r = computeResult(answers);
  assert.equal(r.state, 'close');
  assert.equal(r.recommendedEngagement.id, 'clarity-sprint');
});

it('shape routes a ready result to a sprint', () => {
  const answers: Answers = {
    moment: 'recent-seed',
    clarity: 'customer',
    team: 'named-time',
    'gap-external': 'does-job',
    'gap-internal': 'sort-of',
    jtbd: ['land-enterprise'],
    shape: 'sprint',
  };
  const r = computeResult(answers);
  assert.equal(r.state, 'ready');
  assert.equal(r.recommendedEngagement.id, 'clarity-sprint');
});

it('share url carries the answers and the lead id, and drops old params', () => {
  const url = new URL(buildShareUrl('https://www.shrink.studio/quiz?x=1#top', { moment: 'recent-seed' }, 'lead-1'));
  assert.equal(url.pathname, '/quiz');
  assert.equal(url.searchParams.get('ref'), 'lead-1');
  assert.ok(url.searchParams.get('d'));
  assert.equal(url.searchParams.get('x'), null);
  assert.equal(url.hash, '');
});

it('share link round-trips a full answer set, rejects junk', () => {
  const full: Answers = Object.fromEntries(
    QUESTIONS.map((q) => [q.id, q.type === 'multi' ? q.options.slice(0, 2).map((o) => o.id) : q.options[0].id]),
  );
  const d = new URL(buildShareUrl('https://www.shrink.studio/quiz', full)).searchParams.get('d')!;
  assert.deepEqual(decodeAnswers(d), full);
  assert.equal(decodeAnswers('not-base64!'), null);
  assert.equal(decodeAnswers(d.slice(0, 10)), null);
});

it('describeAnswers gives readable pairs for the lead notes', () => {
  const rows = describeAnswers({ moment: 'recent-seed', jtbd: ['land-enterprise', 'convert-demos'] });
  assert.equal(rows.length, QUESTION_COUNT);
  assert.ok(rows.some((r) => r.answer === 'Raised seed in the last 6 months'));
  assert.ok(rows.some((r) => r.answer === 'Win enterprise customers; Turn visitors into demo or trial requests'));
});

it('recommendations carry a price and a deal value; the resources carry neither', () => {
  const seed = computeResult(Object.fromEntries(QUESTIONS.map((q) => [q.id, q.type === 'multi' ? [q.options[0].id] : q.options.find((o) => (o.score ?? 0) === Math.max(...q.options.map((x) => x.score ?? 0)))!.id])));
  assert.equal(seed.recommendedEngagement.price, '£15,000, fixed');
  assert.equal(seed.recommendedEngagement.value, 15000);
  const early = computeResult({ moment: 'pre-raise' });
  assert.equal(early.recommendedEngagement.value, 0);
  assert.equal(early.recommendedEngagement.price, '');
});

it('copy: no dashes or em dashes in the questions or results', () => {
  const text = JSON.stringify(QUESTIONS) + JSON.stringify(computeResult({ moment: 'recent-seed', clarity: 'unclear', team: 'no-one' }));
  assert.ok(!/[\u2013\u2014]/.test(text));
});

console.log(`\n${passed} passed`);
