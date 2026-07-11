import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * #268 coverage gate: every top-level demos/*.html file must be accounted
 * for in data/demos-registry.json (canonical, a confirmed duplicate pending
 * retirement, flagged for a content diff, narrative, or dev/debug) — no
 * orphans. Catches new demo files landing without a decision about where
 * they fit, the exact "multiple sources of truth" drift #268 exists to stop.
 *
 * This does NOT yet enforce "no duplicates" as a hard failure — the
 * confirmed duplicates in the registry are pending an actual retirement PR
 * (see docs/_today/demos-redo-plan-268.md), not auto-deleted by a test.
 * Once retired, moving their registry entries out of `duplicates_to_retire`
 * (and deleting the files) is what closes that gap.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('every demos/*.html file is accounted for in the #268 registry', () => {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/demos-registry.json'), 'utf8'));
  const known = new Set<string>();
  for (const bucket of Object.keys(registry)) {
    if (bucket === '_meta') continue;
    Object.keys(registry[bucket].entries).forEach((f) => known.add(f));
  }

  const actual = fs
    .readdirSync(path.join(ROOT, 'demos'), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => e.name);

  const orphans = actual.filter((f) => !known.has(f));
  const stale = [...known].filter((f) => !actual.includes(f));

  expect(
    orphans,
    `New demos/*.html file(s) not in data/demos-registry.json — add them to the right bucket (canonical/duplicates_to_retire/needs_diff_before_deciding/narrative_allowlist/debug_allowlist), see docs/_today/demos-redo-plan-268.md:\n${orphans.join('\n')}`
  ).toEqual([]);
  expect(
    stale,
    `data/demos-registry.json references file(s) that no longer exist in demos/ — remove the stale entries:\n${stale.join('\n')}`
  ).toEqual([]);
});
