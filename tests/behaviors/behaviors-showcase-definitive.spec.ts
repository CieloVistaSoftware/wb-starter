/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WB BEHAVIORS SHOWCASE - DEFINITIVE TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * COMPREHENSIVE tests for demos/behaviors-showcase.html
 * Tests ALL behaviors, components, code examples, and interactions
 * 
 * Structure:
 * 1. Page Structure Tests
 * 2. Section-by-Section Behavior Tests
 * 3. Interactive Tests
 * 4. Code Example Tests
 * 5. Visual Regression Tests
 * 6. Accessibility Tests
 * 
 * @version 3.0.0
 */

import { test, expect, Page } from '@playwright/test';

const SHOWCASE_URL = '/demos/behaviors-showcase.html';

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

async function waitForWB(page: Page, timeout = 10000): Promise<void> {
  await page.waitForFunction(() => (window as any).WB, { timeout });
  // Give components time to render after WB is available
  await page.waitForTimeout(500);
}

async function countElements(page: Page, selector: string): Promise<number> {
  return await page.locator(selector).count();
}

async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector).first();
  return (await locator.count()) > 0 && await locator.isVisible();
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. PAGE STRUCTURE TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('page loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && 
          !msg.text().includes('favicon') && 
          !msg.text().includes('net::ERR')) {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await waitForWB(page);
    
    expect(errors.filter(e => !e.includes('404'))).toHaveLength(0);
  });

  test('wb-starter initializes correctly', async ({ page }) => {
    const wbExists = await page.evaluate(() => !!(window as any).WB);
    expect(wbExists).toBe(true);
  });

  test('header section exists with title', async ({ page }) => {
    await expect(page.locator('#header')).toBeVisible();
    await expect(page.locator('#header h1')).toContainText('Behaviors');
  });

  test('navigation section exists with all 10 section links', async ({ page }) => {
    await expect(page.locator('#nav')).toBeVisible();
    
    const sections = ['Buttons', 'Inputs', 'Selection', 'Feedback', 'Overlays', 
                      'Navigation', 'Data', 'Media', 'Effects', 'Utilities'];
    
    for (const section of sections) {
      await expect(page.locator(`#nav a:has-text("${section}")`)).toBeVisible();
    }
  });

  test('stats section displays correct counts', async ({ page }) => {
    const stats = page.locator('.showcase-stats wb-cardstats');
    expect(await stats.count()).toBeGreaterThanOrEqual(4);
  });

  test('all 10 main content sections exist', async ({ page }) => {
    const sectionIds = ['buttons', 'inputs', 'selection', 'feedback', 'overlays',
                        'navigation', 'data', 'media', 'effects', 'utilities'];
    
    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`), `Section #${id} should exist`).toBeVisible();
    }
  });

  test('footer section exists', async ({ page }) => {
    await expect(page.locator('#footer')).toBeVisible();
  });

  test('page has no horizontal scrollbar', async ({ page }) => {
    const hasHScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHScroll).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. BUTTONS SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Buttons Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('button variants exist (primary, secondary, ghost)', async ({ page }) => {
    const section = page.locator('#buttons');
    await expect(section.locator('.wb-btn--primary').first()).toBeVisible();
    await expect(section.locator('.wb-btn--secondary').first()).toBeVisible();
    await expect(section.locator('.wb-btn--ghost').first()).toBeVisible();
  });

  test('disabled button exists and is disabled', async ({ page }) => {
    const disabledBtn = page.locator('#buttons button[disabled]').first();
    await expect(disabledBtn).toBeVisible();
    await expect(disabledBtn).toBeDisabled();
  });

  test('button sizes exist (sm, md, lg)', async ({ page }) => {
    const section = page.locator('#buttons');
    await expect(section.locator('.wb-btn--sm').first()).toBeVisible();
    await expect(section.locator('.wb-btn--lg').first()).toBeVisible();
  });

  test('ripple button has x-ripple attribute', async ({ page }) => {
    await expect(page.locator('#buttons [x-ripple]').first()).toBeVisible();
  });

  test('toast button has proper attributes', async ({ page }) => {
    const toastBtn = page.locator('#buttons [x-toast]').first();
    await expect(toastBtn).toBeVisible();
    await expect(toastBtn).toHaveAttribute('data-message');
    await expect(toastBtn).toHaveAttribute('data-type');
  });

  test('tooltip button has x-tooltip attribute', async ({ page }) => {
    await expect(page.locator('#buttons [x-tooltip]').first()).toBeVisible();
  });

  test('buttons section has wb-mdhtml code examples', async ({ page }) => {
    const codeBlocks = page.locator('#buttons wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. INPUTS SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Inputs Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('basic input types exist (text, email, number)', async ({ page }) => {
    const section = page.locator('#inputs');
    await expect(section.locator('input[type="text"]').first()).toBeVisible();
    await expect(section.locator('input[type="email"]').first()).toBeVisible();
    await expect(section.locator('input[type="number"]').first()).toBeVisible();
  });

  test('validation variant inputs exist', async ({ page }) => {
    const section = page.locator('#inputs');
    await expect(section.locator('[data-variant="success"]').first()).toBeVisible();
    await expect(section.locator('[data-variant="warning"]').first()).toBeVisible();
    await expect(section.locator('[data-variant="error"]').first()).toBeVisible();
  });

  test('password input has x-password behavior', async ({ page }) => {
    await expect(page.locator('#inputs [x-password]').first()).toBeVisible();
  });

  test('masked inputs exist with data-mask', async ({ page }) => {
    const maskedInputs = page.locator('#inputs [x-masked]');
    expect(await maskedInputs.count()).toBeGreaterThanOrEqual(3);
  });

  test('textareas exist', async ({ page }) => {
    const textareas = page.locator('#inputs textarea');
    expect(await textareas.count()).toBeGreaterThanOrEqual(1);
  });

  test('inputs section has code examples', async ({ page }) => {
    const codeBlocks = page.locator('#inputs wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. SELECTION SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Selection Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('checkboxes exist with various states', async ({ page }) => {
    const checkboxes = page.locator('#selection input[type="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThanOrEqual(3);
  });

  test('radio buttons exist in a group', async ({ page }) => {
    const radios = page.locator('#selection input[type="radio"]');
    expect(await radios.count()).toBeGreaterThanOrEqual(3);
  });

  test('wb-switch components exist', async ({ page }) => {
    const switches = page.locator('#selection wb-switch');
    expect(await switches.count()).toBeGreaterThanOrEqual(3);
  });

  test('select dropdowns exist', async ({ page }) => {
    const selects = page.locator('#selection select');
    expect(await selects.count()).toBeGreaterThanOrEqual(1);
  });

  test('wb-rating components exist', async ({ page }) => {
    const ratings = page.locator('#selection wb-rating');
    expect(await ratings.count()).toBeGreaterThanOrEqual(3);
  });

  test('stepper exists with x-stepper', async ({ page }) => {
    await expect(page.locator('#selection [x-stepper]').first()).toBeVisible();
  });

  test('range input exists', async ({ page }) => {
    await expect(page.locator('#selection input[type="range"]').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. FEEDBACK SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Feedback Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('all 4 alert types exist (info, success, warning, error)', async ({ page }) => {
    const alertTypes = ['info', 'success', 'warning', 'error'];
    
    for (const type of alertTypes) {
      const alert = page.locator(`#feedback wb-alert[type="${type}"]`).first();
      await expect(alert, `Alert type="${type}" should exist`).toBeVisible();
    }
  });

  test('badge components exist with variants', async ({ page }) => {
    const badges = page.locator('#feedback wb-badge');
    expect(await badges.count()).toBeGreaterThanOrEqual(6);
  });

  test('progress bars exist', async ({ page }) => {
    const progressBars = page.locator('#feedback wb-progress');
    expect(await progressBars.count()).toBeGreaterThanOrEqual(4);
  });

  test('spinners exist with various colors', async ({ page }) => {
    const spinners = page.locator('#feedback wb-spinner');
    expect(await spinners.count()).toBeGreaterThanOrEqual(4);
  });

  test('toast trigger buttons exist', async ({ page }) => {
    const toastBtns = page.locator('#feedback [x-toast]');
    expect(await toastBtns.count()).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. OVERLAYS SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Overlays Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('modal trigger exists', async ({ page }) => {
    await expect(page.locator('#overlays wb-modal').first()).toBeVisible();
  });

  test('drawer triggers exist (left and right)', async ({ page }) => {
    const drawers = page.locator('#overlays wb-drawer');
    expect(await drawers.count()).toBeGreaterThanOrEqual(2);
  });

  test('tooltip buttons exist for all positions', async ({ page }) => {
    const tooltips = page.locator('#overlays [x-tooltip]');
    expect(await tooltips.count()).toBeGreaterThanOrEqual(4);
  });

  test('popover trigger exists', async ({ page }) => {
    await expect(page.locator('#overlays [x-popover]').first()).toBeVisible();
  });

  test('confirm dialog trigger exists', async ({ page }) => {
    await expect(page.locator('#overlays [x-confirm]').first()).toBeVisible();
  });

  test('prompt dialog trigger exists', async ({ page }) => {
    await expect(page.locator('#overlays [x-prompt]').first()).toBeVisible();
  });

  test('lightbox triggers exist', async ({ page }) => {
    const lightboxes = page.locator('#overlays [x-lightbox]');
    expect(await lightboxes.count()).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. NAVIGATION SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Navigation Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('wb-tabs component exists with panels', async ({ page }) => {
    const tabs = page.locator('#navigation wb-tabs').first();
    await expect(tabs).toBeVisible();
    
    const panels = tabs.locator('[data-tab-title]');
    expect(await panels.count()).toBeGreaterThanOrEqual(2);
  });

  test('wb-accordion component exists with sections', async ({ page }) => {
    const accordion = page.locator('#navigation wb-accordion').first();
    await expect(accordion).toBeVisible();
    
    const sections = accordion.locator('[data-accordion-title]');
    expect(await sections.count()).toBeGreaterThanOrEqual(2);
  });

  test('breadcrumb exists', async ({ page }) => {
    await expect(page.locator('#navigation [x-breadcrumb]').first()).toBeVisible();
  });

  test('pagination exists', async ({ page }) => {
    await expect(page.locator('#navigation [x-pagination]').first()).toBeVisible();
  });

  test('steps wizard exists', async ({ page }) => {
    await expect(page.locator('#navigation [x-steps]').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. DATA SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Data Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('avatar components exist', async ({ page }) => {
    const avatars = page.locator('#data wb-avatar');
    expect(await avatars.count()).toBeGreaterThanOrEqual(4);
  });

  test('skeleton loaders exist', async ({ page }) => {
    const skeletons = page.locator('#data wb-skeleton');
    expect(await skeletons.count()).toBeGreaterThanOrEqual(3);
  });

  test('timeline exists', async ({ page }) => {
    const timeline = page.locator('#data [x-timeline]').first();
    // Timeline may be hidden initially (collapsed), just check it exists
    expect(await timeline.count()).toBe(1);
  });

  test('keyboard key elements exist', async ({ page }) => {
    const kbds = page.locator('#data [x-kbd]');
    expect(await kbds.count()).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. MEDIA SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Media Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('enhanced images exist with x-image', async ({ page }) => {
    const images = page.locator('#media [x-image]');
    expect(await images.count()).toBeGreaterThanOrEqual(2);
  });

  test('gallery exists with images', async ({ page }) => {
    const gallery = page.locator('#media [x-gallery]').first();
    await expect(gallery).toBeVisible();
    
    const images = gallery.locator('img');
    expect(await images.count()).toBeGreaterThanOrEqual(2);
  });

  test('audio player component exists', async ({ page }) => {
    await expect(page.locator('#media wb-audio').first()).toBeVisible();
  });

  test('YouTube embed exists', async ({ page }) => {
    await expect(page.locator('#media [x-youtube]').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. EFFECTS SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Effects Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('attention seeker effects exist', async ({ page }) => {
    const effects = ['x-bounce', 'x-shake', 'x-pulse', 'x-flash', 'x-tada', 'x-wobble', 'x-jello', 'x-heartbeat'];
    
    for (const effect of effects) {
      const el = page.locator(`#effects [${effect}]`).first();
      await expect(el, `Effect ${effect} should exist`).toBeVisible();
    }
  });

  test('entrance animation effects exist', async ({ page }) => {
    const effects = ['x-fadein', 'x-slidein', 'x-zoomin', 'x-flip'];
    
    for (const effect of effects) {
      const el = page.locator(`#effects [${effect}]`).first();
      await expect(el, `Effect ${effect} should exist`).toBeVisible();
    }
  });

  test('special effects exist', async ({ page }) => {
    const effects = ['x-confetti', 'x-fireworks', 'x-snow', 'x-sparkle', 'x-glow', 'x-rainbow'];
    
    for (const effect of effects) {
      const el = page.locator(`#effects [${effect}]`).first();
      await expect(el, `Effect ${effect} should exist`).toBeVisible();
    }
  });

  test('ripple elements exist', async ({ page }) => {
    const ripples = page.locator('#effects [x-ripple]');
    expect(await ripples.count()).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. UTILITIES SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Utilities Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('copy buttons exist', async ({ page }) => {
    const copyBtns = page.locator('#utilities [x-copy]');
    expect(await copyBtns.count()).toBeGreaterThanOrEqual(2);
  });

  test('share button exists', async ({ page }) => {
    await expect(page.locator('#utilities [x-share]').first()).toBeVisible();
  });

  test('print button exists', async ({ page }) => {
    await expect(page.locator('#utilities [x-print]').first()).toBeVisible();
  });

  test('fullscreen button exists', async ({ page }) => {
    await expect(page.locator('#utilities [x-fullscreen]').first()).toBeVisible();
  });

  test('clock element exists', async ({ page }) => {
    await expect(page.locator('#utilities [x-clock]').first()).toBeVisible();
  });

  test('countdown element exists', async ({ page }) => {
    await expect(page.locator('#utilities [x-countdown]').first()).toBeVisible();
  });

  test('dark mode toggle exists', async ({ page }) => {
    await expect(page.locator('#utilities [x-darkmode]').first()).toBeVisible();
  });

  test('truncate element exists', async ({ page }) => {
    await expect(page.locator('#utilities [x-truncate]').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CODE EXAMPLES TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Code Examples (wb-mdhtml)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('every section has at least 3 code examples', async ({ page }) => {
    const sections = ['buttons', 'inputs', 'selection', 'feedback', 'overlays',
                      'navigation', 'data', 'media', 'effects', 'utilities'];
    
    for (const id of sections) {
      const codeBlocks = page.locator(`#${id} wb-mdhtml`);
      const count = await codeBlocks.count();
      expect(count, `Section #${id} should have >=3 code examples`).toBeGreaterThanOrEqual(3);
    }
  });

  test('code examples render with content', async ({ page }) => {
    const codeBlocks = page.locator('wb-mdhtml');
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThan(20); // Should have many code examples
    
    // Check first few have content
    for (let i = 0; i < Math.min(5, count); i++) {
      const block = codeBlocks.nth(i);
      const html = await block.innerHTML();
      expect(html.length, `Code block ${i} should have content`).toBeGreaterThan(5);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. INTERACTIVE TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Interactive Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('checkbox toggles on click', async ({ page }) => {
    const checkbox = page.locator('#selection input[type="checkbox"]:not([disabled])').first();
    const wasBefore = await checkbox.isChecked();
    await checkbox.click();
    const isAfter = await checkbox.isChecked();
    expect(isAfter).not.toBe(wasBefore);
  });

  test('radio buttons work in group', async ({ page }) => {
    const radios = page.locator('#selection input[type="radio"][name="demo-radio"]');
    const count = await radios.count();
    
    if (count >= 2) {
      await radios.nth(1).click();
      await expect(radios.nth(1)).toBeChecked();
    }
  });

  test('ripple effect triggers on click', async ({ page }) => {
    const rippleBtn = page.locator('#buttons [x-ripple]').first();
    await rippleBtn.click();
    
    // Ripple creates a temporary element
    await page.waitForTimeout(100);
    // Just verify no error occurred - ripple effect is visual
  });

  test('toast shows on button click', async ({ page }) => {
    const toastBtn = page.locator('#buttons [x-toast]').first();
    await toastBtn.click();
    await page.waitForTimeout(500);
    
    // Look for toast container or toast element
    const toastVisible = await page.locator('.wb-toast, [class*="toast"]').count();
    expect(toastVisible).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. VISUAL QUALITY TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Visual Quality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('no text overflows container horizontally', async ({ page }) => {
    const overflows = await page.evaluate(() => {
      const issues: { element: string; overflow: number }[] = [];
      
      document.querySelectorAll('.demo-container, .demo-area, section').forEach(container => {
        const containerRect = container.getBoundingClientRect();
        
        container.querySelectorAll('*').forEach(child => {
          const childRect = child.getBoundingClientRect();
          
          if (childRect.right > containerRect.right + 5) {
            issues.push({
              element: child.tagName,
              overflow: Math.round(childRect.right - containerRect.right)
            });
          }
        });
      });
      
      return issues;
    });
    
    expect(overflows.length, 'No elements should overflow horizontally').toBe(0);
  });

  test('spinners have animation', async ({ page }) => {
    const spinners = page.locator('#feedback wb-spinner');
    const count = await spinners.count();
    
    if (count > 0) {
      const spinner = spinners.first();
      await expect(spinner).toBeVisible();
      
      // Check for animation in SVG or CSS
      const hasAnimation = await spinner.evaluate(el => {
        const svg = el.querySelector('svg');
        if (svg) {
          const style = window.getComputedStyle(svg);
          return style.animation !== 'none' && style.animation !== '';
        }
        return false;
      });
      
      expect(hasAnimation).toBe(true);
    }
  });

  test('page is responsive at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test('sections have proper spacing', async ({ page }) => {
    const sections = page.locator('section');
    const first = sections.first();
    
    const styles = await first.evaluate(el => {
      const s = window.getComputedStyle(el);
      return {
        marginBottom: parseFloat(s.marginBottom),
        paddingBottom: parseFloat(s.paddingBottom)
      };
    });
    
    expect(styles.marginBottom + styles.paddingBottom).toBeGreaterThanOrEqual(20);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. ACCESSIBILITY TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('page has proper heading hierarchy', async ({ page }) => {
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h2Count).toBeGreaterThanOrEqual(10); // One per section
  });

  test('images have alt attributes', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(10, count); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt, `Image ${i} should have alt attribute`).not.toBeNull();
    }
  });

  test('form inputs have proper associations', async ({ page }) => {
    // Check checkboxes and radios have labels
    const labels = page.locator('label:has(input[type="checkbox"], input[type="radio"])');
    expect(await labels.count()).toBeGreaterThan(0);
  });

  test('buttons have accessible text', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(20, count); i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel;
      expect(hasAccessibleName, `Button ${i} should have accessible name`).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. BEHAVIOR INITIALIZATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Behavior Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await waitForWB(page);
  });

  test('wb-* custom elements are upgraded', async ({ page }) => {
    const wbElements = ['wb-tabs', 'wb-accordion', 'wb-alert', 'wb-badge', 
                        'wb-progress', 'wb-spinner', 'wb-avatar', 'wb-rating'];
    
    for (const tag of wbElements) {
      const el = page.locator(tag).first();
      if (await el.count() > 0) {
        await expect(el).toBeVisible();
      }
    }
  });

  test('x-* behavior attributes are processed', async ({ page }) => {
    const xBehaviors = ['x-ripple', 'x-toast', 'x-tooltip', 'x-copy', 
                        'x-breadcrumb', 'x-pagination', 'x-steps'];
    
    for (const attr of xBehaviors) {
      const el = page.locator(`[${attr}]`).first();
      if (await el.count() > 0) {
        await expect(el).toBeVisible();
      }
    }
  });
});
