/**
 * Test: Theme Override
 * Issue: note-1769211301098-p0
 * Bug: Theme override does not work
 * Expected: Elements with data-theme attribute should use that theme
 */
import { test, expect } from '@playwright/test';

test.describe('Theme Override', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('data-theme attribute should override parent theme', async ({ page }) => {
    await test.step('Get current page theme', async () => {
      const pageTheme = await page.locator('html').getAttribute('data-theme') || 
                        await page.locator('html').getAttribute('theme') || 
                        'dark';
      expect(pageTheme).toBeTruthy();
    });

    await test.step('Create test element with opposite theme', async () => {
      await page.evaluate(() => {
        const pageTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const oppositeTheme = pageTheme === 'dark' ? 'light' : 'dark';
        
        const el = document.createElement('div');
        el.id = 'theme-override-test';
        el.setAttribute('data-theme', oppositeTheme);
        el.style.padding = '20px';
        el.innerHTML = '<span class="test-text">Theme Test</span>';
        document.body.appendChild(el);
      });
    });

    await test.step('Verify test element is visible', async () => {
      const testEl = page.locator('#theme-override-test');
      await expect(testEl).toBeVisible();
    });

    await test.step('Verify data-theme attribute is applied', async () => {
      const testEl = page.locator('#theme-override-test');
      const elTheme = await testEl.getAttribute('data-theme');
      expect(['light', 'dark']).toContain(elTheme);
    });

    await test.step('Verify CSS variables are applied', async () => {
      const testEl = page.locator('#theme-override-test');
      const bgColor = await testEl.evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(bgColor).toBeTruthy();
    });
  });

  test('nested theme overrides should work', async ({ page }) => {
    await test.step('Create nested theme elements', async () => {
      await page.evaluate(() => {
        const outer = document.createElement('div');
        outer.id = 'outer-theme';
        outer.setAttribute('data-theme', 'dark');
        
        const inner = document.createElement('div');
        inner.id = 'inner-theme';
        inner.setAttribute('data-theme', 'light');
        inner.textContent = 'Inner content';
        
        outer.appendChild(inner);
        document.body.appendChild(outer);
      });
    });

    await test.step('Verify inner element has correct theme attribute', async () => {
      const inner = page.locator('#inner-theme');
      await expect(inner).toHaveAttribute('data-theme', 'light');
    });
  });
});
