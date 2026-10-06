import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '../fixtures/offline';
import { galleryHref, heroPermutations } from '../../src/lib/hero-permutations.js';

/**
 * pages/hero-gallery.html shows the playground's 120 card heroes as JPGs, and
 * each hero's buttons are clickable hotspots that go where that hero's own
 * buttons go (#1597).
 *
 * John: "i love the 120 card hero example, can we make them a jpg with
 * hotspots for the two buttons." scripts/render-hero-gallery.mjs renders the
 * images and writes the page from src/lib/hero-permutations.js, the module
 * the playground's "120 card heroes" example also uses.
 *
 * Holds:
 *   - the page has one figure per hero, in order, and every JPG exists at the
 *     size the page says (a re-render that changed a hero's height without
 *     rewriting the page would misplace every hotspot below its button);
 *   - each hero's hotspots are its own CTAs: same labels, same links, same
 *     count (cta2 is absent on some heroes). A link to the live doc viewer is
 *     written relative (galleryHref), so it opens the same page;
 *   - each hotspot sits on its button IN THE IMAGE (its four sides cross the
 *     button's edges). The first render measured the buttons mid-entrance-
 *     animation and drew every hotspot 16px low; a click on the button's top
 *     half then hit nothing;
 *   - in the browser, the point at the middle of each button in the image
 *     is a link to that button's href.
 */

const ROOT = process.cwd();
const page_ = readFileSync(join(ROOT, 'pages', 'hero-gallery.html'), 'utf8');
const heroes = heroPermutations();

/** Width and height from a JPEG's SOF marker. */
function jpegSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  throw new Error(`no SOF marker in ${file}`);
}

type Spot = { label: string; href: string; x: number; y: number; w: number; h: number };
const unesc = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const items = [...page_.matchAll(/<li id="herogallery-item-(\d+)"[\s\S]*?<\/li>/g)].map((m) => {
  const li = m[0];
  const img = li.match(/src="(images\/hero-gallery\/hero-\d+\.jpg)" width="(\d+)" height="(\d+)"/);
  const spots: Spot[] = [...li.matchAll(/<a href="([^"]*)" aria-label="([^"]*) \(hero #\d+\)"><rect class="hg-hotspot" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g)]
    .map((h) => ({ href: unesc(h[1]), label: unesc(h[2]), x: +h[3], y: +h[4], w: +h[5], h: +h[6] }));
  return { index: Number(m[1]), src: img?.[1], width: Number(img?.[2]), height: Number(img?.[3]), spots };
});

