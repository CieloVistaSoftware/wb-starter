import { test, expect } from '../fixtures/offline';

/**
 * #1014: transitions.css's reduced-motion block used to repeat
 * `transition: none !important; animation: none !important` for the page,
 * the site nav and the footer links. normalize.css's own reduced-motion rule
 * already cuts every element to 0.01ms (by specificity since 2026-10-09, no
 * !important either), so the copy was
 * removed. This proves the nav and page still do not animate for a reader
 * who asked for reduced motion.
 */
test('with reduced motion, the site nav and page carry no real transition or animation', async ({ page }) => {
  // page.emulateMedia, not test.use({ reducedMotion }): the offline fixture's
  // context does not carry that option through, and the page saw no preference.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await expect(page.locator('.site__nav').first()).toBeAttached();
  const durations = await page.evaluate(() => {
    const secs = (v: string) => Math.max(...v.split(',').map((d) => parseFloat(d) * (d.trim().endsWith('ms') ? 0.001 : 1)));
    return Array.from(document.querySelectorAll('.site__nav, .page, .footer__social-link'), (el) => {
      const cs = getComputedStyle(el);
      return {
        el: el.className,
        transition: secs(cs.transitionDuration),
        animation: secs(cs.animationDuration),
      };
    });
  });
  expect(durations.length, 'the page should have a site nav to check').toBeGreaterThan(0);
  for (const d of durations) {
    expect(d.transition, `${d.el}: transition-duration`).toBeLessThanOrEqual(0.001);
    expect(d.animation, `${d.el}: animation-duration`).toBeLessThanOrEqual(0.001);
  }
});

/**
 * #1014: normalize.css's resets lost their !important and win by specificity,
 * `:is(*, #_#_)` = two IDs. The site pages hold no [hidden] element and no
 * ID-selector transition, so this builds both: a class or single-ID rule that
 * sets display or a transition must still lose to the reset.
 */
test('the reduced-motion and [hidden] resets beat class and ID rules without !important', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.site__nav').first()).toBeAttached();
  const seen = await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = [
      '.reset-probe-flex { display: flex; }',
      '#reset-probe-grid { display: grid; }',
      '.reset-probe-move { transition: opacity 2s; animation: reset-probe-spin 3s infinite; }',
      '#reset-probe-id { transition-duration: 4s; scroll-behavior: smooth; }',
      '.reset-probe-move::after { content: "x"; transition: opacity 5s; }',
      '@keyframes reset-probe-spin { to { opacity: .5; } }',
    ].join('\n');
    document.head.append(style);
    const host = document.createElement('div');
    host.innerHTML = '<div class="reset-probe-flex" hidden></div><div id="reset-probe-grid" hidden></div>'
      + '<div class="reset-probe-move"></div><div id="reset-probe-id" class="reset-probe-move"></div>';
    document.body.append(host);
    const [flex, grid, move, id] = Array.from(host.children);
    const after = getComputedStyle(move, '::after');
    return {
      flexDisplay: getComputedStyle(flex).display,
      gridDisplay: getComputedStyle(grid).display,
      moveTransition: getComputedStyle(move).transitionDuration,
      moveAnimation: getComputedStyle(move).animationDuration,
      moveIterations: getComputedStyle(move).animationIterationCount,
      afterTransition: after.transitionDuration,
      idTransition: getComputedStyle(id).transitionDuration,
      idScroll: getComputedStyle(id).scrollBehavior,
    };
  });
  expect(seen).toEqual({
    flexDisplay: 'none',
    gridDisplay: 'none',
    moveTransition: '1e-05s',
    moveAnimation: '1e-05s',
    moveIterations: '1',
    afterTransition: '1e-05s',
    idTransition: '1e-05s',
    idScroll: 'auto',
  });
});
