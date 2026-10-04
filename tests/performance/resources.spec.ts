import { test, expect } from '../fixtures/offline';
import { logPerfResult } from './perf-logger';

test.describe('Resource Performance', () => {
  
  test('Critical CSS should be under 50KB', async ({ page }) => {
    const cssRequests: { url: string, size: number }[] = [];

    // #1433: what crosses the wire, not the decoded file. site.css and
    // themes.css are ~65KB on disk, most of it comments explaining the
    // cascade, and the server compresses them -- the raw size measured the
    // comments, not what a visitor downloads.
    page.on('requestfinished', async (request) => {
      if (request.resourceType() === 'stylesheet') {
        const sizes = await request.sizes();
        cssRequests.push({ url: request.url(), size: sizes.responseBodySize });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    
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

  test('the performance dashboard reads what the specs log (#1433)', async ({ request }) => {
    // Results are per-worker JSON lines now, merged by the server; a result
    // logged here must come back through the dashboard's endpoint.
    const name = `Dashboard round trip ${Date.now()}`;
    logPerfResult({ category: 'resource', name, value: 1, unit: 'KB', threshold: 1 });
    const res = await request.get('/api/performance-results');
    expect(res.ok()).toBe(true);
    const results = await res.json();
    expect(Array.isArray(results)).toBe(true);
    expect(results.some((r: { name: string }) => r.name === name), 'the logged result is served').toBe(true);
  });
});
