/**
 * x-switch (<div x-switch>) must be a real toggle: a checkbox input, reflecting
 * the `checked` attribute, toggling on click, showing its label. (#197)
 */
import { test, expect, Page } from '../fixtures/offline';
import { elementReady } from '../base';

const BASE = process.env.WB_BASE || '';
// Was `/?page=behaviors`. That page is a searchable BROWSER now -- nothing is in
// the DOM until a behavior is searched for and selected -- so all five tests sat
// waiting 25s for `[x-switch]` to appear and timed out in setup, never reaching
// what they assert. Same stale-fixture cause as #910.
//
// demos/site/forms.html carries 32 real `<div x-switch>` examples, including the
// `checked` and `disabled` cases these tests need.
const URL = `${BASE.replace(/\/$/, '')}/demos/site/forms.html`;

async function load(page: Page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // This page loads wb-lazy.js, so injection is deferred to an
  // IntersectionObserver. The switches sit ~800 lines down, below the fold, and
  // would never upgrade on their own -- scroll the first one into view first.
  await page.waitForSelector('[x-switch]', { state: 'attached', timeout: 25000 });
  // Every test below reads SOME switch -- the checked one, the labelled one,
  // an on/off pair -- not only the first, so every one must be injected before
  // the assertions mean anything. Scroll-then-wait is retried because demos
  // above are still building while we scroll: the page grows, the switch
  // slides back out of range and is never injected (measured under
  // full-suite load: "never became x-ready within 15000ms").
  const switches = page.locator('[x-switch]');
  const count = await switches.count();
  for (let i = 0; i < count; i++) {
    const sw = switches.nth(i);
    await expect(async () => {
      await sw.scrollIntoViewIfNeeded();
      await elementReady(sw, 2000);
    }).toPass({ timeout: 25_000 });
  }
}

test.describe('Switch — real toggle', () => {
  test.beforeEach(async ({ page }) => load(page));

  test('inner input is a checkbox (not text)', async ({ page }) => {
    const type = await page.evaluate(() => (document.querySelector('[x-switch] input') as HTMLInputElement)?.type);
    expect(type, 'switch input is not a checkbox').toBe('checkbox');
  });

  test('checked attribute is reflected on first paint', async ({ page }) => {
    const r = await page.evaluate(() => {
      const sw = [...document.querySelectorAll('[x-switch]')].find((s) => s.hasAttribute('checked'));
      const inp = sw?.querySelector('input') as HTMLInputElement | undefined;
      return { found: !!sw, checked: inp?.checked ?? null };
    });
    expect(r.found, 'no checked [x-switch] in markup').toBe(true);
    expect(r.checked, 'checked switch did not paint its ON state').toBe(true);
  });

  test('clicking toggles the state', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const sw = document.querySelector('[x-switch]') as HTMLElement;
      const inp = sw.querySelector('input') as HTMLInputElement;
      const before = inp.checked;
      sw.click();
      await new Promise((r) => setTimeout(r, 120));
      const after = inp.checked;
      return { before, after, aria: sw.getAttribute('aria-checked') };
    });
    expect(r.after, `switch did not toggle on click (before=${r.before} after=${r.after})`).not.toBe(r.before);
    expect(r.aria, 'aria-checked not synced').toBe(String(r.after));
  });

  test('label text renders', async ({ page }) => {
    // The `|| <fallback>` this used to carry was unreachable -- find() already
    // guarantees the element HAS a label -- and the fallback itself was a
    // literal NUL byte on disk, a `\0` escape eaten by a scripted edit (#888).
    // Dead code hiding an invisible character. Worth naming what the obvious
    // "cleanup" would have been: `|| ''`, which makes includes('') always true
    // and the whole assertion vacuous.
    const found = await page.evaluate(() => {
      const sw = [...document.querySelectorAll('[x-switch]')].find((s) => s.getAttribute('label'));
      if (!sw) return null;
      return { label: sw.getAttribute('label') as string, text: (sw.textContent || '').trim() };
    });

    // Reported separately: "no switch on the page declares a label" is a broken
    // fixture, not a failing behavior, and the two need different fixes.
    expect(found, 'no [x-switch] on the page declares a label= to check').not.toBeNull();
    expect(
      found!.text,
      `[x-switch label="${found!.label}"] did not render its label`,
    ).toContain(found!.label);
  });

  test('ON state is visually distinct (track color changes)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const sw = [...document.querySelectorAll('[x-switch]')];
      const on = sw.find((s) => (s.querySelector('input') as HTMLInputElement)?.checked);
      const off = sw.find((s) => !(s.querySelector('input') as HTMLInputElement)?.checked);
      const trackBg = (s?: Element) => { const t = s?.querySelector('.x-switch__track') as HTMLElement; return t ? getComputedStyle(t).backgroundColor : null; };
      return { onBg: trackBg(on), offBg: trackBg(off) };
    });
    expect(r.onBg, 'no on/off tracks to compare').toBeTruthy();
    expect(r.onBg, `ON and OFF tracks look identical (${r.onBg})`).not.toBe(r.offBg);
  });
});
