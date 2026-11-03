/**
 * `npm start` step 2 (and `npm run pro:local` step 0): make node_modules match
 * package-lock.json, fetching fresh package data, before anything runs.
 *
 * John, 2026-11-02: "i expect npm start to start with a fresh environment i'm
 * sick of stale caches". npm run pro:local failed on his PC with
 * "ETARGET No matching version found for esbuild@0.28.2" -- a version
 * published three months earlier. npm had answered from an old copy of the
 * package's version list in its cache.
 *
 * What it does:
 *   - Fingerprints package-lock.json (sha256) and compares it with the
 *     fingerprint saved after the last install it ran.
 *   - Same fingerprint and node_modules present: nothing to do, ~0 s.
 *   - Otherwise (new pull, changed lockfile, missing node_modules):
 *     `npm install --prefer-online`. --prefer-online makes npm re-check every
 *     package's version list with the registry instead of trusting the cache,
 *     which is exactly the stale data behind ETARGET.
 *
 * Skipped on CI and test servers (WB_NO_OPEN=1), which run `npm ci` themselves.
 * A failed install stops the start with npm's own message: running on
 * mismatched packages is how stale environments happen.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockFile = path.join(root, 'package-lock.json');
const modulesDir = path.join(root, 'node_modules');
const stampFile = path.join(modulesDir, '.wb-installed-lock-sha256');

/** Print one line with this script's prefix. */
function say(message) {
  console.log(`[ensure-installed] ${message}`);
}

/** sha256 of the lockfile, or null when there is none. */
function lockFingerprint() {
  try {
    return createHash('sha256').update(fs.readFileSync(lockFile)).digest('hex');
  } catch {
    return null;
  }
}

/** The fingerprint saved after the last install, or null. */
function installedFingerprint() {
  try {
    return fs.readFileSync(stampFile, 'utf8').trim();
  } catch {
    return null;
  }
}

if (process.env.CI || process.env.WB_NO_OPEN === '1') {
  say('test or CI server: not installing');
  process.exit(0);
}

const wanted = lockFingerprint();
if (wanted && fs.existsSync(modulesDir) && installedFingerprint() === wanted) {
  say('packages match package-lock.json');
  process.exit(0);
}

say('packages do not match package-lock.json: npm install --prefer-online (fresh version data, not the cache)...');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npm, ['install', '--prefer-online', '--no-audit', '--no-fund'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.status !== 0) {
  say('npm install failed (see above). Not starting on mismatched packages.');
  process.exit(result.status ?? 1);
}

// Fingerprint the lockfile as it is now: npm install may have rewritten it.
const after = lockFingerprint();
if (after) fs.writeFileSync(stampFile, after + '\n');
say('packages installed and match package-lock.json');
