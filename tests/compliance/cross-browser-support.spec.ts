/**
 * Cross-Browser Support Tests
 * ===========================
 * Validates that all cross-browser infrastructure is in place and working.
 * 
 * Run: npm run test:compliance (runs on all browsers with test:browsers)
 */

import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Support Infrastructure', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ═══════════════════════════════════════════════════════════════
  // 1. CSS NORMALIZATION
  // ═══════════════════════════════════════════════════════════════
  
  test('CSS Normalize is loaded', async ({ page }) => {
    // Check that normalize.css stylesheet is present (at least one)
    const normalizeLink = await page.locator('link[href*="normalize.css"]');
    const count = await normalizeLink.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('CSS Normalize applies box-sizing: border-box', async ({ page }) => {
    // Normalize sets *, *::before, *::after { box-sizing: border-box }
    const boxSizing = await page.evaluate(() => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const style = getComputedStyle(div).boxSizing;
      div.remove();
      return style;
    });
    expect(boxSizing).toBe('border-box');
  });

  test('CSS Normalize removes body margin', async ({ page }) => {
    const bodyMargin = await page.evaluate(() => {
      return getComputedStyle(document.body).margin;
    });
    expect(bodyMargin).toBe('0px');
  });

  test('Reduced motion is respected', async ({ page }) => {
    // Check that prefers-reduced-motion media query rule exists
    const hasReducedMotionRule = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssText?.includes('prefers-reduced-motion')) {
              return true;
            }
          }
        } catch (e) {
          // Cross-origin stylesheets will throw
        }
      }
      return false;
    });
    expect(hasReducedMotionRule).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. FEATURE DETECTION (No Browser Detection)
  // ═══════════════════════════════════════════════════════════════
  
  test('Feature detection module exports correctly', async ({ page }) => {
    const features = await page.evaluate(async () => {
      const module = await import('/src/core/features.js');
      return {
        hasFeatures: typeof module.features === 'object',
        hasSupports: typeof module.supports === 'object',
        hasCssFeatures: typeof module.cssFeatures === 'object',
        hasEnvironment: typeof module.environment === 'object',
        hasDetectAll: typeof module.detectAll === 'function',
        hasLogFeatures: typeof module.logFeatures === 'function'
      };
    });
    
    expect(features.hasFeatures).toBe(true);
    expect(features.hasSupports).toBe(true);
    expect(features.hasCssFeatures).toBe(true);
    expect(features.hasEnvironment).toBe(true);
    expect(features.hasDetectAll).toBe(true);
    expect(features.hasLogFeatures).toBe(true);
  });

  test('Feature detection detects ResizeObserver', async ({ page }) => {
    const hasResizeObserver = await page.evaluate(async () => {
      const { features } = await import('/src/core/features.js');
      return features.resizeObserver;
    });
    // All modern browsers have ResizeObserver
    expect(hasResizeObserver).toBe(true);
  });

  test('Feature detection detects IntersectionObserver', async ({ page }) => {
    const hasIntersectionObserver = await page.evaluate(async () => {
      const { features } = await import('/src/core/features.js');
      return features.intersectionObserver;
    });
    expect(hasIntersectionObserver).toBe(true);
  });

  test('CSS feature detection works', async ({ page }) => {
    const cssFeatures = await page.evaluate(async () => {
      const { cssFeatures } = await import('/src/core/features.js');
      return {
        grid: cssFeatures.grid,
        flexGap: cssFeatures.flexGap,
        aspectRatio: cssFeatures.aspectRatio
      };
    });
    // All modern browsers support these
    expect(cssFeatures.grid).toBe(true);
    expect(cssFeatures.flexGap).toBe(true);
    expect(cssFeatures.aspectRatio).toBe(true);
  });

  test('No UA sniffing in WB core', async ({ page }) => {
    // Verify WB doesn't use navigator.userAgent for feature decisions
    const wbSource = await page.evaluate(async () => {
      const response = await fetch('/src/core/wb.js');
      return response.text();
    });
    
    // Should not contain userAgent checks for feature detection
    expect(wbSource).not.toContain('navigator.userAgent.includes');
    expect(wbSource).not.toContain('navigator.userAgent.match');
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. VENDOR PREFIXES (CSS Properties Work)
  // ═══════════════════════════════════════════════════════════════
  
  test('CSS Grid works without prefix', async ({ page }) => {
    const gridWorks = await page.evaluate(() => {
      const div = document.createElement('div');
      div.style.display = 'grid';
      document.body.appendChild(div);
      const works = getComputedStyle(div).display === 'grid';
      div.remove();
      return works;
    });
    expect(gridWorks).toBe(true);
  });

  test('CSS Flexbox gap works', async ({ page }) => {
    const gapWorks = await page.evaluate(() => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.gap = '10px';
      document.body.appendChild(div);
      const works = getComputedStyle(div).gap === '10px';
      div.remove();
      return works;
    });
    expect(gapWorks).toBe(true);
  });

  test('CSS Transform works without prefix', async ({ page }) => {
    const transformWorks = await page.evaluate(() => {
      const div = document.createElement('div');
      div.style.transform = 'translateX(10px)';
      document.body.appendChild(div);
      const style = getComputedStyle(div).transform;
      div.remove();
      return style !== 'none' && style !== '';
    });
    expect(transformWorks).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. SAFARI GRID WORKAROUNDS
  // ═══════════════════════════════════════════════════════════════
  
  test('Safari fixes CSS is loaded', async ({ page }) => {
    const safariFixesLink = await page.locator('link[href*="safari-fixes.css"]');
    await expect(safariFixesLink).toHaveCount(1);
  });

  test('Collapse-grid utility class exists', async ({ page }) => {
    const hasCollapseGrid = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText?.includes('.collapse-grid')) {
              return true;
            }
          }
        } catch (e) {
          // Cross-origin stylesheets will throw
        }
      }
      return false;
    });
    expect(hasCollapseGrid).toBe(true);
  });

  test('Safe-area-inset utility class exists', async ({ page }) => {
    const hasSafeArea = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText?.includes('.safe-area-inset')) {
              return true;
            }
          }
        } catch (e) {}
      }
      return false;
    });
    expect(hasSafeArea).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. RESIZE LISTENERS
  // ═══════════════════════════════════════════════════════════════
  
  test('Resize module exports correctly', async ({ page }) => {
    const exports = await page.evaluate(async () => {
      const module = await import('/src/core/resize.js');
      return {
        hasOnResize: typeof module.onResize === 'function',
        hasOffResize: typeof module.offResize === 'function',
        hasOnResizeOnce: typeof module.onResizeOnce === 'function',
        hasOnBreakpoint: typeof module.onBreakpoint === 'function',
        hasOnResizeMany: typeof module.onResizeMany === 'function',
        hasGetSize: typeof module.getSize === 'function'
      };
    });
    
    expect(exports.hasOnResize).toBe(true);
    expect(exports.hasOffResize).toBe(true);
    expect(exports.hasOnResizeOnce).toBe(true);
    expect(exports.hasOnBreakpoint).toBe(true);
    expect(exports.hasOnResizeMany).toBe(true);
    expect(exports.hasGetSize).toBe(true);
  });

  test('onResize fires callback with size', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { onResize } = await import('/src/core/resize.js');
      
      return new Promise((resolve) => {
        const div = document.createElement('div');
        div.style.width = '200px';
        div.style.height = '100px';
        document.body.appendChild(div);
        
        let cleanupFn = null;
        cleanupFn = onResize(div, (entry) => {
          if (cleanupFn) cleanupFn();
          div.remove();
          resolve({
            hasWidth: entry.contentRect.width > 0,
            hasHeight: entry.contentRect.height > 0,
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }, { immediate: true, debounce: 0 });
      });
    });
    
    expect(result.hasWidth).toBe(true);
    expect(result.hasHeight).toBe(true);
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
  });

  test('onResize cleanup works', async ({ page }) => {
    const cleanedUp = await page.evaluate(async () => {
      const { onResize } = await import('/src/core/resize.js');
      
      const div = document.createElement('div');
      document.body.appendChild(div);
      
      let callCount = 0;
      const cleanup = onResize(div, () => {
        callCount++;
      }, { immediate: true, debounce: 0 });
      
      // Wait for initial callback
      await new Promise(r => setTimeout(r, 50));
      const countBefore = callCount;
      
      // Cleanup
      cleanup();
      
      // Trigger resize
      div.style.width = '500px';
      await new Promise(r => setTimeout(r, 50));
      
      const countAfter = callCount;
      div.remove();
      
      return countBefore === countAfter;
    });
    
    expect(cleanedUp).toBe(true);
  });

  test('getSize returns dimensions', async ({ page }) => {
    const size = await page.evaluate(async () => {
      const { getSize } = await import('/src/core/resize.js');
      
      const div = document.createElement('div');
      div.style.width = '300px';
      div.style.height = '150px';
      document.body.appendChild(div);
      
      const result = getSize(div);
      div.remove();
      
      return result;
    });
    
    expect(size.width).toBe(300);
    expect(size.height).toBe(150);
    expect(size.aspectRatio).toBe(2);
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. CROSS-BROWSER TESTING (Meta-validation)
  // ═══════════════════════════════════════════════════════════════
  
  test('Playwright config has cross-browser projects', async () => {
    // This test validates that the config exists
    // The actual cross-browser testing happens when running:
    // npm run test:browsers
    
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.resolve(process.cwd(), 'playwright.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    expect(configContent).toContain("name: 'firefox'");
    expect(configContent).toContain("name: 'webkit'");
    expect(configContent).toContain("name: 'mobile-chrome'");
    expect(configContent).toContain("name: 'mobile-safari'");
  });

  test('Package.json has cross-browser test scripts', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    
    expect(pkg.scripts['test:firefox']).toBeDefined();
    expect(pkg.scripts['test:webkit']).toBeDefined();
    expect(pkg.scripts['test:mobile']).toBeDefined();
    expect(pkg.scripts['test:browsers']).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════
  // 7. ESCAPE HATCHES
  // ═══════════════════════════════════════════════════════════════
  
  test('data-wb-skip prevents behavior injection', async ({ page }) => {
    const skipped = await page.evaluate(async () => {
      // Create element with skip attribute
      const pre = document.createElement('pre');
      pre.setAttribute('data-wb-skip', '');
      pre.textContent = 'test code';
      document.body.appendChild(pre);
      
      // Wait for potential WB processing
      await new Promise(r => setTimeout(r, 100));
      
      // Check if behavior was applied
      const hasWbReady = pre.hasAttribute('data-wb-ready');
      pre.remove();
      
      return !hasWbReady;
    });
    
    expect(skipped).toBe(true);
  });

  test('x-ignore prevents auto-injection', async ({ page }) => {
    const ignored = await page.evaluate(async () => {
      // Create button with x-ignore
      const btn = document.createElement('button');
      btn.setAttribute('x-ignore', '');
      btn.textContent = 'Test';
      document.body.appendChild(btn);
      
      // Wait for potential processing (scan will be triggered from the test harness)
      await new Promise(r => setTimeout(r, 100));
      
      const hasWbReady = btn.hasAttribute('data-wb-ready');
    });

    // ensure behaviors have been bound after the in-page mutation
    await waitForWBScan(page);
      btn.remove();
      
      return !hasWbReady;
    });
    
    expect(ignored).toBe(true);
  });

  test('CSS custom properties can override component styles', async ({ page }) => {
    const overrideWorks = await page.evaluate(() => {
      // Create a card with custom property override
      const card = document.createElement('wb-card');
      card.style.setProperty('--card-padding', '99px');
      document.body.appendChild(card);
      
      // Check that custom property is set
      const value = getComputedStyle(card).getPropertyValue('--card-padding').trim();
      card.remove();
      
      return value === '99px';
    });
    
    expect(overrideWorks).toBe(true);
  });

  test('Escape hatches documentation exists', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const docPath = path.resolve(process.cwd(), 'docs/escape-hatches.md');
    
    expect(fs.existsSync(docPath)).toBe(true);
    
    const content = fs.readFileSync(docPath, 'utf-8');
    expect(content).toContain('CSS Custom Properties');
    expect(content).toContain('data-wb-skip');
    expect(content).toContain('x-ignore');
  });

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY TEST
  // ═══════════════════════════════════════════════════════════════
  
  test('All cross-browser infrastructure files exist', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const requiredFiles = [
      'src/styles/normalize.css',
      'src/styles/safari-fixes.css',
      'src/core/resize.js',
      'src/core/features.js',
      'docs/escape-hatches.md'
    ];
    
    const results = requiredFiles.map(file => ({
      file,
      exists: fs.existsSync(path.resolve(process.cwd(), file))
    }));
    
    const missing = results.filter(r => !r.exists);
    
    expect(missing).toHaveLength(0);
  });

});
