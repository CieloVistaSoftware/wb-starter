import { expect, test } from '../fixtures/offline';

const HARNESS = '/demos/test-harness.html';

// #1349: both tests assert an exact request COUNT taken inside the route
// handler (toBe(2), toBe(3)). sw.js answers the page's GETs itself and
// Playwright cannot route a service worker's requests, so a request the worker
// claimed was invisible here and the count came up short for a reason that has
// nothing to do with the loader's retry or its failure cache.
test.use({ serviceWorkers: 'block' });

test.describe('module loader resolution and failure caching (#512, #513)', () => {
  test('retries a transient semantic-module fetch and resolves the behavior', async ({ page }) => {
    let requests = 0;
    await page.route('**/src/wb-viewmodels/semantics/timeline.js**', async route => {
      requests += 1;
      if (requests === 1) {
        await route.abort('failed');
        return;
      }
      await route.continue();
    });

    await page.goto(HARNESS);
    const result = await page.evaluate(async () => {
      const { getBehavior } = await import('/src/wb-viewmodels/index.js');
      return typeof await getBehavior('timeline');
    });

    expect(result).toBe('function');
    expect(requests).toBe(2);
  });

  test('shares a permanent module failure across concurrent callers and logs it once', async ({ page }) => {
    let requests = 0;
    const failures: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('Failed to load module: semantics/diff.js')) {
        failures.push(message.text());
      }
    });
    await page.route('**/src/wb-viewmodels/semantics/diff.js**', async route => {
      requests += 1;
      await route.abort('failed');
    });

    await page.goto(HARNESS);
    const outcomes = await page.evaluate(async () => {
      const { getBehavior } = await import('/src/wb-viewmodels/index.js');
      return Promise.allSettled([
        getBehavior('diff'),
        getBehavior('diff'),
        getBehavior('diff'),
        getBehavior('diff')
      ]);
    });

    expect(outcomes.every(outcome => outcome.status === 'rejected')).toBe(true);
    expect(requests).toBe(3);
    expect(failures).toHaveLength(1);
  });
});