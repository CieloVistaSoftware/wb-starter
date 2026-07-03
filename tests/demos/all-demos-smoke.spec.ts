import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * All-demos smoke test.
 *
 * Loads every real demo in demos/ in a real browser (so lazy-loaded behaviors
 * actually fire) and flags:
 *   - uncaught JS exceptions (pageerror)
 *   - console.error output
 *   - broken SAME-ORIGIN requests (a missing local asset/module) — external
 *     CDN/image/audio failures are ignored (not the demo's fault)
 *   - pages that render no meaningful content
 *
 * One test per demo so failures name the exact file.
 */

const DEMOS_DIR = path.join(process.cwd(), 'demos');

// Match the SKIP list used by scripts/generate-demos-list.mjs / demos-list-complete.
const SKIP = /(^|[-.])(debug|test|test-harness|harness|check|scratch)([-.]|$)/i;

function demoFiles(): string[] {
  return fs
    .readdirSync(DEMOS_DIR)
    .filter((n) => n.endsWith('.html') && !SKIP.test(n.replace(/\.html$/i, '')))
    .sort();
}

// Console warnings that are known-benign noise, not demo defects.
const BENIGN = [
  /cdn\.tailwindcss\.com should not be used in production/i,
  /Download the .* DevTools/i,
  // Resource load failures are tracked precisely (same-origin only) via the
  // response + requestfailed handlers below; external CDN/image/audio flakiness
  // should not fail a demo. So drop the generic console noise for it.
  /Failed to load resource/i,
];

for (const file of demoFiles()) {
  test(`demo loads clean: ${file}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const badRequests: string[] = [];

    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!BENIGN.some((re) => re.test(t))) consoleErrors.push(t);
      }
    });
    page.on('response', (res) => {
      const url = res.url();
      // Only same-origin (dev server) assets — external CDNs/images/audio are ignored.
      if (url.includes('localhost:3000') && res.status() >= 400) {
        badRequests.push(`${res.status()} ${url.replace('http://localhost:3000', '')}`);
      }
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      // Same-origin requests that never get a response (ERR_CONNECTION_CLOSED,
      // aborted module fetch, etc.). External resource flakiness is ignored.
      if (url.includes('localhost:3000')) {
        badRequests.push(`FAILED ${req.failure()?.errorText ?? ''} ${url.replace('http://localhost:3000', '')}`.trim());
      }
    });

    await page.goto(`/demos/${file}`, { waitUntil: 'domcontentloaded' });
    // Give WB.init() + the lazy-load IntersectionObserver time to activate behaviors.
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();

    // Findings surfaced in the assertion messages so the report names them.
    expect(pageErrors, `uncaught JS error(s) in ${file}:\n  ${pageErrors.join('\n  ')}`).toEqual([]);
    expect(badRequests, `broken same-origin request(s) in ${file}:\n  ${[...new Set(badRequests)].join('\n  ')}`).toEqual([]);
    expect(consoleErrors, `console.error(s) in ${file}:\n  ${[...new Set(consoleErrors)].join('\n  ')}`).toEqual([]);
    expect(bodyText.length, `${file} rendered no meaningful content (body text length ${bodyText.length})`).toBeGreaterThan(30);
  });
}
