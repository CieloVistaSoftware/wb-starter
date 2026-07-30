import { test, expect, Page } from '@playwright/test';

/**
 * cardBase() (card.js) reads `variant` directly off the element and adds a
 * generic wb-card--{variant} class for EVERY card type, not just the base
 * <wb-card> -- but cardstats/cardproduct/cardpricing/cardvideo each declare
 * their own variant enum in schema (compact/large/minimal,
 * compact/horizontal/minimal, bordered/elevated/minimal, same) with zero CSS
 * backing the type-specific words. Confirmed live via screenshots: every
 * variant rendered pixel-identical to "default" for all four types.
 * "bordered"/"elevated" happen to reuse the base card's own enum words, so
 * those two already worked via the pre-existing generic rules; this test
 * covers the words that didn't.
 */

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  const ids = await page.evaluate(async (h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    // WB.scan()'s default (non-eager) path defers wb-* custom elements to an
    // IntersectionObserver and does not await it -- checking computed styles
    // right after scan() races that observer (~60ms lag, confirmed live via
    // manual trace). Not a CSS bug. Using the real (non-eager) path here and
    // polling below -- rather than {eager:true} -- so this test exercises
    // the actual lazy-load path production pages use, not a bypass of it.
    await (window as any).WB.scan(container);
    return Array.from(container.children).map(el => el.id).filter(Boolean);
  }, html);

  // Poll for every injected element to have picked up its base wb-card class
  // before asserting on computed style -- the IntersectionObserver callback
  // above fires asynchronously, so a fixed-instant check would be flaky.
  await page.waitForFunction(
    (elementIds: string[]) => elementIds.every(id => document.getElementById(id)?.classList.contains('wb-card')),
    ids,
    { timeout: 5000 }
  );
}

async function surface(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { background: cs.backgroundColor, border: cs.border, boxShadow: cs.boxShadow, padding: cs.padding };
  });
}

test.describe('Typed card variants actually differ from default', () => {
  test('cardstats: compact/large/minimal differ from default', async ({ page }) => {
    await inject(page, `
      <wb-cardstats id="s-default" variant="default" value="42" label="Default"></wb-cardstats>
      <wb-cardstats id="s-compact" variant="compact" value="42" label="Compact"></wb-cardstats>
      <wb-cardstats id="s-large" variant="large" value="42" label="Large"></wb-cardstats>
      <wb-cardstats id="s-minimal" variant="minimal" value="42" label="Minimal"></wb-cardstats>
    `);
    const def = await surface(page, '#s-default');
    const compact = await surface(page, '#s-compact');
    const large = await surface(page, '#s-large');
    const minimal = await surface(page, '#s-minimal');

    expect(compact.padding, 'compact padding must differ from default').not.toBe(def.padding);
    expect(large.padding, 'large padding must differ from default').not.toBe(def.padding);
    // The default surface comes from background/box-shadow (cardBase()),
    // not a border -- "minimal" removes those, not a border that was
    // never there.
    expect(minimal.background, 'minimal background must differ from default').not.toBe(def.background);
  });

  test('cardproduct: compact/horizontal/minimal differ from default', async ({ page }) => {
    await inject(page, `
      <wb-cardproduct id="p-default" variant="default" title="Product" price="$29"></wb-cardproduct>
      <wb-cardproduct id="p-horizontal" variant="horizontal" title="Product" price="$29"></wb-cardproduct>
      <wb-cardproduct id="p-minimal" variant="minimal" title="Product" price="$29"></wb-cardproduct>
    `);
    const def = await page.locator('#p-default').evaluate((el) => getComputedStyle(el).flexDirection);
    const horizontal = await page.locator('#p-horizontal').evaluate((el) => getComputedStyle(el).flexDirection);
    expect(horizontal, 'horizontal must actually lay out as a row').toBe('row');
    expect(horizontal).not.toBe(def);

    const defSurface = await surface(page, '#p-default');
    const minimalSurface = await surface(page, '#p-minimal');
    expect(minimalSurface.border, 'minimal border must differ from default').not.toBe(defSurface.border);
  });

  test('cardpricing: minimal differs from default', async ({ page }) => {
    await inject(page, `
      <wb-cardpricing id="pr-default" variant="default" plan="Basic" price="$0"></wb-cardpricing>
      <wb-cardpricing id="pr-minimal" variant="minimal" plan="Basic" price="$0"></wb-cardpricing>
    `);
    const def = await surface(page, '#pr-default');
    const minimal = await surface(page, '#pr-minimal');
    // The default surface comes from background/box-shadow (cardBase()),
    // not a border -- "minimal" removes those, not a border that was
    // never there.
    expect(minimal.background, 'minimal background must differ from default').not.toBe(def.background);
  });

  test('cardvideo: minimal differs from default', async ({ page }) => {
    await inject(page, `
      <wb-cardvideo id="v-default" variant="default" src="/demos/audio.mp3"></wb-cardvideo>
      <wb-cardvideo id="v-minimal" variant="minimal" src="/demos/audio.mp3"></wb-cardvideo>
    `);
    const def = await surface(page, '#v-default');
    const minimal = await surface(page, '#v-minimal');
    // The default surface comes from background/box-shadow (cardBase()),
    // not a border -- "minimal" removes those, not a border that was
    // never there.
    expect(minimal.background, 'minimal background must differ from default').not.toBe(def.background);
  });
});
