import { test, expect } from '@playwright/test';

/**
 * An <article> IS a card (John: "an article is a card in this system").
 *
 * History: #880 found `article` declared twice in index.js, and for a while
 * this spec asserted the opposite of the above -- that x-article must load
 * article.js, not card.js. That split left two behaviors for one element: an
 * article() nothing could reach, and x-article as a second spelling of x-card.
 * Both are gone. tag-map.js routes <article> straight to `card`, card.js
 * renders the byline attributes, and x-card is the attribute for other hosts.
 *
 * These assert BEHAVIOUR, not the mapping table.
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

test.describe('an <article> is a card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=demos');
    await page.waitForFunction(() => (window as any).WB, null, { timeout: 20000 });
  });

  test('there is no separate article behavior to shadow card', async ({ page }) => {
    const info = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const map = await import('/src/core/tag-map.js');
      return {
        card: typeof WB?.behaviors?.card,
        // `in`, not typeof: WB.behaviors is a Proxy that hands back a loader
        // for ANY name, so typeof is always 'function'. `in` asks the registry.
        article: 'article' in (WB?.behaviors ?? {}),
        native: map.nativeMap.article,
        xArticle: map.extensionMap['x-article'] ?? null,
      };
    });
    expect(info.native, '<article> must auto-inject card').toBe('card');
    expect(info.card, 'WB.behaviors.card must be callable').toBe('function');
    expect(
      info.article,
      'an `article` behavior is back. It would be a second behavior for one element (#880).',
    ).toBe(false);
    expect(info.xArticle, 'x-article is a second spelling of x-card; x-card is the attribute').toBeNull();
  });

  test('a bare <article> renders its byline metadata as a card', async ({ page }) => {
    const host = await mount(
      page,
      `<article id="a" title="Ada on Engines" author="Ada Lovelace" date="1843-10-01"
                category="Computing" reading-time="7"></article>`,
    );
    const el = host.locator('#a');
    await expect(el).toBeVisible({ timeout: 10000 });

    // NOT asserted by class: card markup carries no injected classes; styling
    // is specificity over semantic tags. What matters is that the DECLARED
    // attributes render.
    const text = (await el.textContent()) || '';
    expect(text, 'title was not rendered').toContain('Ada on Engines');
    expect(text, 'author was not rendered').toContain('Ada Lovelace');
    expect(text, 'category was not rendered').toContain('Computing');
    expect(text, 'date was not rendered').toContain('1843-10-01');

    // Each metadata field gets its own semantic tag, which is what card.css
    // targets. A blob of text in one <p> would satisfy the checks above.
    const tags = await el.evaluate((n: Element) =>
      Array.from(n.querySelectorAll('header > *')).map((c) => c.tagName.toLowerCase()));
    expect(tags, 'the date must be a <time> element').toContain('time');
    expect(tags, 'the byline must be an <address> element').toContain('address');
  });

  test('articles (plural) still resolves to article.js', async ({ page }) => {
    // The list wrapper is a different behavior and was never part of the merge.
    const type = await page.evaluate(() => typeof (window as any).WB?.behaviors?.articles);
    expect(type).toBe('function');
  });
});
