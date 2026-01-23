/**
 * Code Examples Display Test
 * Ensures all code examples in behaviors-showcase.html show actual HTML markup
 * and not just stripped text content (which happens when HTML isn't escaped properly)
 */
import { test, expect } from '@playwright/test';

test.describe('Behaviors Showcase - Code Examples', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/behaviors-showcase.html');
    // Wait for WB to initialize
    await page.waitForFunction(() => window.WB !== undefined, { timeout: 10000 });
  });

  test('all code examples should display HTML tags, not stripped text', async ({ page }) => {
    // Find all wb-mdhtml elements that have been rendered
    const codeBlocks = await page.locator('wb-mdhtml pre code, wb-mdhtml .hljs').all();
    
    expect(codeBlocks.length).toBeGreaterThan(0);
    
    const failures = [];
    
    for (let i = 0; i < codeBlocks.length; i++) {
      const codeBlock = codeBlocks[i];
      const text = await codeBlock.textContent();
      
      // Skip empty blocks
      if (!text || text.trim().length === 0) continue;
      
      // Check if the code contains HTML tags (< and >)
      const hasHtmlTags = text.includes('<') && text.includes('>');
      
      // Also check it's not just showing plain text like "Primary\nSecondary\nGhost"
      const looksLikeStrippedHtml = /^[\w\s\-]+\n[\w\s\-]+\n[\w\s\-]+$/m.test(text.trim());
      
      if (!hasHtmlTags || looksLikeStrippedHtml) {
        // Get context - find parent section
        const section = await codeBlock.evaluate(el => {
          const section = el.closest('section');
          return section ? section.querySelector('h2')?.textContent : 'Unknown section';
        });
        
        failures.push({
          section,
          index: i,
          content: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          hasHtmlTags,
          looksLikeStrippedHtml
        });
      }
    }
    
    if (failures.length > 0) {
      const report = failures.map(f => 
        `Section: ${f.section}\n  Content: "${f.content}"\n  Has HTML tags: ${f.hasHtmlTags}`
      ).join('\n\n');
      
      expect(failures, `Found ${failures.length} code blocks without HTML markup:\n\n${report}`).toHaveLength(0);
    }
  });

  test('code examples should contain class attributes for HTML examples', async ({ page }) => {
    // HTML code examples should have class="" attributes visible
    const htmlCodeBlocks = await page.locator('wb-mdhtml pre code.language-html, wb-mdhtml code.hljs').all();
    
    const failures = [];
    
    for (const block of htmlCodeBlocks) {
      const text = await block.textContent();
      if (!text || text.trim().length === 0) continue;
      
      // If it looks like it should be HTML (has element names like button, div, input)
      const elementNames = ['button', 'div', 'input', 'span', 'wb-', 'nav', 'select', 'textarea'];
      const hasElementName = elementNames.some(name => 
        text.toLowerCase().includes(name)
      );
      
      if (hasElementName) {
        // Should have class= or other attributes visible
        const hasAttributes = text.includes('class=') || 
                             text.includes('data-') || 
                             text.includes('x-') ||
                             text.includes('type=') ||
                             (text.includes('<') && text.includes('>'));
        
        if (!hasAttributes) {
          failures.push({
            content: text.substring(0, 80)
          });
        }
      }
    }
    
    expect(failures, `Found ${failures.length} HTML examples without visible attributes`).toHaveLength(0);
  });

  test('wb-mdhtml elements should render code blocks', async ({ page }) => {
    // Each wb-mdhtml should have rendered content
    const mdElements = await page.locator('wb-mdhtml').all();
    
    expect(mdElements.length).toBeGreaterThan(10); // Should have many examples
    
    let renderedCount = 0;
    
    for (const el of mdElements) {
      const hasCodeBlock = await el.locator('pre code, pre, .hljs').count();
      if (hasCodeBlock > 0) {
        renderedCount++;
      }
    }
    
    // At least 80% should have rendered code blocks
    const renderRate = renderedCount / mdElements.length;
    expect(renderRate, `Only ${renderedCount}/${mdElements.length} wb-mdhtml elements rendered code blocks`).toBeGreaterThan(0.8);
  });

  test('Button Variants example should show button tags with classes', async ({ page }) => {
    // Specific test for the first example
    const buttonsSection = page.locator('section#buttons');
    const firstExample = buttonsSection.locator('wb-mdhtml').first();
    
    await expect(firstExample).toBeVisible();
    
    const codeText = await firstExample.locator('pre code, code').first().textContent();
    
    // Should contain actual HTML, not stripped text
    expect(codeText).toContain('<button');
    expect(codeText).toContain('class=');
    expect(codeText).toContain('wb-btn');
    expect(codeText).toContain('</button>');
    
    // Should NOT be just the text content
    expect(codeText).not.toMatch(/^Primary\s*Secondary\s*Ghost\s*Disabled\s*$/);
  });

});
