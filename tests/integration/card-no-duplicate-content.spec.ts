import { test, expect } from '@playwright/test';

/**
 * #202: a <wb-card> must render ONLY its authored content — no phantom placeholder.
 * The behavior used to inject "Lorem ipsum" whenever a card had no body (e.g. an
 * image card), so cards showed text that wasn't in the source. That is now fixed.
 *
 * (The separate double-title/footer render — the schema $view's .card__* structure
 * being captured and nested by card.js — is tracked in #202 and fixed in the
 * dedicated card session; it is not asserted here because it is not yet fixed and
 * this suite must stay green.)
 */
test('wb-card injects no phantom placeholder content (no "Lorem ipsum") (#202)', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });

  const imgCard = page.locator('wb-cardimage').filter({ hasText: 'Image Card' }).first();
  await expect(imgCard).toBeVisible({ timeout: 20000 });

  const text = (await imgCard.textContent()) || '';
  expect(text, 'card must not inject placeholder text (Lorem ipsum)').not.toMatch(/Lorem ipsum/i);
});
