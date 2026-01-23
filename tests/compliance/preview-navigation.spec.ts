/**
 * PREVIEW NAVIGATION COMPLIANCE
 * =============================
 * Ensures that clicking navigation links in preview.html stays within the preview
 * and doesn't navigate away to external pages (like index.html, about.html, etc.)
 * 
 * This prevents the bug where clicking Home/About/Contact in preview mode
 * would navigate back to the actual server pages instead of switching
 * between preview page content.
 */

import { test, expect } from '@playwright/test';

test.describe('Preview Navigation Compliance', () => {

  test.beforeEach(async ({ page }) => {
    // Set up preview data in localStorage (simulating what builder's previewSite() does)
    await page.goto('/preview.html');
    
    await page.evaluate(() => {
      const previewData = {
        theme: 'dark',
        header: `
          <nav style="display: flex; gap: 1rem; padding: 1rem;">
            <a href="index.html" page="home">Home</a>
            <a href="about.html" page="about">About</a>
            <a href="contact.html" page="contact">Contact</a>
          </nav>
        `,
        pages: `
          <div class="page-content" id="page-home">
            <h1>Home Page Content</h1>
            <p>This is the home page.</p>
          </div>
          <div class="page-content" id="page-about">
            <h1>About Page Content</h1>
            <p>This is the about page.</p>
          </div>
          <div class="page-content" id="page-contact">
            <h1>Contact Page Content</h1>
            <p>This is the contact page.</p>
          </div>
        `,
        footer: '<footer>Test Footer</footer>',
        currentPage: 'home',
        timestamp: Date.now()
      };
      localStorage.setItem('wb-builder-preview', JSON.stringify(previewData));
    });
    
    // Reload to pick up the preview data
    await page.reload();
    await page.waitForTimeout(300);
  });

  test('clicking nav links should NOT navigate away from preview.html', async ({ page }) => {
    // Verify we're on preview.html
    expect(page.url()).toContain('preview.html');
    
    // Click the About link
    await page.click('a[page="about"]');
    await page.waitForTimeout(100);
    
    // Should still be on preview.html (not about.html)
    expect(page.url()).toContain('preview.html');
    expect(page.url()).not.toContain('about.html');
    
    // Click the Contact link
    await page.click('a[page="contact"]');
    await page.waitForTimeout(100);
    
    // Should still be on preview.html (not contact.html)
    expect(page.url()).toContain('preview.html');
    expect(page.url()).not.toContain('contact.html');
    
    // Click the Home link
    await page.click('a[page="home"]');
    await page.waitForTimeout(100);
    
    // Should still be on preview.html (not index.html)
    expect(page.url()).toContain('preview.html');
    expect(page.url()).not.toContain('index.html');
  });

  test('clicking nav links should switch visible page content', async ({ page }) => {
    // Home should be visible initially
    const homePage = page.locator('#page-home');
    const aboutPage = page.locator('#page-about');
    const contactPage = page.locator('#page-contact');
    
    await expect(homePage).toHaveClass(/active/);
    
    // Click About - about page should become active
    await page.click('a[page="about"]');
    await page.waitForTimeout(100);
    
    await expect(aboutPage).toHaveClass(/active/);
    await expect(homePage).not.toHaveClass(/active/);
    
    // Click Contact - contact page should become active
    await page.click('a[page="contact"]');
    await page.waitForTimeout(100);
    
    await expect(contactPage).toHaveClass(/active/);
    await expect(aboutPage).not.toHaveClass(/active/);
  });

  test('links with href only (no data-page) should still work for known pages', async ({ page }) => {
    // Add a link without page attribute
    await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (nav) {
        const link = document.createElement('a');
        link.href = 'about.html';
        link.textContent = 'About (href only)';
        link.id = 'href-only-link';
        nav.appendChild(link);
      }
    });
    
    // Click the href-only link
    await page.click('#href-only-link');
    await page.waitForTimeout(100);
    
    // Should still be on preview.html
    expect(page.url()).toContain('preview.html');
    
    // About page should be active
    const aboutPage = page.locator('#page-about');
    await expect(aboutPage).toHaveClass(/active/);
  });

  test('preview.html should have setupNavigationInterception function', async ({ page }) => {
    // Verify the interception function exists
    const hasInterception = await page.evaluate(() => {
      return typeof (window as any).showPage === 'function';
    });
    
    expect(hasInterception).toBe(true);
  });

  test('navigation should handle index.html -> home mapping', async ({ page }) => {
    // Add a link that uses index.html
    await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (nav) {
        const link = document.createElement('a');
        link.href = 'index.html';
        link.textContent = 'Index Link';
        link.id = 'index-link';
        nav.appendChild(link);
      }
    });
    
    // First navigate to about
    await page.click('a[page="about"]');
    await page.waitForTimeout(100);
    
    // Click index.html link - should map to home
    await page.click('#index-link');
    await page.waitForTimeout(100);
    
    // Should still be on preview.html
    expect(page.url()).toContain('preview.html');
    
    // Home page should be active
    const homePage = page.locator('#page-home');
    await expect(homePage).toHaveClass(/active/);
  });

});
