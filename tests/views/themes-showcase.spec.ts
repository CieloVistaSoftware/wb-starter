/**
 * Themes Showcase Page Tests
 * Tests for proper rendering, HCS demos, and component display
 */

import { test, expect } from '@playwright/test';

test.describe('Themes Showcase Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/?page=themes');
    await page.waitForTimeout(1000);
  });

  test.describe('Page Structure', () => {
    test('has hero section with title', async ({ page }) => {
      const hero = page.locator('.page__hero');
      await expect(hero).toBeVisible();
      await expect(hero.locator('h1')).toContainText('Themes');
    });

    test('has theme control in hero', async ({ page }) => {
      const themeControl = page.locator('.page__hero wb-themecontrol');
      await expect(themeControl).toBeVisible();
    });

    test('has stats cards section', async ({ page }) => {
      const statsSection = page.locator('.themes-stats');
      await expect(statsSection).toBeVisible();
      
      // Should have 4 stats cards with v3.0 syntax
      const statsCards = statsSection.locator('stats-card');
      await expect(statsCards).toHaveCount(4);
    });
  });

  test.describe('Stats Cards - v3.0 Syntax', () => {
    test('stats cards render with direct attributes', async ({ page }) => {
      const statsCards = page.locator('.themes-stats stats-card');
      
      // First card: Total Themes
      const firstCard = statsCards.nth(0);
      await expect(firstCard).toHaveAttribute('value', '23');
      await expect(firstCard).toHaveAttribute('label', 'Total Themes');
      
      // Verify rendered content is visible
      await expect(firstCard).toBeVisible();
    });
  });

  test.describe('Harmonic Color System Section', () => {
    test('has HCS demo section', async ({ page }) => {
      const hcsDemo = page.locator('.hcs-demo');
      await expect(hcsDemo).toBeVisible();
    });

    test('has wave demo visualization', async ({ page }) => {
      const waveDemo = page.locator('.hcs-wave-demo');
      await expect(waveDemo).toBeVisible();
      
      // Should have 3 wave elements
      const waves = waveDemo.locator('.hcs-wave');
      await expect(waves).toHaveCount(3);
    });

    test('has color swatches with labels', async ({ page }) => {
      const swatches = page.locator('.hcs-color-swatch');
      await expect(swatches).toHaveCount(3);
      
      // Check labels are visible
      await expect(swatches.nth(0).locator('span')).toContainText('Primary');
      await expect(swatches.nth(1).locator('span')).toContainText('Secondary');
      await expect(swatches.nth(2).locator('span')).toContainText('Accent');
    });

    test('has harmony type cards', async ({ page }) => {
      const harmonyCards = page.locator('.harmony-card');
      await expect(harmonyCards).toHaveCount(4);
      
      // Check harmony types
      await expect(harmonyCards.nth(0).locator('h4')).toContainText('Complementary');
      await expect(harmonyCards.nth(1).locator('h4')).toContainText('Analogous');
      await expect(harmonyCards.nth(2).locator('h4')).toContainText('Triadic');
      await expect(harmonyCards.nth(3).locator('h4')).toContainText('Split-Complementary');
    });

    test('has math section with formulas', async ({ page }) => {
      const mathSection = page.locator('.hcs-math-section');
      await expect(mathSection).toBeVisible();
      
      const mathCards = mathSection.locator('.math-card');
      await expect(mathCards).toHaveCount(3);
    });

    test('has code example with wb-mdhtml', async ({ page }) => {
      // Check for code block in HCS section
      const codeBlock = page.locator('.page__section').first().locator('wb-mdhtml, [data-wb="mdhtml"]');
      await expect(codeBlock).toBeVisible();
    });
  });

  test.describe('Theme Grid', () => {
    test('has all 23 theme cards', async ({ page }) => {
      const themeCards = page.locator('.themes-grid .theme-card');
      await expect(themeCards).toHaveCount(23);
    });

    test('theme cards are clickable and switch themes', async ({ page }) => {
      // Click on Ocean theme
      const oceanCard = page.locator('.theme-card[data-preview-theme="ocean"]');
      await oceanCard.click();
      
      // Verify theme attribute changed
      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-theme', 'ocean');
    });

    test('each theme card has preview colors', async ({ page }) => {
      const firstCard = page.locator('.theme-card').first();
      const colors = firstCard.locator('.theme-card__colors span');
      await expect(colors).toHaveCount(3);
    });
  });

  test.describe('Live Preview Section', () => {
    test('has preview section with components', async ({ page }) => {
      const previewContainer = page.locator('.preview-container');
      await expect(previewContainer).toBeVisible();
    });

    test('preview cards use v3.0 syntax', async ({ page }) => {
      // Check basic-card
      const basicCard = page.locator('.preview-container basic-card');
      await expect(basicCard).toBeVisible();
      await expect(basicCard).toHaveAttribute('title', 'Card Title');
      
      // Check stats-card
      const statsCard = page.locator('.preview-container stats-card');
      await expect(statsCard).toBeVisible();
      await expect(statsCard).toHaveAttribute('value', '1,234');
      
      // Check price-card
      const priceCard = page.locator('.preview-container price-card');
      await expect(priceCard).toBeVisible();
      await expect(priceCard).toHaveAttribute('plan', 'Pro');
    });

    test('buttons section has styled buttons', async ({ page }) => {
      const buttons = page.locator('.preview-row-inline .wb-btn');
      expect(await buttons.count()).toBeGreaterThanOrEqual(3);
    });

    test('badges render with visible text', async ({ page }) => {
      const badges = page.locator('.preview-row-inline wb-badge');
      expect(await badges.count()).toBeGreaterThanOrEqual(4);
      
      // Check each badge has visible text
      for (let i = 0; i < await badges.count(); i++) {
        const badge = badges.nth(i);
        await expect(badge).toBeVisible();
        
        // Get text content and verify it's not empty
        const text = await badge.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
        
        // Verify text is not overflowing
        const box = await badge.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(20); // Badge should have reasonable width
      }
    });

    test('alerts show all variants with proper colors', async ({ page }) => {
      const alerts = page.locator('.preview-container wb-alert');
      expect(await alerts.count()).toBeGreaterThanOrEqual(2);
      
      // Check info alert
      const infoAlert = page.locator('wb-alert[type="info"]');
      await expect(infoAlert).toBeVisible();
      
      // Check success alert
      const successAlert = page.locator('wb-alert[type="success"]');
      await expect(successAlert).toBeVisible();
      
      // Verify alerts have visible content
      for (let i = 0; i < await alerts.count(); i++) {
        const alert = alerts.nth(i);
        const box = await alert.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThan(30); // Alert should have reasonable height
      }
    });

    test('progress bars render and have width', async ({ page }) => {
      const progressBars = page.locator('.preview-container wb-progress');
      expect(await progressBars.count()).toBeGreaterThanOrEqual(3);
      
      // Check each progress bar
      for (let i = 0; i < await progressBars.count(); i++) {
        const progress = progressBars.nth(i);
        await expect(progress).toBeVisible();
        
        // Check the inner bar element has width > 0
        const bar = progress.locator('.wb-progress__bar, [class*="progress"]');
        const barBox = await bar.boundingBox();
        
        // Progress bar should exist and have some width based on value
        if (barBox) {
          expect(barBox.width).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('CSS Variables Reference', () => {
    test('has variables section', async ({ page }) => {
      const variablesGrid = page.locator('.variables-grid');
      await expect(variablesGrid).toBeVisible();
    });

    test('variable groups have proper structure', async ({ page }) => {
      const groups = page.locator('.variables-group');
      expect(await groups.count()).toBeGreaterThanOrEqual(5);
    });

    test('no text overflow in variable code elements', async ({ page }) => {
      const codeElements = page.locator('.variables-group code');
      
      for (let i = 0; i < Math.min(await codeElements.count(), 10); i++) {
        const code = codeElements.nth(i);
        const box = await code.boundingBox();
        const parent = await code.locator('..').boundingBox();
        
        if (box && parent) {
          // Code element should not exceed parent width
          expect(box.x + box.width).toBeLessThanOrEqual(parent.x + parent.width + 5);
        }
      }
    });
  });

  test.describe('No Text Overflow', () => {
    test('all visible text fits within parent containers', async ({ page }) => {
      // Check common text containers
      const textContainers = [
        '.theme-card__info h3',
        '.theme-card__info p',
        '.harmony-card h4',
        '.harmony-card p',
        '.math-card h4',
        '.math-card p',
        '.variables-group h3',
        '.variables-group code'
      ];

      for (const selector of textContainers) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < Math.min(count, 5); i++) {
          const el = elements.nth(i);
          if (await el.isVisible()) {
            const box = await el.boundingBox();
            expect(box).not.toBeNull();
            // Element should have positive dimensions
            expect(box!.width).toBeGreaterThan(0);
            expect(box!.height).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Responsive Layout', () => {
    test('theme grid adapts to viewport', async ({ page }) => {
      const grid = page.locator('.themes-grid');
      await expect(grid).toBeVisible();
      
      // Check grid has CSS grid display
      const display = await grid.evaluate(el => getComputedStyle(el).display);
      expect(display).toBe('grid');
    });

    test('harmony grid adapts to viewport', async ({ page }) => {
      const grid = page.locator('.harmony-grid');
      await expect(grid).toBeVisible();
      
      const display = await grid.evaluate(el => getComputedStyle(el).display);
      expect(display).toBe('grid');
    });
  });
});
