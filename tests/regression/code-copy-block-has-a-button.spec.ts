import { test, expect } from '../fixtures/offline';

/**
 * A block <code copy> gets its copy button in the corner of the code.
 *
 * John, on the Behaviors page's code · copy example: "move the copy button up
 * into the code area". The example showed no copy control in the code at all
 * -- the only Copy in sight was the page's own source-panel button, far below
 * on the right. code.js chose its copy treatment from config.variant, which
 * defaults to "inline", so a multiline <code copy> (laid out as a block
 * listing) became "click anywhere to copy" with no button. Once it did get
 * one, x-button's auto-injected rule out-ranked .x-code__copy and blew it up
 * to 54x52px, reaching onto the first line of code.
 */

async function mount(page: import('@playwright/test').Page, html: string) {
  await page.evaluate(async (markup) => {
    document.getElementById('copy-probe')?.remove();
    const host = document.createElement('div');
    host.id = 'copy-probe';
    host.style.width = '640px';
    host.innerHTML = markup;
    document.body.prepend(host);
    await (window as any).WB.scan(host, { eager: true });
    await (window as any).WB.settled({ timeout: 15000 });
  }, html);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 20000 });
});

test('a multiline <code copy> shows a small copy button inside the code, clear of the first line', async ({ page }) => {
  await mount(page, '<code id="c" copy language="javascript">const a = 1;\nconst b = 2;\nconsole.log(a + b);</code>');

  const button = page.locator('#copy-probe .x-code__copy');
  await expect(button, 'a block listing with copy must get a copy button').toBeVisible();
  await expect(page.locator('#c'), 'a block listing is not click-anywhere-to-copy').not.toHaveClass(/x-code--copyable/);

  const m = await page.evaluate(() => {
    const code = document.getElementById('c')!;
    const btn = document.querySelector('#copy-probe .x-code__copy')!.getBoundingClientRect();
    const box = code.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(code);
    const firstLine = range.getClientRects()[0];
    return {
      btn: { left: btn.left, right: btn.right, top: btn.top, bottom: btn.bottom, height: btn.height },
      box: { left: box.left, right: box.right, top: box.top, bottom: box.bottom },
      firstLineTop: firstLine.top,
    };
  });
  // In the code's own box, in its top-right corner.
  expect(m.btn.right, 'inside the code box (right)').toBeLessThanOrEqual(m.box.right + 1);
  expect(m.btn.top, 'inside the code box (top)').toBeGreaterThanOrEqual(m.box.top - 1);
  expect(m.btn.left, 'in the right half of the code').toBeGreaterThan((m.box.left + m.box.right) / 2);
  // The small corner control, not an x-button-sized one, and above the code.
  expect(m.btn.height, 'the copy button is the small corner control').toBeLessThan(30);
  expect(m.btn.bottom, 'the copy button must not cover the first line of code').toBeLessThanOrEqual(m.firstLineTop);

  // And it copies the listing.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const copied = page.evaluate(() => new Promise<string>((resolve) => {
    document.getElementById('c')!.addEventListener('wb:code:copy', (e) => resolve((e as CustomEvent).detail.text), { once: true });
  }));
  await button.click();
  expect(await copied).toContain('console.log(a + b);');
});

test('a single-line inline <code copy> keeps click-to-copy and gets no button', async ({ page }) => {
  await mount(page, '<p>Run <code id="i" copy>npm start</code> to begin.</p>');
  await expect(page.locator('#i')).toHaveClass(/x-code--copyable/);
  await expect(page.locator('#copy-probe .x-code__copy')).toHaveCount(0);
});

test('the Behaviors page code · copy example shows its copy button in the code', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => document.querySelectorAll('.behaviors-search-results__row').length > 100, null, { timeout: 30000 });
  const row = page.locator('.behaviors-search-results__row[data-browse-token="x-code"][data-label="code"][data-prop="copy"]').first();
  const group = page.locator('#behaviors-search-results details', { has: row });
  if (await group.count() && !(await group.first().evaluate((d) => (d as HTMLDetailsElement).open))) {
    await group.first().locator(':scope > summary').click();
  }
  await row.click();
  await expect(page.locator('#behaviors-live')).not.toHaveAttribute('aria-busy', 'true', { timeout: 20000 });
  await expect(page.locator('#behaviors-live-example .x-code__copy'), 'the example demonstrates its own copy button').toBeVisible();
});
