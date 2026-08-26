import { test, expect } from '@playwright/test';

/**
 * #202 REGRESSION — runs in the gate, ALWAYS. The card double/quadruple title kept
 * coming back because TWO renderers built a card: the card behavior (.x-card__*)
 * AND a legacy MVVM template (schema $view / views-registry / partial → .card__*),
 * nesting → duplicate title/footer.
 *
 * It only reproduced on a SCHEMA-PROCESSED page (the SPA components page, where WB
 * assigns x-schema="card"), NOT the playground — the earlier test missed it by not
 * exercising that path (and by having its duplicate assertion trimmed out). These
 * assert on the schema-processed page.
 */
test('x-card injects no phantom placeholder content (no "Lorem ipsum") (#202)', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });

  const imgCard = page.locator('x-cardimage').filter({ hasText: 'Image Card' }).first();
  await expect(imgCard).toBeVisible({ timeout: 20000 });

  const text = (await imgCard.textContent()) || '';
  expect(text, 'card must not inject placeholder text (Lorem ipsum)').not.toMatch(/Lorem ipsum/i);
});

test('cards render title/footer exactly once on the schema-processed page (#202)', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });

  await expect
    .poll(() => page.locator('x-card .x-card__title').count(), { timeout: 20000 })
    .toBeGreaterThan(0);

  const report = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('x-card')];
    const overCounted: { title: string; count: number }[] = [];
    for (const c of cards) {
      const title = c.getAttribute('title');
      if (!title) continue;
      const re = new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const count = (c.textContent!.match(re) || []).length;
      if (count > 1) overCounted.push({ title, count });
    }
    return {
      overCounted,
      // Zero LEGACY .card__* — the behavior renders .x-card__* only.
      legacyCardTitles: document.querySelectorAll('x-card .card__title').length,
      legacyCardHeaders: document.querySelectorAll('x-card .card__header').length,
    };
  });

  expect(report.overCounted, `cards whose title text repeats:\n${JSON.stringify(report.overCounted, null, 2)}`).toEqual([]);
  expect(report.legacyCardTitles, 'no legacy .card__title (only .x-card__title)').toBe(0);
  expect(report.legacyCardHeaders, 'no legacy .card__header (only .x-card__header)').toBe(0);
});
