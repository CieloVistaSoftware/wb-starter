import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';
import fs from 'fs';
import path from 'path';

/**
 * A small button a behavior builds (a badge's ✕, a dialog's close, a stepper's
 * +/-) keeps its own compact look instead of the theme's full button.
 *
 * themes.css styles every button with `[data-theme] button` (0,1,1): padding
 * 1rem, a background and a border. A component rule that is a single class
 * (0,1,0) loses to it. John, 2026-10-16, on `<span x-badge removable>`: "The x
 * is too prominent wide and height" -- the ✕ was a padded dark square; the
 * toast's close made the toast 67px tall (#1907) for the same reason.
 */
const ROOT = process.cwd();

/** Every class a behavior gives a <button> it creates. */
function builtButtonClasses(): string[] {
  const out = new Set<string>();
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!p.endsWith('.js')) continue;
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/createElement\('button'\)[\s\S]{0,200}?className = '([^']+)'/g)) {
        const first = m[1].split(/\s+/)[0];
        // A button that is meant to look like a button carries x-button itself.
        if (!/\bx-button\b/.test(m[1])) out.add(first);
      }
    }
  };
  walk(path.join(ROOT, 'src/wb-viewmodels'));
  return [...out].sort();
}

/** [ids, classes/attributes/pseudo-classes, elements]; :where() counts nothing. */
function specificity(sel: string): number[] {
  const s = sel.replace(/:where\([^)]*\)/g, '').replace(/:(?:is|not|has)\([^)]*\)/g, ' .x');
  const ids = (s.match(/#[\w-]+/g) || []).length;
  const cls = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length;
  const el = (s.replace(/\.[\w-]+|\[[^\]]+\]|:[\w-]+|#[\w-]+/g, ' ').match(/\b[a-z][\w-]*\b/gi) || []).length;
  return [ids, cls, el];
}
const beats = (a: number[], b: number[]) => (a[0] - b[0] || a[1] - b[1] || a[2] - b[2]) > 0;

test('every compact button a behavior builds has a rule stronger than [data-theme] button', () => {
  const css: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith('.css')) css.push(fs.readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''));
    }
  };
  walk(path.join(ROOT, 'src/styles'));
  const THEME = [0, 1, 1];
  const losing: string[] = [];
  for (const c of builtButtonClasses()) {
    const rx = new RegExp('\\.' + c + '(?![\\w-])');
    let best: number[] | null = null;
    for (const sheet of css) {
      for (const m of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/padding|background|border\s*:|all\s*:/.test(m[2])) continue;
        for (const sel of m[1].split(',')) {
          const t = sel.trim();
          if (!rx.test(t)) continue;
          // A state rule (:hover) is not the resting box.
          if (/:(hover|focus|active|disabled|focus-visible)/.test(t)) continue;
          const s = specificity(t);
          if (!best || beats(s, best)) best = s;
        }
      }
    }
    if (best && !beats(best, THEME)) losing.push(c + ' (' + best.join(',') + ')');
  }
  expect(losing, 'raise these to two classes, e.g. .x-foo.x-foo, so [data-theme] button does not pad them').toEqual([]);
});

test('a removable badge\'s ✕ is a small glyph, not a padded button', async ({ page }) => {
  await setupBehaviorTest(page);
  await setupTestContainer(page, '<span x-badge label="Tag" variant="info" removable></span>');
  const remove = page.locator('#test-container .x-badge__remove');
  await expect(remove).toBeVisible();
  const m = await remove.evaluate((b) => {
    const cs = getComputedStyle(b);
    const badge = b.closest('.x-badge, [x-badge]')!.getBoundingClientRect();
    const r = b.getBoundingClientRect();
    return { pad: parseFloat(cs.paddingLeft), h: r.height, badgeH: badge.height, label: parseFloat(getComputedStyle(b.parentElement!).fontSize) };
  });
  expect(m.pad, 'the theme button padding (16px) does not reach the ✕').toBeLessThan(8);
  expect(m.h, 'the ✕ is no taller than the badge\'s text').toBeLessThanOrEqual(m.label * 1.5);
});
