/**
 * A demo's LABEL is a claim the test must verify. The Buttons section shows three
 * buttons labelled "Small", "Medium", "Large" — so the rendered sizes must
 * actually be small < medium < large. (Validating the demo claim, per the
 * test-schema-standard: ALL_ENUM permutations assert the rendered outcome.)
 *
 * The trio used to live in a `#buttons` section of /?page=behaviors. That page
 * became a catalogue (#664/#666) and the section is gone, so both tests waited
 * 25s for `#buttons` and failed before measuring anything. The same labelled
 * Small/Medium/Large demo is on demos/site/forms.html (the Form Controls
 * category page), inside the grid scoped as SIZES below.
 */
import { test, expect, Page } from '../fixtures/offline';

const BASE = process.env.WB_BASE || '';
const URL = `${BASE.replace(/\/$/, '')}/demos/site/forms.html`;
// The grid holding exactly the three labelled size demos.
const SIZES = '.demo-section__grid:has(button[size="md"])';

test.describe('Button sizes — the demo labels must match reality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    const grid = page.locator(SIZES).first();
    // Lazy runtime (#491) + JIT CSS (#342): bring the trio into view and wait
    // until each button has been enhanced before measuring it.
    await grid.scrollIntoViewIfNeeded();
    for (const label of ['Small', 'Medium', 'Large']) {
      await expect(grid.locator('button', { hasText: new RegExp(`^${label}$`) })).toHaveAttribute('x-ready', '', { timeout: 25000 });
    }
  });

  test('Small < Medium < Large in rendered size', async ({ page }) => {
    const sizes = await page.evaluate((sel) => {
      const byLabel = (label: string) => {
        const btn = [...document.querySelectorAll(sel + ' button')].find(
          (b) => (b.textContent || '').trim().toLowerCase() === label
        ) as HTMLElement | undefined;
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        const cs = getComputedStyle(btn);
        return { h: Math.round(r.height), w: Math.round(r.width), fontSize: parseFloat(cs.fontSize), padding: cs.padding };
      };
      return { small: byLabel('small'), medium: byLabel('medium'), large: byLabel('large') };
    }, SIZES);

    expect(sizes.small, 'no "Small" button found').not.toBeNull();
    expect(sizes.medium, 'no "Medium" button found').not.toBeNull();
    expect(sizes.large, 'no "Large" button found').not.toBeNull();

    const s = sizes.small!, m = sizes.medium!, l = sizes.large!;
    // height OR font-size must strictly increase with the label
    const heightMonotonic = s.h < m.h && m.h < l.h;
    const fontMonotonic = s.fontSize < m.fontSize && m.fontSize < l.fontSize;
    expect(
      heightMonotonic || fontMonotonic,
      `button sizes do not match their labels — Small/Medium/Large render the same.\n` +
        `  Small:  h=${s.h} font=${s.fontSize}\n  Medium: h=${m.h} font=${m.fontSize}\n  Large:  h=${l.h} font=${l.fontSize}`
    ).toBe(true);
  });

  test('each size button carries an effective size class', async ({ page }) => {
    const r = await page.evaluate((sel) => {
      const get = (label: string) => {
        const btn = [...document.querySelectorAll(sel + ' button')].find(
          (b) => (b.textContent || '').trim().toLowerCase() === label
        ) as HTMLElement | undefined;
        return btn ? btn.className : null;
      };
      return { small: get('small'), large: get('large') };
    }, SIZES);
    // the small/large buttons must have a size modifier that the CSS actually styles
    expect(r.small, '"Small" button missing a size class').toMatch(/--(xs|sm)\b/);
    expect(r.large, '"Large" button missing a size class').toMatch(/--(lg|xl)\b/);
  });
});
