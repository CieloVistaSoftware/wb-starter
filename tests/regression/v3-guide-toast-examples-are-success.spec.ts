import { test, expect } from '../fixtures/offline';

/**
 * #1667 -- the V3 guide's toast examples said `type="success"`.
 *
 * toast() reads its colour from `toast-variant` or `variant`, never `type`
 * (on a <button>, `type` is the button's own attribute). So all three examples
 * the guide calls "success" popped the default blue `info` toast instead, and
 * a reader copying them learned an attribute that does nothing.
 *
 * Asserted on the rendered guide, by clicking the examples a reader clicks.
 */
test('V3-GUIDE.md toast examples pop a success toast (#1667)', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs%2FV3-GUIDE.md', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 20_000 });

  for (const label of ['Save', 'Notify']) {
    const trigger = page.locator('[x-demo] .x-demo__grid button[x-toast]', { hasText: label }).first();
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger, `the "${label}" toast example is on the page`).toBeVisible({ timeout: 15_000 });
    await trigger.click();
    await expect(page.locator('.x-toast.x-toast--success').last(), `"${label}" shows a success toast`).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.x-toast.x-toast--info')).toHaveCount(0);
  }
});

test('V3-GUIDE.md teaches no attribute toast() ignores (#1667)', async () => {
  const { readFileSync } = await import('node:fs');
  const guide = readFileSync('docs/V3-GUIDE.md', 'utf8');
  // Every x-toast example in the guide, live or static.
  const toasts = guide.match(/<button\s+x-toast[\s\S]*?>/g) || [];
  expect(toasts.length, 'the guide still has toast examples').toBeGreaterThan(0);
  for (const tag of toasts) expect(tag, `toast example uses type= for its colour:\n${tag}`).not.toMatch(/\btype="(success|error|warning|info)"/);
});
