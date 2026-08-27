/**
 * REGRESSION: issue #426 -- the canonical article demos must contain enough
 * authored content to make featured and layout differences visible.
 */
import { test, expect } from '@playwright/test';

test('content.html visibly demonstrates featured articles and article layouts', async ({ page }) => {
  await page.goto('/demos/site/content.html');
  await page.waitForSelector('x-article .x-article__content');

  const featured = page.locator('#article-article-behavior x-article[featured]').first();
  await expect(featured.locator('.x-article__title')).toHaveText('The Future of Web Standards');
  await expect(featured.locator('.x-article__media img')).toBeVisible();
  await expect(featured.locator('.x-article__meta')).toContainText('Web Platform');
  await expect(featured.locator('.x-article__content')).toContainText('featured story');

  const articleLists = page.locator('#articles-articles-list-behavior x-articles');
  await expect(articleLists).toHaveCount(3);
  await expect(articleLists.nth(0).locator('.x-articles__header h2')).toHaveText('Grid layout');
  await expect(articleLists.nth(0).locator('.x-articles__list')).toHaveClass(/x-articles--grid/);
  await expect(articleLists.nth(1).locator('.x-articles__header h2')).toHaveText('List layout');
  await expect(articleLists.nth(1).locator('.x-articles__list')).toHaveClass(/x-articles--list/);

  const masonry = page.locator('#articles-layout-variants x-articles');
  await expect(masonry.locator('.x-articles__header h2')).toHaveText('Masonry layout');
  await expect(masonry.locator('.x-articles__list')).toHaveClass(/x-articles--masonry/);
  await expect(masonry.locator('x-article')).toHaveCount(8);
  await expect(masonry.locator('x-article').first().locator('.x-article__title')).toHaveText('Microservices Architecture');
});