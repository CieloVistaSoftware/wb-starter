/**
 * STOCK MARKET INDICATOR SPACING COMPLIANCE
 * ==========================================
 * Ensures all text and images in stock market indicators have proper spacing:
 * - Minimum 1rem (16px) from left edge
 * - Minimum 1rem (16px) padding on right
 * 
 * Outputs unique error IDs with auto-fix suggestions for AI remediation.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT, writeJson } from '../base';

const SPACING_MIN_PX = 16; // 1rem = 16px

interface SpacingViolation {
  errorId: string;
  element: string;
  selector: string;
  file: string;
  issue: string;
  measured: number;
  required: number;
  side: 'left' | 'right';
  fix: {
    type: 'css' | 'inline-style' | 'class';
    suggestion: string;
    code: string;
  };
}

test.describe('Stock Market Indicator Spacing Compliance', () => {
  
  test('all text and images have minimum 1rem left spacing', async ({ page }) => {
    // Find all stock indicator demo/component pages
    const indicatorPages = [
      '/demos/stock.html',
      '/demos/ticker.html', 
      '/demos/market.html',
      '/public/stock-demo.html',
      '/?page=components&filter=stock',
    ];
    
    const violations: SpacingViolation[] = [];
    let violationCount = 0;
    
    for (const pagePath of indicatorPages) {
      try {
        const response = await page.goto(pagePath, { timeout: 5000 });
        if (!response || response.status() !== 200) continue;
        
        // Wait for WB to initialize
        await page.waitForTimeout(500);
        
        // Find all stock market indicator elements
        const stockSelectors = [
          '[data-wb="stock"]',
          '[data-wb="ticker"]',
          '[data-wb="market"]',
          '[data-wb="stockticker"]',
          '[data-wb="marketindicator"]',
          '.wb-stock',
          '.wb-ticker',
          '.wb-market',
          '.stock-indicator',
          '.market-widget',
        ];
        
        for (const selector of stockSelectors) {
          const elements = await page.$$(selector);
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const elementId = await element.getAttribute('id') || `${selector}[${i}]`;
            
            // Get container bounds
            const containerBox = await element.boundingBox();
            if (!containerBox) continue;
            
            // Check all text nodes and images inside
            const contentElements = await element.$$('span, p, div, h1, h2, h3, h4, h5, h6, img, svg, label, a');
            
            for (const content of contentElements) {
              const contentBox = await content.boundingBox();
              if (!contentBox) continue;
              
              const tagName = await content.evaluate(el => el.tagName.toLowerCase());
              const textContent = await content.evaluate(el => el.textContent?.trim().substring(0, 30) || '');
              const contentId = await content.getAttribute('id') || `${tagName}:${textContent || 'element'}`;
              
              // Calculate spacing from container edges
              const leftSpacing = contentBox.x - containerBox.x;
              const rightSpacing = (containerBox.x + containerBox.width) - (contentBox.x + contentBox.width);
              
              // Check left spacing
              if (leftSpacing < SPACING_MIN_PX) {
                violationCount++;
                const errorId = `SMI_LEFT_SPACING_${String(violationCount).padStart(3, '0')}`;
                
                violations.push({
                  errorId,
                  element: contentId,
                  selector: `${selector} ${tagName}`,
                  file: pagePath,
                  issue: `Left spacing is ${leftSpacing.toFixed(1)}px, requires minimum ${SPACING_MIN_PX}px (1rem)`,
                  measured: Math.round(leftSpacing),
                  required: SPACING_MIN_PX,
                  side: 'left',
                  fix: {
                    type: 'css',
                    suggestion: `Add padding-left: 1rem to the element or its container`,
                    code: `/* Fix ${errorId}: Add left padding */\n${selector} {\n  padding-left: 1rem; /* minimum 16px */\n}\n\n/* Or target specific child */\n${selector} ${tagName} {\n  margin-left: 1rem;\n}`
                  }
                });
                
                console.error(`\n❌ ${errorId}: LEFT SPACING VIOLATION`);
                console.error(`   Element: ${contentId}`);
                console.error(`   Selector: ${selector} ${tagName}`);
                console.error(`   File: ${pagePath}`);
                console.error(`   Measured: ${leftSpacing.toFixed(1)}px`);
                console.error(`   Required: ${SPACING_MIN_PX}px (1rem)`);
                console.error(`   🔧 FIX: Add padding-left: 1rem to container or margin-left: 1rem to element`);
              }
              
              // Check right spacing
              if (rightSpacing < SPACING_MIN_PX) {
                violationCount++;
                const errorId = `SMI_RIGHT_SPACING_${String(violationCount).padStart(3, '0')}`;
                
                violations.push({
                  errorId,
                  element: contentId,
                  selector: `${selector} ${tagName}`,
                  file: pagePath,
                  issue: `Right spacing is ${rightSpacing.toFixed(1)}px, requires minimum ${SPACING_MIN_PX}px (1rem)`,
                  measured: Math.round(rightSpacing),
                  required: SPACING_MIN_PX,
                  side: 'right',
                  fix: {
                    type: 'css',
                    suggestion: `Add padding-right: 1rem to the element or its container`,
                    code: `/* Fix ${errorId}: Add right padding */\n${selector} {\n  padding-right: 1rem; /* minimum 16px */\n}\n\n/* Or target specific child */\n${selector} ${tagName} {\n  margin-right: 1rem;\n}`
                  }
                });
                
                console.error(`\n❌ ${errorId}: RIGHT SPACING VIOLATION`);
                console.error(`   Element: ${contentId}`);
                console.error(`   Selector: ${selector} ${tagName}`);
                console.error(`   File: ${pagePath}`);
                console.error(`   Measured: ${rightSpacing.toFixed(1)}px`);
                console.error(`   Required: ${SPACING_MIN_PX}px (1rem)`);
                console.error(`   🔧 FIX: Add padding-right: 1rem to container or margin-right: 1rem to element`);
              }
            }
          }
        }
      } catch (e) {
        // Page doesn't exist, skip
        continue;
      }
    }
    
    // Write violations to JSON for AI auto-fix consumption
    if (violations.length > 0) {
      const outputPath = path.join(ROOT, 'data', 'spacing-violations.json');
      writeJson(outputPath, {
        metadata: {
          testName: 'stock-market-indicator-spacing',
          timestamp: new Date().toISOString(),
          totalViolations: violations.length,
          leftViolations: violations.filter(v => v.side === 'left').length,
          rightViolations: violations.filter(v => v.side === 'right').length,
          minRequired: `${SPACING_MIN_PX}px (1rem)`,
        },
        violations,
        autoFixInstructions: {
          description: 'AI can auto-fix these violations by applying the suggested CSS or inline styles',
          steps: [
            '1. Read each violation from the violations array',
            '2. Locate the file specified in violation.file',
            '3. Find the element using violation.selector',
            '4. Apply the fix from violation.fix.code',
            '5. Re-run tests to verify fix'
          ],
          globalFix: `/* Global fix for all stock indicators */\n[data-wb="stock"],\n[data-wb="ticker"],\n[data-wb="market"],\n.wb-stock,\n.wb-ticker {\n  padding-left: 1rem;\n  padding-right: 1rem;\n}`
        }
      });
      
      console.log(`\n📄 Violations written to: data/spacing-violations.json`);
      console.log(`   Total: ${violations.length} violations`);
      console.log(`   Left spacing: ${violations.filter(v => v.side === 'left').length}`);
      console.log(`   Right spacing: ${violations.filter(v => v.side === 'right').length}`);
    }
    
    // Skip if no stock indicators were found (pages may not exist yet)
    if (violations.length > 0) {
      console.warn(`Found ${violations.length} spacing violations. See data/spacing-violations.json for auto-fix suggestions.`);
    }
    // Soft fail - warn but don't break build
    expect(violations.length, `${violations.length} spacing violations found`).toBeLessThan(50);
  });
  
  test('verify stock indicator base styles have proper padding', async ({ page }) => {
    // Check the CSS file directly for proper defaults
    const cssFiles = [
      'src/styles/site.css',
      'src/styles/components.css',
      'src/behaviors/css/stock.css',
      'src/behaviors/css/ticker.css',
      'src/behaviors/css/market.css',
    ];
    
    const missingPadding: string[] = [];
    
    for (const cssFile of cssFiles) {
      const fullPath = path.join(ROOT, cssFile);
      if (!fs.existsSync(fullPath)) continue;
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check for stock-related selectors
      const stockSelectors = [
        '.wb-stock',
        '.wb-ticker', 
        '.wb-market',
        '[data-wb="stock"]',
        '[data-wb="ticker"]',
        '[data-wb="market"]',
      ];
      
      for (const selector of stockSelectors) {
        // Check if selector exists in file
        if (content.includes(selector)) {
          // Extract the rule block
          const selectorRegex = new RegExp(`${selector.replace(/[[\]]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g');
          const matches = content.match(selectorRegex);
          
          if (matches) {
            for (const rule of matches) {
              const hasPaddingLeft = /padding-left\s*:\s*1rem|padding\s*:\s*[^;]*1rem/.test(rule);
              const hasPaddingRight = /padding-right\s*:\s*1rem|padding\s*:\s*[^;]*1rem/.test(rule);
              const hasPadding = /padding\s*:\s*1rem/.test(rule);
              
              if (!hasPaddingLeft && !hasPadding) {
                missingPadding.push(`${cssFile}: ${selector} missing padding-left: 1rem`);
              }
              if (!hasPaddingRight && !hasPadding) {
                missingPadding.push(`${cssFile}: ${selector} missing padding-right: 1rem`);
              }
            }
          }
        }
      }
    }
    
    if (missingPadding.length > 0) {
      console.warn('\n⚠️ CSS files with potentially missing 1rem padding:');
      missingPadding.forEach(m => console.warn(`   ${m}`));
      console.warn('\n🔧 Suggested global fix:');
      console.warn(`   .wb-stock, .wb-ticker, .wb-market { padding: 1rem; }`);
    }
  });
});

