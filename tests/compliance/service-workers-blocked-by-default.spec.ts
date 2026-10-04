import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #1362 -- a spec gets no service worker unless it asks for one.
 *
 * A worker answers a page's fetch before page.route sees it, so with 'allow'
 * as the default every new mocking spec was born broken (#1349 found 24).
 * Blocked by default; the deployed site, where the worker ships, keeps it.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the default blocks service workers', () => {
  test.skip(!!process.env.SMOKE_BASE_URL, 'the deployed smoke exercises the shipped worker on purpose');
  expect(test.info().project.use.serviceWorkers, 'a mocking spec would be silently unmocked').toBe('block');
});

test('every spec that registers a worker opts in, so blocking never hangs it', () => {
  // PR #1400's first CI run: two specs that register sw.js themselves timed
  // out at 30s once the default blocked them. Name them instead.
  const missing: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'deployed') walk(p); continue; }
      if (!e.name.endsWith('.spec.ts')) continue;
      const s = fs.readFileSync(p, 'utf8');
      if (/serviceWorker\.register\(/.test(s) && !/test\.use\(\{\s*serviceWorkers:\s*'allow'/.test(s)) {
        missing.push(path.relative(ROOT, p));
      }
    }
  };
  walk(path.join(ROOT, 'tests'));
  expect(missing, 'specs that register a service worker without opting in').toEqual([]);
});

test('the deployed project keeps the worker it ships', () => {
  const cfg = fs.readFileSync(path.join(ROOT, 'playwright.config.ts'), 'utf8').replace(/\r\n/g, '\n');
  const deployed = cfg.slice(cfg.indexOf("name: 'deployed'"), cfg.indexOf("name: 'deployed'") + 400);
  expect(deployed).toMatch(/serviceWorkers:\s*'allow'/);
});

test('a test-server page has no worker either way (#1108), so the default changes nothing it renders', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('load');
  const state = await page.evaluate(async () => ({
    controlled: !!navigator.serviceWorker?.controller,
    registrations: navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 0,
  }));
  expect(state).toEqual({ controlled: false, registrations: 0 });
});
