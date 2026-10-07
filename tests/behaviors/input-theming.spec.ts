/**
 * Inputs must follow the active theme — dark inputs in dark themes, light inputs
 * in light themes — NEVER a native browser-white box on a dark page.
 *
 * Asserts the OUTCOME (computed background luminance tracks the page surface),
 * across a matrix of dark and light themes, not merely that an <input> exists.
 */
import { test, expect, Page } from '../fixtures/offline';

const BASE = process.env.WB_BASE || '';
// Was `/?page=behaviors` with `waitForSelector('#inputs input')`. `#inputs` was a
// section on the OLD sectioned page; that page is a searchable browser now, so
// all eight tests timed out in setup and never evaluated a single theme (#910).
// forms.html carries 64 real inputs and is a stable fixture for a theming check.
const URL = `${BASE.replace(/\/$/, '')}/demos/site/forms.html`;

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
  // The theme has painted and any finite transition finished (#1516: not 150ms).
  await page.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await Promise.all(document.getAnimations()
      .filter((a) => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)))
      .map((a) => a.finished.catch(() => {})));
  });
}

/**
 * The first visible input's styles, once its background is on the expected
 * side (dark or light). Waiting for the switch's animations was not enough:
 * on the Windows runner the dark reading still came back native white
 * (#1680/#1668 CI). If it never gets there, the poll gives up and the
 * assertions below report the colours actually seen.
 */
async function settledInputStyles(page: Page, dark: boolean) {
  await expect.poll(async () => {
    const bg = (await inputStyles(page))[0]?.bg;
    return !!bg && (dark ? luminance(bg) < 0.5 : luminance(bg) > 0.6);
  }, { timeout: 5000 }).toBe(true).catch(() => { /* the assertions below say what was seen */ });
  return inputStyles(page);
}

async function inputStyles(page: Page) {
  return page.evaluate(() => {
    // the "Basic Inputs" row in the Inputs section
    // Any themed text input on the page; `#inputs` was the old page's section id.
    const inputs = [...document.querySelectorAll('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"])')]
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .slice(0, 4);
    return inputs.map((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { bg: cs.backgroundColor, color: cs.color };
    });
  });
}

test.describe('Input theming follows the active theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    // wb-lazy.js defers injection to an IntersectionObserver; scroll the first
    // input into view so it actually upgrades before styles are read.
    await page.waitForSelector('input', { state: 'attached', timeout: 25000 });
    await page.locator('input').first().scrollIntoViewIfNeeded();
    // The lazy upgrade has run once WB settles (#1516: not 1200ms).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));
    // #1682 CI: the inputs inputStyles() measures upgrade only once they come
    // near the viewport, and the demos above them keep rendering after the
    // scroll -- measured locally, the first one moved from 16471px to 23233px
    // down the page -- so one scroll can leave them un-upgraded and native
    // white whatever the theme. Bring each into view until it has upgraded.
    await expect(async () => {
      const pending = await page.evaluate(() => {
        const fields = [...document.querySelectorAll<HTMLElement>('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"])')]
          .filter((el) => el.offsetParent !== null)
          .slice(0, 4);
        fields.find((el) => !el.hasAttribute('x-ready'))?.scrollIntoView({ block: 'center' });
        return fields.filter((el) => !el.hasAttribute('x-ready')).length;
      });
      expect(pending, 'measured inputs not yet upgraded').toBe(0);
    }).toPass({ timeout: 20000 });
  });

  for (const theme of DARK_THEMES) {
    test(`inputs are DARK in the "${theme}" theme (not native white)`, async ({ page }) => {
      await setTheme(page, theme);
      const styles = await settledInputStyles(page, true);
      expect(styles.length, 'no visible text inputs found on the page').toBeGreaterThan(0);
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
      const styles = await settledInputStyles(page, false);
      for (const s of styles) {
        const bgLum = luminance(s.bg);
        expect(bgLum, `input background ${s.bg} is dark in light theme "${theme}"`).toBeGreaterThan(0.6);
      }
    });
  }

  test('input background actually changes between dark and light themes', async ({ page }) => {
    await setTheme(page, 'dark');
    const dark = (await settledInputStyles(page, true))[0]?.bg;
    await setTheme(page, 'light');
    const light = (await settledInputStyles(page, false))[0]?.bg;
    expect(dark, 'no input to sample').toBeTruthy();
    expect(dark, `input bg did not change with theme (stuck at ${dark}) — not theme-driven`).not.toBe(light);
  });
});
