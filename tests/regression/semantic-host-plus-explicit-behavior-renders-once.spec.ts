import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * #923: a semantic host plus its own family's explicit attribute must render
 * ONCE, not twice.
 *
 * `<article x-card>` rendered the whole card twice -- two <header>, two <h3>,
 * two <p> -- because <article> auto-injects its behavior AND x-card injects
 * card, and both build card chrome.
 *
 * #765 added a guard for exactly this, but inferred "same family" from the
 * NAME PREFIX ("card -> cardportfolio, cardimage, cardhero"). That holds only
 * while <article>'s behavior is spelled `card`. nativeMap maps
 * article -> article, so the test was 'card'.startsWith('article') === false
 * and the guard never fired for any card-family pair -- inert, with no test
 * failing, across 251 such elements in real markup including the scaffold.
 *
 * The three controls below are the point: two of them must stay at 1 for the
 * third to mean anything. If a future change makes the semantic-only or
 * explicit-only case render zero or two, this spec says so instead of quietly
 * passing.
 */
const CARD_FAMILY = ['x-card', 'x-cardportfolio', 'x-cardimage', 'x-cardhero'];

/** Number of leaf elements whose text is exactly `token`. */
async function renderCount(el: any, token: string): Promise<number> {
  return el.evaluate(
    (node: Element, t: string) =>
      Array.from(node.querySelectorAll('*'))
        .filter((e) => e.textContent?.trim() === t && !e.querySelector('*')).length,
    token,
  );
}

test.describe('a semantic host plus its family attribute renders once (#923)', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('control: semantic tag alone renders one title', async ({ page }) => {
    const el = await setupTestContainer(page, '<article title="T" subtitle="S"></article>');
    expect(await renderCount(el, 'T')).toBe(1);
  });

  test('control: explicit attribute alone renders one title', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-card title="T" subtitle="S"></div>');
    expect(await renderCount(el, 'T')).toBe(1);
  });

  for (const behavior of CARD_FAMILY) {
    test(`<article ${behavior}> renders one title, not two`, async ({ page }) => {
      const el = await setupTestContainer(
        page,
        `<article ${behavior} title="T" subtitle="S"></article>`,
      );
      expect(
        await renderCount(el, 'T'),
        `<article ${behavior}> double-rendered: the tag's behavior and ${behavior} both built card chrome. ` +
        `Check familyRoot() in src/core/wb.js -- it derives the family from behaviorModules ` +
        `(index.js maps article -> card, which is the system saying an <article> IS a card). ` +
        `A behavior whose module mapping changed, or which is missing from that registry, falls through the guard.`,
      ).toBe(1);
    });
  }

  test('additive behaviors still stack -- x-ripple decorates, it does not replace', async ({ page }) => {
    // The guard must NOT suppress a modifier. #765's own counter-example:
    // blocking autoInject here would mean asking for a card with a ripple and
    // getting only a ripple.
    const el = await setupTestContainer(page, '<article x-ripple title="T" subtitle="S"></article>');
    expect(await renderCount(el, 'T')).toBe(1);
  });
});

/**
 * The SAME contract, on the OTHER runtime (#923).
 *
 * The block above loads index.html, which uses `wb.js`. Every standalone demo
 * page, the doc-viewer and test-harness.html load `wb-lazy.js` -- a second,
 * parallel implementation with its own auto-inject paths. When this spec was
 * first written it passed 7/7 while `<article x-cardimage>` still rendered TWO
 * complete cards on demos/site/cards.html, because the suite never exercised
 * the runtime the demos actually use. That was reported from the browser, not
 * caught here.
 *
 * The rule now lives once in src/core/replacement-guard.js; these cases prove
 * BOTH runtimes consult it.
 */
test.describe('the same guard holds on the lazy runtime (#923)', () => {
  const CASES = ['x-card', 'x-cardimage', 'x-cardportfolio'];

  async function mount(page: any, markup: string) {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
    return page.evaluate(async (h: string) => {
      document.getElementById('dbl')?.remove();
      const c = document.createElement('div');
      c.id = 'dbl';
      c.innerHTML = h;
      document.body.appendChild(c);
      // eager: this runtime otherwise defers to an IntersectionObserver and a
      // container below the fold never initializes -- nothing would render and
      // the test would pass for the wrong reason.
      await (window as any).WB.scan(c, { eager: true });
      await new Promise((r) => setTimeout(r, 500));
      const host = c.firstElementChild as HTMLElement;
      const t = host.getAttribute('title') || '';
      return Array.from(host.querySelectorAll('*'))
        .filter((e) => e.textContent?.trim() === t && !e.querySelector('*')).length;
    }, markup);
  }

  test('control: a bare semantic tag renders one title', async ({ page }) => {
    expect(await mount(page, '<article title="T" subtitle="S"></article>')).toBe(1);
  });

  for (const behavior of CASES) {
    test(`<article ${behavior}> renders one title on wb-lazy`, async ({ page }) => {
      expect(
        await mount(page, `<article ${behavior} title="T" subtitle="S"></article>`),
        `<article ${behavior}> double-rendered under wb-lazy.js. That runtime has its own ` +
        `auto-inject paths (getAutoInjectBehaviors, scan(), the MutationObserver); each must ` +
        `call isReplacedByExplicitBehavior() from src/core/replacement-guard.js.`,
      ).toBe(1);
    });
  }
});
