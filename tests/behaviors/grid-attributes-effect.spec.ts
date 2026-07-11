import { test, expect, Page } from '@playwright/test';

/**
 * wb-grid new attributes have real effect (#281, §19): rows, align/justify/
 * center, background, alt-rows, headers. columns/gap/min-width were already
 * covered elsewhere; this covers only the attributes added for #281.
 */
const BASE_URL = '/demos/test-harness.html';

async function injectAndScan(page: Page, html: string) {
  await page.goto(BASE_URL);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate((h: string) => {
    const container = document.createElement('div');
    container.id = 'grid-test-container';
    container.style.width = '600px';
    container.innerHTML = h;
    document.body.appendChild(container);
  }, html);
  // wb-lazy.js's scan() is IntersectionObserver-based — behaviors only
  // activate once the element is actually in view, not just appended.
  await page.locator('#grid-test-container').scrollIntoViewIfNeeded();
  await page.evaluate(() => (window as any).WB.scan(document.getElementById('grid-test-container')));
  await page.waitForTimeout(500);
}

test.describe('wb-grid attribute effects (#281)', () => {
  test('rows sets an explicit grid-template-rows track count', async ({ page }) => {
    await injectAndScan(
      page,
      '<wb-grid columns="2" rows="2"><div>A</div><div>B</div><div>C</div><div>D</div></wb-grid>'
    );
    const rows = await page.locator('#grid-test-container wb-grid').evaluate(
      (el) => getComputedStyle(el).gridTemplateRows.trim().split(/\s+/).length
    );
    expect(rows).toBe(2);
  });

  test('center aligns items and centers text', async ({ page }) => {
    await injectAndScan(page, '<wb-grid center><div>X</div></wb-grid>');
    const el = page.locator('#grid-test-container wb-grid');
    await expect(el).toHaveCSS('align-items', 'center');
    await expect(el).toHaveCSS('justify-items', 'center');
    await expect(el).toHaveCSS('text-align', 'center');
  });

  test('align/justify set independently without center', async ({ page }) => {
    await injectAndScan(page, '<wb-grid align="end" justify="start"><div>X</div></wb-grid>');
    const el = page.locator('#grid-test-container wb-grid');
    await expect(el).toHaveCSS('align-items', 'end');
    await expect(el).toHaveCSS('justify-items', 'start');
  });

  test('background applies a real background', async ({ page }) => {
    await injectAndScan(page, '<wb-grid background="var(--bg-tertiary)"><div>X</div></wb-grid>');
    const bg = await page.locator('#grid-test-container wb-grid').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('alt-rows zebra-stripes even children via theme color', async ({ page }) => {
    await injectAndScan(
      page,
      '<wb-grid alt-rows><div>1</div><div>2</div><div>3</div><div>4</div></wb-grid>'
    );
    const items = page.locator('#grid-test-container wb-grid > div');
    const evenBg = await items.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor);
    const oddBg = await items.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(evenBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(evenBg).not.toBe(oddBg);
  });

  test('headers inserts a labeled header cell per name, before existing content', async ({ page }) => {
    await injectAndScan(
      page,
      '<wb-grid headers="Name,Age,Email" columns="3"><div>Alice</div><div>30</div><div>alice@x.com</div></wb-grid>'
    );
    const grid = page.locator('#grid-test-container wb-grid');
    const headers = grid.locator('.wb-grid__header');
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toHaveText('Name');
    await expect(headers.nth(1)).toHaveText('Age');
    await expect(headers.nth(2)).toHaveText('Email');
    // Headers are prepended — first child of the grid is a header, not the data.
    const firstChildClass = await grid.evaluate((el) => el.firstElementChild?.className);
    expect(firstChildClass).toBe('wb-grid__header');
  });
});
