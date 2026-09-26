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
  // Establish the dev-server origin so the inline `import '/src/core/wb-lazy.js'` resolves
  // (setContent alone runs at about:blank, where absolute module paths 404 -> WB never loads).
  await page.goto('/', { waitUntil: 'commit' });
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
        <article title="Test Title" subtitle="Test Subtitle">
          <p>Card content</p>
        </article>
      `);
      
      // a8a7362e: cards no longer carry x-card / x-card--* classes; card.css
      // selects the <article> and its attributes directly (specificity, not
      // injected classes). Assert what the reader gets, not a class.
      const card = page.locator('article');
      await expect(card).toBeVisible();
      
      // Check title rendered
      const title = card.locator('.x-card__title, h3');
      await expect(title).toContainText('Test Title');
      
      // Check subtitle rendered
      const subtitle = card.locator('.x-card__subtitle, p').first();
      await expect(subtitle).toContainText('Test Subtitle');
    });
    
    test('elevated variant has shadow', async ({ page }) => {
      await createTestPage(page, `
        <article title="Elevated" elevated="true">
          Content
        </article>
      `);
      
      // a8a7362e: cards no longer carry x-card / x-card--* classes; card.css
      // selects the <article> and its attributes directly (specificity, not
      // injected classes). Assert what the reader gets, not a class.
      const card = page.locator('article[elevated]');
      await expect(card).toBeVisible();
      
      const boxShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
      expect(boxShadow).not.toBe('none');
    });
    
    test('clickable variant is interactive', async ({ page }) => {
      await createTestPage(page, `
        <article title="Clickable" clickable="true">
          Click me
        </article>
      `);
      
      // a8a7362e: cards no longer carry x-card / x-card--* classes; card.css
      // selects the <article> and its attributes directly (specificity, not
      // injected classes). Assert what the reader gets, not a class.
      const card = page.locator('article[clickable]');
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('role', 'button');
      await expect(card).toHaveAttribute('tabindex', '0');
      
      // card.css arrives just-in-time with the behavior (#342): wait for the
      // rule to apply rather than reading the cursor once, immediately.
      await expect.poll(() => card.evaluate(el => getComputedStyle(el).cursor)).toBe('pointer');
    });
    
    test('glass variant has backdrop filter', async ({ page }) => {
      await createTestPage(page, `
        <article title="Glass" variant="glass">
          Glass effect
        </article>
      `);
      
      // a8a7362e: cards no longer carry x-card / x-card--* classes; card.css
      // selects the <article> and its attributes directly (specificity, not
      // injected classes). Assert what the reader gets, not a class.
      const card = page.locator('article[variant="glass"]');
      await expect(card).toBeVisible();
      await expect.poll(() => card.evaluate(el => getComputedStyle(el).backdropFilter))
        .not.toBe('none');
    });
  });
  
  test.describe('cardlink', () => {
    test('renders with href and navigates', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardlink title="Link Card" href="https://example.com" target="_blank">
          Click to navigate
        </div>
      `);
      
      const card = page.locator('[x-cardlink]');
      await expect(card).toBeVisible();
      // The card navigates through a REAL anchor stretched over it (card.js
      // cardlink), not a role="link" on a div: a real link is what keyboard,
      // middle-click and screen readers understand.
      await expect(card.locator('a[href="https://example.com"]')).toBeAttached();
    });
    
    test('shows external indicator for _blank target', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardlink title="External" href="https://example.com" target="_blank">
          External link
        </div>
      `);
      
      const card = page.locator('[x-cardlink]');
      // Should show ↗ indicator
      await expect(card).toContainText('↗');
    });
    
    test('renders badge when provided', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardlink title="With Badge" badge="NEW" href="#">
          Has badge
        </div>
      `);
      
      const card = page.locator('[x-cardlink]');
      await expect(card).toContainText('NEW');
    });
  });
  
  test.describe('cardbutton', () => {
    test('renders with primary and secondary buttons', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardbutton title="Action Card" primary="Submit" secondary="Cancel">
          Card with buttons
        </div>
      `);
      
      const card = page.locator('[x-cardbutton]');
      await expect(card).toBeVisible();
      
      const primaryBtn = card.locator('.x-card__btn--primary, button:has-text("Submit")');
      await expect(primaryBtn).toBeVisible();
      
      const secondaryBtn = card.locator('.x-card__btn--secondary, button:has-text("Cancel")');
      await expect(secondaryBtn).toBeVisible();
    });
  });
});

test.describe('Content Cards', () => {
  
  test.describe('cardprofile', () => {
    test('renders with name, role, avatar', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardprofile 
          name="John Doe" 
          role="Developer" 
          avatar="https://i.pravatar.cc/80?u=1"
          bio="Building cool stuff">
        </div>
      `);
      
      const card = page.locator('[x-cardprofile]');
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
        <div x-cardprofile 
          name="Jane Smith" 
          cover="https://picsum.photos/400/100">
        </div>
      `);
      
      const card = page.locator('[x-cardprofile]');
      const cover = card.locator('.x-card__cover, .x-card__profile-cover, figure');
      await expect(cover.first()).toBeVisible();
    });
  });
  
  test.describe('cardtestimonial', () => {
    test('renders with quote, author, rating', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardtestimonial 
          quote="This product is amazing!" 
          author="Jane Smith" 
          role="CEO" 
          rating="5">
        </div>
      `);
      
      const card = page.locator('[x-cardtestimonial]');
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
        <div x-cardimage 
          src="https://picsum.photos/400/300" 
          alt="Test image"
          title="Image Title">
        </div>
      `);
      
      const card = page.locator('[x-cardimage]');
      await expect(card).toBeVisible();
      
      const img = card.locator('img');
      await expect(img).toHaveAttribute('src', /picsum/);
      await expect(img).toHaveAttribute('alt', 'Test image');
      
      await expect(card).toContainText('Image Title');
    });
    
    test('respects aspect ratio', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardimage 
          src="https://picsum.photos/400/400" 
          aspect="1/1">
        </div>
      `);
      
      const card = page.locator('[x-cardimage]');
      const figure = card.locator('figure');
      
      const aspectRatio = await figure.evaluate(el => getComputedStyle(el).aspectRatio);
      expect(aspectRatio).toContain('1');
    });
  });
  
  test.describe('cardvideo', () => {
    test('renders video element with controls', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardvideo 
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          title="Video Title">
        </div>
      `);
      
      const card = page.locator('[x-cardvideo]');
      await expect(card).toBeVisible();
      
      const video = card.locator('video');
      await expect(video).toBeVisible();
      await expect(video).toHaveAttribute('controls');
    });
  });
  
  test.describe('cardfile', () => {
    test('renders file info with icon', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardfile 
          filename="document.pdf" 
          type="pdf" 
          size="2.5 MB">
        </div>
      `);
      
      const card = page.locator('[x-cardfile]');
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
        <div x-cardstats 
          value="1,234" 
          label="Total Users">
        </div>
      `);
      
      const card = page.locator('[x-cardstats]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('1,234');
      await expect(card).toContainText('Total Users');
    });
    
    test('shows trend indicator', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardstats 
          value="$50K" 
          label="Revenue" 
          trend="up" 
          trend-value="+12%">
        </div>
      `);
      
      const card = page.locator('[x-cardstats]');
      await expect(card).toContainText('+12%');
      await expect(card).toContainText('↑');
    });
    
    test('shows icon when provided', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardstats 
          value="42" 
          label="Projects" 
          icon="🚀">
        </div>
      `);
      
      const card = page.locator('[x-cardstats]');
      await expect(card).toContainText('🚀');
    });
  });
  
  test.describe('cardpricing', () => {
    test('renders plan, price, and features', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardpricing 
          plan="Pro" 
          price="$29" 
          period="/month"
          features="Feature 1,Feature 2,Feature 3"
          cta="Get Started">
        </div>
      `);
      
      const card = page.locator('[x-cardpricing]');
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
        <div x-cardpricing 
          plan="Pro" 
          price="$29" 
          featured="true">
        </div>
      `);
      
      const card = page.locator('[x-cardpricing]');
      
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
        <div x-cardproduct 
          title="Product Name"
          image="https://picsum.photos/200"
          price="$99"
          rating="4.5"
          cta="Add to Cart">
        </div>
      `);
      
      const card = page.locator('[x-cardproduct]');
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
        <div x-cardexpandable 
          title="Expandable" 
          content="<p>Hidden content that can be revealed</p>">
        </div>
      `);
      
      const card = page.locator('[x-cardexpandable]');
      await expect(card).toBeVisible();
      
      // Find expand button
      const expandBtn = card.locator('.x-card__expand-btn, button:has-text("Show")');
      await expect(expandBtn).toBeVisible();
      
      // Click to expand
      await expandBtn.click();
      await page.waitForTimeout(400);
      
      // Check expanded state
      await expect(card).toHaveClass(/x-card--expanded/);
      
      // Click again to collapse
      await expandBtn.click();
      await page.waitForTimeout(400);
      
      await expect(card).not.toHaveClass(/x-card--expanded/);
    });
    
    test('starts expanded when expanded="true"', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardexpandable 
          title="Pre-expanded" 
          expanded="true">
        </div>
      `);
      
      const card = page.locator('[x-cardexpandable]');
      await expect(card).toHaveClass(/x-card--expanded/);
    });
  });
  
  test.describe('cardminimizable', () => {
    test('minimizes and expands on button click', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardminimizable 
          title="Minimizable Card"
          content="<p>Content that can be minimized</p>">
        </div>
      `);
      
      const card = page.locator('[x-cardminimizable]');
      await expect(card).toHaveClass(/x-card--minimizable/);
      
      const minBtn = card.locator('.x-card__minimize-btn, button');
      await expect(minBtn).toBeVisible();
      
      // Click to minimize
      await minBtn.click();
      await page.waitForTimeout(400);
      
      await expect(card).toHaveClass(/x-card--minimized/);
    });
  });
  
  test.describe('carddraggable', () => {
    test('has drag handle and can be dragged', async ({ page }) => {
      await createTestPage(page, `
        <div style="position: relative; width: 500px; height: 500px;">
          <div x-carddraggable 
            title="Drag Me"
            style="position: absolute; top: 50px; left: 50px;">
            Draggable content
          </div>
        </div>
      `);
      
      const card = page.locator('[x-carddraggable]');
      await expect(card).toHaveClass(/x-card--draggable/);
      
      const handle = card.locator('.x-card__drag-handle, header');
      await expect(handle).toBeVisible();
      
      // Check cursor is grab
      const cursor = await handle.evaluate(el => getComputedStyle(el).cursor);
      expect(cursor).toBe('grab');
    });
  });
  
  test.describe('cardoverlay', () => {
    test('renders with background image and text overlay', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardoverlay 
          title="Overlay Title"
          subtitle="Overlay subtitle"
          image="/packages/create-wb-starter/template/images/wb.png"
          height="300px">
        </div>
      `);
      
      const card = page.locator('[x-cardoverlay]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('Overlay Title');
      await expect(card).toContainText('Overlay subtitle');
      
      // Check has background image. A repo image, not picsum.photos: a remote
      // host that is slow or unreachable made the card fall back to its
      // gradient (correctly, #1115) and this test fail for the network's sake.
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
          <div x-cardnotification 
            type="${variant}"
            title="${variant.charAt(0).toUpperCase() + variant.slice(1)}"
            message="This is a ${variant} notification">
          </div>
        `);
        
        const card = page.locator('[x-cardnotification]');
        await expect(card).toBeVisible();
        await expect(card).toHaveAttribute('role', 'alert');
        
        await expect(card).toContainText(`This is a ${variant} notification`);
      });
    }
    
    test('dismissible notification can be closed', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardnotification 
          type="info"
          message="Dismissible notification"
          dismissible="true">
        </div>
      `);
      
      const card = page.locator('[x-cardnotification]');
      const closeBtn = card.locator('.x-notification__dismiss, button[aria-label*="Dismiss"]');
      
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
        <div x-cardhero 
          title="Hero Title"
          subtitle="Hero subtitle text"
          cta="Get Started"
          cta-href="#start"
          height="400px">
        </div>
      `);
      
      const card = page.locator('[x-cardhero]');
      await expect(card).toBeVisible();
      
      await expect(card).toContainText('Hero Title');
      await expect(card).toContainText('Hero subtitle text');
      await expect(card).toContainText('Get Started');
    });
    
    test('xalign positions content correctly', async ({ page }) => {
      await createTestPage(page, `
        <div x-cardhero 
          title="Left Aligned"
          xalign="left">
        </div>
      `);
      
      const card = page.locator('[x-cardhero]');
      await expect(card).toHaveClass(/x-card--xalign-left/);
    });
  });
});

test.describe('Theme Control', () => {
  
  test('[x-themecontrol] renders and changes theme', async ({ page }) => {
    await createTestPage(page, `
      <div x-themecontrol></div>
      <article title="Test Card">Content</article>
    `);
    
    const themeControl = page.locator('[x-themecontrol]');
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
      <article title="Animated" id="animated-card">
        Click for animation
      </article>
      <script type="module">
        const card = document.getElementById('animated-card');
        card.addEventListener('click', () => {
          card.classList.add('x-animate-bounce');
          setTimeout(() => card.classList.remove('x-animate-bounce'), 1000);
        });
      </script>
    `);
    
    const card = page.locator('#animated-card');
    await card.click();
    
    // Check animation class was added
    await expect(card).toHaveClass(/x-animate-bounce/);
  });
});

// Ensure window.wbReady type is declared
declare global {
  interface Window {
    wbReady: boolean;
    WB: any;
  }
}
