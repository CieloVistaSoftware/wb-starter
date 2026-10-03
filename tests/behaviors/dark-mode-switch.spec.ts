/**
 * The Dark Mode switch (<div x-switch theme-control>) must drive the page theme:
 * ON = dark, OFF = light. (#210)
 */
import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

// This used to wait for the Dark Mode switch on /?page=behaviors. That page is
// a browser now that builds one example on selection (#666/#910) and has no
// such switch, so the spec timed out in setup before testing anything. The
// switch is authored here with the markup the showcase used.
test('Dark Mode switch toggles data-theme between dark and light', async ({ page }) => {
  await setupBehaviorTest(page);
  await setupTestContainer(page, '<div x-switch theme-control label="Dark Mode"></div>');

  const root = page.locator('html');
  const sw = page.locator('#test-container [x-switch][theme-control]');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    // re-sync initial state to current theme
    (document.querySelector('#test-container [x-switch][theme-control] input') as HTMLInputElement).checked = true;
  });

  // The theme changes in the switch's own handler. Each step is polled rather
  // than read after a fixed 120ms sleep, which a loaded CI runner outran.
  await sw.evaluate((el) => (el as HTMLElement).click()); // -> off -> light
  await expect(root, 'turning Dark Mode OFF did not switch to light').toHaveAttribute('data-theme', 'light');
  await sw.evaluate((el) => (el as HTMLElement).click()); // -> on -> dark
  await expect(root, 'turning Dark Mode ON did not switch to dark').toHaveAttribute('data-theme', 'dark');
});
