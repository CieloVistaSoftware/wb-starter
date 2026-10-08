/**
 * #174 — the WB Behaviors showcase must not spam "[Schema Builder] Schema not found"
 * for tags that are owned by custom elements / behaviors / CSS (x-stack, x-grid,
 * x-modal, x-accordion, x-container, code, …). The schema-builder now only claims
 * tags it has a registered schema for; everything else is left to its real owner.
 *
 * Guards the fix in src/core/mvvm/schema-builder.js (detectSchema) +
 * src/wb-models/stack.schema.json registration.
 */
import { test, expect } from '../fixtures/offline';
import { pagePath } from '../helpers/page-path';
import { wbIdle, settlePage } from '../base';

test.describe('#174 — no spurious "Schema not found" warnings', () => {
  test('behaviors page emits zero Schema-not-found warnings', async ({ page }) => {
    const schemaWarnings: string[] = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (/Schema not found/i.test(t)) schemaWarnings.push(t);
    });

    await page.goto('/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    // Everything that could warn or fail has run once WB settles (#1516: no fixed sleep).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await settlePage(page, { timeout: 15000 });

    expect(
      schemaWarnings,
      `schema-builder logged "Schema not found" (should be silent for custom-element/behavior/CSS tags):\n${schemaWarnings.join('\n')}`
    ).toEqual([]);
  });

  test('no uncaught page errors while navigating to the showcase', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    // navigate away and back — this is what tripped x-demo's disconnectedCallback (#174/#175)
    await page.evaluate((href) => {
      const home = document.querySelector(`#siteNav .x-sidebar__item[href="${href}"]`) as HTMLElement;
      home?.click();
    }, pagePath('home'));
    // The navigation away has finished once Home is in #main and WB has
    // settled on it (#1516: not 800ms): x-demo's disconnectedCallback ran when
    // the old page left, and anything it threw has been thrown.
    await page.waitForSelector('#mainPage-home', { timeout: 20000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));
    await page.goto('/?page=behaviors');
    await wbIdle(page);

    expect(pageErrors, `uncaught errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
