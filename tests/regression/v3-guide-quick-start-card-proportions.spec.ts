import { test, expect } from '@playwright/test';
/**
 * #468: John reported the V3-GUIDE.md Quick Start x-card example reading as
 * "too stubby" — audit the actual live demo against layout standards
 * (Standard §13).
 *
 * Standard §13: Every example has proper margins & padding
 * - No cramped, zero-spacing layouts
 * - Examples and containers have visible breathing room: ≥ 1rem vertical spacing
 *   between examples, and ≥ 1rem padding inside example/demo containers
 * - Spacing comes from theme/spacing variables, not ad-hoc values
 *
 * "Too stubby" typically means:
 * 1. Card is too wide relative to its height (bad aspect ratio)
 * 2. Card has insufficient internal padding/spacing
 * 3. Content is cramped with no breathing room
 *
 * This test loads the Quick Start example from the guide and validates:
 * 1. Card has ≥ 1rem padding on all sides
 * 2. Card has a reasonable height-to-width ratio (not excessively wide)
 * 3. Internal content has visible spacing
 * 4. The live demo also exposes the matching source code
 */

test.describe('V3-GUIDE Quick Start card proportions (#468)', () => {
  test.beforeEach(async ({ page }) => {
    // Use a standard desktop viewport for consistent measurements
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/public/doc-viewer.html?file=%2Fdocs%2FV3-GUIDE.md', {
      waitUntil: 'domcontentloaded',
    });
  });

  test('Quick Start card has adequate padding and proportions per Standard §13', async ({
    page,
  }) => {
    const demo = page.locator('[x-demo]').filter({
      has: page.locator('x-card[title="Build resilient interfaces"]'),
    }).first();
    await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 20000 });
    await expect(demo.locator('.x-demo__code, pre').first()).toBeVisible();

    const card = demo.locator('.x-demo__grid .x-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.x-card__title')).toHaveText('Build resilient interfaces');
    await expect(card.locator('.x-card__subtitle')).toHaveText('Separate structure from behavior');
    await expect(card.locator('.x-card__main')).toContainText('Keep content readable and focused');
    await expect(card.locator('.x-card__main')).toContainText('applies behavior directly to the element');

    // Get detailed measurements
    const measurements = await card.evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      const styles = getComputedStyle(node);
      const header = (node as any).querySelector('.x-card__header');
      const main = (node as any).querySelector('.x-card__main');

      // Parse padding values (handle rem, px, etc.)
      const parseSize = (value: string) => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      };

      const headerPaddingLeft = header
        ? parseSize(getComputedStyle(header).paddingLeft)
        : 0;
      const headerPaddingRight = header
        ? parseSize(getComputedStyle(header).paddingRight)
        : 0;
      const headerPaddingTop = header
        ? parseSize(getComputedStyle(header).paddingTop)
        : 0;
      const headerPaddingBottom = header
        ? parseSize(getComputedStyle(header).paddingBottom)
        : 0;

      const mainPaddingLeft = main
        ? parseSize(getComputedStyle(main).paddingLeft)
        : 0;
      const mainPaddingRight = main
        ? parseSize(getComputedStyle(main).paddingRight)
        : 0;
      const mainPaddingTop = main
        ? parseSize(getComputedStyle(main).paddingTop)
        : 0;
      const mainPaddingBottom = main
        ? parseSize(getComputedStyle(main).paddingBottom)
        : 0;

      return {
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.height / rect.width,
        paddingLeft: parseSize(styles.paddingLeft),
        paddingRight: parseSize(styles.paddingRight),
        paddingTop: parseSize(styles.paddingTop),
        paddingBottom: parseSize(styles.paddingBottom),
        headerPaddingLeft,
        headerPaddingRight,
        headerPaddingTop,
        headerPaddingBottom,
        mainPaddingLeft,
        mainPaddingRight,
        mainPaddingTop,
        mainPaddingBottom,
        minWidth: parseSize(styles.minWidth),
        maxWidth: parseSize(styles.maxWidth),
        borderRadius: styles.borderRadius,
      };
    });

    // Assertion 1: Card must have 1rem (16px) padding in header/main
    // Standard §13 requires ≥ 1rem padding inside containers
    expect(measurements.headerPaddingLeft).toBeGreaterThanOrEqual(15); // ~1rem tolerance
    expect(measurements.headerPaddingRight).toBeGreaterThanOrEqual(15);
    expect(measurements.headerPaddingTop).toBeGreaterThanOrEqual(15);
    expect(measurements.mainPaddingLeft).toBeGreaterThanOrEqual(15);
    expect(measurements.mainPaddingRight).toBeGreaterThanOrEqual(15);
    expect(measurements.mainPaddingTop).toBeGreaterThanOrEqual(15);
    expect(measurements.mainPaddingBottom).toBeGreaterThanOrEqual(15);

    // Assertion 2: Card should not be "too stubby" (too wide relative to height)
    // A reasonable card aspect ratio is between 0.4 and 1.2 (height/width)
    // "Too stubby" means aspect ratio < 0.3 (card is 3+ times wider than tall)
    expect(measurements.aspectRatio).toBeGreaterThan(0.3);
    expect(measurements.aspectRatio).toBeLessThan(1.5);

    // Assertion 3: Card width should be reasonable (not collapsed, not massive)
    // For a Quick Start example, typical width is 250-400px
    expect(measurements.width).toBeGreaterThan(200);
    expect(measurements.width).toBeLessThan(600);

    // Assertion 4: Card height should reflect its meaningful authored content.
    expect(measurements.height).toBeGreaterThan(180);
  });

  test('Quick Start card content has visible spacing (not cramped)', async ({ page }) => {
    const demo = page.locator('[x-demo]').filter({
      has: page.locator('x-card[title="Build resilient interfaces"]'),
    }).first();
    await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 20000 });
    const card = demo.locator('.x-demo__grid .x-card').first();
    await expect(card).toBeVisible();

    // Check header/body spacing
    const spacingData = await card.evaluate((node: HTMLElement) => {
      const header = (node as any).querySelector('.x-card__header');
      const main = (node as any).querySelector('.x-card__main');
      const title = header?.querySelector('.x-card__title');
      const body = main?.querySelector('p');

      const titleRect = title?.getBoundingClientRect();
      const bodyRect = body?.getBoundingClientRect();

      return {
        headerExists: !!header,
        mainExists: !!main,
        titleExists: !!title,
        bodyExists: !!body,
        titleMarginBottom: title
          ? parseFloat(getComputedStyle(title).marginBottom)
          : 0,
        bodyMarginTop: body ? parseFloat(getComputedStyle(body).marginTop) : 0,
        bodyLineHeight: body
          ? parseFloat(getComputedStyle(body).lineHeight)
          : 0,
        verticalSpacing: titleRect && bodyRect ? bodyRect.top - titleRect.bottom : 0,
      };
    });

    expect(spacingData.headerExists).toBe(true);
    expect(spacingData.mainExists).toBe(true);
    expect(spacingData.titleExists).toBe(true);
    expect(spacingData.bodyExists).toBe(true);

    // Title should have bottom margin for breathing room
    expect(spacingData.titleMarginBottom).toBeGreaterThanOrEqual(6);

    // Vertical spacing between header and body should be visible
    // The gap includes header padding-bottom + main padding-top
    expect(spacingData.verticalSpacing).toBeGreaterThanOrEqual(8);

    await expect(demo.locator('.x-demo__code, pre').first()).toContainText('Build resilient interfaces');
    await expect(demo.locator('.x-demo__code, pre').first()).toContainText('Keep content readable and focused');
  });

  test('Quick Start card keeps one docs link when its Light DOM is built', async ({ page }) => {
    const demo = page.locator('[x-demo]').filter({
      has: page.locator('x-card[title="Build resilient interfaces"]'),
    }).first();
    await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 20000 });

    const card = demo.locator('.x-demo__grid .x-card').first();
    await expect(card.locator('.x-card__main')).toContainText('Keep content readable and focused');
    await expect(card.locator('.x-demo__card-doc-link')).toHaveCount(1);
  });
});
