/**
 * <progress>'s custom-tag path never read animated/indeterminate/
 * showValue — progress.schema.json declares all three, but only the
 * unused native-<progress>+x-progress path (targeting
 * ::-webkit-progress-value pseudo-elements that don't exist on this
 * custom tag) ever checked them. Every <progress> everywhere had zero
 * animation capability; <progress indeterminate> had no visual effect
 * at all. Fixed in src/wb-viewmodels/semantics/progress.js.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #735: NOT WBSite. This page is a standalone harness, not an SPA route, so
  // window.WBSite is never created here -- the wait burned its full timeout and
  // failed before a single assertion ran. WB.behaviors is the readiness signal
  // that applies, and this setup scans the DOM itself below.
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'progress-anim-test-area';
    c.style.cssText = 'padding:20px; width:400px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('<progress> animated/indeterminate/showValue (custom-tag path)', () => {
  test('animated (default true) adds x-progress--animated to the host', async ({ page }) => {
    await setup(page, '<progress id="pa1" value="50"></progress>');
    await expect(page.locator('#pa1')).toHaveClass(/x-progress--animated/);
  });

  test('animated="false" removes the animated class', async ({ page }) => {
    await setup(page, '<progress id="pa2" value="50" animated="false"></progress>');
    await expect(page.locator('#pa2')).not.toHaveClass(/x-progress--animated/);
  });

  test('indeterminate adds x-progress--indeterminate and a real sweep animation on the bar', async ({ page }) => {
    await setup(page, '<progress id="pa3" indeterminate></progress>');
    const host = page.locator('#pa3');
    await expect(host).toHaveClass(/x-progress--indeterminate/);
    const animationName = await host.locator('.x-progress__bar').evaluate(
      (el) => getComputedStyle(el).animationName
    );
    expect(animationName).toBe('x-progress-indeterminate-sweep');
  });

  test('indeterminate never gets the animated class (mutually exclusive)', async ({ page }) => {
    await setup(page, '<progress id="pa4" indeterminate animated></progress>');
    await expect(page.locator('#pa4')).not.toHaveClass(/x-progress--animated/);
  });

  test('show-value appends the percentage alongside a custom label', async ({ page }) => {
    await setup(page, '<progress id="pa5" value="65" label="Uploading" show-value></progress>');
    await expect(page.locator('#pa5 .x-progress__label')).toHaveText('Uploading 65%');
  });

  test('a custom label without show-value shows only the label (no percent)', async ({ page }) => {
    await setup(page, '<progress id="pa6" value="65" label="Uploading"></progress>');
    await expect(page.locator('#pa6 .x-progress__label')).toHaveText('Uploading');
  });
});
