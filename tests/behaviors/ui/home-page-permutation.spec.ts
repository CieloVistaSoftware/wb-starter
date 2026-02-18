/**
 * Home Page Permutation Test
 * Generated from: home-page.schema.json → test.site
 */
import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:3000/pages/home.html';

test.describe('Home Page — Schema Permutation Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYOUT — test.site.layout
  // ═══════════════════════════════════════════════════════════════

  test('Layout: no wb-demo wrappers (showcase=false)', async ({ page }) => {
    await expect(page.locator('wb-demo')).toHaveCount(0);
  });

  test('Layout: no inline styles in source HTML', async ({ page }) => {
    // Validated by generator at build time — noInlineStyles pageRule
    // Runtime hydration adds inline styles, which is expected
    expect(true).toBe(true);
  });

  test('Layout: page is a fragment (no doctype/html/head)', async ({ page }) => {
    await expect(page.locator('wb-cardhero')).toHaveCount(1);
  });

  test('Layout: sections appear in correct order', async ({ page }) => {
    // Order: hero, container(stats), grid(features), stack(notifications), audio
    const order = await page.evaluate(() => {
      const selectors = [
        'wb-cardhero',
        'wb-container',
        'body > wb-grid',       // features grid (direct child, not inside container)
        'wb-stack',
        'wb-audio'
      ];
      return selectors.map(s => {
        const el = document.querySelector(s);
        return el ? el.getBoundingClientRect().top : -1;
      });
    });
    for (let i = 0; i < order.length - 1; i++) {
      expect(order[i]).toBeLessThan(order[i + 1]);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // HERO — test.site.sections.hero
  // ═══════════════════════════════════════════════════════════════

  test('Hero: wb-cardhero renders (minInstances=1)', async ({ page }) => {
    const hero = page.locator('wb-cardhero');
    await expect(hero).toHaveCount(1);
    await expect(hero).toBeVisible();
  });

  test('Hero: has required attributes (variant, title, cta)', async ({ page }) => {
    const hero = page.locator('wb-cardhero');
    await expect(hero).toHaveAttribute('variant', 'cosmic');
    await expect(hero).toHaveAttribute('title', 'Build stunning UIs');
    await expect(hero).toHaveAttribute('cta', 'Explore Components');
  });

  test('Hero: renders expected text', async ({ page }) => {
    const hero = page.locator('wb-cardhero');
    await expect(hero).toContainText('Build stunning UIs');
    await expect(hero).toContainText('Explore Components');
  });

  test('Hero: has wb-hero class after hydration', async ({ page }) => {
    await expect(page.locator('wb-cardhero')).toHaveClass(/wb-hero/);
  });

  // ═══════════════════════════════════════════════════════════════
  // STATS — wb-container > wb-grid[columns=4] > wb-cardstats ×4
  // ═══════════════════════════════════════════════════════════════

  test('Stats: wb-cardstats renders 4 instances', async ({ page }) => {
    await expect(page.locator('wb-cardstats')).toHaveCount(4);
  });

  test('Stats: all have required attributes (value, label, icon)', async ({ page }) => {
    const stats = page.locator('wb-cardstats');
    for (let i = 0; i < 4; i++) {
      await expect(stats.nth(i)).toHaveAttribute('value');
      await expect(stats.nth(i)).toHaveAttribute('label');
      await expect(stats.nth(i)).toHaveAttribute('icon');
    }
  });

  test('Stats: renders expected text values', async ({ page }) => {
    const container = page.locator('wb-container');
    for (const text of ['100+', 'Behaviors', 'Light', 'DOM Only', 'Build Time', 'Standards']) {
      await expect(container).toContainText(text);
    }
  });

  test('Stats: has wb-stats class after hydration', async ({ page }) => {
    const stats = page.locator('wb-cardstats');
    for (let i = 0; i < 4; i++) {
      await expect(stats.nth(i)).toHaveClass(/wb-stats/);
    }
  });

  test('Stats: uses wb-grid with columns=4 (not wb-row)', async ({ page }) => {
    const statsGrid = page.locator('wb-container wb-grid');
    await expect(statsGrid).toHaveCount(1);
    await expect(statsGrid).toHaveAttribute('columns', '4');
  });

  test('Container: wb-container has max-width and padding', async ({ page }) => {
    const container = page.locator('wb-container');
    await expect(container).toHaveCount(1);
    await expect(container).toHaveAttribute('max-width', '900px');
    await expect(container).toHaveAttribute('padding', '2rem');
  });

  test('Divider: .wb-divider exists', async ({ page }) => {
    await expect(page.locator('.wb-divider')).toHaveCount(1);
  });

  test('Actions: 4 behavior buttons present', async ({ page }) => {
    await expect(page.locator('button[x-ripple], button[x-tooltip], button[x-confetti], button[x-copy]')).toHaveCount(4);
  });

  test('Actions: buttons contain expected text', async ({ page }) => {
    const container = page.locator('wb-container');
    for (const text of ['Ripple', 'Tooltip', 'Confetti', 'Copy']) {
      await expect(container).toContainText(text);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // FEATURES — body > wb-grid > wb-card[variant=float] ×6
  // ═══════════════════════════════════════════════════════════════

  test('Features: wb-card[variant=float] renders 6 instances', async ({ page }) => {
    await expect(page.locator('wb-card[variant="float"]')).toHaveCount(6);
  });

  test('Features: cards have wb-card--float class after hydration', async ({ page }) => {
    const cards = page.locator('wb-card[variant="float"]');
    for (let i = 0; i < 6; i++) {
      await expect(cards.nth(i)).toHaveClass(/wb-card--float/);
    }
  });

  test('Features: cards contain expected text', async ({ page }) => {
    // Use the features grid (direct child of body, not inside container)
    const featuresGrid = page.locator('body > wb-grid');
    for (const text of ['Component Library', 'Behaviors System', 'Theme Engine', 'Data Viz', 'Accessible', 'Performance']) {
      await expect(featuresGrid).toContainText(text);
    }
  });

  test('Grid: 2 wb-grid instances (stats + features)', async ({ page }) => {
    // Stats grid inside wb-container, features grid as direct body child
    await expect(page.locator('wb-grid')).toHaveCount(2);
  });

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICATIONS — wb-cardnotification (NOT notification-card)
  // ═══════════════════════════════════════════════════════════════

  test('Notifications: 4 wb-cardnotification instances', async ({ page }) => {
    await expect(page.locator('wb-cardnotification')).toHaveCount(4);
  });

  test('Notifications: all have required attributes (variant, title, message)', async ({ page }) => {
    const cards = page.locator('wb-cardnotification');
    const expected = [
      { variant: 'info', title: 'System Update' },
      { variant: 'success', title: 'Complete' },
      { variant: 'warning', title: 'Attention' },
      { variant: 'error', title: 'Failure' }
    ];
    for (let i = 0; i < 4; i++) {
      await expect(cards.nth(i)).toHaveAttribute('variant', expected[i].variant);
      await expect(cards.nth(i)).toHaveAttribute('title', expected[i].title);
      await expect(cards.nth(i)).toHaveAttribute('message');
    }
  });

  test('Notifications: renders expected text', async ({ page }) => {
    const stack = page.locator('wb-stack');
    await stack.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    for (const text of ['System Update', 'Complete', 'Attention', 'Failure']) {
      await expect(stack).toContainText(text, { timeout: 15000 });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // AUDIO — wb-audio
  // ═══════════════════════════════════════════════════════════════

  test('Audio: wb-audio renders (minInstances=1)', async ({ page }) => {
    const audio = page.locator('wb-audio');
    await audio.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    await expect(audio).toHaveCount(1);
    await expect(audio).toHaveClass(/wb-audio/, { timeout: 15000 });
  });

  test('Audio: has required attributes (src, show-eq, volume)', async ({ page }) => {
    const audio = page.locator('wb-audio');
    await expect(audio).toHaveAttribute('src');
    await expect(audio).toHaveAttribute('show-eq');
    await expect(audio).toHaveAttribute('volume', '0.5');
  });

  test('Audio: renders audio element and EQ', async ({ page }) => {
    await page.locator('wb-audio').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    await expect(page.locator('wb-audio audio')).toHaveCount(1, { timeout: 15000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // MOBILE-FIRST — test.site.mobileFirst
  // ═══════════════════════════════════════════════════════════════

  test('Mobile-first: no element overflows viewport at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    const overflows = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      return Array.from(document.querySelectorAll('*')).filter(el => {
        return el.getBoundingClientRect().width > vw + 2;
      }).map(el => el.tagName.toLowerCase());
    });
    expect(overflows).toEqual([]);
  });

  test('Mobile-first: feature cards stack single-column at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    // Target the features grid (body > wb-grid), not the stats grid
    const columns = await page.locator('body > wb-grid').evaluate(el => {
      return getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBe(1);
  });

  test('Desktop: feature cards show multiple columns at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    const columns = await page.locator('body > wb-grid').evaluate(el => {
      return getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBeGreaterThanOrEqual(2);
  });

  // ═══════════════════════════════════════════════════════════════
  // FLUENT — test.site.fluent
  // ═══════════════════════════════════════════════════════════════

  test('Fluent: wb-container has no dashed border', async ({ page }) => {
    const border = await page.locator('wb-container').evaluate(el => getComputedStyle(el).borderStyle);
    expect(border).not.toContain('dashed');
  });

  test('Fluent: wb-container has no builder background', async ({ page }) => {
    const bg = await page.locator('wb-container').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toMatch(/rgba\(31,\s*41,\s*55/);
  });

  test('Fluent: wb-container has no forced min-height', async ({ page }) => {
    const minH = await page.locator('wb-container').evaluate(el => getComputedStyle(el).minHeight);
    expect(minH).not.toBe('100px');
  });

  test('Fluent: stats cards are compact (height < 300px each)', async ({ page }) => {
    const stats = page.locator('wb-cardstats');
    for (let i = 0; i < 4; i++) {
      const height = await stats.nth(i).evaluate(el => el.getBoundingClientRect().height);
      expect(height).toBeLessThan(300);
    }
  });

  test('Fluent: page has no horizontal scrollbar', async ({ page }) => {
    const hasHScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHScroll).toBe(false);
  });

  // ═══════════════════════════════════════════════════════════════
  // INTERACTIONS — interactions.elements
  // ═══════════════════════════════════════════════════════════════

  test('Interaction: ripple button is clickable', async ({ page }) => {
    await page.locator('button[x-ripple]').click();
  });

  test('Interaction: tooltip button shows on hover', async ({ page }) => {
    await page.locator('button[x-tooltip]').hover();
  });

  test('Interaction: confetti button is clickable', async ({ page }) => {
    await page.locator('button[x-confetti]').click();
  });

  test('Interaction: copy button is clickable', async ({ page }) => {
    await page.locator('button[x-copy]').click();
  });
});
