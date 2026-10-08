/**
 * STRICT behaviors-page audit — asserts what the user actually sees, in a dark
 * theme. Each check fails LOUDLY and names the broken element(s), so a green run
 * is real proof, not "the element exists".
 *
 * Dimensions: theme-correct controls, no native-white fallbacks, no zero-size /
 * unstyled custom elements, working interactions, readable contrast.
 */
import { test, expect, Page } from '../fixtures/offline';
import { pickBehavior } from '../helpers/behaviors-page';

import { settlePage } from '../base';
const BASE = process.env.WB_BASE || '';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

function lum(rgb: string): number {
  const m = rgb.match(/(\d+(?:\.\d+)?)/g);
  if (!m) return -1;
  const [r, g, b] = m.map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

async function loadDark(page: Page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#mainPage-behaviors', { timeout: 25000 });
  // The page is built once WB settles (#1516: not 2500ms).
  await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
  await settlePage(page, { timeout: 15000 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  });
  // The theme has painted and any finite colour transition finished (#1516: not 200ms).
  await page.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await Promise.all(document.getAnimations()
      .filter((a) => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)))
      .map((a) => a.finished.catch(() => {})));
  });
}

test.describe('Behaviors page — STRICT audit (dark theme)', () => {
  test.beforeEach(async ({ page }) => loadDark(page));

  test('AUDIT: no text control renders a native-white box on the dark page', async ({ page }) => {
    const offenders = await page.evaluate(() => {
      const lumOf = (rgb: string) => { const m = rgb.match(/\d+(\.\d+)?/g); if (!m) return -1; const [r, g, b] = m.map(Number); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
      const ctrls = [...document.querySelectorAll('#mainPage-behaviors input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=color]), #mainPage-behaviors select, #mainPage-behaviors textarea')];
      return ctrls
        .map((el) => ({ tag: (el as HTMLElement).tagName.toLowerCase() + ((el as HTMLInputElement).type ? '[' + (el as HTMLInputElement).type + ']' : ''), bg: getComputedStyle(el as HTMLElement).backgroundColor }))
        .filter((c) => lumOf(c.bg) > 0.6); // light box on a dark page
    });
    expect(offenders, `controls with a light/native background on the dark page:\n${JSON.stringify(offenders, null, 1)}`).toEqual([]);
  });

  test.fixme('AUDIT: native checkboxes/radios are theme-accented (not default blue/grey)', async ({ page }) => {
    const offenders = await page.evaluate(() => {
      const boxes = [...document.querySelectorAll('#mainPage-behaviors input[type=checkbox], #mainPage-behaviors input[type=radio]')];
      return boxes
        .map((el) => ({ type: (el as HTMLInputElement).type, accent: getComputedStyle(el as HTMLElement).accentColor }))
        .filter((c) => c.accent === 'auto'); // not themed
    });
    expect(offenders, `checkboxes/radios not theme-accented (accent-color: auto):\n${JSON.stringify(offenders, null, 1)}`).toEqual([]);
  });

  test('AUDIT: no behavior is zero-size or left as raw inline text', async ({ page }) => {
    const offenders = await page.evaluate(() => {
      const tags = ['[x-switch]', '[x-rating]', '[x-alert]', '[x-badge]', '[x-progress]', '[x-spinner]', '[x-avatar]', '[x-skeleton]', '[x-tabs]', '[x-cardnotification]'];
      const bad: any[] = [];
      for (const t of tags) {
        document.querySelectorAll('#mainPage-behaviors ' + t).forEach((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          const cs = getComputedStyle(el as HTMLElement);
          // raw, unenhanced custom element = inline display with no built children
          const enhanced = el.children.length > 0 || /(flex|block|grid|inline-flex|inline-block)/.test(cs.display);
          if (r.height < 4 || r.width < 4 || !enhanced) bad.push({ tag: t, w: Math.round(r.width), h: Math.round(r.height), display: cs.display, children: el.children.length });
        });
      }
      return bad;
    });
    expect(offenders, `components zero-size or unstyled/unenhanced:\n${JSON.stringify(offenders, null, 1)}`).toEqual([]);
  });

  test('AUDIT: switches actually toggle state on click', async ({ page }) => {
    // The page builds one behavior's example on selection now (#666/#910);
    // nothing is on the stage until x-switch is picked.
    await pickBehavior(page, 'x-switch');
    const result = await page.evaluate(async () => {
      const sw = document.querySelector('#behaviors-live-example [x-switch]');
      if (!sw) return 'NO_SWITCH';
      const read = () => {
        const inp = sw.querySelector('input') as HTMLInputElement | null;
        return inp ? String(inp.checked) : (sw.getAttribute('checked') ?? sw.classList.contains('checked') ? 'on' : 'off');
      };
      const before = read();
      const target = (sw.querySelector('input, [role=switch], .x-switch__track, label, button') as HTMLElement) || (sw as HTMLElement);
      target.click();
      // Two frames, not 150ms (#1516): the toggle's state is set on the click.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return { before, after: read() };
    });
    expect(result, 'no [x-switch] on page').not.toBe('NO_SWITCH');
    expect((result as any).after, `switch did not change state on click (${JSON.stringify(result)})`).not.toBe((result as any).before);
  });

  test.fixme('AUDIT: every visible text has readable contrast against its background', async ({ page }) => {
    const offenders = await page.evaluate(() => {
      const lumOf = (rgb: string) => { const m = rgb.match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.map(Number); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
      const bad: any[] = [];
      const els = [...document.querySelectorAll('#mainPage-behaviors h1, #mainPage-behaviors h2, #mainPage-behaviors h3, #mainPage-behaviors p, #mainPage-behaviors label, #mainPage-behaviors button, #mainPage-behaviors a')];
      for (const el of els) {
        const e = el as HTMLElement;
        if (!e.offsetParent || (e.textContent || '').trim().length < 2) continue;
        const cs = getComputedStyle(e);
        // resolve nearest non-transparent background
        let bgEl: HTMLElement | null = e; let bg = cs.backgroundColor;
        while (bgEl && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) { bgEl = bgEl.parentElement; bg = bgEl ? getComputedStyle(bgEl).backgroundColor : 'rgb(0,0,0)'; }
        const tl = lumOf(cs.color); const bl = lumOf(bg);
        if (tl === null || bl === null) continue;
        if (Math.abs(tl - bl) < 0.12) bad.push({ text: (e.textContent || '').trim().slice(0, 24), color: cs.color, bg });
      }
      return bad.slice(0, 10);
    });
    expect(offenders, `text with near-invisible contrast:\n${JSON.stringify(offenders, null, 1)}`).toEqual([]);
  });
});
