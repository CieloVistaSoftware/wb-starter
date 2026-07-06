import { test, expect } from '@playwright/test';

/**
 * Accordion supports the v3 PLAIN attribute (`accordion-title`) — not just the
 * legacy data-* config — and the components-page demo uses it inside a <wb-demo>
 * whose source panel therefore shows standards-compliant code (§5 left-aligned,
 * no data-*). Effect-based (§19): items build and toggle on click.
 */
test('accordion builds + toggles from plain accordion-title (components page)', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });

  const acc = page.locator('wb-accordion').first();
  await expect(acc).toBeVisible({ timeout: 20000 });

  // All three plainly-attributed items become accordion items with titled heads.
  const heads = acc.locator('.wb-accordion-head');
  await expect(heads).toHaveCount(3, { timeout: 15000 });
  await expect(heads.nth(0)).toContainText('What is wb-starter?');

  // Effect: clicking a head toggles aria-expanded.
  const before = await heads.nth(0).getAttribute('aria-expanded');
  await heads.nth(0).click();
  await expect
    .poll(async () => heads.nth(0).getAttribute('aria-expanded'))
    .not.toBe(before);

  // The wb-demo source panel shows the PLAIN attribute, never legacy data-*.
  const src = page.locator('wb-demo pre code').filter({ hasText: 'wb-accordion' }).first();
  await expect(src).toBeVisible();
  const txt = (await src.textContent()) || '';
  expect(txt).toContain('accordion-title="What is wb-starter?"');
  expect(txt, 'code sample must not teach legacy data-* config').not.toContain('data-accordion-title');
});
