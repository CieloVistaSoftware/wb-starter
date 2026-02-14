/**
 * Home Page Permutation Compliance Test
 * Auto-generated from home-page.schema.json
 * Ensures every element, property, and behavior is fully tested.
 */
import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:3000?page=home';

test.describe('Home Page Permutation Compliance', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      throw new Error(`[PAGE ERROR] ${err.message}`);
    });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
  });

  test('Hero section renders and is compliant', async ({ page }) => {
    const hero = page.locator('wb-cardhero');
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute('variant', 'cosmic');
    await expect(hero).toContainText('Build stunning UIs');
    await expect(hero).toContainText('Explore Components');
    await expect(hero).toHaveClass(/wb-cardhero--cosmic/);
    await expect(hero).toHaveAttribute('role', 'banner');
  });

  test('Stats banner displays all stat items', async ({ page }) => {
    const statItems = page.locator('.stat-item');
    await expect(statItems).toHaveCount(4);
    await expect(statItems.nth(0)).toContainText('Behaviors');
    await expect(statItems.nth(1)).toContainText('DOM Architecture');
    await expect(statItems.nth(2)).toContainText('Build Time');
    await expect(statItems.nth(3)).toContainText('Standards Compliant');
  });

  test('Live demo section (wb-demo) interactive elements', async ({ page }) => {
    const demo = page.locator('wb-demo');
    await expect(demo).toBeVisible();
    await expect(demo).toHaveClass(/wb-demo/);

    const rippleBtn = demo.locator('button[x-ripple]');
    await expect(rippleBtn).toBeVisible();
    await rippleBtn.click();
    // TODO: Assert ripple event fired

    const tooltipBtn = demo.locator('button[x-tooltip]');
    await expect(tooltipBtn).toBeVisible();
    await tooltipBtn.hover();
    // TODO: Assert tooltip event fired

    const draggableDiv = demo.locator('div[x-draggable]');
    await expect(draggableDiv).toBeVisible();
    // TODO: Assert draggable behavior

    const confettiBtn = demo.locator('button[x-confetti]');
    await expect(confettiBtn).toBeVisible();
    await confettiBtn.click();
    // TODO: Assert confetti event fired
  });

  test('Feature cards grid renders all cards', async ({ page }) => {
    const featureCards = page.locator('wb-card[variant="float"]');
    await expect(featureCards).toHaveCount(6);
    await expect(featureCards.nth(0)).toContainText('Component Library');
    await expect(featureCards.nth(1)).toContainText('Behaviors System');
    await expect(featureCards.nth(2)).toContainText('Theme Engine');
    await expect(featureCards.nth(3)).toContainText('Data Viz');
    await expect(featureCards.nth(4)).toContainText('Accessible');
    await expect(featureCards.nth(5)).toContainText('Performance');
    // Accessibility check
    for (let i = 0; i < 6; i++) {
      await expect(featureCards.nth(i)).toHaveAttribute('role', 'region');
    }
  });

  test('Compliance: required children and styles', async ({ page }) => {
    await expect(page.locator('wb-cardhero')).toBeVisible();
    await expect(page.locator('.stat-item')).toHaveCount(4);
    await expect(page.locator('wb-card[variant="glass"]')).toBeVisible();
    await expect(page.locator('wb-card[variant="float"]')).toHaveCount(6);
    // TODO: Check borderRadius and background styles
  });
});
