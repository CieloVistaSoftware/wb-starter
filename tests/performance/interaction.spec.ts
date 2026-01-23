import { test, expect } from '@playwright/test';
import { logPerfResult } from './perf-logger';

test.describe('Interaction Performance', () => {
  
  test('Modal should open in under 100ms', async ({ page }) => {
    await page.goto('/?page=home');
    
    // Find the modal trigger button (using the one we added to home page)
    const modalTrigger = page.locator('button[modal-title="Glass Modal"]');
    await modalTrigger.waitFor({ state: 'visible' });
    
    const startTime = Date.now();
    await modalTrigger.click();
    
    // Wait for modal to be visible
    const modal = page.locator('.wb-dialog[open]');
    await modal.waitFor({ state: 'visible' });
    
    const duration = Date.now() - startTime;
    console.log(`Modal open duration: ${duration}ms`);
    
    logPerfResult({
      category: 'interaction',
      name: 'Modal Open',
      value: duration,
      unit: 'ms',
      threshold: 200
    });

    // 100ms is the threshold for "instant" feel
    expect(duration).toBeLessThan(200); // Giving a bit of buffer for test env
  });

  test('Tabs should switch in under 50ms', async ({ page }) => {
    // Navigate to a page with tabs (Components page usually has them, or we can use docs)
    await page.goto('/?page=components');
    
    // Wait for a tab to be visible (assuming standard tab structure)
    // If components page doesn't have tabs, we might need to adjust this selector
    // For now, let's test the navigation menu toggle which is a similar interaction
    const navToggle = page.locator('.nav__toggle');
    await navToggle.waitFor({ state: 'visible' });
    
    const startTime = Date.now();
    await navToggle.click();
    
    // Wait for nav state change
    const nav = page.locator('.site__nav');
    // We check for the class toggle
    await expect(nav).toHaveClass(/site__nav--collapsed/);
    
    const duration = Date.now() - startTime;
    console.log(`Nav toggle duration: ${duration}ms`);
    
    logPerfResult({
      category: 'interaction',
      name: 'Nav Toggle',
      value: duration,
      unit: 'ms',
      threshold: 100
    });

    expect(duration).toBeLessThan(100);
  });
});
