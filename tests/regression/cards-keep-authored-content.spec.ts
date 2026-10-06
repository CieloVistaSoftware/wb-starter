import { test, expect, type Page } from '../fixtures/offline';

/**
 * #678 — a behavior must never destroy the author's content.
 *
 * John, on `<div x-cardbutton variant="elevated">Example x-cardbutton
 * content</div>`: "shouldn't all of this context be shown on the card". It was
 * not shown — it was destroyed. After WB.scan the element's innerHTML was "".
 *
 * A sweep of all 105 x-* behaviors, injecting a unique marker as each one's
 * only child, found 21 that destroyed it — including all ten card behaviors
 * that lacked the per-function `|| element.innerHTML` fallback.
 *
 * Everything here asserts RENDERED text (innerText), never textContent. A node
 * preserved in the DOM at 0x0, or inside a collapsed container, is the same
 * defect wearing a disguise — that was the invisible-EQ lesson and it applies
 * unchanged.
 */

const FIXTURE = '/tests/fixtures/blank.html';

/** Every card behavior, in both authoring surfaces. */
const CARDS = [
  'card', 'cardbutton', 'carddraggable', 'cardexpandable', 'cardfile',
  'cardhero', 'cardhorizontal', 'cardimage', 'cardlink', 'cardminimizable',
  'cardnotification', 'cardoverlay', 'cardportfolio', 'cardpricing',
  'cardproduct', 'cardprofile', 'cardstats', 'cardtestimonial', 'cardvideo',
];

async function renderAll(page: Page, build: (name: string, marker: string) => string) {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  return page.evaluate(async ({ names, tpl }) => {
    const mod: any = await import('/src/core/wb-lazy.js');
    const WB = mod.default || mod.WB;
    const results: Record<string, { inDom: boolean; onScreen: boolean }> = {};

    for (const name of names) {
      const marker = 'KEEPME' + name.toUpperCase();
      const host = document.createElement('div');
      host.style.cssText = 'width: 480px;';
      document.body.appendChild(host);
      host.innerHTML = tpl.replace(/__NAME__/g, name).replace(/__MARKER__/g, marker);
      await WB.scan(host, { eager: true });
      await new Promise((r) => setTimeout(r, 40));
      const inDom = (host.textContent || '').includes(marker);
      results[name] = { inDom, onScreen: inDom && (host.innerText || '').includes(marker) };
      host.remove();
    }
    return results;
  }, { names: CARDS, tpl: build('__NAME__', '__MARKER__') });
}

test.describe('cards keep the author content (#678)', () => {
  test('every card behavior shows it via the x-* attribute form', async ({ page }) => {
    const results = await renderAll(page, (n, m) => `<div x-${n}>${m}</div>`);

    const destroyed = Object.entries(results).filter(([, r]) => !r.inDom).map(([n]) => n);
    expect(destroyed, `these destroyed the author's content: ${destroyed.join(', ')}`).toEqual([]);

    const invisible = Object.entries(results).filter(([, r]) => r.inDom && !r.onScreen).map(([n]) => n);
    expect(invisible, `preserved but not rendered — same defect: ${invisible.join(', ')}`).toEqual([]);
  });

  test('every card behavior shows it via the <wb-*> tag form', async ({ page }) => {
    // Both surfaces are documented as equivalent, so both must be checked.
    // SCHEMA_EXCLUDED_TAGS was consulted only by the tag branch of
    // detectSchema(), so the two forms genuinely behaved differently.
    const results = await renderAll(page, (n, m) => `<wb-${n}>${m}</wb-${n}>`);

    const destroyed = Object.entries(results).filter(([, r]) => !r.inDom).map(([n]) => n);
    expect(destroyed, `these destroyed the author's content: ${destroyed.join(', ')}`).toEqual([]);
  });

  test("John's exact markup renders its text", async ({ page }) => {
    await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.style.cssText = 'width: 480px;';
      document.body.appendChild(host);
      host.innerHTML = '<div id="jb" x-cardbutton variant="elevated">\n  Example x-cardbutton content\n</div>';
      const mod: any = await import('/src/core/wb-lazy.js');
      await (mod.default || mod.WB).scan(host, { eager: true });
      await new Promise((r) => setTimeout(r, 60));
      const el = document.querySelector('#jb') as HTMLElement;
      const r = el.getBoundingClientRect();
      return { text: (el.innerText || '').trim(), w: Math.round(r.width), h: Math.round(r.height) };
    });

    expect(result.text).toBe('Example x-cardbutton content');
    expect(result.h, 'and the card must have real height').toBeGreaterThan(0);
  });

  test('the content attribute wins over the children, inside the body (#683)', async ({ page }) => {
    // #683 settled the precedence, one rule for every card path: an explicit
    // content="..." wins over the text between the tags -- the order
    // composeCard() and the typed cards already used. card() used to put the
    // attribute in the body AND leave the children loose above it, so both
    // rendered, the children outside the card's structure.
    await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
    const text = await page.evaluate(async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      host.innerHTML = '<div id="c" x-card content="FROM_ATTRIBUTE">FROM_CHILDREN</div>';
      const mod: any = await import('/src/core/wb-lazy.js');
      await (mod.default || mod.WB).scan(host, { eager: true });
      await new Promise((r) => setTimeout(r, 60));
      const card = document.querySelector('#c') as HTMLElement;
      // The card's own body: a direct <main> child (it carries no class).
      const main = card.querySelector(':scope > .x-card__body') as HTMLElement | null;
      return { all: card.innerText.trim(), body: (main?.innerText || '').trim() };
    });
    expect(text.body, 'the attribute fills the card body').toBe('FROM_ATTRIBUTE');
    expect(text.all, 'the losing children must not render loose beside the body').not.toContain('FROM_CHILDREN');
  });

  test('a card with no content renders no empty body box (#683)', async ({ page }) => {
    // card() used to build an empty, padded .x-card__main for a contentless
    // card -- the blank line #608 removed from the schema-built path but not
    // from this one. #683: none at all now.
    await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
    const mains = await page.evaluate(async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      // Whitespace only — truthy as a string, but nothing to render.
      host.innerHTML = '<div id="e" x-card>   \n  </div>';
      const mod: any = await import('/src/core/wb-lazy.js');
      await (mod.default || mod.WB).scan(host, { eager: true });
      await new Promise((r) => setTimeout(r, 60));
      const el = document.querySelector('#e')!;
      // Any direct <main> body, classed or not: the old .x-card__main
      // selector matched no card body at all, so this could never fail.
      return [...el.querySelectorAll(':scope > .x-card__body')].filter((m) => !m.innerHTML.trim()).length;
    });
    expect(mains, 'a whitespace-only card must not get an empty body box').toBe(0);
  });
});
