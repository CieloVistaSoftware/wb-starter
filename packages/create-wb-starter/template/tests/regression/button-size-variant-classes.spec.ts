import { test, expect } from '@playwright/test';

/**
 * button() (src/wb-viewmodels/semantics/button.js) maps a native
 * <button size="…" variant="…">'s attributes to `.wb-button--{value}`
 * modifier CLASSES (native <button> can't be styled via the tag+attribute
 * selectors used for the real <wb-button> custom element). The behavior's
 * injected BUTTON_CSS only declared `wb-button[size="sm"]`-style
 * TAG+ATTRIBUTE rules and a bare `.wb-button` base class -- zero
 * `.wb-button--{value}` CLASS rules existed anywhere, so every size/variant
 * class the JS added had no matching CSS. Confirmed live: "Small"/"Medium"/
 * "Large" demo buttons on pages/behaviors.html all rendered identically.
 */
async function ready(page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

test.describe('Native <button> size/variant attributes actually apply', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  test('Small/Medium/Large buttons render three distinct font-sizes', async ({ page }) => {
    // "Medium" in this demo has no explicit size="md" attribute (it's the
    // unstyled default baseline) -- only Small (size="sm") and Large
    // (size="lg") get a wb-button--{size} modifier class.
    const small = page.locator('button', { hasText: 'Small' }).first();
    const medium = page.locator('button', { hasText: 'Medium' }).first();
    const large = page.locator('button', { hasText: 'Large' }).first();
    await expect(small).toHaveClass(/wb-button--sm/);
    await expect(large).toHaveClass(/wb-button--lg/);

    const sizes = await Promise.all(
      [small, medium, large].map((btn) => btn.evaluate((el) => getComputedStyle(el).fontSize))
    );
    expect(new Set(sizes).size, `expected 3 distinct font-sizes, got: ${JSON.stringify(sizes)}`).toBe(3);
  });

  test('Primary/Secondary/Ghost buttons render three distinct backgrounds', async ({ page }) => {
    const labels = ['Primary', 'Secondary', 'Ghost'];
    const backgrounds: string[] = [];
    for (const label of labels) {
      const btn = page.locator('button', { hasText: label }).first();
      const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
      backgrounds.push(bg);
    }
    expect(new Set(backgrounds).size, `expected 3 distinct backgrounds, got: ${JSON.stringify(backgrounds)}`).toBe(3);
  });
});
