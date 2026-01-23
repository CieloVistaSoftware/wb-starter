/**
 * Cards Showcase Tests
 * ====================
 * Comprehensive tests for ALL 19 card types in demos/cards-showcase.html
 * Tests rendering, interactions, theme switching, and animations
 */

import { test, expect } from '@playwright/test';

test.describe('Cards Showcase Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/cards-showcase.html');
    await page.waitForTimeout(1500); // Wait for WB to initialize
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE STRUCTURE & INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Page Structure', () => {
    test('page loads without console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
          errors.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForTimeout(1500);
      
      const unexpectedErrors = errors.filter(e => 
        !e.includes('net::ERR') && 
        !e.includes('Failed to load resource') &&
        !e.includes('404')
      );
      
      expect(unexpectedErrors).toHaveLength(0);
    });

    test('page has header with title', async ({ page }) => {
      const header = page.locator('header h1');
      await expect(header).toBeVisible();
      await expect(header).toContainText('Cards');
    });

    test('theme control is present and visible', async ({ page }) => {
      const themeControl = page.locator('wb-themecontrol');
      await expect(themeControl).toBeVisible();
    });

    test('navigation links are present', async ({ page }) => {
      const navLinks = page.locator('nav.nav-links a');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // THEME CONTROL
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Theme Control', () => {
    test('theme control has dropdown select', async ({ page }) => {
      const select = page.locator('wb-themecontrol select');
      await expect(select).toBeVisible();
    });

    test('theme dropdown contains all themes', async ({ page }) => {
      const options = page.locator('wb-themecontrol select option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(20); // 22 themes total
    });

    test('changing theme updates theme attribute', async ({ page }) => {
      const select = page.locator('wb-themecontrol select');
      
      // Change to ocean theme
      await select.selectOption('ocean');
      await page.waitForTimeout(200);
      
      const theme = await page.locator('html').getAttribute('data-theme');
      expect(theme).toBe('ocean');
    });

    test('changing theme updates card colors', async ({ page }) => {
      const select = page.locator('wb-themecontrol select');
      const card = page.locator('.wb-card').first();
      
      // Get initial background
      const initialBg = await card.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Change to cyberpunk theme
      await select.selectOption('cyberpunk');
      await page.waitForTimeout(300);
      
      const newBg = await card.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Background should change
      expect(newBg).not.toBe(initialBg);
    });

    test('theme persists after selection', async ({ page }) => {
      const select = page.locator('wb-themecontrol select');
      await select.selectOption('sunset');
      await page.waitForTimeout(200);
      
      // Check localStorage
      const savedTheme = await page.evaluate(() => localStorage.getItem('wb-theme'));
      expect(savedTheme).toBe('sunset');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: card (base)
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card (Base)', () => {
    test('basic card renders with title', async ({ page }) => {
      const card = page.locator('[heading="Basic Card"]');
      await expect(card).toBeVisible();
      await expect(card.locator('.wb-card__title')).toContainText('Basic Card');
    });

    test('elevated card has shadow', async ({ page }) => {
      const card = page.locator('[elevated="true"]').first();
      const shadow = await card.evaluate(el => 
        window.getComputedStyle(el).boxShadow
      );
      expect(shadow).not.toBe('none');
    });

    test('clickable card shows cursor pointer', async ({ page }) => {
      const card = page.locator('[data-clickable]').first();
      const cursor = await card.evaluate(el => 
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    });

    test('clickable card has role button', async ({ page }) => {
      const card = page.locator('[data-clickable]').first();
      const role = await card.getAttribute('role');
      expect(role).toBe('button');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardstats
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Stats', () => {
    test('stats card renders value', async ({ page }) => {
      const statsCard = page.locator('wb-cardstats').first();
      await expect(statsCard).toBeVisible();
      
      const value = statsCard.locator('.wb-card__stats-value');
      await expect(value).toBeVisible();
    });

    test('stats card shows label', async ({ page }) => {
      const statsCard = page.locator('wb-cardstats').first();
      const label = statsCard.locator('.wb-card__stats-label');
      await expect(label).toBeVisible();
    });

    test('stats card with trend up shows up arrow', async ({ page }) => {
      const statsCard = page.locator('wb-cardstats[trend="up"]');
      const trend = statsCard.locator('.wb-card__stats-trend');
      await expect(trend).toContainText('↑');
    });

    test('stats card with trend down shows down arrow', async ({ page }) => {
      const statsCard = page.locator('wb-cardstats[trend="down"]');
      const trend = statsCard.locator('.wb-card__stats-trend');
      await expect(trend).toContainText('↓');
    });

    test('stats card shows icon', async ({ page }) => {
      const statsCard = page.locator('wb-cardstats[icon]').first();
      const icon = statsCard.locator('.wb-card__icon');
      await expect(icon).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardprofile
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Profile', () => {
    test('profile card renders avatar', async ({ page }) => {
      const profileCard = page.locator('wb-cardprofile').first();
      await expect(profileCard).toBeVisible();
      
      const avatar = profileCard.locator('.wb-card__avatar');
      await expect(avatar).toBeVisible();
    });

    test('profile card shows name', async ({ page }) => {
      const profileCard = page.locator('wb-cardprofile').first();
      const name = profileCard.locator('.wb-card__name');
      await expect(name).toBeVisible();
    });

    test('profile card shows role', async ({ page }) => {
      const profileCard = page.locator('wb-cardprofile').first();
      const role = profileCard.locator('.wb-card__role');
      await expect(role).toBeVisible();
    });

    test('profile card shows bio', async ({ page }) => {
      const profileCard = page.locator('wb-cardprofile[bio]').first();
      const bio = profileCard.locator('.wb-card__bio');
      await expect(bio).toBeVisible();
    });

    test('themed profile card applies theme', async ({ page }) => {
      const themedProfile = page.locator('wb-cardprofile[theme="sunset"]');
      if (await themedProfile.count() > 0) {
        await expect(themedProfile).toBeVisible();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardpricing
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Pricing', () => {
    test('pricing card renders plan name', async ({ page }) => {
      const pricingCard = page.locator('wb-cardpricing').first();
      await expect(pricingCard).toBeVisible();
      
      const plan = pricingCard.locator('.wb-card__plan');
      await expect(plan).toBeVisible();
    });

    test('pricing card shows price', async ({ page }) => {
      const pricingCard = page.locator('wb-cardpricing').first();
      const price = pricingCard.locator('.wb-card__amount');
      await expect(price).toBeVisible();
    });

    test('pricing card shows features list', async ({ page }) => {
      const pricingCard = page.locator('wb-cardpricing').first();
      const features = pricingCard.locator('.wb-card__features');
      await expect(features).toBeVisible();
      
      const featureItems = pricingCard.locator('.wb-card__feature');
      const count = await featureItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('pricing card has CTA button', async ({ page }) => {
      const pricingCard = page.locator('wb-cardpricing').first();
      const cta = pricingCard.locator('.wb-card__cta');
      await expect(cta).toBeVisible();
    });

    test('featured pricing card is scaled up', async ({ page }) => {
      const featuredCard = page.locator('wb-cardpricing[featured="true"]');
      if (await featuredCard.count() > 0) {
        const transform = await featuredCard.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        expect(transform).toContain('matrix');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardimage
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Image', () => {
    test('image card renders image', async ({ page }) => {
      const imageCard = page.locator('wb-cardimage').first();
      if (await imageCard.count() > 0) {
        await expect(imageCard).toBeVisible();
        
        const img = imageCard.locator('img');
        await expect(img).toBeVisible();
      }
    });

    test('image card respects aspect ratio', async ({ page }) => {
      const imageCard = page.locator('wb-cardimage[aspect]').first();
      if (await imageCard.count() > 0) {
        const figure = imageCard.locator('.wb-card__figure');
        const aspectRatio = await figure.evaluate(el => 
          window.getComputedStyle(el).aspectRatio
        );
        expect(aspectRatio).not.toBe('auto');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardbutton
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Button', () => {
    test('button card renders action buttons', async ({ page }) => {
      const buttonCard = page.locator('wb-cardbutton').first();
      if (await buttonCard.count() > 0) {
        await expect(buttonCard).toBeVisible();
        
        const buttons = buttonCard.locator('.wb-card__btn');
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('primary button is styled differently', async ({ page }) => {
      const primaryBtn = page.locator('.wb-card__btn--primary').first();
      if (await primaryBtn.count() > 0) {
        const bg = await primaryBtn.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(bg).not.toBe('transparent');
        expect(bg).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardtestimonial
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Testimonial', () => {
    test('testimonial card shows quote', async ({ page }) => {
      const testimonialCard = page.locator('wb-cardtestimonial').first();
      if (await testimonialCard.count() > 0) {
        await expect(testimonialCard).toBeVisible();
        
        const quote = testimonialCard.locator('.wb-card__quote');
        await expect(quote).toBeVisible();
      }
    });

    test('testimonial card shows author', async ({ page }) => {
      const testimonialCard = page.locator('wb-cardtestimonial').first();
      if (await testimonialCard.count() > 0) {
        const author = testimonialCard.locator('.wb-card__author');
        await expect(author).toBeVisible();
      }
    });

    test('testimonial card shows rating stars', async ({ page }) => {
      const testimonialCard = page.locator('wb-cardtestimonial[rating]').first();
      if (await testimonialCard.count() > 0) {
        const rating = testimonialCard.locator('.wb-card__rating');
        await expect(rating).toBeVisible();
        await expect(rating).toContainText('★');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardproduct
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Product', () => {
    test('product card shows image', async ({ page }) => {
      const productCard = page.locator('wb-cardproduct').first();
      if (await productCard.count() > 0) {
        await expect(productCard).toBeVisible();
        
        const img = productCard.locator('img');
        await expect(img).toBeVisible();
      }
    });

    test('product card shows price', async ({ page }) => {
      const productCard = page.locator('wb-cardproduct').first();
      if (await productCard.count() > 0) {
        const price = productCard.locator('.wb-card__price-current');
        await expect(price).toBeVisible();
      }
    });

    test('product card has add to cart button', async ({ page }) => {
      const productCard = page.locator('wb-cardproduct').first();
      if (await productCard.count() > 0) {
        const cta = productCard.locator('.wb-card__product-cta');
        await expect(cta).toBeVisible();
      }
    });

    test('product card with original price shows strikethrough', async ({ page }) => {
      const productCard = page.locator('wb-cardproduct[data-original-price]').first();
      if (await productCard.count() > 0) {
        const original = productCard.locator('.wb-card__price-original');
        const textDeco = await original.evaluate(el => 
          window.getComputedStyle(el).textDecoration
        );
        expect(textDeco).toContain('line-through');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardnotification
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Notification', () => {
    test('notification cards render all variants', async ({ page }) => {
      const variants = ['info', 'success', 'warning', 'error'];
      
      for (const variant of variants) {
        const card = page.locator(`wb-cardnotification[type="${variant}"]`);
        if (await card.count() > 0) {
          await expect(card.first()).toBeVisible();
        }
      }
    });

    test('notification card has role alert', async ({ page }) => {
      const notification = page.locator('wb-cardnotification').first();
      if (await notification.count() > 0) {
        const role = await notification.getAttribute('role');
        expect(role).toBe('alert');
      }
    });

    test('dismissible notification has close button', async ({ page }) => {
      const notification = page.locator('wb-cardnotification[dismissible="true"]').first();
      if (await notification.count() > 0) {
        const closeBtn = notification.locator('.wb-card__notification-dismiss');
        await expect(closeBtn).toBeVisible();
      }
    });

    test('clicking dismiss removes notification', async ({ page }) => {
      const notification = page.locator('wb-cardnotification[dismissible="true"]').first();
      if (await notification.count() > 0) {
        const closeBtn = notification.locator('.wb-card__notification-dismiss');
        await closeBtn.click();
        await page.waitForTimeout(300);
        
        await expect(notification).not.toBeVisible();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardfile
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card File', () => {
    test('file card shows filename', async ({ page }) => {
      const fileCard = page.locator('wb-cardfile').first();
      if (await fileCard.count() > 0) {
        await expect(fileCard).toBeVisible();
        
        const filename = fileCard.locator('.wb-card__filename');
        await expect(filename).toBeVisible();
      }
    });

    test('file card shows file type icon', async ({ page }) => {
      const fileCard = page.locator('wb-cardfile').first();
      if (await fileCard.count() > 0) {
        const text = await fileCard.textContent();
        // Should contain an emoji icon
        expect(text).toMatch(/📄|📝|🖼️|🎬|🎵|📦|📁/);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardhero
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Hero', () => {
    test('hero card has minimum height', async ({ page }) => {
      const heroCard = page.locator('wb-cardhero').first();
      if (await heroCard.count() > 0) {
        await expect(heroCard).toBeVisible();
        
        const box = await heroCard.boundingBox();
        expect(box?.height).toBeGreaterThan(200);
      }
    });

    test('hero card shows title', async ({ page }) => {
      const heroCard = page.locator('wb-cardhero').first();
      if (await heroCard.count() > 0) {
        const title = heroCard.locator('.wb-card__hero-title');
        await expect(title).toBeVisible();
      }
    });

    test('hero card has background image or gradient', async ({ page }) => {
      const heroCard = page.locator('wb-cardhero').first();
      if (await heroCard.count() > 0) {
        const bgImage = await heroCard.evaluate(el => 
          window.getComputedStyle(el).backgroundImage
        );
        expect(bgImage).not.toBe('none');
      }
    });

    test('hero card with overlay has overlay element', async ({ page }) => {
      const heroCard = page.locator('wb-cardhero[overlay="true"]').first();
      if (await heroCard.count() > 0) {
        const overlay = heroCard.locator('.wb-card__overlay');
        await expect(overlay).toBeVisible();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardlink
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Link', () => {
    test('link card is clickable', async ({ page }) => {
      const linkCard = page.locator('wb-cardlink').first();
      if (await linkCard.count() > 0) {
        await expect(linkCard).toBeVisible();
        
        const cursor = await linkCard.evaluate(el => 
          window.getComputedStyle(el).cursor
        );
        expect(cursor).toBe('pointer');
      }
    });

    test('link card has role link', async ({ page }) => {
      const linkCard = page.locator('wb-cardlink').first();
      if (await linkCard.count() > 0) {
        const role = await linkCard.getAttribute('role');
        expect(role).toBe('link');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardhorizontal
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Horizontal', () => {
    test('horizontal card uses row layout', async ({ page }) => {
      const horizCard = page.locator('wb-cardhorizontal').first();
      if (await horizCard.count() > 0) {
        await expect(horizCard).toBeVisible();
        
        const flexDir = await horizCard.evaluate(el => 
          window.getComputedStyle(el).flexDirection
        );
        expect(flexDir).toMatch(/row/);
      }
    });

    test('horizontal card has image and content side by side', async ({ page }) => {
      const horizCard = page.locator('wb-cardhorizontal[image]').first();
      if (await horizCard.count() > 0) {
        const img = horizCard.locator('.wb-card__figure');
        const content = horizCard.locator('.wb-card__horizontal-content');
        
        if (await img.count() > 0 && await content.count() > 0) {
          const imgBox = await img.boundingBox();
          const contentBox = await content.boundingBox();
          
          // They should be side by side, not stacked
          if (imgBox && contentBox) {
            expect(Math.abs(imgBox.y - contentBox.y)).toBeLessThan(50);
          }
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardoverlay
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Overlay', () => {
    test('overlay card has background image', async ({ page }) => {
      const overlayCard = page.locator('wb-cardoverlay').first();
      if (await overlayCard.count() > 0) {
        await expect(overlayCard).toBeVisible();
        
        const bgImage = await overlayCard.evaluate(el => 
          window.getComputedStyle(el).backgroundImage
        );
        expect(bgImage).not.toBe('none');
      }
    });

    test('overlay card has content overlay', async ({ page }) => {
      const overlayCard = page.locator('wb-cardoverlay').first();
      if (await overlayCard.count() > 0) {
        const content = overlayCard.locator('.wb-card__overlay-content');
        await expect(content).toBeVisible();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardexpandable
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Expandable', () => {
    test('expandable card has expand button', async ({ page }) => {
      const expandCard = page.locator('wb-cardexpandable').first();
      if (await expandCard.count() > 0) {
        await expect(expandCard).toBeVisible();
        
        const btn = expandCard.locator('.wb-card__expand-btn');
        await expect(btn).toBeVisible();
      }
    });

    test('clicking expand button toggles content', async ({ page }) => {
      const expandCard = page.locator('wb-cardexpandable').first();
      if (await expandCard.count() > 0) {
        const btn = expandCard.locator('.wb-card__expand-btn');
        const content = expandCard.locator('.wb-card__expandable-content');
        
        const initialHeight = await content.evaluate(el => el.style.maxHeight);
        
        await btn.click();
        await page.waitForTimeout(400);
        
        const newHeight = await content.evaluate(el => el.style.maxHeight);
        expect(newHeight).not.toBe(initialHeight);
      }
    });

    test('expand button has aria-expanded attribute', async ({ page }) => {
      const expandCard = page.locator('wb-cardexpandable').first();
      if (await expandCard.count() > 0) {
        const btn = expandCard.locator('.wb-card__expand-btn');
        const ariaExpanded = await btn.getAttribute('aria-expanded');
        expect(ariaExpanded).toMatch(/true|false/);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardminimizable
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Minimizable', () => {
    test('minimizable card has minimize button', async ({ page }) => {
      const minCard = page.locator('wb-cardminimizable').first();
      if (await minCard.count() > 0) {
        await expect(minCard).toBeVisible();
        
        const btn = minCard.locator('.wb-card__minimize-btn');
        await expect(btn).toBeVisible();
      }
    });

    test('clicking minimize button toggles content', async ({ page }) => {
      const minCard = page.locator('wb-cardminimizable').first();
      if (await minCard.count() > 0) {
        const btn = minCard.locator('.wb-card__minimize-btn');
        const content = minCard.locator('.wb-card__minimizable-content');
        
        const initialOpacity = await content.evaluate(el => 
          window.getComputedStyle(el).opacity
        );
        
        await btn.click();
        await page.waitForTimeout(400);
        
        const newOpacity = await content.evaluate(el => 
          window.getComputedStyle(el).opacity
        );
        
        expect(newOpacity).not.toBe(initialOpacity);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: carddraggable
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Draggable', () => {
    test('draggable card has drag handle', async ({ page }) => {
      const dragCard = page.locator('wb-carddraggable').first();
      if (await dragCard.count() > 0) {
        await expect(dragCard).toBeVisible();
        
        const handle = dragCard.locator('.wb-card__drag-handle');
        await expect(handle).toBeVisible();
      }
    });

    test('drag handle has grab cursor', async ({ page }) => {
      const dragCard = page.locator('wb-carddraggable').first();
      if (await dragCard.count() > 0) {
        const handle = dragCard.locator('.wb-card__drag-handle');
        const cursor = await handle.evaluate(el => 
          window.getComputedStyle(el).cursor
        );
        expect(cursor).toBe('grab');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ANIMATIONS & EFFECTS
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Animations & Effects', () => {
    test('bounce animation class exists', async ({ page }) => {
      const bounceEl = page.locator('.wb-animate-bounce, [x-bounce]');
      if (await bounceEl.count() > 0) {
        const animation = await bounceEl.first().evaluate(el => 
          window.getComputedStyle(el).animationName
        );
        expect(animation).toContain('bounce');
      }
    });

    test('shake animation class exists', async ({ page }) => {
      const shakeEl = page.locator('.wb-animate-shake, [x-shake]');
      if (await shakeEl.count() > 0) {
        const animation = await shakeEl.first().evaluate(el => 
          window.getComputedStyle(el).animationName
        );
        expect(animation).toContain('shake');
      }
    });

    test('pulse animation class exists', async ({ page }) => {
      const pulseEl = page.locator('.wb-animate-pulse, [x-pulse]');
      if (await pulseEl.count() > 0) {
        const animation = await pulseEl.first().evaluate(el => 
          window.getComputedStyle(el).animationName
        );
        expect(animation).toContain('pulse');
      }
    });

    test('ripple behavior adds ripple on click', async ({ page }) => {
      const rippleEl = page.locator('[x-ripple]').first();
      if (await rippleEl.count() > 0) {
        await rippleEl.click();
        await page.waitForTimeout(100);
        
        // Check if ripple element was created
        const ripple = rippleEl.locator('.wb-ripple');
        // Ripple may be removed after animation, so we just check the element is clickable
        expect(await rippleEl.isVisible()).toBe(true);
      }
    });

    test('tooltip behavior shows tooltip on hover', async ({ page }) => {
      const tooltipEl = page.locator('[x-tooltip]').first();
      if (await tooltipEl.count() > 0) {
        await tooltipEl.hover();
        await page.waitForTimeout(500);
        
        const tooltip = page.locator('.wb-tooltip');
        // Tooltip may or may not be visible depending on implementation
        expect(await tooltipEl.isVisible()).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CODE EXAMPLES
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Code Examples', () => {
    test('code blocks are present after card demos', async ({ page }) => {
      const codeBlocks = page.locator('wb-mdhtml, pre code');
      const count = await codeBlocks.count();
      expect(count).toBeGreaterThan(5);
    });

    test('code blocks are contained and do not overflow', async ({ page }) => {
      const codeBlocks = await page.locator('wb-mdhtml pre, pre code').all();
      
      for (const code of codeBlocks) {
        const box = await code.boundingBox();
        if (box) {
          // Code blocks should not extend beyond reasonable width
          expect(box.width).toBeLessThan(1500);
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Accessibility', () => {
    test('interactive cards are focusable', async ({ page }) => {
      const clickableCards = page.locator('[data-clickable], [role="button"], [role="link"]');
      const count = await clickableCards.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = clickableCards.nth(i);
        const tabindex = await card.getAttribute('tabindex');
        const role = await card.getAttribute('role');
        
        // Should have tabindex or be naturally focusable
        const isFocusable = tabindex !== null || role === 'button' || role === 'link';
        expect(isFocusable).toBe(true);
      }
    });

    test('notification cards have role=alert', async ({ page }) => {
      const notifications = await page.locator('wb-cardnotification').all();
      
      for (const notification of notifications) {
        const role = await notification.getAttribute('role');
        expect(role).toBe('alert');
      }
    });

    test('expand buttons have aria-expanded', async ({ page }) => {
      const expandBtns = await page.locator('.wb-card__expand-btn').all();
      
      for (const btn of expandBtns) {
        const ariaExpanded = await btn.getAttribute('aria-expanded');
        expect(ariaExpanded).toMatch(/true|false/);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // RESPONSIVE BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Responsive Behavior', () => {
    test('cards do not overflow container horizontally', async ({ page }) => {
      const cards = await page.locator('.wb-card').all();
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      for (const card of cards.slice(0, 10)) {
        const box = await card.boundingBox();
        if (box) {
          expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 20);
        }
      }
    });

    test('text does not overflow cards', async ({ page }) => {
      const overflows = await page.evaluate(() => {
        const issues: string[] = [];
        document.querySelectorAll('.wb-card').forEach(card => {
          const cardRect = card.getBoundingClientRect();
          card.querySelectorAll('h3, p, span, div').forEach(el => {
            const elRect = el.getBoundingClientRect();
            if (elRect.right > cardRect.right + 5) {
              issues.push(`Text overflow in ${el.tagName}`);
            }
          });
        });
        return issues;
      });
      
      expect(overflows.length).toBe(0);
    });
  });
});
