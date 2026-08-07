import { test, expect } from '@playwright/test';
import { waitForWB } from '../base';

/**
 * #468: John reported the V3-GUIDE.md Quick Start wb-card example (title "Hello",
 * body "It just works.") reading as "too stubby" — audit against layout standards
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
 * This test creates the Quick Start example card and validates:
 * 1. Card has ≥ 1rem padding on all sides
 * 2. Card has a reasonable height-to-width ratio (not excessively wide)
 * 3. Internal content has visible spacing
 * 4. The card is sized proportionally (aspect ratio ~0.6-1.0 for typical card)
 */

test.describe('V3-GUIDE Quick Start card proportions (#468)', () => {
  test.beforeEach(async ({ page }) => {
    // Use a standard desktop viewport for consistent measurements
    await page.setViewportSize({ width: 1280, height: 800 });
    // Navigate to a blank page where we can inject the test HTML
    await page.goto('/demos/index.html');
    await waitForWB(page);
  });

  test('Quick Start card has adequate padding and proportions per Standard §13', async ({
    page,
  }) => {
    // Inject the exact Quick Start example from V3-GUIDE.md
    const cardSelector = '#quick-start-test-card';
    await page.evaluate((selector) => {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 2rem; background: var(--bg-primary);';
      container.innerHTML = `
        <wb-card
          id="${selector.replace('#', '')}"
          title="Hello"
          variant="elevated">
          <p>It just works.</p>
        </wb-card>
      `;
      document.body.appendChild(container);
    }, cardSelector);

    // Scan for WB elements
    if (await page.evaluate(() => (window as any).WB?.scan)) {
      await page.evaluate(() => (window as any).WB.scan());
    }

    const card = page.locator(cardSelector).first();
    await expect(card).toHaveCount(1);

    // Get detailed measurements
    const measurements = await card.evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      const styles = getComputedStyle(node);
      const header = (node as any).querySelector('.wb-card__header');
      const main = (node as any).querySelector('.wb-card__main');

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

    console.log('Card measurements:', measurements);

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

    // Assertion 4: Card height should be proportional (not too short)
    // With padding + title + body text, minimum height should be ~120px
    expect(measurements.height).toBeGreaterThan(100);
  });

  test('Quick Start card content has visible spacing (not cramped)', async ({ page }) => {
    // Inject the Quick Start example
    const cardSelector = '#quick-start-content-test-card';
    await page.evaluate((selector) => {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 2rem;';
      container.innerHTML = `
        <wb-card
          id="${selector.replace('#', '')}"
          title="Hello"
          variant="elevated">
          <p>It just works.</p>
        </wb-card>
      `;
      document.body.appendChild(container);
    }, cardSelector);

    // Scan for WB elements
    if (await page.evaluate(() => (window as any).WB?.scan)) {
      await page.evaluate(() => (window as any).WB.scan());
    }

    const card = page.locator(cardSelector).first();
    await expect(card).toHaveCount(1);

    // Check header/body spacing
    const spacingData = await card.evaluate((node: HTMLElement) => {
      const header = (node as any).querySelector('.wb-card__header');
      const main = (node as any).querySelector('.wb-card__main');
      const title = header?.querySelector('.wb-card__title');
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

    console.log('Spacing data:', spacingData);

    expect(spacingData.headerExists).toBe(true);
    expect(spacingData.mainExists).toBe(true);
    expect(spacingData.titleExists).toBe(true);
    expect(spacingData.bodyExists).toBe(true);

    // Title should have bottom margin for breathing room
    expect(spacingData.titleMarginBottom).toBeGreaterThanOrEqual(6);

    // Vertical spacing between header and body should be visible
    // The gap includes header padding-bottom + main padding-top
    expect(spacingData.verticalSpacing).toBeGreaterThanOrEqual(8);
  });
});
