import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { reachableBehaviors } from '../../scripts/lib/behavior-inventory.mjs';

/**
 * #1099: docs/behavior-cross-reference.md opened "A complete reference of all
 * WB Behaviors" and had prose for 50 of 185. It now carries an inventory
 * generated from the registries (tag-map.js + wb-lazy.js) -- every behavior a
 * row, undocumented ones marked rather than missing -- and these fail when the
 * doc and the registries disagree.
 */
const root = process.cwd();
const docPath = path.join(root, 'docs', 'behavior-cross-reference.md');

test('the inventory is current with the registries (#1099)', () => {
  let out = '';
  try {
    out = execFileSync(process.execPath, ['scripts/generate-behavior-cross-reference.mjs', '--check'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e: any) {
    throw new Error(`the inventory is stale -- a behavior was added, renamed or removed without regenerating it:\n${e.stderr || e.message}`);
  }
  expect(out).toMatch(/up to date/);
});

test('every reachable behavior has a row, and the doc claims no more than that (#1099)', () => {
  const doc = fs.readFileSync(docPath, 'utf8');
  const names = new Set(reachableBehaviors(root, { includeLazy: true }).map((b) => b.name));
  expect(names.size, 'read no behaviors from the registries').toBeGreaterThan(100);
  const rows = [...doc.matchAll(/^\|\s*\x60([^\x60]+)\x60\s*\|/gm)].map((m) => m[1]);
  const missing = [...names].filter((n) => !rows.includes(n));
  expect(missing, 'behaviors the registries know and the inventory does not list').toEqual([]);
  expect(doc, 'the doc must not claim completeness for its prose').not.toMatch(/complete reference of all/i);
});
