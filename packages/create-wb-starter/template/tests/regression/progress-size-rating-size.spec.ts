import { test, expect } from '@playwright/test';

/**
 * progress.schema.json's `size` (xs/sm/md/lg/xl) and rating.schema.json's
 * `size` (sm/md/lg) were both declared but had no visible effect:
 * - x-progress: progress.js correctly applied x-progress--{size}, but
 *   progress.css had zero matching height rules, AND the always-present
 *   x-progress--labeled class unconditionally forced 1.25rem regardless.
 * - x-rating: rating.js never read the size attribute at all -- star
 *   font-size was hardcoded inline to 1.5rem unconditionally.
 */
const HARNESS = '/demos/test-harness.html';

async function inject(page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate(async (h: string) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container, { eager: true });
  }, html);
}

test('x-progress xs/sm/md/lg/xl render five distinct heights', async ({ page }) => {
  await inject(page, `
    <progress id="p-xs" size="xs" value="50"></progress>
    <progress id="p-sm" size="sm" value="50"></progress>
    <progress id="p-md" size="md" value="50"></progress>
    <progress id="p-lg" size="lg" value="50"></progress>
    <progress id="p-xl" size="xl" value="50"></progress>
  `);
  const heights = await Promise.all(
    ['#p-xs', '#p-sm', '#p-md', '#p-lg', '#p-xl'].map((sel) =>
      page.locator(sel).evaluate((el) => getComputedStyle(el).height)
    )
  );
  expect(new Set(heights).size, `expected 5 distinct heights, got: ${JSON.stringify(heights)}`).toBe(5);
});

test('x-rating sm/md/lg render three distinct star sizes', async ({ page }) => {
  await inject(page, `
    <span x-rating id="r-sm" size="sm" value="3"></span>
    <span x-rating id="r-md" size="md" value="3"></span>
    <span x-rating id="r-lg" size="lg" value="3"></span>
  `);
  const sizes = await Promise.all(
    ['#r-sm', '#r-md', '#r-lg'].map((sel) =>
      page.locator(`${sel} .x-rating__star`).first().evaluate((el) => getComputedStyle(el).fontSize)
    )
  );
  expect(new Set(sizes).size, `expected 3 distinct star font-sizes, got: ${JSON.stringify(sizes)}`).toBe(3);
});
