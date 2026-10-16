import { test, expect } from '../fixtures/offline';

/**
 * #1905, found by the 2026-10-16 audit of every .md doc.
 *
 * 1. x-articles layout="masonry" ignored `columns`: article.js wrote
 *    --x-articles-columns only for layout="grid", so masonry was always 3.
 *    articles.md's columns="2" example showed three cards a row, the third cut
 *    off at the example's edge.
 * 2. ATTRIBUTE-NAMING-STANDARD.md's Cards example put four cards (pricing and
 *    stats each need 17.5rem) in three columns of an 804px doc column; the
 *    third ran 52px past the edge. It now asks for two columns.
 * An element past the content column inside a scroll container (an x-reel's
 * items) is the scroller working, not overflow.
 */
async function open(page, file: string) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(file));
  await page.waitForSelector('#content.x-mdhtml--loaded', { state: 'attached', timeout: 20000 });
  await page.waitForSelector('#content .x-demo .x-demo__grid', { timeout: 20000 });
  await page.waitForFunction(() => !document.querySelector('.x-demo--measuring'), null, { timeout: 15000 });
}

function overflowing(page) {
  return page.evaluate(() => {
    const col = document.getElementById('content')!.getBoundingClientRect();
    const scrolls = (el: Element) => {
      for (let n = el.parentElement; n && n.id !== 'content'; n = n.parentElement) {
        const o = getComputedStyle(n).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
      }
      return false;
    };
    return [...document.querySelectorAll('#content .x-demo *')]
      .filter((el) => !el.closest('pre, table') && !scrolls(el))
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > col.right + 2; })
      .map((el) => el.tagName.toLowerCase() + ' ' + (el.getAttribute('class') || '').split(' ')[0]);
  });
}

test('articles.md: masonry honors columns, and nothing spills past its example', async ({ page }) => {
  await open(page, 'docs/behaviors/articles.md');
  const counts = await page.evaluate(() => [...document.querySelectorAll('#content [x-articles][layout="masonry"]')]
    .map((h) => ({ declared: h.getAttribute('columns'), computed: getComputedStyle(h.querySelector('.x-articles--masonry')!).columnCount })));
  const two = counts.find((c) => c.declared === '2');
  expect(two, 'articles.md has a masonry example with columns="2"').toBeTruthy();
  expect(two!.computed).toBe('2');
  expect(await overflowing(page)).toEqual([]);
});

test('ATTRIBUTE-NAMING-STANDARD.md: the Cards example fits its column', async ({ page }) => {
  await open(page, 'docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md');
  expect(await overflowing(page)).toEqual([]);
});
