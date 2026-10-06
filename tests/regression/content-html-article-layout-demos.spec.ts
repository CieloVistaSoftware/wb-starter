/**
 * REGRESSION: issue #426 -- the canonical article demos must contain enough
 * authored content to make featured and layout differences visible.
 *
 * Rewritten for the current product. The original asserted an x-article
 * behavior (.x-article__title/__media/__meta/__content) that no longer exists:
 * an <article> IS a card now (tag-map nativeMap `article: 'card'`, and
 * x-article became x-card), rendering <header><h3>, <small> category,
 * <address>, <mark>Featured and <main>. Its section ids also still carried the
 * "-component" suffix that the "component is not a word" rename changed to
 * "-behavior". And the demos themselves had fallen back to the generator's
 * placeholder sentence, which is the exact thing #426 was filed about.
 *
 * On the lazy runtime (#491) a host builds only near the viewport, so every
 * host is scrolled in and awaited (x-ready) before it is read.
 */
import { test, expect } from '../fixtures/offline';
import { buildInView } from '../base';

test('content.html visibly demonstrates featured articles and article layouts', async ({ page }) => {
  await page.goto('/demos/site/content.html');

  const featured = page.locator('#article-article-behavior article[featured]').first();
  await buildInView(featured);
  await expect(featured.locator('header h3')).toHaveText('The Future of Web Standards');
  await expect(featured.locator('header mark')).toHaveText('Featured');
  await expect(featured.locator('header')).toContainText('Web Platform');
  await expect(featured.locator('.x-card__body')).toContainText('featured story');

  const articleLists = page.locator('#articles-articles-list-behavior [x-articles]');
  await expect(articleLists).toHaveCount(3);
  for (const list of await articleLists.all()) await buildInView(list);
  await expect(articleLists.nth(0).locator('.x-articles__header h2')).toHaveText('Grid layout');
  await expect(articleLists.nth(0).locator('.x-articles__list')).toHaveClass(/x-articles--grid/);
  await expect(articleLists.nth(1).locator('.x-articles__header h2')).toHaveText('List layout');
  await expect(articleLists.nth(1).locator('.x-articles__list')).toHaveClass(/x-articles--list/);

  const masonry = page.locator('#articles-layout-variants [x-articles]');
  await buildInView(masonry);
  await expect(masonry.locator('.x-articles__header h2')).toHaveText('Masonry layout');
  await expect(masonry.locator('.x-articles__list')).toHaveClass(/x-articles--masonry/);
  const cards = masonry.locator('.x-articles__list > article');
  await expect(cards).toHaveCount(8);
  await buildInView(cards.first());
  await expect(cards.first().locator('header h3')).toHaveText('Microservices Architecture');
});
