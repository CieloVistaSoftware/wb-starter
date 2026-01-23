import { test, expect } from '@playwright/test';

test('wb-html-editor tab UI smoke test', async ({ page }) => {
  await page.goto('/');
  // inject component into page
  await page.evaluate(async () => {
    const el = document.createElement('wb-html-editor');
    document.body.appendChild(el);
    // Ensure behavior is injected via WB if available
    if (window.WB && typeof window.WB.inject === 'function') {
      await window.WB.inject(el, 'htmlEditor');
    } else if (typeof el.openFor === 'function') {
      el.openFor();
    }
  });

  const editor = page.locator('wb-html-editor');
  await expect(editor).toBeVisible();

  const tabs = editor.locator('.wb-html-editor__tab');
  await expect(tabs).toHaveCount(4);

  // Click Preview tab and confirm left pane hidden
  await editor.locator('.wb-html-editor__tab[tab="preview"]').click();
  await page.waitForTimeout(150);
  const left = await page.evaluate(() => !!document.querySelector('wb-html-editor .wb-html-editor__left') && getComputedStyle(document.querySelector('wb-html-editor .wb-html-editor__left')).display === 'none');
  expect(left).toBe(true);

  // Switch back to editor tab
  await editor.locator('.wb-html-editor__tab[tab="editor"]').click();
  await page.waitForTimeout(100);
  const leftVisible = await page.evaluate(() => getComputedStyle(document.querySelector('wb-html-editor .wb-html-editor__left')).display !== 'none');
  expect(leftVisible).toBe(true);
});
