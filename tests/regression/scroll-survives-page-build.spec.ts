import { test, expect } from '../fixtures/offline';
import { pagePath } from '../helpers/page-path';

/**
 * #1462: navigateTo() put the scroll position in place only AFTER it had
 * awaited the new page's scan. The page is on screen from the moment its HTML
 * is written, so a reader who scrolled it while the scan was still running was
 * snapped back to the top when the scan finished -- and that 0 was what the
 * site remembered for the page, so coming back to it "restored" the top. CI
 * caught it as nav-scroll reading 0 for 15s after setting 400.
 *
 * Here the scan of #main is held for 3s; the page is scrolled while it waits.
 *
 * #1573: the check was scrollTop === 400 afterwards, and on Windows CI it read
 * 486. That is not the bug. The scan builds the page, so content above the
 * reader can grow when it finishes, and Chrome's scroll anchoring then moves
 * scrollTop DOWN to keep the same text in view (an 86px block inserted above
 * the reader reproduces 486 exactly). The bug moves it back UP, to the top.
 * So what must hold is: the scroll did not go back toward the top.
 */
test('scrolling a page while it is still being built is not undone (#1462)', async ({ page }) => {
  await page.addInitScript(() => {
    const hold = () => {
      const WB = (window as any).WB;
      if (!WB?.scan || WB.__held) return false;
      const scan = WB.scan.bind(WB);
      WB.scan = async (el: Element, ...rest: unknown[]) => {
        const result = await scan(el, ...rest);
        if (el && (el as Element).id === 'main' && (window as any).__holdScan) {
          // Held until the test has scrolled (#1516): a gate, not a 3s guess.
          await new Promise((ok) => { (window as any).__releaseScan = ok; });
          (window as any).__scanReleased = true;
        }
        return result;
      };
      WB.__held = true;
      return true;
    };
    const t = setInterval(() => { if (hold()) clearInterval(t); }, 5);
  });

  await page.goto('/?page=home');
  await page.waitForFunction(() => !!document.querySelector('#mainPage-home') && (window as any).WB?.__held, null, { timeout: 20000 });

  await page.evaluate((href) => {
    (window as any).__holdScan = true;
    (document.querySelector(`.nav__item[href="${href}"]`) as HTMLElement).click();
  }, pagePath('themes'));
  // The page is on screen and its scan is parked at the gate.
  await page.waitForFunction(() => !!document.querySelector('#mainPage-themes') && typeof (window as any).__releaseScan === 'function', null, { timeout: 20000 });
  expect(await page.evaluate(() => !!(window as any).__scanReleased), 'the scan must still be held').toBe(false);

  const scrolled = await page.evaluate(() => {
    const sb = document.getElementById('siteBody')!;
    sb.scrollTop = 400;
    return sb.scrollTop;
  });
  expect(scrolled, 'themes must be tall enough to scroll for this check').toBeGreaterThan(100);

  await page.evaluate(() => (window as any).__releaseScan());
  await page.waitForFunction(() => (window as any).__scanReleased === true, null, { timeout: 10000 });
  // Nothing after the scan writes scrollTop synchronously; the scroll restore
  // runs from a ResizeObserver or a frame, so two frames cover both.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect(await page.evaluate(() => document.getElementById('siteBody')!.scrollTop),
    'the scan finishing moved the reader back toward the top').toBeGreaterThanOrEqual(scrolled - 2);
});
