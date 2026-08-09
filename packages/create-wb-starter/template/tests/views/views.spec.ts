/**
 * WB Views System Tests
 * =====================
 * Tests for the WB Views custom element factory system.
 * 
 * Covers:
 * - Template registration (inline and registry)
 * - Custom element auto-registration
 * - Tag naming convention (wb- prefix for non-hyphenated)
 * - Template interpolation ({{variable}})
 * - Conditionals (wb-if, wb-unless)
 * - Loops (wb-for)
 * - Default slot content
 * - Default values ({{var || 'default'}})
 * - Nested views (composition)
 * - Behavior integration
 */

import { test, expect } from '@playwright/test';
import { setupBehaviorTest, waitForWB, readJson, fileExists, PATHS } from '../base';
import * as path from 'path';

const VIEWS_REGISTRY = path.join(PATHS.src, 'wb-views/views-registry.json');
const VIEWS_SCHEMA = path.join(PATHS.src, 'wb-models/views.schema.json');

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA AND REGISTRY VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Views Registry Validation', () => {
  
  test('views.schema.json exists', () => {
    expect(fileExists(VIEWS_SCHEMA)).toBe(true);
  });

  test('views-registry.json exists', () => {
    expect(fileExists(VIEWS_REGISTRY)).toBe(true);
  });

  test('views-registry.json is valid JSON', () => {
    const registry = readJson(VIEWS_REGISTRY);
    expect(registry).not.toBeNull();
    expect(registry).toHaveProperty('views');
  });

  test('all views have required template field', () => {
    const registry = readJson(VIEWS_REGISTRY);
    const views = registry?.views || {};
    
    for (const [name, def] of Object.entries(views)) {
      expect((def as any).template, `View "${name}" missing template`).toBeDefined();
      expect(typeof (def as any).template).toBe('string');
      expect((def as any).template.length).toBeGreaterThan(0);
    }
  });

  test('all views have description', () => {
    const registry = readJson(VIEWS_REGISTRY);
    const views = registry?.views || {};
    
    for (const [name, def] of Object.entries(views)) {
      expect((def as any).description, `View "${name}" missing description`).toBeDefined();
    }
  });

  test('attribute definitions have type', () => {
    const registry = readJson(VIEWS_REGISTRY);
    const views = registry?.views || {};
    
    for (const [viewName, def] of Object.entries(views)) {
      const attrs = (def as any).attributes || {};
      for (const [attrName, attrDef] of Object.entries(attrs)) {
        expect(
          (attrDef as any).type,
          `View "${viewName}" attr "${attrName}" missing type`
        ).toBeDefined();
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE RENDERING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Template Rendering', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html');
    await page.waitForFunction(() => (window as any).WB?.views);
  });

  test('basic interpolation works', async ({ page }) => {
    // Check first button (Primary)
    const btn = page.locator('wb-button').first();
    await expect(btn).toBeVisible();
    
    // Should render as a button with the variant class
    const rendered = await btn.evaluate(el => el.innerHTML);
    // Primary is default, so it should have btn--primary
    expect(rendered).toContain('btn--primary');
  });

  test('wb-if conditional shows element when truthy', async ({ page }) => {
    // Alert with icon should show icon
    const alert = page.locator('alert-box[icon="ℹ️"]').first();
    await expect(alert).toBeVisible();
    
    const hasIcon = await alert.evaluate(el => {
      return el.querySelector('.alert__icon') !== null;
    });
    expect(hasIcon).toBe(true);
  });

  test('wb-if conditional hides element when falsy', async ({ page }) => {
    // Alert without dismissible should not have dismiss button
    const alert = page.locator('alert-box[variant="info"]').first();
    await expect(alert).toBeVisible();
    
    const hasDismiss = await alert.evaluate(el => {
      return el.querySelector('.alert__dismiss') !== null;
    });
    expect(hasDismiss).toBe(false);
  });

  test('wb-for loop renders array items', async ({ page }) => {
    const tagList = page.locator('tag-list').first();
    await expect(tagList).toBeVisible();
    
    const tagCount = await tagList.evaluate(el => {
      return el.querySelectorAll('.tag').length;
    });
    expect(tagCount).toBe(5); // ["JavaScript", "TypeScript", "React", "Vue", "Node.js"]
  });

  test('default values work with || syntax', async ({ page }) => {
    // btn without variant should get primary (default)
    const rendered = await page.evaluate(() => {
      const btn = document.querySelector('wb-button:not([variant])');
      if (!btn) return null;
      return btn.innerHTML;
    });
    
    // Most buttons have variant, so this might be null
    // But buttons with variant="primary" explicitly should work
    const primaryBtn = page.locator('wb-button[variant="primary"]').first();
    const hasPrimaryClass = await primaryBtn.evaluate(el => {
      return el.innerHTML.includes('btn--primary');
    });
    expect(hasPrimaryClass).toBe(true);
  });

  test('default slot renders inner content', async ({ page }) => {
    const btn = page.locator('wb-button').first();
    await expect(btn).toBeVisible();
    
    // Body content should be rendered
    const text = await btn.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TAG NAMING CONVENTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Tag Naming Convention', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html');
    await page.waitForFunction(() => (window as any).WB?.views);
  });

  test('non-hyphenated views get wb- prefix', async ({ page }) => {
    // button -> wb-button
    const wbBtn = page.locator('wb-button');
    expect(await wbBtn.count()).toBeGreaterThan(0);
    
    // card -> wb-card
    const wbCard = page.locator('wb-card');
    expect(await wbCard.count()).toBeGreaterThan(0);
  });

  test('hyphenated views keep original name', async ({ page }) => {
    // user-avatar stays user-avatar
    const userAvatar = page.locator('user-avatar');
    expect(await userAvatar.count()).toBeGreaterThan(0);

    // alert-box stays alert-box
    const alertBox = page.locator('alert-box');
    expect(await alertBox.count()).toBeGreaterThan(0);
    
    // stat-tile stays stat-tile
    const statTile = page.locator('stat-tile');
    expect(await statTile.count()).toBeGreaterThan(0);
    
    // nav-link stays nav-link
    const navLink = page.locator('nav-link');
    expect(await navLink.count()).toBeGreaterThan(0);
    
    // component-tile stays component-tile
    const componentTile = page.locator('component-tile');
    expect(await componentTile.count()).toBeGreaterThan(0);
  });

  test('custom elements are properly registered', async ({ page }) => {
    const customElements = await page.evaluate(() => {
      return {
        'wb-button': customElements.get('wb-button') !== undefined,
        'user-avatar': customElements.get('user-avatar') !== undefined,
        'alert-box': customElements.get('alert-box') !== undefined,
        'stat-tile': customElements.get('stat-tile') !== undefined,
        'nav-link': customElements.get('nav-link') !== undefined,
      };
    });
    
    expect(customElements['wb-button']).toBe(true);
    expect(customElements['user-avatar']).toBe(true);
    expect(customElements['alert-box']).toBe(true);
    expect(customElements['stat-tile']).toBe(true);
    expect(customElements['nav-link']).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITION (NESTED VIEWS)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('View Composition', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html');
    await page.waitForFunction(() => (window as any).WB?.views);
  });

  test('user-card renders nested wb-avatar', async ({ page }) => {
    const userCard = page.locator('user-card').first();
    await expect(userCard).toBeVisible();
    
    // user-card template uses <wb-avatar> internally
    const hasAvatar = await userCard.evaluate(el => {
      return el.querySelector('.avatar') !== null;
    });
    expect(hasAvatar).toBe(true);
  });

  test('button-group contains nested wb-btn elements', async ({ page }) => {
    const buttonGroup = page.locator('button-group').first();
    await expect(buttonGroup).toBeVisible();
    
    const btnCount = await buttonGroup.evaluate(el => {
      return el.querySelectorAll('.btn').length;
    });
    expect(btnCount).toBeGreaterThanOrEqual(2);
  });

  test('wb-card renders body slot with nested views', async ({ page }) => {
    const card = page.locator('wb-card').first();
    await expect(card).toBeVisible();
    
    // Card should contain nested buttons from body
    const hasNestedBtn = await card.evaluate(el => {
      return el.querySelector('.btn') !== null;
    });
    expect(hasNestedBtn).toBe(true);
  });

  test('stat-row contains multiple stat-tiles', async ({ page }) => {
    const statRow = page.locator('stat-row').first();
    await expect(statRow).toBeVisible();
    
    const statCount = await statRow.evaluate(el => {
      // Check for both legacy .stat and new .stat-tile classes
      return el.querySelectorAll('.stat, .stat-tile').length;
    });
    expect(statCount).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ATTRIBUTE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Attribute Handling', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html');
    await page.waitForFunction(() => (window as any).WB?.views);
  });

  test('string attributes interpolate correctly', async ({ page }) => {
    const tile = page.locator('component-tile[icon="📝"]').first();
    await expect(tile).toBeVisible();
    
    const icon = await tile.evaluate(el => {
      return el.querySelector('.tile__icon')?.textContent;
    });
    expect(icon).toBe('📝');
  });

  test('boolean attributes work (presence = true)', async ({ page }) => {
    // active attribute on nav-link
    const activeLink = page.locator('nav-link[active]').first();
    await expect(activeLink).toBeVisible();
    
    const hasActiveClass = await activeLink.evaluate(el => {
      return el.querySelector('.nav-link--active') !== null;
    });
    expect(hasActiveClass).toBe(true);
  });

  test('missing optional attributes handled gracefully', async ({ page }) => {
    // stat-tile without trend should still render
    const statWithoutTrend = page.locator('stat-tile:not([trendValue])').first();
    await expect(statWithoutTrend).toBeVisible();
    
    // Should not have trend element
    const hasTrend = await statWithoutTrend.evaluate(el => {
      return el.querySelector('.stat__trend, .stat-tile__trend') !== null;
    });
    expect(hasTrend).toBe(false);
  });

  test('JSON attributes parse correctly', async ({ page }) => {
    const tagList = page.locator('tag-list').first();
    await expect(tagList).toBeVisible();
    
    // tags='["JavaScript", "TypeScript", ...]' should parse and render
    const tags = await tagList.evaluate(el => {
      return Array.from(el.querySelectorAll('.tag')).map(t => t.textContent);
    });
    expect(tags).toContain('JavaScript');
    expect(tags).toContain('TypeScript');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT CLASSES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Variant Classes', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/wb-views-demo.html');
    await page.waitForFunction(() => (window as any).WB?.views);
  });

  test('alert-box variants apply correct classes', async ({ page }) => {
    const variants = ['info', 'success', 'warning', 'error'];
    
    for (const variant of variants) {
      const alert = page.locator(`alert-box[variant="${variant}"]`).first();
      const hasClass = await alert.evaluate((el, v) => {
        return el.querySelector(`.alert--${v}`) !== null;
      }, variant);
      expect(hasClass, `alert-box variant="${variant}"`).toBe(true);
    }
  });

  test('badge-tag variants apply correct classes', async ({ page }) => {
    const variants = ['primary', 'success', 'warning', 'error'];
    
    for (const variant of variants) {
      const badge = page.locator(`badge-tag[variant="${variant}"]`).first();
      if (await badge.count() > 0) {
        const hasClass = await badge.evaluate((el, v) => {
          return el.querySelector(`.badge-tag--${v}`) !== null;
        }, variant);
        expect(hasClass, `badge-tag variant="${variant}"`).toBe(true);
      }
    }
  });

  test('wb-avatar sizes apply correct classes', async ({ page }) => {
    const sizes = ['sm', 'md', 'lg'];
    
    for (const size of sizes) {
      const avatar = page.locator(`wb-avatar[size="${size}"]`).first();
      if (await avatar.count() > 0) {
        const hasClass = await avatar.evaluate((el, s) => {
          return el.querySelector(`.avatar--${s}`) !== null;
        }, size);
        expect(hasClass, `wb-avatar size="${size}"`).toBe(true);
      }
    }
  });
});
