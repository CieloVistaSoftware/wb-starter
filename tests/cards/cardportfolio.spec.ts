import { test, expect, Page } from '@playwright/test';

test.describe('Portfolio Card - Business Card (integration)', () => {
  test('should render all portfolio fields', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-portfolio';
      el.setAttribute('x-cardportfolio', '');
      el.setAttribute('data-name', 'John Doe');
      el.setAttribute('data-title', 'Senior Developer');
      el.setAttribute('data-company', 'Acme Corp');
      el.setAttribute('data-email', 'john@example.com');
      el.setAttribute('data-phone', '+1-555-1234');
      el.setAttribute('data-website', 'https://johndoe.com');
      el.setAttribute('data-location', 'San Francisco, CA');
      el.setAttribute('data-bio', 'Passionate developer with 10+ years experience.');
      el.setAttribute('data-avatar', 'https://i.pravatar.cc/150');
      el.setAttribute('data-linkedin', 'https://linkedin.com/in/johndoe');
      el.setAttribute('data-twitter', 'https://twitter.com/johndoe');
      el.setAttribute('data-github', 'https://github.com/johndoe');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-portfolio');
    await expect(card).toHaveClass(/wb-card/);
    await expect(card).toHaveClass(/wb-card--portfolio/);
    
    // Name
    const name = card.locator('.wb-card__portfolio-name');
    await expect(name).toHaveText('John Doe');
    
    // Title
    const title = card.locator('.wb-card__portfolio-title');
    await expect(title).toHaveText('Senior Developer');
    
    // Company
    const company = card.locator('.wb-card__portfolio-company');
    await expect(company).toHaveText('Acme Corp');
    
    // Location
    const location = card.locator('.wb-card__portfolio-location');
    await expect(location).toContainText('San Francisco, CA');
    
    // Bio
    const bio = card.locator('.wb-card__portfolio-bio');
    await expect(bio).toHaveText('Passionate developer with 10+ years experience.');
    
    // Email link
    const email = card.locator('.wb-card__portfolio-email');
    await expect(email).toContainText('john@example.com');
    await expect(email).toHaveAttribute('href', 'mailto:john@example.com');
    
    // Phone link
    const phone = card.locator('.wb-card__portfolio-phone');
    await expect(phone).toContainText('+1-555-1234');
    
    // Website link
    const website = card.locator('.wb-card__portfolio-website');
    await expect(website).toContainText('https://johndoe.com');
    
    // Avatar
    const avatar = card.locator('.wb-card__portfolio-avatar');
    await expect(avatar).toBeVisible();
    
    // Social links
    const social = card.locator('.wb-card__portfolio-social');
    await expect(social).toBeVisible();
    await expect(social.locator('a')).toHaveCount(3); // linkedin, twitter, github
  });

  test('should have border', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-portfolio-border';
      el.setAttribute('x-cardportfolio', '');
      el.setAttribute('data-name', 'Jane Smith');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const card = page.locator('#test-portfolio-border');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should render with cover image', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.id = 'test-portfolio-cover';
      el.setAttribute('x-cardportfolio', '');
      el.setAttribute('data-name', 'Cover Test');
      el.setAttribute('data-cover', 'https://picsum.photos/400/100');
      document.body.appendChild(el);
      (window as any).WB.scan();
    });
    
    const cover = page.locator('#test-portfolio-cover .wb-card__portfolio-cover');
    await expect(cover).toBeVisible();
  });
});
