import { test, expect } from '@playwright/test';

/**
 * Broader spot-check for mdhtml.js's auto-live-render conversion (see
 * doc-viewer-auto-demo-shrink-width.spec.ts for the specific bug this
 * traces back to) across a representative sample of the 61 doc files that
 * contain ```html fenced examples -- cards (async images, the highest-risk
 * category), forms, feedback, layout. Not exhaustive (61 files is a lot to
 * hand-verify), but catches a systemic failure in the conversion logic
 * itself rather than a single-page instance.
 */
const SAMPLE_FILES = [
  'docs/components/cards/card.md',
  'docs/components/cards/cardhero.md',
  'docs/components/forms/button.md',
  'docs/components/feedback/avatar.md',
  'docs/components/layout/center.md',
];

test.describe('Auto-live-render spot-check across doc categories', () => {
  for (const file of SAMPLE_FILES) {
    test(`${file}: no console errors, no collapsed wb-demo widgets`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(`/public/doc-viewer.html?file=${encodeURIComponent(file)}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#content', { timeout: 15000 });
      await page.waitForTimeout(5500); // demo.js's poll-until-stable settle window

      const demos = page.locator('wb-demo');
      const count = await demos.count();

      for (let i = 0; i < count; i++) {
        const box = await demos.nth(i).boundingBox();
        if (!box) continue; // not visible (e.g. below an accordion) -- not this bug's concern
        expect(box.width, `${file} wb-demo[${i}] collapsed to ${Math.round(box.width)}px wide`).toBeGreaterThan(50);
      }

      expect(errors, `${file} threw uncaught errors: ${errors.join(', ')}`).toEqual([]);
    });
  }
});
