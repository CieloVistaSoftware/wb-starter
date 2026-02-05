import { test, expect } from '@playwright/test';

/**
 * Navbar Position Tests
 * Verify site.json navigationPosition: "top" renders wb-navbar at the top
 */
test.describe('Navbar Position Compliance', () => {
  
  test('site.json has navigationPosition set to top', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const siteConfig = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'config/site.json'), 'utf-8')
    );
    
    expect(siteConfig.navigationLayout).toBeDefined();
    expect(siteConfig.navigationLayout.navigationPosition).toBe('top');
  });

  test('wb-navbar element exists on page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('wb-navbar');
    await expect(navbar).toBeAttached({ timeout: 5000 });
  });

  test('wb-navbar is first child of #app (at top)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // The wb-navbar should be the first element inside #app when position is top
    const firstChild = page.locator('#app > *:first-child');
    const tagName = await firstChild.evaluate(el => el.tagName.toLowerCase());
    
    expect(tagName).toBe('wb-navbar');
  });

  test('wb-navbar renders navigation items from site.json', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('wb-navbar');
    await expect(navbar).toBeVisible();
    
    // Check for expected nav items from site.json navigationMenu
    const homeLink = navbar.locator('a[data-page="home"], a[href*="page=home"]');
    const componentsLink = navbar.locator('a[data-page="components"], a[href*="page=components"]');
    
    await expect(homeLink).toBeAttached();
    await expect(componentsLink).toBeAttached();
  });

  test('no .site__nav sidebar element when position is top', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // The old sidebar nav should NOT exist when using top nav
    const sidebar = page.locator('.site__nav');
    await expect(sidebar).not.toBeAttached();
  });

  test('wb-navbar has sticky positioning', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('wb-navbar');
    const position = await navbar.evaluate(el => getComputedStyle(el).position);
    
    expect(['sticky', 'fixed']).toContain(position);
  });

  test('wb-navbar is at top of viewport (y=0 or near 0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('wb-navbar');
    const box = await navbar.boundingBox();
    
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThanOrEqual(10); // Should be at or near top
  });

  test('wb-navbar brand uses correct font size from schema', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('wb-navbar');
    const brandElement = navbar.locator('.wb-navbar__brand-text, .wb-navbar__brand');
    
    await expect(brandElement.first()).toBeVisible();
    
    // Schema defines --wb-navbar-brand-size: 1.25rem (20px at default root)
    const fontSize = await brandElement.first().evaluate(el => {
      const computed = getComputedStyle(el).fontSize;
      return parseFloat(computed);
    });
    
    // 1.25rem = 20px at 16px root, allow some tolerance
    expect(fontSize).toBeGreaterThanOrEqual(18);
    expect(fontSize).toBeLessThanOrEqual(24);
  });

  test('wb-navbar links use correct font size from schema', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('wb-navbar');
    const linkElement = navbar.locator('.wb-navbar__item').first();
    
    await expect(linkElement).toBeVisible();
    
    // Schema defines --wb-navbar-link-size: 0.875rem (14px at default root)
    const fontSize = await linkElement.evaluate(el => {
      const computed = getComputedStyle(el).fontSize;
      return parseFloat(computed);
    });
    
    // 0.875rem = 14px at 16px root, allow some tolerance
    expect(fontSize).toBeGreaterThanOrEqual(13);
    expect(fontSize).toBeLessThanOrEqual(16);
  });

  test('wb-navbar has correct height from schema', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('wb-navbar');
    const height = await navbar.evaluate(el => el.offsetHeight);
    
    // Schema defines --wb-navbar-height: 56px
    expect(height).toBeGreaterThanOrEqual(50);
    expect(height).toBeLessThanOrEqual(62);
  });

  test('wb-navbar has 1rem end padding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('wb-navbar');
    const padding = await navbar.evaluate(el => {
      const style = getComputedStyle(el);
      return {
        left: parseFloat(style.paddingLeft),
        right: parseFloat(style.paddingRight)
      };
    });
    
    // Schema defines --wb-navbar-padding: 0 1rem (16px)
    expect(padding.left).toBeGreaterThanOrEqual(14);
    expect(padding.left).toBeLessThanOrEqual(18);
    expect(padding.right).toBeGreaterThanOrEqual(14);
    expect(padding.right).toBeLessThanOrEqual(18);
  });
});
