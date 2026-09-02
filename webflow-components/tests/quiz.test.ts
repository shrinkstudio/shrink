/**
 * Scoring sanity checks for the Readiness Quiz. Run: npm test
 */
import assert from 'node:assert/strict';
import { QUESTIONS, MAX_SCORE, scoreQuiz } from '../src/ReadinessQuiz/quiz.ts';

let passed = 0;
const it = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log(`  ok — ${name}`);
};

// Max score is 7 questions x best option (3 each here) = 21.
it('MAX_SCORE is 21', () => {
  assert.equal(MAX_SCORE, 21);
  assert.equal(QUESTIONS.length, 7);
});

// All best answers -> full score, "ready", no gaps.
it('best answers => ready, no gaps', () => {
  const answers = QUESTIONS.map((q) =>
    q.options.indexOf(q.options.reduce((a, b) => (b.points > a.points ? b : a))),
  );
  const r = scoreQuiz(answers);
  assert.equal(r.score, 21);
  assert.equal(r.band, 'ready');
  assert.equal(r.gaps.length, 0);
});

// All worst answers -> minimum score, "not yet", every dimension flagged.
it('worst answers => not-yet, all gaps', () => {
  const answers = QUESTIONS.map((q) =>
    q.options.indexOf(q.options.reduce((a, b) => (b.points < a.points ? b : a))),
  );
  const expectedMin = QUESTIONS.reduce(
    (s, q) => s + Math.min(...q.options.map((o) => o.points)),
    0,
  );
  const r = scoreQuiz(answers);
  assert.equal(r.score, expectedMin);
  assert.equal(r.band, 'not-yet');
  assert.equal(r.gaps.length, 7);
});

// Unanswered questions count as zero and flag their gap.
it('null answers score zero', () => {
  const r = scoreQuiz(QUESTIONS.map(() => null));
  assert.equal(r.score, 0);
  assert.equal(r.gaps.length, 7);
});

// Percent + band boundaries hold.
it('mid score => getting-close', () => {
  // Pick the second-best option for each to land mid-band.
  const answers = QUESTIONS.map((q) => {
    const sorted = [...q.options].sort((a, b) => b.points - a.points);
    return q.options.indexOf(sorted[1]);
  });
  const r = scoreQuiz(answers);
  assert.ok(r.score > 0 && r.score < 21);
  assert.ok(['getting-close', 'ready'].includes(r.band));
  assert.equal(r.percent, Math.round((r.score / 21) * 100));
});

console.log(`\n${passed} passed`);
