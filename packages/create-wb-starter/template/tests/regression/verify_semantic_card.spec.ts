import { test, expect } from '@playwright/test';

test('Semantic Article should have Card behavior', async ({ page }) => {
  // Go to the repro page served by the local server
  await page.goto('http://localhost:3000/tests/repro_card_semantic.html');

  // 1. Check if the article has the wb-card class
  const article = page.locator('#semantic-card');
  await expect(article).toHaveClass(/wb-card/);

  // 2. Check if the header was preserved and enhanced
  const header = article.locator('header');
  await expect(header).toHaveClass(/wb-card__header/);
  await expect(header).toContainText('Semantic Title');

  // 3. Check if main was preserved and enhanced
  const main = article.locator('main');
  await expect(main).toHaveClass(/wb-card__main/);
  await expect(main).toContainText('This is the main content');

  // 4. Check if footer was preserved and enhanced
  const footer = article.locator('footer');
  await expect(footer).toHaveClass(/wb-card__footer/);
  
  console.log('Semantic Card Test Passed');
});
