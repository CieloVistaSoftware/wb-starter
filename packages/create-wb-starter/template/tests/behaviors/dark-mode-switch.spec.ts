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

  const r = await page.evaluate(async () => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    const sw = document.querySelector('#test-container [x-switch][theme-control]') as HTMLElement;
    const inp = sw.querySelector('input') as HTMLInputElement;
    // re-sync initial state to current theme
    inp.checked = true;

    const start = root.getAttribute('data-theme');
    sw.click(); // -> off -> light
    await new Promise((r) => setTimeout(r, 120));
    const afterOff = root.getAttribute('data-theme');
    sw.click(); // -> on -> dark
    await new Promise((r) => setTimeout(r, 120));
    const afterOn = root.getAttribute('data-theme');
    return { start, afterOff, afterOn };
  });

  expect(r.afterOff, `turning Dark Mode OFF did not switch to light (got ${r.afterOff})`).toBe('light');
  expect(r.afterOn, `turning Dark Mode ON did not switch to dark (got ${r.afterOn})`).toBe('dark');
});
