/**
 * Components Page Tests
 * Comprehensive tests for the /pages/components.html showcase page
 */
import { test, expect } from '@playwright/test';

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
      const content = page.locator('#components-div-1, .page__hero');
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
        'Feedback',
        'Overlays',
        'Navigation',
        'Forms',
        'Animation',
        'Data Display',
        'Layout',
        'Utility',
        'Media',
        'Tabs'
      ];
      
      for (const section of sections) {
        const heading = page.locator(`h2:has-text("${section}")`);
        await expect(heading).toBeVisible();
      }
    });
  });

  // =========================================================================
  // CARDS SECTION
  // =========================================================================
  test.describe('Cards Section', () => {
    
    test('basic cards render correctly', async ({ page }) => {
      const basicCard = page.locator('basic-card[data-title="Basic Card"]');
      await expect(basicCard).toBeVisible();
    });

    test('card with header and footer renders', async ({ page }) => {
      const card = page.locator('basic-card[data-title="Header"][data-footer="Card Footer"]');
      await expect(card).toBeVisible();
    });

    test('clickable card has click behavior', async ({ page }) => {
      const clickableCard = page.locator('basic-card[data-title="Clickable"]');
      await expect(clickableCard).toBeVisible();
      await expect(clickableCard).toHaveAttribute('data-clickable');
    });

    test('image-card renders', async ({ page }) => {
      const imageCard = page.locator('image-card');
      await expect(imageCard).toBeVisible();
    });

    test('overlay-card renders correctly', async ({ page }) => {
      const overlayCard = page.locator('overlay-card');
      await expect(overlayCard).toBeVisible();
    });

    test('stats-card (stock indicators) render', async ({ page }) => {
      const statsCards = page.locator('stats-card');
      await expect(statsCards).toHaveCount(8); // 8 stock indicators
    });

    test('price-card renders with features', async ({ page }) => {
      const pricingCards = page.locator('price-card');
      await expect(pricingCards.first()).toBeVisible();
    });

    test('product-card renders', async ({ page }) => {
      const productCards = page.locator('product-card');
      expect(await productCards.count()).toBeGreaterThan(0);
    });

    test('testimonial-card renders', async ({ page }) => {
      const testimonialCards = page.locator('testimonial-card');
      await expect(testimonialCards.first()).toBeVisible();
    });

    test('notification-card renders all types', async ({ page }) => {
      const notificationCards = page.locator('notification-card');
      await expect(notificationCards).toHaveCount(4); // info, success, warning, error
    });

    test('file-card renders', async ({ page }) => {
      const fileCards = page.locator('file-card');
      expect(await fileCards.count()).toBeGreaterThan(0);
    });

    test('portfolio-card (business cards) render', async ({ page }) => {
      const portfolioCards = page.locator('portfolio-card');
      await expect(portfolioCards).toHaveCount(2);
    });
  });

  // =========================================================================
  // FEEDBACK SECTION
  // =========================================================================
  test.describe('Feedback Section', () => {
    
    test('badges render with variants', async ({ page }) => {
      const badges = page.locator('[data-wb="badge"]');
      expect(await badges.count()).toBeGreaterThan(0);
    });

    test('alerts render all types', async ({ page }) => {
      const alerts = page.locator('[data-wb="alert"]');
      await expect(alerts).toHaveCount(4); // info, success, warning, error
    });

    test('progress bars render', async ({ page }) => {
      const progressBars = page.locator('[data-wb="progress"]');
      await expect(progressBars).toHaveCount(4);
    });

    test('spinners render with colors', async ({ page }) => {
      const spinners = page.locator('[data-wb="spinner"]');
      expect(await spinners.count()).toBeGreaterThan(0);
    });

    test('avatars render', async ({ page }) => {
      const avatars = page.locator('[data-wb="avatar"]');
      expect(await avatars.count()).toBeGreaterThan(0);
    });

    test('chips render', async ({ page }) => {
      const chips = page.locator('[data-wb="chip"]');
      expect(await chips.count()).toBeGreaterThan(0);
    });

    test('skeleton loaders render', async ({ page }) => {
      const skeletons = page.locator('[data-wb="skeleton"]');
      expect(await skeletons.count()).toBeGreaterThan(0);
    });

    test('toast buttons exist', async ({ page }) => {
      const toastButtons = page.locator('button[data-wb*="toast"]');
      expect(await toastButtons.count()).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // OVERLAYS SECTION
  // =========================================================================
  test.describe('Overlays Section', () => {
    
    test('modal trigger button exists', async ({ page }) => {
      const modalBtn = page.locator('button[data-wb*="modal"]');
      await expect(modalBtn).toBeVisible();
    });

    test('drawer trigger buttons exist', async ({ page }) => {
      const drawerBtns = page.locator('button[data-wb*="drawer"]');
      expect(await drawerBtns.count()).toBeGreaterThanOrEqual(2);
    });

    test('confirm dialog trigger exists', async ({ page }) => {
      const confirmBtn = page.locator('button[data-wb*="confirm"]');
      await expect(confirmBtn).toBeVisible();
    });

    test('lightbox trigger exists', async ({ page }) => {
      const lightboxBtn = page.locator('button[data-wb*="lightbox"]');
      await expect(lightboxBtn).toBeVisible();
    });

    test('popover trigger exists', async ({ page }) => {
      const popoverBtn = page.locator('button[data-wb*="popover"]');
      await expect(popoverBtn).toBeVisible();
    });
  });

  // =========================================================================
  // NAVIGATION SECTION  
  // =========================================================================
  test.describe('Navigation Section', () => {
    
    test('breadcrumb renders', async ({ page }) => {
      const breadcrumb = page.locator('[data-wb="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
    });

    test('pagination renders', async ({ page }) => {
      const pagination = page.locator('[data-wb="pagination"]');
      await expect(pagination).toBeVisible();
    });

    test('steps component renders', async ({ page }) => {
      const steps = page.locator('[data-wb="steps"]');
      await expect(steps).toBeVisible();
    });

    test('back to top button exists', async ({ page }) => {
      const backToTop = page.locator('[data-wb="backtotop"]');
      await expect(backToTop).toBeVisible();
    });
  });

  // =========================================================================
  // FORMS SECTION
  // =========================================================================
  test.describe('Forms Section', () => {
    
    test('text inputs render', async ({ page }) => {
      const inputs = page.locator('#components-div-172 input');
      expect(await inputs.count()).toBeGreaterThan(0);
    });

    test('password input with toggle exists', async ({ page }) => {
      const passwordInput = page.locator('[data-wb="password"]');
      await expect(passwordInput).toBeVisible();
    });

    test('search input exists', async ({ page }) => {
      const searchInput = page.locator('[data-wb="search"]');
      await expect(searchInput).toBeVisible();
    });

    test('masked inputs exist', async ({ page }) => {
      const maskedInputs = page.locator('[data-wb="masked"]');
      expect(await maskedInputs.count()).toBeGreaterThanOrEqual(3);
    });

    test('OTP input exists', async ({ page }) => {
      const otpInput = page.locator('[data-wb="otp"]');
      await expect(otpInput).toBeVisible();
    });

    test('color picker exists', async ({ page }) => {
      const colorPicker = page.locator('[data-wb="colorpicker"]');
      await expect(colorPicker).toBeVisible();
    });

    test('switch component exists', async ({ page }) => {
      const switchComp = page.locator('[data-wb="switch"]');
      await expect(switchComp).toBeVisible();
    });

    test('rating component exists', async ({ page }) => {
      const ratings = page.locator('[data-wb="rating"]');
      expect(await ratings.count()).toBeGreaterThanOrEqual(2);
    });

    test('stepper component exists', async ({ page }) => {
      const stepper = page.locator('[data-wb="stepper"]');
      await expect(stepper).toBeVisible();
    });

    test('tags component exists', async ({ page }) => {
      const tags = page.locator('[data-wb="tags"]');
      await expect(tags).toBeVisible();
    });

    test('autocomplete input exists', async ({ page }) => {
      const autocomplete = page.locator('[data-wb="autocomplete"]');
      await expect(autocomplete).toBeVisible();
    });

    test('file upload component exists', async ({ page }) => {
      const fileUpload = page.locator('[data-wb="file"]');
      await expect(fileUpload).toBeVisible();
    });
  });

  // =========================================================================
  // ANIMATION SECTION
  // =========================================================================
  test.describe('Animation Section', () => {
    
    test('attention seeker buttons exist', async ({ page }) => {
      const animationBtns = ['bounce', 'shake', 'pulse', 'flash', 'tada', 'wobble'];
      for (const anim of animationBtns) {
        const btn = page.locator(`button[data-wb*="${anim}"]`).first();
        await expect(btn).toBeVisible();
      }
    });

    test('entrance animation buttons exist', async ({ page }) => {
      const entranceBtns = page.locator('button[data-wb*="slidein"], button[data-wb*="fadein"], button[data-wb*="zoomin"]');
      expect(await entranceBtns.count()).toBeGreaterThan(0);
    });

    test('special effects buttons exist', async ({ page }) => {
      const specialBtns = page.locator('button[data-wb*="confetti"], button[data-wb*="fireworks"], button[data-wb*="snow"]');
      expect(await specialBtns.count()).toBeGreaterThanOrEqual(3);
    });

    test('countup component exists', async ({ page }) => {
      const countup = page.locator('[data-wb="countup"]');
      await expect(countup).toBeVisible();
    });

    test('marquee component exists', async ({ page }) => {
      const marquee = page.locator('[data-wb="marquee"]');
      await expect(marquee).toBeVisible();
    });
  });

  // =========================================================================
  // DATA DISPLAY SECTION
  // =========================================================================
  test.describe('Data Display Section', () => {
    
    test('table renders with data', async ({ page }) => {
      const table = page.locator('table[data-headers]');
      await expect(table).toBeVisible();
    });

    test('list component renders', async ({ page }) => {
      const list = page.locator('[data-wb="list"]');
      await expect(list).toBeVisible();
    });

    test('description list renders', async ({ page }) => {
      const descList = page.locator('[data-wb="desclist"]');
      await expect(descList).toBeVisible();
    });

    test('timeline renders', async ({ page }) => {
      const timeline = page.locator('[data-wb="timeline"]');
      await expect(timeline).toBeVisible();
    });

    test('stat components render', async ({ page }) => {
      const stats = page.locator('[data-wb="stat"]');
      await expect(stats).toHaveCount(3);
    });

    test('code blocks render', async ({ page }) => {
      const codeBlocks = page.locator('[data-wb="code"]');
      expect(await codeBlocks.count()).toBeGreaterThanOrEqual(2);
    });

    test('JSON viewer renders', async ({ page }) => {
      const jsonViewer = page.locator('[data-wb="json"]');
      await expect(jsonViewer).toBeVisible();
    });

    test('keyboard key components render', async ({ page }) => {
      const kbdElements = page.locator('[data-wb="kbd"]');
      expect(await kbdElements.count()).toBeGreaterThan(0);
    });

    test('empty state component renders', async ({ page }) => {
      const emptyState = page.locator('[data-wb="empty"]');
      await expect(emptyState).toBeVisible();
    });
  });

  // =========================================================================
  // LAYOUT SECTION
  // =========================================================================
  test.describe('Layout Section', () => {
    
    test('grid component renders', async ({ page }) => {
      const grid = page.locator('[data-wb="grid"]');
      await expect(grid).toBeVisible();
    });

    test('stack component renders', async ({ page }) => {
      const stack = page.locator('[data-wb="stack"]');
      await expect(stack).toBeVisible();
    });

    test('cluster component renders', async ({ page }) => {
      const cluster = page.locator('[data-wb="cluster"]');
      await expect(cluster).toBeVisible();
    });

    test('draggable element exists', async ({ page }) => {
      const draggable = page.locator('[data-wb="draggable"]');
      await expect(draggable).toBeVisible();
    });

    test('resizable element exists', async ({ page }) => {
      const resizable = page.locator('[data-wb="resizable"]');
      await expect(resizable).toBeVisible();
    });
  });

  // =========================================================================
  // UTILITY SECTION
  // =========================================================================
  test.describe('Utility Section', () => {
    
    test('ripple button exists', async ({ page }) => {
      const rippleBtn = page.locator('button[data-wb*="ripple"]').first();
      await expect(rippleBtn).toBeVisible();
    });

    test('copy button exists', async ({ page }) => {
      const copyBtn = page.locator('button[data-wb*="copy"]');
      await expect(copyBtn).toBeVisible();
    });

    test('share button exists', async ({ page }) => {
      const shareBtn = page.locator('button[data-wb*="share"]');
      await expect(shareBtn).toBeVisible();
    });

    test('tooltip buttons exist', async ({ page }) => {
      const tooltipBtns = page.locator('button-tooltip');
      expect(await tooltipBtns.count()).toBeGreaterThanOrEqual(4);
    });

    test('dark mode toggle exists', async ({ page }) => {
      const darkModeBtn = page.locator('button[data-wb*="darkmode"]');
      await expect(darkModeBtn).toBeVisible();
    });

    test('theme control exists', async ({ page }) => {
      const themeControl = page.locator('[data-wb="themecontrol"]');
      await expect(themeControl).toBeVisible();
    });

    test('clock component renders', async ({ page }) => {
      const clock = page.locator('[data-wb="clock"]');
      await expect(clock).toBeVisible();
    });

    test('countdown component renders', async ({ page }) => {
      const countdown = page.locator('[data-wb="countdown"]');
      await expect(countdown).toBeVisible();
    });

    test('truncate component exists', async ({ page }) => {
      const truncate = page.locator('[data-wb="truncate"]');
      await expect(truncate).toBeVisible();
    });

    test('hotkey component exists', async ({ page }) => {
      const hotkey = page.locator('[data-wb="hotkey"]');
      await expect(hotkey).toBeVisible();
    });
  });

  // =========================================================================
  // MEDIA SECTION
  // =========================================================================
  test.describe('Media Section', () => {
    
    test('lazy loaded images exist', async ({ page }) => {
      const lazyImage = page.locator('[data-wb="image"][data-lazy]');
      await expect(lazyImage).toBeVisible();
    });

    test('figure with caption exists', async ({ page }) => {
      const figure = page.locator('figure[data-caption]');
      await expect(figure).toBeVisible();
    });

    test('gallery component renders', async ({ page }) => {
      const gallery = page.locator('[data-wb="gallery"]');
      await expect(gallery).toBeVisible();
    });

    test('youtube embed exists', async ({ page }) => {
      const youtube = page.locator('[data-wb="youtube"]');
      await expect(youtube).toBeVisible();
    });

    test('ratio component exists', async ({ page }) => {
      const ratio = page.locator('[data-wb="ratio"]');
      await expect(ratio).toBeVisible();
    });
  });

  // =========================================================================
  // TABS & COLLAPSE SECTION
  // =========================================================================
  test.describe('Tabs & Collapse Section', () => {
    
    test('accordion component renders', async ({ page }) => {
      const accordion = page.locator('[data-wb="accordion"]');
      await expect(accordion).toBeVisible();
    });

    test('accordion has multiple sections', async ({ page }) => {
      const accordionSections = page.locator('[data-accordion-title]');
      expect(await accordionSections.count()).toBeGreaterThanOrEqual(3);
    });

    test('tabs component renders', async ({ page }) => {
      const tabs = page.locator('[data-wb="tabs"]');
      await expect(tabs).toBeVisible();
    });

    test('tabs have multiple panels', async ({ page }) => {
      const tabPanels = page.locator('[data-tab-title]');
      expect(await tabPanels.count()).toBeGreaterThanOrEqual(3);
    });

    test('collapse trigger exists', async ({ page }) => {
      const collapseBtn = page.locator('button[data-wb*="collapse"]');
      await expect(collapseBtn).toBeVisible();
    });

    test('collapse target exists', async ({ page }) => {
      const collapseTarget = page.locator('#collapse-demo');
      await expect(collapseTarget).toBeVisible();
    });
  });

  // =========================================================================
  // INTERACTIONS
  // =========================================================================
  test.describe('Interactive Behavior', () => {
    
    test('clicking toast button shows toast', async ({ page }) => {
      const toastBtn = page.locator('button[data-wb*="toast"]').first();
      await toastBtn.click();
      
      // Wait for toast to appear
      const toast = page.locator('.wb-toast, [class*="toast"]');
      await expect(toast.first()).toBeVisible({ timeout: 3000 });
    });

    test('accordion section can expand', async ({ page }) => {
      const accordionTitle = page.locator('[data-accordion-title]').first();
      await accordionTitle.click();
      await page.waitForTimeout(300);
      
      // Verify content is visible
      const accordion = page.locator('[data-wb="accordion"]');
      await expect(accordion).toBeVisible();
    });

    test('tabs can be switched', async ({ page }) => {
      const tabs = page.locator('[data-wb="tabs"]');
      const tabButtons = tabs.locator('[role="tab"], .wb-tabs__tab, button');
      
      if (await tabButtons.count() > 1) {
        await tabButtons.nth(1).click();
        await page.waitForTimeout(200);
      }
    });

    test('progress bars have animation', async ({ page }) => {
      const progressBar = page.locator('[data-wb="progress"]').first();
      await expect(progressBar).toBeVisible();
      
      // Check that progress bar has internal bar element
      const bar = progressBar.locator('.wb-progress__bar, [class*="bar"]');
      if (await bar.count() > 0) {
        await expect(bar.first()).toBeVisible();
      }
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
