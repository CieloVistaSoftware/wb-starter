import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * #1067: the DEPLOYED badge read "v4.0.2 *". Its version.js was written on the
 * committer's machine before the commit existed, so it named the parent commit
 * and recorded `dirty: true` for that machine's unrelated working tree (another
 * session's ~300 files) -- an asterisk on a site built from a clean checkout.
 *
 * Since #1131 the deployed version.js is written by
 * .github/workflows/stamp-version-on-main.yml, on a clean checkout of main.
 * This runs stamp-version.js exactly that way -- in a fresh clone -- and holds
 * what the site then serves: not dirty, branch main, and the commit it names is
 * the code commit the clone is at. (A file cannot carry the hash of the commit
 * that contains it; the stamp commit that follows touches only generated files.)
 */
const root = process.cwd();
const git = (cwd: string, ...a: string[]) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function stampIn(clone: string) {
  execFileSync(process.execPath, ['scripts/stamp-version.js'], { cwd: clone, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const src = fs.readFileSync(path.join(clone, 'src', 'core', 'version.js'), 'utf8');
  return JSON.parse(src.match(/VERSION = ({[\s\S]*?});/)![1]);
}

test('main stamps its own version without --local (#1067)', () => {
  const wf = fs.readFileSync(path.join(root, '.github', 'workflows', 'stamp-version-on-main.yml'), 'utf8');
  expect(wf).toMatch(/^\s*node scripts\/stamp-version\.js\s*$/m);
});

test('a clean checkout stamps dirty:false and names the commit it is at (#1067)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-1067-'));
  const clone = path.join(tmp, 'wb-starter');
  try {
    git(tmp, 'clone', '-q', '--no-hardlinks', '--depth', '1', `file://${root.split(path.sep).join('/')}`, clone);
    const head = git(clone, 'rev-parse', '--short', 'HEAD');

    const clean = stampIn(clone);
    expect(clean.dirty, 'a clean checkout must not stamp the asterisk').toBe(false);
    expect(clean.commit, 'the version names the commit being built').toBe(head);

    // Sensitivity: the flag is not hard-wired. One real uncommitted edit flips it.
    fs.appendFileSync(path.join(clone, 'README.md'), '\nuncommitted\n');
    expect(stampIn(clone).dirty, 'an uncommitted edit must set dirty').toBe(true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
