/**
 * #991 — release.mjs corrupted package-lock.json.
 *
 * The bump was a whole-file, unanchored string replace:
 *
 *   before.split(`"version": "${pkg.version}"`).join(`"version": "${next}"`)
 *
 * In a lockfile, `"version": "x.y.z"` appears once per INSTALLED PACKAGE, so
 * every dependency that happened to sit on the project's own version got bumped
 * with it. Measured going 4.0.0 -> 4.0.1: seven fields changed where two should
 * have. The five wrong ones (resolve-from, has-flag, path-exists,
 * escape-string-regexp, is-promise) are real packages genuinely published at
 * 4.0.0, and their `integrity` hashes still describe the 4.0.0 tarball — so the
 * lockfile claimed a version whose hash cannot match and `npm ci` rejected the
 * tree.
 *
 * WHY THIS TEST RUNS THE REAL SCRIPT
 *
 * Asserting on the repo's own package-lock.json proves nothing: whether it is
 * corrupt depends on which versions the dependency tree happens to hold on the
 * day of the release. This builds a throwaway project — the REAL
 * scripts/release.mjs copied into a fake tree whose lockfile deliberately holds
 * dependencies at the project's version — runs the release for real, and diffs
 * every `version` field in the lockfile before and after. Exactly two may move.
 *
 * SEEN TO FAIL (docs/standards/A-GATE-MUST-BE-SEEN-TO-FAIL.md): against the
 * unfixed release.mjs this test reports 3 extra changed paths —
 * /packages/node_modules/has-flag/version, /packages/node_modules/resolve-from/version
 * and /packages/node_modules/path-exists/version — all 4.0.0 -> 4.0.1.
 */

import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

const START = '4.0.0';
const NEXT = '4.0.1';

/** A lockfile shaped like a real one: the project, plus deps ON the project's version. */
function fixtureLock() {
  return {
    name: 'wb-release-fixture',
    version: START,
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': { name: 'wb-release-fixture', version: START, license: 'MIT' },
      'node_modules/has-flag': {
        version: '4.0.0',
        resolved: 'https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz',
        integrity: 'sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17AQRgWRhAwHW4nOtdrvsevd8w1IQBIfw2npkbdD8kAlyOEAj1w==',
      },
      'node_modules/resolve-from': {
        version: '4.0.0',
        resolved: 'https://registry.npmjs.org/resolve-from/-/resolve-from-4.0.0.tgz',
        integrity: 'sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==',
      },
      'node_modules/path-exists': {
        version: '4.0.0',
        resolved: 'https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz',
        integrity: 'sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==',
      },
      'node_modules/semver': {
        version: '7.6.0',
        resolved: 'https://registry.npmjs.org/semver/-/semver-7.6.0.tgz',
        integrity: 'sha512-EnwXhrlwXMk9gKu5/flx5sv/an57ANRngk0XJqbIeckitWvUlgLLcQ8HG/E1oxvE4iP5N0STrhTgg9wsUmT3ww==',
      },
    },
  };
}

/**
 * A throwaway project containing the real script and just enough around it for
 * its two gates to pass: a ratchet that exits 0, a data/releases.json entry naming the next
 * version, and a version stamper that regenerates src/core/version.js.
 */
function buildFakeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'wb-release-991-'));
  for (const sub of ['scripts/lib', 'data', '.husky', 'src/core']) {
    mkdirSync(join(dir, sub), { recursive: true });
  }

  // The script under test — the real one, not a copy of its logic.
  copyFileSync(join(ROOT, 'scripts/release.mjs'), join(dir, 'scripts/release.mjs'));
  copyFileSync(join(ROOT, 'scripts/lib/next-version.mjs'), join(dir, 'scripts/lib/next-version.mjs'));

  // ...with EVERY scripts/lib/*.mjs beside it, not a hand-listed few. release.mjs
  // gained an import (#1178's full-run-counter) and this fixture died with
  // ERR_MODULE_NOT_FOUND, which the ratchet scored as a NEW failure and which
  // aborted the 4.0.6 release. A fixture that lists its dependencies by name is
  // a gate that breaks on the next import.
  mkdirSync(join(dir, 'scripts/lib'), { recursive: true });
  for (const name of readdirSync(join(ROOT, 'scripts/lib'))) {
    if (name.endsWith('.mjs')) copyFileSync(join(ROOT, 'scripts/lib', name), join(dir, 'scripts/lib', name));
  }

  // Gate 1: the ratchet. Nothing to ratchet here, so it passes.
  writeFileSync(join(dir, '.husky/test-ratchet.mjs'), 'process.exit(0);\n');

  // Gate 2: data/releases.json must name the version being released.
  writeFileSync(
    join(dir, 'data/releases.json'),
    JSON.stringify({ releases: [{ version: NEXT, date: '', summary: '', items: [{ kind: 'fixed', html: 'x' }] }] }) + '\n'
  );

  // The stamper, reduced to the one surface release.mjs verifies afterwards.
  writeFileSync(
    join(dir, 'scripts/stamp-version.js'),
    [
      "import fs from 'node:fs';",
      "import path from 'node:path';",
      "import { fileURLToPath } from 'node:url';",
      "const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');",
      "const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));",
      "fs.mkdirSync(path.join(root, 'src', 'core'), { recursive: true });",
      "fs.writeFileSync(path.join(root, 'src', 'core', 'version.js'),",
      "  'export const VERSION = ' + JSON.stringify({ version: pkg.version }, null, 2) + ';');",
      '',
    ].join('\n')
  );

  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'wb-release-fixture',
        version: START,
        type: 'module',
        private: true,
        dependencies: { 'has-flag': '^4.0.0', 'resolve-from': '^4.0.0' },
      },
      null,
      2
    ) + '\n'
  );

  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify(fixtureLock(), null, 2) + '\n');
  return dir;
}

/** Every `version` field in the tree, keyed by its JSON path. */
function versionFields(node: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (!node || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = `${prefix}/${key}`;
    if (key === 'version' && typeof value === 'string') out[path] = value;
    else if (value && typeof value === 'object') versionFields(value, path, out);
  }
  return out;
}

function changedPaths(before: Record<string, string>, after: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((k) => before[k] !== after[k]).sort();
}

/**
 * #1203: release.mjs takes the machine-wide suite lock (#1128). Inside a gate or
 * ship run that lock is already held -- by the very run executing this test -- so
 * a fixture sharing the machine's lock directory waited up to 85 minutes for it.
 * execFileSync blocks the worker, so Playwright's timeout could not fire either:
 * the test never reported, the ratchet counted one result short, and every full
 * run since 2026-09-17 was killed as a HANG after finishing.
 *
 * So the fixture gets a lock directory of its own, and a bound. And this test
 * holds a suite lock itself for the whole run, so the gate's condition is
 * reproduced every time, not only when a gate happens to be running it.
 */
const RELEASE_TIMEOUT_MS = 120_000;

