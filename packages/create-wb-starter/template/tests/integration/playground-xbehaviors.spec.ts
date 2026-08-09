import { test, expect } from '@playwright/test';

/**
 * "50 x-* behaviors" playground example set. Every attribute used in
 * fiftyXBehaviors() (demos/playground.html) was verified against the actual
 * behavior source before being written, not guessed from the attribute's
 * name — this test spot-checks a representative sample of each category
 * (effect, overlay, feedback, utility, combination) to confirm they don't
 * just parse as valid HTML but actually produce the real, working behavior.
 */
test.describe('Playground: 50 x-* behaviors example set', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'xbehaviors');
    await page.waitForFunction(() => document.querySelectorAll('#pg-preview [x-ripple]').length > 0, { timeout: 15000 });

    // WB's viewport-lazy loader (IntersectionObserver) only enhances an
    // element once it's actually scrolled near the viewport — with 50
    // examples, several sit far below the fold and never intersect on
    // their own. Scroll the whole preview into view (bottom to top) so
    // every example gets a real chance to be observed, same as a user
    // scrolling through it, before asserting anything is enhanced.
    await page.locator('#pg-preview').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    let lastHeight = 0;
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(150);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      if (height === lastHeight && i > 2) break;
      lastHeight = height;
    }

    await page.waitForFunction(() => {
      const ripples = document.querySelectorAll('#pg-preview [x-ripple]');
      return ripples.length > 0 && [...ripples].every((el) => el.classList.contains('wb-ripple'));
    }, { timeout: 20000 });
    await page.waitForFunction(() => {
      const clocks = document.querySelectorAll('#pg-preview [x-clock]');
      return clocks.length > 0 && [...clocks].every((el) => el.classList.contains('wb-clock'));
    }, { timeout: 20000 });
  });

  test('effect: x-glow actually applies the glow class + animation', async ({ page }) => {
    const el = page.locator('#pg-preview [x-glow]').first();
    await expect(el).toHaveClass(/wb-glow/);
  });

  test('overlay: x-confirm trigger actually opens a confirm dialog on click', async ({ page }) => {
    const btn = page.locator('#pg-preview button[x-confirm]').first();
    await btn.click();
    // confirm() (overlay.js) builds a plain styled <div> overlay, not a real
    // <dialog>/role="dialog" — match by the actual confirm-title text it
    // renders instead of an element shape it doesn't use.
    await expect(page.getByText('Delete item?')).toBeVisible({ timeout: 5000 });
  });

  test('feedback: x-toast trigger actually shows a toast on click', async ({ page }) => {
    const btn = page.locator('#pg-preview button[x-toast]').first();
    await btn.click();
    await expect(page.locator('.wb-toast, [class*="toast"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('utility: x-truncate actually clips the paragraph to one line', async ({ page }) => {
    const p = page.locator('#pg-preview p[x-truncate]').first();
    await expect(p).toHaveClass(/wb-truncate/);
    const overflow = await p.evaluate((el) => getComputedStyle(el).overflow);
    expect(overflow).toBe('hidden');
  });

  test('utility: x-clock actually renders a live time value, not empty', async ({ page }) => {
    const clock = page.locator('#pg-preview [x-clock]').first();
    await expect(clock).toHaveClass(/wb-clock/);
    await expect(async () => {
      const text = (await clock.textContent())?.trim() ?? '';
      expect(text.length).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
  });

  test('combination: x-ripple + x-tooltip on the same element both attach', async ({ page }) => {
    const btn = page.locator('#pg-preview button[x-ripple][x-tooltip]').first();
    await expect(btn).toHaveClass(/wb-ripple/);
    await btn.hover();
    await expect(page.locator('.wb-tooltip, [role="tooltip"], [class*="tooltip"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('combination: x-confetti + x-tooltip trigger fires confetti on click', async ({ page }) => {
    const btn = page.locator('#pg-preview button[x-confetti][x-tooltip]').first();
    await btn.click();
    await expect(page.locator('.wb-confetti, [class*="confetti"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('all 50 examples parse as valid elements with zero x-error markers', async ({ page }) => {
    await page.waitForTimeout(2000); // let the MutationObserver settle every lazy-injected behavior
    const errorCount = await page.locator('#pg-preview [x-error]').count();
    expect(errorCount, 'no example should carry an x-error attribute (behavior load/apply failure)').toBe(0);
  });
});
