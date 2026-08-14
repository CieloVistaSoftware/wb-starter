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
    // Used to check <wb-button>'s wb-button--primary CLASS here -- but
    // wb-button is a real MVVM component (src/wb-viewmodels/semantics/
    // button.js), not a wb-views template, as this test's own comment
    // already admitted; that was never actually exercising wb-views'
    // {{...}} interpolation, just src/core/mvvm/schema-builder.js's
    // separate, much slower, network-dependent default-variant-class
    // pipeline (confirmed live: 15-20+ seconds to resolve under this
    // session's load, EVEN for a top-level, non-nested button -- widening
    // the timeout repeatedly never actually made this reliable). price-tag
    // is a genuine wb-view (views-registry.json) with the simplest
    // possible direct interpolation -- {{price}}, no default, no
    // conditional, no loop -- and renders through wb-views' own
    // synchronous-ish interpolate() step, with no external fetch in the
    // critical path at all.
    const tag = page.locator('price-tag').first();
    await expect(tag).toBeVisible();
    await expect(tag.locator('.price-tag__current')).toHaveText('$29');
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
    // This is specifically about wb-views' own {{prop || 'default'}}
    // syntax (interpolate(), src/core/wb-views.js) -- e.g. alert-box's
    // template: class="alert alert--{{variant || 'info'}}" (views-
    // registry.json). Used to check <wb-button>'s wb-button--primary class
    // instead, which is a DIFFERENT mechanism entirely (schema.json
    // `default`, applied by src/core/mvvm/schema-builder.js, not a
    // {{...}} template at all) -- as this test's own prior comment already
    // admitted, and which flaked/timed out repeatedly even at 30s under
    // this session's load, independent of anything this test is actually
    // supposed to verify.
    //
    // No live alert-box on this page happens to OMIT variant (every
    // instance sets it explicitly), so create one fresh, directly -- same
    // technique tests/views/views-permutations.spec.ts already uses,
    // decoupled from page content and from wb-button's unrelated pipeline.
    const hasDefaultClass = await page.evaluate(() => {
      const el = document.createElement('alert-box');
      el.setAttribute('message', 'test');
      document.body.appendChild(el);
      return new Promise((resolve) => {
        setTimeout(() => resolve(el.querySelector('.alert--info') !== null), 200);
      });
    });
    expect(hasDefaultClass, 'alert-box with no variant attribute should fall back to the || default (info)').toBe(true);
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
    // toolbar -> wb-toolbar (file-toolbar's own template composes a real
    // <wb-toolbar> internally, rendered live as part of "Toolbar with
    // Slots"). wb-button/wb-card used to stand in for this check, but
    // neither is actually processed through wb-views' registration path --
    // both are REAL premade components (tag-map.js's elementMap) that
    // wb-views.js's registerViewAsElement() explicitly refuses to touch
    // (confirmed live via its own console warning for <wb-card>) -- their
    // presence never proved the wb- prefix rule, it just coincided with it
    // by name. wb-toolbar is a genuine wb-view, and non-wb-view examples
    // (wb-button's own section) were removed from this page entirely
    // (John: "DON'T SHOW NON WB-VIEWS ON THE WB-VIEWS PAGE").
    const wbToolbar = page.locator('wb-toolbar');
    expect(await wbToolbar.count()).toBeGreaterThan(0);
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
    // <wb-button> (and every other real MVVM component tag reachable from
    // this page's runtime, e.g. <wb-card>) is NOT registered via
    // customElements.define() here -- architecture v3
    // (docs/claude/TIER1-LAWS.md #2) applies capability via behavior
    // functions dispatched by the MVVM schema builder
    // (src/core/mvvm/schema-builder.js) and, on this demo's wb-lazy.js
    // runtime, 'card' resolves to card.js's composeCard() (a plain
    // function, invoked via WB.inject) rather than wb-card.js's WBCard
    // shim class -- wb-lazy.js's own comment confirms it dispatches
    // <wb-card> "as an ordinary injected behavior" instead of registering
    // it. wb-views.js's registerViewAsElement() also explicitly REFUSES to
    // claim any tag already owned by a real component (elementMap in
    // tag-map.js includes both 'wb-button' and 'wb-card') -- confirmed live
    // via its console warning for <wb-card>. So no real (non-view)
    // component tag is a genuine Custom Element on this page; only the
    // wb-views system tags (user-avatar/alert-box/stat-tile/nav-link) are,
    // via wb-views.js's own customElements.define() calls.
    //
    // beforeEach's waitForFunction(() => window.WB?.views) only confirms
    // wb-views.js has been imported (it assigns window.WB.views synchronously
    // at module load) -- NOT that initViews()'s async registry fetch
    // (loadViewsFromURL) has reached registerViewAsElement() for these tags
    // yet. A single page.evaluate() read right after that wait is a race,
    // not a guarantee, so this polls (like Playwright's own auto-retrying
    // assertions) instead of reading once.
    await page.waitForFunction(() => {
      return ['user-avatar', 'alert-box', 'stat-tile', 'nav-link']
        .every(tag => customElements.get(tag) !== undefined);
    });
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

  test('user-card renders nested user-avatar', async ({ page }) => {
    const userCard = page.locator('user-card').first();
    await expect(userCard).toBeVisible();

    // user-card's template (views-registry.json) nests <user-avatar> -- the
    // wb-views "user-avatar" VIEW -- not the real <wb-avatar> MVVM component
    // (a same-named-but-different tag would collide with tag-map.js's
    // elementMap and get refused by wb-views.js's registerViewAsElement()
    // guard, same as the "card" view does for <wb-card>). user-avatar's own
    // template renders a <div class="avatar avatar--{{size}}">.
    const hasAvatar = await userCard.evaluate(el => {
      return el.querySelector('.avatar') !== null;
    });
    expect(hasAvatar).toBe(true);
  });

  test('button-group contains nested wb-button elements', async ({ page }) => {
    const buttonGroup = page.locator('button-group').first();
    await expect(buttonGroup).toBeVisible();

    // <wb-button> never gets a ".btn"/".wb-button" CLASS -- button.js's own
    // comment: "CSS targets the tag and attributes directly. No inner
    // <button> created. No classes added." (verified: live render is
    // <wb-button class="wb-button--start wb-button--primary wb-button--md">,
    // classes only for schema-declared variant/size, never a base class).
    // Nesting is checked via the tag itself, not a class.
    const btnCount = await buttonGroup.evaluate(el => {
      return el.querySelectorAll('wb-button').length;
    });
    expect(btnCount).toBeGreaterThanOrEqual(2);
  });

  // "wb-card renders body slot with nested views" used to live here,
  // rendering a <wb-card> with nested <wb-button> children. Removed along
  // with its subject: wb-card is a real premade component, not a wb-view
  // (wb-views.js's registerViewAsElement() explicitly refuses to register
  // it -- confirmed live via its own console warning), so demos/wb-views-
  // demo.html no longer renders one anywhere (John: "DON'T SHOW NON
  // WB-VIEWS ON THE WB-VIEWS PAGE"). Coverage for "a wb-view slots in real
  // nested components/views" isn't lost -- it's exactly what the
  // button-group test above (nested <wb-button>) and the user-card test
  // above (nested <user-avatar>, itself another wb-view) already check.

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
    // stat-tile without trend should still render. The HTML attribute the
    // demo actually authors is kebab-case `trend-value` (matching
    // views-registry.json's stat-tile schema); a CSS attribute selector is
    // literal, so `[trendValue]` (camelCase) never matched any element --
    // :not([trendValue]) was therefore true for EVERY stat-tile, including
    // ones that DO set trend-value, and .first() picked one of those,
    // failing the "should not have trend" assertion below.
    const statWithoutTrend = page.locator('stat-tile:not([trend-value])').first();
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

  test('an omitted attribute falls back to its schema-declared default, not undefined/falsy', async ({ page }) => {
    // John, live report: <feature-item text="Custom integrations"> (no
    // `included` attribute -- demos/wb-views-demo.html's own third example)
    // rendered the "excluded" branch (struck-through, a ✗ icon) even though
    // views-registry.json declares included's default as `true`.
    // getViewData() only ever read the element's OWN attributes, never
    // consulted the registry schema's `default` for an attribute the
    // author left off entirely -- {{included ? ... : ...}} just saw
    // `undefined` (falsy). Fixed by merging schema defaults into the
    // render data for any key the element doesn't itself set.
    const item = page.locator('feature-item:not([included])').first();
    await expect(item).toBeVisible();

    const included = await item.evaluate(el => el.classList.contains('feature-item--included')
      || el.querySelector('.feature-item')?.classList.contains('feature-item--included'));
    expect(included).toBe(true);

    const icon = await item.evaluate(el => (el.querySelector('.feature-item__icon')?.textContent || '').trim());
    expect(icon).toBe('✓');
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

  test('user-avatar sizes apply correct classes', async ({ page }) => {
    // The demo's "👤 Avatars" section renders <user-avatar size="sm|md|lg">
    // -- the wb-views "user-avatar" VIEW -- not the real <wb-avatar> MVVM
    // component (no <wb-avatar> is ever actually used/rendered live on this
    // page; the tag only appears as escaped documentation text inside the
    // "Composition" example's code samples). user-avatar's own template
    // renders a nested <div class="avatar avatar--{{size}}">.
    const sizes = ['sm', 'md', 'lg'];

    for (const size of sizes) {
      const avatar = page.locator(`user-avatar[size="${size}"]`).first();
      if (await avatar.count() > 0) {
        const hasClass = await avatar.evaluate((el, s) => {
          return el.querySelector(`.avatar--${s}`) !== null;
        }, size);
        expect(hasClass, `user-avatar size="${size}"`).toBe(true);
      }
    }
  });
});
