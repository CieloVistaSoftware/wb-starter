import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * schema-builder.js's detectSchema() derives a lookup key by stripping
 * "wb-" and ALL hyphens from the tag name. Several schemas registered under
 * a DIFFERENT key than that derivation produces, so they were never found:
 * x-control/x-repeater's schemaFor still carried the "wb-" prefix
 * (registered as "[x-control]" instead of "control"), and a migration script
 * doubled their baseClass to "x-wb-control"/"x-wb-repeater". Separately,
 * x-drawerLayout's elementMap key was mixed-case ("[x-drawer]Layout"), which
 * getElementBehavior() (always .toLowerCase()s the tag) could never match
 * against the real lowercase-hyphenated tag actually authored anywhere
 * (<div x-drawer-layout>). x-article/x-articles had schema+tag-map entries
 * but no behavior implementation at all (#363).
 */
test.describe('Schema-driven tags resolve to a real, class-bearing element', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('[x-control] gets a real class, not empty', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-control></div>');
    await expect(el).not.toHaveClass('');
  });

  test('[x-repeater] behavior runs (display:contents wrapper, by design no class)', async ({ page }) => {
    // repeater() (x-repeater.js) intentionally sets no class -- it uses
    // display:contents so its repeated children lay out as if direct
    // children of the parent. Repeats a <template> N times via count=.
    const el = await setupTestContainer(
      page,
      '<div x-repeater count="3"><template>Item {{index}}</template></div>'
    );
    await expect(el).toHaveCSS('display', 'contents');
    await expect(el.locator('template')).toHaveCount(0);
    await expect(el).toContainText('Item 1');
    await expect(el).toContainText('Item 3');
  });

  test('[x-drawer-layout] resolves via the lowercase-hyphenated tag', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-drawer-layout position="left">side</div>');
    await expect(el).toHaveClass(/x-drawer/);
  });

  test('[x-article] builds a real structure from a bare tag', async ({ page }) => {
    const el = await setupTestContainer(page, '<div x-article title="Test Article" author="Jane">Body text.</div>');
    // Not toHaveClass(/x-article/) on el -- a real <div x-article> tag must NOT
    // also carry a same-named class (no-redundant-tag-name-class.spec.ts);
    // article.css's bare `[x-article] {}` tag selector already styles it.
    // The structural checks below prove article() actually ran instead.
    await expect(el.locator('.x-article__title')).toHaveText('Test Article');
    await expect(el.locator('.x-article__byline')).toContainText('Jane');
    await expect(el.locator('.x-article__content')).toContainText('Body text.');
  });

  test('[x-articles] builds a list wrapper around [x-article] children', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<div x-articles title="Recent"><div x-article title="One">A</div><div x-article title="Two">B</div></div>'
    );
    // Not toHaveClass(/x-articles/) on el -- a real <div x-articles> tag must NOT
    // also carry a same-named class (no-redundant-tag-name-class.spec.ts).
    // The structural check below proves articles() actually ran instead.
    await expect(el.locator('.x-articles__list')).toBeVisible();
    await expect(el.locator('[x-article]')).toHaveCount(2);
  });
});
