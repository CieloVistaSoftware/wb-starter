import { test, expect } from '@playwright/test';

/**
 * src/wb-viewmodels/sticky.js (<div x-sticky>, distinct from the `sticky`
 * boolean attribute on x-header/x-footer/x-navbar) uses position:fixed
 * driven by a scroll listener, not CSS position:sticky. Investigated after
 * a report that it looked broken on demos/site/layout.html -- the actual
 * cause was cross-contamination from a shared, multi-agent browser session
 * (a backgrounded/non-fronted tab pauses CSS animations, which had left
 * demos/site/layout.html's page-load `fadeIn` transform stuck mid-animation
 * on `.page`, which in turn breaks position:fixed for any descendant --
 * any transform on an ancestor creates a new containing block). Re-tested
 * in a clean, dedicated, fronted tab and every x-sticky permutation
 * worked correctly. This suite pins that down so a real regression here
 * (as opposed to shared-browser test contamination) gets caught.
 */

async function ready(page) {
  await page.goto('/demos/site/layout.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('x-sticky');
  // Let the whole page's layout fully settle (all eager x-demo blocks
  // built, all real header/footer/navbar/tabs/details structure rendered)
  // before any test measures an element's absolute position -- measuring
  // too early against a still-shifting page produced a stale Y coordinate
  // for the first x-sticky instance specifically (it sits early in the
  // page, above heavier sections still finishing their own layout).
  await page.waitForTimeout(800);
}

async function scrollPastAndSettle(page, locator, extra = 400) {
  const absTop = await locator.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => { window.scrollTo(0, y); window.dispatchEvent(new Event('scroll')); }, absTop + extra);
  await page.waitForTimeout(250);
}

async function scrollToTopAndSettle(page) {
  await page.evaluate(() => { window.scrollTo(0, 0); window.dispatchEvent(new Event('scroll')); });
  await page.waitForTimeout(250);
}

test.describe('x-sticky', () => {
  test('sticks to the viewport top (position:fixed, top:0) once scrolled past', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky x-sticky').nth(0); // no offset
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    await expect(el).toHaveCSS('position', 'fixed');
    const top = await el.evaluate((e) => e.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThanOrEqual(1);
  });

  test('offset="60" reserves 60px from the top instead of 0', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky x-sticky').nth(1); // offset="60"
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    const top = await el.evaluate((e) => e.getBoundingClientRect().top);
    expect(Math.abs(top - 60)).toBeLessThanOrEqual(1);
  });

  test('animated attribute applies a box-shadow transition once stuck', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky x-sticky').nth(2); // animated
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    const transition = await el.evaluate((e) => e.style.transition);
    expect(transition).toContain('box-shadow');
  });

  test('scrolling back up unsticks and cleans up the placeholder', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky x-sticky').nth(0);
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);

    await scrollToTopAndSettle(page);
    await expect(el).not.toHaveClass(/is-stuck/);
    await expect(el).toHaveCSS('position', 'static');
    await expect(page.locator('.sticky-placeholder')).toHaveCount(0);
  });
});
