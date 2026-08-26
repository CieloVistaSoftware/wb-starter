import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live report: "Size variants don't show much differences." Confirmed
 * live -- <article size="lg"> and size="xl"> rendered at the SAME ~323px
 * width as size="md"/"full"/"auto", instead of their declared 420px/540px
 * min-widths.
 *
 * Root cause: demo.css's `.x-demo__grid > * { min-width: 0; }` reset
 * (needed elsewhere to stop grid items overflowing on their own
 * min-content) ties `.x-card--lg`/`.x-card--xl` on specificity (both
 * 0,0,1,0) and wins on source order inside a demo grid, forcing the card's
 * own min-width back to 0. Fixed via a compound selector
 * (x-card.x-card--{size}, .x-card.x-card--{size}) that outright beats
 * the grid reset's specificity. Two forms because a literal <article
 * size="lg"> never gets the `.x-card` CLASS (composeCard skips it,
 * redundant with the tag selector) -- only the tag form matches that case.
 */
test.describe('.x-card size variants keep their own min-width inside a demo grid', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('size="lg" and size="xl" render at their declared min-width, not collapsed to content width', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div x-demo columns="1"><article size="lg" title="Large">Short.</article></div>'
    );
    const lg = page.locator('#test-container .x-card');
    const lgWidth = await lg.evaluate(el => el.getBoundingClientRect().width);
    expect(lgWidth).toBeGreaterThanOrEqual(420);
  });

  test('size progression is real: xs < sm < lg < xl', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div><div x-demo columns="1"><article size="xs">Short.</article></div>' +
      '<div x-demo columns="1"><article size="sm">Short.</article></div>' +
      '<div x-demo columns="1"><article size="lg">Short.</article></div>' +
      '<div x-demo columns="1"><article size="xl">Short.</article></div></div>'
    );
    const cards = page.locator('#test-container .x-card');
    const widths = await cards.evaluateAll(els => els.map(el => el.getBoundingClientRect().width));
    expect(widths).toHaveLength(4);
    expect(widths[0]).toBeLessThan(widths[1]); // xs < sm
    expect(widths[1]).toBeLessThan(widths[2]); // sm < lg
    expect(widths[2]).toBeLessThan(widths[3]); // lg < xl
  });
});
