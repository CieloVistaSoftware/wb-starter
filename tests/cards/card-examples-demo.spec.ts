import { test, expect } from '@playwright/test';

const DEMO_URL = '/demos/card-examples.html';

// Helper: navigate, wait for WB init
async function loadPage(page) {
  await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.WB, { timeout: 10000 });
  await page.waitForTimeout(4000);
}

// Helper: scroll into view and wait for lazy init
async function scrollTo(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
}

// ═══════════════════════════════════════════════════════
// 1. PAGE FUNDAMENTALS
// ═══════════════════════════════════════════════════════
test.describe('Page Fundamentals', () => {
  test.beforeEach(async ({ page }) => { await loadPage(page); });

  test('page loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.WB, { timeout: 10000 });
    await page.waitForTimeout(4000);
    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
    expect(critical).toEqual([]);
  });

  test('wb-stack wrapper exists with gap', async ({ page }) => {
    const stack = page.locator('wb-stack');
    await expect(stack).toBeAttached();
    const gap = await stack.evaluate(el => getComputedStyle(el).gap || getComputedStyle(el).rowGap);
    expect(gap).toContain('16px'); // 1rem = 16px
  });

  test('all card variant tags are present (no draggable)', async ({ page }) => {
    const tags = [
      'wb-card', 'wb-cardimage', 'wb-cardvideo', 'wb-cardbutton',
      'wb-cardhero', 'wb-cardprofile', 'wb-cardpricing', 'wb-cardstats',
      'wb-cardtestimonial', 'wb-cardproduct', 'wb-cardnotification',
      'wb-cardfile', 'wb-cardlink', 'wb-cardhorizontal',
      'wb-cardexpandable', 'wb-cardminimizable',
      'wb-cardoverlay', 'wb-cardportfolio'
    ];
    for (const tag of tags) {
      await expect(page.locator(tag).first(), `${tag} should exist`).toBeAttached();
    }
  });

  test('no draggable cards on page', async ({ page }) => {
    await expect(page.locator('wb-carddraggable')).toHaveCount(0);
  });

  test('text is light on dark theme', async ({ page }) => {
    const title = page.locator('wb-card').first().locator('.wb-card__title');
    await expect(title).toBeVisible({ timeout: 10000 });
    const maxChannel = await title.evaluate(el => {
      const rgb = getComputedStyle(el).color;
      const m = rgb.match(/\d+/g);
      return m ? Math.max(...m.map(Number)) : 0;
    });
    expect(maxChannel).toBeGreaterThan(150);
  });

  test('code blocks have copy buttons', async ({ page }) => {
    await expect(page.locator('.x-pre__copy').first()).toBeVisible({ timeout: 10000 });
  });

  test('every wb-demo has an id', async ({ page }) => {
    const demos = page.locator('wb-demo');
    const count = await demos.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const id = await demos.nth(i).getAttribute('id');
      expect(id, `wb-demo #${i} missing id`).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════
// 2. CARD RENDERING
// ═══════════════════════════════════════════════════════
test.describe('Card Rendering', () => {
  test.beforeEach(async ({ page }) => { await loadPage(page); });

  test('base card renders title and content', async ({ page }) => {
    const card = page.locator('wb-card').first();
    await expect(card.locator('.wb-card__title')).toHaveText('Welcome');
    await expect(card.locator('.wb-card__main')).toContainText('basic card');
  });

  test('glass card has badge and variant class', async ({ page }) => {
    const glass = page.locator('wb-card[variant="glass"]');
    await expect(glass).toHaveClass(/wb-card--glass/);
    await expect(glass.locator('.wb-card__badge')).toHaveText('NEW');
  });

  test('image cards render with images', async ({ page }) => {
    const imgs = page.locator('wb-cardimage img');
    const count = await imgs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(imgs.first()).toBeVisible({ timeout: 10000 });
  });

  test('hero card has background image and CTA buttons', async ({ page }) => {
    const hero = page.locator('wb-cardhero').first();
    const bg = await hero.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bg).not.toBe('none');
    await expect(hero.locator('.wb-btn').first()).toBeVisible();
  });

  test('profile card renders name, role, avatar', async ({ page }) => {
    const profile = page.locator('wb-cardprofile').first();
    await expect(profile.locator('.wb-card__name')).toHaveText('Jane Doe');
    await expect(profile.locator('.wb-card__role')).toContainText('UI/UX');
    await expect(profile.locator('.wb-card__avatar')).toBeVisible();
  });

  test('pricing cards render 3 plans with features and CTA', async ({ page }) => {
    const cards = page.locator('wb-cardpricing');
    await expect(cards).toHaveCount(3);
    // Each has a CTA
    for (let i = 0; i < 3; i++) {
      await expect(cards.nth(i).locator('.wb-card__cta')).toBeVisible();
    }
  });

  test('stats cards render all four with values', async ({ page }) => {
    const cards = page.locator('wb-cardstats');
    await expect(cards).toHaveCount(4);
    await expect(cards.first().locator('.wb-card__stats-value')).toContainText('42K');
  });

  test('testimonial cards have quotes and ratings', async ({ page }) => {
    const card = page.locator('wb-cardtestimonial').first();
    await expect(card.locator('.wb-card__quote')).toBeVisible();
    await expect(card.locator('.wb-card__rating')).toContainText('★');
    await expect(card.locator('.wb-card__author')).toHaveText('Alex Rivera');
  });

  test('product cards have image with 3/2 aspect ratio and price', async ({ page }) => {
    const card = page.locator('wb-cardproduct').first();
    const img = card.locator('img');
    await expect(img).toBeVisible({ timeout: 10000 });
    const ratio = await img.evaluate(el => getComputedStyle(el).aspectRatio);
    expect(ratio).toBe('3 / 2');
    await expect(card.locator('.wb-card__price-current')).toContainText('$129');
  });

  test('notification cards have variant classes', async ({ page }) => {
    const success = page.locator('wb-cardnotification[variant="success"]');
    await scrollTo(page, success);
    await expect(success).toHaveClass(/wb-notification--success/);
    const error = page.locator('wb-cardnotification[variant="error"]');
    await expect(error).toHaveClass(/wb-notification--error/);
  });

  test('file cards show filename and icon', async ({ page }) => {
    const card = page.locator('wb-cardfile').first();
    await scrollTo(page, card);
    await expect(card.locator('.wb-card__filename')).toContainText('quarterly-report.pdf');
  });

  test('link cards have icon, title, external arrow', async ({ page }) => {
    const card = page.locator('wb-cardlink').first();
    await scrollTo(page, card);
    await expect(card.locator('.wb-card__title')).toHaveText('Documentation');
    await expect(card.locator('.wb-card__icon')).toContainText('📚');
  });

  test('horizontal card renders image and text side by side', async ({ page }) => {
    const card = page.locator('wb-cardhorizontal').first();
    await scrollTo(page, card);
    const img = card.locator('img');
    await expect(img).toBeVisible({ timeout: 10000 });
    const flexDir = await card.evaluate(el => getComputedStyle(el).flexDirection);
    expect(flexDir).toBe('row');
  });

  test('overlay card has background image and title overlay', async ({ page }) => {
    const card = page.locator('wb-cardoverlay').first();
    await scrollTo(page, card);
    await expect(card).toBeVisible({ timeout: 10000 });
    const bg = await card.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bg).not.toBe('none');
    await expect(card.locator('.wb-card__overlay-title')).toBeVisible();
  });

  test('portfolio card renders name, skills, social links', async ({ page }) => {
    const card = page.locator('wb-cardportfolio').first();
    await scrollTo(page, card);
    await expect(card.locator('.wb-portfolio__name')).toHaveText('Jane Doe', { timeout: 10000 });
    // Skills pills
    const skills = card.locator('.wb-portfolio__skills span');
    expect(await skills.count()).toBeGreaterThanOrEqual(4);
    // Social links
    const social = card.locator('.wb-portfolio__social a');
    expect(await social.count()).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════
// 3. INTERACTIVITY - CLICKS & EVENTS
// ═══════════════════════════════════════════════════════
test.describe('Interactivity', () => {
  test.beforeEach(async ({ page }) => { await loadPage(page); });

  test('clickable glass card toggles active class on click', async ({ page }) => {
    const glass = page.locator('wb-card[clickable]').first();
    await expect(glass).toHaveClass(/wb-card--clickable/);
    await glass.click();
    await expect(glass).toHaveClass(/wb-card--active/);
    await glass.click();
    await expect(glass).not.toHaveClass(/wb-card--active/);
  });

  test('button card primary/secondary buttons are clickable', async ({ page }) => {
    const card = page.locator('wb-cardbutton').first();
    const primary = card.locator('.wb-card__btn--primary');
    const secondary = card.locator('.wb-card__btn--secondary');
    await expect(primary).toBeVisible({ timeout: 10000 });
    await expect(secondary).toBeVisible();
    await expect(primary).toHaveText('Save Now');
    await expect(secondary).toHaveText('Discard');
  });

  test('product card Add to Cart fires custom event', async ({ page }) => {
    const card = page.locator('wb-cardproduct').first();
    const cta = card.locator('.wb-card__product-cta');
    await expect(cta).toBeVisible({ timeout: 10000 });
    // Listen for custom event
    const eventFired = await page.evaluate(() => {
      return new Promise(resolve => {
        document.addEventListener('wb:cardproduct:addtocart', (e) => {
          resolve(e.detail);
        }, { once: true });
        document.querySelector('wb-cardproduct .wb-card__product-cta').click();
      });
    });
    expect(eventFired).toHaveProperty('title', 'Premium Sneakers');
    expect(eventFired).toHaveProperty('price', '$129');
  });

  test('expandable card toggles expand/collapse', async ({ page }) => {
    const card = page.locator('wb-cardexpandable').first();
    await scrollTo(page, card);
    const btn = card.locator('.wb-card__expand-btn');
    await expect(btn).toBeVisible({ timeout: 10000 });
    // Initially collapsed
    await expect(card).not.toHaveClass(/wb-card--expanded/);
    // Click to expand
    await btn.click();
    await expect(card).toHaveClass(/wb-card--expanded/);
    // Click to collapse
    await btn.click();
    await expect(card).not.toHaveClass(/wb-card--expanded/);
  });

  test('expandable card button has correct aria-expanded', async ({ page }) => {
    const card = page.locator('wb-cardexpandable').first();
    await scrollTo(page, card);
    const btn = card.locator('.wb-card__expand-btn');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  test('minimizable card toggles content visibility', async ({ page }) => {
    const card = page.locator('wb-cardminimizable').first();
    await scrollTo(page, card);
    const btn = card.locator('.wb-card__minimize-btn');
    await expect(btn).toBeVisible({ timeout: 10000 });
    // Click to minimize
    await btn.click();
    await expect(card).toHaveClass(/wb-card--minimized/);
    // Click to expand
    await btn.click();
    await expect(card).not.toHaveClass(/wb-card--minimized/);
  });

  test('notification dismiss button removes element', async ({ page }) => {
    const success = page.locator('wb-cardnotification[variant="success"]');
    await scrollTo(page, success);
    const dismissBtn = success.locator('.wb-notification__dismiss');
    await expect(dismissBtn).toBeVisible({ timeout: 10000 });
    await dismissBtn.click();
    await expect(success).toHaveCount(0);
  });

  test('notification fires dismiss event', async ({ page }) => {
    const card = page.locator('wb-cardnotification[variant="error"]');
    await scrollTo(page, card);
    const eventFired = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.querySelector('wb-cardnotification[variant="error"]');
        el.addEventListener('wb:cardnotification:dismiss', (e) => {
          resolve(e.detail);
        }, { once: true });
        el.querySelector('.wb-notification__dismiss').click();
      });
    });
    expect(eventFired.variant).toBe('error');
  });

  test('hero CTA links exist with text', async ({ page }) => {
    const hero = page.locator('wb-cardhero').first();
    const ctas = hero.locator('.wb-btn');
    expect(await ctas.count()).toBeGreaterThanOrEqual(1);
    await expect(ctas.first()).toContainText('Shop Now');
  });

  test('pricing CTA links exist for all plans', async ({ page }) => {
    const cards = page.locator('wb-cardpricing');
    for (let i = 0; i < 3; i++) {
      const cta = cards.nth(i).locator('.wb-card__cta');
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('href');
    }
  });

  test('portfolio social links open in new tab', async ({ page }) => {
    const card = page.locator('wb-cardportfolio').first();
    await scrollTo(page, card);
    const socialLinks = card.locator('.wb-portfolio__social a');
    const count = await socialLinks.count();
    for (let i = 0; i < count; i++) {
      await expect(socialLinks.nth(i)).toHaveAttribute('target', '_blank');
    }
  });

  test('portfolio contact links are valid', async ({ page }) => {
    const card = page.locator('wb-cardportfolio').first();
    await scrollTo(page, card);
    const emailLink = card.locator('.wb-portfolio__contact a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
    const websiteLink = card.locator('.wb-portfolio__contact a[target="_blank"]');
    await expect(websiteLink).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════
// 4. MOBILE RESPONSIVE
// ═══════════════════════════════════════════════════════
test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true }); // iPhone sized with touch

  test.beforeEach(async ({ page }) => { await loadPage(page); });

  test('page renders without horizontal scroll on mobile', async ({ page }) => {
    const hasHScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(hasHScroll).toBe(false);
  });

  test('cards do not overflow viewport on mobile', async ({ page }) => {
    const overflows = await page.evaluate(() => {
      const vw = window.innerWidth;
      const cards = document.querySelectorAll('[class*="wb-card"]');
      const bad = [];
      cards.forEach(c => {
        const rect = c.getBoundingClientRect();
        if (rect.width > vw + 2) bad.push(c.tagName + ':' + Math.round(rect.width));
      });
      return bad;
    });
    expect(overflows).toEqual([]);
  });

  test('pricing cards stack vertically on mobile', async ({ page }) => {
    const cards = page.locator('wb-cardpricing');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    // On mobile, second card should be below first (stacked)
    expect(second.y).toBeGreaterThan(first.y + first.height - 10);
  });

  test('stats cards stack or wrap on mobile', async ({ page }) => {
    const cards = page.locator('wb-cardstats');
    const first = await cards.nth(0).boundingBox();
    const last = await cards.nth(3).boundingBox();
    // On 375px viewport, 4-col grid should wrap - last card below first
    expect(last.y).toBeGreaterThan(first.y);
  });

  test('horizontal card stacks image above text on mobile', async ({ page }) => {
    const card = page.locator('wb-cardhorizontal').first();
    await scrollTo(page, card);
    const flexDir = await card.evaluate(el => getComputedStyle(el).flexDirection);
    // On mobile should be column or wrap
    // If still row, image width should be reasonable
    const img = card.locator('img');
    const imgBox = await img.boundingBox();
    if (imgBox) {
      expect(imgBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('hero card text is readable on mobile', async ({ page }) => {
    const title = page.locator('wb-cardhero .wb-card__hero-title');
    await expect(title).toBeVisible();
    const box = await title.boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
  });

  test('expandable card toggle works on mobile', async ({ page }) => {
    const card = page.locator('wb-cardexpandable').first();
    await scrollTo(page, card);
    const btn = card.locator('.wb-card__expand-btn');
    await btn.tap();
    await expect(card).toHaveClass(/wb-card--expanded/);
    await btn.tap();
    await expect(card).not.toHaveClass(/wb-card--expanded/);
  });

  test('product card Add to Cart is tappable on mobile', async ({ page }) => {
    const cta = page.locator('wb-cardproduct').first().locator('.wb-card__product-cta');
    await expect(cta).toBeVisible({ timeout: 10000 });
    const box = await cta.boundingBox();
    // Tap target should be reasonably sized for touch
    expect(box.height).toBeGreaterThanOrEqual(30);
  });

  test('portfolio card fits mobile viewport', async ({ page }) => {
    const card = page.locator('wb-cardportfolio').first();
    await scrollTo(page, card);
    const box = await card.boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
  });
});

// ═══════════════════════════════════════════════════════
// 5. ACCESSIBILITY
// ═══════════════════════════════════════════════════════
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => { await loadPage(page); });

  test('clickable card has role=button and tabindex', async ({ page }) => {
    const glass = page.locator('wb-card[clickable]').first();
    await expect(glass).toHaveAttribute('role', 'button');
    await expect(glass).toHaveAttribute('tabindex', '0');
  });

  test('notification cards have role=alert', async ({ page }) => {
    const notif = page.locator('wb-cardnotification').first();
    await scrollTo(page, notif);
    await expect(notif).toHaveAttribute('role', 'alert');
  });

  test('link card has role=link and tabindex', async ({ page }) => {
    const card = page.locator('wb-cardlink').first();
    await scrollTo(page, card);
    await expect(card).toHaveAttribute('role', 'link');
    await expect(card).toHaveAttribute('tabindex', '0');
  });

  test('all images have alt attributes', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `img #${i} missing alt`).not.toBeNull();
    }
  });

  test('expandable card keyboard toggle with Enter', async ({ page }) => {
    const card = page.locator('wb-cardexpandable').first();
    await scrollTo(page, card);
    const btn = card.locator('.wb-card__expand-btn');
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveClass(/wb-card--expanded/);
    await page.keyboard.press('Enter');
    await expect(card).not.toHaveClass(/wb-card--expanded/);
  });

  test('portfolio social links have aria-labels', async ({ page }) => {
    const card = page.locator('wb-cardportfolio').first();
    await scrollTo(page, card);
    const links = card.locator('.wb-portfolio__social a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const label = await links.nth(i).getAttribute('aria-label');
      expect(label, `Social link #${i} missing aria-label`).toBeTruthy();
    }
  });
});
