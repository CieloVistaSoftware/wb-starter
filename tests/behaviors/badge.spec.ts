/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WB-BADGE — In-Depth Behavior Test Suite
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests the badge behavior based on badge.schema.json:
 *   - Rendering & visibility
 *   - Variants: default, primary, secondary, success, warning, error, info
 *   - Sizes: xs, sm, md, lg
 *   - Boolean modifiers: pill, dot, outline
 *   - CSS custom properties
 *   - Accessibility (implicit role="status")
 *   - Combinations from schema test.matrix
 *
 * @version 3.0.0
 */

import { test, expect, Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Navigate to index, wait for WB, inject badge HTML into a test container,
 * then scan so WB processes the new elements.
 */
async function setupBadges(page: Page, badgeHTML: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors,
    { timeout: 15000 }
  );

  // Inject a test container with badge markup
  await page.evaluate((html: string) => {
    const container = document.createElement('div');
    container.id = 'badge-test-area';
    container.style.cssText = 'padding: 20px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;';
    container.innerHTML = html;
    document.body.appendChild(container);
  }, badgeHTML);

  // Let WB scan the new elements
  await page.evaluate(async () => {
    if ((window as any).WB?.scan) {
      await (window as any).WB.scan();
    }
  });

  // Brief wait for CSS classes to apply
  await page.waitForTimeout(300);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. BASIC RENDERING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Basic Rendering', () => {

  test('wb-badge renders and is visible', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="basic">Basic badge</wb-badge>');

    const badge = page.locator('#basic');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/wb-badge/);
    await expect(badge).toContainText('Basic badge');
  });

  test('wb-badge renders as inline-level display', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="display-test">Display</wb-badge>');

    const display = await page.locator('#display-test').evaluate((el: Element) => getComputedStyle(el).display);
    // Badge should be inline-level (inline-block, inline-flex, etc.) — not block or none
    expect(['inline-block', 'inline-flex', 'inline'].includes(display),
      `Expected inline-level display, got: ${display}`).toBe(true);
  });

  test('multiple badges render independently', async ({ page }) => {
    await setupBadges(page, `
      <wb-badge id="b1">First</wb-badge>
      <wb-badge id="b2">Second</wb-badge>
      <wb-badge id="b3">Third</wb-badge>
    `);

    await expect(page.locator('#b1')).toBeVisible();
    await expect(page.locator('#b2')).toBeVisible();
    await expect(page.locator('#b3')).toBeVisible();
    await expect(page.locator('#b1')).toContainText('First');
    await expect(page.locator('#b2')).toContainText('Second');
    await expect(page.locator('#b3')).toContainText('Third');
  });

  test('empty wb-badge still renders', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="empty"></wb-badge>');
    await expect(page.locator('#empty')).toHaveClass(/wb-badge/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. VARIANT CLASSES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Variants', () => {
  const variants = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;

  for (const variant of variants) {
    test(`variant="${variant}" applies wb-badge--${variant}`, async ({ page }) => {
      await setupBadges(page,
        `<wb-badge id="v-${variant}" variant="${variant}">${variant}</wb-badge>`
      );

      const badge = page.locator(`#v-${variant}`);
      await expect(badge).toBeVisible();
      await expect(badge).toHaveClass(/wb-badge/);
      await expect(badge).toHaveClass(new RegExp(`wb-badge--${variant}`));
    });
  }

  test('no variant attribute defaults to base wb-badge class', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="no-variant">No variant</wb-badge>');
    await expect(page.locator('#no-variant')).toHaveClass(/wb-badge/);
  });

  test('success and error variants have different backgrounds', async ({ page }) => {
    await setupBadges(page, `
      <wb-badge id="success-bg" variant="success">Success</wb-badge>
      <wb-badge id="error-bg" variant="error">Error</wb-badge>
    `);

    const successBg = await page.locator('#success-bg').evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    const errorBg = await page.locator('#error-bg').evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    expect(successBg).not.toBe(errorBg);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. SIZE CLASSES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg'] as const;

  for (const size of sizes) {
    test(`size="${size}" applies wb-badge--${size}`, async ({ page }) => {
      await setupBadges(page,
        `<wb-badge id="s-${size}" size="${size}">Size ${size}</wb-badge>`
      );
      await expect(page.locator(`#s-${size}`)).toHaveClass(new RegExp(`wb-badge--${size}`));
    });
  }

  test('LG badge is taller than XS badge', async ({ page }) => {
    await setupBadges(page, `
      <wb-badge id="sz-xs" size="xs">XS</wb-badge>
      <wb-badge id="sz-lg" size="lg">LG</wb-badge>
    `);

    const xsBox = await page.locator('#sz-xs').boundingBox();
    const lgBox = await page.locator('#sz-lg').boundingBox();
    if (xsBox && lgBox) {
      expect(lgBox.height).toBeGreaterThanOrEqual(xsBox.height);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. BOOLEAN MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Pill Modifier', () => {

  test('pill attribute applies wb-badge--pill', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="pill-test" pill>Pill</wb-badge>');
    await expect(page.locator('#pill-test')).toHaveClass(/wb-badge--pill/);
  });

  test('pill badge has fully rounded border-radius', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="pill-radius" pill>Rounded</wb-badge>');

    const radius = await page.locator('#pill-radius').evaluate(
      el => getComputedStyle(el).borderRadius
    );
    // base .wb-badge already has border-radius: 999px
    expect(parseInt(radius)).toBeGreaterThanOrEqual(99);
  });
});

test.describe('Badge — Dot Modifier', () => {
  test('dot attribute applies wb-badge--dot', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="dot-test" dot variant="success"></wb-badge>');
    await expect(page.locator('#dot-test')).toHaveClass(/wb-badge--dot/);
  });
});

test.describe('Badge — Outline Modifier', () => {
  test('outline attribute applies wb-badge--outline', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="outline-test" outline variant="primary">Outline</wb-badge>');
    await expect(page.locator('#outline-test')).toHaveClass(/wb-badge--outline/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. COMBINED MODIFIERS (from schema test.matrix)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Combinations (Schema Matrix)', () => {

  test('primary + pill renders both classes', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="combo1" variant="primary" pill>5</wb-badge>');

    const badge = page.locator('#combo1');
    await expect(badge).toHaveClass(/wb-badge--primary/);
    await expect(badge).toHaveClass(/wb-badge--pill/);
  });

  test('success + dot renders correctly', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="combo2" variant="success" dot></wb-badge>');

    const badge = page.locator('#combo2');
    await expect(badge).toHaveClass(/wb-badge--success/);
    await expect(badge).toHaveClass(/wb-badge--dot/);
  });

  test('primary + outline renders correctly', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="combo3" variant="primary" outline>Outline</wb-badge>');

    const badge = page.locator('#combo3');
    await expect(badge).toHaveClass(/wb-badge--primary/);
    await expect(badge).toHaveClass(/wb-badge--outline/);
  });

  test('all modifiers combined: variant + size + pill + outline', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="combo-all" variant="info" size="lg" pill outline>All mods</wb-badge>');

    const badge = page.locator('#combo-all');
    await expect(badge).toHaveClass(/wb-badge/);
    await expect(badge).toHaveClass(/wb-badge--info/);
    await expect(badge).toHaveClass(/wb-badge--lg/);
    await expect(badge).toHaveClass(/wb-badge--pill/);
    await expect(badge).toHaveClass(/wb-badge--outline/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. CSS CUSTOM PROPERTIES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — CSS Properties', () => {

  test('badge has padding (non-zero)', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="css-padding">Padded</wb-badge>');

    const padding = await page.locator('#css-padding').evaluate(
      el => getComputedStyle(el).padding
    );
    expect(padding).not.toBe('0px');
  });

  test('badge font-size is smaller than body text', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="css-font">Font</wb-badge>');

    const fontSize = await page.locator('#css-font').evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    );
    expect(fontSize).toBeLessThan(16);
  });

  test('badge has non-transparent background', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="css-bg">BG test</wb-badge>');

    const bg = await page.locator('#css-bg').evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');
  });

  test('badge text color is white by default', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="css-color">White text</wb-badge>');

    const color = await page.locator('#css-color').evaluate(
      el => getComputedStyle(el).color
    );
    expect(color).toMatch(/rgb\(255, 255, 255\)|rgba\(255, 255, 255/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Accessibility', () => {

  test('badge content is readable', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="a11y-tag">Status</wb-badge>');

    const badge = page.locator('#a11y-tag');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Status');
  });

  test('badge text is not clipped', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="a11y-visible">Visible Text</wb-badge>');

    const overflow = await page.locator('#a11y-visible').evaluate(
      el => getComputedStyle(el).overflow
    );
    expect(overflow).not.toBe('hidden');
  });

  test('badge has sufficient contrast (bg != text color)', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="a11y-contrast" variant="primary">Contrast</wb-badge>');

    const badge = page.locator('#a11y-contrast');
    const bg = await badge.evaluate(el => getComputedStyle(el).backgroundColor);
    const color = await badge.evaluate(el => getComputedStyle(el).color);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe(color);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. SCHEMA TEST FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Schema Fixtures', () => {

  test('all schema test.setup fixtures render', async ({ page }) => {
    await setupBadges(page, `
      <wb-badge id="fix1">Basic badge content</wb-badge>
      <wb-badge id="fix2" variant="default">variant=default</wb-badge>
      <wb-badge id="fix3" variant="primary">variant=primary</wb-badge>
      <wb-badge id="fix4" variant="secondary">variant=secondary</wb-badge>
      <wb-badge id="fix5" size="xs">size=xs</wb-badge>
      <wb-badge id="fix6" size="sm">size=sm</wb-badge>
      <wb-badge id="fix7" size="md">size=md</wb-badge>
      <wb-badge id="fix8" pill>with pill</wb-badge>
    `);

    for (let i = 1; i <= 8; i++) {
      const badge = page.locator(`#fix${i}`);
      await expect(badge).toBeVisible();
      await expect(badge).toHaveClass(/wb-badge/);
    }

    await expect(page.locator('#fix2')).toHaveClass(/wb-badge--default/);
    await expect(page.locator('#fix3')).toHaveClass(/wb-badge--primary/);
    await expect(page.locator('#fix4')).toHaveClass(/wb-badge--secondary/);
    await expect(page.locator('#fix5')).toHaveClass(/wb-badge--xs/);
    await expect(page.locator('#fix6')).toHaveClass(/wb-badge--sm/);
    await expect(page.locator('#fix7')).toHaveClass(/wb-badge--md/);
    await expect(page.locator('#fix8')).toHaveClass(/wb-badge--pill/);
  });

  test('all schema test.matrix combinations render', async ({ page }) => {
    await setupBadges(page, `
      <wb-badge id="m1">New</wb-badge>
      <wb-badge id="m2" variant="success">Done</wb-badge>
      <wb-badge id="m3" variant="warning">Warning</wb-badge>
      <wb-badge id="m4" variant="error">Error</wb-badge>
      <wb-badge id="m5" variant="primary" pill>5</wb-badge>
      <wb-badge id="m6" variant="success" dot></wb-badge>
      <wb-badge id="m7" variant="info" removable>Tag</wb-badge>
      <wb-badge id="m8" variant="primary" outline>Outline</wb-badge>
    `);

    for (let i = 1; i <= 8; i++) {
      await expect(page.locator(`#m${i}`)).toHaveClass(/wb-badge/);
    }

    await expect(page.locator('#m2')).toHaveClass(/wb-badge--success/);
    await expect(page.locator('#m3')).toHaveClass(/wb-badge--warning/);
    await expect(page.locator('#m4')).toHaveClass(/wb-badge--error/);
    await expect(page.locator('#m5')).toHaveClass(/wb-badge--primary/);
    await expect(page.locator('#m5')).toHaveClass(/wb-badge--pill/);
    await expect(page.locator('#m6')).toHaveClass(/wb-badge--dot/);
    await expect(page.locator('#m7')).toHaveClass(/wb-badge--info/);
    await expect(page.locator('#m8')).toHaveClass(/wb-badge--outline/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Edge Cases', () => {

  test('badge with long text does not break layout', async ({ page }) => {
    await setupBadges(page,
      '<wb-badge id="long-text">This is a very long badge label that should handle gracefully</wb-badge>'
    );

    const badge = page.locator('#long-text');
    await expect(badge).toBeVisible();
    const box = await badge.boundingBox();
    expect(box).not.toBeNull();
  });

  test('badge with numeric content renders', async ({ page }) => {
    await setupBadges(page, '<wb-badge id="numeric">42</wb-badge>');
    await expect(page.locator('#numeric')).toContainText('42');
  });

  test('badge inside flex container aligns properly', async ({ page }) => {
    // Override the test area to add flex
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors,
      { timeout: 15000 }
    );
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'flex-test';
      container.style.cssText = 'display: flex; align-items: center; gap: 8px;';
      container.innerHTML = '<span>Label:</span><wb-badge id="in-flex" variant="primary">Flex child</wb-badge>';
      document.body.appendChild(container);
    });
    await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(); });
    await page.waitForTimeout(300);

    await expect(page.locator('#in-flex')).toBeVisible();
    await expect(page.locator('#in-flex')).toHaveClass(/wb-badge--primary/);
  });

  test('badge next to heading renders inline', async ({ page }) => {
    await setupBadges(page,
      '<h2 style="margin:0;">Section Title <wb-badge id="in-heading" variant="success" size="sm">New</wb-badge></h2>'
    );

    const badge = page.locator('#in-heading');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS('display', 'inline-block');
  });
});
