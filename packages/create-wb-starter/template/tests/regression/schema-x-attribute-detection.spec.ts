import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * #521 (docs/architecture/proposals/remove-wb-prefix-authoring-surface.md):
 * schema-builder.js's detectSchema() previously only recognized composite
 * components via `wb-*` tag-name-prefix matching. Any element carrying an
 * `x-{name}` attribute matching a registered schema now ALSO resolves --
 * dual-maintained alongside `wb-*` tags indefinitely, by design (not a
 * deprecation/replacement). `<span x-chip>` and `<wb-chip>` must build
 * identical DOM/classes from this point on.
 *
 * Also covers a real bug found auditing this: `x-ignore` (the existing
 * opt-out for wb.js's native-tag autoInject) was never checked anywhere in
 * schema-builder.js, so `<wb-chip x-ignore>` was fully built despite the
 * attribute. Fixed as a single check in processElement() -- the one entry
 * point every caller (scan(), the MutationObserver, and wb.js's own
 * processSchema()) funnels through.
 */
test.describe('x-{name} attribute resolves the same schema as the wb-* tag (#521)', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('<span x-chip> builds the same chip content as <wb-chip>', async ({ page }) => {
    // <wb-chip> deliberately has NO .wb-chip class (#448 -- chip.css selects
    // the wb-chip TAG directly, same guard buildStructure() uses to avoid
    // #478's redundant-class violation). <span x-chip> has no tag to select
    // on, so it needs (and gets, per #521's fix to chip()) the class instead
    // -- both forms end up equally stylable, just via a different selector.
    const tagChip = await setupTestContainer(page, '<wb-chip label="Tag"></wb-chip>');
    await expect(tagChip.locator('.wb-chip__label')).toHaveText('Tag');

    const attrChip = await setupTestContainer(page, '<span x-chip label="Tag"></span>');
    await expect(attrChip).toHaveClass(/\bwb-chip\b/);
    await expect(attrChip.locator('.wb-chip__label')).toHaveText('Tag');
  });

  test('<span x-chip variant="primary"> gets the same modifier class as <wb-chip variant="primary">', async ({ page }) => {
    const attrChip = await setupTestContainer(
      page,
      '<span x-chip label="Tag" variant="primary"></span>'
    );
    await expect(attrChip).toHaveClass(/\bwb-chip--primary\b/);
  });

  test('x-ignore opts a wb-* tag out of schema building entirely', async ({ page }) => {
    const ignored = await setupTestContainer(page, '<wb-chip x-ignore label="Tag"></wb-chip>');
    await expect(ignored).not.toHaveClass(/\bwb-chip\b/);
    await expect(ignored.locator('.wb-chip__label')).toHaveCount(0);
  });

  test('x-ignore opts an x-{name} attribute element out of schema building entirely', async ({ page }) => {
    const ignored = await setupTestContainer(page, '<span x-chip x-ignore label="Tag"></span>');
    await expect(ignored).not.toHaveClass(/\bwb-chip\b/);
    await expect(ignored.locator('.wb-chip__label')).toHaveCount(0);
  });
});
