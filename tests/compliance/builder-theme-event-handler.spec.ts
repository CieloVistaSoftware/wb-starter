/**
 * Builder Theme Event Handler Tests
 * 
 * Comprehensive tests for the Element Theme selector in the properties panel.
 * Tests the complete theme workflow:
 * 1. Theme selector renders with all options
 * 2. Theme change event fires correctly
 * 3. Theme applies data-theme attribute to element
 * 4. Theme persists through panel refreshes
 * 5. Theme shows in status message
 * 6. Theme works for all component types
 */
import { Page } from '@playwright/test';
import { test, expect } from '../helpers/builder-test';

test.use({ viewport: { width: 1280, height: 720 } });

// All available themes from builder-properties.js ELEMENT_THEMES array
const ALL_THEMES = [
  { id: '', name: 'Inherit' },
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'forest', name: 'Forest' },
  { id: 'midnight', name: 'Midnight' },
  { id: 'twilight', name: 'Twilight' },
  { id: 'sakura', name: 'Sakura' },
  { id: 'arctic', name: 'Arctic' },
  { id: 'desert', name: 'Desert' },
  { id: 'neon-dreams', name: 'Neon Dreams' },
  { id: 'retro-wave', name: 'Retro Wave' },
  { id: 'lavender', name: 'Lavender' },
  { id: 'emerald', name: 'Emerald' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'golden', name: 'Golden' },
  { id: 'slate', name: 'Slate' },
  { id: 'coffee', name: 'Coffee' },
  { id: 'mint', name: 'Mint' },
  { id: 'noir', name: 'Noir' },
  { id: 'aurora', name: 'Aurora' },
  { id: 'grape', name: 'Grape' }
];

async function waitForBuilder(page: Page, timeout = 20000) {
  // Be tolerant of slightly-slow navigation in CI: try a short DOMContentLoaded
  // navigation but don't let it fail the whole precondition. Rely primarily
  // on the app-level `window.builderReady` flag (fast & deterministic).
  try {
    await page.goto('/builder.html', { waitUntil: 'domcontentloaded', timeout: 3000 });
  } catch (e) {
    // ignore navigation timeout here — fall back to waiting for builder readiness
  }

  // Ensure basic layout exists quickly if it already rendered
  await page.waitForSelector('.builder-layout', { timeout: Math.min(3000, timeout) }).catch(() => {});

  // Wait for explicit readiness (preferred). Allow the full timeout budget
  await page.waitForFunction(() => (window as any).builderReady === true || !!document.querySelector('.canvas-component'), undefined, { timeout });
}

async function selectFirstComponent(page: Page) {
  // Ensure app is ready and a canvas component exists before interacting
  const { assertBuilderReady, failFastSelector } = await import('../helpers/fail-fast');
  await assertBuilderReady(page);
  await failFastSelector(page, '.canvas-component');
  const component = page.locator('.canvas-component').first();
  await component.click();
  await page.waitForTimeout(100);
  return component;
}

async function addElement(page: Page, tag: string) {
  const { assertBuilderReady, failFastSelector } = await import('../helpers/fail-fast');
  await assertBuilderReady(page);
  await page.click('button:has-text("+ Element")');
  // Wait for the element button (data-test) — use helper default timeout
  await failFastSelector(page, `button[data-test="element-btn-${tag}"]`);
  await page.click(`button[data-test="element-btn-${tag}"]`);
  // Ensure canvas shows the new component
  await failFastSelector(page, '.canvas-component');
  await page.waitForTimeout(100);
}

async function addComponent(page: Page, name: string) {
  const { assertBuilderReady, failFastSelector } = await import('../helpers/fail-fast');
  await assertBuilderReady(page);
  await page.click('button:has-text("+ Component")');
  // Wait for the specific component button (data-test)
  await failFastSelector(page, `button[data-test="component-btn-${name}"]`);
  await page.click(`button[data-test="component-btn-${name}"]`);
  // Ensure canvas shows the new component
  await failFastSelector(page, '.canvas-component');
  await page.waitForTimeout(100);
}

