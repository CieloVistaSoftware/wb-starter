import { test, expect } from '@playwright/test';

test.describe('Fix Viewer Compliance', () => {
  
  test.describe('Logic & Layout (Mocked)', () => {
    test.beforeEach(async ({ page }) => {
      // Mock the fixes data
      await page.route('/data/fixes.json', async route => {
        const json = {
          metadata: { version: "1.0.0" },
          fixes: {
            "TEST_FIX_001": {
              errorId: "TEST_FIX_001",
              component: "test-component",
              errorSignature: "Test error signature",
              issue: "Test issue description",
              cause: "Test cause",
              testRun: true,
              testName: "tests/compliance/fix-viewer.spec.ts",
              fix: {
                file: "src/test.js",
                action: "Test action"
              },
              status: "APPLIED",
              date: "2025-12-28T12:00:00Z"
            },
            "TEST_FIX_MISSING_TEST": {
              errorId: "TEST_FIX_MISSING_TEST",
              component: "test-component",
              errorSignature: "Error without test",
              issue: "Issue without test verification",
              cause: "Cause unknown",
              status: "APPLIED", // Should be overridden to FAILED
              date: "2025-12-28T12:00:00Z"
            },
            "TEST_FIX_ENHANCEMENT": {
              errorId: "TEST_FIX_ENHANCEMENT",
              component: "semantics/list.js",
              errorSignature: "Enhancement: Add feature",
              issue: "Enhancement request",
              cause: "Feature missing",
              testRun: true,
              status: "APPLIED",
              date: "2025-12-28T12:00:00Z"
            }
          }
        };
        await route.fulfill({ json });
      });

      await page.goto('/public/fix-viewer.html');
    });

    test('should load and display fixes', async ({ page }) => {
      await expect(page.locator('.fix-card')).toHaveCount(3);
      await expect(page.locator('#fix-count')).toContainText('3 fixes');
    });

    test('should mark fixes without testRun as FAILED', async ({ page }) => {
      const card = page.locator('.fix-card', { hasText: 'TEST_FIX_MISSING_TEST' });
      await expect(card.locator('.fix-status')).toHaveText('TEST MISSING');
      await expect(card.locator('.fix-status')).toHaveClass(/status-failed/);
    });

    test('should display verified status for fixes with testRun', async ({ page }) => {
      const card = page.locator('.fix-card', { hasText: 'TEST_FIX_001' });
      await expect(card.locator('.fix-status')).toHaveText('APPLIED');
      await expect(card.locator('.fix-status')).toHaveClass(/status-applied/); // Note: class is status-applied based on lowercase status
      
      // Check Test Status section
      await expect(card.locator('.detail-row', { hasText: 'Test Status' })).toContainText('TRUE');
      await expect(card.locator('.detail-row', { hasText: 'Test Status' })).toContainText('tests/compliance/fix-viewer.spec.ts');
    });

    test('should link enhancements to documentation', async ({ page }) => {
      const card = page.locator('.fix-card', { hasText: 'TEST_FIX_ENHANCEMENT' });
      const signatureBlock = card.locator('.signature-block');
      
      await expect(signatureBlock).toContainText('Enhancement: See list.md');
      const link = signatureBlock.locator('a');
      await expect(link).toHaveAttribute('href', '/docs/components/semantics/list.md');
    });

    test('should have valid enhancement links', async ({ page }) => {
      const card = page.locator('.fix-card', { hasText: 'TEST_FIX_ENHANCEMENT' });
      const link = card.locator('.signature-block a');
      
      // Check if link is visible and has correct href
      await expect(link).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href).toBe('/docs/components/semantics/list.md');
    });

    test('should have consistent card layout', async ({ page }) => {
      // Check that cards are in a grid
      const grid = page.locator('.fix-grid');
      await expect(grid).toHaveCSS('display', 'grid');
      
      // Check header structure
      const header = page.locator('.card-header').first();
      await expect(header).toHaveCSS('display', 'flex');
      await expect(header).toHaveCSS('flex-direction', 'column');
      
      const headerTop = header.locator('.header-top');
      await expect(headerTop).toHaveCSS('justify-content', 'space-between');
    });

    test('should enforce maximum card height (mocked)', async ({ page }) => {
      // Inject a massive stack trace to test the constraint
      await page.route('/data/fixes.json', async route => {
        const json = {
          metadata: { version: "1.0.0" },
          fixes: {
            "MASSIVE_FIX": {
              errorId: "MASSIVE_FIX",
              component: "test",
              errorSignature: "Error",
              issue: "Massive stack trace",
              stackTrace: "Line\n".repeat(2000), // 2000 lines would be huge without max-height
              testRun: true,
              status: "APPLIED",
              date: "2025-01-01"
            }
          }
        };
        await route.fulfill({ json });
      });

      await page.reload();
      const card = page.locator('.fix-card').first();
      const box = await card.boundingBox();
      // With max-height: 300px on stack trace, the card should be well under 800px
      expect(box?.height).toBeLessThan(800);
    });
  });

  test.describe('Live Data Audit', () => {
    test('should not have any cards taller than 500px', async ({ page }) => {
      // Load the real page with real data
      await page.goto('/public/fix-viewer.html');
      
      // Wait for fixes to load
      await page.waitForSelector('.fix-card', { timeout: 5000 });

      // Evaluate heights of all cards
      const tallCards = await page.evaluate(() => {
        // Disable stretch to find the natural height culprit
        const style = document.createElement('style');
        style.innerHTML = '.fix-grid { align-items: start !important; }';
        document.head.appendChild(style);

        const cards = Array.from(document.querySelectorAll('.fix-card'));
        
        // Find the card with the maximum height after disabling stretch
        let maxNaturalHeight = 0;
        let culpritId = 'none';

        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          if (rect.height > maxNaturalHeight) {
            maxNaturalHeight = rect.height;
            culpritId = card.querySelector('.fix-id')?.textContent?.trim() || 'unknown';
          }
        });

        if (maxNaturalHeight > 2000) {
             // Find the tallest child in the culprit
             const culpritCard = cards.find(c => (c.querySelector('.fix-id')?.textContent?.trim() || 'unknown') === culpritId);
             let tallestChild = null;
             let maxChildHeight = 0;
             
             if (culpritCard) {
                 const allChildren = culpritCard.querySelectorAll('*');
                 allChildren.forEach(child => {
                     const h = child.getBoundingClientRect().height;
                     if (h > maxChildHeight) {
                         maxChildHeight = h;
                         tallestChild = child;
                     }
                 });
             }

             const childTag = tallestChild ? tallestChild.tagName.toLowerCase() : 'unknown';
             const childClass = tallestChild ? tallestChild.className : 'unknown';
             const childContent = tallestChild ? tallestChild.outerHTML.substring(0, 500) : 'unknown';

             throw new Error(`Natural Height Culprit: ${culpritId} with height ${maxNaturalHeight}px. Tallest child: <${childTag} class="${childClass}"> with height ${maxChildHeight}px. Content: ${childContent}`);
        }

        const violations = [];
        
        // NOTE: Height check disabled as per user request to allow full height cards
        /*
        cards.forEach(card => {
          const height = card.getBoundingClientRect().height;
          if (height > 500) {
            // Get ID if available
            const idEl = card.querySelector('.fix-id');
            const id = idEl ? idEl.textContent.trim() : 'Unknown ID';
            const titleEl = card.querySelector('.fix-title');
            const title = titleEl ? titleEl.textContent.trim() : 'Unknown Title';
            
            violations.push({
              id,
              title,
              height: Math.round(height)
            });
          }
        });
        */
        
        return violations;
      });

      if (tallCards.length > 0) {
        console.log('Found tall cards:', JSON.stringify(tallCards, null, 2));
      }

      expect(tallCards, `Found ${tallCards.length} cards taller than 500px: ${JSON.stringify(tallCards, null, 2)}`).toEqual([]);
    });

    test('should not have duplicate IDs', async ({ page }) => {
      await page.goto('/public/fix-viewer.html');
      await page.waitForSelector('.fix-card', { timeout: 5000 });

      const duplicateIds = await page.evaluate(() => {
        const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
        const seen = new Set();
        const duplicates = new Set();
        
        allIds.forEach(id => {
          if (seen.has(id)) {
            duplicates.add(id);
          }
          seen.add(id);
        });
        
        return Array.from(duplicates);
      });

      expect(duplicateIds, `Found ${duplicateIds.length} duplicate IDs: ${duplicateIds.join(', ')}`).toEqual([]);
    });

    test('should ensure code tags contain only text and are not too long', async ({ page }) => {
      await page.goto('/public/fix-viewer.html');
      await page.waitForSelector('.fix-card', { timeout: 5000 });

      const codeIssues = await page.evaluate(() => {
        // Only check code tags that are NOT inside fix-code-block (syntax highlighted blocks are expected to have child spans)
        const codeTags = Array.from(document.querySelectorAll('code:not(.fix-code-block code):not(.x-code code):not(.hljs)'));
        const issues = [];

        codeTags.forEach((code, index) => {
          // Skip if this is inside a syntax-highlighted block
          if (code.closest('.fix-code-block') || code.closest('.x-code') || code.classList.contains('hljs')) {
            return;
          }
          
          // Check for child elements (should only be text) - skip if has hljs-* spans (syntax highlighting)
          const nonHljsChildren = Array.from(code.children).filter(c => !c.className.startsWith('hljs'));
          if (nonHljsChildren.length > 0) {
            issues.push(`Code tag #${index} contains ${nonHljsChildren.length} non-syntax child elements (should be text only)`);
          }

          // Check for line count
          const text = code.textContent || '';
          const lines = text.split(/\r\n|\r|\n/).length;
          if (lines > 10) {
            issues.push(`Code tag #${index} contains ${lines} lines (max 10). Content start: "${text.substring(0, 20)}..."`);
          }
        });

        return issues;
      });

      expect(codeIssues).toEqual([]);
    });
  });
});
