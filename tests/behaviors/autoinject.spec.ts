
import { test, expect } from '@playwright/test';

test.describe('Auto-Inject Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/autoinject.html');
    // Wait for WB to initialize (autoInject happens during init/scan)
    await page.waitForFunction(() => typeof window['WB'] !== 'undefined');
    await page.waitForTimeout(1000); 
  });

  test('Page status indicates initialization', async ({ page }) => {
     const status = page.locator('#status');
     await expect(status).toHaveText(/WB Initialized/i);
  });

  // #290: rewritten against a lightweight served fixture (tests/fixtures/
  // form-elements.html) instead of the heavy 38-demo autoinject.html, whose
  // element IDs drift every time that page's content changes. Also fixed to
  // assert the REAL, intentional contract instead of a wrapper that was
  // never going to exist:
  //  - checkbox.js / select.js both style the native element IN PLACE ("CSS
  //    targets the tag directly — no wrapper, no fake span, no classes").
  //    The observable signal is the actual effect: checkbox.js injects a
  //    stylesheet that sets appearance:none; select.js attaches a real
  //    `element.wbSelect` API (getValue/setValue/etc).
  //  - card.js DOES add a real `wb-card` class — article→card auto-inject
  //    is the one case in this block with an actual wrapper-free class.
  test.describe('Form Elements', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tests/fixtures/form-elements.html');
      await page.waitForFunction(() => (window as any).__wbDone === true);
    });

    test('Checkbox is auto-injected and styled in place (no wrapper)', async ({ page }) => {
      const checkbox = page.locator('#fixture-checkbox');
      await expect(checkbox).toBeVisible();
      // No wrapper: the checkbox's own parent is still the <label>, not a
      // behavior-created .wb-checkbox div.
      await expect(page.locator('.wb-checkbox')).toHaveCount(0);
      await expect(checkbox).toHaveCSS('appearance', 'none');
    });

    test('Select is auto-injected and exposes a real wbSelect API (no wrapper class)', async ({ page }) => {
      const select = page.locator('#fixture-select');
      await expect(select).toBeVisible();
      await expect(select).not.toHaveClass(/wb-select/);
      const hasApi = await select.evaluate((el: any) => typeof el.wbSelect?.getValue === 'function');
      expect(hasApi, 'select behavior should attach element.wbSelect').toBe(true);
    });

    test('Article is auto-injected as a card (wb-card class)', async ({ page }) => {
      const article = page.locator('#fixture-article');
      await expect(article).toHaveClass(/wb-card/);
    });
  });
});
