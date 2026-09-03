import { test, expect } from '@playwright/test';

/**
 * src/wb-viewmodels/sticky.js (<div x-sticky>, distinct from the `sticky`
 * boolean attribute on x-header/x-footer/x-navbar) uses position:fixed
 * driven by a scroll listener, not CSS position:sticky.
 *
 * #948: these tests measure the stuck element relative to its CONTAINING
 * BLOCK, not the viewport. demo.css gives `.x-demo__grid` `contain: layout`
 * deliberately (#647), which makes each demo box the containing block for any
 * `position: fixed` example content -- that is what keeps a full-viewport demo
 * (x-stagelight's spotlight, a modal, a toast) painting inside its own box
 * instead of over the whole page. So on demos/site/layout.html a stuck
 * [x-sticky] correctly resolves against its grid, and its viewport-absolute
 * rect.top is offset by however far the page happens to be scrolled.
 *
 * Verified live before rewriting: with `contain: layout` in force the three
 * demos measure rect.top - grid.top of exactly 0, 60 and 0 (matching no-offset,
 * offset="60" and animated); setting `contain: none` on the grid moves the
 * first from -400.03 to exactly 0. No ancestor has a transform, filter,
 * perspective, will-change or container-type -- the grid is the only
 * containing-block creator.
 *
 * (An earlier version of this docstring blamed a `fadeIn` transform left
 * mid-animation on `.page` by a shared multi-agent browser session. That was a
 * misdiagnosis: `contain: layout` is present on every load, in any tab.)
 */

async function ready(page) {
  await page.goto('/demos/site/layout.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[x-sticky]');
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

/**
 * Top of the element measured from its containing block (#948). `offset`
 * promises "N pixels reserved from the top of the sticky containing block";
 * on a demo page that block is the `.x-demo__grid`, not the viewport.
 */
async function topWithinContainingBlock(locator) {
  return locator.evaluate((el) => {
    const cb = el.closest('.x-demo__grid') || document.documentElement;
    return el.getBoundingClientRect().top - cb.getBoundingClientRect().top;
  });
}

async function scrollToTopAndSettle(page) {
  await page.evaluate(() => { window.scrollTo(0, 0); window.dispatchEvent(new Event('scroll')); });
  await page.waitForTimeout(250);
}

test.describe('[x-sticky]', () => {
  test('sticks to the viewport top (position:fixed, top:0) once scrolled past', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky [x-sticky]').nth(0); // no offset
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    await expect(el).toHaveCSS('position', 'fixed');
    const top = await topWithinContainingBlock(el);
    expect(Math.abs(top)).toBeLessThanOrEqual(1);
  });

  test('offset="60" reserves 60px from the top instead of 0', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky [x-sticky]').nth(1); // offset="60"
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    const top = await topWithinContainingBlock(el);
    // Still a real assertion: the no-offset demo measures 0 here, this one 60.
    expect(Math.abs(top - 60)).toBeLessThanOrEqual(1);
  });

  test('animated attribute applies a box-shadow transition once stuck', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky [x-sticky]').nth(2); // animated
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    const transition = await el.evaluate((e) => e.style.transition);
    expect(transition).toContain('box-shadow');
  });

  test('scrolling back up unsticks and cleans up the placeholder', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky [x-sticky]').nth(0);
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);

    await scrollToTopAndSettle(page);
    await expect(el).not.toHaveClass(/is-stuck/);
    await expect(el).toHaveCSS('position', 'static');
    await expect(page.locator('.sticky-placeholder')).toHaveCount(0);
  });
});
