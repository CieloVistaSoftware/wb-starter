import { test, expect } from '@playwright/test';
import { globSync } from 'glob';

/**
 * Release gate: some components (e.g. wb-cardfile) intentionally surface a
 * visible in-DOM warning when authored with missing/invalid config, so the
 * problem isn't a silent dead end during development (card.js:
 * "confusing for anyone authoring/testing this component -- surface it
 * visibly instead of leaving it a silent dead end"). That's the right call
 * for catching authoring mistakes early -- but it means a demo/doc page
 * that forgets a required attribute ships a scary red runtime-error string
 * straight to the live site. Confirmed live: demos/site/cards.html's File
 * Card examples had no `href`, so every one rendered
 * "No href given — nothing to download." in place of real content.
 *
 * This scans every real page/demo for any known component-warning string
 * leaking into shipped content. Run before every release (part of the
 * `compliance` project / pre-push-to-.io gate) so a forgotten attribute on
 * a new demo never ships silently.
 */

// Known in-DOM warning strings components intentionally render for
// authoring mistakes. Add to this list as new self-surfacing warnings are
// introduced elsewhere in the codebase.
const KNOWN_WARNING_STRINGS = [
  'No href given — nothing to download.',
];

const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd() }),
  ...globSync('pages/**/*.html', { cwd: process.cwd() }),
].sort();

test.describe('no component authoring-warning strings leak into shipped pages', () => {
  for (const file of FILES) {
    test(`${file}: no visible runtime-warning text`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      // A warning string this test looks for is either static markup or
      // injected by component JS during initial build -- neither depends
      // on window.WB specifically existing, so there's no need to wait on
      // it (demos/index.html, a plain static links page with no WB at
      // all, reproducibly hit "Target page ... has been closed" when this
      // test waited on a waitForFunction(WB) that could only ever time
      // out for it -- removed rather than chased further, since nothing
      // here actually needs it).
      await page.waitForTimeout(800);
      // Under heavy parallel load, document.body can transiently read null
      // right as a page fragment finishes swapping in (confirmed: a
      // different random subset of pages failed with "Cannot read
      // properties of null (reading 'innerText')" each run, never the
      // same page twice -- classic resource-contention flake, not a real
      // per-page issue). Wait for body to exist before reading it.
      await page.waitForSelector('body', { state: 'attached', timeout: 5000 });

      const bodyText = await page.evaluate(() => document.body?.innerText || '');
      const offenders = KNOWN_WARNING_STRINGS.filter((w) => bodyText.includes(w));
      expect(offenders, `${file} shows component warning text meant for authors, not visitors:\n${offenders.join('\n')}`).toEqual([]);
    });
  }
});
