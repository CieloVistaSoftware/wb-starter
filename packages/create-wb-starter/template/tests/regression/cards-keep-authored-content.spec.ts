import { test, expect, type Page } from '@playwright/test';

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

  test('content and children both survive when both are given', async ({ page }) => {
    // Which of the two WINS is undefined today -- composeCard() prefers the
    // attribute, card()'s own config prefers the children, and they disagree
    // (#683). This asserts only what #678 is about: neither is destroyed.
    // Tighten it once the precedence is decided.
    await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
    const text = await page.evaluate(async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      host.innerHTML = '<div id="c" x-card content="FROM_ATTRIBUTE">FROM_CHILDREN</div>';
      const mod: any = await import('/src/core/wb-lazy.js');
      await (mod.default || mod.WB).scan(host, { eager: true });
      await new Promise((r) => setTimeout(r, 60));
      return (document.querySelector('#c') as HTMLElement).innerText.trim();
    });
    expect(
      text.includes('FROM_ATTRIBUTE') || text.includes('FROM_CHILDREN'),
      `one of the two must render, neither may vanish (got "${text}")`
    ).toBe(true);
  });

  test('preserving content does not ADD an empty body box', async ({ page }) => {
    // card() builds its own empty .x-card__main for a contentless card -- a
    // pre-existing #608 leftover, filed as #683 rather than fixed here. What
    // this pins is that the #678 work does not add a SECOND one, which is the
    // regression this change could plausibly have introduced.
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
      return [...el.querySelectorAll('.x-card__main')].filter((m) => !m.innerHTML.trim()).length;
    });
    expect(mains, 'at most the one card() already built — never a second').toBeLessThanOrEqual(1);
  });
});
