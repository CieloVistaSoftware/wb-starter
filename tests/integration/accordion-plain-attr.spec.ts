import { test, expect } from '@playwright/test';

/**
 * Accordion supports the v3 PLAIN attribute (`accordion-title`), not just legacy
 * data-*. Effect-based (§19): items build and toggle on click.
 *
 * Uses a static served fixture (tests/fixtures/accordion-plain.html) — the heavy
 * components page (36 wb-demos) flaked under load (#269), and setContent after
 * goto pre-defines the custom element so it upgrades before its children parse
 * (single-item fallback). A real served file parses all children first.
 */
test('accordion builds + toggles from plain accordion-title', async ({ page }) => {
  await page.goto('/tests/fixtures/accordion-plain.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 });

  const heads = page.locator('#acc .wb-accordion-head');
  await expect(heads).toHaveCount(3, { timeout: 10000 });
  await expect(heads.nth(0)).toContainText('What is wb-starter?');

  // Effect: clicking a head toggles aria-expanded.
  const before = await heads.nth(0).getAttribute('aria-expanded');
  await heads.nth(0).click();
  await expect.poll(() => heads.nth(0).getAttribute('aria-expanded')).not.toBe(before);
});
