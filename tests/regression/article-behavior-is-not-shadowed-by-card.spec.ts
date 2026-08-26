import { test, expect } from '@playwright/test';

/**
 * #880 — x-article must load article.js, not card.js.
 *
 * `src/wb-viewmodels/index.js` declared `article` twice in one object literal:
 *
 *     article: 'article', articles: 'article',   // line 56
 *     article: 'card',                           // line 62
 *
 * The later key wins, so x-article resolved to card.js, which exports no
 * `article` function -- the behavior silently never ran. Nothing threw; the
 * element simply stayed inert. That is why article's own attributes measured
 * as "declared but ignored" in #861.
 *
 * These assert BEHAVIOUR, not the mapping table: checking index.js for the
 * absence of a line would pass even if the module still failed to attach.
 */

async function mount(page: any, html: string) {
  await page.evaluate(async (markup: string) => {
    document.getElementById('art-probe')?.remove();
    const host = document.createElement('div');
    host.id = 'art-probe';
    host.innerHTML = markup;
    document.body.appendChild(host);
    await (window as any).WB.scan(host);
  }, html);
  return page.locator('#art-probe');
}

test.describe('x-article loads its own behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=demos');
    await page.waitForFunction(() => (window as any).WB, null, { timeout: 20000 });
  });

  test('the article behavior is registered and resolvable', async ({ page }) => {
    const info = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const fn = WB?.behaviors?.article;
      return { type: typeof fn, name: fn?.name ?? null };
    });
    expect(
      info.type,
      'WB.behaviors.article is not a function. index.js mapped `article` to the card module, ' +
      'which exports no article(), so there was nothing to call.',
    ).toBe('function');
  });

  test('article renders its declared metadata, not a card', async ({ page }) => {
    const host = await mount(
      page,
      `<article id="a" x-article title="Ada on Engines" author="Ada Lovelace" date="1843-10-01"
                category="Computing" reading-time="7"></article>`,
    );
    const el = host.locator('#a');
    await expect(el).toBeVisible({ timeout: 10000 });

    const cls = await el.getAttribute('class');
    expect(
      cls,
      `x-article produced class="${cls}". article.schema.json declares baseClass x-article; ` +
      'a card class here means the card module attached instead.',
    ).toContain('x-article');

    // The metadata attributes are article's own -- if card.js were running,
    // none of these would be read by anything.
    const text = (await el.textContent()) || '';
    expect(text, 'author was not rendered').toContain('Ada Lovelace');
    expect(text, 'category was not rendered').toContain('Computing');
  });

  test('articles (plural) still resolves to the same module', async ({ page }) => {
    // Both keys pointed at article.js originally; the fix must not disturb the
    // sibling that was never shadowed.
    const type = await page.evaluate(() => typeof (window as any).WB?.behaviors?.articles);
    expect(type).toBe('function');
  });
});
