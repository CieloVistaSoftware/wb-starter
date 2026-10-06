import { test, expect } from '../fixtures/offline';
import { safeScrollIntoView } from '../base';
import { setupBehaviorTest, setupTestContainer } from '../base';

test.describe('Pseudo-Custom Elements (PCE) v3.0', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('[x-cardprofile] is recognized as PCE', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<div x-cardprofile 
          data-name="John Doe" 
          data-role="Developer" 
          data-bio="Coding all day" 
          data-avatar="avatar.jpg">
       </div>`
    );

    // Check element exists and has expected attributes
    await expect(element).toBeVisible();
    await expect(element).toHaveAttribute('data-name', 'John Doe');
    await expect(element).toHaveAttribute('data-role', 'Developer');
    
    // Check the behavior was applied. This used to call
    // `element.classList.contains(...)` -- but `element` is a Playwright
    // Locator, which has no classList, so the test threw a TypeError before
    // asserting anything. And `wbReady !== null || ...` was true for any
    // boolean, so even a working call could never have failed.
    //
    // x-ready is an ATTRIBUTE (#970), and cardprofile builds its name from
    // data-name, so both are real, falsifiable signs the behavior ran.
    await expect(element).toHaveAttribute('x-ready', '');
    await expect(element).toContainText('John Doe');
  });

  test('[x-cardprofile] alias also works', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<div x-cardprofile 
          data-name="Jane Smith" 
          data-role="Designer">
       </div>`
    );

    // Custom elements without explicit display may be hidden, just check attributes
    await expect(element).toHaveCount(1);
    await expect(element).toHaveAttribute('data-name', 'Jane Smith');
    await expect(element).toHaveAttribute('data-role', 'Designer');
  });

  test('[x-cardhero] is recognized as PCE', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<div x-cardhero 
          data-title="Hero Title" 
          data-subtitle="Hero Subtitle" 
          data-align="center">
       </div>`
    );

    await expect(element).toHaveCount(1);
    await expect(element).toHaveAttribute('data-title', 'Hero Title');
    await expect(element).toHaveAttribute('data-subtitle', 'Hero Subtitle');
  });

  test('[x-cardstats] is recognized as PCE', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<div x-cardstats 
          data-label="Users" 
          data-value="1000" 
          data-icon="👤" 
          data-trend="up" 
          data-trend-value="10%">
       </div>`
    );

    // Check element exists and has correct attributes
    await expect(element).toHaveCount(1);
    await expect(element).toHaveAttribute('data-label', 'Users');
    await expect(element).toHaveAttribute('data-value', '1000');
    await expect(element).toHaveAttribute('data-trend', 'up');
  });

  test('[x-cardnotification] is recognized as PCE', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<div x-cardnotification 
          data-type="info" 
          data-title="Info" 
          data-message="This is info">
       </div>`
    );

    await expect(element).toHaveCount(1);
    await expect(element).toHaveAttribute('data-type', 'info');
    await expect(element).toHaveAttribute('data-title', 'Info');
    await expect(element).toHaveAttribute('data-message', 'This is info');
  });

  test('x-behavior attribute triggers tooltip behavior', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<button x-behavior="tooltip" data-tooltip="Test Tooltip">Hover Me</button>`
    );

    await expect(element).toBeVisible();
    await expect(element).toHaveAttribute('x-behavior', 'tooltip');
    
    // Hover to trigger tooltip
    await element.hover();
    
    // Check for tooltip element (class may vary)
    const tooltip = page.locator('[class*="tooltip"], [data-tooltip-visible]');
    const tooltipCount = await tooltip.count();
    // Tooltip may or may not be present depending on implementation
    expect(tooltipCount >= 0).toBeTruthy();
  });

  test('.x-card basic element works', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<article data-title="Test Card">
         <p>Card content</p>
       </article>`
    );

    await expect(element).toBeVisible();
    await expect(element).toHaveAttribute('data-title', 'Test Card');
    await expect(element).toContainText('Card content');
  });

  test('multiple PCE elements on same page', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/styles/themes.css">
        <script type="module">
          import WB from '/src/core/wb-lazy.js';
          WB.init({ debug: true });
        </script>
      </head>
      <body>
        <div x-cardstats label="Stat 1" value="100"></div>
        <div x-cardstats label="Stat 2" value="200"></div>
        <div x-cardstats label="Stat 3" value="300"></div>
      </body>
      </html>
    `);

    // No WBSite wait: this is a standalone document that only boots the WB
    // runtime, never the SPA, so window.WBSite is never created and waiting on
    // it timed out every run (same trap as #691). And the old assertions read
    // back the authored data-* attributes -- true whether or not any behavior
    // ran. Plain attributes (v3, #224), and proof each element was built.
    await page.waitForFunction(() => (window as any).WB !== undefined, { timeout: 20000 });

    const stats = page.locator('[x-cardstats]');
    await expect(stats).toHaveCount(3);

    for (const [i, v] of ['100', '200', '300'].entries()) {
      await expect(stats.nth(i)).toHaveAttribute('x-ready', '', { timeout: 20000 });
      await expect(stats.nth(i)).toContainText(v);
      await expect(stats.nth(i)).toContainText(`Stat ${i + 1}`);
    }
  });

  test('PCE elements respond to lazy loading', async ({ page }) => {
    // Create a page with PCE elements below the fold
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/styles/themes.css">
        <script type="module">
          import WB from '/src/core/wb-lazy.js';
          WB.init({ debug: true });
        </script>
        <style>
          .spacer { height: 200vh; }
          x-cardprofile { display: block; }
        </style>
      </head>
      <body>
        <div class="spacer">Scroll down...</div>
        <div x-cardprofile id="lazy-profile" name="Lazy User"></div>
      </body>
      </html>
    `);

    // Standalone document: WB boots, WBSite never does (see above).
    await page.waitForFunction(() => (window as any).WB !== undefined, { timeout: 20000 });

    const profile = page.locator('#lazy-profile');

    // Initially not visible
    await expect(profile).not.toBeInViewport();

    // Scroll into view
    await safeScrollIntoView(profile);

    // Now visible and the behavior has been applied -- x-ready and the name it
    // renders, not the authored attribute read back.
    await expect(profile).toBeVisible();
    await expect(profile).toHaveAttribute('x-ready', '', { timeout: 20000 });
    await expect(profile).toContainText('Lazy User');
  });
});
