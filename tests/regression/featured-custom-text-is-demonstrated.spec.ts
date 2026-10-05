import { test, expect } from '../fixtures/offline';

/**
 * #1542 -- John, on the Behaviors page's `article · featuredTone=info` row,
 * arrow at the FEATURED marker: "How is this text overridden with user text?"
 *
 * `featured="Deal of the week"` has printed that wording since #886
 * (featured-promotes-the-card.spec.ts proves the rendering). What was missing
 * was the page ever SHOWING it: `featured` is a boolean in card.schema.json,
 * so the demo list built exactly one row for it -- the bare flag -- and all
 * six featuredTone rows print the default word. The catalogue's authored
 * examples (#997) carry the custom-text row, in both authoring forms.
 *
 * Asserted on the page itself, not the JSON: a catalogue entry the list
 * never shows would answer nothing.
 */
const ROW_LABEL = 'featured with your own text';

for (const form of ['semantic', 'attribute'] as const) {
  test(`x-card (${form}): the demo list shows a featured marker with custom text`, async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#behaviors-search', { timeout: 20_000 });
    await page.waitForFunction(
      () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
      undefined,
      { timeout: 20_000 },
    );
    await page.check(`#behaviors-form-filter input[value="${form}"]`);
    // A behavior's rows sit in a collapsed group (#995); a query opens the
    // groups it matches, which is how a reader would find this row.
    await page.fill('#behaviors-search', ROW_LABEL);

    const row = page.locator('.behaviors-search-results__row', {
      has: page.locator('.behaviors-search-results__variant', { hasText: ROW_LABEL }),
    });
    await expect(row, `no "${ROW_LABEL}" row in the ${form} list`).toHaveCount(1);
    await row.click();

    // The marker is the card's <mark>; it must read the author's words, not
    // the default "Featured".
    const marker = page.locator('#behaviors-live-example mark');
    await expect(marker).toHaveText('Deal of the week', { timeout: 10_000 });
    await expect(marker).toBeVisible();
  });
}
