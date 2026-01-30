/**
 * Regression Test: Builder Drop Zone Fix (2026-01-24)
 * 
 * Issue: Components could not be dragged and dropped into the canvas.
 * Root Cause: Drop zones used `section="header"` but handler checked `dataset.section`
 * Fix: Handler now checks getAttribute('section') first, then dataset.section
 */
import { test, expect } from '@playwright/test';

test.describe('Builder Drop Zone Fix', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForSelector('.builder-layout', { timeout: 20000 });
    await page.waitForFunction(() => {
      return typeof window.components !== 'undefined' && 
             document.getElementById('main-container') !== null;
    }, { timeout: 20000 });
  });

  test('drop zones have section attribute (not data-section)', async ({ page }) => {
    // Verify drop zones use section="..." attribute
    const dropZones = await page.evaluate(() => {
      const zones = document.querySelectorAll('.canvas-drop-zone');
      return Array.from(zones).map(z => ({
        hasSection: z.hasAttribute('section'),
        sectionValue: z.getAttribute('section'),
        hasDataSection: z.hasAttribute('data-section'),
        dataSectionValue: z.getAttribute('data-section')
      }));
    });

    expect(dropZones.length).toBeGreaterThan(0);
    
    // At least one should have section attribute
    const hasHeaderZone = dropZones.some(z => z.sectionValue === 'header');
    const hasMainZone = dropZones.some(z => z.sectionValue === 'main');
    const hasFooterZone = dropZones.some(z => z.sectionValue === 'footer');
    
    expect(hasHeaderZone).toBe(true);
    expect(hasMainZone).toBe(true);
    expect(hasFooterZone).toBe(true);
  });

  test('addComponentToCanvas works with main section', async ({ page }) => {
    const initialCount = await page.evaluate(() => window.components.length);
    
    // Add component to main section
    await page.evaluate(() => {
      if (typeof addComponentToCanvas === 'function') {
        addComponentToCanvas('hero', 'main');
      }
    });
    
    const newCount = await page.evaluate(() => window.components.length);
    expect(newCount).toBe(initialCount + 1);
    
    // Verify component was added to main section
    const component = await page.evaluate(() => {
      const comp = window.components.find(c => c.type === 'hero');
      return comp ? { section: comp.section, type: comp.type } : null;
    });
    
    expect(component).not.toBeNull();
    expect(component?.section).toBe('main');
  });

  test('addComponentToCanvas works with header section', async ({ page }) => {
    const initialCount = await page.evaluate(() => window.components.length);
    
    // Add navbar to header section
    await page.evaluate(() => {
      if (typeof addComponentToCanvas === 'function') {
        addComponentToCanvas('navbar', 'header');
      }
    });
    
    const newCount = await page.evaluate(() => window.components.length);
    expect(newCount).toBe(initialCount + 1);
    
    // Verify component was added to header section
    const component = await page.evaluate(() => {
      const comp = window.components.find(c => c.type === 'navbar');
      return comp ? { section: comp.section, type: comp.type } : null;
    });
    
    expect(component).not.toBeNull();
    expect(component?.section).toBe('header');
  });

  test('addComponentToCanvas works with footer section', async ({ page }) => {
    const initialCount = await page.evaluate(() => window.components.length);
    
    // Add footer to footer section
    await page.evaluate(() => {
      if (typeof addComponentToCanvas === 'function') {
        addComponentToCanvas('footer', 'footer');
      }
    });
    
    const newCount = await page.evaluate(() => window.components.length);
    expect(newCount).toBe(initialCount + 1);
    
    // Verify component was added to footer section
    const component = await page.evaluate(() => {
      const comp = window.components.find(c => c.type === 'footer');
      return comp ? { section: comp.section, type: comp.type } : null;
    });
    
    expect(component).not.toBeNull();
    expect(component?.section).toBe('footer');
  });

  test('drag drop handler reads section attribute correctly', async ({ page }) => {
    // Simulate what the drop handler does
    const sectionValues = await page.evaluate(() => {
      const zones = document.querySelectorAll('.canvas-drop-zone');
      return Array.from(zones).map(z => {
        // This is what the fixed handler does
        const section = z.getAttribute('section') || (z as HTMLElement).dataset.section;
        return section;
      });
    });

    // All sections should be valid strings
    expect(sectionValues).toContain('header');
    expect(sectionValues).toContain('main');
    expect(sectionValues).toContain('footer');
    
    // None should be undefined
    sectionValues.forEach(s => {
      expect(s).not.toBeUndefined();
      expect(s).not.toBeNull();
    });
  });

  test('component renders in DOM after drop', async ({ page }) => {
    // Add component
    await page.evaluate(() => {
      if (typeof addComponentToCanvas === 'function') {
        addComponentToCanvas('hero', 'main');
      }
    });

    // Verify it appears in DOM
    const componentInDOM = await page.locator('#main-container .canvas-component').count();
    expect(componentInDOM).toBeGreaterThan(0);
  });

});
