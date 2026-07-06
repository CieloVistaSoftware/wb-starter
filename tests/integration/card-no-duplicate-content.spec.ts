import { test, expect } from '@playwright/test';

/**
 * #202: a <wb-card> must render its title and footer EXACTLY ONCE — no duplicate text.
 *
 * ROOT CAUSE (found): the card double/quadruple-renders. `x-schema="card"` makes the
 * schema $view build a legacy `.card__*` structure, while `card.js` also builds the
 * `.wb-card__*` structure (its buildStructure ignores the computed `skipStructure`
 * flag), and the behavior runs twice — so title/footer render up to 4×/2×.
 *
 * This is marked test.fail() until the card double-render fix (spawned card session /
 * #202) lands: today the assertions FAIL (duplicates), which test.fail() treats as the
 * expected state. When the card is fixed the assertions will PASS, test.fail() will
 * report an UNEXPECTED PASS, and this marker must be removed.
 */
test.fail('wb-card renders title & footer exactly once — no duplicate text (#202)', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });

  const card = page.locator('wb-card').filter({ hasText: 'This is the footer' }).first();
  await expect(card).toBeVisible({ timeout: 20000 });

  const counts = await card.evaluate((el) => ({
    titleEls: el.querySelectorAll('.wb-card__title, .card__title').length,
    footerEls: el.querySelectorAll('.wb-card__footer, .card__footer').length,
    titleText: (el.textContent!.match(/This is the title/g) || []).length,
    footerText: (el.textContent!.match(/This is the footer/g) || []).length,
  }));

  expect(counts.titleEls, 'exactly one title element').toBe(1);
  expect(counts.footerEls, 'exactly one footer element').toBe(1);
  expect(counts.titleText, 'title text appears exactly once').toBe(1);
  expect(counts.footerText, 'footer text appears exactly once').toBe(1);
});
