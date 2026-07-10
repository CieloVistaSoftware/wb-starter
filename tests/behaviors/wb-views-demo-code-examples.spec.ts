import { test, expect } from '@playwright/test';

/**
 * demos/wb-views-demo.html's auto-generated source code blocks (#242) must:
 * 1. Capture the authored source, not the enhanced/injected DOM (no garbage
 *    attribute serialization, no injected wrapper elements).
 * 2. Wrap, never show a horizontal scrollbar.
 * 3. Be vertically formatted (multi-line, indented), not one long blob.
 */
test.describe('wb-views-demo code examples (#242)', () => {
  test('captured source has no enhanced-DOM garbage attributes', async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const codes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('example-block')).map((b) => b.getAttribute('code') || '')
    );
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) {
      expect(code, `captured source should not contain malformed empty-attribute serialization: ${code.slice(0, 80)}`).not.toMatch(/=""="" |'='""/);
    }
  });

  test('captured source is vertically formatted, one element per line', async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const code = await page.locator('example-block').first().getAttribute('code');
    expect(code, 'source should be multi-line, not a single blob').toContain('\n');
    const lines = (code || '').split('\n').filter((l) => l.trim());
    expect(lines.length).toBeGreaterThan(1);
  });

  test('rendered code block never overflows horizontally', async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const blocks = page.locator('example-block');
    const count = await blocks.count();
    for (let i = 0; i < count; i++) {
      await blocks.nth(i).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    const overflowing = await page.evaluate(() =>
      Array.from(document.querySelectorAll('example-block pre'))
        .map((pre) => ({ scrollWidth: pre.scrollWidth, clientWidth: pre.clientWidth }))
        .filter((r) => r.scrollWidth > r.clientWidth + 2)
    );
    expect(overflowing, `no code block should overflow horizontally: ${JSON.stringify(overflowing)}`).toEqual([]);
  });
});
