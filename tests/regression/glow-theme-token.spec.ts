import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #817: glow is a theme characteristic, so a theme opts in with
 * --wb-glow-spread (and --wb-glow-strength) instead of every heading on every
 * page carrying x-glow. A theme that sets nothing must render exactly as
 * before: no shadow, and a heading still inherits a text-shadow its container
 * gives it.
 */

const shadowOf = (page: Page, id: string) =>
  page.evaluate((elId) => getComputedStyle(document.getElementById(elId)!).textShadow, id);

test('a theme that sets no glow token leaves headings exactly as they were', async ({ page }) => {
  await injectAndScan(page, `
    <div data-theme="dark">
      <h1 id="plain">Plain heading</h1>
      <div style="text-shadow: rgb(255, 0, 0) 1px 1px 0px"><h2 id="inherits">Inherits its container's shadow</h2></div>
    </div>`);
  expect(await shadowOf(page, 'plain')).toBe('none');
  // Forced to none would have broken this; unset, the token's rule drops out.
  expect(await shadowOf(page, 'inherits')).toBe('rgb(255, 0, 0) 1px 1px 0px');
});

test('a theme that sets --wb-glow-spread makes h1, h2 and h3 glow, and nothing else', async ({ page }) => {
  await injectAndScan(page, `
    <div data-theme="dark" style="--wb-glow-spread: 20px; --wb-glow-strength: 0.5">
      <h1 id="g1">One</h1><h2 id="g2">Two</h2><h3 id="g3">Three</h3><p id="para">Body text</p>
    </div>`);
  for (const id of ['g1', 'g2', 'g3']) {
    const shadow = await shadowOf(page, id);
    expect(shadow, `${id} glows`).not.toBe('none');
    expect(shadow, `${id} uses the theme's spread`).toContain('20px');
  }
  expect(await shadowOf(page, 'para'), 'body text does not glow').toBe('none');
});
