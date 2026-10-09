import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { suiteEnv } from '../../scripts/lib/suite-env.mjs';

/**
 * The wb- prefix cannot come back.
 *
 * 4.0.0 removed 1,166 component tags and renamed 32,337 classes. Without a
 * gate, that reverses one careless commit at a time -- and it reverses
 * SILENTLY, which is the whole problem with this class of defect: a
 * hyphenated tag with no registration is an HTMLUnknownElement. It parses,
 * renders inline and unstyled, attaches no behavior, and throws no error.
 * Nothing fails. The page just quietly stops working.
 *
 * That is exactly how the first removal pass left 1,166 of them behind and
 * nobody noticed.
 *
 * RATCHET, NOT A CLIFF
 *
 * Only TAG is asserted at zero, because it is the category that is provably
 * finished and provably a defect. The other categories have real budgets that
 * are meant to come DOWN, never up:
 *
 *   PACKAGE   the project's own name (wb-starter) -- permanent, not a defect
 *   MODULE    src/wb-viewmodels/ etc. -- renaming reaches every import
 *   CLASS     leftovers where a class name collides with a module name
 *   DATA      internal runtime attributes
 *
 * Locking those at a ceiling means the number can only improve. Lower the
 * ceiling whenever it drops; never raise it to make a build pass. Raising it
 * is the moment this gate stops meaning anything.
 *
 * THE AUDIT ONLY COUNTS SOURCE (#1300)
 *
 * It used to count whatever was on disk, so its answer depended on what the
 * last run left behind: data/fixes-cache.json and data/issues-cache.json --
 * gitignored caches of GitHub issue text, and issues about the removed tags
 * QUOTE them -- reported 700 surviving component tags in a tree where none
 * existed. Four generated files had already been added to a per-name
 * deny-list one at a time (#960, #1027) as each one broke this gate.
 *
 * The file list now comes from git, and data/ (output, by TIER1-LAWS §12) is
 * not source. The fixture tests at the bottom hold that: a gitignored cache
 * cannot change any count, and a real tag in a tracked file is still caught.
 */

const ROOT = process.cwd();

/**
 * Ceilings re-measured in #1300, after the audit stopped counting generated
 * data/ output. The numbers dropped (MODULE 2,542 -> 1,125) because thousands
 * of those hits were audit REPORTS about wb- strings, not wb- strings in
 * source. Same rule as before: lower these, never raise them.
 *
 * PACKAGE 900 -> 855 (#1244): the hero gallery's 60 playground links are
 * root-relative now that refs-resolve reads a fragment's links from the site
 * root; the new Introduction page names the project 15 times of that back.
 */
const CEILING: Record<string, number> = {
  TAG: 0,
  CLASS: 200,
  MODULE: 1300,
  DATA: 60,
  PACKAGE: 855,
};

/**
 * The scan must be big enough to mean something. An audit that reads nothing
 * reports TAG 0 and meets every ceiling -- a perfect score that only says the
 * scanner broke, which is how the zeroed site-generator-result.json kept 57
 * tests dormant (#837). This repo tracks ~1,850 scannable files; a floor well
 * under that catches a broken file list without tripping on normal churn.
 */
const MIN_FILES_SCANNED = 1000;

interface Counts { [k: string]: number }

function runAudit(cwd = ROOT, args: string[] = []): { counts: Counts; scanned: number; output: string } {
  let output: string;
  try {
    output = execFileSync(
      process.execPath,
      [path.join(ROOT, 'scripts/audit-wb-prefix.mjs'), ...args],
      { cwd, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, env: suiteEnv(process.env) },
    );
  } catch (err: any) {
    // The auditor exits non-zero while any component tag survives. That is a
    // finding, not a crash -- its stdout is still the report we need.
    output = (err.stdout || '') + (err.stderr || '');
  }

  const counts: Counts = {};
  let scanned = -1;
  for (const line of output.split(/\r?\n/)) {
    const m = /^(TAG|CLASS|MODULE|DATA|PACKAGE)\s+(\d+)/.exec(line.trim());
    if (m) counts[m[1]] = Number(m[2]);
    const s = /^SCANNED\s+(\d+)/.exec(line.trim());
    if (s) scanned = Number(s[1]);
  }
  return { counts, scanned, output };
}

