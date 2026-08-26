import { test, expect } from '@playwright/test';
import {
  openBehaviorsPanel,
  renderVariant,
  example,
  exampleStyle,
} from '../utils/behaviors-panel';

/**
 * button() (src/wb-viewmodels/semantics/button.js) maps a native
 * <button size="…" variant="…">'s attributes to `.x-button--{value}` modifier
 * CLASSES — a native <button> cannot be styled through the tag+attribute
 * selectors used for the real <button> custom element. The behavior's
 * injected CSS once declared only `x-button[size="sm"]`-style rules, so every
 * class the JS added had no matching CSS and all sizes rendered identically.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS SPEC WAS REWRITTEN (#752)
 *
 * It located buttons with `page.locator('button', { hasText: 'Small' })`
 * against the whole page. #664 removed the per-category <div x-demo> sections, so
 * those buttons no longer exist there — and `hasText: 'Primary'` now matches
 * the browse-list ROWS, whose variant column literally reads "primary".
 *
 * It was therefore measuring three list rows, identical by design, and
 * reporting "expected 3 distinct backgrounds". Not a styling bug: a test
 * pointing at the wrong elements. #727 fixed exactly this in
 * alerts-variants.spec.ts and named this file as still making the mistake; it
 * was never followed up.
 *
 * Everything below reads from inside `#behaviors-live-example` through the
 * shared driver — the rendered example, never a list row.
 * ─────────────────────────────────────────────────────────────────────────
 */
test.describe('Native <button> size/variant attributes actually apply', () => {
  test('each size applies its modifier class and a distinct font-size', async ({ page }) => {
    await openBehaviorsPanel(page, 'button');

    const seen: Record<string, string> = {};
    for (const size of ['sm', 'md', 'lg']) {
      await renderVariant(page, 'button', size);

      // The class is the mechanism under test: attribute selectors never match
      // a native <button>, so the class is what makes the CSS apply at all.
      await expect(
        example(page),
        `size="${size}" did not put x-button--${size} on the rendered button`,
      ).toHaveClass(new RegExp(`x-button--${size}\\b`));

      seen[size] = await exampleStyle(page, 'font-size');
    }

    // And the class must MEAN something. Three classes that all compute to the
    // same font-size would pass the assertions above while looking identical
    // on screen — which is the bug this spec exists to catch.
    expect(
      new Set(Object.values(seen)).size,
      `expected three distinct font-sizes, got ${JSON.stringify(seen)}`,
    ).toBe(3);
  });

  test('each variant applies its modifier class and a distinct background', async ({ page }) => {
    await openBehaviorsPanel(page, 'button');

    const seen: Record<string, string> = {};
    for (const variant of ['primary', 'secondary', 'ghost']) {
      await renderVariant(page, 'button', variant);

      await expect(
        example(page),
        `variant="${variant}" did not put x-button--${variant} on the rendered button`,
      ).toHaveClass(new RegExp(`x-button--${variant}\\b`));

      seen[variant] = await exampleStyle(page, 'background-color');
    }

    expect(
      new Set(Object.values(seen)).size,
      `expected three distinct backgrounds, got ${JSON.stringify(seen)}`,
    ).toBe(3);
  });
});
