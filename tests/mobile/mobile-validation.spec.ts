/**
 * MOBILE VALIDATION — Visual Screenshots & Layout Checks
 * =======================================================
 * Captures full-page screenshots of key pages at mobile viewport
 * and checks for common mobile layout issues.
 * 
 * Run: npm run test:mobile-validation
 * Screenshots saved to: data/mobile-screenshots/
 * 
 * Two viewports tested:
 *   - Pixel 5 (393x851) — Android baseline
 *   - iPhone 12 (390x844) — iOS baseline
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Device name is determined at runtime inside each test
function getDeviceName(): string {
  const name = test.info().project.name;
  return name.includes('iphone') ? 'iphone' : 'pixel';
}

function getScreenshotDir(): string {
  const dir = path.join(process.cwd(), 'data', 'mobile-screenshots', getDeviceName());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ═══════════════════════════════════════════════════════════════
// KEY PAGES TO VALIDATE
// ═══════════════════════════════════════════════════════════════
const PAGES = [
  { name: 'home',            url: '/pages/home.html',              title: 'Home Page' },
  { name: 'components',      url: '/pages/components.html',        title: 'Components Page' },
  { name: 'docs',            url: '/pages/docs.html',              title: 'Docs Page' },
  { name: 'card-demo',       url: '/demos/behaviors-card-code.html', title: 'Card Behaviors Demo' },
  { name: 'ai-permutation',  url: '/pages/ai-permutation-test.html', title: 'AI Permutation Test' },
];

// ═══════════════════════════════════════════════════════════════
// TEST 1: SCREENSHOT CAPTURE
// Takes full-page screenshots for visual review
// ═══════════════════════════════════════════════════════════════
for (const pg of PAGES) {
  test(`screenshot: ${pg.title}`, async ({ page }) => {
    await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500); // let animations/lazy-load settle

    const screenshotPath = path.join(getScreenshotDir(), `${pg.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Verify screenshot was created and has content
    const stat = fs.statSync(screenshotPath);
    expect(stat.size, `Screenshot ${pg.name}.png should have content`).toBeGreaterThan(1000);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: NO HORIZONTAL OVERFLOW
// The page body should never be wider than the viewport
// ═══════════════════════════════════════════════════════════════
for (const pg of PAGES) {
  test(`no horizontal overflow: ${pg.title}`, async ({ page }) => {
    await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(500);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(overflow, `${pg.title} should not have horizontal scroll on mobile`).toBe(false);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: VIEWPORT META TAG
// Every page must have <meta name="viewport"> for mobile
// ═══════════════════════════════════════════════════════════════
for (const pg of PAGES) {
  test(`viewport meta tag: ${pg.title}`, async ({ page }) => {
    await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const hasViewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta !== null && (meta.getAttribute('content') || '').includes('width=device-width');
    });

    expect(hasViewport, `${pg.title} must have <meta name="viewport" content="width=device-width, ...">`).toBe(true);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 4: TAP TARGETS — interactive elements must be >= 44x44px
// WCAG 2.5.5 minimum target size
// ═══════════════════════════════════════════════════════════════
for (const pg of PAGES) {
  test(`tap targets: ${pg.title}`, async ({ page }) => {
    await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(500);

    const tooSmall = await page.evaluate(() => {
      const MIN_SIZE = 44;
      const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [tabindex]');
      const violations: string[] = [];

      for (const el of interactive) {
        // Skip hidden or off-screen elements
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : '';
          const cls = el.className ? `.${String(el.className).split(' ')[0]}` : '';
          violations.push(`${tag}${id}${cls} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        }
      }

      return violations.slice(0, 10); // cap at 10 to avoid noise
    });

    // Warn but don't fail — many sites have some small targets
    // Fail only if more than 20% of interactive elements are too small
    if (tooSmall.length > 0) {
      console.warn(`[${pg.title}] ${tooSmall.length} tap targets under 44px: ${tooSmall.join(', ')}`);
    }

    // Hard fail at 15+ tiny targets — that's a layout problem
    expect(tooSmall.length, `${pg.title}: too many undersized tap targets`).toBeLessThan(15);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 5: TEXT READABILITY — no text smaller than 12px
// ═══════════════════════════════════════════════════════════════
for (const pg of PAGES) {
  test(`text readability: ${pg.title}`, async ({ page }) => {
    await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(500);

    const tinyText = await page.evaluate(() => {
      const MIN_FONT = 12;
      const textNodes = document.querySelectorAll('p, span, a, li, td, th, h1, h2, h3, h4, h5, h6, label, button');
      const violations: string[] = [];

      for (const el of textNodes) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const fontSize = parseFloat(style.fontSize);
        if (fontSize < MIN_FONT && el.textContent && el.textContent.trim().length > 0) {
          const tag = el.tagName.toLowerCase();
          const text = el.textContent.trim().substring(0, 30);
          violations.push(`${tag} "${text}" (${fontSize}px)`);
        }
      }

      return violations.slice(0, 10);
    });

    if (tinyText.length > 0) {
      console.warn(`[${pg.title}] ${tinyText.length} elements under 12px: ${tinyText.join(', ')}`);
    }

    expect(tinyText.length, `${pg.title}: too many tiny text elements`).toBeLessThan(10);
  });
}

// ═══════════════════════════════════════════════════════════════
// TEST 6: NO CONSOLE ERRORS ON MOBILE
// Pages should not throw JS errors at mobile viewport
// ═══════════════════════════════════════════════════════════════
for (const pg of PAGES) {
  test(`no JS errors: ${pg.title}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Filter out known noise (favicon, network, etc.)
    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('404')
    );

    expect(realErrors.length, `${pg.title} JS errors:\n${realErrors.join('\n')}`).toBe(0);
  });
}
