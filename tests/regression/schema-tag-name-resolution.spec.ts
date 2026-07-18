import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * schema-builder.js's detectSchema() derives a lookup key by stripping
 * "wb-" and ALL hyphens from the tag name. Several schemas registered under
 * a DIFFERENT key than that derivation produces, so they were never found:
 * wb-control/wb-repeater's schemaFor still carried the "wb-" prefix
 * (registered as "wb-control" instead of "control"), and a migration script
 * doubled their baseClass to "wb-wb-control"/"wb-wb-repeater". Separately,
 * wb-drawerLayout's elementMap key was mixed-case ("wb-drawerLayout"), which
 * getElementBehavior() (always .toLowerCase()s the tag) could never match
 * against the real lowercase-hyphenated tag actually authored anywhere
 * (<wb-drawer-layout>). wb-article/wb-articles had schema+tag-map entries
 * but no behavior implementation at all (#363).
 */
test.describe('Schema-driven tags resolve to a real, class-bearing element', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('wb-control gets a real class, not empty', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-control></wb-control>');
    await expect(el).not.toHaveClass('');
  });

  test('wb-repeater behavior runs (display:contents wrapper, by design no class)', async ({ page }) => {
    // repeater() (wb-repeater.js) intentionally sets no class -- it uses
    // display:contents so its repeated children lay out as if direct
    // children of the parent. Repeats a <template> N times via count=.
    const el = await setupTestContainer(
      page,
      '<wb-repeater count="3"><template>Item {{index}}</template></wb-repeater>'
    );
    await expect(el).toHaveCSS('display', 'contents');
    await expect(el.locator('template')).toHaveCount(0);
    await expect(el).toContainText('Item 1');
    await expect(el).toContainText('Item 3');
  });

  test('wb-drawer-layout resolves via the lowercase-hyphenated tag', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-drawer-layout position="left">side</wb-drawer-layout>');
    await expect(el).toHaveClass(/wb-drawer/);
  });

  test('wb-article builds a real structure from a bare tag', async ({ page }) => {
    const el = await setupTestContainer(page, '<wb-article title="Test Article" author="Jane">Body text.</wb-article>');
    await expect(el).toHaveClass(/wb-article/);
    await expect(el.locator('.wb-article__title')).toHaveText('Test Article');
  });

  test('wb-articles builds a list wrapper around wb-article children', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<wb-articles title="Recent"><wb-article title="One">A</wb-article><wb-article title="Two">B</wb-article></wb-articles>'
    );
    await expect(el).toHaveClass(/wb-articles/);
    await expect(el.locator('wb-article')).toHaveCount(2);
  });
});
