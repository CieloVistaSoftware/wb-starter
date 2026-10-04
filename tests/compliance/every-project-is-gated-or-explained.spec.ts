import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * #1189: a Playwright project that is neither in the gate nor excluded for a
 * stated reason runs only when someone asks for it by name, so its specs can
 * go red and stay red with nobody told. In September 4 projects were in that
 * state; by October it was 11, because nothing made a new project choose.
 *
 * Every project in playwright.config.ts is either in the ratchet's
 * ALL_PROJECTS or in its NOT_GATED map with a reason, never both, and every
 * name in either list is a real project.
 */
const config = readFileSync('playwright.config.ts', 'utf8');
const ratchet = readFileSync('.husky/test-ratchet.mjs', 'utf8');

const defined = [...new Set([...config.matchAll(/^\s*name:\s*'([a-z][a-z0-9-]*)'/gm)].map((m) => m[1]))];
const gated = (/const ALL_PROJECTS = \[([^\]]*)\]/.exec(ratchet)?.[1] || '')
  .match(/'([^']+)'/g)?.map((s) => s.slice(1, -1)) || [];
const notGatedBlock = /const NOT_GATED = \{([\s\S]*?)\n\};/.exec(ratchet)?.[1] || '';
const notGated = new Map(
  [...notGatedBlock.matchAll(/^\s*'?([a-z][a-z0-9-]*)'?:\s*'([^']*)'/gm)].map((m) => [m[1], m[2]]),
);

test('every Playwright project is gated or excluded with a reason (#1189)', () => {
  expect(defined.length, 'projects were read from playwright.config.ts').toBeGreaterThan(10);
  expect(gated.length, 'ALL_PROJECTS was read from the ratchet').toBeGreaterThan(3);

  const neither = defined.filter((p) => !gated.includes(p) && !notGated.has(p));
  expect(neither, 'projects that run in no gate and give no reason').toEqual([]);

  const both = gated.filter((p) => notGated.has(p));
  expect(both, 'projects both gated and excluded').toEqual([]);

  const unknown = [...gated, ...notGated.keys()].filter((p) => !defined.includes(p));
  expect(unknown, 'names that are not projects in playwright.config.ts').toEqual([]);

  const thin = [...notGated].filter(([, why]) => why.trim().length < 30).map(([p]) => p);
  expect(thin, 'exclusions whose reason is too short to be one').toEqual([]);
});
// That each gated project is also a gated CI matrix row is
// ci-and-local-gate-agree.spec.ts's job (#1044, #1176).
