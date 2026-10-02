import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

/**
 * John pasted a console reading "wb-starter starting... v1.0.0" and requests
 * for main.js?v=1.0.0. VERSION.version is package.json's version, which stays
 * 1.0.0 between tags, so:
 *   - the console's first line named a version nobody else shows;
 *   - site-engine fetched pages/<id>.html?v=1.0.0 for EVERY 1.0.N, letting the
 *     browser keep serving old page content after a push.
 * Everything shown or used as a cache key is the badge's number,
 * versionNumber(VERSION).number (src/core/version-number.js).
 */
test('no src/ code shows or cache-keys on the raw package version', () => {
  const offenders = globSync('src/**/*.js')
    .filter((f) => !f.endsWith('version-number.js'))
    .filter((f) => /VERSION\.version\b/.test(readFileSync(f, 'utf8')));
  expect(offenders, 'use versionNumber(VERSION).number').toEqual([]);
});

test('page fragments are fetched with the 1.0.N cache key', async ({ page }) => {
  const keys: string[] = [];
  page.on('request', (r) => { const m = r.url().match(/\/pages\/[\w-]+\.html\?v=([^&]+)/); if (m) keys.push(m[1]); });
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));
  await page.goto('/?page=releases');
  await expect(page.locator('#releases-list')).toHaveAttribute('rendered', '1', { timeout: 15_000 });
  const shown = (await page.locator('[x-release]').first().textContent())!.trim().replace(/^v/, '');
  expect(keys.length, 'a page fragment was fetched').toBeGreaterThan(0);
  for (const k of keys) expect(k).toBe(shown);
  expect(logs.find((l) => l.includes('wb-starter starting')), 'console names the badge number').toContain(`v${shown} `);
});
