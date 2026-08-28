// -----------------------------------------
// SHRINK — DEV DEPLOY HELPER
// -----------------------------------------
// Builds, commits, pushes, then prints commit-hash-PINNED jsDelivr URLs plus
// their SRI integrity hashes — everything needed to register/update the bundle
// via the Webflow Scripts API (or to paste as a <script> tag) during dev.
//
// Why pinned (not @master) during dev:
//   Commit-SHA URLs are immutable on jsDelivr, so a fresh push is served
//   INSTANTLY with no purge lag or stale cache. At go-live switch the Webflow
//   embed to plain @master.
//
// Usage:
//   pnpm deploy            # commit msg defaults to "dev: bundle update"
//   pnpm deploy "msg"      # custom commit message
// -----------------------------------------

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const REPO = 'shrinkstudio/shrink';
const BRANCH = 'master';

// Where each bundle goes in Webflow. `site` applies it site-wide; `page`
// applies it to that page only (keeps the 100KB list bundle off every page).
const WEBFLOW_SITE_ID = '6a8daa3ae6b8009a3d00e586'; // SS 2027
const BUNDLES = [
  { file: 'dist/index.js', displayName: 'shrinkIndex', target: 'site' },
  { file: 'dist/list.js', displayName: 'shrinkList', target: 'page', pageId: '6a903c18cab25430c55fb644' }, // Resources
];
const FILES = BUNDLES.map(({ file }) => file);

const run = (cmd) => execSync(cmd, { stdio: ['inherit', 'pipe', 'inherit'] }).toString().trim();
const log = (msg) => process.stdout.write(`${msg}\n`);

const COAUTHOR = 'Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>';

const subject = process.argv.slice(2).join(' ') || 'dev: bundle update';
const msg = `${subject}\n\n${COAUTHOR}`;

// 1. Build (set NODE_ENV directly rather than via cross-env, so the deploy
//    doesn't depend on a devDependency binary resolving on PATH).
log('▶ Building…');
execSync('node ./bin/build.js', { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });

// 2. Commit (skip cleanly if nothing changed) + push
execSync('git add -A');
const dirty = run('git status --porcelain');
if (dirty) {
  execSync(`git commit -q -m ${JSON.stringify(msg)}`, { stdio: 'inherit' });
  log(`▶ Committed: ${subject}`);
} else {
  log('▶ No changes to commit — re-pinning current HEAD.');
}

execSync(`git push -q origin HEAD:${BRANCH}`, { stdio: 'inherit' });

// Verify the push actually landed — a network blip here can otherwise leave the
// repo silently ahead of origin while the deploy looks half-successful.
const localHead = run('git rev-parse HEAD');
const remoteHead = run(`git ls-remote origin -h refs/heads/${BRANCH}`).split('\t')[0];
if (localHead !== remoteHead) {
  throw new Error(`Push verification failed: local ${localHead.slice(0, 7)} vs origin ${remoteHead.slice(0, 7)}`);
}
log(`▶ Push verified on origin/${BRANCH}.`);

// 3. Pinned URLs + SRI integrity hashes + SemVer version
const sha = run('git rev-parse HEAD');

// Webflow registerScript requires a UNIQUE SemVer per update — derive a
// monotonic patch from the total commit count so it always increments.
const version = `0.0.${run('git rev-list --count HEAD')}`;

log('\n─────────────────────────────────────────────');
log('  PINNED DEPLOY — register/update in Webflow');
log('─────────────────────────────────────────────');

for (const file of FILES) {
  const sri = `sha384-${createHash('sha384').update(readFileSync(file)).digest('base64')}`;
  const url = `https://cdn.jsdelivr.net/gh/${REPO}@${sha}/${file}`;

  log(`\n  ${file}`);
  log(`    hostedLocation : ${url}`);
  log(`    integrityHash  : ${sri}`);
  log(`    script tag     : <script defer src="${url}"></script>`);
}

log('\n─────────────────────────────────────────────');
log(`  version   : ${version}`);
log(`  short SHA : ${sha.slice(0, 7)}`);
log('  Pinned URLs are immutable — no jsDelivr purge needed.');
log(`  At go-live, swap to @${BRANCH} (and purge on each push).`);
log('');

// 4. Point Webflow at the new SHA.
//
// Registering the same displayName with a new version adds a version under the
// existing script id, so the id stays stable and only the pin moves. Then the
// applied lists are re-PUT at that version. Endpoints per
// developers.webflow.com/data/docs/working-with-custom-code.
//
// Needs a token with custom_code:write (plus sites/pages read+write):
//   WEBFLOW_API_TOKEN=… pnpm deploy "msg"
const token = process.env.WEBFLOW_API_TOKEN;

if (!token) {
  log('⚠ WEBFLOW_API_TOKEN not set — Webflow still points at the PREVIOUS SHA.');
  log('  Set it to update the pin automatically, or update the registered');
  log(`  scripts (${BUNDLES.map(({ displayName }) => displayName).join(', ')}) by hand.`);
  log('');
} else {
  const api = async (method, path, body) => {
    const response = await fetch(`https://api.webflow.com/v2${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Webflow ${method} ${path} → ${response.status} ${await response.text()}`);
    }

    return response.json();
  };

  log('▶ Updating Webflow…');

  const applied = new Map(); // target key → scripts[] to PUT

  for (const bundle of BUNDLES) {
    const { id } = await api('POST', `/sites/${WEBFLOW_SITE_ID}/registered_scripts/hosted`, {
      displayName: bundle.displayName,
      hostedLocation: `https://cdn.jsdelivr.net/gh/${REPO}@${sha}/${bundle.file}`,
      integrityHash: `sha384-${createHash('sha384').update(readFileSync(bundle.file)).digest('base64')}`,
      version,
      canCopy: true,
    });

    // PUT replaces the whole list, so group everything bound for the same
    // target and send it in one request.
    const key = bundle.target === 'site' ? `/sites/${WEBFLOW_SITE_ID}` : `/pages/${bundle.pageId}`;
    applied.set(key, [...(applied.get(key) || []), { id, location: 'footer', version }]);

    log(`  registered ${bundle.displayName} @ ${version}`);
  }

  for (const [key, scripts] of applied) {
    await api('PUT', `${key}/custom_code`, { scripts });
    log(`  applied to ${key}`);
  }

  log('▶ Webflow now points at the new SHA. Publish to see it live.');
  log('');
}
