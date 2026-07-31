import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { MIN_CONTRAST_RATIO, hslContrastRatio } from '../../src/core/contrast.js';

/**
 * "put a global configurable contrast ratio that affects every control...
 * tied into our theme generator automatically." The concrete instance
 * (wb-cardhero title/subtitle losing their intended --text-on-accent
 * color to --text-primary) was fixed directly in hero.css. This is the
 * systemic backstop: every theme's core text/background pairs must clear
 * WCAG AA (src/core/contrast.js's MIN_CONTRAST_RATIO) automatically --
 * any theme added later (by hand or generated) is checked by the same
 * gate, not left to be caught by eye on a live page.
 */

const THEMES_CSS = readFileSync('src/styles/themes.css', 'utf8');

function extractThemeBlocks(css) {
  // Matches `[data-theme="id"]` (optionally followed by `, :root` for the
  // dark/default combined block) up to its closing brace.
  const re = /\[data-theme="([^"]+)"\](?:,\s*:root)?\s*\{([^}]*)\}/g;
  const themes = [];
  let m;
  while ((m = re.exec(css))) {
    themes.push({ id: m[1], body: m[2] });
  }
  return themes;
}

function extractVar(body, name) {
  const re = new RegExp(`--${name}:\\s*(hsl\\([^;]+\\));`);
  const m = re.exec(body);
  return m ? m[1].trim() : null;
}

const THEMES = extractThemeBlocks(THEMES_CSS);

test('every theme defines --text-primary and --bg-color', () => {
  expect(THEMES.length, 'themes.css should have parsed at least the known theme count').toBeGreaterThanOrEqual(20);
  const missing = THEMES.filter((t) => !extractVar(t.body, 'text-primary') || !extractVar(t.body, 'bg-color'));
  expect(missing.map((t) => t.id), 'every theme must define both --text-primary and --bg-color').toEqual([]);
});

test.describe(`every theme's body text meets WCAG AA (${MIN_CONTRAST_RATIO}:1) against its own background`, () => {
  for (const theme of THEMES) {
    test(`${theme.id}: --text-primary vs --bg-color`, () => {
      const text = extractVar(theme.body, 'text-primary');
      const bg = extractVar(theme.body, 'bg-color');
      expect(text, `${theme.id} must define --text-primary`).toBeTruthy();
      expect(bg, `${theme.id} must define --bg-color`).toBeTruthy();

      const ratio = hslContrastRatio(text!, bg!);
      expect(ratio, `${theme.id}: could not parse --text-primary/--bg-color as hsl()`).not.toBeNull();
      expect(
        ratio!,
        `${theme.id}: --text-primary (${text}) vs --bg-color (${bg}) contrast is ${ratio!.toFixed(2)}:1, below the ${MIN_CONTRAST_RATIO}:1 minimum`
      ).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    });
  }
});
