import { test, expect } from '@playwright/test';

test.describe('PCE Demo Page', () => {
  test('loads pce-test.html and renders custom elements', async ({ page }) => {
    await page.goto('/demos/pce-test.html');

    // Check title
    await expect(page).toHaveTitle('PCE (Pseudo-Custom Elements) Test');

    // Check Profile Card
    const profileCard = page.locator('#profile-card-1');
    await expect(profileCard).toBeVisible();
    await expect(profileCard).toContainText('Sarah Connor');
    await expect(profileCard).toContainText('Resistance Leader');

    // Check Hero Card
    const heroCard = page.locator('#hero-card-1');
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toContainText('Welcome to the Future');

    // Check Stats Card
    const statsCard = page.locator('#stats-card-1');
    await expect(statsCard).toBeVisible();
    await expect(statsCard).toContainText('Total Users');

    // Check Testimonial Card
    const testimonialCard = page.locator('#testimonial-card-1');
    await testimonialCard.scrollIntoViewIfNeeded();
    await expect(testimonialCard).toBeVisible();
    await expect(testimonialCard).toContainText('Jane Doe');

    // Check File Card
    const fileCard = page.locator('#file-card-1');
    await fileCard.scrollIntoViewIfNeeded();
    await expect(fileCard).toBeVisible();
    await expect(fileCard).toContainText('project-specs-v2.pdf');

    // Check Notification Card
    const notificationCard = page.locator('#notification-card-1');
    await notificationCard.scrollIntoViewIfNeeded();
    await expect(notificationCard).toBeVisible();
    await expect(notificationCard).toContainText('Update Available');

    // Check Interactive Elements
    const tooltipBtn = page.locator('#btn-tooltip-1');
    await tooltipBtn.scrollIntoViewIfNeeded();
    await expect(tooltipBtn).toBeVisible();
    
    // Hover to trigger tooltip
    await tooltipBtn.hover();
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('I am a tooltip');
  });
});