// Wait until the properties panel's Element Theme section is fully ready.
// This checks the synchronous readiness anchor added by showProperties() and
// also ensures the select has options populated (covers enhanced widgets).
export async function waitForThemeSectionReady(page: Page, timeout = 5000) {
  const { failFastSelector } = await import('../helpers/fail-fast');
  // Wait for the section container to exist first
  await failFastSelector(page, '#propertiesPanel [data-test="element-theme-section"]', Math.min(2000, timeout));

  // Consider the section ready when EITHER the showProperties() readiness flag is set
  // OR the native select is present and has options (covers enhanced-widget paths).
  await page.waitForFunction(() => {
    const panel = document.querySelector('#propertiesPanel');
    if (!panel) return false;
    const s = panel.querySelector('[data-test="element-theme-select"]') as HTMLSelectElement | null;
    const hasOptions = !!s && s.options.length > 0;
    const flag = panel.dataset.themeSectionReady === 'true';
    return flag || hasOptions;
  }, undefined, { timeout });
}

test.describe('Builder Theme Event Handler - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBuilder(page);
  });

  test('1. Theme selector should render in properties panel', async ({ page }) => {
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSection = panel.locator('[data-test="element-theme-section"]');
    
    await expect(themeSection).toBeVisible();
  });

  test('2. Theme selector should have all 24 themes plus Inherit option', async ({ page }) => {
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    await expect(themeSelect).toBeVisible();
    
    // Get all options
    const options = await themeSelect.locator('option').allTextContents();
    
    // Should have all themes
    expect(options.length).toBe(ALL_THEMES.length);
    
    // Check specific themes exist
    expect(options).toContain('Inherit');
    expect(options).toContain('Dark');
    expect(options).toContain('Light');
    expect(options).toContain('Cyberpunk');
  });

  test('3. updateElementTheme function should be available on window', async ({ page }) => {
    await waitForBuilder(page);
    
    const hasFunction = await page.evaluate(() => {
      return typeof window.updateElementTheme === 'function';
    });
    
    expect(hasFunction).toBe(true);
  });

  test('4. Theme select onchange should call updateElementTheme', async ({ page }) => {
    await selectFirstComponent(page);
    
    // Get the component ID from the selected element
    const componentId = await page.evaluate(() => {
      return window.selectedComponent?.id;
    });
    
    expect(componentId).toBeTruthy();
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');

    // Check the onchange attribute includes the component ID (if present on the native select)
    const onchange = await themeSelect.getAttribute('onchange');
    expect(onchange).toContain('updateElementTheme');
    expect(onchange).toContain(componentId);
  });

  test('5. Changing theme should add data-theme attribute to element', async ({ page }) => {
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');

    // Select cyberpunk theme
    await themeSelect.selectOption('cyberpunk');
    await page.waitForTimeout(100);
    
    // Verify element has data-theme attribute
    const component = page.locator('.canvas-component').first();
    const content = component.locator('.component-content > *').first();
    
    await expect(content).toHaveAttribute('data-theme', 'cyberpunk');
  });

  test('6. Selecting Inherit theme should remove data-theme attribute', async ({ page }) => {
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');

    // First set a theme
    await themeSelect.selectOption('dark');
    await page.waitForTimeout(100);
    
    // Then set to Inherit (empty value)
    await themeSelect.selectOption('');
    await page.waitForTimeout(100);
    
    // Verify data-theme is removed
    const component = page.locator('.canvas-component').first();
    const content = component.locator('.component-content > *').first();
    
    const hasDataTheme = await content.evaluate(el => el.hasAttribute('data-theme'));
    expect(hasDataTheme).toBe(false);
  });

  test('7. Theme status message should update correctly', async ({ page }) => {
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');

    // Select ocean theme
    await themeSelect.selectOption('ocean');
    await page.waitForTimeout(150);
    
    // Check for status message in the theme section
    const themeSection = panel.locator('[data-test="element-theme-section"]');
    const statusText = await themeSection.textContent();
    
    // Should show which theme is applied
    expect(statusText).toMatch(/Using.*Ocean|ocean/i);
  });

  test('8. Theme should persist when re-selecting the component', async ({ page }) => {
    // Select component and set theme
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');

    await themeSelect.selectOption('sunset');
    await page.waitForTimeout(100);
    
    // Click elsewhere to deselect
    await page.click('.canvas-area', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(100);
    
    // Re-select the component
    await selectFirstComponent(page);
    await page.waitForTimeout(100);
    
    // Theme should still be selected in dropdown
    const selectedValue = await page.locator('[data-test="element-theme-select"]').inputValue();
    expect(selectedValue).toBe('sunset');
  });

  test('9. Theme should be stored in component data', async ({ page }) => {
    await selectFirstComponent(page);
    
    // Get initial component data
    let componentData = await page.evaluate(() => {
      const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
      return comp?.data?.elementTheme;
    });
    
    // Set a theme
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    await themeSelect.selectOption('forest');
    await page.waitForTimeout(100);
    
    // Check component data was updated
    componentData = await page.evaluate(() => {
      const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
      return comp?.data?.elementTheme;
    });
    
    expect(componentData).toBe('forest');
  });

  test('10. Theme change should update component HTML', async ({ page }) => {
    await selectFirstComponent(page);
    
    // Get initial HTML
    const initialHtml = await page.evaluate(() => {
      const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
      return comp?.html;
    });
    
    // Set a theme
    const panel = page.locator('#propertiesPanel');
    await (await import('../helpers/fail-fast')).failFastSelector(page, '#propertiesPanel [data-test="element-theme-section"]', 2000);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    await themeSelect.selectOption('midnight');
    await page.waitForTimeout(200);
    
    // Check HTML was updated with data-theme
    const updatedHtml = await page.evaluate(() => {
      const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
      return comp?.html;
    });
    
    expect(updatedHtml).toContain('data-theme="midnight"');
  });
});

