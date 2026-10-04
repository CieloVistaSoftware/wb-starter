import { test, expect } from '../fixtures/offline';
import { openPlaygroundInputs } from '../helpers/playground';

/**
 * #1459: the playground "20 inputs" setup waited on one proxy -- the
 * x-counter readout -- and CI then hovered the tooltip input before its own
 * behavior applied (no x-ready at hover). The tooltip never appeared.
 *
 * Here tooltip.js is held back 3s, the way a slow runner delays it, so the
 * counter is ready long before the tooltip. The setup must still not return
 * until the tooltip input is applied -- and then hovering it shows the tooltip.
 */
test.use({ serviceWorkers: 'block' }); // #1349: this spec holds a request with page.route

test('the playground setup returns only once every input is applied (#1459)', async ({ page }) => {
  test.setTimeout(90_000);
  await page.route('**/src/wb-viewmodels/tooltip.js*', async (route) => {
    await new Promise((r) => setTimeout(r, 3000));
    await route.continue();
  });

  await openPlaygroundInputs(page);

  const input = page.locator('#pg-preview input[x-tooltip="This field is required"]');
  // Read at once: this is the moment the suite's tests start interacting.
  expect(await input.evaluate((el) => el.hasAttribute('x-ready')),
    'setup returned while the tooltip input was still a plain input').toBe(true);

  await input.hover();
  await expect(page.locator('.x-tooltip, [role="tooltip"]').filter({ hasText: 'This field is required' }).first())
    .toBeVisible({ timeout: 5000 });
});
