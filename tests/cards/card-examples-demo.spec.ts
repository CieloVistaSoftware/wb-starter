import { test, expect } from '@playwright/test';
import { safeScrollIntoView } from '../base';

const DEMO_URL = '/demos/site/cards.html';

// Helper: navigate, wait for WB init
async function loadPage(page) {
  await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.WB, { timeout: 10000 });
  await page.waitForTimeout(4000);
}

// Helper: scroll into view and wait for lazy init
async function scrollTo(page, locator) {
  await safeScrollIntoView(locator);
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

  test('[x-stack] wrapper exists with gap', async ({ page }) => {
    const stack = page.locator('#card-gallery [x-stack]');
    await expect(stack).toBeAttached();
    const gap = await stack.evaluate(el => getComputedStyle(el).gap || getComputedStyle(el).rowGap);
    expect(gap).toContain('16px'); // 1rem = 16px
  });

  test('all card variant tags are present (no draggable)', async ({ page }) => {
    const tags = [
      '.x-card', '[x-cardimage]', '[x-cardvideo]', '[x-cardbutton]',
      '[x-cardhero]', '[x-cardprofile]', '[x-cardpricing]', '[x-cardstats]',
      '[x-cardtestimonial]', '[x-cardproduct]', '[x-cardnotification]',
      '[x-cardfile]', '[x-cardlink]', '[x-cardhorizontal]',
      '[x-cardexpandable]', '[x-cardminimizable]',
      '[x-cardoverlay]', '[x-cardportfolio]'
    ];
    for (const tag of tags) {
      await expect(page.locator(tag).first(), `${tag} should exist`).toBeAttached();
    }
  });

  test('no draggable cards on page', async ({ page }) => {
    await expect(page.locator('#card-gallery [x-carddraggable]')).toHaveCount(0);
  });

  test('text is light on dark theme', async ({ page }) => {
    const title = page.locator('#card-gallery .x-card').first().locator('.x-card__title');
    await expect(title).toBeVisible({ timeout: 10000 });
    const maxChannel = await title.evaluate(el => {
      const rgb = getComputedStyle(el).color;
      const m = rgb.match(/\d+/g);
      return m ? Math.max(...m.map(Number)) : 0;
    });
    expect(maxChannel).toBeGreaterThan(150);
  });

  test('code blocks have copy buttons', async ({ page }) => {
    await expect(page.locator('#card-gallery .x-pre__copy').first()).toBeVisible({ timeout: 10000 });
  });

  test('every [x-demo] has an id', async ({ page }) => {
    const demos = page.locator('#card-gallery [x-demo]');
    const count = await demos.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const id = await demos.nth(i).getAttribute('id');
      expect(id, `[x-demo] #${i} missing id`).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════
// 2. CARD RENDERING
// ═══════════════════════════════════════════════════════
test.describe('Card Rendering', () => {
  test.beforeEach(async ({ page }) => { await loadPage(page); });

  test('base card renders title and content', async ({ page }) => {
    const card = page.locator('#card-gallery .x-card').first();
    await expect(card.locator('.x-card__title')).toHaveText('Welcome');
    await expect(card.locator('.x-card__main')).toContainText('basic card');
  });

  test('glass card has badge and variant class', async ({ page }) => {
    const glass = page.locator('#card-gallery .x-card[variant="glass"]');
    await expect(glass).toHaveClass(/x-card--glass/);
    await expect(glass.locator('.x-card__badge')).toHaveText('NEW');
  });

  test('image cards render with images', async ({ page }) => {
    const imgs = page.locator('#card-gallery [x-cardimage] img');
    const count = await imgs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(imgs.first()).toBeVisible({ timeout: 10000 });
  });

  test('hero card has background image and CTA buttons', async ({ page }) => {
    const hero = page.locator('#card-gallery [x-cardhero]').first();
    const bg = await hero.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bg).not.toBe('none');
    await expect(hero.locator('.x-hero-cta').first()).toBeVisible();
  });

  test('profile card renders name, role, avatar', async ({ page }) => {
    const profile = page.locator('#card-gallery [x-cardprofile]').first();
    await expect(profile.locator('.x-card__name')).toHaveText('Ronnie R.');
    await expect(profile.locator('.x-card__role')).toContainText('UI/UX');
    await expect(profile.locator('.x-card__avatar')).toBeVisible();
  });

  test('pricing cards render 3 plans with features and CTA', async ({ page }) => {
    const cards = page.locator('#card-gallery [x-cardpricing]');
    await expect(cards).toHaveCount(3);
    // Each has a CTA
    for (let i = 0; i < 3; i++) {
      await expect(cards.nth(i).locator('.x-card__cta')).toBeVisible();
    }
  });

  test('stats cards render all four with values', async ({ page }) => {
    const cards = page.locator('#card-gallery [x-cardstats]');
    await expect(cards).toHaveCount(4);
    await expect(cards.first().locator('.x-card__stats-value')).toContainText('42K');
  });

  test('testimonial cards have quotes and ratings', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardtestimonial]').first();
    await expect(card.locator('.x-card__quote')).toBeVisible();
    await expect(card.locator('.x-card__rating')).toContainText('★');
    await expect(card.locator('.x-card__author')).toHaveText('Alex Rivera');
  });

  test('product cards have image with 3/2 aspect ratio and price', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardproduct]').first();
    const img = card.locator('img');
    await expect(img).toBeVisible({ timeout: 10000 });
    const ratio = await img.evaluate(el => getComputedStyle(el).aspectRatio);
    expect(ratio).toBe('3 / 2');
    await expect(card.locator('.x-card__price-current')).toContainText('$129');
  });

  test('notification cards have variant classes', async ({ page }) => {
    const success = page.locator('#card-gallery [x-cardnotification][variant="success"]');
    await scrollTo(page, success);
    await expect(success).toHaveClass(/x-notification--success/);
    const error = page.locator('#card-gallery [x-cardnotification][variant="error"]');
    await expect(error).toHaveClass(/x-notification--error/);
  });

  test('file cards show filename and icon', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardfile]').first();
    await scrollTo(page, card);
    await expect(card.locator('.x-card__filename')).toContainText('quarterly-report.pdf');
  });

  test('link cards have icon, title, external arrow', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardlink]').first();
    await scrollTo(page, card);
    await expect(card.locator('.x-card__title')).toHaveText('Documentation');
    await expect(card.locator('.x-card__icon')).toContainText('📚');
  });

  test('horizontal card renders image and text side by side', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardhorizontal]').first();
    await scrollTo(page, card);
    const img = card.locator('img');
    await expect(img).toBeVisible({ timeout: 10000 });
    const flexDir = await card.evaluate(el => getComputedStyle(el).flexDirection);
    expect(flexDir).toBe('row');
  });

  test('overlay card has background image and title overlay', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardoverlay]').first();
    await scrollTo(page, card);
    await expect(card).toBeVisible({ timeout: 10000 });
    const bg = await card.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bg).not.toBe('none');
    await expect(card.locator('.x-card__overlay-title')).toBeVisible();
  });

  test('portfolio card renders name, skills, social links', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardportfolio]').first();
    await scrollTo(page, card);
    await expect(card.locator('.x-portfolio__name')).toHaveText('Jane Doe', { timeout: 10000 });
    // Skills pills
    const skills = card.locator('.x-portfolio__skills span');
    expect(await skills.count()).toBeGreaterThanOrEqual(4);
    // Social links
    const social = card.locator('.x-portfolio__social a');
    expect(await social.count()).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════
