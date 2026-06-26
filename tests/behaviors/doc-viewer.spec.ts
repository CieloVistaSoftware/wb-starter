/**
 * doc-viewer.html renders the markdown it is given (issue #140).
 * mdhtml() must read data-src (the doc-viewer sets content.dataset.src), else
 * config.src is null, the fetch is skipped, and the viewer is stuck on "Loading…".
 */
import { test, expect } from '@playwright/test';

test('doc-viewer renders the requested markdown, not the loading placeholder', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=%2Fdocs%2Fcomponents%2Fcards%2Fcard.md');
  // content should populate; wait for the loading message to be replaced
  await page.waitForFunction(() => {
    const c = document.getElementById('content');
    const t = (c?.innerText || '').trim();
    return t.length > 200 && !t.includes('Loading documentation');
  }, { timeout: 15000 });

  const content = page.locator('#content');
  await expect(content).not.toContainText('Loading documentation');
  // rendered markdown should produce real structure (a heading) and substantial text
  await expect(content.locator('h1, h2, h3').first()).toBeVisible();
});

test('doc-viewer shows an error (not infinite loading) for a missing file', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=%2Fdocs%2F__does_not_exist__.md');
  await page.waitForFunction(() => {
    const t = (document.getElementById('content')?.innerText || '');
    return /Failed to load|Error loading|not found/i.test(t);
  }, { timeout: 15000 });
});
