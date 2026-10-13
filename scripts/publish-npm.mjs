/**
 * publish-npm.mjs -- publish main to npm under the badge's number (#1860)
 *
 * John, 2026-10-13: npm should have what the live site serves. Run by
 * .github/workflows/publish-npm.yml after the stamp workflow has stamped main:
 * the number is the one the site's badge shows (versionNumber() over the
 * stamped src/core/version.js). It is written into package.json for the publish
 * only -- nothing is committed back.
 *
 * It ends red unless npm then serves that number, so a run that published
 * nothing never reads as a release (#1517: the npm step it replaces was green
 * for days while it published nothing).
 *
 *   node scripts/publish-npm.mjs          # publish what is missing
 *   node scripts/publish-npm.mjs --dry    # say what it would do, publish nothing
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../src/core/version.js';
import { versionNumber } from '../src/core/version-number.js';
import { publishPlan } from './lib/npm-publish-plan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The root package and every package under packages/ that is not private.
const PACKAGES = ['.', ...readdirSync(path.join(ROOT, 'packages'))
  .map((d) => path.join('packages', d))
  .filter((d) => existsSync(path.join(ROOT, d, 'package.json')))];
const DRY = process.argv.includes('--dry');

const npm = (args, cwd = ROOT) => execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

/** Every version npm has for a package; none when npm has never seen it. */
function versionsOnNpm(name) {
  try {
    const out = npm(['view', name, 'versions', '--json']);
    const list = JSON.parse(out || '[]');
    return Array.isArray(list) ? list : [list];
  } catch {
    return [];
  }
}

/** npm's registry can take a moment to list a new version; ask for up to a minute. */
function waitForNpm(name, version) {
  for (let i = 0; i < 12; i++) {
    if (versionsOnNpm(name).includes(version)) return true;
    execFileSync('sleep', ['5']);
  }
  return false;
}

const wanted = versionNumber(VERSION).number;
console.log(`main is ${wanted} (stamped ${VERSION.commit}, release ${VERSION.release} + ${VERSION.sinceRelease} pushes)`);

let failed = 0;
for (const dir of PACKAGES) {
  const cwd = path.join(ROOT, dir);
  const { name, private: isPrivate } = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  // npm's own "never publish" marker (packages/site-migrate is one).
  if (isPrivate) {
    console.log(`– ${name}: private, not published`);
    continue;
  }
  const plan = publishPlan(wanted, versionsOnNpm(name));
  if (plan.action === 'skip') {
    console.log(`✓ ${name}: ${plan.why}`);
    continue;
  }
  if (DRY) {
    console.log(`… ${name}: would publish ${wanted} (${plan.why})`);
    continue;
  }
  console.log(`➕ ${name}: publishing ${wanted}`);
  try {
    npm(['pkg', 'set', `version=${wanted}`], cwd);
    npm(['publish', '--access', 'public', '--ignore-scripts'], cwd);
  } catch (err) {
    failed++;
    console.error(`::error::${name}@${wanted} was not published: ${err.message.split('\n')[0]}`);
    continue;
  }
  if (waitForNpm(name, wanted)) {
    console.log(`✓ ${name}@${wanted} is on npm`);
  } else {
    failed++;
    console.error(`::error::npm accepted ${name}@${wanted} but does not list it after a minute`);
  }
}

if (failed) process.exit(1);
