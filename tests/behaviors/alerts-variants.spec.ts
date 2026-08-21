/**
 * #176 / #375 / #727 — an alert's variant must be visible.
 *
 * Two claims, both of which lost their guard when #664 removed the showcase's
 * `<wb-demo>` sections:
 *
 *   #176 — `type=` is an alias for `variant`, and the four types are four
 *          colours (they all rendered "info" blue).
 *   #375 — alert() adds `.wb-alert` AND `.wb-alert--<variant>`; without the
 *          modifier class every alert rendered unstyled and identical.
 *
 * The old version scanned the page for `[x-alert][type="info"]` and failed with
 * "no alerts found on showcase" — the page builds its examples on demand now.
 * This drives the panel instead, and reads the rendered example, never a
 * browse-list row (#727).
 */
import { test, expect } from '@playwright/test';
import { openBehaviorsPanel, renderVariant, example, exampleStyle } from '../utils/behaviors-panel';

const VARIANTS = ['info', 'success', 'warning', 'error'] as const;

test.describe('#176/#375 — alert variants', () => {
  test('each variant carries wb-alert and its own modifier class', async ({ page }) => {
    await openBehaviorsPanel(page, 'x-alert');

    for (const variant of VARIANTS) {
      await renderVariant(page, 'x-alert', variant);
      const el = example(page);
      await expect(el, `${variant}: missing the base class`).toHaveClass(/\bwb-alert\b/);
      await expect(el, `${variant}: missing wb-alert--${variant}`)
        .toHaveClass(new RegExp(`\\bwb-alert--${variant}\\b`));
    }
  });

  test('the four variants render four distinct appearances', async ({ page }) => {
    await openBehaviorsPanel(page, 'x-alert');

    const seen: Record<string, string> = {};
    for (const variant of VARIANTS) {
      await renderVariant(page, 'x-alert', variant);
      // Alerts colour themselves through background AND border; take both, so a
      // theme that varies only one still reads as distinct.
      const bg = await exampleStyle(page, 'background-color');
      const border = await exampleStyle(page, 'border-color');
      seen[variant] = `${bg} | ${border}`;
    }

    const distinct = new Set(Object.values(seen));
    expect(
      distinct.size,
      'expected 4 distinct alert appearances, got:\n' +
      Object.entries(seen).map(([v, s]) => `  ${v}: ${s}`).join('\n'),
    ).toBe(VARIANTS.length);
  });

  test('what is measured is the rendered alert, not a list row', async ({ page }) => {
    await openBehaviorsPanel(page, 'x-alert');
    await renderVariant(page, 'x-alert', 'warning');

    const where = await example(page).evaluate((el) => ({
      insideExample: !!el.closest('#behaviors-live-example'),
      insideList: !!el.closest('.behaviors-search-results'),
    }));

    expect(where.insideExample, 'must measure inside the example wrapper').toBe(true);
    expect(where.insideList, 'must never measure a browse-list row (#727)').toBe(false);
  });
});
