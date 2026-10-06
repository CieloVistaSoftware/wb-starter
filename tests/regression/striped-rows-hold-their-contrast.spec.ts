import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

/**
 * Striped rows: adjacent rows differ by at least 1.2:1, on every theme (#680,
 * DEMOS-AND-DOCS-STANDARDS.md §33).
 *
 * John: "what is our striped rule of contrast?" There was none: #672's "not
 * enough contrast on striped rows" was tuned by eye. Measured 2026-10-06 over
 * all 50 themes: dark (as #672 left it) 1.44:1, and light and arctic just
 * short at 1.197:1 and 1.196:1.
 *
 * Every theme in themes.css is read from the file, so a theme added later is
 * held to the rule without anyone listing it here.
 */
const STRIPE_MIN = 1.2;
const TEXT_MIN = 4.5;
const THEMES = [...new Set([...fs.readFileSync(path.join(process.cwd(), 'src/styles/themes.css'), 'utf8')
  .matchAll(/\[data-theme="([a-z0-9-]+)"\]/g)].map((m) => m[1]))];

type Row = { theme: string; odd: string; even: string; stripe: number; textOdd: number; textEven: number };

test('striped rows hold their contrast on every theme (#680)', async ({ page }) => {
  expect(THEMES.length, 'themes were read, so the sweep can fail').toBeGreaterThan(10);
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });

  const rows: Row[] = await page.evaluate(async (themes) => {
    const host = document.createElement('div');
    host.innerHTML = '<table striped><thead><tr><th>Name</th></tr></thead>'
      + '<tbody><tr><td>one</td></tr><tr><td>two</td></tr></tbody></table>';
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });

    const channel = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const luminance = (c: string) => {
      const [r, g, b] = (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map(channel);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    const out: Row[] = [];
    for (const theme of themes) {
      document.documentElement.setAttribute('data-theme', theme);
      const [first, second] = host.querySelectorAll('tbody tr');
      const odd = getComputedStyle(first).backgroundColor;
      const even = getComputedStyle(second).backgroundColor;
      const text = getComputedStyle(first.querySelector('td')!).color;
      out.push({ theme, odd, even, stripe: ratio(odd, even), textOdd: ratio(text, odd), textEven: ratio(text, even) });
    }
    host.remove();
    return out;
  }, THEMES);

  const transparent = rows.filter((r) => [r.odd, r.even].some((c) => c === 'transparent' || /,\s*0\)$/.test(c)));
  expect(transparent.map((r) => r.theme), 'both parities are painted, never see-through (#672)').toEqual([]);

  const faint = rows.filter((r) => r.stripe < STRIPE_MIN).map((r) => `${r.theme}: ${r.stripe.toFixed(3)} (${r.odd} / ${r.even})`);
  expect(faint, `adjacent rows differ by at least ${STRIPE_MIN}:1`).toEqual([]);

  const unreadable = rows.filter((r) => Math.min(r.textOdd, r.textEven) < TEXT_MIN)
    .map((r) => `${r.theme}: ${Math.min(r.textOdd, r.textEven).toFixed(2)}`);
  expect(unreadable, `text keeps ${TEXT_MIN}:1 on both parities`).toEqual([]);
});
