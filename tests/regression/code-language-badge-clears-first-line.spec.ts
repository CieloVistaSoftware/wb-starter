/**
 * THE LANGUAGE BADGE NEVER SITS ON TOP OF THE CODE
 * ================================================
 * John, arrows on all three cards of `?page=themes` -> "How to Use Themes":
 * "The code type is overwritting the code samples." (#1023)
 *
 * Measured before the fix, identically on all three:
 *
 *     codePaddingTop  3px      <- should be 2rem, reserved by .x-code--has-badge
 *     badgeBottom     5971
 *     firstTextTop    5949     <- 22px of overlap
 *
 * `.x-code__language` is absolutely positioned over the box, and
 * `.x-code--has-badge { padding-top: 2rem }` is what keeps the first line out
 * from under it. Two cascade defeats, and fixing either one alone still leaves
 * the badge on the code:
 *
 *   1. the highlight.js theme <link> is appended to <head> at RUNTIME, so its
 *      `.hljs { padding: 3px }` is later than code.css at equal specificity;
 *   2. the badge rules were declared ABOVE `.x-code--block`, whose
 *      `padding: 1rem` then overwrote padding-top anyway.
 *
 * This test measures geometry on the rendered page: a CSS fix that is only read
 * back, never measured, is not a fix (#965).
 */

import { test, expect } from '@playwright/test';

type BadgeMeasurement = {
  badge: string;
  paddingTop: number;
  clearance: number;
};

async function measureBadges(page: import('@playwright/test').Page): Promise<BadgeMeasurement[]> {
  return page.evaluate(() => {
    return [...document.querySelectorAll('.x-code__language')].map((b) => {
      const host = b.parentElement as HTMLElement;
      const code = (host.querySelector('code, .x-code') || host) as HTMLElement;
      const cs = getComputedStyle(code);
      const badgeRect = b.getBoundingClientRect();
      const codeRect = code.getBoundingClientRect();
      // Where the first line of text actually starts: the box top plus whatever
      // padding survived the cascade.
      const firstLineTop = codeRect.top + parseFloat(cs.paddingTop);
      return {
        badge: (b.textContent || '').trim(),
        paddingTop: parseFloat(cs.paddingTop),
        clearance: Math.round(firstLineTop - badgeRect.bottom),
      };
    });
  });
}

test.describe('code language badge clears the code (#1023)', () => {
  test('themes page: every badge sits above its first line, not on it', async ({ page }) => {
    await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.querySelectorAll('.x-code__language').length >= 3,
      undefined,
      { timeout: 20_000 },
    );
    // The theme stylesheet is appended at runtime and is half the bug — give the
    // cascade it creates a moment to exist before measuring against it.
    await page.waitForFunction(
      () => !!document.querySelector('link[data-highlight-theme]'),
      undefined,
      { timeout: 20_000 },
    ).catch(() => { /* no code-theme control on this page: measure anyway */ });

    const measured = await measureBadges(page);
    expect(measured.length).toBeGreaterThanOrEqual(3);

    for (const m of measured) {
      expect(
        m.clearance,
        `THE BADGE IS BACK ON THE CODE: "${m.badge}" overlaps the first line by `
        + `${-m.clearance}px (padding-top computed ${m.paddingTop}px, expected 32). `
        + 'Check that .x-code--has-badge is still paired with .hljs AND still declared '
        + 'after .x-code--block in code.css.',
      ).toBeGreaterThanOrEqual(0);

      expect(m.paddingTop).toBeGreaterThanOrEqual(30);
    }
  });
});
