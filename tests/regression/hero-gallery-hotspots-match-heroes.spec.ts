import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '../fixtures/offline';
import { heroPermutations } from '../../demos/lib/hero-permutations.js';

/**
 * pages/hero-gallery.html shows the playground's 120 card heroes as JPGs, and
 * each hero's buttons are clickable hotspots that go where that hero's own
 * buttons go (#1597).
 *
 * John: "i love the 120 card hero example, can we make them a jpg with
 * hotspots for the two buttons." scripts/render-hero-gallery.mjs renders the
 * images and writes the page from demos/lib/hero-permutations.js, the module
 * the playground's "120 card heroes" example also uses.
 *
 * Holds:
 *   - the page has one figure per hero, in order, and every JPG exists at the
 *     size the page says (a re-render that changed a hero's height without
 *     rewriting the page would misplace every hotspot below its button);
 *   - each hero's hotspots are its own CTAs: same labels, same links, same
 *     count (cta2 is absent on some heroes);
 *   - in the browser, the point at the middle of each button in the image
 *     is a link to that button's href. The first render measured the
 *     buttons mid-entrance-animation and drew every hotspot 16px low; a click
 *     on the button's top half then hit nothing.
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
    for (const [k, h] of heroes.entries()) {
      const expected = [h.cta, h.cta2].filter(Boolean).map((c) => ({ label: c!.label, href: c!.href }));
      expect(items[k].spots.map((s) => ({ label: s.label, href: s.href })), `hero #${h.index}`).toEqual(expected);
      for (const s of items[k].spots) {
        expect(s.x + s.w <= items[k].width && s.y + s.h <= items[k].height, `hero #${h.index} ${s.label} lies inside the image`).toBe(true);
      }
    }
  });

  test("each hotspot covers its button on the live hero, after the hero's animations end", async ({ page }) => {
    // An oracle independent of the render script: the script switches
    // animations off; this lets them run and waits for every one to finish,
    // so a hotspot measured mid-animation (16px low) fails here.
    await page.setViewportSize({ width: 1300, height: 900 });
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20_000 });
    for (const n of [1, 2, 7, 26, 50, 97]) {
      const markup = heroes[n - 1].heroMarkup.replace(/\n\s*x-fadein(?=[\s>])/, '');
      const live = await page.evaluate(async (markup) => {
        document.querySelectorAll('.hg-live').forEach((el) => el.remove());
        const host = document.createElement('div');
        host.className = 'hg-live';
        host.style.width = '1200px';
        host.innerHTML = markup;
        document.body.appendChild(host);
        await (window as any).WB.scan(host, { eager: true });
        await (window as any).WB.whenIdle({ timeout: 10_000 });
        const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity);
        await Promise.all(finite.map((a) => a.finished.catch(() => {})));
        const hero = host.firstElementChild as HTMLElement;
        const r = hero.getBoundingClientRect();
        return [...hero.querySelectorAll('a.x-hero-cta')].map((a) => {
          const b = a.getBoundingClientRect();
          return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height };
        });
      }, markup);
      const spots = items[n - 1].spots;
      expect(live.length, `hero #${n} button count`).toBe(spots.length);
      for (const [k, b] of live.entries()) {
        const s = spots[k];
        const where = `hero #${n} ${s.label}: hotspot (${s.x},${s.y} ${s.w}x${s.h}) vs live button (${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.w)}x${Math.round(b.h)})`;
        expect(Math.abs(s.x - b.x) <= 2 && Math.abs(s.y - b.y) <= 2 && Math.abs(s.w - b.w) <= 2 && Math.abs(s.h - b.h) <= 2, where).toBe(true);
      }
    }
  });

  test('the middle of each button in the image is a link to its href', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/?page=hero-gallery');
    await page.waitForSelector('#herogallery-list .hg-item', { timeout: 20_000 });
    // A sample across the set: every variant, both CTA counts, the
    // background image, and the overlay=false heroes.
    for (const n of [1, 2, 3, 5, 7, 13, 26, 50, 61, 97, 120]) {
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
    }
  });
});
