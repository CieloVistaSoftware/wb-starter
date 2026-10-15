/**
 * #294: rem, never px -- on every device type (John, 2026-10-13: "rem is
 * preferred measurement for all device types not px").
 *
 * It replaces `px-no-new-creep.spec.ts`, which only counted px in the
 * properties the audit buckets as LIKELY_CONVERT. That left every other
 * px -- borders, shadows, blurs, transforms, media-query breakpoints, the
 * UNCLASSIFIED bucket -- free to grow, as if px were allowed there. It is
 * not. This gate counts EVERY px the audit finds in src/ and fails if the
 * total grows.
 *
 * The count may only go down. Convert a file, re-run
 * `node scripts/audit-px-units.mjs`, and lower TOTAL_BASELINE to the new
 * total. Never raise it to admit new px: write the value in rem (n/16, so it
 * is identical at the default 16px root).
 */
import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// 1163 on 2026-10-13 (origin/main a75d111f): 264 likely-convert + 662
// likely-ok + 197 unclassified + 40 media-breakpoint lines.
// 1150: progress.css converted (#1856, 13 values).
// 1119: effects.css converted (#1858, every px in the file).
// 940: the likely-convert px in 49 more stylesheets and the CSS that 10 JS
// files write (tooltip, audio, events, x-devconsole, card, overlay, layouts,
// notes, button, checkbox) converted (#1865, 179 values).
// 102: every px left in src/styles (borders, shadows, transforms, breakpoints)
// and in the CSS strings JS writes converted; the clamps that compared those
// sizes with pointer px read them through src/core/length-to-px.js. What is
// left is prose in comments, the card/iOS/12px floors, and APIs that only take
// px (IntersectionObserver rootMargin, a measured clientWidth).
// 0: the audit stopped counting comments and git-ignored files (88 of the 102
// were prose such as "measured 600px wide"). The 14 px that must stay px
// carry `px-ok: <reason>` on their line and are listed as ALLOWED (#294).
const TOTAL_BASELINE = 0;
// The px-ok exceptions, so a new one is a deliberate change to this number.
const ALLOWED_BASELINE = 14;

test('audit: total px in src/ only shrinks -- rem on every device (#294)', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/audit-px-units.mjs')], { cwd: ROOT });
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/px-audit.json'), 'utf8'));
  const { LIKELY_CONVERT, LIKELY_OK, UNCLASSIFIED, mediaBreakpoints } = report.totals;
  const current = LIKELY_CONVERT + LIKELY_OK + UNCLASSIFIED + mediaBreakpoints;

  expect(
    current,
    `px in src/ grew from ${TOTAL_BASELINE} to ${current}. The project sizes in rem on every device type, ` +
      `not px (#294) -- borders, shadows and breakpoints included. Run \`node scripts/audit-px-units.mjs\` ` +
      `to find the new px and write it in rem (n/16). Never raise TOTAL_BASELINE.`
  ).toBeLessThanOrEqual(TOTAL_BASELINE);

  expect(
    report.totals.ALLOWED,
    `px-ok exceptions grew from ${ALLOWED_BASELINE} to ${report.totals.ALLOWED}:\n${report.allowed.join('\n')}\n` +
      `A px-ok is only for a value that cannot be rem (an API that takes px, a device-pixel floor). ` +
      `Write the value in rem instead, or raise ALLOWED_BASELINE in the same PR that explains why.`
  ).toBeLessThanOrEqual(ALLOWED_BASELINE);
  for (const line of report.allowed) {
    expect(line.split(/\s{2,}/)[1] ?? '', `px-ok without a reason: ${line}`).not.toBe('');
  }
});
