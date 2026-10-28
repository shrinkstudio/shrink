/**
 * Pricing sanity checks for the Project Calculator. Run: npm test
 * Reference points come from the retired tools.shrink.studio calculator
 * (marketing site, medium, full design, CMS, extras, focused discovery:
 * £34k to £60k) and the published Pricing page floors.
 */
import assert from 'node:assert/strict';
import {
  APP_FLOOR,
  CALL_THRESHOLD,
  QUESTIONS,
  SITE_FLOOR,
  computeDrivers,
  computeEstimate,
  computeNextStep,
  dayRate,
  describeAnswers,
  fmtRange,
  isComplete,
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

const site: Answers = {
  type: 'marketing-site',
  pages: 'medium',
  design: 'full',
  cms: 'yes',
  extras: ['interactions', 'integrations'],
  discovery: 'focused',
  timing: 'quarter',
};

it('rate card matches the internal scoping tool', () => {
  assert.equal(Math.round(dayRate('founder')), 991);
  assert.equal(Math.round(dayRate('senior-dev')), 801);
  assert.equal(Math.round(dayRate('pm')), 501);
  assert.equal(dayRate('nobody'), 0);
});

it('branching: a site asks pages/design/cms, an app asks size/modules, a retainer asks intensity', () => {
  const ids = (a: Answers) => visibleQuestions(a).map((q) => q.id);
  assert.deepEqual(ids({ type: 'marketing-site' }), ['type', 'pages', 'design', 'cms', 'extras', 'discovery', 'timing']);
  assert.deepEqual(ids({ type: 'web-app' }), ['type', 'appSize', 'appModules', 'extras', 'discovery', 'timing']);
  assert.deepEqual(ids({ type: 'optimisation' }), ['type', 'optIntensity']);
  assert.equal(ids({}).length, 1);
  assert.ok(QUESTIONS.every((q) => q.options.length >= 2));
});

it('isComplete respects optional multis', () => {
  assert.equal(isComplete({ type: 'marketing-site', pages: 'small', design: 'none', cms: 'no', discovery: 'none', timing: 'flexible' }), true);
  assert.equal(isComplete({ type: 'marketing-site', pages: 'small' }), false);
  assert.equal(isComplete({ type: 'optimisation', optIntensity: 'compound' }), true);
});

it('reference site lands in the old tool\'s range (about £34k to £60k)', () => {
  const e = computeEstimate(site);
  assert.ok(e && e.kind === 'range');
  if (e && e.kind === 'range') {
    assert.ok(e.low >= 30000 && e.low <= 40000, `low ${e.low}`);
    assert.ok(e.high >= 55000 && e.high <= 68000, `high ${e.high}`);
    assert.ok(e.low % 500 === 0 && e.high % 500 === 0);
    assert.ok(e.lines.some((l) => l.area === 'Discovery'));
    assert.ok(e.lines.every((l) => l.min <= l.max));
  }
});

it('floors follow the Pricing page: sites from £15,000, apps from £30,000', () => {
  const tiny = computeEstimate({ type: 'redesign', pages: 'small', design: 'none', cms: 'no', discovery: 'none', timing: 'flexible' });
  assert.ok(tiny && tiny.kind === 'range' && tiny.low === SITE_FLOOR);
  const app = computeEstimate({ type: 'web-app', appSize: 'mvp', discovery: 'none', timing: 'flexible' });
  assert.ok(app && app.kind === 'range' && app.low >= APP_FLOOR && app.high > app.low);
});

it('retainers: £5,000 a month focused, £10,000 Compound, nothing until the tier is picked', () => {
  assert.equal(computeEstimate({ type: 'optimisation' }), null);
  const s = computeEstimate({ type: 'optimisation', optIntensity: 'standard' });
  const c = computeEstimate({ type: 'optimisation', optIntensity: 'compound' });
  assert.ok(s && s.kind === 'recurring' && s.monthly === 5000);
  assert.ok(c && c.kind === 'recurring' && c.monthly === 10000 && c.label === 'Compound');
});

it('fast turnaround adds roughly 15% and shows up as a line', () => {
  const slow = computeEstimate({ ...site, timing: 'flexible' });
  const fast = computeEstimate({ ...site, timing: 'fast' });
  assert.ok(slow && fast && slow.kind === 'range' && fast.kind === 'range');
  if (slow && fast && slow.kind === 'range' && fast.kind === 'range') {
    assert.ok(fast.high > slow.high * 1.12 && fast.high < slow.high * 1.18, `${slow.high} -> ${fast.high}`);
    assert.ok(fast.lines.some((l) => l.area === 'Fast turnaround'));
    assert.ok(!slow.lines.some((l) => l.area === 'Fast turnaround'));
  }
});

it('drivers: pages, integrations and timing always lead, amounts never negative', () => {
  const d = computeDrivers(site);
  assert.deepEqual(d.slice(0, 3).map((x) => x.id), ['pages', 'integrations', 'timing']);
  assert.ok(d.every((x) => x.low >= 0 && x.high >= 0 && x.low <= x.high));
  assert.ok(d[0].high > 0, 'medium pages cost more than small');
  assert.ok(d[1].high > 0, 'integrations picked add cost');
  assert.equal(d[2].low, 0, 'standard timing adds nothing');
  const fast = computeDrivers({ ...site, timing: 'fast' });
  assert.ok(fast[2].low > 0);
  const app = computeDrivers({ type: 'web-app', appSize: 'standard', appModules: ['auth', 'integrations'], discovery: 'none', timing: 'flexible' });
  assert.deepEqual(app.slice(0, 3).map((x) => x.id), ['size', 'integrations', 'timing']);
  assert.ok(app.some((x) => x.id === 'modules'));
  assert.deepEqual(computeDrivers({ type: 'optimisation', optIntensity: 'compound' }), []);
});

it('next step: a brief for small sites, a call above the threshold, apps and deep discovery', () => {
  const small: Answers = { type: 'marketing-site', pages: 'small', design: 'partial', cms: 'no', discovery: 'none', timing: 'flexible' };
  const n1 = computeNextStep(small, computeEstimate(small), LINKS);
  assert.ok(n1 && n1.kind === 'brief' && n1.href === LINKS.brief);
  assert.equal(n1?.package?.name, 'Seed Website');

  const n2 = computeNextStep(site, computeEstimate(site), LINKS);
  assert.ok(n2 && n2.kind === 'call' && n2.href === LINKS.call);
  const e2 = computeEstimate(site);
  assert.ok(e2 && e2.kind === 'range' && e2.low >= CALL_THRESHOLD);

  const app: Answers = { type: 'web-app', appSize: 'mvp', discovery: 'none', timing: 'flexible' };
  assert.equal(computeNextStep(app, computeEstimate(app), LINKS)?.kind, 'call');

  const sprint: Answers = { ...small, pages: 'large', discovery: 'focused' };
  assert.equal(computeNextStep(sprint, computeEstimate(sprint), LINKS)?.package?.name, 'Clarity Sprint');

  const compound: Answers = { type: 'optimisation', optIntensity: 'compound' };
  const n3 = computeNextStep(compound, computeEstimate(compound), LINKS);
  assert.ok(n3 && n3.kind === 'call' && n3.href === LINKS.compoundCall && n3.package?.name === 'Compound');
});

it('formatting and lead notes', () => {
  assert.equal(fmtRange(34000, 60000), '£34,000 to £60,000');
  assert.equal(fmtRange(15000, 15000), '£15,000');
  const notes = describeAnswers(site);
  assert.equal(notes.length, 7);
  assert.equal(notes[0].answer, 'A new marketing website');
  assert.ok(notes.every((n) => n.question && n.answer));
});

it('copy: no em dashes anywhere in the model', () => {
  const text = JSON.stringify(QUESTIONS);
  assert.ok(!text.includes('—'));
});

console.log(`\n${passed} passed`);
