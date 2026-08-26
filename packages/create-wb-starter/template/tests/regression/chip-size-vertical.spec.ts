import { test, expect } from '@playwright/test';

/**
 * .x-chip--sm/--lg only differed from the base by ~2px of vertical padding
 * (0.125rem/0.25rem/0.375rem steps), which read as visually identical.
 * John: "these do not [show it], they should show vertical size too."
 * Fixed by adding explicit min-height per size, not just padding.
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

test('chip sm/md/lg render three visibly distinct heights', async ({ page }) => {
  await inject(page, `
    <span id="chip-sm" x-behavior="chip" size="sm">Small</span>
    <span id="chip-md" x-behavior="chip" size="md">Medium</span>
    <span id="chip-lg" x-behavior="chip" size="lg">Large</span>
  `);
  const heights = await Promise.all(
    ['#chip-sm', '#chip-md', '#chip-lg'].map((sel) =>
      page.locator(sel).evaluate((el) => el.getBoundingClientRect().height)
    )
  );
  expect(new Set(heights).size, `expected 3 distinct heights, got: ${JSON.stringify(heights)}`).toBe(3);
  expect(heights[0]).toBeLessThan(heights[1]);
  expect(heights[1]).toBeLessThan(heights[2]);
});
