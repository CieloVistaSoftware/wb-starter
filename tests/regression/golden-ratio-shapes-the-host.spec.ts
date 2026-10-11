import { test, expect, type Page } from '../fixtures/offline';
import { settlePage } from '../base';

/**
 * goldenRatio MAKES THE HOST A GOLDEN RECTANGLE (#477)
 * ====================================================
 * Phase 1 of #477 put `--aspect-golden` (1.618) in src/styles/themes.css and
 * nothing used it. Phase 2, John's decision: a boolean `goldenRatio` on card,
 * hero, img, video and figure that sets `aspect-ratio: var(--aspect-golden)`
 * on the host -- landscape, width / height = 1.618 -- and leaves typography
 * alone. The class is built by wb.js applyDeclaredModifiers() from the schema's
 * boolean (`{baseClass}--golden-ratio`), and it is applied only when a loaded
 * stylesheet defines it, so this needs both the schema property AND the CSS.
 *
 * Measured from the rendered box, not the class list: a class nothing styles
 * would pass a class check and change nothing on screen.
 *
 * See it by hand: open Behaviors (?page=behaviors), pick card and choose the
 * goldenRatio row. Before: no such row; `<article goldenRatio>` rendered at its
 * content height. Now: the card is 1.618 times as wide as it is tall.
 */

const GOLDEN = 1.618;
const TOLERANCE = 0.01;
// A local 960x540 photo (16:9, 1.778), so an unflagged image is plainly not golden.
const PHOTO = '/images/dachshund-puppy-image-960x540.jpg';

type Case = { name: string; markup: (flag: string) => string; host: string };

const CASES: Case[] = [
  {
    name: 'card',
    host: 'article',
    markup: (flag) => `<article ${flag} title="Ridge loop" subtitle="Moderate" footer="Updated today">Body text.</article>`,
  },
  {
    name: 'hero',
    host: '[x-hero]',
    // One short line. The site's hero h1 is 64px: "Ship the markup" plus a lead
    // paragraph measured 266px of content in a 297px golden band at 480px, and
    // on a run where it wrapped once more the content (rightly) grew the band
    // past the ratio. Content taller than the ratio always wins; that is the
    // documented behavior, not what this asserts.
    markup: (flag) => `<div x-hero ${flag}><h1>Hello.</h1></div>`,
  },
  {
    name: 'img',
    host: 'img',
    markup: (flag) => `<img ${flag} src="${PHOTO}" alt="Dachshund puppy">`,
  },
  {
    name: 'video',
    host: 'video',
    markup: (flag) => `<video ${flag} controls></video>`,
  },
  {
    name: 'figure',
    host: 'figure',
    markup: (flag) => `<figure ${flag}><img src="${PHOTO}" alt="Dachshund puppy"><figcaption>Morning walk.</figcaption></figure>`,
  },
];

/** Build the markup in a 480px-wide box and return the host's width / height. */
async function ratioOf(page: Page, c: Case, flag: string) {
  await page.evaluate(async ({ html }) => {
    const box = document.createElement('div');
    box.id = 'golden-477';
    box.style.width = '480px';
    box.innerHTML = html;
    document.body.appendChild(box);
    await (window as any).WB.scan(box, { eager: true });
  }, { html: c.markup(flag) });
  await settlePage(page, { timeout: 5000 });
  await page.evaluate(() => document.fonts.ready);
  if (flag && !/false/.test(flag)) {
    // The declared-modifier class lands once the schema index has loaded.
    await expect(page.locator(`#golden-477 ${c.host}`).first()).toHaveClass(/--golden-ratio\b/, { timeout: 10_000 });
  }
  if (c.name === 'img' || c.name === 'figure') {
    await page.waitForFunction(() => [...document.querySelectorAll('#golden-477 img')].every((i) => (i as HTMLImageElement).complete), null, { timeout: 10_000 });
  }
  return page.evaluate((sel) => {
    const box = document.getElementById('golden-477')!;
    const el = box.querySelector(sel) as HTMLElement;
    const r = el.getBoundingClientRect();
    const out = { ratio: r.width / r.height, width: r.width, height: r.height, cls: el.className };
    box.remove();
    return out;
  }, c.host);
}

test.describe('goldenRatio shapes the host as a 1.618 rectangle (#477)', () => {
  test.beforeEach(async ({ page }) => {
    // The site itself (src/main.js -> wb.js), which is where applyDeclaredModifiers()
    // runs. demos/test-harness.html boots wb-lazy.js, whose inject() does not
    // apply declared modifiers at all -- see the PR for #477.
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 15_000 });
  });

  for (const c of CASES) {
    test(`${c.name}: goldenRatio gives width/height = 1.618, and without it the shape is its own`, async ({ page }) => {
      const on = await ratioOf(page, c, 'goldenRatio');
      expect(on.width, `${c.name} rendered no box`).toBeGreaterThan(0);
      expect(
        Math.abs(on.ratio - GOLDEN),
        `${c.name} goldenRatio rendered ${on.width.toFixed(1)}x${on.height.toFixed(1)} (ratio ${on.ratio.toFixed(3)}), class="${on.cls}"`,
      ).toBeLessThanOrEqual(TOLERANCE);

      // The dashed spelling reaches the same class.
      const dashed = await ratioOf(page, c, 'golden-ratio');
      expect(Math.abs(dashed.ratio - GOLDEN), `${c.name} golden-ratio rendered ratio ${dashed.ratio.toFixed(3)}`).toBeLessThanOrEqual(TOLERANCE);

      for (const flag of ['', 'goldenRatio="false"']) {
        const off = await ratioOf(page, c, flag);
        expect(off.width, `${c.name} [${flag || 'no attribute'}] rendered no box`).toBeGreaterThan(0);
        expect(off.cls, `${c.name} [${flag || 'no attribute'}] carries the golden class`).not.toMatch(/--golden-ratio\b/);
        expect(
          Math.abs(off.ratio - GOLDEN),
          `${c.name} [${flag || 'no attribute'}] is golden anyway (${off.ratio.toFixed(3)}), so the flag proves nothing`,
        ).toBeGreaterThan(TOLERANCE);
      }
    });
  }

  test('typography is untouched: a golden card keeps its heading and body sizes', async ({ page }) => {
    const sizes = async (flag: string) => {
      await page.evaluate(async (f) => {
        const box = document.createElement('div');
        box.id = 'golden-477';
        box.style.width = '480px';
        box.innerHTML = `<article ${f} title="Ridge loop">Body text.</article>`;
        document.body.appendChild(box);
        await (window as any).WB.scan(box, { eager: true });
      }, flag);
      await settlePage(page, { timeout: 5000 });
      if (flag) await expect(page.locator('#golden-477 article')).toHaveClass(/x-card--golden-ratio/, { timeout: 10_000 });
      return page.evaluate(() => {
        const box = document.getElementById('golden-477')!;
        const card = box.querySelector('article')!;
        const h = card.querySelector('h1,h2,h3,h4') as HTMLElement;
        const body = card.querySelector('.x-card__body') as HTMLElement;
        const out = { heading: getComputedStyle(h).fontSize, body: getComputedStyle(body).fontSize };
        box.remove();
        return out;
      });
    };
    expect(await sizes('goldenRatio')).toEqual(await sizes(''));
  });
});
