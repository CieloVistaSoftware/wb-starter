import { expect, test } from '@playwright/test';

const HARNESS = '/demos/test-harness.html';

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