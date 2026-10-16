import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';

/**
 * #1902: primary-coloured TEXT reads at 4.5:1 in every theme.
 *
 * site.css had `h3 { color: var(--primary) }`. --primary is a fill colour
 * (buttons, badges): in the dark theme hsl(240, 70%, 50%) on the dark page was
 * under 3:1, and 613 headings in 91 docs were hard to read. John chose a
 * per-theme --primary-text token. Text uses it; fills and borders keep --primary.
 */
const ROOT = process.cwd();
const THEMES = fs.readFileSync(path.join(ROOT, 'src/styles/themes.css'), 'utf8');

const hsl = (s: string) => s.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/)!.slice(1).map(Number);
const toRgb = ([h, s, l]: number[]) => {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => v * 255);
};
const lum = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: number[], b: number[]) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

test('every theme defines --primary-text at 4.5:1 on its --bg-primary', () => {
  const blocks = [...THEMES.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /--primary:/.test(m[2]) && /--bg-primary:/.test(m[2]));
  expect(blocks.length, 'theme blocks found').toBeGreaterThanOrEqual(50);
  const bad: string[] = [];
  for (const [, sel, body] of blocks) {
    const name = sel.trim().split('\n').pop()!.trim();
    const t = body.match(/--primary-text:\s*([^;]+);/);
    if (!t) { bad.push(name + ': no --primary-text'); continue; }
    const r = ratio(toRgb(hsl(t[1])), toRgb(hsl(body.match(/--bg-primary:\s*([^;]+);/)![1])));
    if (r < 4.5) bad.push(name + ': ' + r.toFixed(2) + ':1');
  }
  expect(bad, 'themes whose primary text is under 4.5:1').toEqual([]);
});

test('no stylesheet uses --primary as a text colour (fills and borders may)', () => {
  const hits: string[] = [];
  // Tracked files only: a git-ignored local folder is not the project's code.
  const files = execFileSync('git', ['ls-files', 'src'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter((f) => /\.(css|js|html)$/.test(f) && !/\/(lib|vendor)\//.test(f));
  for (const f of files) {
    fs.readFileSync(path.join(ROOT, f), 'utf8').split(/\r?\n/).forEach((line, i) => {
      if (/(^|[;{\s])color:\s*var\(--primary[,)]/.test(line)) hits.push(f + ':' + (i + 1));
    });
  }
  expect(hits, 'use var(--primary-text) for text').toEqual([]);
});

test('doc headings read at 4.5:1 in the dark theme', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/dialog.md'));
  await page.waitForSelector('#content.x-mdhtml--loaded', { state: 'attached', timeout: 20000 });
  const low = await page.evaluate(() => {
    const rgb = (s: string) => (s.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el: Element) => { for (let n: Element | null = el; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5)) return c; } return [255, 255, 255]; };
    return [...document.querySelectorAll('#content h3')].map((h) => {
      const a = lum(rgb(getComputedStyle(h).color)), b = lum(bgOf(h));
      return { text: h.textContent!.trim().slice(0, 30), r: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    }).filter((x) => x.r < 4.5).map((x) => x.text + ' ' + x.r.toFixed(2));
  });
  expect(low, 'h3 headings under 4.5:1').toEqual([]);
});
