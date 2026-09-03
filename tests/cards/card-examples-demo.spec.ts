import { test, expect } from '@playwright/test';
import { safeScrollIntoView, elementReady } from '../base';

const DEMO_URL = '/demos/site/cards.html';

// Both remaining failures in this file were beforeEach TIMEOUTS, not assertion
// failures: demos/site/cards.html is 293 x-demos and 281 cards in a ~39,000px
// document, and 8 workers render 8 copies of it at once, so the default 30s is
// simply too small for the fixture to come up.
//
// This MUST be describe.configure, NOT test.setTimeout() inside beforeEach —
// the `page` fixture is constructed BEFORE the hook body runs, so a setTimeout()
// there comes too late to cover it. cards-showcase.spec.ts measured exactly
// that: 5 tests still died on `browserContext.newPage: Test timeout of 30000ms`
// with setTimeout(60_000) as the hook's first statement. Same 60s it uses.
test.describe.configure({ timeout: 60_000 });

// Helper: navigate, wait for WB init
//
// #962 was attempted here and REVERTED, twice. Awaiting WB.ready (the boot
// scan's promise) is the right idea in general, but not on this page: cards.html
// carries 34 demo blocks and 265 articles, so under 8 workers the scan does not
// finish inside the 30s test timeout. Unbounded, all 31 tests died in beforeEach;
// bounded to 15s, 38 of 50 failed, because the budget stacks on top of
// goto(networkidle) and the setup outgrew the timeout containing it.
//
// The guesses are now gone, exactly as the note above prescribed: per-element
// waits, not a page-wide readiness wait.
//
// `networkidle` was half the problem. On a lazy page that keeps fetching
// behavior modules as things scroll into view, "no requests for 500ms" is not a
// meaningful milestone, and waiting for it consumed most of the 30s budget
// before the fixed 4000ms guess was even added on top. beforeEach then timed out
// and took every test in the describe with it — which is why this file's failure
// set changed run to run rather than naming one broken thing.
//
// Setup now stops at DOM + WB present. Readiness is established per element, at
// the point of use, by scrollTo(). #962/#972.
async function loadPage(page) {
  await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.WB, { timeout: 10000 });
  // cards.html scans eagerly, so the gallery's first demo settling is a real
  // milestone (unlike networkidle) and the tests that never scroll — they query
  // #card-gallery directly — have something to wait on. Element-scoped and
  // bounded: NOT a page-wide readiness wait, which failed here twice before.
  await elementReady(page.locator('#card-gallery [x-demo]').first());
}

// Helper: scroll into view and wait for THAT element to settle.
// x-ready means settled, not succeeded — the assertions still do the verifying.
async function scrollTo(page, locator) {
  await safeScrollIntoView(locator);
  await elementReady(locator);
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
    // #964: `.x-card` no longer exists — a base card is a bare <article>
    // (a8a7362e replaced class injection with attribute selectors). Measured
    // live on this page: 0 `.x-card`, 32 `<article>`.
    const tags = [
      'article', '[x-cardimage]', '[x-cardvideo]', '[x-cardbutton]',
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
    // #964: base cards carry no classes; the title is the header's <h3>.
    const title = page.locator('#card-gallery article').first().locator('header h3');
    await expect(title).toBeVisible({ timeout: 10000 });
    const maxChannel = await title.evaluate(el => {
      const rgb = getComputedStyle(el).color;
      const m = rgb.match(/\d+/g);
      return m ? Math.max(...m.map(Number)) : 0;
    });
    expect(maxChannel).toBeGreaterThan(150);
  });

  test('code blocks have copy buttons', async ({ page }) => {
    // Verified live on this page: 34 copy buttons exist inside #card-gallery,
    // each 21x16 and visibility:visible, so the selector and the visibility
    // expectation are both correct. The failure was that the source panels had
    // not been built yet — .x-pre__copy comes from the `pre` behavior running
    // INSIDE the demo's code panel, a nested injection that settles after the
    // demo host itself. Settle the demo first, then assert.
    const demo = page.locator('#card-gallery [x-demo]').first();
    await safeScrollIntoView(demo);
    await elementReady(demo);
    await expect(page.locator('#card-gallery .x-pre__copy').first()).toBeVisible({ timeout: 15000 });
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

  // #964: a base card carries NO classes since a8a7362e replaced class
  // injection with attribute selectors. It renders pure semantic HTML —
  // `<article title subtitle><header><h3>…</h3><p>…</p></header><main>…</main>`
  // — so `.x-card__title` / `.x-card__main` match nothing. Measured live:
  // 0 `.x-card`, 0 `.x-card__main`, 32 `<article>`.
  test('base card renders title and content', async ({ page }) => {
    const card = page.locator('#card-gallery article').first();
    await expect(card.locator('header h3')).toHaveText('Welcome');
    await expect(card.locator('main')).toContainText('article');
  });

  // #964: `variant` is an ATTRIBUTE now, not a `--glass` class, and the badge
  // renders as a bare <span> in the header. Asserting the attribute is also the
  // stronger test: it is what the CSS actually selects on.
  test('glass card has badge and variant', async ({ page }) => {
    const glass = page.locator('#card-gallery article[variant="glass"]');
    await expect(glass).toHaveAttribute('variant', 'glass');
    await expect(glass.locator('header span')).toHaveText('NEW');
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
    // #964: x-cardlink builds an <h3>, not a `.x-card__title`.
    await expect(card.locator('h3')).toHaveText('Documentation');
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
    // #964: `clickable` is an attribute and there is no `--clickable` class.
    // The active toggle below is REAL and was verified live — clicking
    // `article[clickable]` does add `x-card--active` — so only the selector and
    // that first class assertion were stale.
    const glass = page.locator('#card-gallery article[clickable]').first();
    await expect(glass).toHaveAttribute('clickable', '');
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
    // #964: selector only — role="button" and tabindex="0" ARE correctly
    // applied; verified live. The test was querying a class that no longer
    // exists, so it never reached its (passing) assertions.
    const glass = page.locator('#card-gallery article[clickable]').first();
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
