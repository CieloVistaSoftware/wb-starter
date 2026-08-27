import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

/**
 * "look through entire site, anywhere a release is found it must use one
 * time one place to read the information" -- found live: demos/landing-
 * page-showcase.html's hero badge hardcoded "v3.0", already stale next to
 * the real 3.0.3. Same hardcode also lived in pages/behaviors.html (x2),
 * pages/behaviors.html (generated -- source hardcode was actually in
 * scripts/generate-behaviors-page.js), and pages/newbehaviors.html.
 *
 * Fixed so every release-number display ultimately reads from the single
 * canonical src/core/version.js VERSION export:
 *   - pages/*.html fragments use a {{WB_VERSION}} placeholder token,
 *     resolved centrally in site-engine.js's navigateTo() (the same code
 *     path that already renders the header's real version).
 *   - Standalone (non-SPA) demo pages import VERSION directly.
 * config/site.json's dead, drifted "appVersion": "1.0.0" field (zero
 * real consumers) was removed as a second, competing source.
 */

test('no pages/**/*.html or scripts/generate-*.js hardcodes a literal build-version string', async () => {
  const FILES = [
    ...globSync('pages/**/*.html', { cwd: process.cwd() }),
    ...globSync('scripts/generate-*.js', { cwd: process.cwd() }),
  ];
  const offenders: string[] = [];
  for (const file of FILES) {
    const content = readFileSync(file, 'utf8');
    // "v3.0" / "v3.0.2" etc immediately after "wb-starter " or inside a
    // version-looking badge label -- NOT the {{WB_VERSION}} placeholder.
    const matches = content.match(/wb-starter v\d+(\.\d+)*(?!\{)/g);
    if (matches) offenders.push(`${file}: ${matches.join(', ')}`);
  }
  expect(offenders, `hardcoded version strings found:\n${offenders.join('\n')}`).toEqual([]);
});

test('config/site.json has no separate/drifted appVersion field', async () => {
  const site = JSON.parse(readFileSync('config/site.json', 'utf8'));
  expect(site.branding?.appVersion).toBeUndefined();
});

test('?page=behaviors: hero + footer show the real stamped version, not a stale literal', async ({ page }) => {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

  const version = await page.evaluate(async () => {
    const mod = await import('/src/core/version.js');
    return mod.VERSION.version;
  });

  const hero = page.locator('#behaviors-hero');
  await expect(hero).toContainText(`wb-starter v${version}`);
  await expect(page.locator('.page-footer')).toContainText(`wb-starter v${version}`);
  // The raw placeholder token must never leak into rendered output.
  await expect(page.locator('#main')).not.toContainText('{{WB_VERSION}}');
});

test('demos/landing-page-showcase.html: hero badge shows the real stamped version', async ({ page }) => {
  await page.goto('/demos/landing-page-showcase.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

  const version = await page.evaluate(async () => {
    const mod = await import('/src/core/version.js');
    return mod.VERSION.version;
  });

  const badge = page.locator('#lp-version-badge');
  await expect(badge).toBeVisible({ timeout: 10000 });
  await expect(badge).toContainText(`v${version} — zero build step`);
});
