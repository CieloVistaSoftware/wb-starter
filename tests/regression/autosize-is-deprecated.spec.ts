import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * x-autosize is deprecated in favor of <textarea autosize>.
 *
 * John, 2026-10-16: "retire it in favor of <textarea autosize> and keep the old
 * attribute as an alias ... MARK IT DEPRECATED". textarea.js already grows
 * every <textarea autosize>, and also honors maxRows, which x-autosize does
 * not. x-autosize keeps working so no page breaks, and warns once per page.
 */
const LONG = 'line\n'.repeat(12);

test.beforeEach(async ({ page }) => {
  await setupBehaviorTest(page);
});

test('x-autosize still grows its textarea, and warns once that it is deprecated', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning' && /x-autosize/.test(m.text())) warnings.push(m.text()); });
  await setupTestContainer(page, '<textarea x-autosize rows="2"></textarea><textarea x-autosize rows="2"></textarea>');
  const ta = page.locator('#test-container textarea').first();
  const before = (await ta.boundingBox())!.height;
  await ta.fill(LONG);
  await expect.poll(async () => (await ta.boundingBox())!.height, 'the textarea grows with its text').toBeGreaterThan(before + 20);
  expect(warnings.length, 'one deprecation warning per page, not one per textarea').toBe(1);
  expect(warnings[0]).toContain('<textarea autosize>');
});

test('<textarea autosize> grows with no deprecation warning', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning' && /deprecated/i.test(m.text())) warnings.push(m.text()); });
  await setupTestContainer(page, '<textarea autosize rows="2"></textarea>');
  const ta = page.locator('#test-container textarea').first();
  const before = (await ta.boundingBox())!.height;
  await ta.fill(LONG);
  await expect.poll(async () => (await ta.boundingBox())!.height).toBeGreaterThan(before + 20);
  expect(warnings).toEqual([]);
});
