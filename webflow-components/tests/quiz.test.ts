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
  const url = buildShareUrl('https://tools.shrink.studio/', 'Acme Inc', { moment: 'recent-seed' });
  assert.match(url, /^https:\/\/tools\.shrink\.studio\/quiz\/r\/acme-inc\?d=/);
});

console.log(`\n${passed} passed`);
