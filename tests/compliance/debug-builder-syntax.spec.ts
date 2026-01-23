import { test, expect } from '@playwright/test';

/**
 * Builder Syntax/Load Compliance Test
 * Ensures builder.html loads without JS errors, 404s, or failed requests
 */

// Use desktop viewport for all builder tests
test.use({ viewport: { width: 1280, height: 720 } });

test('builder.html should load without console errors', async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`Console Error: ${msg.text()}`);
    if (msg.type() === 'warning') warnings.push(`Console Warning: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });
  page.on('requestfailed', request => {
    errors.push(`Failed Request: ${request.url()} (${request.failure()?.errorText})`);
  });
  page.on('response', response => {
    if (response.status() === 404) {
      errors.push(`404 Not Found: ${response.url()}`);
    }
  });

  await page.goto('/builder.html');
  // Wait for page to fully load and scripts to execute (wait for .builder-layout to be visible)
  await page.waitForSelector('.builder-layout', { timeout: 3000 });

  if (errors.length > 0 || warnings.length > 0) {
    console.log('--- PAGE ERRORS ---');
    errors.forEach(e => console.log(e));
    if (warnings.length > 0) {
      console.log('--- PAGE WARNINGS ---');
      warnings.forEach(w => console.log(w));
    }
    console.log('-------------------');
  }

  expect(errors, `Errors found during builder.html load:\n${errors.join('\n')}`).toEqual([]);
});

test('builder.html should have required DOM structure', async ({ page }) => {
  await page.goto('/builder.html');
  await page.waitForSelector('.builder-layout', { timeout: 3000 });
  // Check for essential builder structure with detailed error messages
  await expect(page.locator('.top-bar'), 'Missing .top-bar').toBeVisible();
  await expect(page.locator('.builder-layout'), 'Missing .builder-layout').toBeVisible();
  await expect(page.locator('.canvas-area'), 'Missing .canvas-area').toBeVisible();
  await expect(page.locator('.canvas-section.header'), 'Missing .canvas-section.header').toBeVisible();
  await expect(page.locator('.canvas-section.main'), 'Missing .canvas-section.main').toBeVisible();
  await expect(page.locator('.canvas-section.footer'), 'Missing .canvas-section.footer').toBeVisible();
  await expect(page.locator('.status-bar'), 'Missing .status-bar').toBeVisible();
});

test('builder.html should have left and right drawers', async ({ page }) => {
  await page.goto('/builder.html');
  await page.waitForSelector('.builder-layout', { timeout: 3000 });
  // Check drawer structure with detailed error messages
  await expect(page.locator('#leftDrawer'), 'Missing #leftDrawer').toBeVisible();
  await expect(page.locator('#rightDrawer'), 'Missing #rightDrawer').toBeVisible();
  // Check pages section exists
  await expect(page.locator('.pages-section'), 'Missing .pages-section').toBeVisible();
  await expect(page.locator('#pagesList'), 'Missing #pagesList').toBeAttached();
});

test('builder.html should have component containers', async ({ page }) => {
  await page.goto('/builder.html');
  await page.waitForSelector('.builder-layout', { timeout: 3000 });
  // Check component containers with detailed error messages
  await expect(page.locator('#header-container'), 'Missing #header-container').toBeVisible();
  await expect(page.locator('#main-container'), 'Missing #main-container').toBeVisible();
  await expect(page.locator('#footer-container'), 'Missing #footer-container').toBeVisible();
});
