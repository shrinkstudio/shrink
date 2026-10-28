/**
 * Pricing sanity checks for the Project Calculator. Run: npm test
 * Reference points are real 2026 deals: Isla Health (about 185 URLs, design
 * system, HubSpot and GA4, WCAG: quoted £25k to £28k) and BuildStore (Craft to
 * Webflow migration and redesign: quoted £20k, a little low).
 */
import assert from 'node:assert/strict';
import {
  BASE,
  CALL_THRESHOLD,
  QUESTIONS,
  computeEstimate,
  computeNextStep,
  decodeAnswers,
  describeAnswers,
  encodeAnswers,
  fmtRange,
  isComplete,
  shareUrl,
  siteLines,
  visibleQuestions,
  type Answers,
} from '../src/Calculator/model.ts';

let passed = 0;
const it = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log(`  ok: ${name}`);
};

const LINKS = { call: '/calls/intro', brief: '/contact?service=development', compoundCall: '/calls/compound' };

const seed: Answers = {
  type: 'new-site',
  templates: 'up-to-8',
  cms: 'up-to-2',
  design: 'brand',
  platform: 'none',
  integrations: [],
  extras: [],
  brief: 'agreed',
  timing: 'quarter',
};
const isla: Answers = {
  type: 'rebuild',
  templates: '9-15',
  cms: 'up-to-2',
  design: 'system',
  platform: 'wordpress',
  migration: '50-200',
  integrations: ['crm', 'analytics'],
  extras: ['a11y'],
  brief: 'agreed',
  timing: 'quarter',
};
const buildstore: Answers = {
  type: 'rebuild',
  templates: 'up-to-8',
  cms: 'up-to-2',
  design: 'direction',
  platform: 'other',
  migration: '50-200',
  integrations: [],
  extras: [],
  brief: 'agreed',
  timing: 'flexible',
};

it('branching: a site asks the scope, a retainer asks the tier, a web app asks nothing more', () => {
  const ids = (a: Answers) => visibleQuestions(a).map((q) => q.id);
  assert.deepEqual(ids({ type: 'new-site' }), ['type', 'templates', 'cms', 'design', 'platform', 'integrations', 'extras', 'brief', 'timing']);
  assert.deepEqual(ids({ type: 'rebuild', platform: 'webflow' }), ['type', 'templates', 'cms', 'design', 'platform', 'migration', 'integrations', 'extras', 'brief', 'timing']);
  assert.deepEqual(ids({ type: 'retainer' }), ['type', 'tier']);
  assert.deepEqual(ids({ type: 'web-app' }), ['type']);
  assert.ok(QUESTIONS.every((q) => q.options.length >= 2));
});

it('the Seed Website scope lands on the package price', () => {
  const e = computeEstimate(seed);
  assert.ok(e && e.kind === 'range');
  assert.equal(e.total, BASE);
  assert.equal(fmtRange(e.low, e.high), '£15,000');
  const small = computeEstimate({ ...seed, integrations: ['crm'] });
  assert.ok(small && small.kind === 'range' && small.low === BASE);
  const n = computeNextStep(seed, e, LINKS)!;
  assert.equal(n.kind, 'brief');
  assert.equal(n.package?.name, 'Seed Website');
});

it('an Isla Health sized scope lands in the pitch zone and books a call', () => {
  const e = computeEstimate(isla);
  assert.ok(e && e.kind === 'range');
  assert.equal(e.total, 28500);
  assert.equal(fmtRange(e.low, e.high), '£26,500 to £30,500');
  assert.equal(computeNextStep(isla, e, LINKS)!.kind, 'call');
});

it('a BuildStore sized scope lands around £20k', () => {
  const e = computeEstimate(buildstore);
  assert.ok(e && e.kind === 'range');
  assert.equal(e.total, 20500);
});

it('one band, applied once: the high figure is at most 1.15x the low', () => {
  for (const a of [seed, isla, buildstore]) {
    const e = computeEstimate(a);
    assert.ok(e && e.kind === 'range');
    assert.ok(e.high / e.low <= 1.15 + 0.01, `${e.low} to ${e.high}`);
    assert.equal(e.lines.reduce((s, l) => s + l.amount, 0), e.total);
  }
});

it('lines: base first, zero lines left out, three languages replaces two, migration needs a platform', () => {
  const lines = siteLines({ ...isla, extras: ['lang-2', 'lang-3'] });
  assert.equal(lines[0].id, 'base');
  assert.ok(lines.every((l) => l.amount > 0));
  assert.ok(lines.some((l) => l.id === 'extra-lang-3'));
  assert.ok(!lines.some((l) => l.id === 'extra-lang-2'));
  assert.ok(!siteLines({ ...isla, platform: 'none' }).some((l) => l.id === 'migration'));
});

it('web apps and very large sites go straight to a call', () => {
  const app = computeEstimate({ type: 'web-app' });
  assert.ok(app && app.kind === 'call' && app.reason === 'web-app' && !app.from);
  const big = computeEstimate({ ...isla, templates: '25-plus' });
  assert.ok(big && big.kind === 'call' && big.reason === 'large' && (big.from ?? 0) > CALL_THRESHOLD - 5000);
  assert.equal(computeNextStep({ type: 'web-app' }, app, LINKS)!.href, LINKS.call);
});

it('retainers are Care, Growth and Compound, and Compound books a Compound call', () => {
  const m = (tier: string) => {
    const e = computeEstimate({ type: 'retainer', tier });
    return e && e.kind === 'recurring' ? e.monthly : 0;
  };
  assert.deepEqual([m('care'), m('growth'), m('compound')], [1500, 3000, 7000]);
  const e = computeEstimate({ type: 'retainer', tier: 'compound' });
  const n = computeNextStep({ type: 'retainer', tier: 'compound' }, e, LINKS)!;
  assert.equal(n.href, LINKS.compoundCall);
  assert.equal(n.package?.price, '£7,000 a month');
});

it('an open brief adds a Clarity Sprint outside the figure', () => {
  const e = computeEstimate({ ...isla, brief: 'open' });
  assert.ok(e && e.kind === 'range');
  assert.equal(e.sprint, 3500);
  assert.equal(e.total, 28500);
  assert.equal(computeNextStep({ ...isla, brief: 'open' }, e, LINKS)!.package?.name, 'Clarity Sprint');
});

it('the share link round-trips and rejects junk', () => {
  const url = shareUrl('https://www.shrink.studio/tools/project-calculator', isla, 'abc');
  const params = new URL(url).searchParams;
  assert.equal(params.get('ref'), 'abc');
  assert.deepEqual(decodeAnswers(params.get('estimate')!), isla);
  assert.equal(decodeAnswers(encodeAnswers({ type: 'new-site' })), null);
  assert.equal(decodeAnswers('not-base64!'), null);
  assert.equal(isComplete(isla), true);
});

it('lead notes read cleanly', () => {
  const d = describeAnswers(isla);
  assert.equal(d[0].answer, 'A rebuild of our current site');
  assert.ok(d.every((x) => x.answer.length > 0));
});

it('copy: no em dashes anywhere in the model', () => {
  const text = JSON.stringify(QUESTIONS) + JSON.stringify(computeEstimate(isla)) + JSON.stringify(computeNextStep(isla, computeEstimate(isla), LINKS));
  assert.ok(!text.includes('—'));
});

console.log(`\n${passed} passed`);
