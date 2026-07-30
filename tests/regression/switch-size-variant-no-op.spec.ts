import { test, expect } from '@playwright/test';

/**
 * switch.schema.json declares `size` (sm/md/lg) and `variant`
 * (default/primary/success) with appliesClass: "wb-switch--{{value}}", but
 * src/styles/behaviors/switch.css had zero matching .wb-switch--* rules --
 * every size/variant combination rendered pixel-identical. Confirmed by
 * John reporting a 3x3 grid of size/variant switches "not working" (no
 * visible difference between any of the 9).
 */
const HARNESS = '/demos/test-harness.html';

async function inject(page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  const ids = await page.evaluate(async (h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
    return Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
  }, html);
  await page.waitForFunction(
    (elementIds: string[]) => elementIds.every((id) => document.getElementById(id)?.classList.contains('wb-switch')),
    ids,
    { timeout: 5000 }
  );
}

test.describe('Switch size/variant classes actually differ from default', () => {
  test('sm/md/lg render three distinct track sizes', async ({ page }) => {
    await inject(page, `
      <wb-switch id="sw-sm" size="sm" checked></wb-switch>
      <wb-switch id="sw-md" size="md" checked></wb-switch>
      <wb-switch id="sw-lg" size="lg" checked></wb-switch>
    `);
    const widths = await Promise.all(
      ['#sw-sm', '#sw-md', '#sw-lg'].map((sel) =>
        page.locator(`${sel} .wb-switch__track`).evaluate((el) => getComputedStyle(el).width)
      )
    );
    expect(new Set(widths).size, `expected 3 distinct track widths, got: ${JSON.stringify(widths)}`).toBe(3);
  });

  test('default/primary/success render three distinct checked colors', async ({ page }) => {
    await inject(page, `
      <wb-switch id="sw-default" variant="default" checked></wb-switch>
      <wb-switch id="sw-primary" variant="primary" checked></wb-switch>
      <wb-switch id="sw-success" variant="success" checked></wb-switch>
    `);
    const colors = await Promise.all(
      ['#sw-default', '#sw-primary', '#sw-success'].map((sel) =>
        page.locator(`${sel} .wb-switch__track`).evaluate((el) => getComputedStyle(el).backgroundColor)
      )
    );
    expect(new Set(colors).size, `expected 3 distinct checked colors, got: ${JSON.stringify(colors)}`).toBe(3);
  });
});
