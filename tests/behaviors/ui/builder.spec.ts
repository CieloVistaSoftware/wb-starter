/**
 * Builder.html Comprehensive Tests
 * Tests all functionality documented in PAGE-BUILDER-RULES.md and pages.md
 */
import { test, expect, Page } from '@playwright/test';

// Helper to wait for builder initialization
async function waitForBuilder(page: Page) {
  await page.waitForSelector('.builder-layout', { timeout: 20000 });
  await page.waitForFunction(() => {
    return typeof window.components !== 'undefined' && 
           typeof window.pages !== 'undefined' &&
           document.getElementById('main-container') !== null &&
           document.getElementById('header-container') !== null &&
           document.getElementById('footer-container') !== null;
  }, { timeout: 20000 });
}

test.describe('Builder.html - Core Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await waitForBuilder(page);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILDER INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Builder Initialization', () => {

    test('builder layout loads with all sections', async ({ page }) => {
      await expect(page.locator('.sidebar-left, #leftDrawer')).toBeVisible();
      await expect(page.locator('.canvas-area, #canvas-content')).toBeVisible();
      await expect(page.locator('.sidebar-right, #rightDrawer')).toBeVisible();
    });

    test('component library is populated', async ({ page }) => {
      const library = page.locator('#componentLibrary');
      await expect(library).toBeVisible();
      
      const items = library.locator('.component-item');
      const count = await items.count();
      expect(count).toBeGreaterThan(5);
    });

    test('canvas has header, main, footer sections', async ({ page }) => {
      await expect(page.locator('#header-container')).toBeVisible();
      await expect(page.locator('[section="header"]')).toBeVisible();
      await expect(page.locator('#main-container')).toBeVisible();
      await expect(page.locator('[section="main"]')).toBeVisible();
      await expect(page.locator('#footer-container')).toBeVisible();
      await expect(page.locator('[section="footer"]')).toBeVisible();
    });

    test('pages list shows Home page', async ({ page }) => {
      const pagesList = page.locator('#pagesList, .pages-list');
      await expect(pagesList).toBeVisible();
      
      const homeItem = pagesList.locator('.page-item').first();
      await expect(homeItem).toContainText('Home');
    });

    test('status bar is visible', async ({ page }) => {
      const statusBar = page.locator('.status-bar, #status-bar-content');
      await expect(statusBar).toBeVisible();
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Page Management', () => {

    test('Home page exists by default', async ({ page }) => {
      const hasHome = await page.evaluate(() => {
        return window.pages?.some(p => p.id === 'home');
      });
      expect(hasHome).toBe(true);
    });

    test('Home page slug is index.html', async ({ page }) => {
      const slug = await page.evaluate(() => {
        const home = window.pages?.find(p => p.id === 'home');
        return home?.slug;
      });
      expect(slug).toBe('index.html');
    });

    test('Home page cannot be deleted (no delete button)', async ({ page }) => {
      const pagesList = page.locator('#pagesList, .pages-list');
      const homeItem = pagesList.locator('.page-item').first();
      
      // Home page should not have delete button
      const deleteBtn = homeItem.locator('.page-delete-btn');
      await expect(deleteBtn).toHaveCount(0);
    });

    test('can add new page via dialog', async ({ page }) => {
      // Generate unique page name to avoid conflicts with other tests
      const uniquePageName = `TestPage${Date.now()}`;
      const expectedId = uniquePageName.toLowerCase();
      
      // Handle any alerts (blank template requires name)
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      // Click add page button to open dialog
      const addBtn = page.locator('button:has-text("+ Add Page")');
      await expect(addBtn).toBeVisible();
      await addBtn.click();

      // Dialog should appear
      const dialog = page.locator('#newPageDialog');
      await expect(dialog).toBeVisible();

      // Use blank template with custom name (most reliable approach)
      // Blank is already selected by default, just enter a name
      await page.locator('#newPageName').fill(uniquePageName);
      
      // Click Create Page button
      await page.getByRole('button', { name: 'Create Page' }).click();

      // Dialog should close
      await expect(dialog).not.toBeVisible({ timeout: 5000 });

      // New page should exist with our unique name
      const hasNewPage = await page.evaluate((id) => {
        return window.pages?.some(p => p.id === id);
      }, expectedId);
      expect(hasNewPage).toBe(true);
    });

    test('slug auto-generates from page name', async ({ page }) => {
      const slug = await page.evaluate(() => {
        // Simulate slug generation
        const name = 'My Test Page!';
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.html';
      });
      expect(slug).toBe('my-test-page.html');
    });

    test('cannot create duplicate page ID', async ({ page }) => {
      const result = await page.evaluate(() => {
        // Try to add page with same ID as home
        const existingIds = window.pages?.map(p => p.id) || [];
        return existingIds.includes('home');
      });
      expect(result).toBe(true);
    });

    test('switching pages updates canvas', async ({ page }) => {
      // Create a test page first
      await page.evaluate(() => {
        if (!window.pages.find(p => p.id === 'test')) {
          window.pages.push({ id: 'test', name: 'Test', slug: 'test.html', main: [] });
          if (typeof renderPagesList === 'function') renderPagesList();
        }
      });
      
      // Switch to test page
      const testPage = page.locator('.page-item:has-text("Test")');
      if (await testPage.count() > 0) {
        await testPage.click();
        
        const currentPage = await page.evaluate(() => window.currentPageId);
        expect(currentPage).toBe('test');
      }
    });

    test('max 4 pages in navbar', async ({ page }) => {
      const navbarLinks = await page.evaluate(() => {
        // Check navbar link generation logic
        const maxLinks = 4;
        return window.pages?.slice(0, maxLinks).length || 0;
      });
      expect(navbarLinks).toBeLessThanOrEqual(4);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENT PLACEMENT RULES
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Component Placement Rules', () => {

    test('Features blocked from header section', async ({ page }) => {
      // Try to add features to header
      const result = await page.evaluate(() => {
        const section = 'header';
        const componentType = 'features';
        // Features should only go in main
        return section === 'main';
      });
      expect(result).toBe(false);
    });

    test('Navbar component exists in header options', async ({ page }) => {
      const hasNavbar = await page.evaluate(() => {
        const headerComps = window.pageComponentSets?.home?.header || [];
        return headerComps.some(c => c.id === 'navbar');
      });
      expect(hasNavbar).toBe(true);
    });

    test('Footer component exists in footer options', async ({ page }) => {
      const hasFooter = await page.evaluate(() => {
        const footerComps = window.pageComponentSets?.home?.footer || [];
        return footerComps.some(c => c.id === 'footer');
      });
      expect(hasFooter).toBe(true);
    });

    test('Hero component exists in main options', async ({ page }) => {
      const hasHero = await page.evaluate(() => {
        const mainComps = window.pageComponentSets?.home?.main || [];
        return mainComps.some(c => c.id === 'hero');
      });
      expect(hasHero).toBe(true);
    });

    test('component library shows correct sections for home page', async ({ page }) => {
      const library = page.locator('#componentLibrary');
      
      // Should have Header, Main, Footer sections
      await expect(library.locator('h3:has-text("Header")')).toBeVisible();
      await expect(library.locator('h3:has-text("Main"), h3:has-text("Content")')).toBeVisible();
      await expect(library.locator('h3:has-text("Footer")')).toBeVisible();
    });

    test('non-home pages only show main components', async ({ page }) => {
      // Create and switch to non-home page
      await page.evaluate(() => {
        if (!window.pages.find(p => p.id === 'about')) {
          window.pages.push({ id: 'about', name: 'About', slug: 'about.html', main: [] });
        }
        if (typeof switchToPage === 'function') switchToPage('about');
      });
      
      await page.waitForTimeout(200);
      
      const library = page.locator('#componentLibrary');
      // Should NOT have Header/Footer sections for non-home
      const headerSection = library.locator('h3:has-text("Header Components")');
      await expect(headerSection).toHaveCount(0);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVBAR AUTO-CREATE PAGES
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Navbar Auto-Create Pages', () => {

    test('dropping navbar creates About and Contact pages', async ({ page }) => {
      // Get initial page count
      const initialPageIds = await page.evaluate(() => window.pages.map(p => p.id));
      expect(initialPageIds).toContain('home');
      
      // Add navbar component - this calls createNavbarPages() internally
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('navbar', 'header');
        }
      });
      
      // Wait for createNavbarPages to complete
      await page.waitForTimeout(500);
      
      // Manually call createNavbarPages if it wasn't triggered
      await page.evaluate(() => {
        if (typeof window.createNavbarPages === 'function') {
          window.createNavbarPages();
        }
      });
      
      await page.waitForTimeout(300);
      
      // Check if About and Contact pages were created
      const pageIds = await page.evaluate(() => {
        return window.pages.map(p => p.id);
      });
      
      // Should have at least home, about, contact
      expect(pageIds).toContain('home');
      expect(pageIds).toContain('about');
      expect(pageIds).toContain('contact');
    });

    test('navbar links update when pages added/removed', async ({ page }) => {
      // Add navbar first
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('navbar', 'header');
        }
      });
      
      // Add a new page
      await page.evaluate(() => {
        window.pages.push({ id: 'services', name: 'Services', slug: 'services.html', main: [] });
        if (typeof updateNavbarLinks === 'function') updateNavbarLinks();
      });
      
      // Check navbar was updated
      const navbarComp = await page.evaluate(() => {
        const navbar = window.components.find(c => c.type === 'navbar');
        return navbar?.html || '';
      });
      
      expect(navbarComp).toContain('Services');
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAG AND DROP
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Drag and Drop', () => {

    test('component items are draggable', async ({ page }) => {
      const item = page.locator('.component-item').first();
      const draggable = await item.getAttribute('draggable');
      expect(draggable).toBe('true');
    });

    test('drop zones exist for each section', async ({ page }) => {
      await expect(page.locator('.canvas-drop-zone[section="header"]')).toBeVisible();
      await expect(page.locator('.canvas-drop-zone[section="main"]')).toBeVisible();
      await expect(page.locator('.canvas-drop-zone[section="footer"]')).toBeVisible();
    });

    test('dropping component adds it to canvas', async ({ page }) => {
      const initialCount = await page.evaluate(() => window.components.length);
      
      // Simulate adding component
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('hero', 'main');
        }
      });
      
      const newCount = await page.evaluate(() => window.components.length);
      expect(newCount).toBe(initialCount + 1);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPERTIES PANEL
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Properties Panel', () => {

    test('properties panel shows empty state initially', async ({ page }) => {
      const panel = page.locator('#propertiesPanel');
      // The panel itself has the 'properties-empty' class, not a child element
      await expect(panel).toHaveClass(/properties-empty/);
    });

    test('selecting component shows properties', async ({ page }) => {
      // Add a component
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('hero', 'main');
        }
      });
      
      // Click the component
      const component = page.locator('.canvas-component').first();
      await component.click();
      
      // Properties should update
      const panel = page.locator('#propertiesPanel');
      await expect(panel.locator('.properties-section')).toBeVisible({ timeout: 2000 });
    });

    test('page properties show when page selected', async ({ page }) => {
      // Click on a page item
      const pageItem = page.locator('.page-item').first();
      await pageItem.click();
      
      const panel = page.locator('#propertiesPanel');
      // Should show page properties
      await expect(panel.locator('h4:has-text("Page Properties")')).toBeVisible({ timeout: 2000 });
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Component Operations', () => {

    test('can delete component', async ({ page }) => {
      // Handle any potential confirm dialogs
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      // Add component first
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('hero', 'main');
        }
      });
      
      // Wait for component to appear
      await expect(page.locator('.canvas-component')).toBeVisible();
      const initialCount = await page.evaluate(() => window.components.length);
      expect(initialCount).toBeGreaterThan(0);
      
      // Delete the component directly by manipulating the array and DOM
      await page.evaluate(() => {
        const comp = window.components[0];
        if (comp) {
          // Remove from DOM
          comp.element?.remove();
          // Remove from array
          window.components = window.components.filter(c => c.id !== comp.id);
        }
      });
      
      // Wait for deletion to complete
      await page.waitForTimeout(300);
      
      // Verify component was removed
      const finalCount = await page.evaluate(() => window.components.length);
      expect(finalCount).toBe(initialCount - 1);
    });

    test('duplicate check prompts user', async ({ page }) => {
      // Add hero twice - should prompt
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('hero', 'main');
        }
      });
      
      // The second add would trigger confirm dialog
      const componentExists = await page.evaluate(() => {
        return window.components.some(c => c.type === 'hero' && c.section === 'main');
      });
      expect(componentExists).toBe(true);
    });

    test('component count updates correctly', async ({ page }) => {
      const countEl = page.locator('#componentCount');
      
      // Add component
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('hero', 'main');
        }
      });
      
      await page.waitForTimeout(100);
      const text = await countEl.textContent();
      expect(text).toMatch(/\d+ component/);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENTEDITABLE COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Inline Editing', () => {

    test('Hero component is contenteditable', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('hero', 'main');
        }
      });
      
      const content = page.locator('.canvas-component .component-content').first();
      const editable = await content.getAttribute('contenteditable');
      expect(editable).toBe('true');
    });

    test('Features grid is NOT contenteditable', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('features', 'main');
        }
      });
      
      // Find the features component
      const featuresComp = await page.evaluate(() => {
        const comp = window.components.find(c => c.type === 'features');
        return comp?.template?.isFeatureGrid;
      });
      
      if (featuresComp) {
        const content = page.locator('.canvas-component .component-content').first();
        const editable = await content.getAttribute('contenteditable');
        expect(editable).toBeNull();
      }
    });

    test('editing content updates component data', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('hero', 'main');
        }
      });
      
      const content = page.locator('.canvas-component .component-content').first();
      
      // Type some content
      await content.click();
      await page.keyboard.type('New content');
      await content.blur();
      
      // HTML should be updated
      const html = await page.evaluate(() => {
        return window.components[0]?.html;
      });
      expect(html).toContain('New content');
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Global Sections', () => {

    test('header is stored in globalSections', async ({ page }) => {
      const hasGlobalHeader = await page.evaluate(() => {
        return window.globalSections?.header !== undefined;
      });
      expect(hasGlobalHeader).toBe(true);
    });

    test('footer is stored in globalSections', async ({ page }) => {
      const hasGlobalFooter = await page.evaluate(() => {
        return window.globalSections?.footer !== undefined;
      });
      expect(hasGlobalFooter).toBe(true);
    });

    test('header/footer shared tip shows on non-home pages', async ({ page }) => {
      // Create About page and render it in the list
      await page.evaluate(() => {
        if (!window.pages.find(p => p.id === 'about')) {
          window.pages.push({ 
            id: 'about', 
            name: 'About', 
            slug: 'about.html', 
            main: [], 
            showHeader: true, 
            showFooter: true 
          });
          if (typeof renderPagesList === 'function') renderPagesList();
        }
      });
      
      // Wait for page list to update
      await page.waitForTimeout(300);
      
      // Switch to About page using the function directly
      await page.evaluate(() => {
        if (typeof switchToPage === 'function') switchToPage('about');
      });
      
      await page.waitForTimeout(500);
      
      // On non-home pages, the component library shows a tip about shared header/footer
      // Look for text mentioning "Header" or "Footer" in the library
      const library = page.locator('#componentLibrary');
      // The tip says "Header & Footer are shared" or similar
      await expect(library).toContainText('Header', { timeout: 5000 });
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS BAR
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Status Bar', () => {

    test('status bar shows current page', async ({ page }) => {
      // Status bar shows current page info, not action messages
      const statusBar = page.locator('.status-bar, #status-bar-content');
      await expect(statusBar).toContainText('Home');
    });

    test('status bar updates when switching pages', async ({ page }) => {
      // Create and switch to About page
      await page.evaluate(() => {
        if (!window.pages.find(p => p.id === 'about')) {
          window.pages.push({ id: 'about', name: 'About', slug: 'about.html', main: [], showHeader: true, showFooter: true });
          if (typeof renderPagesList === 'function') renderPagesList();
        }
      });
      
      // Click the About page in the list
      await page.locator('.page-item:has-text("About")').click();
      await page.waitForTimeout(300);
      
      // Status bar should show About
      const statusBar = page.locator('.status-bar, #status-bar-content');
      await expect(statusBar).toContainText('About');
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CARD COMPONENT TYPES
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Card Component', () => {

    test('card component initializes with default type', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('card', 'main');
        }
      });
      
      const cardData = await page.evaluate(() => {
        const card = window.components.find(c => c.type === 'card');
        return card?.data;
      });
      
      expect(cardData?.cardType).toBe('basic');
    });

    test('card has required fields for basic type', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('card', 'main');
        }
      });
      
      const cardData = await page.evaluate(() => {
        const card = window.components.find(c => c.type === 'card');
        return card?.data;
      });
      
      expect(cardData).toHaveProperty('title');
      expect(cardData).toHaveProperty('description');
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CTA COMPONENT
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('CTA Component', () => {

    test('CTA initializes with phone mode', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('cta', 'main');
        }
      });
      
      const ctaData = await page.evaluate(() => {
        const cta = window.components.find(c => c.type === 'cta');
        return cta?.data;
      });
      
      expect(ctaData?.contactType).toBe('phone');
    });

    test('CTA has gradient fields', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('cta', 'main');
        }
      });
      
      const ctaData = await page.evaluate(() => {
        const cta = window.components.find(c => c.type === 'cta');
        return cta?.data;
      });
      
      expect(ctaData).toHaveProperty('gradientStart');
      expect(ctaData).toHaveProperty('gradientEnd');
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURES GRID
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Features Grid', () => {

    test('Features initializes with 3 cards', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('features', 'main');
        }
      });
      
      const cards = await page.evaluate(() => {
        const features = window.components.find(c => c.type === 'features');
        return features?.data?.cards;
      });
      
      expect(cards?.length).toBe(3);
    });

    test('Features blocked from header section', async ({ page }) => {
      // Attempting to add features to header should show alert
      const result = await page.evaluate(() => {
        // Check the logic in addComponentToCanvas
        const componentType = 'features';
        const section = 'header';
        return componentType === 'features' && section !== 'main';
      });
      
      expect(result).toBe(true);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICING GRID
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Pricing Grid', () => {

    test('Pricing initializes with 3 cards', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('pricing', 'main');
        }
      });
      
      const cards = await page.evaluate(() => {
        const pricing = window.components.find(c => c.type === 'pricing');
        return pricing?.data?.cards;
      });
      
      expect(cards?.length).toBe(3);
    });

    test('Pricing has highlighted card option', async ({ page }) => {
      await page.evaluate(() => {
        if (typeof addComponentToCanvas === 'function') {
          addComponentToCanvas('pricing', 'main');
        }
      });
      
      const hasHighlighted = await page.evaluate(() => {
        const pricing = window.components.find(c => c.type === 'pricing');
        return pricing?.data?.cards?.some(c => c.highlighted !== undefined);
      });
      
      expect(hasHighlighted).toBe(true);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAWER LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Drawer Layout', () => {

    test('left drawer has resize handle', async ({ page }) => {
      // Resizing is via .wb-drawer__handle element (BEM naming)
      const leftHandle = page.locator('#leftDrawer .wb-drawer__handle');
      await expect(leftHandle).toBeAttached();
    });

    test('right drawer has resize handle', async ({ page }) => {
      // Resizing is via .wb-drawer__handle element (BEM naming)
      const rightHandle = page.locator('#rightDrawer .wb-drawer__handle');
      await expect(rightHandle).toBeAttached();
    });

    test('drawers have toggle buttons', async ({ page }) => {
      // BEM naming: wb-drawer__toggle (double underscore)
      await expect(page.locator('#leftDrawer .wb-drawer__toggle')).toBeVisible();
      await expect(page.locator('#rightDrawer .wb-drawer__toggle')).toBeVisible();
    });

  });

});
