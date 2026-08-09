import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#491): scrolling a lazy `[x-behavior]` element into view showed
 * a visible pop-in -- the raw, unenhanced element was briefly on screen
 * before its behavior finished applying.
 *
 * Root cause: getLazyObserver() in src/core/wb-lazy.js instantiated its
 * IntersectionObserver with `rootMargin: '200px'`. That only starts the
 * injection once the element is within 200px of the viewport edge, i.e.
 * often only a handful of frames before the element is actually on screen
 * -- nowhere near enough head start for WB.inject()'s dynamic import +
 * behavior setup to finish before the user sees it. src/wb-viewmodels/
 * wb-demo.js hit the exact same class of pop-in for its own, separate
 * IntersectionObserver (#390) and settled on `rootMargin: '1200px'` there
 * (200px/400px both proved too little live -- see wb-demo.js's own comment
 * on that history). The fix widened wb-lazy.js's observer to match:
 * `rootMargin: '1200px'` (commit 3171d72).
 *
 * Note: src/wb-viewmodels/wb-demo.js's own `<wb-demo>` lazy-build system
 * (EAGER_BUILD_COUNT + a *second*, separate IntersectionObserver) is a
 * genuinely different mechanism from the one this issue named, but it
 * already carries the same '1200px' rootMargin -- verified by inspection,
 * no change needed there.
 *
 * This test proves the fix behaviorally rather than just re-reading the
 * config constant: it places an [x-behavior="ripple"] element 5000px down
 * the page, scrolls so the element sits ~500px below the visible viewport
 * (comfortably inside the 1200px margin, but NOT on screen), and asserts
 * the behavior has ALREADY been applied (ripple.js adds the `wb-ripple`
 * class -- see ripple.js) at that point. A second element placed far
 * beyond the 1200px margin at the same scroll position stays unenhanced,
 * proving the widened margin didn't just make everything eager.
 */
test.describe('wb-lazy IntersectionObserver preloads behaviors before the element is visible (#491)', () => {
  test('an element ~500px below the fold is already enhanced; one 3000px+ below is not', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/demos/test-harness.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, { timeout: 20000 });

    const setup = await page.evaluate(() => {
      // Tall spacer so the page actually has room to scroll to these offsets.
      const spacer = document.createElement('div');
      spacer.style.cssText = 'height:12000px';
      document.body.appendChild(spacer);

      // "near" sits at 5000px -- reachable once scrolled near it.
      const near = document.createElement('button');
      near.id = 'near-target';
      near.setAttribute('x-behavior', 'ripple');
      near.textContent = 'near';
      near.style.cssText = 'position:absolute;top:5000px;left:0;width:40px;height:40px';
      document.body.appendChild(near);

      // "far" sits 5000px further down -- still ~4500px outside the 1200px
      // margin even after the scroll below, so it must stay untouched.
      const far = document.createElement('button');
      far.id = 'far-target';
      far.setAttribute('x-behavior', 'ripple');
      far.textContent = 'far';
      far.style.cssText = 'position:absolute;top:10000px;left:0;width:40px;height:40px';
      document.body.appendChild(far);

      return (window as any).WB.scan(document.body).then(() => true);
    });
    expect(setup).toBe(true);

    // Give the initial (pre-scroll) observer entries a moment to settle --
    // both targets are thousands of px away at scrollY 0, neither should
    // be enhanced yet.
    await page.waitForTimeout(150);
    const beforeScroll = await page.evaluate(() => ({
      near: document.getElementById('near-target')!.classList.contains('wb-ripple'),
      far: document.getElementById('far-target')!.classList.contains('wb-ripple'),
    }));
    expect(beforeScroll.near, 'far below the fold: must not be enhanced yet').toBe(false);
    expect(beforeScroll.far, 'far below the fold: must not be enhanced yet').toBe(false);

    // Scroll so the viewport bottom edge (scrollY + 800) sits at 4500 --
    // "near" (top:5000) is 500px below the visible area: off screen, but
    // well inside the 1200px rootMargin. "far" (top:10000) is still
    // ~5500px away: outside the margin.
    await page.evaluate(() => window.scrollTo(0, 3700));
    await page.waitForFunction(() => window.scrollY >= 3700);
    await page.waitForTimeout(150);

    const afterScroll = await page.evaluate(() => {
      const near = document.getElementById('near-target')!;
      const far = document.getElementById('far-target')!;
      return {
        near: {
          enhanced: near.classList.contains('wb-ripple'),
          onScreen: near.getBoundingClientRect().top < window.innerHeight,
        },
        far: { enhanced: far.classList.contains('wb-ripple') },
      };
    });

    expect(afterScroll.near.onScreen, 'sanity check: the near element must still be off-screen for this assertion to mean anything').toBe(false);
    expect(afterScroll.near.enhanced, 'element 500px below the fold (inside the 1200px rootMargin) must already be enhanced -- this is the #491 fix').toBe(true);
    expect(afterScroll.far.enhanced, 'element ~5500px below the fold (outside the 1200px rootMargin) must stay lazy/unenhanced').toBe(false);
  });
});
