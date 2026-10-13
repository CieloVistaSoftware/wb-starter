/**
 * #294: font-size/padding/margin/gap/border-radius/width/height that should
 * SCALE with the user's browser font-size setting must use rem, not px.
 *
 * Every convertible px in src/ is now rem (batches through #1865 and its
 * follow-up), so this gate is zero-tolerance: it re-runs the audit and fails
 * on any px in a convertible context (font-size, padding, margin, gap,
 * border-radius, width/height, position, line-height; >2px; not in a comment;
 * not a 999px pill radius).
 *
 * px that genuinely has to stay px says so on its own line, with the reason:
 *   font-size: max(16px, 1em); /* px-ok: iOS zooms an input under 16 device px *\/
 * The audit lists those under DEVICE_PX in data/px-audit.json with their
 * reasons, so every exception is visible in one place.
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
// 57: the audit stopped counting comments (prose like "a 390px phone") and
// pill radii (999px), every stylesheet in src/styles converted (141 values),
// and the px that has to stay px says so with a reason (`px-ok:`), listed as
// DEVICE_PX: the card size floors, the iOS 16px input floor, the 12px code
// readability floors. What is left is JS.
// 0: the JS converted too -- the CSS that behaviors write into <style> tags
// (audio, tooltip, events, x-devconsole) and the size defaults they fall back
// to (card, overlay, layouts, notes). Two off-screen copy buffers stay px with
// `px-ok:`. Nothing is grandfathered any more: a new px in a convertible
// context is rem, or it says why it is not.
const BASELINE = 0;

test('audit: no new px creep in convertible contexts (#294)', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/audit-px-units.mjs')], { cwd: ROOT });
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/px-audit.json'), 'utf8'));
  const current = report.totals.LIKELY_CONVERT;

  expect(
    current,
    `px usage in convertible contexts (font-size/padding/margin/gap/border-radius/width/height/position) grew from ${BASELINE} to ${current}. ` +
      `New CSS/inline styles should use rem, not px, for sizing that should scale with the user's font-size preference (#294). ` +
      `Run \`node scripts/audit-px-units.mjs\` to see what's new. If this growth is legitimate (e.g. a genuinely fixed-pixel value), ` +
      `mark it on its line with /* px-ok: <reason> */ instead -- do not raise BASELINE.`
  ).toBeLessThanOrEqual(BASELINE);
});
