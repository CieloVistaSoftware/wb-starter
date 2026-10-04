import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #1195 -- a behavior registered under a camelCase name is reachable by an
 * attribute, or it is not registered.
 *
 * scrollProgress was registered with no attribute mapped to it, so
 * <div x-scrollProgress> did nothing -- the parser stores attribute names
 * lowercase, and nothing connected that to the camelCase key (#620 hit the
 * same trap with drawerLayout). Wiring it up showed it was also inert: a
 * 13-line stub that added a class no stylesheet styles, which no-inert-behaviors
 * and the doc/example gates then caught. It was removed rather than advertised.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function registryKeys(): string[] {
  const idx = fs.readFileSync(path.join(ROOT, 'src/wb-viewmodels/index.js'), 'utf8');
  const block = idx.slice(idx.indexOf('const behaviorModules = {'));
  const body = block.slice(0, block.indexOf('\n};'));
  // Every key, not only the first on a line: the registry packs several per
  // line (`imposter: 'layouts', icon: 'layouts', drawerLayout: 'layouts'`).
  return [...body.matchAll(/(?:^|[\s,{])([A-Za-z][A-Za-z0-9]*)\s*:\s*'/gm)].map((m) => m[1]);
}

test('every camelCase registry key has an attribute that reaches it', () => {
  const camel = registryKeys().filter((k) => /[a-z][A-Z]/.test(k));
  expect(camel.length, 'no camelCase keys found -- the parse is wrong or the trap is gone').toBeGreaterThan(0);
  const sources = ['src/core/tag-map.js', 'src/core/wb-lazy.js'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const reachable = new Set([...sources.matchAll(/'x-[A-Za-z-]+'\s*:\s*'([A-Za-z]+)'/g)].map((m) => m[1]));
  const unreachable = camel.filter((k) => !reachable.has(k));
  expect(unreachable, 'registered behaviors no x-* attribute maps to').toEqual([]);
});

test('the inert scrollProgress stub stays gone', () => {
  expect(registryKeys()).not.toContain('scrollProgress');
  expect(fs.existsSync(path.join(ROOT, 'src/wb-viewmodels/scroll-progress.js'))).toBe(false);
});
