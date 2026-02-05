import { test, expect } from '@playwright/test';

test.describe('layout: global margins', () => {
  test('common block elements compute 1rem margin', async ({ page }) => {
    await page.goto('/demos/wb-page-demo.html');
    await page.waitForLoadState('domcontentloaded');

    const samples = [
      { sel: '.site__main h1', axis: 'block' },
      { sel: '.site__main p', axis: 'block' },
      { sel: '.site__main main', axis: 'block' },
      { sel: 'header.site__header', axis: 'full-bleed' },
      { sel: 'footer.site__footer', axis: 'full-bleed' }
    ];

    for (const s of samples) {
      const exists = await page.locator(s.sel).count();
      expect(exists).toBeGreaterThan(0);
      const marginTop = await page.$eval(s.sel, el => getComputedStyle(el).marginTop);
      const marginRight = await page.$eval(s.sel, el => getComputedStyle(el).marginRight);
      const marginBottom = await page.$eval(s.sel, el => getComputedStyle(el).marginBottom);
      const marginLeft = await page.$eval(s.sel, el => getComputedStyle(el).marginLeft);

      // convert to rems using the root font-size (assumes 16px default)
      const toRem = v => parseFloat(v.replace('px','')) / 16;

      if (s.axis === 'block') {
        expect(toRem(marginTop)).toBeCloseTo(1, 1);
        expect(toRem(marginBottom)).toBeCloseTo(1, 1);
      } else {
        // full-bleed: horizontal margins should be zero so element spans edge-to-edge
        expect(toRem(marginLeft)).toBeCloseTo(0, 1);
        expect(toRem(marginRight)).toBeCloseTo(0, 1);
      }
    }
  });

  test('components can opt-out with .no-global-margin', async ({ page }) => {
    await page.goto('/demos/wb-page-demo.html');
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'no-global-margin test-opt-out';
      el.style.margin = '0px';
      el.textContent = 'opt-out';
      document.body.appendChild(el);
    });
    const mt = await page.$eval('.test-opt-out', el => getComputedStyle(el).marginTop);
    expect(mt).toBe('0px');
  });
});