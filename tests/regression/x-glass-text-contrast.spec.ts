/**
 * x-glass TEXT STAYS READABLE OVER THE HERO SCENES (#1236)
 * =======================================================
 * x-glass lets the scene behind an element show through it: a 14% tint, a
 * small blur, the picture underneath. That is the effect, and its risk is the
 * text on top. #1236 capped the tint at 30% for exactly that reason ("past
 * that... light text on it loses contrast against a dark scene") but nothing
 * measured it.
 *
 * This measures it where x-glass is used on real pages: the card hero's
 * eyebrow pill and its secondary button, on the home page and the hero demo.
 * For each, the text is hidden, the element is photographed, and the BRIGHTEST
 * part of what shows through (95th percentile luminance -- one glint is not
 * the backdrop) is compared with the text colour. WCAG AA for normal text,
 * 4.5:1.
 */
import { test, expect, type Page } from '../fixtures/offline';
import { settlePage } from '../base';

const AA = 4.5;

/** Relative luminance of an sRGB triple (0-255), WCAG 2.x. */
const luminance = ([r, g, b]: number[]) => {
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** Every visible x-glass element inside a hero, with its text colour, measured. */
async function glassInHeroes(page: Page) {
  await expect.poll(() => page.locator('[x-cardhero] [x-glass]').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  const handles = await page.locator('[x-cardhero] [x-glass]').all();
  const out: { label: string; ratio: number }[] = [];
  for (const h of handles) {
    if (!(await h.isVisible())) continue;
    await h.scrollIntoViewIfNeeded();
    // Heroes upgrade as they near the viewport: measure once x-glass has
    // attached and glass.css has loaded. (A hero variant may still turn the
    // blur off -- hero.css's minimal one does -- and its text is held to the
    // same contrast.)
    await expect(h).toHaveClass(/\bx-glass\b/, { timeout: 15_000 });
    await expect.poll(() => page.evaluate(() => [...document.styleSheets].some((sh) => /glass\.css/.test(sh.href || ''))), { timeout: 15_000 }).toBe(true);
    const { color, label } = await h.evaluate((el) => {
      (el as HTMLElement).getAnimations({ subtree: true }).forEach((a) => a.finish());
      const c = getComputedStyle(el).color;
      const lbl = `${el.className.split(' ').find((k) => k.startsWith('x-card__hero') || k.startsWith('x-hero-cta')) || el.tagName}: "${(el.textContent || '').trim()}"`;
      (el as HTMLElement).style.setProperty('color', 'transparent', 'important');
      return { color: c, label: lbl };
    });
    const shot = await h.screenshot();
    await h.evaluate((el) => (el as HTMLElement).style.removeProperty('color'));
    const bg95 = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      // The interior only: the element's own edge (x-glass draws a light
      // border) is not the scene the text sits on.
      const m = Math.min(6, Math.floor(Math.min(img.width, img.height) / 4));
      const d = ctx.getImageData(m, m, img.width - 2 * m, img.height - 2 * m).data;
      const lum = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
      const ls: number[] = [];
      for (let i = 0; i < d.length; i += 4) ls.push(0.2126 * lum(d[i]) + 0.7152 * lum(d[i + 1]) + 0.0722 * lum(d[i + 2]));
      ls.sort((a, b) => a - b);
      return ls[Math.floor(ls.length * 0.95)];
    }, shot.toString('base64'));
    const rgb = (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const lt = luminance(rgb);
    const ratio = (Math.max(lt, bg95) + 0.05) / (Math.min(lt, bg95) + 0.05);
    out.push({ label, ratio: Math.round(ratio * 100) / 100 });
  }
  return out;
}

for (const [where, url] of [['the home page', '/'], ['the hero demo', '/demos/hero.html']] as const) {
  test(`x-glass text in ${where}'s heroes reads at ${AA}:1 or better`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);
    await settlePage(page, { timeout: 15_000 });
    const measured = await glassInHeroes(page);
    expect(measured.length, `no x-glass element in a hero on ${where}`).toBeGreaterThan(0);
    const low = measured.filter((m) => m.ratio < AA).map((m) => `${m.label} ${m.ratio}:1`);
    expect(low, `x-glass text below ${AA}:1 against the scene behind it`).toEqual([]);
  });
}
