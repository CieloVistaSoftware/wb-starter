import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live report: "<div x-carddraggable axis="both">This is example
 * draggable card content.</div> shouldn't this text be seen
 * in the card?" -- confirmed live, it was not.
 *
 * Same root cause as #455 (cardhorizontal): composeCard()'s own generic
 * `content` resolution only reads a `content="..."` ATTRIBUTE, never
 * element.innerHTML. carddraggable() never captured innerHTML as a
 * fallback the way cardhorizontal()/cardimage()/cardvideo() do, so
 * `element.innerHTML = ''` (run right after config is built) permanently
 * wiped any plain inner text before base.createMain() (which falls back to
 * config.content when called with no args) ever saw it.
 */
test.describe('[x-carddraggable] renders plain inner text as its content (#455-pattern)', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('inner text is preserved in .x-card__main, not silently dropped', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<div x-carddraggable axis="both">This is example draggable card content.</div>'
    );

    const main = el.locator('.x-card__main');
    await expect(main).toBeVisible();
    await expect(main).toContainText('This is example draggable card content.');
  });

  test('a content="..." attribute still works (explicit attribute takes precedence)', async ({ page }) => {
    const el = await setupTestContainer(
      page,
      '<div x-carddraggable content="Explicit content attribute"></div>'
    );

    const main = el.locator('.x-card__main');
    await expect(main).toContainText('Explicit content attribute');
  });
});
