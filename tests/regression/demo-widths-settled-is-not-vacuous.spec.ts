import { test, expect } from '../fixtures/offline';
import { demoWidthsSettled } from '../base';

/**
 * #984: demo.js measures a demo's width until it stops moving, then swaps
 * .x-demo--measuring for .x-demo--measured -- the runtime's own "settled"
 * signal. demoWidthsSettled() waits on it, but called straight after goto,
 * before any demo existed, its check held vacuously and it returned at once.
 * Every caller compensated with a sleep in front of it (500ms, 5.2s, 6s).
 *
 * Called with no lead-in, the helper must not return until the demos on the
 * page are built and have committed their widths.
 */
test('demoWidthsSettled waits for the demos, with no sleep in front of it (#984)', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/table.md'), {
    waitUntil: 'domcontentloaded',
  });
  await demoWidthsSettled(page, 30000);

  const state = await page.evaluate(() => {
    const demos = Array.from(document.querySelectorAll('[x-demo], x-demo'));
    return {
      demos: demos.length,
      measuring: demos.filter((d) => d.classList.contains('x-demo--measuring')).length,
      measured: demos.filter((d) => d.classList.contains('x-demo--measured')).length,
    };
  });
  expect(state.demos, 'the page has demos to wait for').toBeGreaterThan(0);
  expect(state.measuring, 'no demo may still be measuring when the helper returns').toBe(0);
  expect(state.measured, 'the helper returned before any demo had committed its width').toBeGreaterThan(0);
});
