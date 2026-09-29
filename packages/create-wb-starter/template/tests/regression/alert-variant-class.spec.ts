import { test, expect } from '../fixtures/offline';
import { openBehaviorsPanel, renderVariant, example } from '../utils/behaviors-panel';

/**
 * REGRESSION (#375 / BUG-2026-07-27-002): plain <div x-alert variant="...">
 * triggers (the form pages/behaviors.html and scripts/generate-behaviors-page.js
 * emit, distinct from the schema-driven <div x-alert type="..."> component
 * already covered by tests/behaviors/alerts-variants.spec.ts) rendered with
 * NO styling at all -- alert() in src/wb-viewmodels/feedback.js set a
 * `variant` attribute but never added the `.x-alert` base class or the
 * `.x-alert--<variant>` modifier class that src/styles/behaviors/alert.css
 * actually targets, so every alert (info/success/warning/error alike)
 * rendered as an unstyled div.
 */
// The showcase no longer hosts static `<div x-alert>` sections (#664) -- it
// builds each example on demand in #behaviors-live-example -- so a page-wide
// `[x-alert][variant="warning"]` scan found nothing. Drive the panel instead
// and read the rendered example (tests/utils/behaviors-panel.ts, #727).
// The classes are x-alert / x-alert--<variant>: the wb- prefix is retired and
// alert.css styles only the x- names.
test.describe('x-alert gets [x-alert] + x-alert--<variant> classes (#375)', () => {
  test('warning and error alerts on the Behaviors showcase are visually distinct, not unstyled', async ({ page }) => {
    await openBehaviorsPanel(page, 'x-alert');

    const bg: Record<string, string> = {};
    for (const variant of ['warning', 'error']) {
      await renderVariant(page, 'x-alert', variant);
      const alert = example(page);
      await expect(alert, `Behaviors showcase should render a variant="${variant}" alert`)
        .toHaveAttribute('variant', variant);
      await expect(alert).toHaveClass(/\bx-alert\b/);
      await expect(alert).toHaveClass(new RegExp(`\\bx-alert--${variant}\\b`));
      bg[variant] = await alert.evaluate(el => getComputedStyle(el).backgroundColor);
    }

    const TRANSPARENT = 'rgba(0, 0, 0, 0)';
    expect(bg.warning, 'warning alert must have a real background, not the unstyled default').not.toBe(TRANSPARENT);
    expect(bg.error, 'error alert must have a real background, not the unstyled default').not.toBe(TRANSPARENT);
    expect(bg.warning, 'warning and error alerts must be visually distinct').not.toBe(bg.error);
  });
});
