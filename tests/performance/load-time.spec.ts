import { test, expect } from '../fixtures/offline';
import { logPerfResult } from './perf-logger';

/**
 * #1433: load time is read from the page's own clock -- performance.now() is
 * milliseconds since navigation started -- at the moment the page's critical
 * UI is visible. It was Node's Date.now() around goto() and three
 * waitForSelector() round trips, so it included Playwright's own polling and
 * IPC on top of whatever the page took.
 */
test.describe('Performance Tests', () => {
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Behaviors', path: '/?page=behaviors' },
    { name: 'Docs', path: '/?page=docs' },
  ];

  for (const p of pages) {
    test(`${p.name} page load should render in under 2s`, async ({ page }) => {
      await page.goto(p.path);
      const loadTime = await page.waitForFunction((needsPage) => {
        const visible = (sel: string) => {
          const el = document.querySelector(sel) as HTMLElement | null;
          return !!el && el.offsetParent !== null;
        };
        const ready = visible('.site__header') && visible('.site__main') && visible('.site__footer')
          && (!needsPage || visible('.page'));
        return ready ? performance.now() : false;
      }, p.path !== '/', { polling: 'raf', timeout: 15000 }).then((h) => h.jsonValue() as Promise<number>);

      console.log(`${p.name} load time: ${Math.round(loadTime)}ms`);
      logPerfResult({ category: 'load', name: `${p.name} Page Load`, value: loadTime, unit: 'ms', threshold: 2000 });
      expect(loadTime, 'navigation start to header, main and footer visible').toBeLessThan(2000);
    });
  }
});
