import { test, expect } from '@playwright/test';
import { logPerfResult } from './perf-logger';

test.describe('Resource Performance', () => {
  
  test('Critical CSS should be under 50KB', async ({ page }) => {
    const cssRequests: { url: string, size: number }[] = [];
    
    page.on('response', async response => {
      if (response.request().resourceType() === 'stylesheet') {
        const buffer = await response.body();
        cssRequests.push({
          url: response.url(),
          size: buffer.length
        });
      }
    });
    
    await page.goto('/');
    
    for (const req of cssRequests) {
      console.log(`CSS: ${req.url} = ${(req.size / 1024).toFixed(2)}KB`);
      
      logPerfResult({
        category: 'resource',
        name: `CSS: ${req.url.split('/').pop()}`,
        value: req.size / 1024,
        unit: 'KB',
        threshold: 50
      });

      // Individual CSS files should be lightweight
      expect(req.size).toBeLessThan(50 * 1024); 
    }
  });

  test('Core JS bundle should be under 100KB', async ({ page }) => {
    const jsRequests: { url: string, size: number }[] = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (url.endsWith('wb.js') || url.endsWith('site-engine.js')) {
        const buffer = await response.body();
        jsRequests.push({
          url: url,
          size: buffer.length
        });
      }
    });
    
    await page.goto('/');
    
    for (const req of jsRequests) {
      console.log(`JS: ${req.url} = ${(req.size / 1024).toFixed(2)}KB`);
      
      logPerfResult({
        category: 'resource',
        name: `JS: ${req.url.split('/').pop()}`,
        value: req.size / 1024,
        unit: 'KB',
        threshold: 100
      });

      expect(req.size).toBeLessThan(100 * 1024);
    }
  });
});
