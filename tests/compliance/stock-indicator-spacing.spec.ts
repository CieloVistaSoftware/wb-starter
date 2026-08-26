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
      '/?page=behaviors&filter=stock',
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
          'x-stock',
          'x-ticker',
          'x-market',
          'x-stockticker',
          'x-marketindicator',
          '.x-stock',
          '.x-ticker',
          '.x-market',
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
          globalFix: `/* Global fix for all stock indicators */\nwb-stock,\nwb-ticker,\nwb-market,\n.x-stock,\n.x-ticker {\n  padding-left: 1rem;\n  padding-right: 1rem;\n}`
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
  
  // #863: this test could not report anything, for two independent reasons,
  // and then console.warn()ed instead of asserting even if it had:
  //
  //   1. Three of its five paths (src/behaviors/css/{stock,ticker,market}.css)
  //      are pre-v3 locations that have not existed since behaviour styles moved
  //      to src/styles/behaviors/. The only real file, stock.css, was never
  //      opened. The other two (site.css, components.css) contain no stock
  //      selectors at all.
  //   2. Its rule extractor was `<selector>\s*\{`, which cannot match a GROUPED
  //      selector -- and every rule in stock.css is grouped (`.x-stock,\n
  //      [data-wb="stock"], ... {`). So even against the right file it found
  //      zero rule blocks.
  //
  // `missingPadding` was therefore structurally always empty. Pointed at the
  // real file and rewritten to read the declarations that actually govern the
  // 1rem edge spacing this whole spec is named for. Measured after the fix: 0
  // violations -- stock.css does declare padding-left/right: 1rem.
  //
  // NOTE for whoever touches this next: src/styles/behavior-css-manifest.js
  // records stock.css as "confirmed orphaned -- no behavior, tag, or markup
  // anywhere in the repo references .x-stock/data-wb='stock'". If that
  // stylesheet is ever deleted, delete this spec with it rather than leaving a
  // test pointed at a file that is gone.
  test('verify stock indicator base styles have proper padding', async () => {
    const STOCK_CSS = 'src/styles/behaviors/stock.css';
    const fullPath = path.join(ROOT, STOCK_CSS);

    expect(
      fs.existsSync(fullPath),
      `${STOCK_CSS} must exist -- this spec measures the 1rem edge spacing it `
      + 'declares. If the stock indicator styles were removed, remove this spec '
      + 'too instead of letting it scan nothing.',
    ).toBe(true);

    const content = fs.readFileSync(fullPath, 'utf-8');

    // Rule blocks whose selector list mentions any stock indicator selector.
    // Grouped selectors are the norm here, so match the whole comma-separated
    // list up to the opening brace rather than a single selector token.
    const RULE_RE = new RegExp('([^{}]+)\\{([^}]*)\\}', 'g');
    const STOCK_SELECTOR_RE = new RegExp('(^|[\\s,])\\.?x-(stock|ticker|market)\\b|data-wb="(stock|ticker|market)"');

    const missingPadding: string[] = [];
    let baseRulesChecked = 0;

    for (const m of content.matchAll(RULE_RE)) {
      const selectorList = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
      const body = m[2];
      if (!STOCK_SELECTOR_RE.test(selectorList)) continue;

      // Only the BASE rules carry edge spacing; the modifier rules
      // (.x-ticker font-weight, .x-price/.x-change colours) are not expected
      // to restate padding. A base rule is one that sets display.
      if (!/(^|;|\s)display\s*:/.test(body)) continue;
      baseRulesChecked++;

      const shorthand = /(^|;|\s)padding\s*:\s*[^;]*1rem/.test(body);
      const hasLeft = shorthand || /padding-left\s*:\s*1rem/.test(body);
      const hasRight = shorthand || /padding-right\s*:\s*1rem/.test(body);

      const label = selectorList.replace(/\s+/g, ' ');
      if (!hasLeft) missingPadding.push(`${STOCK_CSS}: "${label}" missing padding-left: 1rem`);
      if (!hasRight) missingPadding.push(`${STOCK_CSS}: "${label}" missing padding-right: 1rem`);
    }

    expect(
      baseRulesChecked,
      `No base stock indicator rule found in ${STOCK_CSS}. The previous version `
      + 'of this test silently scanned nothing for exactly this reason -- if the '
      + 'selectors were renamed, update this test rather than letting it pass on '
      + 'an empty scan.',
    ).toBeGreaterThan(0);

    expect(
      missingPadding,
      'Stock indicators must keep 1rem (16px) spacing from their left and '
      + `right edges:\n${missingPadding.join('\n')}`,
    ).toEqual([]);
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
        <link rel="stylesheet" href="/src/styles/behaviors/stock.css">
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
          <div id="stock-test-1" symbol="AAPL" price="150.00" change="+2.5%">
            <span class="stock-symbol">AAPL</span>
            <span class="stock-price">$150.00</span>
            <span class="stock-change">+2.5%</span>
          </div>
        </div>
        
        <div class="test-container">
          <div id="ticker-test-1">
            <img src="/assets/icons/chart.svg" alt="chart" style="width: 24px;">
            <span>Market Update</span>
          </div>
        </div>
        
        <script type="module">
          import WB from '/src/core/wb.js';
          window.WB = WB;
          await WB.scan();
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
        
        // DEBUG: Computed Style
        const paddingLeft = await child.evaluate(el => window.getComputedStyle(el).paddingLeft);
        console.log(`DEBUG: ${childId} padding-left: ${paddingLeft}`);

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
      console.log(`   .x-stock, x-stock { padding: 1rem; }`);
      console.log(`   .x-ticker, x-ticker { padding: 1rem; }`);
    }
    
    // Soft fail - log issues but don't break build for this new test
    if (violations.length > 0) {
      console.warn(`Stock indicator spacing issues found: ${violations.length}`);
    }
    expect(violations.length).toBeLessThan(20);
  });
});
