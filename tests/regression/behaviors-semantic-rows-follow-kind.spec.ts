/**
 * The behaviors page lists a SEMANTIC row for a behavior because its schema
 * says so (#835), not because example markup happened to match a string.
 *
 * relabelByExample() used to look for `<` + host in the curated example. For
 * the input behaviors the host is a selector -- `input[type="password"]` --
 * which no markup ever contains, so x-password lost its semantic row although
 * its example is a plain <input type="password">, while x-radio and x-range
 * (no curated example, nothing to match) kept theirs.
 *
 * Now each behavior's schema declares `kind` ("element" + the tag, or
 * "decorator"), the schema index carries it, and the page reads it. The only
 * other reason to drop a semantic row is declared too: a curated example with
 * `form: "attribute"` has no semantic markup to show (x-checkbox, #761).
 */
import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nativeMap } from '../../src/core/tag-map.js';

const ROOT = process.cwd();

test.describe.configure({ timeout: 120_000 });

/** The semantic rows the declarations call for: element behaviors of their own host. */
function expectedSemanticBehaviors(): string[] {
  const index = JSON.parse(readFileSync(join(ROOT, 'data/schema-index.json'), 'utf8'));
  const byName = new Map<string, { kind?: string; element?: string }>(
    index.schemas.map((s: { name: string }) => [s.name, s]),
  );
  const catalogue = JSON.parse(readFileSync(join(ROOT, 'data/behavior-examples.json'), 'utf8')).examples;
  const out = new Set<string>();
  const seen = new Set<string>();
  for (const [selector, behavior] of Object.entries(nativeMap as Record<string, string>)) {
    if (seen.has(behavior)) continue; // the page's host is the FIRST selector for a behavior
    seen.add(behavior);
    const tag = (selector.match(/^[a-z][a-z0-9]*/) || [''])[0];
    const sc = byName.get(behavior);
    if (!sc || sc.kind !== 'element' || sc.element !== tag) continue;
    if (catalogue[`x-${behavior}`]?.form === 'attribute') continue;
    out.add(behavior);
  }
  return [...out].sort();
}

test('semantic rows are exactly the behaviors whose schema declares kind "element"', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await expect(page.locator('#behaviors-search-results')).toHaveAttribute('aria-busy', 'false', { timeout: 60_000 });

  const listed = await page.$$eval('.behaviors-search-results__row[data-form="semantic"]', (rows) =>
    [...new Set(rows.map((r) => (r.getAttribute('data-browse-token') || '').replace(/^x-/, '')))].sort());

  const expected = expectedSemanticBehaviors();
  expect(expected.length, 'the declarations were read, so this can fail').toBeGreaterThan(20);
  expect(listed).toEqual(expected);

  // The case string-matching got wrong: <input type="password"> IS the host.
  expect(listed).toContain('password');
  // Declared attribute-only: listed once, as x-checkbox (#761).
  expect(listed).not.toContain('checkbox');
});
