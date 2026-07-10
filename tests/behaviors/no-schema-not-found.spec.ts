/**
 * #174 — the WB Behaviors showcase must not spam "[Schema Builder] Schema not found"
 * for tags that are owned by custom elements / behaviors / CSS (wb-stack, wb-grid,
 * wb-modal, wb-accordion, wb-container, code, …). The schema-builder now only claims
 * tags it has a registered schema for; everything else is left to its real owner.
 *
 * Guards the fix in src/core/mvvm/schema-builder.js (detectSchema) +
 * src/wb-models/stack.schema.json registration.
 */
import { test, expect } from '@playwright/test';

test.describe('#174 — no spurious "Schema not found" warnings', () => {
  test('behaviors page emits zero Schema-not-found warnings', async ({ page }) => {
    const schemaWarnings: string[] = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (/Schema not found/i.test(t)) schemaWarnings.push(t);
    });

    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2500); // lazy injection + schema build + observer

    expect(
      schemaWarnings,
      `schema-builder logged "Schema not found" (should be silent for custom-element/behavior/CSS tags):\n${schemaWarnings.join('\n')}`
    ).toEqual([]);
  });

  test('no uncaught page errors while navigating to the showcase', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    // navigate away and back — this is what tripped wb-demo's disconnectedCallback (#174/#175)
    await page.evaluate(() => {
      const home = document.querySelector('.nav__item[href="?page=home"]') as HTMLElement;
      home?.click();
    });
    await page.waitForTimeout(800);
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForTimeout(1500);

    expect(pageErrors, `uncaught errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
