import { test, expect } from '../fixtures/offline';

test('semantic <article> should be processed to card synchronously on page load', async ({ page }) => {
  await page.goto('/tests/fixtures/repro/card-semantic.html');

  // The semantic article should be processed into a card. Cards stopped
  // stamping .x-card / .x-card__* (a8a7362e): card.css matches `article` and
  // its parts by tag, so "processed" is the behavior's own completion signal.
  // (The part-count check that stood here compared two selectors that both
  // matched nothing -- 0 === 0 -- so it asserted nothing.)
  const article = page.locator('article').first();
  await expect(article).toHaveAttribute('x-ready', '');

  // Should keep its authored card structure as direct children
  await expect(article.locator(':scope > header')).toHaveCount(1);
  await expect(article.locator(':scope > .x-card__body')).toHaveCount(1);
  await expect(article.locator(':scope > footer')).toHaveCount(1);

  // Should be styled as a card (not just a plain article)
  await expect(article).toHaveCSS('display', 'flex'); // x-card is a flex container

});