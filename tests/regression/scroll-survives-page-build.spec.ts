import { test, expect } from '../fixtures/offline';

/**
 * #1462: navigateTo() put the scroll position in place only AFTER it had
 * awaited the new page's scan. The page is on screen from the moment its HTML
 * is written, so a reader who scrolled it while the scan was still running was
 * snapped back to the top when the scan finished -- and that 0 was what the
 * site remembered for the page, so coming back to it "restored" the top. CI
 * caught it as nav-scroll reading 0 for 15s after setting 400.
 *
 * Here the scan of #main is held for 3s; the page is scrolled while it waits.
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
          await new Promise((ok) => setTimeout(ok, 3000));
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

  await page.evaluate(() => {
    (window as any).__holdScan = true;
    (document.querySelector('.nav__item[href="?page=themes"]') as HTMLElement).click();
  });
  // The page is on screen; its scan is still held.
  await page.waitForFunction(() => !!document.querySelector('#mainPage-themes'), null, { timeout: 20000 });
  expect(await page.evaluate(() => !!(window as any).__scanReleased), 'the scan must still be held').toBe(false);

  const scrolled = await page.evaluate(() => {
    const sb = document.getElementById('siteBody')!;
    sb.scrollTop = 400;
    return sb.scrollTop;
  });
  expect(scrolled, 'themes must be tall enough to scroll for this check').toBeGreaterThan(100);

  await page.waitForFunction(() => (window as any).__scanReleased === true, null, { timeout: 10000 });
  await page.waitForTimeout(300); // the code after the scan, and a frame
  expect(await page.evaluate(() => document.getElementById('siteBody')!.scrollTop),
    'the reader\'s scroll must survive the scan finishing').toBe(scrolled);
});
