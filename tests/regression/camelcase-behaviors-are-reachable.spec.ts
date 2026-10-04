import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #1195 -- a behavior registered under a camelCase name is reachable by an
 * attribute.
 *
 * scrollProgress was registered but no attribute mapped to it, so
 * <div x-scrollProgress> did nothing (the parser stores it lowercase and the
 * registry key is camelCase). Same trap #620 hit with drawerLayout. Attribute
 * selectors match HTML attribute names case-insensitively, so one extensionMap
 * entry written in the standard camelCase form makes it reachable.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('every camelCase registry key has an attribute that reaches it', () => {
  const idx = fs.readFileSync(path.join(ROOT, 'src/wb-viewmodels/index.js'), 'utf8');
  const block = idx.slice(idx.indexOf('const behaviorModules = {'));
  const body = block.slice(0, block.indexOf('\n};'));
  const camel = [...body.matchAll(/^\s*([a-z]+[A-Z][A-Za-z0-9]*)\s*:/gm)].map((m) => m[1]);
  expect(camel.length, 'no camelCase keys found -- the parse is wrong or the trap is gone').toBeGreaterThan(0);

  const sources = ['src/core/tag-map.js', 'src/core/wb-lazy.js'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const reachable = new Set([...sources.matchAll(/'x-[A-Za-z-]+'\s*:\s*'([A-Za-z]+)'/g)].map((m) => m[1]));
  const unreachable = camel.filter((k) => !reachable.has(k));
  expect(unreachable, 'registered behaviors no x-* attribute maps to').toEqual([]);
});

test('<div x-scrollProgress> builds on the lazy runtime', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => typeof (window as any).WB?.scan === 'function', null, { timeout: 30_000 });
  const built = await page.evaluate(async () => {
    const WB = (window as any).WB;
    const host = document.createElement('div');
    host.innerHTML = '<div id="sp-1195" x-scrollProgress></div>';
    document.body.appendChild(host);
    await WB.scan(host, { eager: true });
    await WB.whenIdle?.({ timeout: 10_000 });
    const el = document.getElementById('sp-1195')!;
    const out = el.classList.contains('x-scroll-progress');
    host.remove();
    return out;
  });
  expect(built, 'x-scrollProgress must apply the scrollProgress behavior').toBe(true);
});
