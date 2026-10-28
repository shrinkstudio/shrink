/**
 * AI Search Check: the component's helpers and the scan's parsers. Run: npm test
 * Network-free; api/scan.ts is imported for its pure helpers only.
 */
import assert from 'node:assert/strict';
import { CHECKS, isResult, normaliseSite, previewQuestions, shareUrl } from '../src/AiSearchCheck/model.ts';
import { ldTypes, normaliseHost, robotsBlocks, tags, visibleText } from '../../api/scan.ts';

let passed = 0;
const it = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log(`  ok: ${name}`);
};

it('website input: addresses in, junk out', () => {
  assert.equal(normaliseSite('Acme.com'), 'acme.com');
  assert.equal(normaliseSite('https://www.acme.co.uk/about?x=1'), 'www.acme.co.uk');
  assert.equal(normaliseSite('  acme.io/  '), 'acme.io');
  for (const bad of ['', 'acme', 'n/a', 'acme com', 'http://', '127.0.0.1']) assert.equal(normaliseSite(bad), '', bad);
  // the server agrees, and refuses IPs
  assert.equal(normaliseHost('https://www.acme.co.uk/about'), 'www.acme.co.uk');
  assert.equal(normaliseHost('10.0.0.1'), '');
  assert.equal(normaliseHost('localhost'), '');
});

it('17 checks, 12 site and 5 agent, one bonus last', () => {
  assert.equal(CHECKS.length, 17);
  assert.equal(CHECKS.filter((c) => c.group === 'site').length, 12);
  assert.equal(CHECKS.filter((c) => c.group === 'agent').length, 5);
  assert.equal(CHECKS[CHECKS.length - 1].id, 'mcp');
  assert.equal(new Set(CHECKS.map((c) => c.id)).size, 17);
});

it('share link reruns the check for a site', () => {
  const url = new URL(shareUrl('https://www.shrink.studio/tools/ai-search-check?utm_source=x#top', 'acme.com'));
  assert.equal(url.searchParams.get('site'), 'acme.com');
  assert.equal(url.searchParams.get('utm_source'), null);
  assert.equal(url.hash, '');
});

it('the questions preview uses their competitor once typed', () => {
  assert.deepEqual(previewQuestions('Acme', '')[2], 'Acme or your main competitor: which should I choose?');
  assert.deepEqual(previewQuestions('Acme', ' Rival ')[2], 'Acme or Rival: which should I choose?');
});

it('only a complete scan result counts as one', () => {
  assert.equal(isResult({ ok: false, error: 'unreachable' }), false);
  assert.equal(isResult({ ok: true, host: 'acme.com', checks: [], score: { site: { got: 1, of: 12 }, agent: { got: 1, of: 5 } } }), true);
});

it('robots.txt: a bot is blocked by its own group, or by * when it has none', () => {
  const r = 'User-agent: *\nDisallow: /admin\n\nUser-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n';
  assert.equal(robotsBlocks(r, 'GPTBot'), true);
  assert.equal(robotsBlocks(r, 'ClaudeBot'), true);
  assert.equal(robotsBlocks(r, 'PerplexityBot'), false);
  assert.equal(robotsBlocks('User-agent: *\nDisallow: /', 'PerplexityBot'), true);
  assert.equal(robotsBlocks('User-agent: *\nDisallow: /\n\nUser-agent: PerplexityBot\nAllow: /', 'PerplexityBot'), false);
  assert.equal(robotsBlocks('', 'GPTBot'), false);
});

it('JSON-LD types come out of @graph and arrays, broken blocks are skipped', () => {
  const html = `<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":["WebPage","FAQPage"]}]}</script>
    <script type="application/ld+json">{broken</script>`;
  assert.deepEqual(ldTypes(html), ['Organization', 'WebPage', 'FAQPage']);
});

it('visible text leaves scripts and styles out', () => {
  const html = '<h1>Hi &amp; welcome</h1><script>var x = "hidden"</script><style>.a{}</style><p>There</p>';
  assert.equal(visibleText(html), 'Hi & welcome There');
  assert.equal(tags(html, 'h1').length, 1);
});

console.log(`\n${passed} passed`);
