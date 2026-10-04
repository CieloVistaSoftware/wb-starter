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
