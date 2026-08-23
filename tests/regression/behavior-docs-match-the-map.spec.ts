/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The behavior docs describe the behaviors that actually exist (#764)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, pointing at the two Behaviors cards in the docs index: "update all of
 * these."
 *
 * The Cross-Reference card advertised "Relationships between all 168
 * behaviors". tag-map.js defines 110. Nobody wrote 168 wrongly — it was true
 * once and then rotted, because the number lives in prose and the map lives in
 * code, and only one of them gets updated when a behavior is added or removed.
 *
 * This is the third stale count in this project ("Bullshit it still says 50"
 * was the last one), so it is worth a gate rather than another manual pass.
 *
 * WHAT IS CHECKED
 *
 *   1. Any behavior count printed in the docs matches the map.
 *   2. Every x- attribute in the map appears somewhere in the reference docs —
 *      a behavior nobody documented is one nobody can find.
 *
 * The map is read at runtime rather than re-listed here. A test carrying its
 * own copy of the list drifts exactly the way the docs did.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function loadMap() {
  const mod = await import(
    new URL('../../src/core/tag-map.js', import.meta.url).href
  );
  const behaviors = new Set<string>([
    ...Object.values(mod.extensionMap as Record<string, string>),
    ...Object.values(mod.nativeMap as Record<string, string>),
    ...Object.values(mod.elementMap as Record<string, string>),
  ]);
  return { behaviors, extension: mod.extensionMap as Record<string, string> };
}

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

test.describe('Behavior docs match the map', () => {
  test('no doc advertises a behavior count that is out of date', async () => {
    const { behaviors } = await loadMap();
    const real = behaviors.size;

    const FILES = ['docs/manifest.json', 'docs/behaviors-reference.md', 'docs/behavior-cross-reference.md'];
    const wrong: string[] = [];

    for (const rel of FILES) {
      const text = read(rel);
      // "all 168 behaviors", "168 behaviors", "110 behaviors" — a number
      // immediately qualifying the word, which is the shape that goes stale.
      for (const m of text.matchAll(/(\d{2,4})\s+behaviors\b/gi)) {
        const claimed = Number(m[1]);
        if (claimed !== real) wrong.push(`${rel}: claims ${claimed}, map has ${real}`);
      }
    }

    expect(
      wrong,
      `a behavior count in the docs no longer matches tag-map.js. The map is ` +
      `the source of truth — update the prose, not this test:\n  ` +
      wrong.join('\n  '),
    ).toEqual([]);
  });

  test('every x- attribute is mentioned in the reference docs', async () => {
    const { extension } = await loadMap();
    const docs = ['docs/behaviors-reference.md', 'docs/behavior-cross-reference.md']
      .map(read)
      .join('\n');

    const undocumented = Object.keys(extension).filter((attr) => {
      const bare = attr.replace(/^x-/, '');
      // Either spelling counts: the tables use `x-fill` in some places and the
      // bare behavior name in others, and both let a reader find it.
      return !docs.includes(attr) && !new RegExp(`\`${bare}\``).test(docs);
    });

    expect(
      undocumented,
      `${undocumented.length} behavior(s) exist in tag-map.js but appear in ` +
      `neither reference doc — nobody can find a behavior that is not written ` +
      `down:\n  ` + undocumented.join('\n  '),
    ).toEqual([]);
  });
});
