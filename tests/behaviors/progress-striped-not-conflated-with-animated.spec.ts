/**
 * <wb-progress>'s `animated` (schema default: true) and `striped` (default
 * false) drew the SAME scrolling diagonal-stripe texture, so every default
 * progress bar rendered as if `striped` were set even when it wasn't.
 * A second, compounding bug: the variant-color rule used the `background`
 * shorthand, which resets background-image/background-size — its higher
 * specificity (two host classes vs. --striped's one) silently erased the
 * striped texture regardless of source order, so even isolating the CSS
 * rule wasn't enough on its own. Fixed in src/styles/behaviors/progress.css
 * and src/wb-viewmodels/semantics/progress.js.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'progress-striped-test-area';
    c.style.cssText = 'padding:20px; width:400px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('wb-progress — striped texture is independent of the animated default', () => {
  test('a default (animated, not striped) bar has no diagonal texture', async ({ page }) => {
    await setup(page, '<wb-progress id="p1" value="50"></wb-progress>');
    const bar = page.locator('#p1 .wb-progress__bar');
    await expect(bar).toHaveClass(/wb-progress--?animated|wb-progress__bar/); // sanity: bar exists
    await expect(page.locator('#p1')).toHaveClass(/wb-progress--animated/);
    const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toBe('none');
  });

  test('a striped bar shows the diagonal texture', async ({ page }) => {
    await setup(page, '<wb-progress id="p2" value="75" striped></wb-progress>');
    const bar = page.locator('#p2 .wb-progress__bar');
    await expect(bar).toHaveClass(/wb-progress__bar--striped/);
    const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).not.toBe('none');
  });

  test('animated="false" + striped shows a static (non-scrolling) texture', async ({ page }) => {
    await setup(page, '<wb-progress id="p3" value="75" striped animated="false"></wb-progress>');
    const bar = page.locator('#p3 .wb-progress__bar');
    const animationName = await bar.evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).toBe('none');
  });

  test('animated (default) + striped scrolls the texture', async ({ page }) => {
    await setup(page, '<wb-progress id="p4" value="75" striped></wb-progress>');
    const bar = page.locator('#p4 .wb-progress__bar');
    const animationName = await bar.evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).toBe('wb-progress-stripes');
  });

  test('variant color (e.g. success) does not erase the striped texture', async ({ page }) => {
    await setup(page, '<wb-progress id="p5" value="60" striped variant="success"></wb-progress>');
    const bar = page.locator('#p5 .wb-progress__bar');
    const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).not.toBe('none');
  });
});
