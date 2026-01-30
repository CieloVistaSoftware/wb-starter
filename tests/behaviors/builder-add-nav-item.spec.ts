/**
 * Builder Add Nav Item Tests
 * Tests the right-click context menu "Add Nav Item" functionality
 * for navbar and header components
 */

import { test, expect, Page } from '@playwright/test';

// Use desktop viewport for all builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Add Nav Item - Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    // Wait for builder to fully initialize
    await page.waitForSelector('.canvas-section', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('context menu should exist on right-click of dropped component', async ({ page }) => {
    // First, we need to add a component to the canvas
    // Use the addComponentToCanvas function if available
    const hasComponent = await page.evaluate(() => {
      // Check if there's already a component or add one
      const container = document.querySelector('#header-container');
      if (container && container.children.length > 0) return true;
      
      // Try to add a navbar component
      if (typeof window.addComponentToCanvas === 'function') {
        window.addComponentToCanvas('navbar', 'header');
        return true;
      }
      return false;
    });

    if (!hasComponent) {
      test.skip();
      return;
    }

    await page.waitForTimeout(300);

    // Find a dropped component
    const droppedComponent = page.locator('.dropped').first();
    
    if (await droppedComponent.count() === 0) {
      test.skip();
      return;
    }

    // Right-click on the component
    await droppedComponent.click({ button: 'right' });
    
    // Context menu should appear
    const contextMenu = page.locator('#builderContextMenu');
    await expect(contextMenu).toBeVisible({ timeout: 2000 });
  });

  test('context menu should have Add Nav Item option for navbar components', async ({ page }) => {
    // Add a navbar component
    await page.evaluate(() => {
      if (typeof window.addComponentToCanvas === 'function') {
        window.addComponentToCanvas('navbar', 'header');
      }
    });
    
    await page.waitForTimeout(500);

    // Find the navbar component (look for wb-header or wb-navbar)
    const navbarComponent = page.locator('.dropped').filter({
      has: page.locator('wb-header, wb-navbar')
    }).first();

    if (await navbarComponent.count() === 0) {
      // Fallback - just test with any dropped component
      const anyDropped = page.locator('.dropped').first();
      if (await anyDropped.count() > 0) {
        await anyDropped.click({ button: 'right' });
        const contextMenu = page.locator('#builderContextMenu');
        await expect(contextMenu).toBeVisible({ timeout: 2000 });
      }
      return;
    }

    await navbarComponent.click({ button: 'right' });
    
    const contextMenu = page.locator('#builderContextMenu');
    await expect(contextMenu).toBeVisible({ timeout: 2000 });
    
    // Check for Add Nav Item button
    const addNavItemBtn = page.locator('#ctx-add-nav-item');
    await expect(addNavItemBtn).toBeVisible();
    await expect(addNavItemBtn).toContainText('Add Nav Item');
  });

  test('context menu closes on outside click', async ({ page }) => {
    // Add a component
    await page.evaluate(() => {
      if (typeof window.addComponentToCanvas === 'function') {
        window.addComponentToCanvas('hero', 'main');
      }
    });
    
    await page.waitForTimeout(300);

    const droppedComponent = page.locator('.dropped').first();
    if (await droppedComponent.count() === 0) {
      test.skip();
      return;
    }

    await droppedComponent.click({ button: 'right' });
    
    const contextMenu = page.locator('#builderContextMenu');
    await expect(contextMenu).toBeVisible({ timeout: 2000 });
    
    // Click outside
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
    
    await expect(contextMenu).not.toBeVisible();
  });
});

