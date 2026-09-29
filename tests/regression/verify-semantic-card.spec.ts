import { test, expect } from '../fixtures/offline';

test('Semantic Article should have Card behavior', async ({ page }) => {
  // Go to the repro page served by the local server
  await page.goto('/tests/fixtures/repro/card-semantic.html');

  // Cards no longer inject x-card / x-card__header / x-card__main onto an
  // <article> (a8a7362e, "specificity, not class injection"): card.css names
  // each part by tag. So each check below asserts what the card behavior and
  // card.css actually produce -- the same contract the repro page's own inline
  // check uses.

  // 1. The card behavior ran on the article.
  const article = page.locator('#semantic-card');
  await expect(article).toHaveAttribute('x-ready', '');
  await expect(article).toHaveCSS('display', 'flex');

  // 2. The authored header was preserved in place and styled as the card's
  //    header (card.css lays it out as a two-column grid).
  const header = article.locator(':scope > header');
  await expect(header).toContainText('Semantic Title');
  await expect(header).toHaveCSS('display', 'grid');

  // 3. The authored main was preserved and gets the card body's 1rem padding.
  const main = article.locator(':scope > main');
  await expect(main).toContainText('This is the main content');
  await expect(main).toHaveCSS('padding-left', '16px');

  // 4. The authored footer was preserved; the behavior still names it
  //    .x-card__footer (buildStructure's enhance-existing-footer branch).
  const footer = article.locator(':scope > footer');
  await expect(footer).toHaveClass(/x-card__footer/);
  
  console.log('Semantic Card Test Passed');
});