test('a release bumps only the project\'s own version fields in package-lock.json', async () => {
  const { withMachine } = await import(pathToFileURL(join(ROOT, 'scripts/lib/hold-machine.mjs')).href);
  const heldLockDir = mkdtempSync(join(tmpdir(), 'wb-held-lock-'));
  const fixtureLockDir = mkdtempSync(join(tmpdir(), 'wb-fixture-lock-'));
  const priorLockDir = process.env.WB_TEST_LOCK_DIR;
  process.env.WB_TEST_LOCK_DIR = heldLockDir;
  let releaseHolder: (v?: unknown) => void = () => {};
  let holder: Promise<{ held: boolean; why?: string }> = Promise.resolve({ held: false });
  const acquired = new Promise<void>((onHeld) => {
    holder = withMachine(
      { root: ROOT, kind: 'suite', label: 'held by the running suite (#1203)', waitMs: 5_000, handleSignals: false },
      () => new Promise((resolve) => { releaseHolder = resolve; onHeld(); })
    );
  });
  const outcome = await Promise.race([acquired.then(() => null), holder]);
  expect(outcome, 'the test could not hold its own suite lock, so it would not reproduce the gate').toBeNull();

  const dir = buildFakeProject();
  try {
    const lockBefore = JSON.parse(readFileSync(join(dir, 'package-lock.json'), 'utf8'));
    const before = versionFields(lockBefore);

    // The fixture must actually contain the hazard, or a pass means nothing.
    const decoys = Object.entries(before).filter(
      ([p, v]) => v === START && p !== '/version' && p !== '/packages//version'
    );
    expect(
      decoys.length,
      'fixture is vacuous: no dependency sits on the project version, so nothing could be wrongly bumped'
    ).toBeGreaterThanOrEqual(2);

    let output = '';
    try {
      output = execFileSync(process.execPath, ['scripts/release.mjs'], {
        cwd: dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, WB_TEST_LOCK_DIR: fixtureLockDir },
        timeout: RELEASE_TIMEOUT_MS,
      });
    } catch (err: any) {
      const why = err.code === 'ETIMEDOUT' || err.signal
        ? `did not finish within ${RELEASE_TIMEOUT_MS / 1000}s -- most likely waiting for a machine lock it should not share (#1203)`
        : 'exited non-zero';
      throw new Error(`release.mjs ${why} in the fixture project:\n${err.stdout || ''}\n${err.stderr || ''}`);
    }

    const lockAfter = JSON.parse(readFileSync(join(dir, 'package-lock.json'), 'utf8'));
    const after = versionFields(lockAfter);
    const changed = changedPaths(before, after);

    expect(
      changed,
      `release.mjs changed the wrong version fields.\n${changed
        .map((p) => `  ${p}: ${before[p]} -> ${after[p]}`)
        .join('\n')}\n\nrelease output:\n${output}`
    ).toEqual(['/packages//version', '/version']);

    // ...and it really did release: the two that moved landed on the new version.
    expect(lockAfter.version).toBe(NEXT);
    expect(lockAfter.packages[''].version).toBe(NEXT);
    expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version).toBe(NEXT);

    // Integrity hashes describe a tarball. If a version moved under one, the
    // lockfile is lying and `npm ci` rejects the tree.
    for (const [name, entry] of Object.entries<any>(lockAfter.packages)) {
      if (!name) continue;
      expect(entry, `${name} was rewritten`).toEqual((lockBefore.packages as any)[name]);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
    releaseHolder();
    await holder;
    if (priorLockDir === undefined) delete process.env.WB_TEST_LOCK_DIR;
    else process.env.WB_TEST_LOCK_DIR = priorLockDir;
    rmSync(heldLockDir, { recursive: true, force: true });
    rmSync(fixtureLockDir, { recursive: true, force: true });
  }
});

test('no release script bumps a version by whole-file string replacement', () => {
  const scripts = [
    'scripts/release.mjs',
    'packages/create-wb-starter/template/scripts/release.mjs',
  ].filter((rel) => existsSync(join(ROOT, rel)));

  expect(scripts.length, 'found no release scripts to check — this gate is measuring nothing').toBeGreaterThan(0);

  // `.split(`"version": "..."`).join(...)` or a global replace of the same:
  // both rewrite every package in the lockfile, not the project's own field.
  const UNANCHORED = /(?:split|replace|replaceAll)\s*\(\s*(?:`|'|")"version"\s*:/;

  // Comments are allowed to quote the old line — both scripts explain what they
  // stopped doing, and a gate that cannot tell code from its own postmortem
  // would force the explanation to be deleted.
  const isComment = (line: string) => /^\s*(\/\/|\*|\/\*)/.test(line);

  const offenders: string[] = [];
  for (const rel of scripts) {
    const source = readFileSync(join(ROOT, rel), 'utf8');
    const hit = source
      .split('\n')
      .findIndex((line) => !isComment(line) && UNANCHORED.test(line));
    if (hit >= 0) offenders.push(`${rel}:${hit + 1}`);
  }

  expect(
    offenders,
    `these bump the version with an unanchored whole-file replace (#991):\n${offenders.join('\n')}`
  ).toEqual([]);
});
