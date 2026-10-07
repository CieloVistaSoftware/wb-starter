/**
 * A demo switch that names a real capability must invoke it when turned ON —
 * <div x-switch notify-control> fires a real toast. (DEMOS-AND-DOCS-STANDARDS.md #22)
 */
import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

// This used to wait for the Notifications switch on /?page=behaviors. That page
// is a browser now that builds one example on selection (#666/#910) and has no
// such switch, so the spec timed out in setup before testing anything. The
// switch is authored here with the markup the showcase used.
test('Notifications switch fires a real toast when turned ON, not when turned OFF', async ({ page }) => {
  await setupBehaviorTest(page);
  const sw = await setupTestContainer(page, '<div x-switch notify-control label="Notifications" checked></div>');

  // Starts checked -- turning it OFF must NOT toast.
  await sw.click();
  // sleep-proves-negative: turning the switch OFF must NOT toast; a toast that correctly never comes fires no event
  await page.waitForTimeout(200);
  expect(await page.locator('.x-toast').count(), 'turning the switch OFF should not fire a toast').toBe(0);

  // Turning it back ON must fire a real toast demonstrating the effect.
  await sw.click();
  await expect(page.locator('.x-toast')).toHaveCount(1, { timeout: 2000 });
});