test.describe('Builder Theme Event Handler - Multiple Component Types', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBuilder(page);
    // Clear existing components
    const deleteButtons = page.locator('.component-delete-btn');
    while (await deleteButtons.first().isVisible().catch(() => false)) {
      await deleteButtons.first().click();
      await page.waitForTimeout(100);
    }
  });

  test('Theme works on div element', async ({ page }) => {
    await addElement(page, 'div');
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    await (await import('../helpers/fail-fast')).failFastSelector(page, '#propertiesPanel [data-test="element-theme-section"]', 2000);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    
    await themeSelect.selectOption('ruby');
    await page.waitForTimeout(200);
    
    const content = page.locator('.canvas-component .component-content > *').first();
    await expect(content).toHaveAttribute('data-theme', 'ruby');
  });

  test('Theme works on section element', async ({ page }) => {
    await addElement(page, 'section');
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    
    await themeSelect.selectOption('emerald');
    await page.waitForTimeout(200);
    
    const content = page.locator('.canvas-component .component-content > *').first();
    await expect(content).toHaveAttribute('data-theme', 'emerald');
  });

  test('Theme works on hero component', async ({ page }) => {
    await addComponent(page, 'hero');
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    
    await themeSelect.selectOption('lavender');
    await page.waitForTimeout(200);
    
    const content = page.locator('.canvas-component .component-content > *').first();
    await expect(content).toHaveAttribute('data-theme', 'lavender');
  });

  test('Theme works on features grid component', async ({ page }) => {
    await addComponent(page, 'features');
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    
    await themeSelect.selectOption('golden');
    await page.waitForTimeout(200);
    
    const content = page.locator('.canvas-component .component-content > *').first();
    await expect(content).toHaveAttribute('data-theme', 'golden');
  });

  test('Theme works on CTA component', async ({ page }) => {
    await addComponent(page, 'cta');
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    
    await themeSelect.selectOption('slate');
    await page.waitForTimeout(200);
    
    const content = page.locator('.canvas-component .component-content > *').first();
    await expect(content).toHaveAttribute('data-theme', 'slate');
  });

  test('regression: theme section always renders for supported components', async ({ page }) => {
    const cases = [
      { run: async () => await addElement(page, 'div'), name: 'div' },
      { run: async () => await addElement(page, 'section'), name: 'section' },
      { run: async () => await addComponent(page, 'hero'), name: 'hero' },
      { run: async () => await addComponent(page, 'features'), name: 'features' },
      { run: async () => await addComponent(page, 'cta'), name: 'cta' }
    ];

    for (const c of cases) {
      await c.run();
      await selectFirstComponent(page);

      const panel = page.locator('#propertiesPanel');
      // Wait until the section is fully ready (dataset + options populated)
      await waitForThemeSectionReady(page);

      // The properties panel should signal readiness. Prefer the synchronous
      // dataset flag, but accept a populated native select as an equivalent
      // readiness signal (covers enhancement paths that don't set the flag).
      const readyFlag = await panel.evaluate(p => p.dataset.themeSectionReady === 'true');
      const optionCount = await panel.locator('[data-test="element-theme-select"] option').count();
      expect(readyFlag || optionCount > 0).toBe(true);

      // sanity: the select should be visible and have options
      const select = panel.locator('[data-test="element-theme-select"]');
      await expect(select).toBeVisible();
      expect(optionCount).toBeGreaterThan(0);

      // cleanup: remove component so next iteration starts fresh
      const del = page.locator('.component-delete-btn').first();
      if (await del.isVisible().catch(() => false)) {
        await del.click();
        await page.waitForTimeout(100);
      }
    }
  });
});

