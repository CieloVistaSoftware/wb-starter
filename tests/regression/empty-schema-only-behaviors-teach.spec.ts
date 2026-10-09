/**
 * An empty behavior with no curated example teaches from its schema (#1550's
 * fallback), and that fallback asks only for a schema data/schema-index.json
 * lists. The committed index lagged the generator by 8 behaviors, so an empty
 * <div x-sheet> stayed empty while its schema sat on disk. The index is
 * regenerated; tests/compliance/schema-index-stays-current.spec.ts keeps it so.
 */
import { test, expect } from '../fixtures/offline';

// Each has a schema with string properties and no entry in behavior-examples.json.
const SCHEMA_ONLY = ['sheet', 'offcanvas', 'clipboard', 'scroll'];

test('an empty schema-only behavior is filled from its schema', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    undefined,
    { timeout: 10000 }
  );
  await page.evaluate(async (names: string[]) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = names.map((n) => `<div x-${n} id="empty-${n}"></div>`).join('');
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
  }, SCHEMA_ONLY);

  for (const name of SCHEMA_ONLY) {
    // Teaching writes the schema's properties as attributes on the empty element.
    await expect.poll(
      () => page.locator(`#empty-${name}`).evaluate((el) =>
        el.getAttributeNames().filter((a) => a !== 'id' && a !== 'class' && !a.startsWith('x-') && !a.startsWith('data-')).length),
      { message: `empty <div x-${name}> was not taught from its schema`, timeout: 5000 }
    ).toBeGreaterThan(0);
  }
});
