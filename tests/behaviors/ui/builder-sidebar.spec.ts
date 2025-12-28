import { test, expect } from '@playwright/test';

test.describe('Builder Sidebar Drawer', () => {
  test('should collapse to exactly 1.5rem width', async ({ page }) => {
    // Load the builder page
    await page.goto('/builder.html');

    // Locate the sidebar
    const sidebar = page.locator('#sidebar');
    const toggleBtn = page.locator('#sidebarToggle');

    // Initial state: Sidebar should be expanded (width > 1.5rem)
    // Default width is 280px
    const initialBox = await sidebar.boundingBox();
    expect(initialBox).not.toBeNull();
    if (initialBox) {
        expect(initialBox.width).toBeGreaterThan(30); // 1.5rem is approx 24px
    }

    // Click toggle button to collapse
    await toggleBtn.click();

    // Wait for transition (CSS transition is 0.3s)
    await page.waitForTimeout(500);

    // Check if class 'collapsed' is added
    await expect(sidebar).toHaveClass(/collapsed/);

    // Verify width is exactly 1.5rem (24px)
    // We check computed style width
    const collapsedWidth = await sidebar.evaluate((el) => {
        return getComputedStyle(el).width;
    });

    // 1.5rem * 16px/rem = 24px. Allow small float variance.
    expect(collapsedWidth).toBe('24px');

    // Verify overflow is hidden
    const overflow = await sidebar.evaluate((el) => {
        return getComputedStyle(el).overflow;
    });
    expect(overflow).toBe('hidden');

    // Click toggle button to expand
    await toggleBtn.click();
    await page.waitForTimeout(500);

    // Verify expanded state
    await expect(sidebar).not.toHaveClass(/collapsed/);
    const expandedWidth = await sidebar.evaluate((el) => {
        return getComputedStyle(el).width;
    });
    expect(expandedWidth).not.toBe('24px');
    expect(parseInt(expandedWidth)).toBeGreaterThan(200);
  });

  test('Right panel should also collapse to 1.5rem', async ({ page }) => {
    await page.goto('/builder.html');

    const panel = page.locator('#panelRight');
    const toggleBtn = page.locator('#panelToggle');

    // Initial state
    const initialBox = await panel.boundingBox();
    expect(initialBox).not.toBeNull();
    if (initialBox) {
        expect(initialBox.width).toBeGreaterThan(30);
    }

    // Collapse
    await toggleBtn.click();
    await page.waitForTimeout(500);

    await expect(panel).toHaveClass(/collapsed/);

    const collapsedWidth = await panel.evaluate((el) => {
        return getComputedStyle(el).width;
    });
    expect(collapsedWidth).toBe('24px');

    // Expand
    await toggleBtn.click();
    await page.waitForTimeout(500);
    await expect(panel).not.toHaveClass(/collapsed/);
  });
});
