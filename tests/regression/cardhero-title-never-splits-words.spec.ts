import { test, expect, Page } from '../fixtures/offline';
import { settlePage } from '../base';

/**
 * A card hero's title never breaks inside a word.
 *
 * John, 2026-10-01, on the playground's split hero: "Don't allow card hero to
 * split on characters." It rendered "Themeable to the core" as
 * "Themeabl / e to the / core".
 *
 * The title was sized at 6cqi of the HERO's width, but the split variant puts
 * the text in a column about half that wide. The font was roughly twice what
 * the column could hold, and the card's `overflow-wrap: break-word` then broke
 * the word to make it fit.
 *
 * Measured, not inferred: every character of every word must sit on the same
 * line box as the word's first character, across every variant and xalign, at
 * hero widths from a phone to a desktop.
 */

const TITLES = ['Themeable to the core', "Compose, don't configure", 'Accessibility everywhere'];
const VARIANTS = ['default', 'cosmic', 'split', 'minimal', 'gradient'];
const XALIGNS = ['left', 'center', 'right'];
const WIDTHS = [320, 480, 606, 900, 1280];

async function openSite(page: Page) {
  await page.goto('index.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
}

test('a card hero title never breaks inside a word, at any variant, xalign or width', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1400, height: 900 });
  await openSite(page);

  await page.evaluate(async ({ titles, variants, xaligns, widths }) => {
    const stage = document.createElement('div');
    document.body.appendChild(stage);
    const cases: Array<{ wrap: HTMLElement; label: string }> = [];
    for (const width of widths) {
      for (const variant of variants) {
        for (const xalign of xaligns) {
          for (const title of titles) {
            const wrap = document.createElement('div');
            wrap.style.width = `${width}px`;
            const hero = document.createElement('section');
            hero.setAttribute('x-cardhero', '');
            hero.setAttribute('title', title);
            hero.setAttribute('subtitle', 'Every color flows from one theme system.');
            hero.setAttribute('variant', variant);
            hero.setAttribute('xalign', xalign);
            wrap.appendChild(hero);
            stage.appendChild(wrap);
            cases.push({ wrap, label: `${width}px ${variant} xalign=${xalign} "${title}"` });
          }
        }
      }
    }
    await (window as any).WB.scan();
    (window as any).__wb961Stage = stage;
    (window as any).__wb961Cases = cases;
  }, { titles: TITLES, variants: VARIANTS, xaligns: XALIGNS, widths: WIDTHS });
  await settlePage(page, { timeout: 10_000 });

  const splits = await page.evaluate(async () => {
    const stage = (window as any).__wb961Stage as HTMLElement;
    const cases = (window as any).__wb961Cases as Array<{ wrap: HTMLElement; label: string }>;
    await document.fonts.ready;
    // Let the entrance animation finish so the layout is the resting one.
    // (Infinite ones, like the sheen sweep, cannot finish and do not move text.)
    document.getAnimations()
      .filter((a) => a.effect?.getTiming().iterations !== Infinity)
      .forEach((a) => a.finish());

    const found: string[] = [];
    for (const { wrap, label } of cases) {
      const el = wrap.querySelector('.x-card__hero-title');
      const node = el && Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
      if (!node) { found.push(`${label}: no title rendered`); continue; }
      const text = node.textContent!;
      const lineOf = (i: number) => {
        const r = document.createRange();
        r.setStart(node, i);
        r.setEnd(node, i + 1);
        const rect = r.getClientRects()[0];
        return rect ? Math.round(rect.top) : NaN;
      };
      for (const m of text.matchAll(/\S+/g)) {
        const start = m.index!;
        const first = lineOf(start);
        for (let i = start + 1; i < start + m[0].length; i++) {
          if (Math.abs(lineOf(i) - first) > 2) {
            found.push(`${label}: "${m[0]}" breaks after "${text.slice(start, i)}"`);
            break;
          }
        }
      }
    }
    stage.remove();
    return found;
  });

  expect(splits, `Card hero titles broken inside a word:\n  ${splits.join('\n  ')}`).toEqual([]);
});
