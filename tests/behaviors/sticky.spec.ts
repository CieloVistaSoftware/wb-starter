/**
 * Sticky Behavior Tests
 * Tests for the sticky menu/element behavior
 */
import { test, expect } from '@playwright/test';

test.describe('Sticky Behavior', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page that loads WB properly
    await page.goto('http://localhost:3000/demos/autoinject.html');
    
    // Inject our test content into the page with existing WB init
    await page.evaluate(() => {
      // Clear body and add our test structure
      document.body.innerHTML = `
        <style>
          body { margin: 0; padding: 0; }
          .spacer { height: 200px; background: #eee; padding: 1rem; }
          .content { height: 2000px; background: linear-gradient(#fff, #ccc); }
          nav { background: #333; color: #fff; padding: 1rem; }
        </style>
        <div class="spacer">Scroll down to see sticky behavior</div>
        <nav data-wb="sticky" id="stickyNav">Sticky Navigation</nav>
        <div class="content">Main content area</div>
      `;
    });
    
    // Wait for WB to scan and initialize
    await page.waitForTimeout(500);
    
    // Manually trigger WB.scan
    await page.evaluate(async () => {
      if (window.WB && typeof window.WB.scan === 'function') {
        await window.WB.scan(document.body);
      }
    });
    
    await page.waitForTimeout(200);
  });

  test('adds wb-sticky class on init', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    await expect(nav).toHaveClass(/wb-sticky/);
  });

  test('becomes fixed when scrolled past trigger point', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    
    // Initially not stuck
    await expect(nav).not.toHaveClass(/is-stuck/);
    
    // Scroll past the nav
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    
    // Should now be stuck
    await expect(nav).toHaveClass(/is-stuck/);
    
    // Should have position fixed
    const position = await nav.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('unsticks when scrolled back up', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    
    // Scroll down to stick
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    await expect(nav).toHaveClass(/is-stuck/);
    
    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    
    // Should no longer be stuck
    await expect(nav).not.toHaveClass(/is-stuck/);
  });

  test('creates placeholder to prevent layout shift', async ({ page }) => {
    // Scroll to trigger sticky
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    
    // Check for placeholder
    const placeholder = page.locator('.sticky-placeholder');
    await expect(placeholder).toHaveCount(1);
  });

  test('respects data-offset attribute', async ({ page }) => {
    // Inject a new sticky element with offset
    await page.evaluate(() => {
      document.body.innerHTML = `
        <style>
          body { margin: 0; padding: 0; }
          .spacer { height: 100px; }
          .content { height: 2000px; }
          nav { background: #333; color: #fff; padding: 1rem; }
        </style>
        <div class="spacer"></div>
        <nav data-wb="sticky" data-offset="50" id="stickyNav">Sticky with Offset</nav>
        <div class="content"></div>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB && typeof window.WB.scan === 'function') {
        await window.WB.scan(document.body);
      }
    });
    
    await page.waitForTimeout(200);
    
    // Scroll to trigger
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(100);
    
    // Check top position is 50px
    const nav = page.locator('#stickyNav');
    const top = await nav.evaluate(el => el.style.top);
    expect(top).toBe('50px');
  });

  test('respects custom stuck class via data-class', async ({ page }) => {
    // Inject sticky with custom class
    await page.evaluate(() => {
      document.body.innerHTML = `
        <style>
          body { margin: 0; }
          .spacer { height: 100px; }
          .content { height: 2000px; }
          nav { background: #333; color: #fff; padding: 1rem; }
        </style>
        <div class="spacer"></div>
        <nav data-wb="sticky" data-class="nav-fixed" id="stickyNav">Custom Class</nav>
        <div class="content"></div>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB && typeof window.WB.scan === 'function') {
        await window.WB.scan(document.body);
      }
    });
    
    await page.waitForTimeout(200);
    
    // Scroll to trigger
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(100);
    
    // Check custom class is applied
    const nav = page.locator('#stickyNav');
    await expect(nav).toHaveClass(/nav-fixed/);
    await expect(nav).not.toHaveClass(/is-stuck/);
  });

  test('API: isStuck() returns correct state', async ({ page }) => {
    // Check initial state
    let isStuck = await page.evaluate(() => {
      const nav = document.getElementById('stickyNav');
      return nav && nav.wbSticky ? nav.wbSticky.isStuck() : null;
    });
    expect(isStuck).toBe(false);
    
    // Scroll and check again
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    
    isStuck = await page.evaluate(() => {
      const nav = document.getElementById('stickyNav');
      return nav && nav.wbSticky ? nav.wbSticky.isStuck() : null;
    });
    expect(isStuck).toBe(true);
  });

  test('API: stick() forces element to stick', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    
    // Force stick without scrolling
    await page.evaluate(() => {
      const nav = document.getElementById('stickyNav');
      if (nav && nav.wbSticky) nav.wbSticky.stick();
    });
    await page.waitForTimeout(50);
    
    await expect(nav).toHaveClass(/is-stuck/);
  });

  test('API: unstick() forces element to unstick', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    
    // Scroll to trigger sticky
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    await expect(nav).toHaveClass(/is-stuck/);
    
    // Force unstick
    await page.evaluate(() => {
      const nav = document.getElementById('stickyNav');
      if (nav && nav.wbSticky) nav.wbSticky.unstick();
    });
    await page.waitForTimeout(50);
    
    await expect(nav).not.toHaveClass(/is-stuck/);
  });

});
