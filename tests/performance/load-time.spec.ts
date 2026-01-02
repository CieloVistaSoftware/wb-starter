import { test, expect } from '@playwright/test';
import { logPerfResult } from './perf-logger';

test.describe('Performance Tests', () => {
  
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Components', path: '/?page=components' },
    { name: 'Docs', path: '/?page=docs' }
  ];

  for (const p of pages) {
    test(`${p.name} page load should render in under 2s`, async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to page
      await page.goto(p.path);
      
      // Wait for critical UI elements to be visible
      await Promise.all([
        page.waitForSelector('.site__header', { state: 'visible' }),
        page.waitForSelector('.site__main', { state: 'visible' }),
        page.waitForSelector('.site__footer', { state: 'visible' })
      ]);
      
      // For non-home pages, ensure the specific page content is loaded
      if (p.path !== '/') {
        await page.waitForSelector('.page', { state: 'visible' });
      }
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      console.log(`${p.name} load time: ${loadTime}ms`);
      
      logPerfResult({
        category: 'load',
        name: `${p.name} Page Load`,
        value: loadTime,
        unit: 'ms',
        threshold: 2000
      });
      
      // Assert load time is under 2000ms
      expect(loadTime).toBeLessThan(2000);
    });
  }
});
