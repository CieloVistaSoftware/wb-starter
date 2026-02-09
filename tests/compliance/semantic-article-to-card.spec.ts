import { test, expect } from '@playwright/test';

test('semantic <article> should be processed to card synchronously on page load', async ({ page }) => {
  await page.goto('/tests/repro_card_semantic.html');

  // The semantic article should be processed into a card (class or data-wb-schema present)
  const article = page.locator('article').first();
  await expect(article).toHaveClass(/wb-card|wb-card__header|card/);

  // Also accept explicit wb-card tag or data-wb-schema attribute
  const hasSchema = await page.locator('article[data-wb-schema="card"]').count();
  const hasWbCard = await page.locator('wb-card').count();
  expect(hasSchema + hasWbCard, 'article must be converted to card or have wb-card counterpart').toBeGreaterThan(0);
});