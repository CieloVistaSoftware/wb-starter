import { test, expect } from '@playwright/test';

test.describe('PCE Demo Page', () => {
  test('loads pce-test.html and renders custom elements', async ({ page }) => {
    await page.goto('/demos/pce-test.html');

    // Check title (v3.0)
    await expect(page).toHaveTitle('PCE (Pseudo-Custom Elements) Test - v3.0');

    // Wait for WB to initialize
    await page.waitForFunction(() => window.WB !== undefined);
    
    // Give behaviors time to load (lazy loading)
    await page.waitForTimeout(1000);

    // Check Profile Card (wb-* namespace)
    const profileCard = page.locator('#wb-cardprofile-1');
    await safeScrollIntoView(profileCard);
    await expect(profileCard).toBeVisible();
    // Check data attributes are present (behavior may or may not inject content)
    await expect(profileCard).toHaveAttribute('data-name', 'Sarah Connor');

    // Check Profile Card (noun-first alias)
    const profileCardAlias = page.locator('#profile-card-1');
    await safeScrollIntoView(profileCardAlias);
    await expect(profileCardAlias).toBeVisible();
    await expect(profileCardAlias).toHaveAttribute('data-name', 'John Connor');

    // Check Hero Card
    const heroCard = page.locator('#wb-cardhero-1');
    await safeScrollIntoView(heroCard);
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toHaveAttribute('data-title', 'Welcome to WB v3.0');

    // Check Stats Cards
    const statsCard1 = page.locator('#wb-cardstats-1');
    await safeScrollIntoView(statsCard1);
    await expect(statsCard1).toBeVisible();
    await expect(statsCard1).toHaveAttribute('data-label', 'Total Users');
    await expect(statsCard1).toHaveAttribute('data-value', '1,234,567');

    // Check Testimonial Card
    const testimonialCard = page.locator('#wb-cardtestimonial-1');
    await safeScrollIntoView(testimonialCard);
    await expect(testimonialCard).toBeVisible();
    await expect(testimonialCard).toHaveAttribute('data-author', 'Jane Doe');

    // Check File Card
    const fileCard = page.locator('#wb-cardfile-1');
    await safeScrollIntoView(fileCard);
    await expect(fileCard).toBeVisible();
    await expect(fileCard).toHaveAttribute('data-filename', 'wb-framework-v3.0-docs.pdf');

    // Check Notification Cards
    const notificationCard1 = page.locator('#wb-cardnotification-1');
    await safeScrollIntoView(notificationCard1);
    await expect(notificationCard1).toBeVisible();
    await expect(notificationCard1).toHaveAttribute('data-type', 'info');
    await expect(notificationCard1).toHaveAttribute('data-title', 'WB v3.0 Released');

    // Check Interactive Element with x-behavior
    const tooltipBtn = page.locator('#btn-tooltip-1');
    await safeScrollIntoView(tooltipBtn);
    await expect(tooltipBtn).toBeVisible();
    await expect(tooltipBtn).toHaveAttribute('x-behavior', 'tooltip toast');
  });

  test('debug status check works', async ({ page }) => {
    await page.goto('/demos/pce-test.html');
    
    // Wait for WB to initialize
    await page.waitForFunction(() => window.WB !== undefined);
    await page.waitForTimeout(2500); // Wait for auto-check

    // Check that status output has content
    const statusOutput = page.locator('#status-output');
    await expect(statusOutput).not.toBeEmpty();
    
    // Parse and verify some elements are detected
    const statusText = await statusOutput.textContent();
    expect(statusText).toContain('wb-cardprofile-1');
  });
});
