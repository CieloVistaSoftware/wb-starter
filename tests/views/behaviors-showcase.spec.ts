/**
 * WB Behaviors Showcase - Comprehensive Tests
 * ============================================
 * Tests every section, component, and code example on behaviors.html
 */

import { test, expect, Page } from '@playwright/test';

const BEHAVIORS_URL = '/?page=behaviors';

// Helper: Wait for WB to initialize
async function waitForWB(page: Page) {
  await page.waitForFunction(() => (window as any).WB, { timeout: 15000 });
  await page.waitForTimeout(1000); // Give components time to render
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('[WB]') && !msg.text().includes('favicon')) {
        errors.push(msg.text());
      }
    });
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('header exists with title', async ({ page }) => {
    const header = page.locator('#header');
    await expect(header).toBeVisible();
    const h1 = header.locator('h1');
    await expect(h1).toContainText('Behaviors');
  });

  test('navigation exists with all section links', async ({ page }) => {
    const nav = page.locator('#nav');
    await expect(nav).toBeVisible();
    
    const sections = ['Buttons', 'Inputs', 'Selection', 'Feedback', 'Overlays', 'Navigation', 'Data', 'Media', 'Effects', 'Utilities'];
    for (const section of sections) {
      const link = nav.locator(`a:has-text("${section}")`);
      await expect(link).toBeVisible();
    }
  });

  test('all 10 main sections exist', async ({ page }) => {
    const sectionIds = ['buttons', 'inputs', 'selection', 'feedback', 'overlays', 'navigation', 'data', 'media', 'effects', 'utilities'];
    for (const id of sectionIds) {
      const section = page.locator(`#${id}`);
      await expect(section, `Section #${id} should exist`).toBeVisible();
    }
  });

  test('footer exists', async ({ page }) => {
    const footer = page.locator('#footer');
    await expect(footer).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUTTONS SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Buttons Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('button variants render (primary, secondary, ghost, disabled)', async ({ page }) => {
    const section = page.locator('#buttons');
    await expect(section.locator('.wb-btn--primary').first()).toBeVisible();
    await expect(section.locator('.wb-btn--secondary').first()).toBeVisible();
    await expect(section.locator('.wb-btn--ghost').first()).toBeVisible();
    await expect(section.locator('button[disabled]').first()).toBeVisible();
  });

  test('button sizes render (sm, md, lg)', async ({ page }) => {
    const section = page.locator('#buttons');
    await expect(section.locator('.wb-btn--sm').first()).toBeVisible();
    await expect(section.locator('.wb-btn--lg').first()).toBeVisible();
  });

  test('ripple button has x-ripple attribute', async ({ page }) => {
    const rippleBtn = page.locator('#buttons button[x-ripple]').first();
    await expect(rippleBtn).toBeVisible();
  });

  test('toast button has x-toast attribute with data-message', async ({ page }) => {
    const toastBtn = page.locator('#buttons button[x-toast]').first();
    await expect(toastBtn).toBeVisible();
    const message = await toastBtn.getAttribute('data-message');
    expect(message).toBeTruthy();
  });

  test('tooltip button has x-tooltip attribute', async ({ page }) => {
    const tooltipBtn = page.locator('#buttons button[x-tooltip]').first();
    await expect(tooltipBtn).toBeVisible();
  });

  test('buttons section has code examples', async ({ page }) => {
    const section = page.locator('#buttons');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INPUTS SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Inputs Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('basic inputs render (text, email, number)', async ({ page }) => {
    const section = page.locator('#inputs');
    await expect(section.locator('input[type="text"]').first()).toBeVisible();
    await expect(section.locator('input[type="email"]').first()).toBeVisible();
    await expect(section.locator('input[type="number"]').first()).toBeVisible();
  });

  test('validation variant inputs render', async ({ page }) => {
    const section = page.locator('#inputs');
    await expect(section.locator('input[data-variant="success"]').first()).toBeVisible();
    await expect(section.locator('input[data-variant="warning"]').first()).toBeVisible();
    await expect(section.locator('input[data-variant="error"]').first()).toBeVisible();
  });

  test('password input has x-password', async ({ page }) => {
    const passwordInput = page.locator('#inputs input[x-password]').first();
    await expect(passwordInput).toBeVisible();
  });

  test('masked inputs exist', async ({ page }) => {
    const maskedInputs = page.locator('#inputs input[x-masked]');
    expect(await maskedInputs.count()).toBeGreaterThanOrEqual(3);
  });

  test('textarea renders', async ({ page }) => {
    const section = page.locator('#inputs');
    const textarea = section.locator('textarea').first();
    await expect(textarea).toBeVisible();
  });

  test('inputs section has code examples', async ({ page }) => {
    const section = page.locator('#inputs');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SELECTION SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Selection Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('checkboxes render', async ({ page }) => {
    const checkboxes = page.locator('#selection input[type="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThanOrEqual(3);
  });

  test('radio buttons render', async ({ page }) => {
    const radios = page.locator('#selection input[type="radio"]');
    expect(await radios.count()).toBeGreaterThanOrEqual(3);
  });

  test('switches render', async ({ page }) => {
    const switches = page.locator('#selection wb-switch');
    expect(await switches.count()).toBeGreaterThanOrEqual(3);
  });

  test('select dropdown renders', async ({ page }) => {
    const select = page.locator('#selection select').first();
    await expect(select).toBeVisible();
  });

  test('rating components render', async ({ page }) => {
    const ratings = page.locator('#selection wb-rating');
    expect(await ratings.count()).toBeGreaterThanOrEqual(3);
  });

  test('stepper renders', async ({ page }) => {
    const stepper = page.locator('#selection [x-stepper]').first();
    await expect(stepper).toBeVisible();
  });

  test('range input renders', async ({ page }) => {
    const range = page.locator('#selection input[type="range"]').first();
    await expect(range).toBeVisible();
  });

  test('selection section has code examples', async ({ page }) => {
    const section = page.locator('#selection');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK SECTION - CRITICAL
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Feedback Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('ALL 4 alert variants render and are visible', async ({ page }) => {
    const alertTypes = ['info', 'success', 'warning', 'error'];
    
    for (const type of alertTypes) {
      const alert = page.locator(`#feedback wb-alert[type="${type}"]`);
      await expect(alert, `Alert type="${type}" should exist`).toBeVisible();
      
      // Check alert has rendered content (not empty)
      const alertHtml = await alert.innerHTML();
      expect(alertHtml.length, `Alert type="${type}" should have content`).toBeGreaterThan(10);
    }
  });

  test('alerts have title and message content', async ({ page }) => {
    const alerts = page.locator('#feedback wb-alert');
    const count = await alerts.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    for (let i = 0; i < count; i++) {
      const alert = alerts.nth(i);
      // Check for title element
      const title = alert.locator('.wb-alert__title, strong');
      const titleCount = await title.count();
      expect(titleCount, `Alert ${i} should have title`).toBeGreaterThanOrEqual(1);
      
      // Check for message element
      const message = alert.locator('.wb-alert__message, p');
      const messageCount = await message.count();
      expect(messageCount, `Alert ${i} should have message`).toBeGreaterThanOrEqual(1);
    }
  });

  test('ALL badge variants render', async ({ page }) => {
    const section = page.locator('#feedback');
    const badges = section.locator('wb-badge');
    expect(await badges.count()).toBeGreaterThanOrEqual(6);
    
    // Check badges have text content
    for (let i = 0; i < await badges.count(); i++) {
      const badge = badges.nth(i);
      const text = await badge.textContent();
      expect(text?.trim().length, `Badge ${i} should have text`).toBeGreaterThan(0);
    }
  });

  test('progress bars render with visible fill', async ({ page }) => {
    const progressBars = page.locator('#feedback wb-progress');
    const count = await progressBars.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    for (let i = 0; i < count; i++) {
      const progress = progressBars.nth(i);
      await expect(progress, `Progress bar ${i} should be visible`).toBeVisible();
      
      // Check progress bar has internal bar element
      const bar = progress.locator('.wb-progress__bar, div');
      const barCount = await bar.count();
      expect(barCount, `Progress bar ${i} should have fill element`).toBeGreaterThanOrEqual(1);
      
      // Check bar has width > 0
      const barWidth = await bar.first().evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.width);
      });
      expect(barWidth, `Progress bar ${i} fill should have width > 0`).toBeGreaterThan(0);
    }
  });

  test('spinners render and are animating', async ({ page }) => {
    const spinners = page.locator('#feedback wb-spinner');
    expect(await spinners.count()).toBeGreaterThanOrEqual(4);
    
    // Check first spinner has animation
    const spinner = spinners.first();
    await expect(spinner).toBeVisible();
    
    const ring = spinner.locator('.wb-spinner__ring, div').first();
    const animation = await ring.evaluate(el => {
      return window.getComputedStyle(el).animation;
    });
    expect(animation).toContain('spin');
  });

  test('toast buttons exist and have proper attributes', async ({ page }) => {
    const section = page.locator('#feedback');
    const toastBtns = section.locator('[x-toast]');
    expect(await toastBtns.count()).toBeGreaterThanOrEqual(4);
    
    // Check each has data-message and data-type
    for (let i = 0; i < await toastBtns.count(); i++) {
      const btn = toastBtns.nth(i);
      const message = await btn.getAttribute('data-message');
      const type = await btn.getAttribute('data-type');
      expect(message, `Toast button ${i} should have data-message`).toBeTruthy();
      expect(type, `Toast button ${i} should have data-type`).toBeTruthy();
    }
  });

  test('feedback section has code examples', async ({ page }) => {
    const section = page.locator('#feedback');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// OVERLAYS SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Overlays Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('modal trigger exists', async ({ page }) => {
    const modal = page.locator('#overlays wb-modal').first();
    await expect(modal).toBeVisible();
  });

  test('drawer triggers exist (left and right)', async ({ page }) => {
    const drawers = page.locator('#overlays wb-drawer');
    expect(await drawers.count()).toBeGreaterThanOrEqual(2);
  });

  test('tooltip buttons exist with all positions', async ({ page }) => {
    const tooltips = page.locator('#overlays button[x-tooltip]');
    expect(await tooltips.count()).toBeGreaterThanOrEqual(4);
  });

  test('popover button exists', async ({ page }) => {
    const popover = page.locator('#overlays [x-popover]').first();
    await expect(popover).toBeVisible();
  });

  test('confirm button exists', async ({ page }) => {
    const confirm = page.locator('#overlays [x-confirm]').first();
    await expect(confirm).toBeVisible();
  });

  test('prompt button exists', async ({ page }) => {
    const prompt = page.locator('#overlays [x-prompt]').first();
    await expect(prompt).toBeVisible();
  });

  test('lightbox buttons exist', async ({ page }) => {
    const lightboxes = page.locator('#overlays [x-lightbox]');
    expect(await lightboxes.count()).toBeGreaterThanOrEqual(2);
  });

  test('overlays section has code examples', async ({ page }) => {
    const section = page.locator('#overlays');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Navigation Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('tabs component renders with content', async ({ page }) => {
    const tabs = page.locator('#navigation wb-tabs').first();
    await expect(tabs).toBeVisible();
    
    // Should have tab panels
    const panels = tabs.locator('[data-tab-title]');
    expect(await panels.count()).toBeGreaterThanOrEqual(2);
  });

  test('accordion component renders with sections', async ({ page }) => {
    const accordion = page.locator('#navigation wb-accordion').first();
    await expect(accordion).toBeVisible();
    
    // Should have accordion items
    const items = accordion.locator('[data-accordion-title]');
    expect(await items.count()).toBeGreaterThanOrEqual(2);
  });

  test('breadcrumb renders', async ({ page }) => {
    const breadcrumb = page.locator('#navigation [x-breadcrumb]').first();
    await expect(breadcrumb).toBeVisible();
  });

  test('pagination renders', async ({ page }) => {
    const pagination = page.locator('#navigation [x-pagination]').first();
    await expect(pagination).toBeVisible();
  });

  test('steps wizard renders', async ({ page }) => {
    const steps = page.locator('#navigation [x-steps]').first();
    await expect(steps).toBeVisible();
  });

  test('navigation section has code examples', async ({ page }) => {
    const section = page.locator('#navigation');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DATA SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Data Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('avatars render', async ({ page }) => {
    const avatars = page.locator('#data wb-avatar');
    expect(await avatars.count()).toBeGreaterThanOrEqual(4);
  });

  test('skeleton loaders render', async ({ page }) => {
    const skeletons = page.locator('#data wb-skeleton');
    expect(await skeletons.count()).toBeGreaterThanOrEqual(3);
  });

  test('timeline renders', async ({ page }) => {
    const timeline = page.locator('#data [x-timeline]').first();
    await expect(timeline).toBeVisible();
  });

  test('keyboard keys render', async ({ page }) => {
    const kbds = page.locator('#data [x-kbd]');
    expect(await kbds.count()).toBeGreaterThanOrEqual(2);
  });

  test('data section has code examples', async ({ page }) => {
    const section = page.locator('#data');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Media Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('enhanced images render', async ({ page }) => {
    const images = page.locator('#media img[x-image]');
    expect(await images.count()).toBeGreaterThanOrEqual(2);
  });

  test('gallery renders with images', async ({ page }) => {
    const gallery = page.locator('#media [x-gallery]').first();
    await expect(gallery).toBeVisible();
    
    const images = gallery.locator('img');
    expect(await images.count()).toBeGreaterThanOrEqual(2);
  });

  test('audio player renders', async ({ page }) => {
    const audio = page.locator('#media wb-audio').first();
    await expect(audio).toBeVisible();
  });

  test('youtube embed renders', async ({ page }) => {
    const youtube = page.locator('#media [x-youtube]').first();
    await expect(youtube).toBeVisible();
  });

  test('media section has code examples', async ({ page }) => {
    const section = page.locator('#media');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EFFECTS SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Effects Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
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

  test('effects section has code examples', async ({ page }) => {
    const section = page.locator('#effects');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES SECTION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Utilities Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('copy buttons exist', async ({ page }) => {
    const copyBtns = page.locator('#utilities [x-copy]');
    expect(await copyBtns.count()).toBeGreaterThanOrEqual(2);
  });

  test('share button exists', async ({ page }) => {
    const shareBtn = page.locator('#utilities [x-share]').first();
    await expect(shareBtn).toBeVisible();
  });

  test('print button exists', async ({ page }) => {
    const printBtn = page.locator('#utilities [x-print]').first();
    await expect(printBtn).toBeVisible();
  });

  test('fullscreen button exists', async ({ page }) => {
    const fullscreenBtn = page.locator('#utilities [x-fullscreen]').first();
    await expect(fullscreenBtn).toBeVisible();
  });

  test('clock renders', async ({ page }) => {
    const clock = page.locator('#utilities [x-clock]').first();
    await expect(clock).toBeVisible();
  });

  test('countdown renders', async ({ page }) => {
    const countdown = page.locator('#utilities [x-countdown]').first();
    await expect(countdown).toBeVisible();
  });

  test('dark mode toggle exists', async ({ page }) => {
    const darkmode = page.locator('#utilities [x-darkmode]').first();
    await expect(darkmode).toBeVisible();
  });

  test('truncate element exists', async ({ page }) => {
    const truncate = page.locator('#utilities [x-truncate]').first();
    await expect(truncate).toBeVisible();
  });

  test('utilities section has code examples', async ({ page }) => {
    const section = page.locator('#utilities');
    const codeBlocks = section.locator('wb-mdhtml');
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CODE EXAMPLES (wb-mdhtml)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Code Examples', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('every section has at least 3 code examples', async ({ page }) => {
    const sections = ['buttons', 'inputs', 'selection', 'feedback', 'overlays', 'navigation', 'data', 'media', 'effects', 'utilities'];
    
    for (const sectionId of sections) {
      const section = page.locator(`#${sectionId}`);
      const codeBlocks = section.locator('wb-mdhtml');
      const count = await codeBlocks.count();
      expect(count, `Section #${sectionId} should have at least 3 code examples`).toBeGreaterThanOrEqual(3);
    }
  });

  test('code examples render with syntax highlighting or code content', async ({ page }) => {
    const codeBlocks = page.locator('wb-mdhtml');
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThan(0);
    
    // Check first few code blocks have content
    for (let i = 0; i < Math.min(5, count); i++) {
      const block = codeBlocks.nth(i);
      await expect(block).toBeVisible();
      
      const html = await block.innerHTML();
      expect(html.length, `Code block ${i} should have content`).toBeGreaterThan(5);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTIVE TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Interactive Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('checkbox toggles on click', async ({ page }) => {
    const checkbox = page.locator('#selection input[type="checkbox"]:not(:disabled)').first();
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

  test('toast button shows toast notification', async ({ page }) => {
    const toastBtn = page.locator('#buttons button[x-toast]').first();
    await toastBtn.click();
    
    // Wait for toast to appear
    await page.waitForTimeout(500);
    
    const toast = page.locator('.wb-toast-container div, .wb-toast');
    expect(await toast.count()).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT AND STYLING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Layout Quality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BEHAVIORS_URL);
    await waitForWB(page);
  });

  test('sections have adequate padding/margin', async ({ page }) => {
    const sections = page.locator('section');
    const first = sections.first();
    
    const styles = await first.evaluate(el => {
      const s = window.getComputedStyle(el);
      return {
        marginBottom: parseFloat(s.marginBottom),
        paddingBottom: parseFloat(s.paddingBottom)
      };
    });
    
    expect(styles.marginBottom + styles.paddingBottom).toBeGreaterThanOrEqual(30);
  });

  test('page is responsive - no horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });
});
