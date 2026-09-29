/**
 * x-ul, x-ol AND x-dl DO WHAT THEIR DOCS SAY (#1185)
 * ==================================================
 * ul.js, ol.js and dl.js were finished behaviors that only the retired
 * <wb-ul>/<wb-ol>/<wb-dl> tags ever loaded. From 4.0.0 the docs taught
 * `<ul x-ul variant="checklist">`, and the runtime answered "matches no
 * behavior": no class, no checkboxes, no numbering style. Built here the way a
 * page builds them, and read for what each doc promises.
 */
import { test, expect, Page } from '../fixtures/offline';

async function build(page: Page, markup: string) {
  await page.goto('/');
  await page.setContent(markup);
  await page.addScriptTag({
    type: 'module',
    content: `
      import WB from '/src/core/wb-lazy.js';
      await WB.init({ autoInject: true });
      await WB.scan(document.body, { eager: true });
      await WB.whenIdle({ timeout: 10000 });
      document.body.dataset.built = '1';
    `,
  });
  await page.waitForFunction(() => document.body.dataset.built === '1');
}

test('x-ul variant="checklist" becomes a checklist, and marker= is read as documented', async ({ page }) => {
  await build(page, `
    <ul id="check" x-ul variant="checklist"><li checked>Fast</li><li>Small</li></ul>
    <ul id="square" x-ul marker="square"><li>One</li></ul>`);
  const check = page.locator('#check');
  await expect(check).toHaveClass(/\bx-ul\b/);
  await expect(check).toHaveClass(/x-ul--checklist/);
  await expect(check.locator('.x-ul__checkbox')).toHaveCount(2);
  await expect(check.locator('.x-ul__checkbox--checked')).toHaveCount(1);
  // The doc teaches the plain attribute; ul.js used to read only data-marker.
  expect(await page.locator('#square').evaluate((el) => getComputedStyle(el).listStyleType)).toBe('square');
});

test('x-ol and x-dl apply their base classes', async ({ page }) => {
  await build(page, `
    <ol id="ol" x-ol><li>First</li><li>Second</li></ol>
    <dl id="dl" x-dl><dt>Term</dt><dd>Definition</dd></dl>`);
  await expect(page.locator('#ol')).toHaveClass(/\bx-ol\b/);
  await expect(page.locator('#dl')).toHaveClass(/\bx-dl\b/);
});

test('none of them is reported as an unknown behavior', async ({ page }) => {
  await build(page, `<ul x-ul><li>a</li></ul><ol x-ol><li>b</li></ol><dl x-dl><dt>c</dt><dd>d</dd></dl>`);
  await expect(page.locator('[x-unknown-behavior]')).toHaveCount(0);
});
