import { test, expect } from '@playwright/test';

/**
 * #589: "x-table has a small (~8px) horizontal scrollbar on every example
 * in table.md, even when content fits" -- John: "TABLES CANNOT HAVE
 * HORIZONTAL SCROLLBARS UNLESS NECESSARY."
 *
 * Reported live via doc-viewer: every <table> example on
 * docs/components/semantics/table.md measured scrollWidth exceeding
 * clientWidth by a consistent ~8px regardless of column count/content --
 * not real content-driven overflow (which would scale with content), a
 * fixed box-model/measurement gap instead. data.css's unconditional
 * `x-table, .x-table { overflow-x: auto; }` means the browser silently
 * renders a scroll affordance for that gap instead of erroring loudly.
 *
 * Asserts scrollWidth <= clientWidth (+ small sub-pixel tolerance) on every
 * VISIBLE <table> on the page.
 */
test.describe('x-table never shows an unnecessary horizontal scrollbar (#589)', () => {
  test('docs/components/semantics/table.md: every visible <table> content fits its own box', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/components/semantics/table.md'), {
      waitUntil: 'domcontentloaded',
    });

    const tables = page.locator('x-table');
    await expect(tables.first()).toBeVisible({ timeout: 20000 });
    // Let demo.js's rAF-scheduled shrink-to-fit measurement fully settle
    // (poll-until-stable, capped at 5s in demo.js).
    await page.waitForTimeout(5200);

    const count = await tables.count();
    expect(count, 'table.md should render at least one <table>').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const table = tables.nth(i);
      const visible = await table.isVisible();
      if (!visible) continue; // collapsed <details> sections aren't in view

      const { scrollWidth, clientWidth } = await table.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));

      expect(
        scrollWidth,
        `x-table[${i}] is ${scrollWidth}px of content in a ${clientWidth}px box -- ` +
        `content is wider than the box, forcing an unnecessary horizontal scrollbar`
      ).toBeLessThanOrEqual(clientWidth + 2);
    }
  });
});
