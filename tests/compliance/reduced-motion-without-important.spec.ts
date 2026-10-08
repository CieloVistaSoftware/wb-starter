import { test, expect } from '../fixtures/offline';

/**
 * #1014: transitions.css's reduced-motion block used to repeat
 * `transition: none !important; animation: none !important` for the page,
 * the site nav and the footer links. normalize.css's own reduced-motion rule
 * already cuts every element to 0.01ms with !important, so the copy was
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
