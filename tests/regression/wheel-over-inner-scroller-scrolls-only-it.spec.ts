import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * A WHEEL OVER AN INNER SCROLLER SCROLLS ONLY IT, UNTIL ITS END (#1037)
 * ====================================================================
 * John: "In the issue viewer, when an issue is expanded and the user starts
 * using the mouse wheel it must apply to the expansion solely until it gets to
 * the end, at which time the next element starts scrolling."
 *
 * site-engine.js's wheel fallback (#636) pushed #siteBody whenever #siteBody
 * had not moved 16ms after a wheel. Over an expanded issue (or a code panel)
 * the browser rightly scrolls the inner box and leaves the page alone, so the
 * fallback read that as "native scrolling failed" and moved the page as well:
 * the reader lost their place mid-issue.
 *
 * The box here stands in for .issues-expander__body (max-height + overflow-y:
 * auto); the Issues page itself needs the live GitHub API.
 *
 * See it by hand: open ?page=issues, expand a long issue, and wheel over its
 * body. Before: the issue and the whole page scrolled together. Now: only the
 * issue scrolls until its end, then the page.
 */

test.describe('wheel over an inner scroller (#1037)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/?page=about', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#siteBody', { timeout: 20_000 });
    // The site must have finished booting and the about page must be written
    // before the box goes in: the first navigation resets #siteBody's scroll
    // as the page lands (_placeScroll), and late styles and fonts change line
    // heights, so a box scrolled to its end too early is no longer at its end
    // when the wheel arrives -- the wheel then (correctly) scrolls the box,
    // and the page-moves assertion below failed on the Windows runner (#1641).
    await wbIdle(page);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      const body = document.getElementById('siteBody')!;
      const box = document.createElement('div');
      box.id = 'inner-1037';
      box.style.cssText = 'max-height: 200px; overflow-y: auto; border: 1px solid; margin: 1rem;';
      box.innerHTML = Array.from({ length: 60 }, (_, i) => `<p>line ${i + 1}</p>`).join('');
      const spacer = document.createElement('div');
      spacer.style.height = '3000px';
      body.prepend(box);
      body.append(spacer);
      body.scrollTop = 0;
    });
    await page.locator('#inner-1037').scrollIntoViewIfNeeded();
  });

  test('the page stays put while the inner box can still scroll', async ({ page }) => {
    const pageBefore = await page.evaluate(() => document.getElementById('siteBody')!.scrollTop);
    const box = (await page.locator('#inner-1037').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(300); // past the fallback's 16ms check

    const after = await page.evaluate(() => ({
      inner: document.getElementById('inner-1037')!.scrollTop,
      page: document.getElementById('siteBody')!.scrollTop,
    }));
    expect(after.inner, 'the wheel did not scroll the inner box').toBeGreaterThan(0);
    expect(after.page, 'the page moved while the inner box could still scroll').toBe(pageBefore);
  });

  test('at the inner box\'s end the wheel moves the page', async ({ page }) => {
    const atEnd = await page.evaluate(() => {
      const box = document.getElementById('inner-1037')!;
      box.scrollTop = box.scrollHeight;
      return box.scrollTop >= box.scrollHeight - box.clientHeight - 1;
    });
    expect(atEnd, 'the inner box is at its end before the wheel').toBe(true);
    const pageBefore = await page.evaluate(() => document.getElementById('siteBody')!.scrollTop);
    const box = (await page.locator('#inner-1037').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => document.getElementById('siteBody')!.scrollTop),
      { message: 'at the inner box\'s end the page must take the wheel' }).toBeGreaterThan(pageBefore);
  });
});
