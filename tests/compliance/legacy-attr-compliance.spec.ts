import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE (#200): demo markup must configure behaviors with the canonical v3
 * PLAIN attributes, not legacy data-* config attributes.
 *
 * Why this test exists: for months data-* kept reappearing because (a) the
 * behaviors never dropped their data-* back-compat reads, so old markup silently
 * kept working, and (b) there was no gate. This test is that gate — once green,
 * behavior-config data-* cannot silently return to the live pages.
 *
 * A small allowlist covers data-* that are NOT behavior config:
 *   - data-accordion-title / data-tab-title : multi-item CONTENT markers (the
 *     documented API for <wb-accordion>/<wb-tabs> child items).
 *   - data-variant : a CSS attribute-selector hook (src/styles/behaviors/input.css,
 *     issue #133), not a JS-read config attribute.
 *
 * To fix violations: run `node scripts/migrate-legacy-attrs.mjs <page>` (a codemod
 * with per-behavior verified mappings), or add a genuinely-structural attribute
 * to the allowlist below.
 */
const ALLOWED = new Set([
  'data-accordion-title',
  'data-tab-title',
  'data-variant',
]);

// Live pages only. behaviors.html / newbehaviors.html are archived legacy dumps.
const PAGES = ['pages/components.html'];
const ROOT = process.cwd();

test.describe('No legacy behavior-config data-* attributes in live demos (#200)', () => {
  for (const rel of PAGES) {
    test(`${rel}: behavior config uses plain attrs, not data-*`, () => {
      const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const found = [...html.matchAll(/\sdata-[a-z-]+(?==)/g)].map((m) => m[0].trim());
      const offenders = [...new Set(found)].filter((a) => !ALLOWED.has(a)).sort();

      expect(
        offenders,
        `${rel}: behavior config should use plain v3 attributes, not data-*.\n` +
        `Found: ${offenders.join(', ')}\n` +
        `Allowed (structural/CSS only): ${[...ALLOWED].join(', ')}\n` +
        `Fix: node scripts/migrate-legacy-attrs.mjs ${rel}`
      ).toEqual([]);
    });
  }
});
