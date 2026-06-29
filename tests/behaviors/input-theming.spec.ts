/**
 * Inputs must follow the active theme — dark inputs in dark themes, light inputs
 * in light themes — NEVER a native browser-white box on a dark page.
 *
 * Asserts the OUTCOME (computed background luminance tracks the page surface),
 * across a matrix of dark and light themes, not merely that an <input> exists.
 */
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

const DARK_THEMES = ['dark', 'ocean', 'midnight', 'cyberpunk'];
const LIGHT_THEMES = ['light', 'arctic', 'sakura'];

function luminance(rgb: string): number {
  const m = rgb.match(/(\d+(?:\.\d+)?)/g);
  if (!m) return -1;
  const [r, g, b] = m.map(Number);
  return (0.2126 * r + 0.7152 * g + 0.4114 * b) / 255; // 0 = black, ~1 = white
}

async function setTheme(page: Page, theme: string) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.body.setAttribute('data-theme', t);
  }, theme);
  await page.waitForTimeout(150);
}

async function inputStyles(page: Page) {
  return page.evaluate(() => {
    // the "Basic Inputs" row in the Inputs section
    const sec = document.querySelector('#inputs') || document;
    const inputs = [...sec.querySelectorAll('input:not([type="range"]):not([type="checkbox"]):not([type="radio"])')].slice(0, 4);
    return inputs.map((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { bg: cs.backgroundColor, color: cs.color };
    });
  });
}

test.describe('Input theming follows the active theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#inputs input', { timeout: 25000 });
    await page.waitForTimeout(1500);
  });

  for (const theme of DARK_THEMES) {
    test(`inputs are DARK in the "${theme}" theme (not native white)`, async ({ page }) => {
      await setTheme(page, theme);
      const styles = await inputStyles(page);
      expect(styles.length, 'no inputs found in #inputs section').toBeGreaterThan(0);
      for (const s of styles) {
        const bgLum = luminance(s.bg);
        const txtLum = luminance(s.color);
        expect(bgLum, `input background ${s.bg} is light/native-white in dark theme "${theme}"`).toBeLessThan(0.5);
        // text must be readable (light) on the dark field
        expect(txtLum, `input text ${s.color} is too dark to read on a dark field in "${theme}"`).toBeGreaterThan(0.5);
      }
    });
  }

  for (const theme of LIGHT_THEMES) {
    test(`inputs are LIGHT in the "${theme}" theme`, async ({ page }) => {
      await setTheme(page, theme);
      const styles = await inputStyles(page);
      for (const s of styles) {
        const bgLum = luminance(s.bg);
        expect(bgLum, `input background ${s.bg} is dark in light theme "${theme}"`).toBeGreaterThan(0.6);
      }
    });
  }

  test('input background actually changes between dark and light themes', async ({ page }) => {
    await setTheme(page, 'dark');
    const dark = (await inputStyles(page))[0]?.bg;
    await setTheme(page, 'light');
    const light = (await inputStyles(page))[0]?.bg;
    expect(dark, 'no input to sample').toBeTruthy();
    expect(dark, `input bg did not change with theme (stuck at ${dark}) — not theme-driven`).not.toBe(light);
  });
});
