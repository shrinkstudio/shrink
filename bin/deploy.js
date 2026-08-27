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
const FILES = ['dist/index.js', 'dist/list.js'];

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
