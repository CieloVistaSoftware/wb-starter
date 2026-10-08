/**
 * #299 — pre.js show/hide toggle on code-block chrome. Clicking .x-pre__toggle
 * must collapse the <pre> (and its line-numbers gutter) down to just the
 * header row, and clicking again must restore it — the header controls
 * (toggle/badge/copy) stay reachable in both states since they're
 * absolutely-positioned siblings of <pre>, not children of it.
 */
import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

// The Behaviors page these specs used to read builds one example on selection
// now (#666/#910), and its code panel is a plain source view: no max-height, so
// no toggle, and no copy button. The block under test is authored here with
// every header control pre.js offers -- copy, a language badge, and the
// collapse toggle that only exists when there is a max-height to collapse.
const BLOCK =
  '<pre language="javascript" show-copy max-height="160px"><code>' +
  Array.from({ length: 24 }, (_, i) => `const line${i} = ${i};`).join('\n') +
  '</code></pre>';

test.describe('#299 — pre.js collapse/expand toggle', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
    await setupTestContainer(page, BLOCK);
    await page.locator('#test-container .x-pre__toggle').scrollIntoViewIfNeeded();
  });

  test('clicking the toggle hides the code and restores it on a second click', async ({ page }) => {
    const toggle = page.locator('#test-container .x-pre__toggle').first();
    await expect(toggle).toBeVisible();

    const wrapper = page.locator('#test-container .x-pre__wrapper').first();
    const pre = wrapper.locator('pre.x-pre').first();

    const openHeight = await wrapper.evaluate((el) => el.getBoundingClientRect().height);

    await toggle.click();
    await expect(pre).toHaveCSS('display', 'none');
    const collapsedHeight = await wrapper.evaluate((el) => el.getBoundingClientRect().height);
    expect(collapsedHeight, 'wrapper should shrink once <pre> is hidden').toBeLessThan(openHeight);
    // Header controls must stay reachable while collapsed — that's the
    // entire point of the wrapper's explicit min-height.
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(pre).not.toHaveCSS('display', 'none');
    const restoredHeight = await wrapper.evaluate((el) => el.getBoundingClientRect().height);
    expect(restoredHeight, 'wrapper should restore to its original height').toBeGreaterThanOrEqual(openHeight - 2);
  });

  test('toggle button never leaves the DOM/visible area in either state', async ({ page }) => {
    const toggle = page.locator('#test-container .x-pre__toggle').first();
    for (let i = 0; i < 3; i++) {
      await toggle.click();
      await expect(toggle).toBeVisible();
      await expect(toggle).toBeInViewport();
    }
  });
});
