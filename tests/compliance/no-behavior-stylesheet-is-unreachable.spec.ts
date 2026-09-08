/**
 * EVERY BEHAVIOUR STYLESHEET MUST BE REACHABLE FROM SOMETHING
 * ==========================================================
 * #1008. `src/styles/behaviors/release.css` existed, was correct, and was
 * reachable from nothing. The version badge in the navbar therefore rendered
 * with none of the three classes it defines (.x-release, .x-release--clickable,
 * .x-release--stale) having a single rule behind them, on every page.
 *
 * The cause is structural, not a typo. #342 stopped site.css `@import`-ing all
 * ~50 behaviour stylesheets unconditionally and replaced that with
 * src/styles/behavior-css-manifest.js, which loads a behaviour's CSS just in
 * time. Under the old scheme a new stylesheet was picked up by a glob; under
 * the new one it has to be NAMED, and a stylesheet nobody names is simply never
 * fetched.
 *
 * It fails silently in both directions: a stylesheet that never loads raises no
 * error, and an unstyled element still renders its text. Nothing about the page
 * looks broken enough to investigate — which is why this one survived.
 *
 * Measured when this test was written: 59 behaviour stylesheets, exactly one
 * unreachable, and it had been that way since the manifest was introduced.
 */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BEHAVIOR_CSS_DIR = 'src/styles/behaviors';
const MANIFEST = 'src/styles/behavior-css-manifest.js';
const SITE_CSS = 'src/styles/site.css';

/**
 * Stylesheets that are deliberately loaded by nothing, each with the reason
 * recorded in the manifest's own header. An entry here is a claim that the file
 * is dead, not a way to silence this test — if one of these is ever needed, it
 * belongs in the manifest instead.
 */
const INTENTIONALLY_UNREACHABLE: Record<string, string> = {
  'modal.css': 'dead/legacy CSS — dialog.js uses <dialog> + showModal(), not the .x-modal.open toggle this defines',
  'stock.css': 'confirmed orphaned — no behavior, tag or markup anywhere references .x-stock',
};

test('no behaviour stylesheet is loaded by nothing', () => {
  const files = fs.readdirSync(BEHAVIOR_CSS_DIR).filter((f) => f.endsWith('.css'));

  // A glob that matched nothing would report perfect compliance forever.
  expect(files.length, `no stylesheets found under ${BEHAVIOR_CSS_DIR}`).toBeGreaterThan(20);

  const manifest = fs.readFileSync(MANIFEST, 'utf8');
  const site = fs.readFileSync(SITE_CSS, 'utf8');

  // Named in the just-in-time manifest…
  const mapped = new Set([...manifest.matchAll(/['"]([a-z0-9-]+\.css)['"]/gi)].map((m) => m[1]));
  // …or imported unconditionally by site.css. Real @import only — a filename
  // mentioned in a COMMENT is exactly how a stylesheet looks reachable while
  // loading nowhere.
  const imported = new Set(
    [...site.matchAll(/@import\s+url\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => path.basename(m[1])),
  );

  const unreachable = files.filter(
    (f) => !mapped.has(f) && !imported.has(f) && !(f in INTENTIONALLY_UNREACHABLE),
  );

  expect(
    unreachable,
    'These stylesheets are fetched by nothing, so the classes they define have no rules at all.\n' +
    `Add the behaviour to ${MANIFEST}, or — if the file really is dead — record it in this\n` +
    "test's INTENTIONALLY_UNREACHABLE map with the reason. Silence is not one of the options:\n" +
    'a stylesheet that never loads produces no error and the page still renders its text.',
  ).toEqual([]);

  // The exclusion list must not outlive its files, or it quietly becomes a
  // place where a real stylesheet could hide.
  const staleExclusions = Object.keys(INTENTIONALLY_UNREACHABLE).filter((f) => !files.includes(f));
  expect(
    staleExclusions,
    'listed as intentionally unreachable but no longer on disk — remove them',
  ).toEqual([]);
});
