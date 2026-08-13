import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live report: "Size variants don't show much differences." Confirmed
 * live -- <wb-card size="lg"> and size="xl"> rendered at the SAME ~323px
 * width as size="md"/"full"/"auto", instead of their declared 420px/540px
 * min-widths.
 *
 * Root cause: demo.css's `.wb-demo__grid > * { min-width: 0; }` reset
 * (needed elsewhere to stop grid items overflowing on their own
 * min-content) ties `.wb-card--lg`/`.wb-card--xl` on specificity (both
 * 0,0,1,0) and wins on source order inside a demo grid, forcing the card's
 * own min-width back to 0. Fixed via a compound selector
 * (wb-card.wb-card--{size}, .wb-card.wb-card--{size}) that outright beats
 * the grid reset's specificity. Two forms because a literal <wb-card
 * size="lg"> never gets the `.wb-card` CLASS (composeCard skips it,
 * redundant with the tag selector) -- only the tag form matches that case.
 */
test.describe('wb-card size variants keep their own min-width inside a demo grid', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('size="lg" and size="xl" render at their declared min-width, not collapsed to content width', async ({ page }) => {
    await setupTestContainer(
      page,
      '<wb-demo columns="1"><wb-card size="lg" title="Large">Short.</wb-card></wb-demo>'
    );
    const lg = page.locator('#test-container wb-card');
    const lgWidth = await lg.evaluate(el => el.getBoundingClientRect().width);
    expect(lgWidth).toBeGreaterThanOrEqual(420);
  });

  test('size progression is real: xs < sm < lg < xl', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div><wb-demo columns="1"><wb-card size="xs">Short.</wb-card></wb-demo>' +
      '<wb-demo columns="1"><wb-card size="sm">Short.</wb-card></wb-demo>' +
      '<wb-demo columns="1"><wb-card size="lg">Short.</wb-card></wb-demo>' +
      '<wb-demo columns="1"><wb-card size="xl">Short.</wb-card></wb-demo></div>'
    );
    const cards = page.locator('#test-container wb-card');
    const widths = await cards.evaluateAll(els => els.map(el => el.getBoundingClientRect().width));
    expect(widths).toHaveLength(4);
    expect(widths[0]).toBeLessThan(widths[1]); // xs < sm
    expect(widths[1]).toBeLessThan(widths[2]); // sm < lg
    expect(widths[2]).toBeLessThan(widths[3]); // lg < xl
  });
});
