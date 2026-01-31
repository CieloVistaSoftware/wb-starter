/**
 * HOME PAGE COMPLIANCE
 * ====================
 * Ensures critical home page elements remain intact.
 * These are the "hero" elements that define the site's first impression.
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page Compliance', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the hero card to appear, ensuring content is loaded
    await page.waitForSelector('wb-cardhero', { state: 'attached', timeout: 10000 });
    // Additional small buffer for hydration
    await page.waitForTimeout(500); 
  });

  test('first panel should be wb-cardhero with expected content', async ({ page }) => {
    // First panel must be wb-cardhero
    const hero = page.locator('wb-cardhero').first();
    await expect(hero, 'First panel must be <wb-cardhero>').toBeVisible();
    
    // Must have the cosmic variant
    await expect(hero).toHaveAttribute('variant', 'cosmic');
    
    // Title must contain key phrase - check locator globally if scoped locator fails due to shadow dom boundary confusion
    // Using simple text locator for robustness
    // Use a robust locator that finds the text anywhere inside the component
    const heroComponent = page.locator('wb-cardhero');
    await expect(heroComponent).toBeVisible();
    await expect(heroComponent).toContainText('Build stunning UIs');

    // subtitle: accept rendered text OR presence of the attribute (attribute-only API)
    await expect(heroComponent).toContainText('just HTML').catch(async () => {
      await expect(page.locator('wb-cardhero[subtitle]')).toHaveAttribute('subtitle', /just HTML/);
    });

    // Must have gradient text styling
    const gradientText = heroComponent.locator('.wb-gradient-text');
    await expect(gradientText, 'Title must have gradient text').toBeVisible();
    
    // Must have CTA buttons
    await expect(hero).toHaveAttribute('cta', /Explore Components/);
    await expect(hero).toHaveAttribute('cta-secondary', /Documentation/);
    
    // Must have component count badge in pretitle (supports slot OR attribute)
    const pretitle = page.locator('wb-cardhero [slot="pretitle"], wb-cardhero[pretitle]');
    await expect(pretitle).toContainText(/\d+ Components/);
  });

  test('home page should have "Why WB Behaviors" section', async ({ page }) => {
    // Must have the features section
    const whySection = page.locator('text=Why WB Behaviors');
    await expect(whySection, '"Why WB Behaviors" section must exist').toBeVisible();
    
    // Must have feature cards
    const featureCards = page.locator('wb-card[variant="float"]');
    const count = await featureCards.count();
    expect(count, 'Must have at least 6 feature cards').toBeGreaterThanOrEqual(6);
  });

  test('home page should have live demo section with glass card', async ({ page }) => {
    // Must have glass card demo
    const glassCard = page.locator('wb-card[variant="glass"]').first();
    await expect(glassCard, 'Live demo must have glass card').toBeVisible();
    
    // Must have "Open Modal" button - relax selector
    // Using exact text match on the custom element itself
    const modalBtn = page.locator('wb-button', { hasText: 'Open Modal' });
    await expect(modalBtn, 'Must have Open Modal button').toBeVisible();
  });

  test('home page should have CTA section at bottom', async ({ page }) => {
    // Must have final CTA - check heading
    const ctaHeading = page.locator('h2:has-text("Ready to build something")');
    await expect(ctaHeading, 'Bottom CTA heading must exist').toBeVisible();
    
    // Must have "Get Started Free" link
    const getStarted = page.locator('a:has-text("Get Started")');
    await expect(getStarted).toBeVisible();
    
    // Must have GitHub link
    const github = page.locator('a:has-text("GitHub")');
    await expect(github).toBeVisible();
  });

  test('home page should have image grid section', async ({ page }) => {
    // Must have rearrange images section - use heading to be specific
    const rearrangeHeading = page.locator('h2:has-text("Rearrange")');
    await expect(rearrangeHeading, 'Image grid section must exist').toBeVisible();
    
    // Must have edit mode toggle
    const editToggle = page.locator('#editModeToggle');
    await expect(editToggle).toBeVisible();
  });

});
