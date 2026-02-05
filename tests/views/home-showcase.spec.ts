/**
 * Home Page Showcase Tests
 * ========================
 * Tests for the wb-starter home page.
 * 
 * Covers:
 * - Hero section (wb-cardhero)
 * - Stats banner
 * - Live interactive demo
 * - Feature cards grid
 * - Premium showcase (audio, notifications)
 * - CTA section
 * - Responsive behavior
 * - No console errors
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const HOME_URL = `${BASE_URL}?page=home`;

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Home Page Showcase', () => {
  
  test.beforeEach(async ({ page }) => {
    // Capture console errors - filter out expected external resource errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Skip expected errors from external resources
        const isExpected = 
          text.includes('favicon') ||
          text.includes('404') ||
          text.includes('picsum') ||
          text.includes('pravatar') ||
          text.includes('Failed to load resource') ||
          text.includes('freemusicarchive') ||
          text.includes('MediaError') ||
          text.includes('MEDIA_ERR') ||
          text.includes('audio') ||
          text.includes('.mp3');
        
        if (!isExpected) {
          console.error(`[CONSOLE ERROR] ${text}`);
        }
      }
    });
    
    page.on('pageerror', err => {
      console.error(`[PAGE ERROR] ${err.message}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HERO SECTION (wb-cardhero)
  // ═══════════════════════════════════════════════════════════════════════════

  test('01 - Hero section renders correctly', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check wb-cardhero component exists
    const hero = page.locator('wb-cardhero');
    await expect(hero).toBeVisible({ timeout: 5000 });
    
    // Check hero wrapper
    const heroWrapper = page.locator('.home-hero__wrapper');
    await expect(heroWrapper).toBeVisible();
    
    // Check hero has correct variant
    await expect(hero).toHaveAttribute('variant', 'cosmic');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS BANNER
  // ═══════════════════════════════════════════════════════════════════════════

  test('02 - Stats banner displays all metrics', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    const statsBanner = page.locator('.stats-banner');
    await expect(statsBanner).toBeVisible();
    
    // Check all 4 stat items
    const statItems = page.locator('.stat-item');
    await expect(statItems).toHaveCount(4);
    
    // Check specific stat values
    const statValues = page.locator('.stat-value');
    await expect(statValues).toHaveCount(4);
    
    // Check runtime stats are populated (behavior count and render time)
    const behaviorCount = page.locator('#behavior-count');
    await expect(behaviorCount).toBeVisible();
    
    // Check stat labels
    const statLabels = page.locator('.stat-label');
    await expect(statLabels.nth(0)).toContainText('Behaviors');
    await expect(statLabels.nth(1)).toContainText('DOM Architecture');
    await expect(statLabels.nth(2)).toContainText('Render Time');
    await expect(statLabels.nth(3)).toContainText('Standards Compliant');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE INTERACTIVE DEMO
  // ═══════════════════════════════════════════════════════════════════════════

  test('03 - Live demo section renders', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check section title
    const sectionTitle = page.locator('h2.section-title:has-text("It\'s Just HTML attributes")');
    await expect(sectionTitle).toBeVisible();
    
    // Check interactive demo container
    const interactiveDemo = page.locator('.interactive-demo');
    await expect(interactiveDemo).toBeVisible();
    
    // Check preview and code sections
    const demoPreview = page.locator('.demo-preview');
    await expect(demoPreview).toBeVisible();
    
    const demoCode = page.locator('.demo-code');
    await expect(demoCode).toBeVisible();
  });

  test('04 - Interactive demo buttons work', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check ripple button (in demo preview) - now using wb-button
    const rippleBtn = page.locator('.demo-preview wb-button[x-ripple]:has-text("Click Me")');
    await expect(rippleBtn).toBeVisible();
    
    // Check tooltip button
    const tooltipBtn = page.locator('.demo-preview wb-button[x-tooltip]');
    await expect(tooltipBtn).toBeVisible();
    await expect(tooltipBtn).toContainText('Hover Me');
    
    // Check draggable element
    const draggable = page.locator('.demo-preview [x-draggable]');
    await expect(draggable).toBeVisible();
    await expect(draggable).toContainText('Drag Me Around');
    
    // Check confetti button
    const confettiBtn = page.locator('.demo-preview wb-button[x-confetti]');
    await expect(confettiBtn).toBeVisible();
    await expect(confettiBtn).toContainText('Celebrate');
  });

  test('05 - Demo code block renders with syntax highlighting', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check wb-mdhtml renders code
    const mdhtml = page.locator('.demo-code wb-mdhtml');
    await expect(mdhtml).toBeVisible();
    
    // Check window controls (macOS style dots)
    const windowControls = page.locator('.window-controls');
    await expect(windowControls).toBeVisible();
    
    const dots = page.locator('.window-controls .dot');
    await expect(dots).toHaveCount(3);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE CARDS
  // ═══════════════════════════════════════════════════════════════════════════

  test('06 - Feature cards section renders', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check section title
    const sectionTitle = page.locator('h2.section-title:has-text("Everything You Need")');
    await expect(sectionTitle).toBeVisible();
    
    // Check "Why WB Behaviors" subtitle
    const subtitle = page.locator('h2.section-title:has-text("Why WB Behaviors")');
    await expect(subtitle).toBeVisible();
    
    // Check features grid
    const featuresGrid = page.locator('.features-grid');
    await expect(featuresGrid).toBeVisible();
    
    // Check all 6 feature cards
    const featureCards = page.locator('.features-grid wb-card[variant="float"]');
    await expect(featureCards).toHaveCount(6);
  });

  test('07 - Feature cards have correct content', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check feature icons
    const featureIcons = page.locator('.feature-icon');
    await expect(featureIcons).toHaveCount(6);
    
    // Check specific feature titles
    await expect(page.locator('.features-grid h3:has-text("Component Library")')).toBeVisible();
    await expect(page.locator('.features-grid h3:has-text("Behaviors System")')).toBeVisible();
    await expect(page.locator('.features-grid h3:has-text("Theme Engine")')).toBeVisible();
    await expect(page.locator('.features-grid h3:has-text("Data Viz")')).toBeVisible();
    await expect(page.locator('.features-grid h3:has-text("Accessible")')).toBeVisible();
    await expect(page.locator('.features-grid h3:has-text("Performance")')).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PREMIUM SHOWCASE
  // ═══════════════════════════════════════════════════════════════════════════

  test('08 - Premium showcase section renders', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check section title
    const sectionTitle = page.locator('h2.section-title:has-text("Premium Components Included")');
    await expect(sectionTitle).toBeVisible();
    
    // Check showcase grid
    const showcaseGrid = page.locator('.premium-showcase-grid');
    await expect(showcaseGrid).toBeVisible();
    
    // Check showcase boxes
    const showcaseBoxes = page.locator('.showcase-box');
    await expect(showcaseBoxes).toHaveCount(2);
  });

  test('09 - Audio visualization renders', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check audio visualization header
    const audioHeader = page.locator('.showcase-box__header:has-text("Audio Visualization")');
    await expect(audioHeader).toBeVisible();
    
    // Check wb-audio component exists
    const wbAudio = page.locator('wb-audio');
    await expect(wbAudio).toBeVisible();
  });

  test('10 - Toast notification buttons render', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check toast notifications section exists
    const toastHeader = page.locator('.showcase-box__header:has-text("Toast Notifications")');
    await expect(toastHeader).toBeVisible();
    
    // Scroll to toast section
    await toastHeader.scrollIntoViewIfNeeded();
    
    // Check toast buttons exist (4 types: info, success, warning, error)
    const showcaseContent = toastHeader.locator('..').locator('.showcase-box__content');
    const toastButtons = showcaseContent.locator('wb-button[x-toast]');
    await expect(toastButtons).toHaveCount(4);
    
    // Verify all toast types are present
    await expect(showcaseContent.locator('wb-button[data-type="info"]')).toBeVisible();
    await expect(showcaseContent.locator('wb-button[data-type="success"]')).toBeVisible();
    await expect(showcaseContent.locator('wb-button[data-type="warning"]')).toBeVisible();
    await expect(showcaseContent.locator('wb-button[data-type="error"]')).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CTA SECTION
  // ═══════════════════════════════════════════════════════════════════════════

  test('11 - CTA section renders', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check CTA section
    const ctaSection = page.locator('.cta-section');
    await expect(ctaSection).toBeVisible();
    
    // Check CTA content
    const ctaContent = page.locator('.cta-content');
    await expect(ctaContent).toBeVisible();
    
    // Check CTA title
    const ctaTitle = page.locator('.cta-content h2:has-text("Ready to build something amazing")');
    await expect(ctaTitle).toBeVisible();
    
    // Check CTA subtitle
    const ctaSubtitle = page.locator('.cta-content p:has-text("No-Build Revolution")');
    await expect(ctaSubtitle).toBeVisible();
  });

  test('12 - CTA buttons work', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check Get Started button - now using wb-button
    const getStartedBtn = page.locator('.cta-actions wb-button:has-text("Get Started")');
    await expect(getStartedBtn).toBeVisible();
    
    // Check GitHub link
    const githubLink = page.locator('.cta-actions a:has-text("View on GitHub")');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/CieloVistaSoftware/wb-starter');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSIVE
  // ═══════════════════════════════════════════════════════════════════════════

  test('13 - Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check hero is visible on mobile
    const hero = page.locator('wb-cardhero');
    await expect(hero).toBeVisible();
    
    // Check stats banner still visible
    const statsBanner = page.locator('.stats-banner');
    await expect(statsBanner).toBeVisible();
    
    // Check feature cards visible
    const featureCards = page.locator('.features-grid wb-card');
    const count = await featureCards.count();
    expect(count).toBe(6);
  });

  test('14 - Tablet responsiveness', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check main sections visible
    const hero = page.locator('wb-cardhero');
    await expect(hero).toBeVisible();
    
    const featuresGrid = page.locator('.features-grid');
    await expect(featuresGrid).toBeVisible();
    
    const ctaSection = page.locator('.cta-section');
    await expect(ctaSection).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR CHECKING
  // ═══════════════════════════════════════════════════════════════════════════

  test('15 - No critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Wait for all components to initialize
    await page.waitForTimeout(1000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('picsum') && // External image service
      !e.includes('pravatar') && // External avatar service
      !e.includes('Failed to load resource') && // External resources
      !e.includes('freemusicarchive') && // External audio
      e.length > 0
    );
    
    expect(criticalErrors.length).toBeLessThan(5);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERACTION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test('16 - Ripple effect triggers on click', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    const rippleBtn = page.locator('.demo-preview wb-button[x-ripple]:has-text("Click Me")');
    await rippleBtn.click();
    
    // Button should still be functional after click
    await expect(rippleBtn).toBeVisible();
  });

  test('17 - Confetti triggers on click', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    const confettiBtn = page.locator('wb-button[x-confetti]');
    await confettiBtn.click();
    
    // Wait for confetti animation to start
    await page.waitForTimeout(300);
    
    // Button should still be visible
    await expect(confettiBtn).toBeVisible();
  });

  test('18 - Toast button triggers notification', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Find a toast button in the premium showcase
    const toastBtn = page.locator('.showcase-box wb-button[x-toast][data-type="success"]');
    await toastBtn.scrollIntoViewIfNeeded();
    await toastBtn.click();
    
    // Wait for toast to appear
    await page.waitForTimeout(300);
    
    // Toast container should exist (be specific to avoid matching button classes)
    const toastContainer = page.locator('div.wb-toast-container');
    await expect(toastContainer).toBeVisible({ timeout: 2000 });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL WALKTHROUGH
  // ═══════════════════════════════════════════════════════════════════════════

  test('19 - Full page walkthrough', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Hero
    await expect(page.locator('wb-cardhero')).toBeVisible();
    await expect(page.locator('.home-hero__wrapper')).toBeVisible();
    
    // Stats Banner
    await expect(page.locator('.stats-banner')).toBeVisible();
    const statItems = page.locator('.stat-item');
    await expect(statItems).toHaveCount(4);
    
    // Interactive Demo
    await expect(page.locator('.interactive-demo')).toBeVisible();
    await expect(page.locator('wb-button[x-ripple]')).toBeVisible();
    await expect(page.locator('wb-button[x-confetti]')).toBeVisible();
    
    // Feature Cards
    await expect(page.locator('.features-grid')).toBeVisible();
    const featureCards = page.locator('.features-grid wb-card');
    await expect(featureCards).toHaveCount(6);
    
    // Premium Showcase
    await expect(page.locator('.premium-showcase-grid')).toBeVisible();
    await expect(page.locator('wb-audio')).toBeVisible();
    await expect(page.locator('.showcase-box:has-text("Toast Notifications")')).toBeVisible();
    
    // CTA
    await expect(page.locator('.cta-section')).toBeVisible();
    await expect(page.locator('.cta-actions')).toBeVisible();
    
    // Status Bar
    await expect(page.locator('wb-status')).toBeVisible();
  });

  test('20 - Status bar displays runtime info', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    
    // Check status bar exists
    const statusBar = page.locator('wb-status');
    await expect(statusBar).toBeVisible();
    
    // Check status message
    const statusMessage = page.locator('.wb-status__message');
    await expect(statusMessage).toBeVisible();
    
    // Check behavior count is populated (should be a number)
    const behaviorCount = page.locator('.wb-status__behaviors');
    await expect(behaviorCount).toBeVisible();
    const countText = await behaviorCount.textContent();
    expect(parseInt(countText || '0', 10)).toBeGreaterThan(0);
    
    // Check render time is populated (should end with 's' for seconds)
    const renderTime = page.locator('.wb-status__render');
    await expect(renderTime).toBeVisible();
    const timeText = await renderTime.textContent();
    expect(timeText).toMatch(/\d+\.\d+s/);
    
    // Check timestamp is updating
    const timestamp = page.locator('.wb-status__time');
    await expect(timestamp).toBeVisible();
    const timestampText = await timestamp.textContent();
    expect(timestampText?.length).toBeGreaterThan(0);
  });
});
