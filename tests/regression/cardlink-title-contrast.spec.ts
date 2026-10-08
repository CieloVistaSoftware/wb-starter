/**
 * x-cardlink TITLES ARE READABLE IN DARK AND LIGHT (#1747)
 * ================================================================
 * The Demos page's cards (and every other x-cardlink on a site page) showed
 * their title in --primary blue on the card's dark background: rgb(38, 38,
 * 217) on rgb(41, 48, 61), 1.49:1, where WCAG AA asks 4.5:1 for text.
 *
 * #887 gave the title `.x-card__link-title-row > h3 { color: var(--text-primary) }`
 * at (0,1,1) to beat site.css's bare `h3 { color: var(--primary) }`. But
 * site.css also has `.page h3 { color: var(--primary) }`, also (0,1,1), and
 * site.css comes after the behavior stylesheets (style-loader.js inserts them
 * before it), so on a page inside the site shell the tie went to site.css.
 * A bare test page has no `.page` ancestor, which is why #887's own check
 * passed.
 *
 * So this measures the cards where visitors see them: on ?page=demos inside
 * the shell, in the dark and the light theme, the title against the card's
 * painted background.
 *
 * See it by hand: open ?page=demos and expand a category.
 * Before: the card title is dark blue on the dark card, barely readable.
 * Now: it is the theme's text colour.
 */
import { test, expect } from '../fixtures/offline';

const TEXT_MIN = 4.5;

for (const theme of ['dark', 'light']) {
  test(`x-cardlink titles on ?page=demos keep ${TEXT_MIN}:1 contrast in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => {
      try { localStorage.setItem('x-theme', t); } catch { /* storage off: the attribute below still applies */ }
    }, theme);
    await page.goto('/?page=demos', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#mainPage-demos [x-cardlink] .x-card__link-title-row > h3', { state: 'attached', timeout: 30000 });

    const rows = await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
      // The cards sit in collapsed category <details>; open them, as a reader does.
      document.querySelectorAll('#mainPage-demos details').forEach((d) => { (d as HTMLDetailsElement).open = true; });
      const channel = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const rgb = (c: string) => (c.match(/\d+(\.\d+)?/g) || []).map(Number);
      const luminance = (c: string) => {
        const [r, g, b] = rgb(c).slice(0, 3).map(channel);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a: string, b: string) => {
        const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      };
      /** The first painted (non-transparent) background at or above `el`. */
      const paintedBehind = (el: Element | null): string => {
        for (let e = el; e; e = e.parentElement) {
          const bg = getComputedStyle(e).backgroundColor;
          const alpha = rgb(bg)[3];
          if (bg !== 'transparent' && alpha !== 0) return bg;
        }
        return 'rgb(255, 255, 255)';
      };
      return [...document.querySelectorAll('#mainPage-demos [x-cardlink]')].map((card) => {
        const h3 = card.querySelector('.x-card__link-title-row > h3')!;
        const color = getComputedStyle(h3).color;
        const bg = paintedBehind(card);
        return { title: h3.textContent!.trim(), color, bg, ratio: ratio(color, bg) };
      });
    }, theme);

    const lowest = Math.min(...rows.map((r) => r.ratio));
    test.info().annotations.push({ type: 'lowest-contrast', description: `${theme}: ${lowest.toFixed(2)}:1` });
    console.log(`[contrast] ${theme}: lowest ${lowest.toFixed(2)}:1 (${rows[0]?.color} on ${rows[0]?.bg})`);
    expect(rows.length, 'the demos page has link cards, so this can fail').toBeGreaterThan(5);
    const unreadable = rows.filter((r) => r.ratio < TEXT_MIN)
      .map((r) => `${r.title}: ${r.ratio.toFixed(2)}:1 (${r.color} on ${r.bg})`);
    expect(unreadable, `every x-cardlink title keeps ${TEXT_MIN}:1 in the ${theme} theme`).toEqual([]);
  });
}