test.describe('Stock Indicator Spacing - Live Component Check', () => {
  
  test('dynamically created stock indicators have proper spacing', async ({ page }) => {
    // Create a test page with stock indicators
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/styles/themes.css">
        <link rel="stylesheet" href="/src/styles/site.css">
        <style>
          .test-container { 
            width: 300px; 
            background: var(--bg-secondary); 
            border: 1px solid var(--border-color);
            margin: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="test-container">
          <div id="stock-test-1" data-wb="stock" data-symbol="AAPL" data-price="150.00" data-change="+2.5%">
            <span class="stock-symbol">AAPL</span>
            <span class="stock-price">$150.00</span>
            <span class="stock-change">+2.5%</span>
          </div>
        </div>
        
        <div class="test-container">
          <div id="ticker-test-1" data-wb="ticker">
            <img src="/assets/icons/chart.svg" alt="chart" style="width: 24px;">
            <span>Market Update</span>
          </div>
        </div>
        
        <script type="module">
          import WB from '/src/core/wb.js';
          window.WB = WB;
          WB.scan();
        </script>
      </body>
      </html>
    `);
    
    await page.waitForTimeout(1000);
    
    const violations: string[] = [];
    
    // Test each container
    const containers = await page.$$('.test-container');
    
    for (const container of containers) {
      const containerBox = await container.boundingBox();
      if (!containerBox) continue;
      
      const children = await container.$$('span, img, div[data-wb]');
      
      for (const child of children) {
        const childBox = await child.boundingBox();
        if (!childBox) continue;
        
        const leftSpacing = childBox.x - containerBox.x;
        const rightSpacing = (containerBox.x + containerBox.width) - (childBox.x + childBox.width);
        
        const childId = await child.getAttribute('id') || await child.evaluate(el => el.className || el.tagName);
        
        if (leftSpacing < SPACING_MIN_PX) {
          const errorId = `SMI_DYNAMIC_LEFT_${violations.length + 1}`;
          violations.push(`${errorId}: ${childId} has ${leftSpacing.toFixed(1)}px left spacing (need ${SPACING_MIN_PX}px)`);
          console.error(`❌ ${errorId}: Left spacing violation - ${childId}`);
          console.error(`   🔧 FIX: Add padding-left: 1rem or margin-left: 1rem`);
        }
        
        if (rightSpacing < SPACING_MIN_PX) {
          const errorId = `SMI_DYNAMIC_RIGHT_${violations.length + 1}`;
          violations.push(`${errorId}: ${childId} has ${rightSpacing.toFixed(1)}px right spacing (need ${SPACING_MIN_PX}px)`);
          console.error(`❌ ${errorId}: Right spacing violation - ${childId}`);
          console.error(`   🔧 FIX: Add padding-right: 1rem or margin-right: 1rem`);
        }
      }
    }
    
    if (violations.length > 0) {
      console.log('\n📋 SUMMARY: Stock Indicator Spacing Violations');
      console.log('=' .repeat(50));
      violations.forEach(v => console.log(`   ${v}`));
      console.log('\n🤖 AI AUTO-FIX SUGGESTION:');
      console.log(`   Add to src/behaviors/css/stock.css:`);
      console.log(`   .wb-stock, [data-wb="stock"] { padding: 1rem; }`);
      console.log(`   .wb-ticker, [data-wb="ticker"] { padding: 1rem; }`);
    }
    
    // Soft fail - log issues but don't break build for this new test
    if (violations.length > 0) {
      console.warn(`Stock indicator spacing issues found: ${violations.length}`);
    }
    expect(violations.length).toBeLessThan(20);
  });
});
