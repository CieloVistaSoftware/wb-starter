import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

/**
 * Every npm script says what it does and when to use it, and sits in one group
 * (#1911).
 *
 * John, 2026-10-16, on the 74-script list: "This list is large, how can a user
 * know what to use, when to use it?" 22 scripts had no description and none
 * were grouped. package.json's `scripts-info` and `scripts-groups` are what
 * `npm run scripts:help` (scripts/scripts-help.mjs) and an editor's script
 * panel read; this keeps them complete as scripts come and go.
 */
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const scripts = Object.keys(pkg.scripts);
const info: Record<string, string> = pkg['scripts-info'] || {};
const groups: Record<string, string[]> = pkg['scripts-groups'] || {};

test('every npm script has a description in scripts-info', () => {
  const missing = scripts.filter((s) => !(info[s] || '').trim());
  expect(missing, 'add these to package.json "scripts-info": what it does and when to use it').toEqual([]);
});

test('every npm script is in exactly one scripts-groups group', () => {
  const seen = new Map<string, string[]>();
  for (const [g, names] of Object.entries(groups)) for (const n of names) seen.set(n, [...(seen.get(n) || []), g]);
  expect(scripts.filter((s) => !seen.has(s)), 'put these in a group in package.json "scripts-groups"').toEqual([]);
  expect([...seen].filter(([, g]) => g.length > 1).map(([n, g]) => n + ': ' + g.join(', ')), 'a script belongs to one group').toEqual([]);
});

test('scripts-info and scripts-groups name only scripts that exist', () => {
  const real = new Set(scripts);
  const stale = [...Object.keys(info), ...Object.values(groups).flat()].filter((n) => !real.has(n));
  expect([...new Set(stale)], 'remove these: the script is gone').toEqual([]);
});
