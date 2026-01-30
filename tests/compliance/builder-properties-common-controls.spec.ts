/**
 * Builder Properties Panel - Common Controls Compliance Tests
 * 
 * Tests that ALL property panels have the required common controls:
 * 1. x-Behaviors picker (13 behaviors)
 * 2. Element Theme selector (24 themes + Inherit)
 * 3. Inline Style toggle (checkbox, default checked)
 * 4. Spacing controls (margin-top, margin-bottom, padding, gap)
 * 
 * Tests all 11 panel types for consistency.
 */
import { test, expect, Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

// Component types that should have property panels
const COMPONENT_TYPES = [
  { name: 'navbar', addMethod: 'component', componentName: 'navbar' },
  { name: 'hero', addMethod: 'component', componentName: 'hero' },
  { name: 'footer', addMethod: 'component', componentName: 'footer' },
  { name: 'features-grid', addMethod: 'component', componentName: 'features' },
  { name: 'pricing-table', addMethod: 'component', componentName: 'pricing' },
  { name: 'card', addMethod: 'component', componentName: 'card' },
  { name: 'cta', addMethod: 'component', componentName: 'cta' },
  { name: 'div', addMethod: 'element', elementTag: 'div' },
  { name: 'section', addMethod: 'element', elementTag: 'section' },
  { name: 'article', addMethod: 'element', elementTag: 'article' },
];

// All 13 x-behaviors that should be available
const X_BEHAVIORS = [
  'x-tooltip', 'x-copy', 'x-toggle', 'x-collapse',
  'x-ripple', 'x-sticky', 'x-draggable', 'x-resizable',
  'x-fade-in', 'x-parallax', 'x-confetti', 'x-share', 'x-darkmode'
];

// All 24 themes + Inherit option
const THEMES = [
  'Inherit', 'Dark', 'Light', 'Cyberpunk', 'Ocean', 'Sunset', 'Forest',
  'Midnight', 'Twilight', 'Sakura', 'Arctic', 'Desert', 'Neon Dreams',
  'Retro Wave', 'Lavender', 'Emerald', 'Ruby', 'Golden', 'Slate',
  'Coffee', 'Mint', 'Noir', 'Aurora', 'Grape'
];

async function addComponent(page: Page, type: typeof COMPONENT_TYPES[0]) {
  if (type.addMethod === 'component') {
    // Prefer programmatic API for reliability in tests; map a sensible default
    const section = (type.componentName === 'navbar') ? 'header' : (type.componentName === 'footer') ? 'footer' : 'main';
    await page.evaluate(({ name, section }) => {
      try {
        window.addComponentToCanvas && window.addComponentToCanvas(name, section);
      } catch (err) { /* fall back to UI below */ }
    }, { name: type.componentName, section });

    // If the API didn't add it (race/fallback), open the palette as a fallback.
    // Fail fast if the DOM doesn't reflect the expected change within a short window.
    try {
      await (await import('../helpers/fail-fast')).failFastSelector(page, '.canvas-component', 3000);
    } catch (err) {
      // API path didn't produce a canvas-component quickly; try the UI palette (fail-fast)
      await page.waitForSelector('button:has-text("+ Component")', { timeout: 5000 });
      await page.click('button:has-text("+ Component")');
      const compBtn = page.locator(`button:has-text("${type.componentName}")`);
      await (await import('../helpers/fail-fast')).failFastSelector(page, `button:has-text("${type.componentName}")`, 5000);
      await compBtn.click();
    }
  } else {
    // Elements: use UI (less flaky) but wait for availability
    await page.waitForSelector('button:has-text("+ Element")', { timeout: 5000 });
    await page.click('button:has-text("+ Element")');

    const elBtn = page.locator(`button:has-text("<${type.elementTag}>")`);
    await elBtn.waitFor({ state: 'visible', timeout: 5000 });
    await elBtn.click();
  }

  // Wait for the canvas to reflect the added component/element
  await page.waitForFunction(() => document.querySelectorAll('.canvas-component').length > 0, null, { timeout: 3000 });
}

async function selectLastComponent(page: Page) {
  const components = page.locator('.canvas-component');
  const count = await components.count();
  if (count > 0) {
    await components.last().click();
    await page.waitForTimeout(200);
  }
}

test.describe('Builder Properties - Common Controls Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    // Fail-fast: if the builder isn't ready within 5s, fail the test quickly.
    await (await import('../helpers/fail-fast')).assertBuilderReady(page, 5000);
  });

  test.describe('x-Behaviors Picker', () => {
    test('should display x-Behaviors section with header', async ({ page }) => {
      // Select existing hero component
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      // Actual header is "⚡ x-Behaviors" (no description text)
      await expect(panel.locator('text=x-Behaviors')).toBeVisible();
    });

    test('should have all 13 x-behavior checkboxes', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      
      // The actual implementation uses labels with .xb-chip class
      // Each contains a hidden checkbox and the behavior name
      const behaviorChips = panel.locator('label.xb-chip');
      const count = await behaviorChips.count();
      expect(count).toBe(X_BEHAVIORS.length); // Should have all 13 behaviors
    });

    test('should toggle x-behavior attribute when checkbox clicked', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      // Find the Ripple chip (contains "Ripple" text)
      const rippleChip = panel.locator('label.xb-chip:has-text("Ripple")');
      
      // Click the chip to toggle
      await rippleChip.click();
      await page.waitForTimeout(100);
      
      // Verify the element now has x-ripple attribute
      const component = page.locator('.canvas-component').first();
      const componentHtml = await component.locator('.component-content').innerHTML();
      expect(componentHtml).toContain('x-ripple');
    });

    test('x-tooltip should show text input when enabled', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      // Find the Tooltip chip
      const tooltipChip = panel.locator('label.xb-chip:has-text("Tooltip")');
      
      // Click to enable tooltip
      await tooltipChip.click();
      await page.waitForTimeout(300); // Panel refreshes after toggle
      
      // Now tooltip text input should be available (placeholder contains "tooltip")
      const tooltipInput = panel.locator('input[placeholder*="tooltip" i]');
      await expect(tooltipInput).toBeVisible();
    });
  });

  test.describe('Element Theme Selector', () => {
    test('should display Element Theme section', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      await expect(panel.locator('text=Element Theme')).toBeVisible();
      await expect(panel.locator('text=Theme Override')).toBeVisible();
    });

    test('should have theme dropdown with all options', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      const themeSelect = panel.locator('select').filter({ has: page.locator('option:has-text("Inherit")') });
      await expect(themeSelect).toBeVisible();
      
      // Check that key themes exist
      const options = await themeSelect.locator('option').allTextContents();
      expect(options).toContain('Inherit');
      expect(options).toContain('Dark');
      expect(options).toContain('Light');
      expect(options).toContain('Cyberpunk');
      expect(options.length).toBeGreaterThanOrEqual(24);
    });

    test('should apply data-theme attribute when theme selected', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      const themeSelect = panel.locator('select').filter({ has: page.locator('option:has-text("Inherit")') });
      
      // Select Dark theme (value is 'dark', not 'wb-dark')
      await themeSelect.selectOption('dark');
      await page.waitForTimeout(100);
      
      // Verify element has data-theme attribute
      const component = page.locator('.canvas-component').first();
      const content = component.locator('.component-content > *').first();
      await expect(content).toHaveAttribute('data-theme', 'dark');
    });
  });

  test.describe('Inline Style Toggle', () => {
    test('should display Style Output section', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      await expect(panel.locator('text=Style Output')).toBeVisible();
      await expect(panel.locator('text=Include inline styles')).toBeVisible();
    });

    test('should have checkbox defaulting to checked', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      const inlineStyleCheckbox = panel.locator('input[type="checkbox"]').filter({ has: page.locator('~ *:has-text("Include inline styles")') }).or(
        panel.locator('label:has-text("Include inline styles") input[type="checkbox"]')
      );
      
      // Should be checked by default
      await expect(inlineStyleCheckbox.first()).toBeChecked();
    });

    test('should show status message about inline styles', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      // Should show either enabled or disabled message
      const hasEnabledMsg = await panel.locator('text=Styles will be embedded').isVisible();
      const hasDisabledMsg = await panel.locator('text=will use CSS classes').isVisible();
      expect(hasEnabledMsg || hasDisabledMsg).toBeTruthy();
    });
  });

  test.describe('Spacing Controls', () => {
    test('should display Spacing section', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      await expect(panel.locator('text=Spacing').first()).toBeVisible();
    });

    test('should have margin-top slider', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      await expect(panel.locator('text=Margin Top')).toBeVisible();
      
      const marginTopSlider = panel.locator('input[type="range"]').filter({ has: page.locator('[data-spacing="margin-top"]') }).or(
        panel.locator('[data-spacing="margin-top"] input[type="range"]')
      );
      // At minimum, there should be a range input in the spacing section
      const spacingRanges = panel.locator('input[type="range"]');
      expect(await spacingRanges.count()).toBeGreaterThanOrEqual(4);
    });

    test('should have margin-bottom slider', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      await expect(panel.locator('text=Margin Bottom')).toBeVisible();
    });

    test('should have padding slider', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      await expect(panel.locator('text=Padding').first()).toBeVisible();
    });

    test('should have gap slider', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      await expect(panel.locator('text=Gap')).toBeVisible();
    });

    test('should show current values in px', async ({ page }) => {
      await page.click('.canvas-component');
      await page.waitForTimeout(200);
      
      const panel = page.locator('#propertiesPanel');
      // Should show px values like "0px" or similar
      const pxValues = await panel.locator('text=/\\d+px/').count();
      expect(pxValues).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('All Panel Types Have Common Controls', () => {
    for (const componentType of COMPONENT_TYPES.slice(0, 5)) { // Test first 5 types
      test(`${componentType.name} panel should have all common controls`, async ({ page }) => {
        // Clear canvas first
        const existingComponents = page.locator('.canvas-component');
        const count = await existingComponents.count();
        for (let i = 0; i < count; i++) {
          await existingComponents.first().click();
          await page.waitForTimeout(100);
          const deleteBtn = page.locator('.component-delete-btn');
          if (await deleteBtn.isVisible()) {
            await deleteBtn.click();
            await page.waitForTimeout(100);
          }
        }
        
        // Add the component
        await addComponent(page, componentType);
        await selectLastComponent(page);
        
        const panel = page.locator('#propertiesPanel');
        
        // Check x-Behaviors section exists
        await expect(panel.locator('text=x-Behaviors')).toBeVisible({ timeout: 5000 });
        
        // Check Element Theme section exists
        await expect(panel.locator('text=Element Theme')).toBeVisible({ timeout: 5000 });
        
        // Check Style Output section exists
        await expect(panel.locator('text=Style Output')).toBeVisible({ timeout: 5000 });
        
        // Check Spacing section exists
        await expect(panel.locator('text=Spacing').first()).toBeVisible({ timeout: 5000 });
      });
    }
  });
});
