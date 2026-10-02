import { test, expect } from '../fixtures/offline';

/**
 * John, 2026-10-02, arrows from three x-badge rows to the API and Docs
 * buttons: "Any time the nav selection changes, make sure the API and Docs
 * buttons are closed." An open panel described the PREVIOUS example and
 * covered the new one.
 *
 * Opens each panel the way a person does (clicking its <summary>), then picks
 * a different row in the list, and checks both panels are closed.
 */
for (const [label, panelId] of [['API', '#behaviors-live-api'], ['Docs', '#behaviors-live-doc']] as const) {
  test(`${label} closes when a different row is selected`, async ({ page }) => {
    await page.goto('/?page=behaviors');
    await expect(page.locator('.behaviors-live__body')).toBeVisible({ timeout: 15000 });

    const rows = page.locator('.behaviors-search-results__row');
    await expect.poll(async () => rows.count()).toBeGreaterThan(2);
    const visible = rows.filter({ visible: true });
    await visible.nth(0).click();

    await page.locator(`${panelId} > summary`).click();
    await expect(page.locator(panelId)).toHaveJSProperty('open', true);

    await visible.nth(1).click();
    await expect(page.locator('#behaviors-live-api')).toHaveJSProperty('open', false);
    await expect(page.locator('#behaviors-live-doc')).toHaveJSProperty('open', false);
  });
}
