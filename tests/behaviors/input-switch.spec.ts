import { test, expect } from '@playwright/test';

test.describe('Input and Switch Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base URL to ensure relative paths work
    await page.goto('/');
    
    // Setup the page with WB library
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Input Test</title>
          <link rel="stylesheet" href="/src/styles/main.css">
          <style>
            body { padding: 20px; }
            .demo-area { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="demo-area">
            <!-- Input with Icon -->
            <div class="wb-input-wrapper">
              <span class="wb-input-icon">🔍</span>
              <input type="text" data-wb="input" data-wb-eager placeholder="Search...">
            </div>
          </div>

          <div class="demo-area">
            <!-- Switch -->
            <input type="checkbox" data-wb="switch" data-wb-eager id="switch1">
            <label for="switch1">Toggle Me</label>
          </div>

          <script type="module">
            import { WB } from '/src/index.js';
            window.WB = WB;
          </script>
        </body>
      </html>
    `);

    // Initialize WB
    await page.evaluate(async () => {
      // Wait for WB to be available
      if (!window.WB) {
        await new Promise(resolve => {
          const check = setInterval(() => {
            if (window.WB) {
              clearInterval(check);
              resolve(undefined);
            }
          }, 50);
        });
      }
      await window.WB.scan();
    });
  });

  test('Input should have correct styling classes', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    await expect(input).toHaveClass(/wb-input/);
    
    // Check wrapper styling
    const wrapper = page.locator('.wb-input-wrapper');
    await expect(wrapper).toHaveCSS('position', 'relative');
    await expect(wrapper).toHaveCSS('display', 'flex');
    
    // Check icon positioning
    const icon = page.locator('.wb-input-icon');
    await expect(icon).toBeVisible();
  });

  test('Switch should transform checkbox', async ({ page }) => {
    // The checkbox should be wrapped in a switch container
    // Note: The original input is still there but might be hidden or moved
    // We look for the wrapper that the behavior creates
    
    // Wait for transformation
    await page.waitForSelector('.wb-switch');
    
    const switchWrapper = page.locator('.wb-switch');
    await expect(switchWrapper).toBeVisible();
    
    // Check for the slider element
    const slider = switchWrapper.locator('.wb-switch__slider');
    await expect(slider).toBeVisible();
    
    // Check interaction
    const checkbox = page.locator('#switch1');
    await switchWrapper.click();
    await expect(checkbox).toBeChecked();
    
    await switchWrapper.click();
    await expect(checkbox).not.toBeChecked();
  });
});