test.describe('hero gallery hotspots match each hero (#1597)', () => {
  test('one figure per playground hero; each JPG exists at the size the page says', () => {
    expect(items.map((it) => it.index)).toEqual(heroes.map((h) => h.index));
    for (const it of items) {
      expect(it.src, `hero #${it.index} has an image`).toBeTruthy();
      const file = join(ROOT, it.src!);
      expect(existsSync(file), `${it.src} exists`).toBe(true);
      expect(jpegSize(file), `${it.src} is the size the page draws its hotspots in`).toEqual({ width: it.width, height: it.height });
    }
  });

  test("each hero's hotspots are its own buttons and links", () => {
    expect(items, 'the page has one figure per hero').toHaveLength(heroes.length);
    for (const [k, h] of heroes.entries()) {
      const expected = [h.cta, h.cta2].filter(Boolean).map((c) => ({ label: c!.label, href: galleryHref(c!.href) }));
      expect(items[k].spots.map((s) => ({ label: s.label, href: s.href })), `hero #${h.index}`).toEqual(expected);
      for (const s of items[k].spots) {
        expect(s.x + s.w <= items[k].width && s.y + s.h <= items[k].height, `hero #${h.index} ${s.label} lies inside the image`).toBe(true);
      }
    }
  });

  // #1653 -- John: "the two buttons are acting as one". Get Started + View Docs
  // and See a11y + Docs all opened the V3 guide, so on 20 heroes both buttons
  // were the same link. Two buttons, two destinations.
  test("a hero's two buttons go to two different pages", () => {
    const same = heroes
      .filter((h) => h.cta2 && h.cta.href === h.cta2.href)
      .map((h) => `hero #${h.index}: "${h.cta.label}" and "${h.cta2!.label}" both -> ${h.cta.href}`);
    expect(heroes.filter((h) => h.cta2).length, 'no two-button heroes -- the check would pass vacuously').toBeGreaterThan(0);
    expect(same, same.join('\n')).toEqual([]);
  });

  test('each hotspot sits on its button in the image', async ({ page }) => {
    // The oracle is the JPG itself, not a live re-render: CI's Windows runner
    // lays the same hero out with different fonts (a 142px "Get Started"
    // against the image's 161px), so a live render cannot judge an image
    // rendered elsewhere.
    //
    // A hotspot drawn over a button has the button's edge under each of its
    // four sides: a sharp brightness change across the line. The edge score
    // sums that change around the rectangle. Placed right, it beats the same
    // rectangle nudged 6px any way; the first render's 16px-low hotspots lost
    // to their neighbours on 201 of 220 buttons. A button too faint to have an
    // edge (a translucent secondary on a matching background, score < 25)
    // cannot be judged this way and is skipped, but most must be judged.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/?page=hero-gallery');
    await page.waitForSelector('#herogallery-list .hg-item', { timeout: 20_000 });
    const result = await page.evaluate(async () => {
      const judged: string[] = [];
      const misplaced: string[] = [];
      let unjudged = 0;
      for (const li of Array.from(document.querySelectorAll('.hg-item'))) {
        const img = li.querySelector('img') as HTMLImageElement;
        img.loading = 'eager';
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        const lum = (x: number, y: number) => {
          const px = Math.max(0, Math.min(c.width - 1, Math.round(x)));
          const py = Math.max(0, Math.min(c.height - 1, Math.round(y)));
          const i = (py * c.width + px) * 4;
          return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        };
        for (const r of Array.from(li.querySelectorAll('rect'))) {
          const x0 = +r.getAttribute('x')!, y0 = +r.getAttribute('y')!, w = +r.getAttribute('width')!, h = +r.getAttribute('height')!;
          const score = (dx: number, dy: number) => {
            const x = x0 + dx, y = y0 + dy, D = 4;
            const xs = Array.from({ length: 10 }, (_, k) => x + 12 + (w - 24) * k / 9);
            const ys = Array.from({ length: 6 }, (_, k) => y + 10 + (h - 20) * k / 5);
            const across = (pts: number[][]) => pts.reduce((t, [ax, ay, bx, by]) => t + Math.abs(lum(ax, ay) - lum(bx, by)), 0) / pts.length;
            return across(xs.map((xx) => [xx, y + D, xx, y - D])) + across(xs.map((xx) => [xx, y + h - D, xx, y + h + D]))
              + across(ys.map((yy) => [x + D, yy, x - D, yy])) + across(ys.map((yy) => [x + w - D, yy, x + w + D, yy]));
          };
          const label = (r.parentElement as Element).getAttribute('aria-label') || '?';
          const here = score(0, 0);
          if (here < 25) { unjudged++; continue; }
          const around = Math.max(score(6, 0), score(-6, 0), score(0, 6), score(0, -6));
          judged.push(label);
          if (here <= around) misplaced.push(`${label}: edge score ${here.toFixed(1)} here vs ${around.toFixed(1)} 6px away`);
        }
      }
      return { judged: judged.length, unjudged, misplaced };
    });
    expect(result.judged + result.unjudged, 'every hotspot was looked at').toBe(items.reduce((n, it) => n + it.spots.length, 0));
    expect(result.judged, 'most hotspots sit on a visible button edge, so the check means something').toBeGreaterThan(150);
    expect(result.misplaced, 'a hotspot off its button in the image').toEqual([]);
  });

  test('the middle of each button in the image is a link to its href', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/?page=hero-gallery');
    await page.waitForSelector('#herogallery-list .hg-item', { timeout: 20_000 });
    // A sample across the set: every variant, both CTA counts, the
    // background image, and the overlay=false heroes.
    const SAMPLE = [1, 2, 3, 5, 7, 13, 26, 50, 61, 97, 120];
    let clicked = 0;
    for (const n of SAMPLE) {
      const it = items[n - 1];
      const id = String(n).padStart(3, '0');
      const frame = page.locator(`#herogallery-frame-${id}`);
      await frame.scrollIntoViewIfNeeded();
      await expect(page.locator(`#herogallery-img-${id}`)).toHaveJSProperty('complete', true);
      const hits = await frame.evaluate((el, spots) => {
        const r = el.getBoundingClientRect();
        const img = el.querySelector('img') as HTMLImageElement;
        const scale = r.width / img.naturalWidth;
        return spots.map((s) => {
          const x = r.left + (s.x + s.w / 2) * scale;
          const y = r.top + (s.y + s.h / 2) * scale;
          const a = document.elementFromPoint(x, y)?.closest('a');
          return a ? a.getAttribute('href') : null;
        });
      }, it.spots);
      expect(hits, `hero #${n}: clicking the middle of each button follows its link`).toEqual(it.spots.map((s) => s.href));
      clicked++;
    }
    expect(clicked, 'every sampled hero was clicked').toBe(SAMPLE.length);
  });
});
