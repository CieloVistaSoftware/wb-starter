import { test, expect } from '@playwright/test';

/**
 * pages/themes.html: "no text anywhere on this site can overwrite its
 * parent element" -- the Triadic/Split-Complementary harmony-formula
 * boxes overflowed their card ("Colors = Primary + 0°, 120°, 240°").
 * Root cause: code.js's inline-<code> nowrap fix (for short tag-name
 * chips like `<article>`) applied `white-space: nowrap` to ALL inline
 * code unconditionally, including multi-word formula text that must
 * wrap at spaces to fit its container. Fixed to only force nowrap when
 * the content has no whitespace (a single token).
 */

test('?page=themes: harmony-formula code boxes wrap instead of overflowing their card', async ({ page }) => {
  await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

  const formulas = page.locator('.harmony-formula');
  await expect(formulas.first()).toBeVisible({ timeout: 10000 });
  const count = await formulas.count();
  expect(count).toBeGreaterThanOrEqual(4);

  for (let i = 0; i < count; i++) {
    const el = formulas.nth(i);
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();

    const { whiteSpace, overflowing, text } = await el.evaluate((node) => ({
      whiteSpace: getComputedStyle(node).whiteSpace,
      overflowing: node.scrollWidth > node.clientWidth + 1,
      text: node.textContent?.trim(),
    }));
    expect(whiteSpace, `harmony-formula #${i} ("${text}") must wrap normally, not nowrap`).toBe('normal');
    expect(overflowing, `harmony-formula #${i} ("${text}") must not overflow its own box`).toBe(false);
  }
});

test('?page=components: single-token inline code chip still never wraps mid-word (no regression)', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

  const hero = page.locator('#components-hero');
  const codeChip = hero.locator('code', { hasText: 'x-card' }).first();
  await expect(codeChip).toBeVisible({ timeout: 10000 });
  await expect(codeChip).toHaveCSS('white-space', 'nowrap');
});
