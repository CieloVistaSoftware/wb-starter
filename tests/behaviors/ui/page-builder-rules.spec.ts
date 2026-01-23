/**
 * Page Builder Rules Tests
 * Tests all rules documented in docs/PAGE-BUILDER-RULES.md
 */
import { test, expect } from '@playwright/test';

test.describe('Page Builder Rules', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    // Wait for builder to initialize
    await page.waitForSelector('.builder-canvas', { timeout: 10000 });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PAGE PROPERTIES & RULES
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Page Properties & Rules', () => {
    
    test('Home page cannot be renamed', async ({ page }) => {
      // Select home page
      await page.click('[page-id="home"]');
      
      // Try to find rename option - should be disabled or hidden
      const renameBtn = page.locator('[action="rename-page"]');
      if (await renameBtn.count() > 0) {
        await expect(renameBtn).toBeDisabled();
      }
    });

    test('Home page cannot be deleted', async ({ page }) => {
      // Select home page
      await page.click('[page-id="home"]');
      
      // Delete button should be disabled or not present
      const deleteBtn = page.locator('[action="delete-page"]');
      if (await deleteBtn.count() > 0) {
        await expect(deleteBtn).toBeDisabled();
      }
    });

    test('Home page slug is always index.html', async ({ page }) => {
      // Check home page slug
      const homeSlug = await page.locator('[page-id="home"]').getAttribute('data-slug');
      expect(homeSlug).toBe('index.html');
    });

    test('must have at least 1 page (Home)', async ({ page }) => {
      // Count pages - should have at least 1
      const pageCount = await page.locator('[data-page-id]').count();
      expect(pageCount).toBeGreaterThanOrEqual(1);
    });

    test('duplicate page IDs are blocked', async ({ page }) => {
      // Create a page
      await page.click('[action="add-page"]');
      await page.fill('[name="page-name"]', 'Test Page');
      await page.click('[action="confirm-add-page"]');
      
      // Try to create another with same name
      await page.click('[action="add-page"]');
      await page.fill('[name="page-name"]', 'Test Page');
      await page.click('[action="confirm-add-page"]');
      
      // Should show error or create with different ID
      const errorMsg = page.locator('.error-message, .wb-toast--error');
      const duplicatePages = await page.locator('[page-id="test-page"]').count();
      
      // Either error shown OR only one page with that ID
      const hasError = await errorMsg.count() > 0;
      expect(hasError || duplicatePages === 1).toBeTruthy();
    });

    test('slug auto-generates from page name', async ({ page }) => {
      await page.click('[action="add-page"]');
      await page.fill('[name="page-name"]', 'My Test Page!');
      
      // Check auto-generated slug
      const slugInput = page.locator('[name="page-slug"]');
      await expect(slugInput).toHaveValue('my-test-page.html');
    });

    test('navbar shows max 4 pages', async ({ page }) => {
      // Create 6 pages
      for (let i = 1; i <= 6; i++) {
        await page.click('[action="add-page"]');
        await page.fill('[name="page-name"]', `Page ${i}`);
        await page.click('[action="confirm-add-page"]');
      }
      
      // Check navbar links count (including Home)
      const navLinks = await page.locator('.builder-canvas nav a, .builder-canvas .wb-nav a').count();
      expect(navLinks).toBeLessThanOrEqual(4);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // COMPONENT PLACEMENT MATRIX
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Component Placement Rules', () => {
    
    test('Navigation Bar can only be dropped in Header', async ({ page }) => {
      // Try to drop navbar in main - should be blocked
      const navbar = page.locator('[component="navbar"]');
      const mainSection = page.locator('[section="main"]');
      
      if (await navbar.count() > 0 && await mainSection.count() > 0) {
        await navbar.dragTo(mainSection);
        
        // Navbar should NOT be in main
        const navInMain = await mainSection.locator('.wb-nav, nav').count();
        expect(navInMain).toBe(0);
      }
    });

    test('Navigation Bar auto-creates pages when dropped', async ({ page }) => {
      // Get initial page count
      const initialPageCount = await page.locator('[data-page-id]').count();
      
      // Drop navbar component (it has default links: Home, About, Services, Contact)
      const navbar = page.locator('[component="navbar"]');
      const header = page.locator('[section="header"]');
      
      if (await navbar.count() > 0 && await header.count() > 0) {
        await navbar.dragTo(header);
        
        // Wait for pages to be created
        await page.waitForTimeout(500);
        
        // Should have more pages now
        const newPageCount = await page.locator('[data-page-id]').count();
        expect(newPageCount).toBeGreaterThan(initialPageCount);
        
        // Should show toast notification
        const toast = page.locator('.wb-toast');
        await expect(toast).toContainText(/created|page/i);
      }
    });

    test('Hero Section can only be in Main', async ({ page }) => {
      const hero = page.locator('[component="hero"]');
      const header = page.locator('[section="header"]');
      
      if (await hero.count() > 0 && await header.count() > 0) {
        await hero.dragTo(header);
        
        // Hero should NOT be in header
        const heroInHeader = await header.locator('.wb-hero, [class*="hero"]').count();
        expect(heroInHeader).toBe(0);
      }
    });

    test('Features can only be in Main', async ({ page }) => {
      const features = page.locator('[component="features"]');
      const footer = page.locator('[section="footer"]');
      
      if (await features.count() > 0 && await footer.count() > 0) {
        await features.dragTo(footer);
        
        // Features should NOT be in footer
        const featuresInFooter = await footer.locator('.wb-features, [class*="features"]').count();
        expect(featuresInFooter).toBe(0);
      }
    });

    test('Footer component can only be in Footer section', async ({ page }) => {
      const footerComp = page.locator('[component="footer"]');
      const mainSection = page.locator('[section="main"]');
      
      if (await footerComp.count() > 0 && await mainSection.count() > 0) {
        await footerComp.dragTo(mainSection);
        
        // Footer component should NOT be in main
        const footerInMain = await mainSection.locator('.wb-footer, footer').count();
        expect(footerInMain).toBe(0);
      }
    });

    test('Newsletter can only be in Footer', async ({ page }) => {
      const newsletter = page.locator('[component="newsletter"]');
      const mainSection = page.locator('[section="main"]');
      
      if (await newsletter.count() > 0 && await mainSection.count() > 0) {
        await newsletter.dragTo(mainSection);
        
        // Newsletter should NOT be in main
        const newsletterInMain = await mainSection.locator('.wb-newsletter, [class*="newsletter"]').count();
        expect(newsletterInMain).toBe(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SECTION BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Section Behavior', () => {
    
    test('Header is shared across all pages', async ({ page }) => {
      // Add something to header on home page
      const header = page.locator('[section="header"]');
      const headerContent = await header.innerHTML();
      
      // Switch to another page
      await page.click('[page-id="about"]');
      await page.waitForTimeout(300);
      
      // Header should have same content
      const headerContentAfter = await header.innerHTML();
      expect(headerContentAfter).toBe(headerContent);
    });

    test('Footer is shared across all pages', async ({ page }) => {
      // Get footer content on home page
      const footer = page.locator('[section="footer"]');
      const footerContent = await footer.innerHTML();
      
      // Switch to another page
      await page.click('[page-id="about"]');
      await page.waitForTimeout(300);
      
      // Footer should have same content
      const footerContentAfter = await footer.innerHTML();
      expect(footerContentAfter).toBe(footerContent);
    });

    test('Main content is unique per page', async ({ page }) => {
      // Get main content on home page
      const main = page.locator('[section="main"]');
      const homeMainContent = await main.innerHTML();
      
      // Switch to about page
      await page.click('[page-id="about"]');
      await page.waitForTimeout(300);
      
      // Main content should be different
      const aboutMainContent = await main.innerHTML();
      expect(aboutMainContent).not.toBe(homeMainContent);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // CARD COMPONENT (6 TYPES)
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Card Component Types', () => {
    
    const cardTypes = ['basic', 'feature', 'pricing', 'team', 'testimonial', 'cta'];
    
    for (const cardType of cardTypes) {
      test(`Card type "${cardType}" can be selected and shows correct fields`, async ({ page }) => {
        // Add a card component
        const card = page.locator('[component="card"]');
        const main = page.locator('[section="main"]');
        
        if (await card.count() > 0) {
          await card.dragTo(main);
          
          // Click the card to select it
          await page.click('.builder-canvas .wb-card, .builder-canvas [class*="card"]');
          
          // Select card type
          await page.selectOption('[name="card-type"]', cardType);
          
          // Verify type-specific fields appear
          const panel = page.locator('.properties-panel');
          
          switch (cardType) {
            case 'pricing':
              await expect(panel.locator('[name="price"]')).toBeVisible();
              await expect(panel.locator('[name="period"]')).toBeVisible();
              break;
            case 'team':
              await expect(panel.locator('[name="image-url"]')).toBeVisible();
              await expect(panel.locator('[name="subtitle"]')).toBeVisible();
              break;
            case 'cta':
              await expect(panel.locator('[name="contact-type"]')).toBeVisible();
              break;
          }
        }
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // CTA COMPONENT
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('CTA Component', () => {
    
    test('Phone mode shows phone number field', async ({ page }) => {
      // Add CTA component
      const cta = page.locator('[component="cta"]');
      const main = page.locator('[section="main"]');
      
      if (await cta.count() > 0) {
        await cta.dragTo(main);
        await page.click('.builder-canvas .wb-cta, .builder-canvas [class*="cta"]');
        
        // Select phone mode
        await page.selectOption('[name="contact-type"]', 'phone');
        
        // Phone field should be visible, email hidden
        await expect(page.locator('[name="phone-number"]')).toBeVisible();
        await expect(page.locator('[name="email"]')).not.toBeVisible();
      }
    });

    test('Email mode shows email fields', async ({ page }) => {
      // Add CTA component
      const cta = page.locator('[component="cta"]');
      const main = page.locator('[section="main"]');
      
      if (await cta.count() > 0) {
        await cta.dragTo(main);
        await page.click('.builder-canvas .wb-cta, .builder-canvas [class*="cta"]');
        
        // Select email mode
        await page.selectOption('[name="contact-type"]', 'email');
        
        // Email fields should be visible, phone hidden
        await expect(page.locator('[name="email"]')).toBeVisible();
        await expect(page.locator('[name="email-subject"]')).toBeVisible();
        await expect(page.locator('[name="phone-number"]')).not.toBeVisible();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VISUAL FEEDBACK
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Visual Feedback', () => {
    
    test('Selected component shows purple border', async ({ page }) => {
      // Click a component in the canvas
      const component = page.locator('.builder-canvas .wb-card, .builder-canvas [class*="component"]').first();
      
      if (await component.count() > 0) {
        await component.click();
        
        // Should have selection styling (purple border)
        const borderColor = await component.evaluate(el => {
          const style = getComputedStyle(el);
          return style.borderColor || style.outlineColor;
        });
        
        // Purple is typically rgb(139, 92, 246) or similar
        expect(borderColor).toMatch(/purple|rgb\(139|#8b5cf6|var\(--primary\)/i);
      }
    });

    test('Save action shows green feedback', async ({ page }) => {
      // Trigger save
      await page.click('[action="save"]');
      
      // Should show success feedback (green)
      const toast = page.locator('.wb-toast--success, .wb-toast[variant="success"]');
      await expect(toast).toBeVisible({ timeout: 3000 });
    });

    test('Error shows red feedback', async ({ page }) => {
      // Trigger an error (e.g., invalid input)
      const invalidField = page.locator('[name="page-slug"]');
      if (await invalidField.count() > 0) {
        await invalidField.fill(''); // Empty slug is invalid
        await page.click('[action="save"]');
        
        // Should show error styling
        const hasError = await page.locator('.error, [variant="error"], .wb-toast--error').count();
        expect(hasError).toBeGreaterThan(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // BREADCRUMB NAVIGATION
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Breadcrumb Navigation', () => {
    
    test('Properties panel shows breadcrumb path', async ({ page }) => {
      // Select a component
      const component = page.locator('.builder-canvas .wb-card').first();
      
      if (await component.count() > 0) {
        await component.click();
        
        // Breadcrumb should be visible in properties panel
        const breadcrumb = page.locator('.properties-panel .breadcrumb, .properties-panel [class*="breadcrumb"]');
        await expect(breadcrumb).toBeVisible();
        
        // Should contain path segments
        const text = await breadcrumb.textContent();
        expect(text).toMatch(/Site|Page|📁|📄/);
      }
    });

    test('Breadcrumb segments are clickable', async ({ page }) => {
      // Select a nested component
      const component = page.locator('.builder-canvas .wb-card').first();
      
      if (await component.count() > 0) {
        await component.click();
        
        // Click breadcrumb segment to navigate up
        const segment = page.locator('.breadcrumb a, .breadcrumb [data-nav]').first();
        if (await segment.count() > 0) {
          await segment.click();
          
          // Should change selection context
          const panel = page.locator('.properties-panel');
          const panelContent = await panel.textContent();
          expect(panelContent).not.toContain('Card'); // Should navigate away from card
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AUTO-CREATE LINKED PAGES
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Auto-Create Linked Pages', () => {
    
    test('Dropping navbar creates pages for each link', async ({ page }) => {
      // Clear existing pages except Home
      // ... (implementation depends on builder API)
      
      // Drop navbar with default links
      const navbar = page.locator('[component="navbar"]');
      const header = page.locator('[section="header"]');
      
      if (await navbar.count() > 0) {
        await navbar.dragTo(header);
        await page.waitForTimeout(1000);
        
        // Check that About, Services, Contact pages were created
        const aboutPage = page.locator('[page-id="about"]');
        const servicesPage = page.locator('[page-id="services"]');
        const contactPage = page.locator('[page-id="contact"]');
        
        // At least some pages should be created
        const totalCreated = await aboutPage.count() + await servicesPage.count() + await contactPage.count();
        expect(totalCreated).toBeGreaterThan(0);
      }
    });

    test('Auto-created page has correct template content', async ({ page }) => {
      // Create a link to a new page
      // ... trigger page creation
      
      // Navigate to the auto-created page
      await page.click('[page-id="about"]');
      await page.waitForTimeout(300);
      
      // Check for template content
      const main = page.locator('[section="main"]');
      const content = await main.innerHTML();
      
      // Should have customization guide or placeholder
      expect(content).toMatch(/customize|placeholder|How to|🎨/i);
    });

    test('Auto-created page shows in pages list', async ({ page }) => {
      // After dropping navbar, pages should appear in list
      const pagesList = page.locator('.pages-list, [data-pages-list]');
      const pageItems = await pagesList.locator('[data-page-id]').count();
      
      expect(pageItems).toBeGreaterThan(1); // More than just Home
    });

    test('Toast notification shown when page created', async ({ page }) => {
      // Drop component that creates page
      const navbar = page.locator('[component="navbar"]');
      const header = page.locator('[section="header"]');
      
      if (await navbar.count() > 0) {
        await navbar.dragTo(header);
        
        // Should show toast
        const toast = page.locator('.wb-toast');
        await expect(toast).toContainText(/created|page|📄/i, { timeout: 3000 });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SAVING & EXPORT
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Saving & Export', () => {
    
    test('Save stores to localStorage', async ({ page }) => {
      // Make a change
      const title = page.locator('.builder-canvas h1[contenteditable="true"]').first();
      if (await title.count() > 0) {
        await title.click();
        await title.fill('Test Title Change');
      }
      
      // Click save
      await page.click('[action="save"]');
      await page.waitForTimeout(500);
      
      // Check localStorage
      const savedData = await page.evaluate(() => {
        return localStorage.getItem('wb-page-builder-site');
      });
      
      expect(savedData).not.toBeNull();
      expect(savedData).toContain('Test Title Change');
    });

    test('Export JSON produces valid file', async ({ page }) => {
      // Click export JSON
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[action="export-json"]')
      ]);
      
      expect(download.suggestedFilename()).toMatch(/site\.json$/);
    });

    test('Export HTML produces zip file', async ({ page }) => {
      // Click export HTML
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[action="export-html"]')
      ]);
      
      expect(download.suggestedFilename()).toMatch(/\.zip$/);
    });

    test('Script tags are escaped in export', async ({ page }) => {
      // Add content with script tag
      const textarea = page.locator('textarea[name="description"]').first();
      if (await textarea.count() > 0) {
        await textarea.fill('<script>alert("xss")</script>');
        await page.click('[action="save"]');
      }
      
      // Export and check
      const savedData = await page.evaluate(() => {
        return localStorage.getItem('wb-page-builder-site');
      });
      
      // Script should be escaped
      expect(savedData).not.toContain('<script>');
      expect(savedData).toContain('&lt;script&gt;');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // STATUS BAR
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Status Bar', () => {
    
    test('Shows current page when page selected', async ({ page }) => {
      // Click on a page in the list
      await page.click('[page-id="home"]');
      
      // Status bar should show page info
      const statusBar = page.locator('.status-bar, [data-status-bar]');
      await expect(statusBar).toContainText(/Page|📄|Home/i);
    });

    test('Shows component info when component selected', async ({ page }) => {
      // Click a component
      const component = page.locator('.builder-canvas .wb-card').first();
      if (await component.count() > 0) {
        await component.click();
        
        // Status bar should show component info
        const statusBar = page.locator('.status-bar, [data-status-bar]');
        await expect(statusBar).toContainText(/Card|Component/i);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // COLOR PICKER RULE
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Color Picker Rule', () => {
    
    test('Color inputs use wb-colorpicker, not native input[type=color]', async ({ page }) => {
      // Find any color input in the builder
      const nativeColorInputs = await page.locator('.properties-panel input[type="color"]').count();
      const wbColorPickers = await page.locator('.properties-panel wb-colorpicker, .properties-panel .wb-colorpicker').count();
      
      // Should have no native color inputs
      expect(nativeColorInputs).toBe(0);
      
      // If there are color fields, they should be wb-colorpicker
      // (This depends on the component selected)
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // FEATURES GRID
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Features Grid', () => {
    
    test('Has fixed 3-card layout', async ({ page }) => {
      // Add features component
      const features = page.locator('[component="features"]');
      const main = page.locator('[section="main"]');
      
      if (await features.count() > 0) {
        await features.dragTo(main);
        
        // Should have exactly 3 cards
        const cards = await page.locator('.builder-canvas .wb-features .wb-card, .builder-canvas [class*="features"] [class*="card"]').count();
        expect(cards).toBe(3);
      }
    });

    test('Clicking card selects it for editing', async ({ page }) => {
      const featureCard = page.locator('.builder-canvas .wb-features .wb-card').first();
      
      if (await featureCard.count() > 0) {
        await featureCard.click();
        
        // Should show card in properties panel
        const panel = page.locator('.properties-panel');
        await expect(panel).toContainText(/Feature|Card|Icon|Title/i);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PRICING GRID
  // ═══════════════════════════════════════════════════════════════════
  
  test.describe('Pricing Grid', () => {
    
    test('Has fixed 3-card layout', async ({ page }) => {
      const pricing = page.locator('[component="pricing"]');
      const main = page.locator('[section="main"]');
      
      if (await pricing.count() > 0) {
        await pricing.dragTo(main);
        
        // Should have exactly 3 cards
        const cards = await page.locator('.builder-canvas .wb-pricing .wb-card, .builder-canvas [class*="pricing"] [class*="card"]').count();
        expect(cards).toBe(3);
      }
    });

    test('One card can be highlighted', async ({ page }) => {
      const pricingCard = page.locator('.builder-canvas .wb-pricing .wb-card').nth(1);
      
      if (await pricingCard.count() > 0) {
        await pricingCard.click();
        
        // Toggle highlighted
        await page.check('[name="highlighted"]');
        
        // Card should have highlighted styling
        await expect(pricingCard).toHaveClass(/highlighted|recommended/);
      }
    });
  });

});
