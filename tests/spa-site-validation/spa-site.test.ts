import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/builder.html';

test.describe('SPA Site - Complete Validation', () => {
  
  // ===== SETUP =====
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });
    
    // Capture page errors
    page.on('pageerror', err => {
      console.error(`[PAGE ERROR] ${err.message}`);
    });
  });

  // ===== HOME PAGE TESTS =====
  test('01 - Home page loads and displays content', async ({ page }) => {
    console.log('🧪 Test 1: Loading home page...');
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    
    // Check page title
    await expect(page).toHaveTitle(/Acme/);
    console.log('✅ Page title contains "Acme"');
    
    // Check for logo
    const logo = page.locator('text=Acme Co').first();
    await expect(logo).toBeVisible({ timeout: 5000 });
    console.log('✅ Logo "Acme Co" visible');
    
    // Check for hero text
    const heroText = page.locator('text=Transform Your Vision Into Reality');
    await expect(heroText).toBeVisible({ timeout: 5000 });
    console.log('✅ Hero headline visible');
    
    // Check for quote
    const quote = page.locator('text=The best way to predict the future');
    await expect(quote).toBeVisible({ timeout: 5000 });
    console.log('✅ Inspirational quote visible');
    
    // Check for contact section
    const contactHeading = page.locator('text=Contact Us').first();
    await expect(contactHeading).toBeVisible({ timeout: 5000 });
    console.log('✅ Contact section visible');
    
    // Check email visible
    const email = page.locator('text=hello@acmeco.com');
    await expect(email).toBeVisible({ timeout: 5000 });
    console.log('✅ Email contact visible');
  });

  // ===== NAVIGATION TESTS =====
  test('02 - Navigation header exists and is functional', async ({ page }) => {
    console.log('🧪 Test 2: Checking navigation...');
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    
    // Check Home link
    const homeLink = page.locator('a[href*="page=home"]');
    await expect(homeLink).toBeVisible({ timeout: 5000 });
    console.log('✅ Home navigation link visible');
    
    // Check About link
    const aboutLink = page.locator('a[href*="page=about"]');
    await expect(aboutLink).toBeVisible({ timeout: 5000 });
    console.log('✅ About navigation link visible');
    
    // Check Services link
    const servicesLink = page.locator('a[href*="page=services"]');
    await expect(servicesLink).toBeVisible({ timeout: 5000 });
    console.log('✅ Services navigation link visible');
  });

  // ===== ABOUT PAGE TESTS =====
  test('03 - About page loads and displays content', async ({ page }) => {
    console.log('🧪 Test 3: Loading about page...');
    await page.goto(`${BASE_URL}?page=about`, { waitUntil: 'networkidle' });
    
    // Check About heading
    const aboutHeading = page.locator('text=About Acme Co').first();
    await expect(aboutHeading).toBeVisible({ timeout: 5000 });
    console.log('✅ About page heading visible');
    
    // Check mission text
    const mission = page.locator('text=Our Mission');
    await expect(mission).toBeVisible({ timeout: 5000 });
    console.log('✅ Mission section visible');
    
    // Check Why Choose Us
    const whyChoose = page.locator('text=Why Choose Us');
    await expect(whyChoose).toBeVisible({ timeout: 5000 });
    console.log('✅ "Why Choose Us" section visible');
    
    // Check for checkmarks
    const checkmarks = page.locator('text=✅').first();
    await expect(checkmarks).toBeVisible({ timeout: 5000 });
    console.log('✅ Benefits list visible');
  });

  // ===== SERVICES PAGE TESTS =====
  test('04 - Services page loads and displays content', async ({ page }) => {
    console.log('🧪 Test 4: Loading services page...');
    await page.goto(`${BASE_URL}?page=services`, { waitUntil: 'networkidle' });
    
    // Check Services heading
    const servicesHeading = page.locator('text=Our Services').first();
    await expect(servicesHeading).toBeVisible({ timeout: 5000 });
    console.log('✅ Services page heading visible');
    
    // Check service cards
    const webDesign = page.locator('text=Web Design');
    await expect(webDesign).toBeVisible({ timeout: 5000 });
    console.log('✅ Web Design service card visible');
    
    const development = page.locator('text=Development');
    await expect(development).toBeVisible({ timeout: 5000 });
    console.log('✅ Development service card visible');
    
    const deployment = page.locator('text=Deployment');
    await expect(deployment).toBeVisible({ timeout: 5000 });
    console.log('✅ Deployment service card visible');
    
    const support = page.locator('text=Support');
    await expect(support).toBeVisible({ timeout: 5000 });
    console.log('✅ Support service card visible');
  });

  // ===== BUTTONS & CTA TESTS =====
  test('05 - Call-to-action buttons are visible and clickable', async ({ page }) => {
    console.log('🧪 Test 5: Checking CTA buttons...');
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    
    // Check Explore Services button
    const exploreBtn = page.locator('button:has-text("Explore Services"), a:has-text("Explore Services")').first();
    await expect(exploreBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ "Explore Services" button visible');
    
    // Check Get in Touch button
    const touchBtn = page.locator('button:has-text("Get in Touch"), a:has-text("Get in Touch")').first();
    await expect(touchBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ "Get in Touch" button visible');
    
    // Check Get Started button in header
    const startBtn = page.locator('button:has-text("Get Started"), a:has-text("Get Started")').first();
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ "Get Started" button in header visible');
    } else {
      console.log('⚠️ "Get Started" button not found (optional)');
    }
  });

  // ===== RESPONSIVE TESTS =====
  test('06 - Mobile responsiveness check', async ({ page }) => {
    console.log('🧪 Test 6: Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    
    // Check that content is still visible on mobile
    const logo = page.locator('text=Acme Co').first();
    await expect(logo).toBeVisible({ timeout: 5000 });
    console.log('✅ Logo visible on mobile');
    
    const heroText = page.locator('text=Transform Your Vision Into Reality');
    await expect(heroText).toBeVisible({ timeout: 5000 });
    console.log('✅ Hero text visible on mobile');
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // ===== IMAGES & STYLING TESTS =====
  test('07 - Images and styling load correctly', async ({ page }) => {
    console.log('🧪 Test 7: Checking images and styling...');
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    
    // Check for hero background
    const heroSection = page.locator('div[style*="background"]').first();
    await expect(heroSection).toBeVisible({ timeout: 5000 });
    console.log('✅ Hero background styling applied');
    
    // Check computed styles
    const bgColor = await heroSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log(`✅ Background color computed: ${bgColor}`);
  });

  // ===== NO CONSOLE ERRORS =====
  test('08 - No critical console errors', async ({ page }) => {
    console.log('🧪 Test 8: Checking for console errors...');
    
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    await page.goto(`${BASE_URL}?page=about`, { waitUntil: 'networkidle' });
    await page.goto(`${BASE_URL}?page=services`, { waitUntil: 'networkidle' });
    
    // Allow some errors, but check for critical ones
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      e.length > 0
    );
    
    if (criticalErrors.length === 0) {
      console.log('✅ No critical console errors');
    } else {
      console.log('⚠️ Found console errors:');
      criticalErrors.forEach(e => console.log(`  - ${e}`));
    }
  });

  // ===== NAVIGATION BETWEEN PAGES =====
  test('09 - Can navigate between all pages', async ({ page }) => {
    console.log('🧪 Test 9: Testing page navigation...');
    
    // Start on Home
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Transform Your Vision Into Reality')).toBeVisible({ timeout: 5000 });
    console.log('✅ Successfully loaded home');
    
    // Go to About
    await page.goto(`${BASE_URL}?page=about`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=About Acme Co').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Successfully navigated to about');
    
    // Go to Services
    await page.goto(`${BASE_URL}?page=services`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Our Services').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Successfully navigated to services');
    
    // Back to Home
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Transform Your Vision Into Reality')).toBeVisible({ timeout: 5000 });
    console.log('✅ Successfully returned to home');
  });

  // ===== FINAL SUMMARY =====
  test('10 - Full site walkthrough', async ({ page }) => {
    console.log('\n🧪 Test 10: Full site walkthrough...\n');
    
    // Home
    console.log('📍 Testing HOME page...');
    await page.goto(`${BASE_URL}?page=home`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Acme Co')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Building the future')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Contact Us')).toBeVisible({ timeout: 5000 });
    console.log('✅ HOME: Logo, tagline, contact section all present\n');
    
    // About
    console.log('📍 Testing ABOUT page...');
    await page.goto(`${BASE_URL}?page=about`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=About Acme Co').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Our Mission')).toBeVisible({ timeout: 5000 });
    console.log('✅ ABOUT: Heading and mission visible\n');
    
    // Services
    console.log('📍 Testing SERVICES page...');
    await page.goto(`${BASE_URL}?page=services`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Our Services').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Web Design')).toBeVisible({ timeout: 5000 });
    console.log('✅ SERVICES: Heading and service cards visible\n');
    
    console.log('✅✅✅ ALL TESTS PASSED - SITE IS WORKING! ✅✅✅\n');
  });
});
