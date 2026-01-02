import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

test.describe('Pseudo-Custom Elements (PCE)', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('profile-card renders correctly', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<profile-card 
          data-name="John Doe" 
          data-role="Developer" 
          data-bio="Coding all day" 
          data-avatar="avatar.jpg">
       </profile-card>`
    );

    // Check if the behavior class was added (assuming cardprofile adds a class, usually wb-card-profile or similar)
    // If we don't know the exact class, we can check for structure injection
    await expect(element.locator('h3')).toContainText('John Doe');
    await expect(element.locator('p').first()).toContainText('Developer');
  });

  test('hero-card renders correctly', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<hero-card 
          data-title="Hero Title" 
          data-subtitle="Hero Subtitle" 
          data-align="center">
       </hero-card>`
    );

    await expect(element.locator('h1')).toContainText('Hero Title');
    await expect(element.locator('p')).toContainText('Hero Subtitle');
    // Check alignment style or class if applicable
    await expect(element).toHaveCSS('text-align', 'center');
  });

  test('stats-card renders correctly', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<stats-card 
          data-label="Users" 
          data-value="1000" 
          data-icon="👤" 
          data-trend="up" 
          data-trend-value="10%">
       </stats-card>`
    );

    await expect(element).toContainText('Users');
    await expect(element).toContainText('1000');
    await expect(element).toContainText('10%');
  });

  test('button-tooltip works as a custom element', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<button-tooltip tooltip="PCE Tooltip">Hover Me</button-tooltip>`
    );

    await element.hover();
    
    const tooltip = page.locator('.wb-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('PCE Tooltip');
  });

  test('notification-card renders correctly', async ({ page }) => {
    const element = await setupTestContainer(
      page,
      `<notification-card 
          data-type="info" 
          data-title="Info" 
          data-message="This is info">
       </notification-card>`
    );

    await expect(element).toContainText('Info');
    await expect(element).toContainText('This is info');
    // Check for info styling (usually blue border or background)
    // We might need to check class names if we knew them exactly, but text content is a good start
  });
});
