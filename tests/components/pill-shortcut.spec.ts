import { test, expect } from '@playwright/test';

test.describe('Pill Behavior Shortcut', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base URL to ensure relative paths work
    await page.goto('/');

    // Setup the page with WB library
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pill Test</title>
          <link rel="stylesheet" href="/src/styles/main.css">
          <style>
            body { padding: 20px; }
            .demo-area { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="demo-area">
            <!-- Pill Shortcut -->
            <wb-pill id="test-pill" data-variant="success">Pill Shortcut</wb-pill>
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

  test('x-pill="" creates a badge with pill style', async ({ page }) => {
    const pill = page.locator('#test-pill');
    await expect(pill).toBeVisible();
    
    // Should have badge classes
    await expect(pill).toHaveClass(/wb-badge/);
    await expect(pill).toHaveClass(/wb-badge--success/);
    await expect(pill).toHaveClass(/wb-badge--pill/);
    
    // Should have rounded corners
    await expect(pill).toHaveCSS('border-radius', '9999px');
  });
});
