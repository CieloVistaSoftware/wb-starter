/**
 * Sticky Behavior Tests
 * Tests for the sticky menu/element behavior
 */
import { test, expect } from '../fixtures/offline';

test.describe('Sticky Behavior', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page that loads WB properly
    await page.goto('/demos/autoinject.html');
    
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
        <nav id="stickyNav" x-sticky>Sticky Navigation</nav>
        <div class="content">Main content area</div>
      `;
    });
    
    // Manually trigger WB.scan once the runtime is up.
    await page.waitForFunction(() => typeof (window as any).WB?.scan === 'function');
    await page.evaluate(async () => {
      if (window.WB && typeof window.WB.scan === 'function') {
        await window.WB.scan(document.body);
      }
    });
    
    // Built means the behavior attached its API to the element: wait for that,
    // not for a guessed 200ms (#1516).
    await page.waitForFunction(() => !!(document.getElementById('stickyNav') as any)?.wbSticky);
  });

  test('adds [x-sticky] class on init', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    await expect(nav).toHaveClass(/x-sticky/);
  });

  test('becomes fixed when scrolled past trigger point', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    
    // Initially not stuck
    await expect(nav).not.toHaveClass(/is-stuck/);
    
    // Scroll past the nav
    await page.evaluate(() => window.scrollTo(0, 300));
    
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
    await expect(nav).toHaveClass(/is-stuck/);
    
    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Should no longer be stuck. The class is on now, so the retrying matcher
    // waits for it to come off; no sleep needed (#1516).
    await expect(nav).not.toHaveClass(/is-stuck/);
  });

  test('creates placeholder to prevent layout shift', async ({ page }) => {
    // Scroll to trigger sticky
    await page.evaluate(() => window.scrollTo(0, 300));
    
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
        <nav data-offset="50" id="stickyNav" x-sticky>Sticky with Offset</nav>
        <div class="content"></div>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB && typeof window.WB.scan === 'function') {
        await window.WB.scan(document.body);
      }
    });
    
    // Built means the behavior attached its API to the element: wait for that,
    // not for a guessed 200ms (#1516).
    await page.waitForFunction(() => !!(document.getElementById('stickyNav') as any)?.wbSticky);
    
    // Scroll to trigger
    await page.evaluate(() => window.scrollTo(0, 200));
    
    // Check top position is 50px. Computed, not el.style: #779 moved the
    // stuck geometry off the style attribute into a generated rule. Polled:
    // the scroll handler sticks it on its own frame (#1516).
    const nav = page.locator('#stickyNav');
    await expect.poll(() => nav.evaluate(el => getComputedStyle(el).top), { message: 'stuck at the 50px offset' }).toBe('50px');
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
        <nav data-class="nav-fixed" id="stickyNav" x-sticky>Custom Class</nav>
        <div class="content"></div>
      `;
    });
    
    await page.evaluate(async () => {
      if (window.WB && typeof window.WB.scan === 'function') {
        await window.WB.scan(document.body);
      }
    });
    
    // Built means the behavior attached its API to the element: wait for that,
    // not for a guessed 200ms (#1516).
    await page.waitForFunction(() => !!(document.getElementById('stickyNav') as any)?.wbSticky);
    
    // Scroll to trigger
    await page.evaluate(() => window.scrollTo(0, 200));
    
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
    
    await expect.poll(() => page.evaluate(() => {
      const nav = document.getElementById('stickyNav');
      return nav && nav.wbSticky ? nav.wbSticky.isStuck() : null;
    }), { message: 'isStuck() reports true once scrolled past' }).toBe(true);
  });

  test('API: stick() forces element to stick', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    
    // Force stick without scrolling
    await page.evaluate(() => {
      const nav = document.getElementById('stickyNav');
      if (nav && nav.wbSticky) nav.wbSticky.stick();
    });
    
    await expect(nav).toHaveClass(/is-stuck/);
  });

  test('API: unstick() forces element to unstick', async ({ page }) => {
    const nav = page.locator('#stickyNav');
    
    // Scroll to trigger sticky
    await page.evaluate(() => window.scrollTo(0, 300));
    await expect(nav).toHaveClass(/is-stuck/);
    
    // Force unstick
    await page.evaluate(() => {
      const nav = document.getElementById('stickyNav');
      if (nav && nav.wbSticky) nav.wbSticky.unstick();
    });
    
    await expect(nav).not.toHaveClass(/is-stuck/);
  });

});
