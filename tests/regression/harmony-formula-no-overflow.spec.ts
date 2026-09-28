import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * pages/themes.html: "no text anywhere on this site can overwrite its
 * parent element" -- the Triadic/Split-Complementary harmony-formula
 * boxes overflowed their card ("Colors = Primary + 0°, 120°, 240°").
 * Root cause: code.js's inline-<code> nowrap fix (for short tag-name
 * chips like `<article>`) applied `white-space: nowrap` to ALL inline
 * code unconditionally, including multi-word formula text that must
 * wrap at spaces to fit its container. Fixed to only force nowrap when
 * the content has no whitespace (a single token).
 *
 * That fix was later reversed on purpose: DEMOS-AND-DOCS-STANDARDS §6, "Code
 * text never wraps -- ever" (John: "CODE TEXT CANNOT WRAP EVER"). Long code
 * takes horizontal scroll instead. So the formulas are now REQUIRED to stay on
 * one line, and what this spec guards is the original complaint: no formula
 * may run past its box unreadably -- it either fits or scrolls.
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

    const { whiteSpace, overflowing, overflowX, text } = await el.evaluate((node) => ({
      whiteSpace: getComputedStyle(node).whiteSpace,
      overflowing: node.scrollWidth > node.clientWidth + 1,
      overflowX: getComputedStyle(node).overflowX,
      text: node.textContent?.trim(),
    }));
    expect(whiteSpace, `harmony-formula #${i} ("${text}") is code and must not wrap (§6)`).toBe('nowrap');
    if (overflowing) {
      expect(['auto', 'scroll'], `harmony-formula #${i} ("${text}") runs past its box and must scroll, not clip`).toContain(overflowX);
    }
  }
});

test('?page=behaviors: single-token inline code chip still never wraps mid-word (no regression)', async ({ page }) => {
  // The Behaviors page no longer has a #components-hero with a `.x-card` chip
  // in it (#666/#910 replaced the page), so the chip is authored here, in the
  // narrow column that used to squeeze it.
  await setupBehaviorTest(page);
  await setupTestContainer(page, '<p style="width:4rem">Use <code>.x-card</code> on it</p>');
  const codeChip = page.locator('#test-container code', { hasText: '.x-card' }).first();
  await expect(codeChip).toBeVisible({ timeout: 10000 });
  await expect(codeChip).toHaveCSS('white-space', 'nowrap');
});
