/**
 * NOTHING REACHES THE PUBLIC SITE UNNAMED
 * =======================================
 * #1076. GitHub Pages serves this repo straight from main — build_type
 * "legacy", source {branch: main, path: "/"} — with no deploy workflow, because
 * deploying is not an action anyone takes. A push to main IS the publish.
 *
 * The version, meanwhile, moved only when someone ran `npm run release`. Two
 * triggers, one automatic and one manual, so everything in between went live
 * under the PREVIOUS number. Measured when this was filed: 9 commits sat after
 * tag v4.0.2 and all 9 declared `"version": "4.0.2"`. That is not an absent
 * version, it is a collided one — ten code states answering to a single string,
 * so "is the #1067 fix in 4.0.2?" had two correct opposite answers (the tag says
 * no, the site displaying v4.0.2 says yes).
 *
 * WHY THE HOOK IS EXECUTED HERE, NOT READ
 * ---------------------------------------
 * A spec that greps `.husky/pre-push` for a phrase passes on a hook that has
 * been broken into a no-op, which is precisely the failure #1049 catalogued:
 * four checks that had been matching nothing for months and therefore passing
 * forever. So the hook is RUN, in a throwaway repository whose git state this
 * test creates.
 *
 * Throwaway, specifically, because the alternative — running it against this
 * repo — makes the verdict a function of whether someone happens to have
 * shipped recently. #1061 is the cautionary tale: fix-viewer.spec.ts scored
 * 14/28 one morning and 0/28 that afternoon with no code change, because its
 * result depended on live git history. A gate whose answer moves on its own is
 * untrustworthy in both directions, including when it is green.
 */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM: this repo runs specs as modules, so __dirname does not exist. Using it
// threw at COLLECTION time, which Playwright reports as 0 tests and a silent
// non-failure -- the #975 shape exactly. Caught only by fault-injecting this
// gate; a spec that is never collected passes forever.
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOOK = path.join(REPO, '.husky', 'pre-push');

/** A one-commit git repo we fully control. Returns its path. */
function scratchRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-prepush-'));
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.invalid');
  git('config', 'user.name', 'gate');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'one\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'first');
  return dir;
}

/** Feed the hook the stdin line git would, and report its exit code. */
function runHook(cwd: string, remoteRef: string): { code: number; err: string } {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  const zero = '0'.repeat(40);
  try {
    execFileSync('sh', [HOOK, 'origin', 'git@example.invalid:x/y.git'], {
      cwd,
      input: `${remoteRef} ${sha} ${remoteRef} ${zero}\n`,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { code: 0, err: '' };
  } catch (e: any) {
    return { code: e.status ?? -1, err: String(e.stderr ?? '') };
  }
}

test.describe('#1076 — a push to main must carry a version', () => {
  test('the pre-push hook exists and is the guard', () => {
    expect(fs.existsSync(HOOK), `${HOOK} is missing — nothing guards the deploy`).toBe(true);
  });

  test('git is configured to run the hook at all', () => {
    // husky sets core.hooksPath. Without it the file above is decoration:
    // present, correct, and never executed — the same shape as the stylesheet
    // that was loaded by nothing (#1008).
    //
    // ASSERT THE GUARANTEE, NOT THE LOCATION.
    //
    // The question is "will git run our hooks". It was asked as "does
    // core.hooksPath equal THIS directory's .husky", with the directory taken
    // from this file's own path — and the commit gate runs the suite from a temp
    // copy of the staged tree (#1065). There, that compared the real checkout's
    // absolute hooksPath against a temp path:
    //
    //   Expected: "…\Temp\wb-gate-mtvxwtev-17212\.husky"
    //   Received: "…\Downloads\AI\wb-starter\.husky"
    //
    // It passed when run directly and could never pass in the gate, so every
    // commit was refused on it and two releases died there (#1104). A first
    // attempt asked git for the work tree and skipped when there was none — but
    // the copy IS a work tree, so the skip never fired and it failed identically.
    //
    // So compare nothing about location. hooksPath is set, it names a `.husky`
    // directory, and the hook this file is about is in it. True in the
    // developer's checkout and in any copy of it; false exactly when husky is
    // not wired up, which is the failure worth catching — the #1008 shape, a
    // file that is present, correct, and never executed.
    const hooksPath = execFileSync('git', ['config', 'core.hooksPath'], {
      cwd: REPO,
      encoding: 'utf8',
    }).trim();

    expect(hooksPath, 'core.hooksPath is unset — .husky/pre-push is decoration').not.toBe('');
    expect(path.basename(hooksPath), `core.hooksPath is "${hooksPath}", not a .husky directory`).toBe('.husky');
    expect(
      fs.existsSync(path.join(hooksPath, 'pre-push')),
      `${hooksPath} carries no pre-push hook, so nothing guards the deploy`,
    ).toBe(true);
  });

  test('an untagged push to main is REFUSED', () => {
    const dir = scratchRepo();
    try {
      const { code, err } = runHook(dir, 'refs/heads/main');
      expect(code, 'unnamed code would have reached the published site').toBe(1);
      expect(err).toContain('PUSH REFUSED');
      // The refusal has to name the way out, or it becomes something to route
      // around with --no-verify, which is how the #743 hook died.
      expect(err).toContain('npm run ship');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a tagged push to main is allowed', () => {
    const dir = scratchRepo();
    try {
      execFileSync('git', ['tag', '-a', 'v9.9.9', '-m', '9.9.9'], { cwd: dir, stdio: 'pipe' });
      expect(runHook(dir, 'refs/heads/main').code, 'a released batch must ship').toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a feature branch is untouched — only main is published', () => {
    const dir = scratchRepo();
    try {
      expect(runHook(dir, 'refs/heads/wip/anything').code).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('`npm run ship` is wired, because the refusal tells you to run it', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
    expect(pkg.scripts.ship, 'the hook names a command that does not exist').toBeTruthy();
    expect(fs.existsSync(path.join(REPO, 'scripts', 'ship.mjs'))).toBe(true);
    expect(fs.existsSync(path.join(REPO, 'scripts', 'whats-new-entry.mjs'))).toBe(true);
  });

  test('the shipped version is described on the What\'s New page', () => {
    // release.mjs gate 2 enforces this at release time; asserted here so a
    // hand-edit that removes the section is caught too. This is the whole point
    // of a batch having a name: you can look up what is in it.
    const version = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).version;
    const page = fs.readFileSync(path.join(REPO, 'pages', 'whats-new.html'), 'utf8');
    const id = `whats-new-${version.replace(/\./g, '-')}`;
    expect(
      page.includes(`id="${id}"`) || page.includes(`>${version}<`),
      `pages/whats-new.html does not say what is in ${version}`,
    ).toBe(true);
  });
});
