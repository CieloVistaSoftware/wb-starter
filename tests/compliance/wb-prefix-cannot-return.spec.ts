import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import * as path from 'path';

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
 */

const ROOT = process.cwd();

/** Ceilings measured after the 4.0.0 sweep. Lower these; never raise them. */
const CEILING: Record<string, number> = {
  TAG: 0,
  CLASS: 500,
  MODULE: 5000,
  DATA: 200,
  PACKAGE: 5200,
};

interface Counts { [k: string]: number }

function runAudit(): { counts: Counts; output: string } {
  let output: string;
  try {
    output = execFileSync(
      process.execPath,
      [path.join(ROOT, 'scripts/audit-wb-prefix.mjs')],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
    );
  } catch (err: any) {
    // The auditor exits non-zero while any component tag survives. That is a
    // finding, not a crash -- its stdout is still the report we need.
    output = (err.stdout || '') + (err.stderr || '');
  }

  const counts: Counts = {};
  for (const line of output.split(/\r?\n/)) {
    const m = /^(TAG|CLASS|MODULE|DATA|PACKAGE)\s+(\d+)/.exec(line.trim());
    if (m) counts[m[1]] = Number(m[2]);
  }
  return { counts, output };
}

test.describe('the wb- prefix cannot return', () => {
  const { counts, output } = runAudit();

  test('the audit produced counts at all', () => {
    // Without this, a broken auditor would make every assertion below
    // vacuously pass -- the same failure mode as the zeroed
    // site-generator-result.json that kept 57 tests dormant (#837).
    expect(
      Object.keys(counts).length,
      `audit-wb-prefix.mjs produced no parseable counts.\n\n${output.slice(0, 2000)}`,
    ).toBe(5);
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
