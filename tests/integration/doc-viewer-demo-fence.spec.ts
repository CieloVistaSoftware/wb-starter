import { test, expect } from '@playwright/test';

/**
 * FUNCTIONAL (#228): a ```demo fence in a doc renders a LIVE component plus its
 * source — not just static code.
 *
 * The doc-viewer transforms `pre > code.language-demo` into .wb-demo__live (raw
 * markup) + .wb-demo__source (escaped source), then lazy-loads WB and scans the
 * content so the custom element is actually built from its schema. This checks
 * the live half rendered (the CTA/title text only appears in the DOM if the
 * component was upgraded from inert markup).
 */
test('doc-viewer renders a ```demo fence as a live component + source (#228)', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs/components/cards/cardhero.md', { waitUntil: 'domcontentloaded' });

  // The live example is built asynchronously (WB loads schemas, then scans).
  await page.waitForFunction(() => {
    const live = document.querySelector('#content .wb-demo__live');
    return !!live && /Explore Components/.test(live.textContent || '');
  }, { timeout: 30000 });

  const live = page.locator('#content .wb-demo__live').first();
  await expect(live.locator('wb-cardhero')).toHaveCount(1);
  await expect(live).toContainText('Explore Components'); // CTA rendered → component built
  await expect(live).toContainText('stunning UIs');       // title (with inline HTML) rendered

  // …and the source is shown below the live example.
  await expect(page.locator('#content .wb-demo__source')).toContainText('wb-cardhero');
});
