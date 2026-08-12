/**
 * REGRESSION: issue #426 -- the canonical article demos must contain enough
 * authored content to make featured and layout differences visible.
 */
import { test, expect } from '@playwright/test';

test('content.html visibly demonstrates featured articles and article layouts', async ({ page }) => {
  await page.goto('/demos/site/content.html');
  await page.waitForSelector('wb-article .wb-article__content');

  const featured = page.locator('#article-article-component wb-article[featured]').first();
  await expect(featured.locator('.wb-article__title')).toHaveText('The Future of Web Standards');
  await expect(featured.locator('.wb-article__media img')).toBeVisible();
  await expect(featured.locator('.wb-article__meta')).toContainText('Web Platform');
  await expect(featured.locator('.wb-article__content')).toContainText('featured story');

  const articleLists = page.locator('#articles-articles-list-component wb-articles');
  await expect(articleLists).toHaveCount(3);
  await expect(articleLists.nth(0).locator('.wb-articles__header h2')).toHaveText('Grid layout');
  await expect(articleLists.nth(0).locator('.wb-articles__list')).toHaveClass(/wb-articles--grid/);
  await expect(articleLists.nth(1).locator('.wb-articles__header h2')).toHaveText('List layout');
  await expect(articleLists.nth(1).locator('.wb-articles__list')).toHaveClass(/wb-articles--list/);

  const masonry = page.locator('#articles-layout-variants wb-articles');
  await expect(masonry.locator('.wb-articles__header h2')).toHaveText('Masonry layout');
  await expect(masonry.locator('.wb-articles__list')).toHaveClass(/wb-articles--masonry/);
  await expect(masonry.locator('wb-article')).toHaveCount(8);
  await expect(masonry.locator('wb-article').first().locator('.wb-article__title')).toHaveText('Microservices Architecture');
});