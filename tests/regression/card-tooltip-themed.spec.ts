import { test, expect } from '@playwright/test';

/**
 * #283: <article> hover text was only ever wired to the NATIVE browser
 * `title` attribute (cardBase(), card.js -- `element.setAttribute('title',
 * config.hoverText)`), which is unstyled, slow to appear, and inconsistent
 * across browsers. John: "is Hover text a settable prop?" -- yes, and it
 * should render the same themed tooltip (`.x-tooltip`, tooltip.js) used
 * everywhere else in WB-Starter (e.g. cardhero's CTA buttons already wire
 * `x-tooltip` for exactly this reason).
 *
 * Fix: cardBase() now reads a `tooltip` attribute (WB-standard name per
 * docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md's cheat sheet)
 * with `hoverText`/`hover-text` kept as the pre-existing documented alias,
 * sets `x-tooltip` on the element, and calls tooltip.js's tooltip() behavior
 * directly (not relying on WB's scan/observer, which doesn't cover a plain
 * attribute change on an already-connected element). A card with neither
 * `tooltip` nor `hoverText` set -- only a plain `title` -- keeps the native
 * browser tooltip working exactly as before.
 */
test.describe('.x-card tooltip -- themed hover text (#283)', () => {
  test('tooltip attribute shows the themed .x-tooltip on hover, not native title', async ({ page }) => {
    await page.goto('/tests/fixtures/card-tooltip.html');
    const card = page.locator('#card-tooltip');
    await card.waitFor();

    // The heading itself still renders from `title` (its normal job)...
    await expect(card.locator('.x-card__title')).toHaveText('Card Heading');
    // ...but the themed behavior takes over the hover experience -- the
    // literal `title` DOM attribute must not remain (tooltip.js strips it),
    // so there's no double native+themed tooltip on hover.
    await expect(card).not.toHaveAttribute('title', /.+/);
    await expect(card).toHaveAttribute('x-tooltip', 'Themed tooltip text');

    await card.hover();
    const tip = page.locator('.x-tooltip', { hasText: 'Themed tooltip text' });
    await expect(tip).toBeVisible();
    await expect(tip).toHaveClass(/x-tooltip--visible/);
  });

  test('hover-text alias also shows the themed tooltip', async ({ page }) => {
    await page.goto('/tests/fixtures/card-tooltip.html');
    const card = page.locator('#card-hovertext');
    await card.waitFor();

    await expect(card).toHaveAttribute('x-tooltip', 'Themed hover-text alias');

    await card.hover();
    const tip = page.locator('.x-tooltip', { hasText: 'Themed hover-text alias' });
    await expect(tip).toBeVisible();
  });

  test('a card with only a plain title attribute does not get a themed tooltip', async ({ page }) => {
    await page.goto('/tests/fixtures/card-tooltip.html');
    const card = page.locator('#card-plain-title');
    await card.waitFor();

    // No tooltip/hoverText was set -- cardBase must not synthesize x-tooltip,
    // and the plain title attribute must be left alone (still a normal
    // native tooltip, per #283's "keep native title working too").
    await expect(card).not.toHaveAttribute('x-tooltip', /.+/);
    await expect(card).toHaveAttribute('title', 'Just a heading, also a native title attribute');

    await card.hover();
    await page.waitForTimeout(300); // longer than tooltip.js's 200ms show delay
    await expect(page.locator('.x-tooltip')).toHaveCount(0);
  });
});
