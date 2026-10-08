/**
 * The Dark Mode switch (<div x-switch theme-control>) must drive the page theme:
 * ON = dark, OFF = light. (#210)
 */
import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer, settlePage } from '../base';

// This used to wait for the Dark Mode switch on /?page=behaviors. That page is
// a browser now that builds one example on selection (#666/#910) and has no
// such switch, so the spec timed out in setup before testing anything. The
// switch is authored here with the markup the showcase used.
test('Dark Mode switch toggles data-theme between dark and light', async ({ page }) => {
  await setupBehaviorTest(page);
  await setupTestContainer(page, '<div x-switch theme-control label="Dark Mode"></div>');

  // #1299: wait on SIGNALS, not on elapsed time. This used to click and then sleep a
  // fixed 120 ms before reading data-theme, so on a slow CI runner the click landed
  // before the theme-control handler was attached (or the change was read before it
  // applied) and the spec reported "got dark" on code that cannot affect it.
  //   1. WB.whenIdle() -- the runtime's own "every behavior has attached" signal.
  //   2. The switch's <input> exists -- the host builds it, so it is the proof the
  //      handler's owner is in place before anything is clicked.
  //   3. Each click is followed by waiting for data-theme to REACH the expected value.
  // A genuine failure still fails: the wait times out and names the value it saw.
  await settlePage(page);
  await page.waitForSelector('#test-container [x-switch][theme-control] input');

  const start = await page.evaluate(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    const sw = document.querySelector('#test-container [x-switch][theme-control]') as HTMLElement;
    // re-sync initial state to current theme
    (sw.querySelector('input') as HTMLInputElement).checked = true;
    return root.getAttribute('data-theme');
  });
  expect(start, 'the test could not put the page in the dark starting state').toBe('dark');

  const clickSwitch = (): Promise<void> => page.evaluate(() => {
    (document.querySelector('#test-container [x-switch][theme-control]') as HTMLElement).click();
  });
  const readTheme = (): Promise<string | null> => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const reached = async (theme: string): Promise<void> => {
    try {
      await page.waitForFunction((t) => document.documentElement.getAttribute('data-theme') === t, theme, { timeout: 5000 });
    } catch {
      // fall through: the assertion below reports what the page actually shows
    }
  };

  await clickSwitch(); // -> off -> light
  await reached('light');
  const r = { afterOff: await readTheme(), afterOn: null as string | null };
  await clickSwitch(); // -> on -> dark
  await reached('dark');
  r.afterOn = await readTheme();

  expect(r.afterOff, `turning Dark Mode OFF did not switch to light (got ${r.afterOff})`).toBe('light');
  expect(r.afterOn, `turning Dark Mode ON did not switch to dark (got ${r.afterOn})`).toBe('dark');
});
