/**
 * A demo's LABEL is a claim the test must verify. The Buttons section shows three
 * buttons labelled "Small", "Medium", "Large" — so the rendered sizes must
 * actually be small < medium < large. (Validating the demo claim, per the
 * test-schema-standard: ALL_ENUM permutations assert the rendered outcome.)
 */
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

test.describe('Button sizes — the demo labels must match reality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#buttons .wb-btn, #buttons button', { timeout: 25000 });
    await page.waitForTimeout(1500);
  });

  test('Small < Medium < Large in rendered size', async ({ page }) => {
    const sizes = await page.evaluate(() => {
      const byLabel = (label: string) => {
        const btn = [...document.querySelectorAll('#buttons button, #buttons .wb-btn')].find(
          (b) => (b.textContent || '').trim().toLowerCase() === label
        ) as HTMLElement | undefined;
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        const cs = getComputedStyle(btn);
        return { h: Math.round(r.height), w: Math.round(r.width), fontSize: parseFloat(cs.fontSize), padding: cs.padding };
      };
      return { small: byLabel('small'), medium: byLabel('medium'), large: byLabel('large') };
    });

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
    const r = await page.evaluate(() => {
      const get = (label: string) => {
        const btn = [...document.querySelectorAll('#buttons button, #buttons .wb-btn')].find(
          (b) => (b.textContent || '').trim().toLowerCase() === label
        ) as HTMLElement | undefined;
        return btn ? btn.className : null;
      };
      return { small: get('small'), large: get('large') };
    });
    // the small/large buttons must have a size modifier that the CSS actually styles
    expect(r.small, '"Small" button missing a size class').toMatch(/--(xs|sm)\b/);
    expect(r.large, '"Large" button missing a size class').toMatch(/--(lg|xl)\b/);
  });
});
