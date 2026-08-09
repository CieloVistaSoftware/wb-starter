import { test, expect } from '@playwright/test';

/**
 * Code Panel Sizing — REGRESSION TEST
 *
 * Ensures code panels don't consume excessive viewport width.
 * Issue: Code panels stretching to 45%+ viewport width when they
 * should be constrained proportionally to demo size.
 */

test.describe('Code Panel Sizing', () => {
  test('code panels in demos do not exceed reasonable width', async ({ page }) => {
    await page.goto('/pages/components.html', { waitUntil: 'domcontentloaded' });

    const codePanels = page.locator('.wb-demo__code, .x-pre-wrapper');
    const panelCount = await codePanels.count();

    expect(panelCount, 'Page should have code panels').toBeGreaterThan(0);

    const viewportWidth = page.viewportSize()?.width || 1280;
    const violations: string[] = [];

    for (let i = 0; i < Math.min(panelCount, 10); i++) {
      const panel = codePanels.nth(i);
      const isVisible = await panel.isVisible();

      if (!isVisible) continue;

      const box = await panel.boundingBox();
      if (!box) continue;

      // Code panels should not be more than ~60% of viewport (allowing for scrollbar)
      const panelPercent = (box.width / viewportWidth) * 100;

      expect(panelPercent, `Code panel ${i} is ${panelPercent.toFixed(1)}% of viewport, should be < 70%`).toBeLessThan(70);

      // Code panels in single-column demos should be even more constrained
      const parent = panel.locator('xpath=ancestor::wb-demo[1]');
      const parentIsVisible = await parent.isVisible();

      if (parentIsVisible) {
        const parentBox = await parent.boundingBox();
        if (parentBox && parentBox.width < viewportWidth * 0.5) {
          // If parent demo is narrow, code panel should not exceed parent width
          expect(box.width, `Code panel in narrow demo exceeds parent width`).toBeLessThanOrEqual(parentBox.width + 2);
        }
      }
    }
  });

  test('demo blocks have proportional code/content split', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });

    const demos = page.locator('wb-demo');
    const demoCount = await demos.count();

    expect(demoCount, 'Page should have demos').toBeGreaterThan(0);

    for (let i = 0; i < Math.min(demoCount, 5); i++) {
      const demo = demos.nth(i);
      const demoBox = await demo.boundingBox();

      if (!demoBox) continue;

      const grid = demo.locator('.wb-demo__grid');
      const code = demo.locator('.wb-demo__code');

      const gridVisible = await grid.isVisible();
      const codeVisible = await code.isVisible();

      // If both are visible, ensure neither dominates excessively
      if (gridVisible && codeVisible) {
        const gridBox = await grid.boundingBox();
        const codeBox = await code.boundingBox();

        if (gridBox && codeBox) {
          const gridPercent = (gridBox.width / demoBox.width) * 100;
          const codePercent = (codeBox.width / demoBox.width) * 100;

          // Neither should be more than 80% of demo width
          expect(gridPercent, `Grid in demo ${i} is ${gridPercent.toFixed(1)}%, should be < 80%`).toBeLessThan(80);
          expect(codePercent, `Code in demo ${i} is ${codePercent.toFixed(1)}%, should be < 80%`).toBeLessThan(80);
        }
      }
    }
  });
});
