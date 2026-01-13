
import { test, expect } from '@playwright/test';
import { setupBehaviorTest, waitForWB } from './base';
import * as path from 'path';

test.describe('External Markdown Code Block Injection', () => {

  test('should render code block from external markdown file', async ({ page }) => {
    // Navigate to the specific article
    // Note: We need to serve the file or open it via file protocol. 
    // Assuming Playwright's baseURL is set to the root, or we use a relative path
    await page.goto('/articles/resilience-through-separation.html');

    // Wait for the wb-mdhtml component to load
    // It adds the class 'wb-mdhtml--loaded' when done
    const mdhtml = page.locator('wb-mdhtml');
    await expect(mdhtml).toHaveClass(/wb-mdhtml--loaded/, { timeout: 10000 });

    // Verify content text exists in the DOM
    await expect(mdhtml).toContainText('class OrderService');
    await expect(mdhtml).toContainText('new StripePaymentService()');

    // Verify some formatting elements (e.g. Highlight.js classes or standard code blocks)
    // wb-mdhtml uses 'marked' which outputs <pre><code>...</code></pre>
    const pre = mdhtml.locator('pre');
    await expect(pre).toBeVisible();

    const code = pre.locator('code');
    await expect(code).toBeVisible();
    
    // Check if it's the expected language
    await expect(code).toHaveClass(/language-javascript|js/);
  });

});
