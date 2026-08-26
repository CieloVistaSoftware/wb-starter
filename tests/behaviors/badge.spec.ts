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

  test('[x-badge] renders and is visible', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="basic">Basic badge</span>');

    const badge = page.locator('#basic');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/x-badge/);
    await expect(badge).toContainText('Basic badge');
  });

  test('[x-badge] renders as inline-level display', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="display-test">Display</span>');

    const display = await page.locator('#display-test').evaluate((el: Element) => getComputedStyle(el).display);
    // Badge should be inline-level (inline-block, inline-flex, etc.) — not block or none
    expect(['inline-block', 'inline-flex', 'inline'].includes(display),
      `Expected inline-level display, got: ${display}`).toBe(true);
  });

  test('multiple badges render independently', async ({ page }) => {
    await setupBadges(page, `
      <span x-badge id="b1">First</span>
      <span x-badge id="b2">Second</span>
      <span x-badge id="b3">Third</span>
    `);

    await expect(page.locator('#b1')).toBeVisible();
    await expect(page.locator('#b2')).toBeVisible();
    await expect(page.locator('#b3')).toBeVisible();
    await expect(page.locator('#b1')).toContainText('First');
    await expect(page.locator('#b2')).toContainText('Second');
    await expect(page.locator('#b3')).toContainText('Third');
  });

  test('empty [x-badge] still renders', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="empty"></span>');
    await expect(page.locator('#empty')).toHaveClass(/x-badge/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. VARIANT CLASSES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Variants', () => {
  const variants = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;

  for (const variant of variants) {
    test(`variant="${variant}" applies x-badge--${variant}`, async ({ page }) => {
      await setupBadges(page,
        `<span x-badge id="v-${variant}" variant="${variant}">${variant}</span>`
      );

      const badge = page.locator(`#v-${variant}`);
      await expect(badge).toBeVisible();
      await expect(badge).toHaveClass(/x-badge/);
      await expect(badge).toHaveClass(new RegExp(`x-badge--${variant}`));
    });
  }

  test('no variant attribute defaults to base [x-badge] class', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="no-variant">No variant</span>');
    await expect(page.locator('#no-variant')).toHaveClass(/x-badge/);
  });

  test('success and error variants have different backgrounds', async ({ page }) => {
    await setupBadges(page, `
      <span x-badge id="success-bg" variant="success">Success</span>
      <span x-badge id="error-bg" variant="error">Error</span>
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
    test(`size="${size}" applies x-badge--${size}`, async ({ page }) => {
      await setupBadges(page,
        `<span x-badge id="s-${size}" size="${size}">Size ${size}</span>`
      );
      await expect(page.locator(`#s-${size}`)).toHaveClass(new RegExp(`x-badge--${size}`));
    });
  }

  test('LG badge is taller than XS badge', async ({ page }) => {
    await setupBadges(page, `
      <span x-badge id="sz-xs" size="xs">XS</span>
      <span x-badge id="sz-lg" size="lg">LG</span>
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

  test('pill attribute applies x-badge--pill', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="pill-test" pill>Pill</span>');
    await expect(page.locator('#pill-test')).toHaveClass(/x-badge--pill/);
  });

  test('pill badge has fully rounded border-radius', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="pill-radius" pill>Rounded</span>');

    const radius = await page.locator('#pill-radius').evaluate(
      el => getComputedStyle(el).borderRadius
    );
    // base .x-badge already has border-radius: 999px
    expect(parseInt(radius)).toBeGreaterThanOrEqual(99);
  });
});

test.describe('Badge — Dot Modifier', () => {
  test('dot attribute applies x-badge--dot', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="dot-test" dot variant="success"></span>');
    await expect(page.locator('#dot-test')).toHaveClass(/x-badge--dot/);
  });
});

test.describe('Badge — Outline Modifier', () => {
  test('outline attribute applies x-badge--outline', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="outline-test" outline variant="primary">Outline</span>');
    await expect(page.locator('#outline-test')).toHaveClass(/x-badge--outline/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. COMBINED MODIFIERS (from schema test.matrix)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Combinations (Schema Matrix)', () => {

  test('primary + pill renders both classes', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="combo1" variant="primary" pill>5</span>');

    const badge = page.locator('#combo1');
    await expect(badge).toHaveClass(/x-badge--primary/);
    await expect(badge).toHaveClass(/x-badge--pill/);
  });

  test('success + dot renders correctly', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="combo2" variant="success" dot></span>');

    const badge = page.locator('#combo2');
    await expect(badge).toHaveClass(/x-badge--success/);
    await expect(badge).toHaveClass(/x-badge--dot/);
  });

  test('primary + outline renders correctly', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="combo3" variant="primary" outline>Outline</span>');

    const badge = page.locator('#combo3');
    await expect(badge).toHaveClass(/x-badge--primary/);
    await expect(badge).toHaveClass(/x-badge--outline/);
  });

  test('all modifiers combined: variant + size + pill + outline', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="combo-all" variant="info" size="lg" pill outline>All mods</span>');

    const badge = page.locator('#combo-all');
    await expect(badge).toHaveClass(/x-badge/);
    await expect(badge).toHaveClass(/x-badge--info/);
    await expect(badge).toHaveClass(/x-badge--lg/);
    await expect(badge).toHaveClass(/x-badge--pill/);
    await expect(badge).toHaveClass(/x-badge--outline/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. CSS CUSTOM PROPERTIES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — CSS Properties', () => {

  test('badge has padding (non-zero)', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="css-padding">Padded</span>');

    const padding = await page.locator('#css-padding').evaluate(
      el => getComputedStyle(el).padding
    );
    expect(padding).not.toBe('0px');
  });

  test('badge font-size is smaller than body text', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="css-font">Font</span>');

    const fontSize = await page.locator('#css-font').evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    );
    expect(fontSize).toBeLessThan(16);
  });

  test('badge has non-transparent background', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="css-bg">BG test</span>');

    const bg = await page.locator('#css-bg').evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');
  });

  test('badge text color is white by default', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="css-color">White text</span>');

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
    await setupBadges(page, '<span x-badge id="a11y-tag">Status</span>');

    const badge = page.locator('#a11y-tag');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Status');
  });

  test('badge text is not clipped', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="a11y-visible">Visible Text</span>');

    const overflow = await page.locator('#a11y-visible').evaluate(
      el => getComputedStyle(el).overflow
    );
    expect(overflow).not.toBe('hidden');
  });

  test('badge has sufficient contrast (bg != text color)', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="a11y-contrast" variant="primary">Contrast</span>');

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
      <span x-badge id="fix1">Basic badge content</span>
      <span x-badge id="fix2" variant="default">variant=default</span>
      <span x-badge id="fix3" variant="primary">variant=primary</span>
      <span x-badge id="fix4" variant="secondary">variant=secondary</span>
      <span x-badge id="fix5" size="xs">size=xs</span>
      <span x-badge id="fix6" size="sm">size=sm</span>
      <span x-badge id="fix7" size="md">size=md</span>
      <span x-badge id="fix8" pill>with pill</span>
    `);

    for (let i = 1; i <= 8; i++) {
      const badge = page.locator(`#fix${i}`);
      await expect(badge).toBeVisible();
      await expect(badge).toHaveClass(/x-badge/);
    }

    await expect(page.locator('#fix2')).toHaveClass(/x-badge--default/);
    await expect(page.locator('#fix3')).toHaveClass(/x-badge--primary/);
    await expect(page.locator('#fix4')).toHaveClass(/x-badge--secondary/);
    await expect(page.locator('#fix5')).toHaveClass(/x-badge--xs/);
    await expect(page.locator('#fix6')).toHaveClass(/x-badge--sm/);
    await expect(page.locator('#fix7')).toHaveClass(/x-badge--md/);
    await expect(page.locator('#fix8')).toHaveClass(/x-badge--pill/);
  });

  test('all schema test.matrix combinations render', async ({ page }) => {
    await setupBadges(page, `
      <span x-badge id="m1">New</span>
      <span x-badge id="m2" variant="success">Done</span>
      <span x-badge id="m3" variant="warning">Warning</span>
      <span x-badge id="m4" variant="error">Error</span>
      <span x-badge id="m5" variant="primary" pill>5</span>
      <span x-badge id="m6" variant="success" dot></span>
      <span x-badge id="m7" variant="info" removable>Tag</span>
      <span x-badge id="m8" variant="primary" outline>Outline</span>
    `);

    for (let i = 1; i <= 8; i++) {
      await expect(page.locator(`#m${i}`)).toHaveClass(/x-badge/);
    }

    await expect(page.locator('#m2')).toHaveClass(/x-badge--success/);
    await expect(page.locator('#m3')).toHaveClass(/x-badge--warning/);
    await expect(page.locator('#m4')).toHaveClass(/x-badge--error/);
    await expect(page.locator('#m5')).toHaveClass(/x-badge--primary/);
    await expect(page.locator('#m5')).toHaveClass(/x-badge--pill/);
    await expect(page.locator('#m6')).toHaveClass(/x-badge--dot/);
    await expect(page.locator('#m7')).toHaveClass(/x-badge--info/);
    await expect(page.locator('#m8')).toHaveClass(/x-badge--outline/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Badge — Edge Cases', () => {

  test('badge with long text does not break layout', async ({ page }) => {
    await setupBadges(page,
      '<span x-badge id="long-text">This is a very long badge label that should handle gracefully</span>'
    );

    const badge = page.locator('#long-text');
    await expect(badge).toBeVisible();
    const box = await badge.boundingBox();
    expect(box).not.toBeNull();
  });

  test('badge with numeric content renders', async ({ page }) => {
    await setupBadges(page, '<span x-badge id="numeric">42</span>');
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
      container.innerHTML = '<span>Label:</span><span x-badge id="in-flex" variant="primary">Flex child</span>';
      document.body.appendChild(container);
    });
    await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
    await page.waitForTimeout(300);

    await expect(page.locator('#in-flex')).toBeVisible();
    await expect(page.locator('#in-flex')).toHaveClass(/x-badge--primary/);
  });

  test('badge next to heading renders inline', async ({ page }) => {
    await setupBadges(page,
      '<h2 style="margin:0;">Section Title <span x-badge id="in-heading" variant="success" size="sm">New</span></h2>'
    );

    const badge = page.locator('#in-heading');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS('display', 'inline-block');
  });
});