test.describe('the wb- prefix cannot return', () => {
  const { counts, scanned, output } = runAudit();

  test('the audit produced counts at all', () => {
    // Without this, a broken auditor would make every assertion below
    // vacuously pass -- the same failure mode as the zeroed
    // site-generator-result.json that kept 57 tests dormant (#837).
    expect(
      Object.keys(counts).length,
      `audit-wb-prefix.mjs produced no parseable counts.\n\n${output.slice(0, 2000)}`,
    ).toBe(5);
  });

  test('the audit actually read the repo', () => {
    expect(
      scanned,
      `audit-wb-prefix.mjs reported SCANNED ${scanned}, under the ${MIN_FILES_SCANNED}\n`
      + 'floor. A scan that reads (almost) nothing passes every check below for\n'
      + 'free. Check that `git ls-files --cached --others --exclude-standard`\n'
      + `works in this tree.\n\n${output.slice(0, 2000)}`,
    ).toBeGreaterThanOrEqual(MIN_FILES_SCANNED);
  });

  test('the audit found the project name, so its patterns still match', () => {
    // A minimum, not a maximum: PACKAGE counts `wb-starter`, which is the
    // project's own name and appears in package.json, the README and every
    // doc. Zero here means the regexes stopped matching, not that the name
    // is gone -- and a silently non-matching scanner reports a clean repo.
    expect(
      counts.PACKAGE,
      'PACKAGE is 0. `wb-starter` is the project\'s own name and cannot be\n'
      + 'absent from a real checkout, so the audit\'s patterns are matching\n'
      + `nothing.\n\n${output.slice(0, 2000)}`,
    ).toBeGreaterThan(0);
  });

  test('zero component tags survive', () => {
    expect(
      counts.TAG,
      'A <wb-*> tag is back. It registers nowhere, so it renders as an\n'
      + 'HTMLUnknownElement: inline, unstyled, no behavior, and NO ERROR.\n'
      + 'Run `node scripts/audit-wb-prefix.mjs` -- it lists every site.\n'
      + 'Fix with `node scripts/migrate-wb-tags.mjs --apply`.\n',
    ).toBe(0);
  });

  for (const category of ['CLASS', 'MODULE', 'DATA', 'PACKAGE']) {
    test(`${category} does not grow past its ceiling`, () => {
      expect(
        counts[category],
        `${category} rose to ${counts[category]}, above the ${CEILING[category]} ceiling.\n\n`
        + `These budgets exist to come down. If this grew because new wb- strings\n`
        + `were introduced, remove them. If it grew for a legitimate reason, say so\n`
        + `in the commit -- but raising the ceiling to go green is how this gate\n`
        + `stops meaning anything.\n`,
      ).toBeLessThanOrEqual(CEILING[category]);
    });
  }
});

/**
 * #1300 — the audit's answer must not depend on what is on disk.
 *
 * A throwaway repo, so nothing here touches this checkout's own caches (the
 * real data/fixes-cache.json is ~4MB of someone's machine-local work and must
 * not be clobbered to run a test).
 */