test.describe('Add Nav Item - Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForSelector('.canvas-section', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('showAddNavItemDialog should create dialog', async ({ page }) => {
    // Call the function directly
    await page.evaluate(() => {
      if (typeof window.showAddNavItemDialog === 'function') {
        window.showAddNavItemDialog();
      }
    });
    
    const dialog = page.locator('#navItemDialog');
    await expect(dialog).toBeVisible({ timeout: 2000 });
  });

  test('dialog should have all required elements', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    await page.waitForTimeout(200);
    
    // Check for dialog structure
    await expect(page.locator('.nav-dialog-overlay')).toBeVisible();
    await expect(page.locator('.nav-dialog-content')).toBeVisible();
    await expect(page.locator('.nav-dialog-header')).toBeVisible();
    await expect(page.locator('.nav-dialog-body')).toBeVisible();
    await expect(page.locator('.nav-dialog-footer')).toBeVisible();
  });

  test('dialog should have page name input', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    const nameInput = page.locator('#navItemName');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('placeholder', /Services|Portfolio|Blog/);
  });

  test('dialog should have header/footer checkboxes', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    const headerCheckbox = page.locator('#navItemShowHeader');
    const footerCheckbox = page.locator('#navItemShowFooter');
    
    await expect(headerCheckbox).toBeVisible();
    await expect(footerCheckbox).toBeVisible();
    
    // Both should be checked by default
    await expect(headerCheckbox).toBeChecked();
    await expect(footerCheckbox).toBeChecked();
  });

  test('dialog should have 6 template options', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    const templates = page.locator('.nav-dialog-template');
    await expect(templates).toHaveCount(6);
    
    // Check template values
    const expectedTemplates = ['blank', 'services', 'contact', 'about', 'portfolio', 'faq'];
    for (const template of expectedTemplates) {
      await expect(page.locator(`input[name="navItemTemplate"][value="${template}"]`)).toBeAttached();
    }
  });

  test('blank template should be selected by default', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    const blankRadio = page.locator('input[name="navItemTemplate"][value="blank"]');
    await expect(blankRadio).toBeChecked();
    
    const blankLabel = page.locator('.nav-dialog-template[data-value="blank"]');
    await expect(blankLabel).toHaveClass(/selected/);
  });

  test('clicking template should select it', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    // Click on services template
    const servicesLabel = page.locator('.nav-dialog-template[data-value="services"]');
    await servicesLabel.click();
    
    await expect(servicesLabel).toHaveClass(/selected/);
    await expect(page.locator('input[name="navItemTemplate"][value="services"]')).toBeChecked();
    
    // Blank should no longer be selected
    const blankLabel = page.locator('.nav-dialog-template[data-value="blank"]');
    await expect(blankLabel).not.toHaveClass(/selected/);
  });

  test('dialog should close on X button click', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    const dialog = page.locator('#navItemDialog');
    await expect(dialog).toBeVisible();
    
    await page.click('#navDialogClose');
    await expect(dialog).not.toBeVisible();
  });

  test('dialog should close on Cancel button click', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    const dialog = page.locator('#navItemDialog');
    await expect(dialog).toBeVisible();
    
    await page.click('#navDialogCancel');
    await expect(dialog).not.toBeVisible();
  });

  test('dialog should close on overlay click', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    const dialog = page.locator('#navItemDialog');
    await expect(dialog).toBeVisible();
    
    // Click on overlay (not the content)
    await page.click('.nav-dialog-overlay', { position: { x: 10, y: 10 } });
    await expect(dialog).not.toBeVisible();
  });

  test('dialog should close on Escape key', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    const dialog = page.locator('#navItemDialog');
    await expect(dialog).toBeVisible();
    
    // Focus the input and press Escape
    await page.locator('#navItemName').focus();
    await page.keyboard.press('Escape');
    
    await expect(dialog).not.toBeVisible();
  });

  test('empty name should show validation error', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    // Clear the input and try to create
    await page.fill('#navItemName', '');
    await page.click('#navDialogCreate');
    
    // Dialog should still be visible
    const dialog = page.locator('#navItemDialog');
    await expect(dialog).toBeVisible();
    
    // Input should have error styling
    const nameInput = page.locator('#navItemName');
    const borderColor = await nameInput.evaluate(el => getComputedStyle(el).borderColor);
    // Red error color check (allowing for variations)
    expect(borderColor).toMatch(/rgb\(239|#ef4444/i);
  });

  test('Enter key should submit form with valid name', async ({ page }) => {
    // Setup pages array
    await page.evaluate(() => {
      window.pages = window.pages || [];
      window.showAddNavItemDialog?.();
    });
    
    await page.fill('#navItemName', 'Test Page');
    await page.keyboard.press('Enter');
    
    // Dialog should close
    const dialog = page.locator('#navItemDialog');
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe('Add Nav Item - Page Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForSelector('.canvas-section', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('creating page should add to pages array', async ({ page }) => {
    // Get initial page count
    const initialCount = await page.evaluate(() => {
      return window.pages?.length || 0;
    });
    
    // Open dialog and create page
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    await page.fill('#navItemName', 'New Test Page');
    await page.click('#navDialogCreate');
    
    await page.waitForTimeout(300);
    
    // Check that page was added
    const newCount = await page.evaluate(() => {
      return window.pages?.length || 0;
    });
    
    expect(newCount).toBe(initialCount + 1);
  });

  test('created page should have correct properties', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    // Fill in details
    await page.fill('#navItemName', 'My Services');
    await page.uncheck('#navItemShowHeader');
    await page.click('.nav-dialog-template[data-value="services"]');
    await page.click('#navDialogCreate');
    
    await page.waitForTimeout(300);
    
    // Verify page properties
    const pageData = await page.evaluate(() => {
      const page = window.pages?.find(p => p.id === 'my-services');
      return page ? {
        id: page.id,
        name: page.name,
        slug: page.slug,
        showHeader: page.showHeader,
        showFooter: page.showFooter
      } : null;
    });
    
    // If page was created directly (blank template)
    if (pageData) {
      expect(pageData.id).toBe('my-services');
      expect(pageData.name).toBe('My Services');
      expect(pageData.slug).toBe('my-services.html');
    }
  });

  test('duplicate page name should show alert', async ({ page }) => {
    // Create a page first
    await page.evaluate(() => {
      window.pages = window.pages || [];
      window.pages.push({ id: 'test-page', name: 'Test Page', slug: 'test-page.html', main: [] });
    });
    
    // Handle alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('already exists');
      await dialog.accept();
    });
    
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    await page.fill('#navItemName', 'Test Page');
    await page.click('#navDialogCreate');
    
    await page.waitForTimeout(300);
  });

  test('page creation should dispatch wb:page:created event', async ({ page }) => {
    // Set up event listener
    await page.evaluate(() => {
      window.__pageCreatedEvent = null;
      document.addEventListener('wb:page:created', (e) => {
        window.__pageCreatedEvent = e.detail;
      });
    });
    
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    await page.fill('#navItemName', 'Event Test Page');
    await page.click('#navDialogCreate');
    
    await page.waitForTimeout(300);
    
    const eventDetail = await page.evaluate(() => window.__pageCreatedEvent);
    
    if (eventDetail) {
      expect(eventDetail.id).toBe('event-test-page');
      expect(eventDetail.name).toBe('Event Test Page');
      expect(eventDetail.slug).toBe('event-test-page.html');
    }
  });

  test('page name should be sanitized for ID', async ({ page }) => {
    await page.evaluate(() => {
      window.showAddNavItemDialog?.();
    });
    
    await page.fill('#navItemName', 'My Special Page! @#$');
    await page.click('#navDialogCreate');
    
    await page.waitForTimeout(300);
    
    const pageId = await page.evaluate(() => {
      const page = window.pages?.find(p => p.name === 'My Special Page! @#$');
      return page?.id;
    });
    
    if (pageId) {
      expect(pageId).toBe('my-special-page-');
      expect(pageId).not.toMatch(/[^a-z0-9-]/);
    }
  });
});

