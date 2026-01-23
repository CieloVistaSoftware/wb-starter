import { test, expect } from '@playwright/test';

test.describe('wb-mdhtml HTML escaping', () => {

  test('behaviors page code examples should show HTML markup', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForSelector('wb-mdhtml', { timeout: 10000 });
    
    // Wait for mdhtml to process
    await page.waitForTimeout(2000);

    // Find the first code block in a wb-mdhtml
    const firstCodeBlock = page.locator('wb-mdhtml pre code').first();
    await expect(firstCodeBlock).toBeVisible();

    const textContent = await firstCodeBlock.textContent();
    console.log('First code block text:', textContent);

    // It MUST contain HTML tag syntax - not just plain text like "Primary"
    expect(textContent).toContain('<button');
    expect(textContent).toContain('class=');
    expect(textContent).toContain('</button>');
    
    // Verify multiple elements are shown correctly
    expect(textContent).toContain('wb-btn--primary');
    expect(textContent).toContain('wb-btn--secondary');
  });

  test('code blocks should NOT render actual button elements', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('wb-mdhtml', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Get the first wb-mdhtml element
    const firstMdhtml = page.locator('wb-mdhtml').first();
    
    // Inside the code block, there should be NO actual rendered button elements
    // The buttons should be escaped text, not real DOM elements
    const preElement = firstMdhtml.locator('pre');
    await expect(preElement).toBeVisible();
    
    // Check that pre > code has text content with HTML tags
    const codeText = await preElement.locator('code').textContent();
    expect(codeText).toContain('<button');
    
    // There should be NO actual button elements inside the pre/code block
    const buttonsInsidePre = await preElement.locator('button').count();
    expect(buttonsInsidePre).toBe(0);
  });
});
