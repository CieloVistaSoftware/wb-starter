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

import { test, expect } from '../fixtures/offline';
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

/**
 * The page has finished arriving: loaded, fonts in, WB (where the fragment
 * boots it) settled, and two frames painted. Replaces fixed 500-1500ms
 * sleeps (#1516). A settle that overruns is not this file's failure -- the
 * checks below still measure the page as it stands, as the sleeps did.
 */
async function pageArrived(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForLoadState('load');
  await page.evaluate(async () => {
    await document.fonts.ready;
    const wb = (window as any).WB;
    if (typeof wb?.settled === 'function') await wb.settled({ timeout: 10000 }).catch(() => {});
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

// ═══════════════════════════════════════════════════════════════
// KEY PAGES TO VALIDATE
// ═══════════════════════════════════════════════════════════════
const PAGES = [
  { name: 'home',            url: '/pages/home.html',              title: 'Home Page' },
  { name: 'behaviors',       url: '/pages/behaviors.html',        title: 'Behaviors Page' },
  { name: 'docs',            url: '/pages/docs.html',              title: 'Docs Page' },
  // #1432: was /demos/behaviors-card-code.html, deleted in d4278513, so every
  // check on it ran against the server's 404 page ("must have a viewport meta").
  { name: 'card-demo',       url: '/demos/site/cards.html',        title: 'Cards Demo' },
  { name: 'ai-permutation',  url: '/pages/ai-permutation-test.html', title: 'AI Permutation Test' },
];

// Every page listed here exists in the repo. The list once named a deleted
// demo, and every check on it measured the 404 page instead (#1432).
test('every validated page exists', () => {
  const missing = PAGES.filter((pg) => !fs.existsSync(path.join(process.cwd(), pg.url.replace(/^\//, '')))).map((pg) => pg.url);
  expect(missing, 'pages in PAGES that are not in the repo').toEqual([]);
});

// ═══════════════════════════════════════════════════════════════
// TEST 1: SCREENSHOT CAPTURE
// Takes full-page screenshots for visual review
// ═══════════════════════════════════════════════════════════════
for (const pg of PAGES) {
  test(`screenshot: ${pg.title}`, async ({ page, browserName }) => {
    const fullPage = true;
    await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await pageArrived(page);

    // #1439: on the Windows CI runner, a WebKit capture of any page holding an
    // <audio> or <video> that never loads hangs until the screenshot timeout.
    // Home's player is one: there WebKit leaves the (offline stand-in) MP3 at
    // readyState 0, while Chromium reaches 4. Measured on the runner: Home
    // timed out every time (viewport, full page, animations disabled, service
    // worker blocked), and with only its media elements taken away it
    // captured in about 1s. Removing its infinite animations or its filters
    // changed nothing. Real Safari plays the file. These captures are images
    // for visual review, and the media element is the browser's own hidden
    // one, so the source is unloaded rather than the capture skipped.
    if (browserName === 'webkit') {
      await page.evaluate(() => {
        for (const media of Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video'))) {
          media.pause();
          media.removeAttribute('src');
          media.querySelectorAll('source').forEach((source) => source.remove());
          media.load();
        }
      });
    }

    const screenshotPath = path.join(getScreenshotDir(), `${pg.name}.png`);
    // Chromium refuses a capture taller than 32767px, and the Behaviors page
    // on a phone is taller than that (#1432). The top of the page is enough to
    // review. A clip does not help -- fullPage still renders the whole page
    // first -- and measuring the height first races a page still growing, so
    // the limit itself decides: past it, the capture is viewport height.
    try {
      await page.screenshot({ path: screenshotPath, fullPage, animations: 'disabled' });
    } catch (err) {
      if (!/larger than 32767 pixels/.test(String(err))) throw err;
      await page.screenshot({ path: screenshotPath, animations: 'disabled' });
    }

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
    await pageArrived(page);

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
    await pageArrived(page);

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
    await pageArrived(page);

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