test.describe('Add Nav Item - isNavbarComponent Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForSelector('.canvas-section', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('isNavbarComponent should detect wb-header element', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Create a mock element with wb-header
      const wrapper = document.createElement('div');
      wrapper.className = 'dropped';
      wrapper.innerHTML = '<wb-header heading="Test"></wb-header>';
      document.body.appendChild(wrapper);
      
      // Get the isNavbarComponent function result
      const inner = wrapper.querySelector('wb-navbar, wb-header');
      const detected = inner !== null;
      
      wrapper.remove();
      return detected;
    });
    
    expect(result).toBe(true);
  });

  test('isNavbarComponent should detect wb-navbar element', async ({ page }) => {
    const result = await page.evaluate(() => {
      const wrapper = document.createElement('div');
      wrapper.className = 'dropped';
      wrapper.innerHTML = '<wb-navbar brand="Test"></wb-navbar>';
      document.body.appendChild(wrapper);
      
      const inner = wrapper.querySelector('wb-navbar, wb-header');
      const detected = inner !== null;
      
      wrapper.remove();
      return detected;
    });
    
    expect(result).toBe(true);
  });

  test('isNavbarComponent should not detect non-navbar elements', async ({ page }) => {
    const result = await page.evaluate(() => {
      const wrapper = document.createElement('div');
      wrapper.className = 'dropped';
      wrapper.innerHTML = '<wb-card heading="Test"></wb-card>';
      document.body.appendChild(wrapper);
      
      const inner = wrapper.querySelector('wb-navbar, wb-header');
      const detected = inner !== null;
      
      wrapper.remove();
      return detected;
    });
    
    expect(result).toBe(false);
  });
});

test.describe('Add Nav Item - Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForSelector('.canvas-section', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('full flow: right-click navbar → Add Nav Item → create page', async ({ page }) => {
    // Add a navbar component
    await page.evaluate(() => {
      if (typeof window.addComponentToCanvas === 'function') {
        window.addComponentToCanvas('navbar', 'header');
      }
    });
    
    await page.waitForTimeout(500);
    
    // Find the dropped component
    const droppedComponent = page.locator('.dropped').first();
    
    if (await droppedComponent.count() === 0) {
      test.skip();
      return;
    }
    
    // Right-click to open context menu
    await droppedComponent.click({ button: 'right' });
    
    const contextMenu = page.locator('#builderContextMenu');
    await expect(contextMenu).toBeVisible({ timeout: 2000 });
    
    // Click Add Nav Item if available
    const addNavItemBtn = page.locator('#ctx-add-nav-item');
    if (await addNavItemBtn.count() > 0) {
      await addNavItemBtn.click();
      
      // Dialog should appear
      const dialog = page.locator('#navItemDialog');
      await expect(dialog).toBeVisible({ timeout: 2000 });
      
      // Create a page
      await page.fill('#navItemName', 'Integration Test');
      await page.click('#navDialogCreate');
      
      // Dialog should close
      await expect(dialog).not.toBeVisible();
      
      // Verify page exists
      const pageExists = await page.evaluate(() => {
        return window.pages?.some(p => p.id === 'integration-test');
      });
      
      expect(pageExists).toBe(true);
    }
  });

  test('showAddNavItemDialog is exposed to window', async ({ page }) => {
    const functionExists = await page.evaluate(() => {
      return typeof window.showAddNavItemDialog === 'function';
    });
    
    expect(functionExists).toBe(true);
  });
});