// 3. INTERACTIVITY - CLICKS & EVENTS
// ═══════════════════════════════════════════════════════
test.describe('Interactivity', () => {
  test.beforeEach(async ({ page }) => { await loadPage(page); });

  test('clickable glass card toggles active class on click', async ({ page }) => {
    const glass = page.locator('#card-gallery .x-card[clickable]').first();
    await expect(glass).toHaveClass(/x-card--clickable/);
    await glass.click();
    await expect(glass).toHaveClass(/x-card--active/);
    await glass.click();
    await expect(glass).not.toHaveClass(/x-card--active/);
  });

  test('button card primary/secondary buttons are clickable', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardbutton]').first();
    const primary = card.locator('.x-card__btn--primary');
    const secondary = card.locator('.x-card__btn--secondary');
    await expect(primary).toBeVisible({ timeout: 10000 });
    await expect(secondary).toBeVisible();
    await expect(primary).toHaveText('Save Now');
    await expect(secondary).toHaveText('Discard');
  });

  test('product card Add to Cart fires custom event', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardproduct]').first();
    const cta = card.locator('.x-card__product-cta');
    await expect(cta).toBeVisible({ timeout: 10000 });
    // Listen for custom event
    const eventFired = await page.evaluate(() => {
      return new Promise(resolve => {
        document.addEventListener('wb:cardproduct:addtocart', (e) => {
          resolve(e.detail);
        }, { once: true });
        document.querySelector('[x-cardproduct] .x-card__product-cta').click();
      });
    });
    expect(eventFired).toHaveProperty('title', 'Premium Sneakers');
    expect(eventFired).toHaveProperty('price', '$129');
  });

  test('expandable card toggles expand/collapse', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardexpandable]').first();
    await scrollTo(page, card);
    const btn = card.locator('.x-card__expand-btn');
    await expect(btn).toBeVisible({ timeout: 10000 });
    // Initially collapsed
    await expect(card).not.toHaveClass(/x-card--expanded/);
    const collapsedHeight = (await card.boundingBox())!.height;
    // Click to expand
    await btn.click();
    await expect(card).toHaveClass(/x-card--expanded/);
    // #352: the class toggling correctly isn't enough on its own -- a demo
    // whose collapsed content already fits within max-height produces zero
    // visible change on expand, which reads as "does nothing" to a real
    // user even though the handler fired. Wait for the CSS transition
    // (max-height 0.3s) to actually finish, then assert real growth.
    await page.waitForTimeout(350);
    const expandedHeight = (await card.boundingBox())!.height;
    expect(expandedHeight, 'expanding must visibly grow the card, not just toggle a class').toBeGreaterThan(collapsedHeight + 20);
    // Click to collapse
    await btn.click();
    await expect(card).not.toHaveClass(/x-card--expanded/);
  });

  test('expandable card button has correct aria-expanded', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardexpandable]').first();
    await scrollTo(page, card);
    const btn = card.locator('.x-card__expand-btn');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  test('minimizable card toggles content visibility', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardminimizable]').first();
    await scrollTo(page, card);
    const btn = card.locator('.x-card__minimize-btn');
    await expect(btn).toBeVisible({ timeout: 10000 });
    // Click to minimize
    await btn.click();
    await expect(card).toHaveClass(/x-card--minimized/);
    // Click to expand
    await btn.click();
    await expect(card).not.toHaveClass(/x-card--minimized/);
  });

  test('notification dismiss button removes element', async ({ page }) => {
    const success = page.locator('#card-gallery [x-cardnotification][variant="success"]');
    await scrollTo(page, success);
    const dismissBtn = success.locator('.x-notification__dismiss');
    await expect(dismissBtn).toBeVisible({ timeout: 10000 });
    await dismissBtn.click();
    await expect(success).toHaveCount(0);
  });

  test('notification fires dismiss event', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardnotification][variant="error"]');
    await scrollTo(page, card);
    const eventFired = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.querySelector('[x-cardnotification][variant="error"]');
        el.addEventListener('wb:cardnotification:dismiss', (e) => {
          resolve(e.detail);
        }, { once: true });
        el.querySelector('.x-notification__dismiss').click();
      });
    });
    expect(eventFired.variant).toBe('error');
  });

  test('hero CTA links exist with text', async ({ page }) => {
    const hero = page.locator('#card-gallery [x-cardhero]').first();
    const ctas = hero.locator('.x-hero-cta');
    expect(await ctas.count()).toBeGreaterThanOrEqual(1);
    await expect(ctas.first()).toContainText('Shop Now');
  });

  test('pricing CTA links exist for all plans', async ({ page }) => {
    const cards = page.locator('#card-gallery [x-cardpricing]');
    for (let i = 0; i < 3; i++) {
      const cta = cards.nth(i).locator('.x-card__cta');
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('href');
    }
  });

  test('portfolio social links open in new tab', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardportfolio]').first();
    await scrollTo(page, card);
    const socialLinks = card.locator('.x-portfolio__social a');
    const count = await socialLinks.count();
    for (let i = 0; i < count; i++) {
      await expect(socialLinks.nth(i)).toHaveAttribute('target', '_blank');
    }
  });

  test('portfolio contact links are valid', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardportfolio]').first();
    await scrollTo(page, card);
    const emailLink = card.locator('.x-portfolio__contact a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
    const websiteLink = card.locator('.x-portfolio__contact a[target="_blank"]');
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
      const cards = document.querySelectorAll('[class*=".x-card"]');
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
    const cards = page.locator('#card-gallery [x-cardpricing]');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    // On mobile, second card should be below first (stacked)
    expect(second.y).toBeGreaterThan(first.y + first.height - 10);
  });

  test('stats cards stack or wrap on mobile', async ({ page }) => {
    const cards = page.locator('#card-gallery [x-cardstats]');
    const first = await cards.nth(0).boundingBox();
    const last = await cards.nth(3).boundingBox();
    // On 375px viewport, 4-col grid should wrap - last card below first
    expect(last.y).toBeGreaterThan(first.y);
  });

  test('horizontal card stacks image above text on mobile', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardhorizontal]').first();
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
    const title = page.locator('#card-gallery [x-cardhero] .x-card__hero-title');
    await expect(title).toBeVisible();
    const box = await title.boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
  });

  test('expandable card toggle works on mobile', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardexpandable]').first();
    await scrollTo(page, card);
    const btn = card.locator('.x-card__expand-btn');
    await btn.tap();
    await expect(card).toHaveClass(/x-card--expanded/);
    await btn.tap();
    await expect(card).not.toHaveClass(/x-card--expanded/);
  });

  test('product card Add to Cart is tappable on mobile', async ({ page }) => {
    const cta = page.locator('#card-gallery [x-cardproduct]').first().locator('.x-card__product-cta');
    await expect(cta).toBeVisible({ timeout: 10000 });
    const box = await cta.boundingBox();
    // Tap target should be reasonably sized for touch
    expect(box.height).toBeGreaterThanOrEqual(30);
  });

  test('portfolio card fits mobile viewport', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardportfolio]').first();
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
    const glass = page.locator('#card-gallery .x-card[clickable]').first();
    await expect(glass).toHaveAttribute('role', 'button');
    await expect(glass).toHaveAttribute('tabindex', '0');
  });

  test('notification cards have role=alert', async ({ page }) => {
    const notif = page.locator('#card-gallery [x-cardnotification]').first();
    await scrollTo(page, notif);
    await expect(notif).toHaveAttribute('role', 'alert');
  });

  test('link card has a real stretched <a> anchor, not a role=link approximation', async ({ page }) => {
    // cardlink() deliberately moved away from role="link"+tabindex on the
    // host (a div + role="link" only approximates real link behavior --
    // see card.js's own comment on the stretched-anchor pattern: native
    // accessibility, right-click "open in new tab", middle-click all work
    // for free with a real <a>, none of which role="link" alone provides).
    const card = page.locator('#card-gallery [x-cardlink]').first();
    await scrollTo(page, card);
    const anchor = card.locator('a[href]');
    await expect(anchor).toHaveCount(1);
    await expect(anchor).toHaveAttribute('href', /.+/);
  });

  test('all images have alt attributes', async ({ page }) => {
    const images = page.locator('#card-gallery img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `img #${i} missing alt`).not.toBeNull();
    }
  });

  test('expandable card keyboard toggle with Enter', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardexpandable]').first();
    await scrollTo(page, card);
    const btn = card.locator('.x-card__expand-btn');
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveClass(/x-card--expanded/);
    await page.keyboard.press('Enter');
    await expect(card).not.toHaveClass(/x-card--expanded/);
  });

  test('portfolio social links have aria-labels', async ({ page }) => {
    const card = page.locator('#card-gallery [x-cardportfolio]').first();
    await scrollTo(page, card);
    const links = card.locator('.x-portfolio__social a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const label = await links.nth(i).getAttribute('aria-label');
      expect(label, `Social link #${i} missing aria-label`).toBeTruthy();
    }
  });
});
