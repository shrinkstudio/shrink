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
  slugifyCompany,
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
  assert.deepEqual(r.jtbd, ['Land enterprise prospects', 'Brief investors on the next round']);
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

it('share url encodes company slug + answers', () => {
  assert.equal(slugifyCompany('  Acme, Inc! '), 'acme-inc');
  const url = buildShareUrl('https://www.shrink.studio/quiz?x=1#top', 'Acme Inc', { moment: 'recent-seed' });
  assert.match(url, /^https:\/\/www\.shrink\.studio\/quiz\?c=acme-inc&d=/);
});

it('share link round-trips a full answer set, rejects junk', () => {
  const full: Answers = Object.fromEntries(
    QUESTIONS.map((q) => [q.id, q.type === 'multi' ? q.options.slice(0, 2).map((o) => o.id) : q.options[0].id]),
  );
  const d = new URL(buildShareUrl('https://www.shrink.studio/quiz', 'x', full)).searchParams.get('d')!;
  assert.deepEqual(decodeAnswers(d), full);
  assert.equal(decodeAnswers('not-base64!'), null);
  assert.equal(decodeAnswers(d.slice(0, 10)), null);
});

it('describeAnswers gives readable pairs for the lead notes', () => {
  const rows = describeAnswers({ moment: 'recent-seed', jtbd: ['land-enterprise', 'convert-demos'] });
  assert.equal(rows.length, QUESTION_COUNT);
  assert.ok(rows.some((r) => r.answer === 'Recently raised seed (within 6 months)'));
  assert.ok(rows.some((r) => r.answer === 'Land enterprise prospects; Convert demo or trial requests'));
});

console.log(`\n${passed} passed`);
