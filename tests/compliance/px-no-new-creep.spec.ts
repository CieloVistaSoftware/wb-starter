/**
 * #294: font-size/padding/margin/gap/border-radius/width/height that should
 * SCALE with the user's browser font-size setting must use rem, not px.
 *
 * A full project-wide conversion (774 likely-convert occurrences across ~40
 * files as of this writing — see `node scripts/audit-px-units.mjs`) is real
 * design + verification work, not a mechanical pass; not attempted here.
 *
 * This gate implements the acceptance criteria's minimum bar: no NEW px
 * creep. It re-runs the audit and fails only if the LIKELY_CONVERT count
 * increases past the recorded baseline — existing px is grandfathered in,
 * new px in a convertible context is not.
 *
 * To lower the baseline (after converting some files to rem), re-run the
 * audit script and update BASELINE below to match the new, lower count.
 */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASELINE = 774;

test('audit: no new px creep in convertible contexts (#294)', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/audit-px-units.mjs')], { cwd: ROOT });
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/px-audit.json'), 'utf8'));
  const current = report.totals.LIKELY_CONVERT;

  expect(
    current,
    `px usage in convertible contexts (font-size/padding/margin/gap/border-radius/width/height/position) grew from ${BASELINE} to ${current}. ` +
      `New CSS/inline styles should use rem, not px, for sizing that should scale with the user's font-size preference (#294). ` +
      `Run \`node scripts/audit-px-units.mjs\` to see what's new. If this growth is legitimate (e.g. a genuinely fixed-pixel value), ` +
      `raise BASELINE in this test to the new count.`
  ).toBeLessThanOrEqual(BASELINE);
});
