/**
 * #294: font-size/padding/margin/gap/border-radius/width/height that should
 * SCALE with the user's browser font-size setting must use rem, not px.
 *
 * A full project-wide conversion of every convertible property (padding,
 * margin, gap, border-radius, width/height, etc.) is real design +
 * verification work, not a mechanical pass; not fully attempted here.
 * `font-size` specifically WAS fully swept (every literal `font-size:Npx`
 * across src/pages/demos/docs converted to rem — see the dedicated
 * zero-tolerance gate in `font-size-no-px.spec.ts`), which is why the
 * baseline below dropped from the original audit's 774.
 *
 * This gate implements the acceptance criteria's minimum bar for the
 * remaining (non-font-size) properties: no NEW px creep. It re-runs the
 * audit and fails only if the LIKELY_CONVERT count increases past the
 * recorded baseline — existing px is grandfathered in, new px in a
 * convertible context is not.
 *
 * To lower the baseline (after converting more files to rem), re-run the
 * audit script and update BASELINE below to match the new, lower count.
 */
import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Re-measured, not raised. 730 was recorded in 81342c93, but running this
// same audit script against that commit's own committed tree reports 780 --
// the number was taken from a working copy, not from anything in git, so the
// gate had been failing since the day it was set and could not tell creep
// from its own miscount. HEAD measures 778 (2 below that commit). Keep
// lowering it as files convert; never raise it to admit new px.
// 777: b31bd387 set 778 but its own tree (and d3dedbf3) measured 783 -- the
// dialog size widths, a form/select radius added since were px. Those six
// now use rem (dialog.css, form.css, input.css), which is 777 in git.
// 540: the #779 move of inline styles into stylesheets carried their px with
// it (855 measured), and those declarations -- plus the rest of the files they
// landed in -- were converted to rem rather than admitted. Measured, not guessed.
// 545: five of those were the card size minimums (card.css), which went back
// to px -- a layout floor that grows with a phone's 112.5% root overflows the
// screen. The reason is written beside them.
// 508: 540 measured on 2026-10-08, then pages/themes-showcase.css converted (32
// values) with every element on /?page=themes computing the same at 16px.
// 491: pages/behaviors.css converted (17 values: radii and two 600px caps),
// the first 6,000 elements of /?page=behaviors computing the same at 16px.
const BASELINE = 296;

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
