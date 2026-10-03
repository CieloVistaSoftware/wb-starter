import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * #521: schema-builder.js's detectSchema() once recognized composite
 * behaviors only by a `wb-*` tag-name prefix. An element carrying an
 * `x-{name}` attribute for a registered schema now resolves it too -- and
 * since 4.0.0 retired `<wb-*>` tags (#1144: "we don't use wb-* any more"),
 * the x-{name} attribute is the ONLY way: `<span x-chip>` builds the chip.
 *
 * Also covers a real bug found auditing this: `x-ignore` (the opt-out for
 * wb.js's native-tag autoInject) was never checked anywhere in
 * schema-builder.js, so `<span x-chip x-ignore>` was fully built despite the
 * attribute. Fixed as a single check in processElement() -- the one entry
 * point every caller (scan(), the MutationObserver, and wb.js's own
 * processSchema()) funnels through.
 *
 * #1144: after the 4.0.0 rename this file compared `<span x-chip>` with
 * `<span x-chip>` -- the same markup twice, under titles that still promised a
 * `wb-*` tag. The duplicates are folded into one test each.
 */
test.describe('an x-{name} attribute resolves its schema (#521)', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('<span x-chip> builds the chip: class and label', async ({ page }) => {
    // <span x-chip> has no tag to select on, so it needs (and gets, per
    // #521's fix to chip()) the .x-chip class; chip.css styles that class.
    const chip = await setupTestContainer(page, '<span x-chip label="Tag"></span>');
    await expect(chip).toHaveClass(/\bx-chip\b/);
    await expect(chip.locator('.x-chip__label')).toHaveText('Tag');
  });

  test('<span x-chip variant="primary"> gets the modifier class', async ({ page }) => {
    const chip = await setupTestContainer(page, '<span x-chip label="Tag" variant="primary"></span>');
    await expect(chip).toHaveClass(/\bx-chip--primary\b/);
  });

  test('x-ignore opts an x-{name} element out of schema building entirely', async ({ page }) => {
    const ignored = await setupTestContainer(page, '<span x-chip x-ignore label="Tag"></span>');
    await expect(ignored).not.toHaveClass(/\bx-chip\b/);
    await expect(ignored.locator('.x-chip__label')).toHaveCount(0);
  });
});
