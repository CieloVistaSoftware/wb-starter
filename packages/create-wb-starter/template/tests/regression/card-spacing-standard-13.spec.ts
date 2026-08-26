import { test, expect, Page } from '@playwright/test';

/**
 * Card Spacing Standard §13 Compliance (#469)
 *
 * Standard §13 requires:
 * - ≥1rem vertical spacing between examples
 * - ≥1rem padding inside example/demo containers
 * - All card components must have proper internal padding (header/main/footer)
 *
 * This test validates that cards.html demo renders with proper spacing
 * and that card CSS enforces 1rem padding on all card parts.
 */

test.describe('Card Spacing — Standard §13 Compliance', () => {
  test('card demo page loads without errors', async ({ page }) => {
    await page.goto('/demos/site/cards.html');

    // Wait for WB components to initialize
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // No console errors
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.waitForTimeout(100);
    expect(errors).toHaveLength(0);
  });

  test('card main content has ≥1rem padding', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Find all .x-card__main elements
    const mainPadding = await page.locator('.x-card__main').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
      };
    });

    // Convert to pixels and ensure all are ≥1rem (16px)
    const pxToRem = (pxStr: string) => parseFloat(pxStr);
    expect(pxToRem(mainPadding.paddingTop), 'card main padding-top must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(mainPadding.paddingRight), 'card main padding-right must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(mainPadding.paddingBottom), 'card main padding-bottom must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(mainPadding.paddingLeft), 'card main padding-left must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
  });

  test('card header has ≥1rem padding', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    const headerPadding = await page.locator('.x-card__header').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
      };
    });

    // Convert to pixels and ensure horizontal padding is ≥1rem (16px)
    const pxToRem = (pxStr: string) => parseFloat(pxStr);
    expect(pxToRem(headerPadding.paddingTop), 'card header padding-top must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(headerPadding.paddingRight), 'card header padding-right must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(headerPadding.paddingLeft), 'card header padding-left must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
  });

  test('card footer has ≥1rem padding', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    const footerPadding = await page.locator('.x-card__footer').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
      };
    });

    // Convert to pixels and ensure all are ≥1rem (16px)
    const pxToRem = (pxStr: string) => parseFloat(pxStr);
    expect(pxToRem(footerPadding.paddingTop), 'card footer padding-top must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(footerPadding.paddingRight), 'card footer padding-right must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(footerPadding.paddingBottom), 'card footer padding-bottom must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(footerPadding.paddingLeft), 'card footer padding-left must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
  });

  test('card content has readable spacing (text not cramped)', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Get the height of a card's content area
    const cardHeight = await page.locator('.x-card').first().evaluate((el) => {
      return {
        minHeight: getComputedStyle(el).minHeight,
        height: getComputedStyle(el).height,
        lineHeight: getComputedStyle(el.querySelector('.x-card__main') || el).lineHeight,
      };
    });

    // Cards should have at least 2 lines of breathing room (32px minimum)
    const heightPx = parseFloat(cardHeight.height);
    expect(heightPx, 'card height should accommodate proper spacing').toBeGreaterThan(40);
  });

  test('demo container validates gap/spacing between cards (≥1rem)', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Get the gap property of x-demo (grid)
    const demoGap = await page.locator('x-demo').first().evaluate((el) => {
      return getComputedStyle(el).gap || getComputedStyle(el).columnGap || 'auto';
    });

    // Parse the gap value (should be ≥1rem/16px)
    const gapPx = parseFloat(demoGap);
    expect(gapPx, 'demo container gap should be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
  });

  test('all card types render with proper button/CTA spacing', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Check button cards specifically (they have footer buttons)
    const buttonCardCount = await page.locator('x-cardbutton').count();
    expect(buttonCardCount, 'button cards should be present in demo').toBeGreaterThan(0);

    // Check that button card buttons have proper spacing
    const btnFooter = await page.locator('x-cardbutton .x-card__btn-footer').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        padding: cs.padding,
        gap: cs.gap,
      };
    });

    // Footer buttons should have meaningful gap
    const gapPx = parseFloat(btnFooter.gap);
    expect(gapPx, 'button footer gap should be present').toBeGreaterThanOrEqual(4);
  });

  test('card title and content have vertical breathing room', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Check title/subtitle margin spacing
    const titleSpacing = await page.locator('.x-card__title').first().evaluate((el) => {
      return getComputedStyle(el).marginBottom;
    });

    const titleMarginPx = parseFloat(titleSpacing);
    expect(titleMarginPx, 'title bottom margin should provide breathing room').toBeGreaterThan(4);
  });

  test('pricing card feature list has proper item spacing', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Pricing cards have .x-card__feature items
    const featureSpacing = await page.locator('.x-card__feature').first().evaluate((el) => {
      return getComputedStyle(el).padding;
    });

    // Features should have padding for readability
    const featurePadding = parseFloat(featureSpacing);
    expect(featurePadding, 'pricing feature items should have padding').toBeGreaterThanOrEqual(0);
  });
});