test.describe('#1300 — generated files cannot change the audit', () => {
  // Assembled, never written whole. This file is itself scanned by the audit,
  // so a literal component tag in a line of CODE here would be a finding --
  // the gate would fail on its own test fixture. (Comment lines are exempt:
  // the audit skips JS/TS comment openers, which is why the prose above can
  // name the tags at all.)
  const P = 'wb' + '-';
  const TAGGED = `<${P}select> and <${P}badge> are gone; see .${P}card`;
  let dir: string;

  test.beforeAll(() => {
    // realpath: on Windows os.tmpdir() can be an 8.3 short path, and git
    // reports the long form, so the two would not compare equal.
    dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'audit-1300-'));
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    // Source: no component tag, but it does name the project, so the scan has
    // something to find and cannot pass by matching nothing.
    fs.writeFileSync(path.join(dir, 'src', 'page.html'), `<article>${P}starter</article>\n`);
    fs.writeFileSync(path.join(dir, '.gitignore'), 'ignored-cache.json\n');
    // suiteEnv: a git hook exports GIT_DIR at the REAL repo, so an inherited
    // environment would make this `git init` reinitialise this checkout
    // (#1161). Identity goes through -c so no config file is written anywhere.
    const git = (...args: string[]) => execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8', env: suiteEnv(process.env), stdio: ['ignore', 'pipe', 'pipe'],
    });
    git('init', '-q');
    git('add', '-A');
  });

  test.afterAll(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('a gitignored cache full of component tags is not counted', () => {
    const cache = path.join(dir, 'ignored-cache.json');
    fs.writeFileSync(cache, JSON.stringify({ issues: [{ body: TAGGED }] }));
    const withCache = runAudit(ROOT, ['--dir', dir]);
    fs.rmSync(cache);
    const without = runAudit(ROOT, ['--dir', dir]);

    expect(
      withCache.counts.TAG,
      'A gitignored cache of GitHub issue text was counted as live component\n'
      + `tags. That is #1300: 700 phantom tags from data/fixes-cache.json and\n`
      + `data/issues-cache.json.\n\n${withCache.output.slice(0, 2000)}`,
    ).toBe(0);
    // Not just TAG: the same text drove CLASS/MODULE/PACKAGE over ceiling too,
    // so the whole report has to be identical with the file and without it.
    expect(withCache.counts, 'the audit\'s counts changed when an ignored file appeared')
      .toEqual(without.counts);
    expect(withCache.scanned, 'the audit read a different number of files')
      .toBe(without.scanned);
  });

  test('a component tag in a TRACKED file is still caught', () => {
    // The fix must not be "scan less until it passes". A real regression in
    // real source still has to fail, or #1300 traded a false alarm for a
    // blind gate.
    const live = path.join(dir, 'src', 'regression.html');
    fs.writeFileSync(live, `<${P}select></${P}select>\n`);
    execFileSync('git', ['-C', dir, 'add', '-A'], { env: suiteEnv(process.env) });
    const { counts: c, output: out } = runAudit(ROOT, ['--dir', dir]);
    fs.rmSync(live);
    execFileSync('git', ['-C', dir, 'add', '-A'], { env: suiteEnv(process.env) });

    expect(c.TAG, `a live <${P}select> in tracked source went unreported.\n\n${out.slice(0, 2000)}`)
      .toBeGreaterThan(0);
  });

  test('an empty index does not fake a clean repo', () => {
    // The commit gate runs scanners inside a `git worktree add --no-checkout`
    // copy, whose index is EMPTY -- every file there is "untracked" (#1161).
    // `git ls-files --cached` returns nothing there, so an audit built on it
    // scans 0 files and reports TAG 0: a clean bill of health for a tree it
    // never opened. The first pass at #1300 (94a4226b) had exactly this, and
    // it is the worse bug of the two, because it fails SILENT and GREEN.
    const bare = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'audit-1300-noindex-'));
    try {
      fs.mkdirSync(path.join(bare, 'src'), { recursive: true });
      fs.writeFileSync(path.join(bare, 'src', 'live.html'), `<${P}select></${P}select>\n`);
      execFileSync('git', ['-C', bare, 'init', '-q'], { env: suiteEnv(process.env), stdio: 'ignore' });
      // Deliberately no `git add`: files on disk, nothing in the index.
      const { counts: c, scanned: n, output: out } = runAudit(ROOT, ['--dir', bare]);

      expect(n, `the audit read ${n} files in a tree with an empty index.\n\n${out.slice(0, 2000)}`)
        .toBeGreaterThan(0);
      expect(
        c.TAG,
        `a live <${P}select> went unreported because the index was empty. That is\n`
        + 'the gate passing a tree it never looked at.\n\n' + out.slice(0, 2000),
      ).toBeGreaterThan(0);
    } finally {
      fs.rmSync(bare, { recursive: true, force: true });
    }
  });

  test('data/ is output, not source, even when git tracks it', () => {
    // data/priority-gate.json is a committed cache of GitHub issue text on
    // purpose: the pre-commit gate must not need the network (#743). Tracked,
    // generated, and correctly so -- so "tracked" alone is not enough.
    const generated = path.join(dir, 'data');
    fs.mkdirSync(generated, { recursive: true });
    fs.writeFileSync(path.join(generated, 'report.json'), JSON.stringify({ body: TAGGED }));
    execFileSync('git', ['-C', dir, 'add', '-A', '-f'], { env: suiteEnv(process.env) });
    const { counts: c, output: out } = runAudit(ROOT, ['--dir', dir]);
    fs.rmSync(generated, { recursive: true, force: true });
    execFileSync('git', ['-C', dir, 'add', '-A'], { env: suiteEnv(process.env) });

    expect(
      c.TAG,
      `a tag quoted in generated data/ output was counted as a live tag.\n\n${out.slice(0, 2000)}`,
    ).toBe(0);
  });
});
