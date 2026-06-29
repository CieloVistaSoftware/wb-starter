/**
 * #181 — the behaviors-page section nav links must (a) read as distinct pills
 * (not crowded text) and (b) jump to their section with the heading clear of the
 * 64px sticky header (previously they landed hidden behind it, appearing dead).
 *
 * Fix: .nav-links pills get a background/border; section[id] gets scroll-margin-top.
 */
import { test, expect } from '@playwright/test';

const SECTION_IDS = ['buttons', 'inputs', 'selection', 'feedback', 'overlays', 'navigation', 'data', 'media', 'effects', 'utilities'];

test.describe('#181 — section nav links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('.nav-links', { timeout: 20000 });
    await page.waitForTimeout(2500);
  });

  test('every section link resolves to an existing target', async ({ page }) => {
    const dead = await page.evaluate((ids) => {
      const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
      return links
        .map((a) => a.getAttribute('href') || '')
        .filter((h) => h.length > 1 && !document.querySelector(h));
    }, SECTION_IDS);
    expect(dead, `nav links point to missing anchors: ${dead.join(', ')}`).toEqual([]);
  });

  test('nav pills are visible chips (have a background, not crowded text)', async ({ page }) => {
    const bg = await page.evaluate(() => {
      const a = document.querySelector('.nav-links a') as HTMLElement;
      return a ? getComputedStyle(a).backgroundColor : 'NONE';
    });
    expect(bg).not.toBe('NONE');
    expect(bg, 'nav pill has no background (reads as crowded text)').not.toBe('rgba(0, 0, 0, 0)');
  });

  test('sections have scroll-margin to clear the sticky header', async ({ page }) => {
    const margins = await page.evaluate((ids) =>
      ids.map((id) => {
        const el = document.getElementById(id);
        return { id, sm: el ? parseFloat(getComputedStyle(el).scrollMarginTop) : -1 };
      }),
      SECTION_IDS
    );
    for (const { id, sm } of margins) {
      expect(sm, `#${id} has no scroll-margin-top (heading would hide under header)`).toBeGreaterThanOrEqual(64);
    }
  });

  test('clicking a section link scrolls it into view below the header', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    await page.click('.nav-links a[href="#data"]');
    await page.waitForTimeout(1500); // allow smooth scroll over a long distance to settle
    const top = await page.evaluate(() => Math.round(document.getElementById('data')!.getBoundingClientRect().top));
    // landed near the top, but clear of the 64px header (scroll-margin-top: 80)
    expect(top, `#data landed at ${top}px (expected ~80, below the 64px header)`).toBeGreaterThanOrEqual(40);
    expect(top, `#data did not scroll into view (top=${top})`).toBeLessThanOrEqual(120);
  });
});
