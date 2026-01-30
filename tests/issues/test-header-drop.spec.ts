/**
 * Test: Investigate why drag-drop fails silently
 */
import { test, expect } from '@playwright/test';

test.describe('Header Drop Debug', () => {
  test('debug component item structure', async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Investigate component-item structure
    const compItemInfo = await page.evaluate(() => {
      const items = document.querySelectorAll('.component-item');
      return Array.from(items).slice(0, 3).map(el => ({
        className: el.className,
        draggable: el.draggable,
        dataC: el.getAttribute('data-c'),
        dataset: JSON.stringify(Object.fromEntries(Object.entries(el.dataset))),
        innerHTML: el.innerHTML.substring(0, 200)
      }));
    });

    console.log('Component items structure:');
    compItemInfo.forEach((item, i) => {
      console.log(`\nItem ${i}:`, JSON.stringify(item, null, 2));
    });

    // Check for comp-item (the expected class)
    const compItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.comp-item');
      return {
        count: items.length,
        first: items[0] ? {
          className: items[0].className,
          dataC: items[0].getAttribute('data-c'),
          draggable: items[0].draggable
        } : null
      };
    });

    console.log('\n.comp-item elements:', JSON.stringify(compItems, null, 2));

    // Check what draggable elements exist
    const draggables = await page.evaluate(() => {
      const items = document.querySelectorAll('[draggable="true"]');
      return Array.from(items).slice(0, 5).map(el => ({
        tag: el.tagName,
        className: el.className,
        hasDataC: !!el.getAttribute('data-c')
      }));
    });

    console.log('\nDraggable elements:', JSON.stringify(draggables, null, 2));

    // Check the template browser structure
    const templateBrowserInfo = await page.evaluate(() => {
      const tb = document.getElementById('templateBrowser') || document.querySelector('.template-browser');
      if (!tb) return { found: false };
      
      return {
        found: true,
        id: tb.id,
        className: tb.className,
        childrenCount: tb.children.length,
        firstFewChildren: Array.from(tb.children).slice(0, 3).map(c => ({
          tag: c.tagName,
          className: c.className,
          id: c.id
        }))
      };
    });

    console.log('\nTemplate browser:', JSON.stringify(templateBrowserInfo, null, 2));

    // Check if there's a different drag-drop mechanism
    const dragHandlers = await page.evaluate(() => {
      // Check for various drag/drop setups
      return {
        hasWindowAdd: typeof (window as any).add === 'function',
        hasWindowDrop: typeof (window as any).handleDrop === 'function',
        hasAddTemplate: typeof (window as any).addTemplate === 'function',
        hasAddToSection: typeof (window as any).addHTMLToSection === 'function',
        hasSetTargetSection: typeof (window as any).setTargetSection === 'function'
      };
    });

    console.log('\nAvailable functions:', JSON.stringify(dragHandlers, null, 2));

    expect(true).toBe(true);
  });

  test('try clicking component item instead of dragging', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click header section first
    const headerSelector = page.locator('#canvas-header .section-bar, [section="header"] .section-bar').first();
    if (await headerSelector.count() === 0) {
      test.skip('Header section not present on this page');
      return;
    }
    await expect(headerSelector).toBeVisible({ timeout: 5000 });
    await headerSelector.click();
    await page.waitForTimeout(500);

    // Try clicking the Navigation Bar component
    const navBar = page.locator('.component-item:has-text("Navigation Bar")').first();
    
    if (await navBar.count() > 0) {
      console.log('Clicking Navigation Bar component...');
      await navBar.click();
      await page.waitForTimeout(1500);

      // Check what happened
      const headerContent = await page.evaluate(() => {
        const zone = document.querySelector('[drop-zone="header"]');
        if (!zone) return { droppedCount: 0 };
        return {
          droppedCount: zone.querySelectorAll('.dropped').length,
          innerHTML: zone.innerHTML.substring(0, 300)
        };
      });

      console.log('After click - header content:', JSON.stringify(headerContent, null, 2));

      // Check for toasts
      const toasts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.toast, [class*="toast"]')).map(el => el.textContent);
      });
      console.log('Toasts:', toasts);

      // Print relevant console logs
      const relevant = consoleMessages.filter(m => 
        m.includes('add') || m.includes('drop') || m.includes('click') || 
        m.includes('section') || m.includes('component') || m.includes('template')
      );
      console.log('Relevant logs:', relevant.slice(-10));
    }

    expect(true).toBe(true);
  });
});
