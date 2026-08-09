import { test, expect } from '@playwright/test';

/**
 * demos/wb-views-demo.html (#244): proper viewport, responsive at narrow
 * widths, and — found while investigating this issue — <wb-button
 * label="..."> is not a supported API (button.js only reads text content,
 * per its own header comment). Every <wb-button label="X"> on this page
 * rendered as an empty, invisible button. Fixed by switching to
 * <wb-button>X</wb-button>.
 */
test.describe('wb-views-demo.html responsive + button rendering (#244)', () => {
  test('no horizontal overflow at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/demos/wb-views-demo.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow, 'page should not scroll horizontally at 375px').toBe(false);
  });

  test('wb-button elements render their text, not empty', async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const buttons = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.example-render wb-button')).map((b) => ({
        text: (b.textContent || '').trim(),
        width: b.getBoundingClientRect().width,
      }))
    );
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b.text, 'wb-button should have visible text content').not.toBe('');
      expect(b.width, `"${b.text}" button should have real rendered width`).toBeGreaterThan(10);
    }
  });
});
