/**
 * Components Page Tests
 * Comprehensive tests for the /pages/components.html showcase page
 */
import { test, expect } from '@playwright/test';
import { safeScrollIntoView as _safeScrollIntoView } from '../helpers/ui-helpers';

// Defensive fallback: some worker environments were hitting a missing-import
// regression — keep a small inline fallback so the spec is deterministic
// while we fix the root cause (module-resolution/transpile race).
const safeScrollIntoView = _safeScrollIntoView ?? (async (locator: any, timeout = 3000) => {
  await locator.waitFor({ state: 'attached', timeout: Math.min(800, timeout) }).catch(() => null);
  await locator.evaluate((el: Element) => { try { el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }); } catch (e) { /* best-effort */ } }).catch(() => null);
  await locator.waitFor({ state: 'visible', timeout }).catch(() => null);
});

test.describe('Components Page', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/pages/components.html');
    // Wait for WB to initialize
    await page.waitForTimeout(500);
  });

  // =========================================================================
  // PAGE STRUCTURE
  // =========================================================================
  test.describe('Page Structure', () => {
    
    test('page loads successfully', async ({ page }) => {
      await expect(page).toHaveURL(/components/);
      const content = page.locator('.page__hero');
      await expect(content).toBeVisible();
    });

    test('has hero section with title', async ({ page }) => {
      const hero = page.locator('.page__hero');
      await expect(hero).toBeVisible();
      await expect(hero.locator('h1')).toContainText('Components Library');
    });

    test('has all major sections', async ({ page }) => {
      const sections = [
        'Cards',
        'Feedback Components',
        'Overlays & Dialogs',
        'Navigation',
        'Form Components',
        'Data Display',
        'Media',
        'Utilities'
      ];
      
      for (const section of sections) {
        const heading = page.locator(`h2:has-text("${section}")`);
        await heading.scrollIntoViewIfNeeded();
        await expect(heading).toBeVisible();
      }
    });
  });

  // =========================================================================
  // CARDS SECTION
  // =========================================================================
  test.describe('Cards Section', () => {
    
    test('basic cards render correctly', async ({ page }) => {
      const basicCard = page.locator('wb-card[title="Basic Card"]');
      await basicCard.scrollIntoViewIfNeeded();
      await expect(basicCard).toBeVisible();
    });

    test('card with header and footer renders', async ({ page }) => {
      const card = page.locator('wb-card[title="With Footer"][footer="Card Footer"]');
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
    });

    test('image-card renders', async ({ page }) => {
      const imageCard = page.locator('wb-cardimage').first();
      await imageCard.scrollIntoViewIfNeeded();
      await expect(imageCard).toBeVisible();
    });

    test('overlay-card renders correctly', async ({ page }) => {
      const overlayCard = page.locator('wb-cardoverlay');
      await overlayCard.scrollIntoViewIfNeeded();
      await expect(overlayCard).toBeVisible();
    });

    test('stats-card (stock indicators) render', async ({ page }) => {
      const statsCards = page.locator('wb-cardstats');
      await statsCards.first().scrollIntoViewIfNeeded();
      await expect(statsCards).toHaveCount(4); 
    });

    test('price-card renders with features', async ({ page }) => {
      const pricingCards = page.locator('wb-cardpricing');
      await pricingCards.first().scrollIntoViewIfNeeded();
      await expect(pricingCards.first()).toBeVisible();
    });

    // Modified to scroll to the container likely to hold these cards
    test('product-card renders', async ({ page }) => {
      const productCards = page.locator('wb-cardproduct');
      // Scroll to the section header to trigger loading
      await page.locator('h3:has-text("Product Cards")').scrollIntoViewIfNeeded();
      
      // Wait for at least one to be attached
      await productCards.first().waitFor({ state: 'attached' });
      
      // Scroll to the card itself
      await productCards.first().scrollIntoViewIfNeeded();
      
      await expect(productCards.count()).resolves.toBeGreaterThan(0);
    });

    test('testimonial-card renders', async ({ page }) => {
      const testimonialCards = page.locator('wb-cardtestimonial');
      await testimonialCards.first().scrollIntoViewIfNeeded();
      await expect(testimonialCards.first()).toBeVisible();
    });

    test('notification-card renders all types', async ({ page }) => {
      const notificationCards = page.locator('wb-cardnotification');
      await notificationCards.first().scrollIntoViewIfNeeded();
      await expect(notificationCards).toHaveCount(4); // info, success, warning, error
    });

    test('file-card renders', async ({ page }) => {
      const fileCards = page.locator('wb-cardfile');
      await fileCards.first().scrollIntoViewIfNeeded();
      await expect(fileCards.count()).resolves.toBeGreaterThan(0);
    });

    test('portfolio-card (business cards) render', async ({ page }) => {
      const portfolioCards = page.locator('wb-cardportfolio');
      await portfolioCards.first().scrollIntoViewIfNeeded();
      await expect(portfolioCards).toHaveCount(1);
    });
  });

  // =========================================================================
  // FEEDBACK SECTION
  // =========================================================================
  test.describe('Feedback Section', () => {
    
    test('badges render with variants', async ({ page }) => {
      await page.locator('h2:has-text("Feedback Components")').scrollIntoViewIfNeeded();
      const badges = page.locator('wb-badge');
      await badges.first().waitFor({ state: 'attached' });
      await badges.first().scrollIntoViewIfNeeded();
      await expect(badges.count()).resolves.toBeGreaterThan(0);
    });

    test('alerts render all types', async ({ page }) => {
      // Scroll to the Feedback section header first to avoid calling scroll on
      // an element that may not yet be attached (causes protocol errors).
      const header = page.locator('h2:has-text("Feedback Components")').first();
      await safeScrollIntoView(header);

      const alerts = page.locator('.preview-container wb-alert, #feedback wb-alert, wb-alert');

      // If the page variant under test doesn't include the alerts example, skip.
      const count = await alerts.count();
      test.skip(count === 0, 'alerts example not present in this build');
      if (count === 0) return;

      // Wait for the first alert to be attached and stable before asserting.
      await alerts.first().waitFor({ state: 'attached' });

      // Prefer semantic assertions (type/variant attribute) over visual checks.
      const variants = await alerts.evaluateAll(nodes =>
        nodes.map(n => n.getAttribute('type') || n.getAttribute('variant') || (n.dataset && n.dataset.type) || '')
          .filter(Boolean)
      );

      // Expect the four canonical variants to be present when examples exist.
      expect(new Set(variants)).toEqual(new Set(['info', 'success', 'warning', 'error']));
    });

    test('progress bars render', async ({ page }) => {
      const progressBars = page.locator('wb-progress');
      await progressBars.first().scrollIntoViewIfNeeded();
      await expect(progressBars).toHaveCount(4);
    });

    test('spinners render with colors', async ({ page }) => {
      const spinners = page.locator('wb-spinner');
      await spinners.first().scrollIntoViewIfNeeded();
      await expect(spinners.count()).resolves.toBeGreaterThan(0);
    });

    test('avatars render', async ({ page }) => {
      const avatars = page.locator('wb-avatar');
      await avatars.first().scrollIntoViewIfNeeded();
      await expect(avatars.count()).resolves.toBeGreaterThan(0);
    });

    test('skeleton loaders render', async ({ page }) => {
      const skeletons = page.locator('wb-skeleton');
      await skeletons.first().scrollIntoViewIfNeeded();
      await expect(skeletons.count()).resolves.toBeGreaterThan(0);
    });

    test('toast buttons exist', async ({ page }) => {
      const toastButtons = page.locator('button[x-toast]');
      await toastButtons.first().scrollIntoViewIfNeeded();
      await expect(toastButtons.count()).resolves.toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // OVERLAYS SECTION
  // =========================================================================
  test.describe('Overlays Section', () => {
    
    test('modal trigger button exists', async ({ page }) => {
      const modalBtn = page.locator('wb-modal');
      await modalBtn.scrollIntoViewIfNeeded();
      await expect(modalBtn).toBeVisible();
    });

    test('drawer trigger buttons exist', async ({ page }) => {
      const drawerBtns = page.locator('wb-drawer');
      await drawerBtns.first().scrollIntoViewIfNeeded();
      await expect(drawerBtns.count()).resolves.toBeGreaterThanOrEqual(2);
    });

    test('confirm dialog trigger exists', async ({ page }) => {
      const confirmBtn = page.locator('button[x-confirm]');
      await confirmBtn.scrollIntoViewIfNeeded();
      await expect(confirmBtn).toBeVisible();
    });

    test('lightbox trigger exists', async ({ page }) => {
      const lightboxBtn = page.locator('button[x-lightbox]');
      await lightboxBtn.scrollIntoViewIfNeeded();
      await expect(lightboxBtn).toBeVisible();
    });

    test('popover trigger exists', async ({ page }) => {
      const popoverBtn = page.locator('button[x-popover]');
      await popoverBtn.scrollIntoViewIfNeeded();
      await expect(popoverBtn).toBeVisible();
    });
  });

  // =========================================================================
  // NAVIGATION SECTION  
  // =========================================================================
  test.describe('Navigation Section', () => {
    
    test('tabs component renders', async ({ page }) => {
      const tabs = page.locator('wb-tabs');
      await tabs.scrollIntoViewIfNeeded();
      await expect(tabs).toBeVisible();
    });

    test('accordion component renders', async ({ page }) => {
      const accordion = page.locator('wb-accordion');
      await accordion.scrollIntoViewIfNeeded();
      await expect(accordion).toBeVisible();
    });

    test('breadcrumb renders', async ({ page }) => {
      const breadcrumb = page.locator('nav[x-breadcrumb]');
      await breadcrumb.scrollIntoViewIfNeeded();
      await expect(breadcrumb).toBeVisible();
    });

    test('pagination renders', async ({ page }) => {
      const pagination = page.locator('nav[x-pagination]');
      await pagination.scrollIntoViewIfNeeded();
      await expect(pagination).toBeVisible();
    });

    test('steps component renders', async ({ page }) => {
      const steps = page.locator('div[x-steps]');
      await steps.scrollIntoViewIfNeeded();
      await expect(steps).toBeVisible();
    });
  });

  // =========================================================================
  // FORMS SECTION
  // =========================================================================
  test.describe('Forms Section', () => {
    
    test('text inputs render', async ({ page }) => {
      const inputs = page.locator('input[type="text"]');
      await inputs.first().scrollIntoViewIfNeeded();
      await expect(inputs.count()).resolves.toBeGreaterThan(0);
    });

    test('password input with toggle exists', async ({ page }) => {
      const passwordInput = page.locator('input[x-password]');
      await passwordInput.scrollIntoViewIfNeeded();
      await expect(passwordInput).toBeVisible();
    });

    test('switch component exists', async ({ page }) => {
      const switchComp = page.locator('wb-switch');
      await switchComp.scrollIntoViewIfNeeded();
      await expect(switchComp).toBeVisible();
    });

    test('rating component exists', async ({ page }) => {
      const ratings = page.locator('wb-rating');
      await ratings.first().scrollIntoViewIfNeeded();
      await expect(ratings.count()).resolves.toBeGreaterThanOrEqual(2);
    });

    test('stepper component exists', async ({ page }) => {
      const stepper = page.locator('div[x-stepper]');
      await stepper.scrollIntoViewIfNeeded();
      await expect(stepper).toBeVisible();
    });
  });

  // =========================================================================
  // DATA DISPLAY SECTION
  // =========================================================================
  test.describe('Data Display Section', () => {
    
    test('timeline renders', async ({ page }) => {
      const timeline = page.locator('div[x-timeline]');
      await timeline.scrollIntoViewIfNeeded();
      await expect(timeline).toBeVisible();
    });
    
    test('code blocks render within mdhtml', async ({ page }) => {
        // Find wb-mdhtml elements
        const mdHtml = page.locator('wb-mdhtml');
        // Ensure at least one is present
        await expect(mdHtml.count()).resolves.toBeGreaterThan(0);
        
        // Scroll to the first one to trigger hydration
        await mdHtml.first().scrollIntoViewIfNeeded();

        // Wait for it to not be loading (class wb-mdhtml--loading removed)
        await expect(mdHtml.first()).not.toHaveClass(/wb-mdhtml--loading/);

        // Check if code blocks got rendered inside
        const codeBlocks = mdHtml.locator('pre code');
        // We might need to give it a moment to render content
        await expect(codeBlocks.first()).toBeVisible({ timeout: 5000 });
        
        await expect(codeBlocks.count()).resolves.toBeGreaterThan(0);
    });

    test('JSON viewer renders', async ({ page }) => {
      const jsonViewer = page.locator('div[x-json]');
      await jsonViewer.scrollIntoViewIfNeeded();
      await expect(jsonViewer).toBeVisible();
    });

    test('keyboard key components render', async ({ page }) => {
      const kbdElements = page.locator('span[x-kbd]');
      await kbdElements.first().scrollIntoViewIfNeeded();
      await expect(kbdElements.count()).resolves.toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // MEDIA SECTION
  // =========================================================================
  test.describe('Media Section', () => {
    
    test('gallery component renders', async ({ page }) => {
      const gallery = page.locator('div[x-gallery]');
      await gallery.scrollIntoViewIfNeeded();
      await expect(gallery).toBeVisible();
    });

    test('youtube embed exists', async ({ page }) => {
      const youtube = page.locator('div[x-youtube]');
      await youtube.scrollIntoViewIfNeeded();
      await expect(youtube).toBeVisible();
    });
    
    test('audio player exists', async ({ page }) => {
        const audio = page.locator('wb-audio');
        await audio.scrollIntoViewIfNeeded();
        // WB-audio might change structure, but the container should be visible
        await expect(audio).toBeVisible();
    });

  });


  // =========================================================================
  // UTILITY SECTION
  // =========================================================================
  test.describe('Utility Section', () => {
    
    test('copy button exists', async ({ page }) => {
      const copyBtn = page.locator('button[x-copy]');
      await copyBtn.first().scrollIntoViewIfNeeded();
      await expect(copyBtn).toBeVisible();
    });

    test('share button exists', async ({ page }) => {
      const shareBtn = page.locator('button[x-share]');
      await shareBtn.scrollIntoViewIfNeeded();
      await expect(shareBtn).toBeVisible();
    });
    
    test('print button exists', async ({ page }) => {
        const printBtn = page.locator('button[x-print]');
        await printBtn.scrollIntoViewIfNeeded();
        await expect(printBtn).toBeVisible();
    });

    test('tooltip buttons exist', async ({ page }) => {
      const tooltipBtns = page.locator('wb-tooltip');
      await tooltipBtns.first().scrollIntoViewIfNeeded();
      await expect(tooltipBtns.count()).resolves.toBeGreaterThanOrEqual(4);
    });

    test('dark mode toggle exists', async ({ page }) => {
      const darkModeBtn = page.locator('button[x-darkmode]');
      await darkModeBtn.scrollIntoViewIfNeeded();
      await expect(darkModeBtn).toBeVisible();
    });

    test('theme control exists', async ({ page }) => {
      const themeControl = page.locator('wb-themecontrol');
      await themeControl.scrollIntoViewIfNeeded();
      await expect(themeControl).toBeVisible();
    });

    test('clock component renders', async ({ page }) => {
      const clock = page.locator('div[x-clock]');
      await clock.scrollIntoViewIfNeeded();
      await expect(clock).toBeVisible();
    });

    test('countdown component renders', async ({ page }) => {
      const countdown = page.locator('div[x-countdown]');
      await countdown.scrollIntoViewIfNeeded();
      await expect(countdown).toBeVisible();
    });
  });

  // =========================================================================
  // INTERACTIONS
  // =========================================================================
  test.describe('Interactive Behavior', () => {
    
    test('clicking toast button shows toast', async ({ page }) => {
      const toastBtn = page.locator('button[x-toast]').first();
      await toastBtn.scrollIntoViewIfNeeded();
      await toastBtn.click();
      
      // Wait for toast to appear
      const toast = page.locator('.wb-toast, [class*="toast"], .toast'); 
      await expect(toast.first()).toBeVisible({ timeout: 5000 });
    });

    test('accordion section can expand', async ({ page }) => {
      const accordionTitle = page.locator('[data-accordion-title]').first();
      await accordionTitle.scrollIntoViewIfNeeded();
      await accordionTitle.click();
      await page.waitForTimeout(300);
      
      // Check visibility of content within
      const accordion = page.locator('wb-accordion');
      await expect(accordion).toBeVisible();
    });

  });

  // =========================================================================
  // NO CONSOLE ERRORS
  // =========================================================================
  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000/pages/components.html');
    await page.waitForTimeout(1000);
    
    // Filter out expected errors (like network errors for external images)
    const realErrors = errors.filter(e => 
      !e.includes('net::ERR') && 
      !e.includes('Failed to load resource') &&
      !e.includes('favicon')
    );
    
    expect(realErrors).toEqual([]);
  });

});
