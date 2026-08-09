/**
 * Card Styling Standards Tests
 * ============================
 * Verifies cards have proper padding and elevated cards are lighter
 */

import { test, expect } from '@playwright/test';

test.describe('Card Styling Standards', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/cards-showcase.html');
    await page.waitForTimeout(1500);
  });

  test('elevated cards have LIGHTER background than base cards', async ({ page }) => {
    // Get a base card background
    const baseCard = page.locator('article.wb-card:not(.wb-card--elevated)').first();
    const elevatedCard = page.locator('[data-elevated="true"]').first();
    
    await expect(baseCard).toBeVisible();
    await expect(elevatedCard).toBeVisible();
    
    const baseBg = await baseCard.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });
    
    const elevatedBg = await elevatedCard.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });
    
    // Parse RGB values
    const parseRgb = (color: string) => {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return { r: 0, g: 0, b: 0 };
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    };
    
    const baseRgb = parseRgb(baseBg);
    const elevatedRgb = parseRgb(elevatedBg);
    
    // Calculate luminance (perceived brightness)
    const luminance = (rgb: { r: number, g: number, b: number }) => 
      0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    
    const baseLum = luminance(baseRgb);
    const elevatedLum = luminance(elevatedRgb);
    
    console.log(`Base card: ${baseBg} (luminance: ${baseLum})`);
    console.log(`Elevated card: ${elevatedBg} (luminance: ${elevatedLum})`);
    
    // Elevated card should be LIGHTER (higher luminance) in dark mode
    expect(elevatedLum).toBeGreaterThan(baseLum);
  });

  test('all cards have at least 1rem (16px) content padding', async ({ page }) => {
    const cards = await page.locator('.wb-card').all();
    expect(cards.length).toBeGreaterThan(0);
    
    const failures: string[] = [];
    
    for (let i = 0; i < Math.min(cards.length, 20); i++) {
      const card = cards[i];
      const cardTag = await card.evaluate(el => el.tagName.toLowerCase());
      const cardTitle = await card.getAttribute('data-title') || 
                        await card.getAttribute('title') || 
                        await card.getAttribute('data-value') ||
                        `${cardTag}-${i}`;
      
      const hasSufficientPadding = await card.evaluate(el => {
        const computed = window.getComputedStyle(el);
        const cardPadding = parseFloat(computed.paddingLeft);
        
        // Card itself has padding
        if (cardPadding >= 14) return true; // Allow slight variance from 16px
        
        // Or internal containers have padding
        const containers = [
          '.wb-card__header',
          '.wb-card__main', 
          'main',
          'header',
          '[class*="content"]'
        ];
        
        for (const selector of containers) {
          const container = el.querySelector(selector);
          if (container) {
            const style = window.getComputedStyle(container);
            if (parseFloat(style.paddingLeft) >= 14) return true;
          }
        }
        
        return false;
      });
      
      if (!hasSufficientPadding) {
        failures.push(`${cardTag}[${cardTitle}]`);
      }
    }
    
    if (failures.length > 0) {
      console.log('Cards with insufficient padding:', failures);
    }
    
    expect(failures).toHaveLength(0);
  });

  test('wb-cardstats has proper internal padding', async ({ page }) => {
    const statsCard = page.locator('wb-cardstats').first();
    await expect(statsCard).toBeVisible();
    
    const padding = await statsCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        left: parseFloat(computed.paddingLeft),
        right: parseFloat(computed.paddingRight)
      };
    });
    
    expect(padding.left).toBeGreaterThanOrEqual(14);
    expect(padding.right).toBeGreaterThanOrEqual(14);
  });

  test('elevated cards have box-shadow', async ({ page }) => {
    const elevatedCard = page.locator('[data-elevated="true"]').first();
    await expect(elevatedCard).toBeVisible();
    
    const shadow = await elevatedCard.evaluate(el => {
      return window.getComputedStyle(el).boxShadow;
    });
    
    expect(shadow).not.toBe('none');
    expect(shadow).toContain('rgba');
  });

  test('text content does not touch card edges', async ({ page }) => {
    const issues = await page.evaluate(() => {
      const problems: string[] = [];
      
      document.querySelectorAll('.wb-card').forEach((card, idx) => {
        const cardRect = card.getBoundingClientRect();
        
        // Check first text element
        const textEl = card.querySelector('h1, h2, h3, h4, p, span');
        if (!textEl) return;
        
        const textRect = textEl.getBoundingClientRect();
        const leftGap = textRect.left - cardRect.left;
        
        // Text should have at least 12px gap from card edge
        if (leftGap < 12 && leftGap >= 0) {
          const title = card.getAttribute('data-title') || card.tagName;
          problems.push(`${title}: only ${leftGap.toFixed(1)}px left gap`);
        }
      });
      
      return problems;
    });
    
    if (issues.length > 0) {
      console.log('Text touching card edges:', issues);
    }
    
    expect(issues).toHaveLength(0);
  });
});
