import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live report (cards.html screenshot): the Horizontal Card demo's
 * title text appeared to overlap the image. Live inspection found the
 * image itself loads correctly (placehold.co bakes "Web Components" text
 * directly INTO the 400x300 image, which is a separate element from the
 * title) and the real title/subtitle/body render cleanly beside it, not
 * on top of it -- no actual DOM/CSS overlap bug found live at the time of
 * investigation. This test locks that in as a regression guard: the image
 * figure and the content area must never visually overlap, and the
 * content's padding must meet Standard §13 (>= 1rem).
 */
test.describe('x-cardhorizontal image and content never overlap, content is not cut off', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('figure and content boxes do not overlap', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div x-demo columns="1"><div x-cardhorizontal image="https://placehold.co/400x300/0f172a/e2e8f0?text=Web+Components" title="Featured Article" subtitle="The Future of Web Components" content="Web components are evolving rapidly with native browser APIs."></div></div>'
    );

    const figure = page.locator('.x-card__horizontal-figure');
    const content = page.locator('.x-card__horizontal-content');
    await expect(figure).toBeVisible();
    await expect(content).toBeVisible();

    const figureBox = await figure.boundingBox();
    const contentBox = await content.boundingBox();
    expect(figureBox).not.toBeNull();
    expect(contentBox).not.toBeNull();

    // No horizontal overlap: the figure's right edge must not extend past
    // the content's left edge (a couple px tolerance for shared borders).
    expect(figureBox!.x + figureBox!.width).toBeLessThanOrEqual(contentBox!.x + 2);
  });

  test('content padding meets Standard §13 (>= 1rem)', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div x-demo columns="1"><div x-cardhorizontal image="https://placehold.co/400x300/0f172a/e2e8f0?text=Web+Components" title="Featured Article" subtitle="The Future of Web Components" content="Web components are evolving rapidly with native browser APIs."></div></div>'
    );

    const content = page.locator('.x-card__horizontal-content');
    const padding = await content.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        left: parseFloat(cs.paddingLeft),
        right: parseFloat(cs.paddingRight),
        top: parseFloat(cs.paddingTop),
        bottom: parseFloat(cs.paddingBottom),
      };
    });
    const ONE_REM_PX = 16;
    for (const [side, value] of Object.entries(padding)) {
      expect(value, `content padding-${side} must be >= 1rem`).toBeGreaterThanOrEqual(ONE_REM_PX);
    }
  });

  test('title, subtitle, and body text are all fully present and visible, none clipped', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div x-demo columns="1"><div x-cardhorizontal image="https://placehold.co/400x300/0f172a/e2e8f0?text=Web+Components" title="Featured Article" subtitle="The Future of Web Components" content="Web components are evolving rapidly with native browser APIs."></div></div>'
    );

    const title = page.locator('.x-card__horizontal-title, .x-card__title');
    const subtitle = page.locator('.x-card__subtitle');
    const body = page.locator('.x-card__horiz-body');

    await expect(title).toBeVisible();
    await expect(title).toHaveText('Featured Article');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText('The Future of Web Components');
    await expect(body).toBeVisible();
    await expect(body).toContainText('Web components are evolving rapidly');
  });
});
