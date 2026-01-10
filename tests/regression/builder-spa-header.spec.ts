
import { test, expect } from '@playwright/test';

test.describe('Builder SPA Header Constraints', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the builder
    // Assuming the dev server serves from the root
    await page.goto('/public/builder.html');
    
    // Wait for builder initialization
    await page.waitForSelector('#builder-root', { timeout: 10000 });
  });

  test('SPA header fits within the page width', async ({ page }) => {
    // 1. Insert SPA Header using the global function exposed in builder.html
    // We use evaluate because we need to trigger the internal logic of the builder
    await page.evaluate(async () => {
      // Mock the fetch if necessary, or assume it works. 
      // Given it's an integration test, we prefer it to actually fetch if possible.
      // But we can also fallback to directly invoking the logic if we know the ID.
      if (window.selectTemplate) {
        await window.selectTemplate('spa-header');
      }
    });

    // 2. Wait for the element to appear in the canvas
    // The "Dropped" wrapper contains the inserted HTML.
    // The SPA Header has "Brand", "Home", "About" links.
    const spaHeader = page.locator('.dropped').filter({ hasText: 'Brand' }).filter({ hasText: 'Home' }).first();
    await expect(spaHeader).toBeVisible({ timeout: 5000 });

    // 3. Get container dimensions (The canvas viewport)
    // The canvas is constrained by .canvas-section or #canvas
    const canvasSection = page.locator('#canvas-header .section-content');
    const sectionBox = await canvasSection.boundingBox();
    expect(sectionBox).toBeTruthy();

    if (!sectionBox) return; // TS guard

    // 4. Get the SPA Header dimensions
    // We check the first child of the dropped element, or the dropped element itself 
    // depending on how styles are applied. The dropped wrapper has the constraints.
    const headerBox = await spaHeader.boundingBox();
    expect(headerBox).toBeTruthy();
    
    if (!headerBox) return; // TS guard

    // 5. Assertions
    // "Content cannot extend beyond the page width"
    // We check if the header width is less than or equal to section width (+ small tolerance for pixels)
    expect(headerBox.width).toBeLessThanOrEqual(sectionBox.width + 1);
    
    // Check if it's strictly inside the left/right bounds (in case of negative margins)
    expect(headerBox.x).toBeGreaterThanOrEqual(sectionBox.x - 1);
    expect(headerBox.x + headerBox.width).toBeLessThanOrEqual(sectionBox.x + sectionBox.width + 1);

    // "Height" - usually headers flow vertically, but users shouldn't have elements poking out bounds
    // The section content has overflow: hidden now, so visually it should be cut off.
    // However, the test asks to make sure "all that is there fits inside".
    // If the content is larger, overflow hidden "fixes" the visual issue, but the element itself might still be huge.
    // The user requirement "cannot extend beyond" logic handled by overflow: hidden is one way.
    // Let's also verify scrollWidth vs clientWidth to ensure no overflow is happening internally?
    
    const overflowState = await canvasSection.evaluate((el) => {
      return {
        isScrollable: el.scrollWidth > el.clientWidth,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      };
    });
    
    // If scrollWidth > clientWidth, something is overflowing (even if hidden)
    expect(overflowState.scrollWidth).toBeLessThanOrEqual(overflowState.clientWidth + 1);

  });

});
