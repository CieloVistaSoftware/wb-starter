import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #1279: declared, documented options that rendered exactly like the default.
 * Each is set to a non-default value and checked for what a reader would see,
 * not for an attribute or class landing somewhere.
 *
 *   x-frame ratio        -- the rules lived in card.css, which loads only for
 *                           cards; a frame alone had no aspect ratio at all
 *   x-figure caption-position="top" -- only "overlay" was handled
 *   x-switcher limit     -- read, then never used
 *   x-icon size          -- works; checked on a real <svg>, which it sizes
 *   x-grid alt-rows      -- works (fixed since filing); kept so it stays so
 */
const SVG = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>';
const IMG = '<img src="https://picsum.photos/seed/wb1279/800/600" alt="sample">';

test('declared options change what renders (#1279)', async ({ page }) => {
  await injectAndScan(page, [
    `<section id="frameDefault" class="probe">${'<div x-frame>' + IMG + '</div>'}</section>`,
    `<section id="frameSquare" class="probe"><div x-frame ratio="1/1">${IMG}</div></section>`,
    `<section id="figureTop" class="probe"><figure x-figure caption="Above" caption-position="top">${IMG}</figure></section>`,
    `<section id="switcherDefault" class="probe"><div x-switcher><div>1</div><div>2</div><div>3</div></div></section>`,
    `<section id="switcherLimit" class="probe"><div x-switcher limit="2"><div>1</div><div>2</div><div>3</div></div></section>`,
    `<section id="iconDefault" class="probe"><span x-icon>${SVG}Label</span></section>`,
    `<section id="iconLarge" class="probe"><span x-icon size="3rem">${SVG}Label</span></section>`,
    `<section id="gridAlt" class="probe"><div x-grid columns="1" alt-rows><div>1</div><div>2</div></div></section>`,
  ].join(''));

  const m = await page.evaluate(async () => {
    const WB = (window as any).WB;
    for (const s of document.querySelectorAll('section.probe')) await WB.scan(s, { eager: true });
    await WB.settled?.();
    const host = (id: string) => document.getElementById(id)!.firstElementChild as HTMLElement;
    const box = (el: Element) => el.getBoundingClientRect();
    const ratio = (id: string) => { const r = box(host(id)); return r.width / r.height; };
    const items = (id: string) => [...host(id).children].map((c) => box(c));
    const fig = host('figureTop');
    return {
      frameDefault: ratio('frameDefault'),
      frameSquare: ratio('frameSquare'),
      captionAbove: box(fig.querySelector('figcaption')!).bottom <= box(fig.querySelector('img')!).top + 1,
      switcherDefaultRows: new Set(items('switcherDefault').map((r) => Math.round(r.top))).size,
      switcherLimitRows: new Set(items('switcherLimit').map((r) => Math.round(r.top))).size,
      iconDefault: Math.round(box(host('iconDefault').querySelector('svg')!).width),
      iconLarge: Math.round(box(host('iconLarge').querySelector('svg')!).width),
      rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
      gridBg: [...host('gridAlt').children].map((c) => getComputedStyle(c).backgroundColor),
    };
  });

  expect.soft(m.frameDefault, 'x-frame with no ratio is 16/9').toBeCloseTo(16 / 9, 1);
  expect.soft(m.frameSquare, 'x-frame ratio="1/1" is square').toBeCloseTo(1, 1);
  expect.soft(m.captionAbove, 'caption-position="top" puts the caption above the image').toBe(true);
  expect.soft(m.switcherDefaultRows, 'three items under the default limit (4) share one row').toBe(1);
  expect.soft(m.switcherLimitRows, 'limit="2" with three items stacks them, one per row').toBe(3);
  expect.soft(m.iconLarge, 'size="3rem" renders the svg at 3rem').toBe(Math.round(3 * m.rem));
  expect.soft(m.iconLarge, 'size must differ from the default').toBeGreaterThan(m.iconDefault);
  expect.soft(m.gridBg[0], 'alt-rows gives alternate rows a different background').not.toBe(m.gridBg[1]);
});