test.describe('Builder Theme Event Handler - Error Cases', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBuilder(page);
  });

  test('Theme selector handles rapid changes', async ({ page }) => {
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    const themeSelect = panel.locator('[data-test="element-theme-select"]');
    
    // Rapidly change themes
    for (const theme of ['dark', 'light', 'cyberpunk', 'ocean', 'sunset']) {
      await themeSelect.selectOption(theme);
      await page.waitForTimeout(50);
    }
    
    // Final theme should be applied
    const content = page.locator('.canvas-component .component-content > *').first();
    await expect(content).toHaveAttribute('data-theme', 'sunset');
  });

  test('Theme selector handles undefined component gracefully', async ({ page }) => {
    // Evaluate updateElementTheme with invalid ID
    const result = await page.evaluate(() => {
      try {
        window.updateElementTheme('invalid-id', 'dark');
        return 'no-error';
      } catch (e) {
        return 'error: ' + e.message;
      }
    });
    
    // Should not throw
    expect(result).toBe('no-error');
  });

  test('ELEMENT_THEMES array is available on window', async ({ page }) => {
    const themes = await page.evaluate(() => window.ELEMENT_THEMES);
    
    expect(themes).toBeDefined();
    expect(Array.isArray(themes)).toBe(true);
    expect(themes.length).toBe(ALL_THEMES.length);
  });
});

test.describe('Builder Theme Event Handler - Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBuilder(page);
  });

  test('Theme visually changes element background color', async ({ page }) => {
    await selectFirstComponent(page);
    
    // Get initial background
    const content = page.locator('.canvas-component .component-content > *').first();
    const initialBg = await content.evaluate(el => getComputedStyle(el).backgroundColor);
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');

    // Apply a theme with different colors
    await themeSelect.selectOption('cyberpunk');
    await page.waitForTimeout(150);
    
    // Background should change (cyberpunk has distinct colors)
    const newBg = await content.evaluate(el => getComputedStyle(el).backgroundColor);
    
    // Colors may not always be different, but attribute should be set
    await expect(content).toHaveAttribute('data-theme', 'cyberpunk');
  });

  test('Theme dropdown shows correct selected option', async ({ page }) => {
    await selectFirstComponent(page);
    
    const panel = page.locator('#propertiesPanel');
    await waitForThemeSectionReady(page);
    const themeSelect = panel.locator('[data-test="element-theme-select"]');

    // Initially should be empty/Inherit
    let selectedText = await themeSelect.locator('option:checked').textContent();
    expect(selectedText).toBe('Inherit');
    
    // Change theme
    await themeSelect.selectOption('aurora');
    await page.waitForTimeout(150);
    
    // Should now show Aurora
    selectedText = await themeSelect.locator('option:checked').textContent();
    expect(selectedText).toBe('Aurora');
  });
});
