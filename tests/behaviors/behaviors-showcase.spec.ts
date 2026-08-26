/**
 * Behaviors Showcase Tests
 * ========================
 * Tests for the SPA's behaviors page (/?page=behaviors).
 * Tests all behavior demos are working correctly.
 *
 * demos/behaviors-showcase.html (the file this suite originally tested) was
 * removed once its content migrated into the SPA's own behaviors route --
 * every test here was navigating to a 404, hence the wholesale failure.
 * tests/views/behaviors-showcase.spec.ts already covers /?page=behaviors
 * for a different slice of assertions; this file has real, non-overlapping
 * coverage (dropdown/tabs/masonry/drawer-layout/toggle/visual-regression),
 * so it's repointed here rather than deleted.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Behaviors Showcase Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
    await page.waitForTimeout(1000); // components still need render/highlight time after app-ready
  });

  test.describe('Page Structure', () => {
    test('page loads without console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
          errors.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Filter out expected errors from missing external resources
      const unexpectedErrors = errors.filter(e => 
        !e.includes('net::ERR') && 
        !e.includes('Failed to load resource') &&
        !e.includes('404')
      );
      
      expect(unexpectedErrors).toHaveLength(0);
    });

    test('all behavior sections have a demo area', async ({ page }) => {
      // .behavior-card/.demo-area were the old standalone
      // demos/behaviors-showcase.html's grid-card layout; the schema-generated
      // page (behaviors.schema.json -> generate-behaviors-page.js) uses
      // <section id="..."> + <div x-demo> instead. Same intent, current markup.
      const sections = await page.locator('main section[id], section[id]').all();
      expect(sections.length).toBeGreaterThan(5);

      for (const section of sections) {
        // Sections use several different demo-container conventions
        // (<div x-demo>, .demo-grid-*, .demo-row, .alerts-stack,
        // .progress-stack, ...) depending on whether the behavior is a
        // custom wb-* element or a native element being enhanced in place --
        // rather than enumerate every container class name (guaranteed to
        // drift), just confirm the section has real content beyond its own
        // heading/description note.
        const contentCount = await section.evaluate(el =>
          el.querySelectorAll('*:not(h2):not(h3):not(.section-note):not(.section-note *)').length
        );
        expect(contentCount, `section#${await section.getAttribute('id')} has no demo content`).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Text Overflow Detection', () => {
    test('no text overflows parent containers', async ({ page }) => {
      const overflows = await page.evaluate(() => {
        const issues = [];
        
        // Check all elements for overflow
        document.querySelectorAll('.behavior-card, .demo-area, .info-callout').forEach(container => {
          const containerRect = container.getBoundingClientRect();
          
          // Check all text-containing children
          container.querySelectorAll('*').forEach(child => {
            const childRect = child.getBoundingClientRect();
            
            // Check if child extends beyond container (with 2px tolerance)
            if (childRect.right > containerRect.right + 2) {
              issues.push({
                element: child.tagName,
                text: child.textContent?.substring(0, 50),
                overflow: 'right',
                by: Math.round(childRect.right - containerRect.right) + 'px'
              });
            }
            if (childRect.bottom > containerRect.bottom + 200) { // Allow some vertical scrolling
              issues.push({
                element: child.tagName,
                text: child.textContent?.substring(0, 50),
                overflow: 'bottom',
                by: Math.round(childRect.bottom - containerRect.bottom) + 'px'
              });
            }
          });
        });
        
        return issues;
      });
      
      if (overflows.length > 0) {
        console.log('Text overflow issues found:', overflows);
      }
      expect(overflows.filter(o => o.overflow === 'right')).toHaveLength(0);
    });

    test('drawer-layout text is not covered by toggle button', async ({ page }) => {
      const drawerCard = page.locator('.behavior-card:has(.behavior-title:has-text("Drawer"))');
      
      // Get the sidebar text element
      const sidebarText = drawerCard.locator('.demo-area [x-drawer-layout] > div:first-child');
      const toggleButton = drawerCard.locator('.x-drawer-toggle');
      
      if (await toggleButton.count() > 0) {
        const sidebarRect = await sidebarText.boundingBox();
        const buttonRect = await toggleButton.boundingBox();
        
        if (sidebarRect && buttonRect) {
          // Button should not overlap the text content area significantly
          const overlap = Math.max(0, 
            Math.min(sidebarRect.x + sidebarRect.width, buttonRect.x + buttonRect.width) - 
            Math.max(sidebarRect.x, buttonRect.x)
          );
          
          // Allow some overlap for the button itself but text should be visible
          expect(overlap).toBeLessThan(sidebarRect.width * 0.3);
        }
      }
    });

    test('all "Main Content" text is fully visible', async ({ page }) => {
      const mainContentTexts = await page.locator(':text("Main Content")').all();
      
      for (const text of mainContentTexts) {
        const parent = text.locator('..').first();
        const parentBox = await parent.boundingBox();
        const textBox = await text.boundingBox();
        
        if (parentBox && textBox) {
          // Text should be within parent bounds
          expect(textBox.x).toBeGreaterThanOrEqual(parentBox.x - 1);
          expect(textBox.x + textBox.width).toBeLessThanOrEqual(parentBox.x + parentBox.width + 1);
        }
      }
    });
  });

  // behaviors.schema.json (generate-behaviors-page.js's source of truth for
  // pages/behaviors.html) has no demo section for x-dropdown/drawer-layout/
  // x-toggle/x-masonry -- none of these tags exist on the page at all.
  // These describe blocks were written against the old standalone
  // demos/behaviors-showcase.html (removed once its content migrated into
  // the schema-generated SPA page). Their "all(...)" locators quietly
  // matched zero elements and vacuously passed until the URL was fixed
  // (previously the whole page was a 404, masking this). Skipped rather than
  // deleted -- trivial to re-enable if/when these behaviors get a demo
  // section in the schema.
  test.describe.skip('Dropdown Behavior', () => {
    test('dropdown should have items attribute OR proper children structure', async ({ page }) => {
      const dropdowns = await page.locator('[x-dropdown]').all();
      
      for (const dropdown of dropdowns) {
        // Check if data-items is set
        const hasItems = await dropdown.getAttribute('items');
        
        // Check if proper child structure exists
        const hasTrigger = await dropdown.locator('.x-dropdown-trigger, .x-dropdown__trigger').count() > 0;
        const hasMenu = await dropdown.locator('.x-dropdown-menu, .x-dropdown__menu').count() > 0;
        
        // One of these patterns must be true
        const isValid = hasItems !== null || (hasTrigger && hasMenu);
        
        // Log the actual structure for debugging
        if (!isValid) {
          const html = await dropdown.innerHTML();
          console.log('Invalid dropdown structure:', html.substring(0, 200));
        }
        
        expect(isValid, 'Dropdown must have items OR trigger+menu children').toBe(true);
      }
    });

    test('dropdown shows menu when clicked', async ({ page }) => {
      const dropdown = page.locator('[x-dropdown]').first();
      
      // Click the dropdown
      await dropdown.click();
      await page.waitForTimeout(200);
      
      // Check if menu is visible
      const menu = dropdown.locator('.x-dropdown__menu, .x-dropdown-menu');
      if (await menu.count() > 0) {
        await expect(menu).toBeVisible();
      } else {
        // If no menu, the dropdown behavior might not be working
        console.warn('No dropdown menu found - behavior may not be initialized');
      }
    });
  });

  test.describe('Tabs Behavior', () => {
    test('tabs children should use tab-title attribute', async ({ page }) => {
      const tabContainers = await page.locator('[x-tabs]').all();
      
      for (const tabs of tabContainers) {
        const children = await tabs.locator('> div[tab-title], > div[tab]').all();
        
        // Check each child has the correct attribute
        for (const child of children) {
          const hasTabTitle = await child.getAttribute('tab-title');
          const hasTab = await child.getAttribute('tab');
          
          // Prefer data-tab-title per schema, but data-tab might work
          if (!hasTabTitle && hasTab) {
            console.warn('Tab uses tab instead of tab-title (non-standard)');
          }
          
          expect(hasTabTitle || hasTab, 'Tab panel must have tab-title or tab').toBeTruthy();
        }
      }
    });

    test('tabs generate tab buttons', async ({ page }) => {
      const tabContainers = await page.locator('[x-tabs]').all();
      
      for (const tabs of tabContainers) {
        const nav = tabs.locator('.x-tabs__nav');
        await expect(nav).toBeVisible();
        
        const tabButtons = tabs.locator('.x-tabs__tab');
        const buttonCount = await tabButtons.count();
        
        expect(buttonCount).toBeGreaterThan(0);
      }
    });

    test('tab buttons are properly sized (not too tall)', async ({ page }) => {
      const tabButtons = await page.locator('.x-tabs__tab').all();
      
      for (const button of tabButtons) {
        const box = await button.boundingBox();
        if (box) {
          // Tab buttons should not be excessively tall (max 60px reasonable)
          expect(box.height).toBeLessThan(80);
        }
      }
    });

    test('clicking tab shows corresponding panel', async ({ page }) => {
      const tabContainer = page.locator('[x-tabs]').first();
      
      // Click second tab
      const secondTab = tabContainer.locator('.x-tabs__tab').nth(1);
      await secondTab.click();
      await page.waitForTimeout(100);
      
      // Second panel should be visible
      const secondPanel = tabContainer.locator('.x-tabs__panel').nth(1);
      await expect(secondPanel).toBeVisible();
      
      // First panel should be hidden
      const firstPanel = tabContainer.locator('.x-tabs__panel').first();
      await expect(firstPanel).toBeHidden();
    });
  });

  // See the skip note on 'Dropdown Behavior' above -- same situation.
  test.describe.skip('Drawer Layout Behavior', () => {
    test('drawer-layout behavior initializes', async ({ page }) => {
      const drawer = page.locator('[x-drawer-layout]').first();
      
      // Should have x-drawer class after initialization
      await expect(drawer).toHaveClass(/x-drawer/);
    });

    test('drawer toggle button is visible and accessible', async ({ page }) => {
      const drawerCard = page.locator('.behavior-card:has(.behavior-title:has-text("Drawer"))');
      const toggleButton = drawerCard.locator('.x-drawer-toggle');
      
      if (await toggleButton.count() > 0) {
        await expect(toggleButton).toBeVisible();
        
        // Button should be clickable
        const box = await toggleButton.boundingBox();
        expect(box).toBeTruthy();
        expect(box.width).toBeGreaterThan(10);
        expect(box.height).toBeGreaterThan(10);
      }
    });

    test('sidebar content is readable when drawer is open', async ({ page }) => {
      const drawerCard = page.locator('.behavior-card:has(.behavior-title:has-text("Drawer"))');
      const sidebarText = drawerCard.locator(':text("Sidebar")').first();
      
      if (await sidebarText.count() > 0) {
        // Text should be visible
        await expect(sidebarText).toBeVisible();
        
        // Check that text is not clipped
        const box = await sidebarText.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(20); // Text should have reasonable width
        }
      }
    });
  });

  // See the skip note on 'Dropdown Behavior' above -- same situation.
  //
  // #873: 'toggle button has visible styling' used to live here. It had no
  // expect() at all (it console.warn'd and returned), AND it sat inside a
  // skipped describe, so it was inert twice over. It now lives in 'Visual
  // Regression Checks' below, where it runs and asserts -- rewritten to inject
  // its own markup through WB.scan() rather than depending on demo sections
  // this page no longer has.
  test.describe.skip('Toggle Behavior', () => {
    test('toggle toggles class on target', async ({ page }) => {
      const toggleButton = page.locator('x-toggle[target="#toggle-box"]');
      const target = page.locator('#toggle-box');
      
      // Initial state
      const hasActiveInitially = await target.evaluate(el => el.classList.contains('active'));
      
      // Click toggle
      await toggleButton.click();
      await page.waitForTimeout(100);
      
      // Class should be toggled
      const hasActiveAfter = await target.evaluate(el => el.classList.contains('active'));
      expect(hasActiveAfter).not.toBe(hasActiveInitially);
    });
  });

  // See the skip note on 'Dropdown Behavior' above -- same situation.
  test.describe.skip('Masonry Layout', () => {
    test('masonry container uses column layout', async ({ page }) => {
      const masonry = page.locator('[x-masonry]').first();
      
      const styles = await masonry.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          columnCount: computed.columnCount,
          display: computed.display
        };
      });
      
      // Should have column-count set
      expect(styles.columnCount).not.toBe('auto');
    });

    test('masonry children are visible', async ({ page }) => {
      const masonry = page.locator('[x-masonry]').first();
      const children = await masonry.locator('> *').all();
      
      expect(children.length).toBeGreaterThan(0);
      
      for (const child of children) {
        await expect(child).toBeVisible();
      }
    });

    test('masonry items have correct break-inside', async ({ page }) => {
      const masonry = page.locator('[x-masonry]').first();
      const firstChild = masonry.locator('> *').first();
      
      const breakInside = await firstChild.evaluate(el => {
        return window.getComputedStyle(el).breakInside;
      });
      
      expect(breakInside).toBe('avoid');
    });
  });

  test.describe('Code Examples', () => {
    test('code blocks are contained within cards', async ({ page }) => {
      const cards = await page.locator('.behavior-card').all();
      
      let overflowCount = 0;
      
      for (const card of cards) {
        const cardBox = await card.boundingBox();
        if (!cardBox) continue;
        
        // #448: x-mdhtml no longer carries a same-named `.x-mdhtml` class
        // -- select the tag directly too.
        const codeBlocks = await card.locator('pre, code, [x-mdhtml], .x-mdhtml').all();
        
        for (const code of codeBlocks) {
          const codeBox = await code.boundingBox();
          if (!codeBox) continue;
          
          // Code should not extend beyond card
          if (codeBox.x + codeBox.width > cardBox.x + cardBox.width + 5) {
            overflowCount++;
            console.log('Code overflow in card:', await card.locator('.behavior-title').textContent());
          }
        }
      }
      
      expect(overflowCount).toBe(0);
    });

    test('code examples have small font size', async ({ page }) => {
      const codeBlocks = await page.locator('.behavior-card pre code').all();
      
      for (const code of codeBlocks) {
        const fontSize = await code.evaluate(el => {
          return parseFloat(window.getComputedStyle(el).fontSize);
        });
        
        // Font size should be small (less than 14px)
        expect(fontSize).toBeLessThan(14);
      }
    });

    test('line numbers column is narrow', async ({ page }) => {
      const lineNumbers = await page.locator('.x-pre__line-numbers').all();
      
      for (const ln of lineNumbers) {
        const box = await ln.boundingBox();
        if (box) {
          // Line numbers column should be narrow (max 50px)
          expect(box.width).toBeLessThan(50);
        }
      }
    });
  });

  test.describe('Behavior Initialization', () => {
    test('all behavior elements are initialized', async ({ page }) => {
      const uninitializedCount = await page.evaluate(() => {
        let count = 0;
        document.querySelectorAll('.x-ready').forEach(el => {
          // Check for x-ready or class starting with wb-
          const hasReady = el.classList.contains("x-ready");
          const hasWbClass = Array.from(el.classList).some(c => c.startsWith('wb-'));
          
          if (!hasReady && !hasWbClass) {
            count++;
            console.log('Uninitialized element:', el.outerHTML.substring(0, 100));
          }
        });
        return count;
      });
      
      if (uninitializedCount > 0) {
        console.warn(`${uninitializedCount} elements appear uninitialized`);
      }
      
      // Allow a small number due to timing, but flag if many are uninitialized
      expect(uninitializedCount).toBeLessThan(5);
    });
  });

  test.describe('Visual Regression Checks', () => {
    /**
     * #873: 'buttons have consistent styling' used to loop over
     * `button[variant]` on this page and console.log anything transparent. It
     * had no expect() at all, and -- measured live against a dev server --
     * `/?page=behaviors` contains ZERO `button[variant]` elements, because
     * #664/#666 replaced the per-behavior demo sections with a search box and
     * a live preview panel. The loop body never ran once.
     *
     * So the probes are injected and upgraded through the public API instead.
     * Prepended to <body> and scrolled to, NOT appended: several behaviors
     * inject lazily off an IntersectionObserver, so a host parked below the
     * fold of a very long page is upgraded only when something scrolls it into
     * view (the #860 note on the same helper in effects-actions.spec.ts).
     * WB.scan() is awaited -- it is async, and asserting before it resolves is
     * a race that passes at --workers=1 and fails at --workers=8.
     */
    async function scanProbe(page: Page, html: string): Promise<void> {
      await page.evaluate(async (markup: string) => {
        document.getElementById('wb-style-probe')?.remove();
        const host = document.createElement('div');
        host.id = 'wb-style-probe';
        host.style.cssText =
          'position:relative;z-index:2147483000;display:flex;flex-wrap:wrap;gap:8px;';
        host.innerHTML = markup;
        document.body.prepend(host);
        window.scrollTo(0, 0);
        await (window as any).WB.scan(host, { eager: true });
      }, html);
    }

    /**
     * button.schema.json's own variant enum. `appliesClass` there is
     * `x-button--{{value}}`, which is the styling hook asserted below.
     */
    const SOLID_VARIANTS = ['primary', 'secondary', 'success', 'warning', 'error'];
    const OPEN_VARIANTS = ['ghost', 'outline', 'link'];

    test('buttons have consistent styling', async ({ page }) => {
      const variants = [...SOLID_VARIANTS, ...OPEN_VARIANTS];

      // Two authoring forms of the SAME variant, side by side. The promise of
      // the button behavior is that they are indistinguishable -- and that
      // promise is exactly what #772 broke, when behavior stylesheets matched
      // only the wb-* tag and x-* authoring rendered unstyled.
      await scanProbe(
        page,
        variants
          .map(
            (v) =>
              `<button variant="${v}" data-probe="native-${v}">${v}</button>` +
              `<div x-button variant="${v}" data-probe="decorated-${v}">${v}</div>`
          )
          .join('')
      );

      // WB.scan() attaches the styling hook; wait on the OUTCOME rather than a
      // fixed sleep, so nothing below can read styles off an un-upgraded node.
      await expect
        .poll(
          async () =>
            page.locator('#wb-style-probe [data-probe]').evaluateAll(
              (els) => els.filter((el) => el.classList.contains('x-button')).length
            ),
          { timeout: 20000, message: 'button() never attached to the injected probes' }
        )
        .toBe(variants.length * 2);

      const probes = await page.locator('#wb-style-probe [data-probe]').evaluateAll((els) =>
        els.map((el) => {
          const c = getComputedStyle(el);
          return {
            probe: el.getAttribute('data-probe') as string,
            classes: el.className,
            // The variant-defining properties only. Deliberately NOT font-size
            // or padding: <button> and <div> start from different UA defaults
            // for those, and a difference there would say nothing about the
            // variant styling this test is named after.
            paint: [c.backgroundColor, c.color, c.borderRadius, c.borderStyle, c.borderColor].join(' | '),
          };
        })
      );

      const byProbe = new Map(probes.map((p) => [p.probe, p]));

      // 1. The attribute became the styling hook, in BOTH authoring forms.
      const missingHook = probes
        .filter((p) => !new RegExp(`\\bx-button--${p.probe.split('-')[1]}\\b`).test(p.classes))
        .map((p) => `${p.probe} -> class="${p.classes}"`);
      expect(
        missingHook,
        'variant="X" must produce the x-button--X class button.schema.json declares '
        + '(appliesClass), whichever authoring form was used',
      ).toEqual([]);

      // 2. Same variant, two authoring forms, identical paint. No palette is
      //    hard-coded, so this survives every theme.
      //
      //    KNOWN EXCEPTION, tracked as #875: `outline` is in
      //    button.schema.json's variant enum but NOTHING implements it --
      //    there is no .x-button--outline rule and no
      //    x-button[variant="outline"] rule anywhere in src/. With no variant
      //    rule the two forms fall through to DIFFERENT defaults: the native
      //    <button> keeps a site-level button border, the decorated <div>
      //    keeps .x-button's own `border: 1px solid transparent`. Measured:
      //      <button>       ... | solid | color(srgb 0.9425 0.9475 0.9575 / 0.22)
      //      <div x-button> ... | solid | rgba(0, 0, 0, 0)
      //
      //    Named here rather than quietly filtered out of `variants`, and
      //    asserted with toEqual rather than a subset check, so this is a
      //    RATCHET: the day #875 is implemented the list goes empty, this
      //    fails, and whoever fixed it deletes the exception. A silent
      //    exclusion would instead outlive the bug forever.
      const KNOWN_INCONSISTENT = ['outline'];

      const inconsistent = variants
        .map((v) => ({
          v,
          native: byProbe.get(`native-${v}`)!.paint,
          decorated: byProbe.get(`decorated-${v}`)!.paint,
        }))
        .filter((r) => r.native !== r.decorated);

      expect(
        inconsistent.map((r) => r.v),
        '<button variant="X"> and <div x-button variant="X"> must paint identically -- '
        + 'the x-* authoring form rendering unstyled is #772. Only the variants named in '
        + `KNOWN_INCONSISTENT (${KNOWN_INCONSISTENT.join(', ') || 'none'}, see #875) may differ, `
        + 'and when that one is fixed this assertion fails on purpose so the exception gets '
        + 'removed.\n'
        + inconsistent
          .map((r) => `  variant=${r.v}\n    <button>      ${r.native}\n    <div x-button> ${r.decorated}`)
          .join('\n'),
      ).toEqual(KNOWN_INCONSISTENT);

      // 3. ...and "consistently unstyled" must not be able to satisfy (2).
      //    The five solid variants carry distinct opaque fills by design; if
      //    button.css failed to load they would collapse to one value (or to
      //    transparent), which is the regression this catches.
      const solidFills = SOLID_VARIANTS.map(
        (v) => byProbe.get(`native-${v}`)!.paint.split(' | ')[0]
      );
      expect(
        solidFills.filter((bg) => bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent'),
        `the solid variants (${SOLID_VARIANTS.join(', ')}) must have a real fill`,
      ).toEqual([]);
      expect(
        new Set(solidFills).size,
        `the solid variants must be visually distinguishable, got ${solidFills.join(', ')}`,
      ).toBe(SOLID_VARIANTS.length);
    });

    /**
     * #873: moved out of the skipped 'Toggle Behavior' describe above, where it
     * was doubly inert -- skipped, and console.warn-only with no expect().
     */
    test('toggle button has visible styling', async ({ page }) => {
      await scanProbe(
        page,
        '<button x-toggle target="#wb-probe-toggle-panel" data-probe="toggle">Toggle</button>'
        + '<div id="wb-probe-toggle-panel">the panel this button toggles</div>'
      );

      const btn = page.locator('#wb-style-probe [data-probe="toggle"]');
      await expect(btn).toHaveCount(1);
      await expect(btn).toBeVisible();

      // A real, clickable target -- not a zero-box element that "exists".
      const box = await btn.boundingBox();
      expect(box, 'the toggle button has no layout box at all').toBeTruthy();
      expect(box!.width).toBeGreaterThan(20);
      expect(box!.height).toBeGreaterThan(10);

      // Styled by the project's stylesheet, not by the UA. Chromium's default
      // <button> is border-radius 0 with a 2px outset border and ~1px 6px
      // padding, so every one of these three differs from an unstyled control.
      // That is what "has visible styling" means, stated as something that can
      // actually fail.
      const style = await btn.evaluate((el) => {
        const c = getComputedStyle(el);
        return {
          radius: parseFloat(c.borderTopLeftRadius),
          borderStyle: c.borderTopStyle,
          padY: parseFloat(c.paddingTop),
          padX: parseFloat(c.paddingLeft),
          cursor: c.cursor,
        };
      });
      expect(style.radius, 'no border-radius: the UA default, so nothing styled it').toBeGreaterThan(0);
      expect(style.borderStyle, 'still the UA outset border').not.toBe('outset');
      expect(style.padX, 'still the UA default horizontal padding').toBeGreaterThan(6);
      expect(style.padY, 'still the UA default vertical padding').toBeGreaterThan(1);
      expect(style.cursor, 'a toggle must look clickable').toBe('pointer');
    });

    test('spinners are animating', async ({ page }) => {
      const spinners = await page.locator('[x-spinner]').all();
      
      expect(spinners.length).toBeGreaterThan(0);
      
      for (const spinner of spinners) {
        // spinner() (feedback.js) builds a plain <div> ring, not an <svg> --
        // the outer <span x-spinner> itself has animation:none (site.css, #182,
        // avoids a double ring); the actual spin animation lives on the
        // child <div>.
        const hasAnimation = await spinner.evaluate(el => {
          const ring = el.querySelector('div');
          if (ring) {
            const computed = window.getComputedStyle(ring);
            return computed.animation !== 'none' || computed.animationName !== 'none';
          }
          return false;
        });

        expect(hasAnimation).toBe(true);
      }
    });
  });
});
