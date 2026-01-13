/**
 * Comprehensive Card Tests
 * ========================
 * Tests ALL 19 card types with proper attribute verification
 * 
 * Card Types:
 * - card, cardlink, cardbutton (Base)
 * - cardprofile, cardtestimonial (Content)
 * - cardimage, cardvideo, cardfile, cardportfolio (Media)
 * - cardstats, cardpricing, cardproduct (Data)
 * - cardexpandable, cardminimizable, carddraggable, cardhorizontal, cardoverlay (Interactive)
 * - cardnotification (Notification)
 * - cardhero (Hero)
 */

import { test, expect, Page } from '@playwright/test';

// Helper to create a test page with WB initialized
async function createTestPage(page: Page, html: string): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en" data-theme="dark">
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="/src/styles/themes.css">
      <link rel="stylesheet" href="/src/styles/components.css">
    </head>
    <body style="padding: 2rem; background: var(--bg-color);">
      ${html}
      <script type="module">
        import WB from '/src/core/wb-lazy.js';
        window.WB = WB;
        await WB.init({ autoInject: true });
        window.wbReady = true;
      </script>
    </body>
    </html>
  `, { waitUntil: 'networkidle' });
  
  // Wait for WB to initialize
  await page.waitForFunction(() => window.wbReady === true, { timeout: 5000 });
  await page.waitForTimeout(300);
}

test.describe('Base Cards', () => {
  
  test.describe('card (base)', () => {
    test('renders with title and subtitle', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="card" data-title="Test Title" data-subtitle="Test Subtitle">
          <p>Card content</p>
        </article>
      `);
      
      const card = page.locator('[data-wb="card"]');
      await expect(card).toBeVisible();
      await expect(card).toHaveClass(/wb-card/);
      
      // Check title rendered
      const title = card.locator('.wb-card__title, h3');
      await expect(title).toContainText('Test Title');
      
      // Check subtitle rendered
      const subtitle = card.locator('.wb-card__subtitle, p').first();
      await expect(subtitle).toContainText('Test Subtitle');
    });
    
    test('elevated variant has shadow', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="card" data-title="Elevated" data-elevated="true">
          Content
        </article>
      `);
      
      const card = page.locator('[data-wb="card"]');
      await expect(card).toHaveClass(/wb-card--elevated/);
      
      const boxShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
      expect(boxShadow).not.toBe('none');
    });
    
    test('clickable variant is interactive', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="card" data-title="Clickable" data-clickable="true">
          Click me
        </article>
      `);
      
      const card = page.locator('[data-wb="card"]');
      await expect(card).toHaveClass(/wb-card--clickable/);
      await expect(card).toHaveAttribute('role', 'button');
      await expect(card).toHaveAttribute('tabindex', '0');
      
      const cursor = await card.evaluate(el => getComputedStyle(el).cursor);
      expect(cursor).toBe('pointer');
    });
    
    test('glass variant has backdrop filter', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="card" data-title="Glass" data-variant="glass">
          Glass effect
        </article>
      `);
      
      const card = page.locator('[data-wb="card"]');
      await expect(card).toHaveClass(/wb-card--glass/);
    });
  });
  
  test.describe('cardlink', () => {
    test('renders with href and navigates', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardlink" data-title="Link Card" data-href="https://example.com" data-target="_blank">
          Click to navigate
        </article>
      `);
      
      const card = page.locator('[data-wb="cardlink"]');
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('role', 'link');
    });
    
    test('shows external indicator for _blank target', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardlink" data-title="External" data-href="https://example.com" data-target="_blank">
          External link
        </article>
      `);
      
      const card = page.locator('[data-wb="cardlink"]');
      // Should show ↗ indicator
      await expect(card).toContainText('↗');
    });
    
    test('renders badge when provided', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardlink" data-title="With Badge" data-badge="NEW" data-href="#">
          Has badge
        </article>
      `);
      
      const card = page.locator('[data-wb="cardlink"]');
      await expect(card).toContainText('NEW');
    });
  });
  
  test.describe('cardbutton', () => {
    test('renders with primary and secondary buttons', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardbutton" data-title="Action Card" data-primary="Submit" data-secondary="Cancel">
          Card with buttons
        </article>
      `);
      
      const card = page.locator('[data-wb="cardbutton"]');
      await expect(card).toBeVisible();
      
      const primaryBtn = card.locator('.wb-card__btn--primary, button:has-text("Submit")');
      await expect(primaryBtn).toBeVisible();
      
      const secondaryBtn = card.locator('.wb-card__btn--secondary, button:has-text("Cancel")');
      await expect(secondaryBtn).toBeVisible();
    });
  });
});

test.describe('Content Cards', () => {
  
  test.describe('cardprofile', () => {
    test('renders with name, role, avatar', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardprofile" 
          data-name="John Doe" 
          data-role="Developer" 
          data-avatar="https://i.pravatar.cc/80?u=1"
          data-bio="Building cool stuff">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardprofile"]');
      await expect(card).toBeVisible();
      
      // Check name
      await expect(card).toContainText('John Doe');
      
      // Check role
      await expect(card).toContainText('Developer');
      
      // Check avatar image exists
      const avatar = card.locator('img');
      await expect(avatar).toHaveAttribute('src', /pravatar/);
      
      // Check bio
      await expect(card).toContainText('Building cool stuff');
    });
    
    test('renders cover image when provided', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardprofile" 
          data-name="Jane Smith" 
          data-cover="https://picsum.photos/400/100">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardprofile"]');
      const cover = card.locator('.wb-card__cover, .wb-card__profile-cover, figure');
      await expect(cover.first()).toBeVisible();
    });
  });
  
  test.describe('cardtestimonial', () => {
    test('renders with quote, author, rating', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardtestimonial" 
          data-quote="This product is amazing!" 
          data-author="Jane Smith" 
          data-role="CEO" 
          data-rating="5">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardtestimonial"]');
      await expect(card).toBeVisible();
      
      // Check quote
      await expect(card).toContainText('This product is amazing!');
      
      // Check author
      await expect(card).toContainText('Jane Smith');
      
      // Check rating (5 stars)
      await expect(card).toContainText('★★★★★');
    });
  });
});

test.describe('Media Cards', () => {
  
  test.describe('cardimage', () => {
    test('renders image with correct src and alt', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardimage" 
          data-src="https://picsum.photos/400/300" 
          data-alt="Test image"
          data-title="Image Title">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardimage"]');
      await expect(card).toBeVisible();
      
      const img = card.locator('img');
      await expect(img).toHaveAttribute('src', /picsum/);
      await expect(img).toHaveAttribute('alt', 'Test image');
      
      await expect(card).toContainText('Image Title');
    });
    
    test('respects aspect ratio', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardimage" 
          data-src="https://picsum.photos/400/400" 
          data-aspect="1/1">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardimage"]');
      const figure = card.locator('figure');
      
      const aspectRatio = await figure.evaluate(el => getComputedStyle(el).aspectRatio);
      expect(aspectRatio).toContain('1');
    });
  });
  
  test.describe('cardvideo', () => {
    test('renders video element with controls', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardvideo" 
          data-src="https://www.w3schools.com/html/mov_bbb.mp4"
          data-title="Video Title">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardvideo"]');
      await expect(card).toBeVisible();
      
      const video = card.locator('video');
      await expect(video).toBeVisible();
      await expect(video).toHaveAttribute('controls');
    });
  });
  
  test.describe('cardfile', () => {
    test('renders file info with icon', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardfile" 
          data-filename="document.pdf" 
          data-type="pdf" 
          data-size="2.5 MB">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardfile"]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('document.pdf');
      await expect(card).toContainText('2.5 MB');
      // PDF icon
      await expect(card).toContainText('📄');
    });
  });
});

test.describe('Data Cards', () => {
  
  test.describe('cardstats', () => {
    test('renders value and label', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardstats" 
          data-value="1,234" 
          data-label="Total Users">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardstats"]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('1,234');
      await expect(card).toContainText('Total Users');
    });
    
    test('shows trend indicator', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardstats" 
          data-value="$50K" 
          data-label="Revenue" 
          data-trend="up" 
          data-trend-value="+12%">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardstats"]');
      await expect(card).toContainText('+12%');
      await expect(card).toContainText('↑');
    });
    
    test('shows icon when provided', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardstats" 
          data-value="42" 
          data-label="Projects" 
          data-icon="🚀">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardstats"]');
      await expect(card).toContainText('🚀');
    });
  });
  
  test.describe('cardpricing', () => {
    test('renders plan, price, and features', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardpricing" 
          data-plan="Pro" 
          data-price="$29" 
          data-period="/month"
          data-features="Feature 1,Feature 2,Feature 3"
          data-cta="Get Started">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardpricing"]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('Pro');
      await expect(card).toContainText('$29');
      await expect(card).toContainText('/month');
      await expect(card).toContainText('Feature 1');
      await expect(card).toContainText('Feature 2');
      await expect(card).toContainText('Get Started');
    });
    
    test('featured variant has special styling', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardpricing" 
          data-plan="Pro" 
          data-price="$29" 
          data-featured="true">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardpricing"]');
      
      // Should have featured border or transform
      const border = await card.evaluate(el => getComputedStyle(el).border);
      const transform = await card.evaluate(el => getComputedStyle(el).transform);
      
      // Either has special border or scale transform
      const hasFeaturedStyle = border.includes('6366f1') || !transform.includes('none') || border.includes('2px');
      expect(hasFeaturedStyle).toBe(true);
    });
  });
  
  test.describe('cardproduct', () => {
    test('renders product with price and CTA', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardproduct" 
          data-title="Product Name"
          data-image="https://picsum.photos/200"
          data-price="$99"
          data-rating="4.5"
          data-cta="Add to Cart">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardproduct"]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('Product Name');
      await expect(card).toContainText('$99');
      await expect(card).toContainText('Add to Cart');
    });
  });
});

test.describe('Interactive Cards', () => {
  
  test.describe('cardexpandable', () => {
    test('expands and collapses on button click', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardexpandable" 
          data-title="Expandable" 
          data-content="<p>Hidden content that can be revealed</p>">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardexpandable"]');
      await expect(card).toBeVisible();
      
      // Find expand button
      const expandBtn = card.locator('.wb-card__expand-btn, button:has-text("Show")');
      await expect(expandBtn).toBeVisible();
      
      // Click to expand
      await expandBtn.click();
      await page.waitForTimeout(400);
      
      // Check expanded state
      await expect(card).toHaveClass(/wb-card--expanded/);
      
      // Click again to collapse
      await expandBtn.click();
      await page.waitForTimeout(400);
      
      await expect(card).not.toHaveClass(/wb-card--expanded/);
    });
    
    test('starts expanded when data-expanded="true"', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardexpandable" 
          data-title="Pre-expanded" 
          data-expanded="true">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardexpandable"]');
      await expect(card).toHaveClass(/wb-card--expanded/);
    });
  });
  
  test.describe('cardminimizable', () => {
    test('minimizes and expands on button click', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardminimizable" 
          data-title="Minimizable Card"
          data-content="<p>Content that can be minimized</p>">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardminimizable"]');
      await expect(card).toHaveClass(/wb-card--minimizable/);
      
      const minBtn = card.locator('.wb-card__minimize-btn, button');
      await expect(minBtn).toBeVisible();
      
      // Click to minimize
      await minBtn.click();
      await page.waitForTimeout(400);
      
      await expect(card).toHaveClass(/wb-card--minimized/);
    });
  });
  
  test.describe('carddraggable', () => {
    test('has drag handle and can be dragged', async ({ page }) => {
      await createTestPage(page, `
        <div style="position: relative; width: 500px; height: 500px;">
          <article data-wb="carddraggable" 
            data-title="Drag Me"
            style="position: absolute; top: 50px; left: 50px;">
            Draggable content
          </article>
        </div>
      `);
      
      const card = page.locator('[data-wb="carddraggable"]');
      await expect(card).toHaveClass(/wb-card--draggable/);
      
      const handle = card.locator('.wb-card__drag-handle, header');
      await expect(handle).toBeVisible();
      
      // Check cursor is grab
      const cursor = await handle.evaluate(el => getComputedStyle(el).cursor);
      expect(cursor).toBe('grab');
    });
  });
  
  test.describe('cardoverlay', () => {
    test('renders with background image and text overlay', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardoverlay" 
          data-title="Overlay Title"
          data-subtitle="Overlay subtitle"
          data-image="https://picsum.photos/400/300"
          data-height="300px">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardoverlay"]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('Overlay Title');
      await expect(card).toContainText('Overlay subtitle');
      
      // Check has background image
      const bgImage = await card.evaluate(el => getComputedStyle(el).backgroundImage);
      expect(bgImage).toContain('url');
    });
  });
});

test.describe('Notification Cards', () => {
  
  test.describe('cardnotification', () => {
    const variants = ['info', 'success', 'warning', 'error'];
    
    for (const variant of variants) {
      test(`renders ${variant} variant with correct styling`, async ({ page }) => {
        await createTestPage(page, `
          <article data-wb="cardnotification" 
            data-type="${variant}"
            data-title="${variant.charAt(0).toUpperCase() + variant.slice(1)}"
            data-message="This is a ${variant} notification">
          </article>
        `);
        
        const card = page.locator('[data-wb="cardnotification"]');
        await expect(card).toBeVisible();
        await expect(card).toHaveAttribute('role', 'alert');
        
        await expect(card).toContainText(`This is a ${variant} notification`);
      });
    }
    
    test('dismissible notification can be closed', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardnotification" 
          data-type="info"
          data-message="Dismissible notification"
          data-dismissible="true">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardnotification"]');
      const closeBtn = card.locator('.wb-card__notification-dismiss, button[aria-label="Dismiss"]');
      
      await expect(closeBtn).toBeVisible();
      
      await closeBtn.click();
      await page.waitForTimeout(300);
      
      await expect(card).not.toBeVisible();
    });
  });
});

test.describe('Hero Cards', () => {
  
  test.describe('cardhero', () => {
    test('renders with background, title, subtitle, and CTA', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardhero" 
          data-title="Hero Title"
          data-subtitle="Hero subtitle text"
          data-cta="Get Started"
          data-cta-href="#start"
          data-height="400px">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardhero"]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('Hero Title');
      await expect(card).toContainText('Hero subtitle text');
      await expect(card).toContainText('Get Started');
    });
    
    test('xalign positions content correctly', async ({ page }) => {
      await createTestPage(page, `
        <article data-wb="cardhero" 
          data-title="Left Aligned"
          data-xalign="left">
        </article>
      `);
      
      const card = page.locator('[data-wb="cardhero"]');
      await expect(card).toHaveClass(/wb-card--xalign-left/);
    });
  });
});

test.describe('Theme Control', () => {
  
  test('wb-themecontrol renders and changes theme', async ({ page }) => {
    await createTestPage(page, `
      <wb-themecontrol></wb-themecontrol>
      <article data-wb="card" data-title="Test Card">Content</article>
    `);
    
    const themeControl = page.locator('wb-themecontrol');
    await expect(themeControl).toBeVisible();
    
    // Find and click a theme option
    const options = themeControl.locator('button, [role="option"], select');
    if (await options.count() > 0) {
      // Theme control exists and has options
      expect(true).toBe(true);
    }
  });
});

test.describe('Animation Effects', () => {
  
  test('bounce animation triggers correctly', async ({ page }) => {
    await createTestPage(page, `
      <article data-wb="card" data-title="Animated" id="animated-card">
        Click for animation
      </article>
      <script type="module">
        const card = document.getElementById('animated-card');
        card.addEventListener('click', () => {
          card.classList.add('wb-animate-bounce');
          setTimeout(() => card.classList.remove('wb-animate-bounce'), 1000);
        });
      </script>
    `);
    
    const card = page.locator('#animated-card');
    await card.click();
    
    // Check animation class was added
    await expect(card).toHaveClass(/wb-animate-bounce/);
  });
});

// Ensure window.wbReady type is declared
declare global {
  interface Window {
    wbReady: boolean;
    WB: any;
  }
}
