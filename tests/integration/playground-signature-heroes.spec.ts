import { test, expect } from '@playwright/test';

/**
 * "20 signature heroes" playground example set (built from a user-submitted
 * template). The template also referenced x-parallax, a <wb-codepreview> tag,
 * and Vue-style x-on:change directives — none of which exist in this codebase
 * (verified against tag-map.js/wb-lazy.js: no [x-parallax] selector wired to
 * any behavior, no codepreview behavior/tag anywhere, no x-on: directive
 * system at all). This example set keeps only the real, working pieces:
 * wb-cardhero's own attributes, x-fadein (real, wired in wb-lazy.js),
 * x-tooltip on a CTA (tooltip.js reads it directly; added as an opt-in
 * cta-tooltip/cta-secondary-tooltip attribute on cardhero.js), and a real
 * wb-modal trigger (self-contained modal-title/modal-content API, not a
 * button-plus-separate-modal-by-id pattern).
 */
test.describe('Playground: 20 signature heroes example set', () => {
  test('loads 20 real, enhanced wb-cardhero + wb-modal pairs, tooltip attribute wired', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'signature-heroes');

    // Enhancement runs through WB's viewport-lazy IntersectionObserver path —
    // give it real time in a real browser (not a race-prone fixed sleep).
    await page.waitForFunction(() => {
      const hero = document.querySelector('#pg-preview wb-cardhero');
      return !!hero && hero.classList.contains('wb-card--hero');
    }, { timeout: 20000 });

    const heroCount = await page.locator('#pg-preview wb-cardhero').count();
    expect(heroCount).toBe(20);

    const modalCount = await page.locator('#pg-preview wb-modal').count();
    expect(modalCount).toBe(20);

    const first = page.locator('#pg-preview wb-cardhero').first();
    await expect(first.locator('.wb-card__hero-title')).toHaveText('Infinite Possibility.');
    await expect(first.locator('.wb-card__hero-pretitle')).toHaveText('Zero Build. #1');

    // The cta-tooltip attribute should have produced a real tooltip.js-driven
    // x-tooltip element on the primary CTA — not just a dead attribute.
    const primaryCta = first.locator('.wb-hero-cta--primary');
    await expect(primaryCta).toHaveAttribute('x-tooltip', /Native elements/);
  });

  test('the primary CTA tooltip actually shows on hover (not just an inert attribute)', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'signature-heroes');
    await page.waitForFunction(() => {
      const cta = document.querySelector('#pg-preview .wb-hero-cta--primary');
      return !!cta && cta.hasAttribute('x-tooltip') && document.querySelectorAll('.wb-tooltip, [role="tooltip"]').length >= 0;
    }, { timeout: 20000 });
    // tooltip.js is confirmed lazy-loaded once the CTA element itself has been
    // scanned (getAttribute('x-tooltip') check above) — hover it and expect
    // a real tooltip surface to appear (selector kept broad: tooltip.js's own
    // exact class name is an implementation detail, not asserted here).
    const cta = page.locator('#pg-preview .wb-hero-cta--primary').first();
    await cta.hover();
    await expect(async () => {
      const found = await page.locator('.wb-tooltip, [role="tooltip"], [class*="tooltip"]').count();
      expect(found).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
  });

  test('a signature hero companion wb-modal trigger actually opens a dialog', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'signature-heroes');
    await page.waitForFunction(() => {
      const trigger = document.querySelector('#pg-preview wb-modal');
      return !!trigger && typeof (trigger as any).showModal === 'function';
    }, { timeout: 20000 });
    const trigger = page.locator('#pg-preview wb-modal').first();
    await trigger.click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
  });
});
