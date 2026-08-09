import { test, expect } from '@playwright/test';

/**
 * Text Overlap Detection — REGRESSION TEST
 *
 * Detects unintentional text overlap and overlapping elements.
 * Issue: Components page showing text layered over other text,
 * making content unreadable.
 */

test.describe('Text Overlap Detection', () => {
  test('components page has no text overlap', async ({ page }) => {
    await page.goto('/pages/components.html', { waitUntil: 'domcontentloaded' });

    // Get all text elements
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div:not(:has(*))').filter({
      has: page.locator(':visible')
    });

    const count = await textElements.count();
    expect(count, 'Page should have text elements').toBeGreaterThan(0);

    // For each text element, check that it's not overlapped by another
    const overlaps: string[] = [];

    for (let i = 0; i < Math.min(count, 20); i++) {
      const element = textElements.nth(i);
      const box = await element.boundingBox();
      const isVisible = await element.isVisible();

      if (!isVisible || !box) continue;

      // Check if this element's text is visible (not covered)
      const zIndex = await element.evaluate(el =>
        window.getComputedStyle(el).zIndex
      );

      // If element is positioned absolutely with high z-index over text, flag it
      const position = await element.evaluate(el =>
        window.getComputedStyle(el).position
      );

      if (position === 'absolute' && zIndex !== 'auto') {
        const text = await element.textContent();
        if (text && text.length > 5) {
          // Check if another element covers this area
          const elementAtPoint = await page.evaluate(({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            return el?.tagName;
          }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });

          if (elementAtPoint && elementAtPoint !== element.evaluate(el => el.tagName)) {
            overlaps.push(`Absolute positioned element at (${box.x}, ${box.y}) may overlap`);
          }
        }
      }
    }

    expect(overlaps.length, `Found ${overlaps.length} potential overlaps:\n${overlaps.join('\n')}`).toBe(0);
  });

  test('section headings and content have vertical spacing', async ({ page }) => {
    await page.goto('/pages/components.html', { waitUntil: 'domcontentloaded' });

    const headings = page.locator('h2, h3');
    const headingCount = await headings.count();

    expect(headingCount, 'Page should have section headings').toBeGreaterThan(0);

    // Check spacing between heading and following content
    for (let i = 0; i < Math.min(headingCount, 5); i++) {
      const heading = headings.nth(i);
      const headingBox = await heading.boundingBox();

      // Get next sibling or following element
      const nextElement = heading.locator('xpath=./following-sibling::*[1]');
      const nextBox = await nextElement.boundingBox();

      if (headingBox && nextBox) {
        const gap = nextBox.y - (headingBox.y + headingBox.height);
        expect(gap, `Spacing between heading and content should be > 0.5rem (8px), got ${gap}px`).toBeGreaterThan(8);
      }
    }
  });

  test('demo blocks have clear separation from each other', async ({ page }) => {
    await page.goto('/pages/components.html', { waitUntil: 'domcontentloaded' });

    const demos = page.locator('wb-demo');
    const demoCount = await demos.count();

    expect(demoCount, 'Page should have demo blocks').toBeGreaterThan(0);

    // Check vertical spacing between consecutive demos
    for (let i = 0; i < Math.min(demoCount - 1, 5); i++) {
      const demo1 = demos.nth(i);
      const demo2 = demos.nth(i + 1);

      const box1 = await demo1.boundingBox();
      const box2 = await demo2.boundingBox();

      if (box1 && box2) {
        const gap = box2.y - (box1.y + box1.height);
        expect(gap, `Gap between demos ${i} and ${i+1} should be > 0 (got ${gap}px)`).toBeGreaterThan(0);
      }
    }
  });
});
