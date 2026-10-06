import { test, expect, Page } from '../fixtures/offline';

test.describe('Portfolio Card - Business Card (integration)', () => {
  test('should render all portfolio fields', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
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
      await (window as any).WB.scan();
    });
    
    // cardportfolio renders its own BEM block, .x-portfolio__* -- the
    // .x-card__portfolio-* names this used to query are not emitted anywhere
    // in card.js, so every field below read as missing while it rendered.
    const card = page.locator('#test-portfolio');
    await expect(card).toHaveAttribute('x-ready', '');
    await expect(card).toHaveClass(/\bx-portfolio\b/);
    
    // Name
    const name = card.locator('.x-portfolio__name');
    await expect(name).toHaveText('John Doe');
    
    // Title -- the company is written into the title line ("<title> at
    // <company>"); a separate company line is only built when there is no
    // title to attach it to.
    const title = card.locator('.x-portfolio__title');
    await expect(title).toHaveText('Senior Developer at Acme Corp');
    await expect(card.locator('.x-portfolio__company')).toHaveCount(0);
    
    // Location
    const location = card.locator('.x-portfolio__location');
    await expect(location).toContainText('San Francisco, CA');
    
    // Bio
    const bio = card.locator('.x-portfolio__bio');
    await expect(bio).toHaveText('Passionate developer with 10+ years experience.');
    
    // Contact links live in the card's <address>, each named by its href.
    const contact = card.locator('address.x-portfolio__contact');

    // Email link
    const email = contact.locator('a[href^="mailto:"]');
    await expect(email).toContainText('john@example.com');
    await expect(email).toHaveAttribute('href', 'mailto:john@example.com');
    
    // Phone link
    const phone = contact.locator('a[href^="tel:"]');
    await expect(phone).toContainText('+1-555-1234');
    
    // Website link
    const website = contact.locator('a[href="https://johndoe.com"]');
    await expect(website).toContainText('https://johndoe.com');
    
    // Avatar
    const avatar = card.locator('.x-portfolio__avatar');
    await expect(avatar).toBeVisible();
    
    // Social links
    const social = card.locator('.x-portfolio__social');
    await expect(social).toBeVisible();
    await expect(social.locator('a')).toHaveCount(3); // linkedin, twitter, github
  });

  test('should have border', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-portfolio-border';
      el.setAttribute('x-cardportfolio', '');
      el.setAttribute('data-name', 'Jane Smith');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    const card = page.locator('#test-portfolio-border');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should render with cover image', async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage);
    await page.waitForTimeout(100);
    
    await page.evaluate(async () => {
      const el = document.createElement('div');
      el.id = 'test-portfolio-cover';
      el.setAttribute('x-cardportfolio', '');
      el.setAttribute('data-name', 'Cover Test');
      el.setAttribute('data-cover', 'https://picsum.photos/400/100');
      document.body.appendChild(el);
      await (window as any).WB.scan();
    });
    
    // The cover is the card's own .x-portfolio__cover banner (see above).
    const cover = page.locator('#test-portfolio-cover .x-portfolio__cover');
    await expect(cover).toBeVisible();
  });
});
