import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * `src/wb-views/views-registry.json` auto-registers every view name as a
 * customElements.define('wb-' + name, ...) tag (wb-views.js's
 * registerViewAsElement(), called unconditionally for every registry entry
 * by site-engine.js's global bootstrap -- not lazily when a view is
 * actually used). If a view name collides with a REAL component's tag
 * (tag-map.js's elementMap), the generic WBViewElement class silently wins
 * customElements.define() for that tag -- no error, since the real
 * components are never themselves registered as Custom Elements (they're
 * decorated imperatively by WB.scan() instead), so there is nothing to
 * throw an "already defined" collision against. Confirmed live: this
 * broke <wb-button>'s element.click() (#368) and the same class backs
 * <wb-badge>/<wb-card> too (#369) -- entirely invisible until something
 * depended on the Custom Element's real prototype behavior specifically.
 *
 * This test is the static, no-browser-needed guard against it recurring:
 * fails the moment ANY views-registry.json entry's derived tag name
 * (non-hyphenated names get a "wb-" prefix; hyphenated names are used
 * as-is -- see wb-views.js's registerViewAsElement()) matches a real
 * component tag.
 */
const ROOT = process.cwd();

function loadElementMapTags(): Set<string> {
  const src = fs.readFileSync(path.join(ROOT, 'src/core/tag-map.js'), 'utf-8');
  const match = src.match(/export const elementMap = \{([\s\S]*?)\n\};/);
  if (!match) throw new Error('Could not locate elementMap in tag-map.js');
  const tags = new Set<string>();
  for (const m of match[1].matchAll(/'([a-z0-9-]+)':/g)) {
    tags.add(m[1]);
  }
  return tags;
}

function derivedViewTag(name: string): string {
  return name.includes('-') ? name : `wb-${name}`;
}

test('no views-registry.json entry claims a tag name owned by a real component', () => {
  const registryPath = path.join(ROOT, 'src/wb-views/views-registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  const views = registry.views || registry.parts || registry;
  const elementMapTags = loadElementMapTags();

  const collisions = Object.keys(views)
    .map((name) => ({ name, tag: derivedViewTag(name) }))
    .filter(({ tag }) => elementMapTags.has(tag));

  expect(
    collisions,
    `views-registry.json view name(s) ${collisions.map(c => `"${c.name}" -> <${c.tag}>`).join(', ')} ` +
    `would silently hijack customElements.define() for a real component's tag. ` +
    `Rename the view (e.g. add a suffix) or remove it if unused.`
  ).toEqual([]);
});
