/**
 * behavior-inventory.mjs -- every behavior a reader can reach, read from the
 * registries themselves (#1093, #1099).
 *
 * tag-map.js maps a SELECTOR to a BEHAVIOR:
 *
 *   'x-drawer-layout': 'drawerLayout'    <- kebab selector, camelCase module
 *   'button':          'button'
 *
 * The doc file is named for the behavior (the VALUE); the authoring token comes
 * from the selector (the KEY). Looking docs up by key reported x-drawer-layout
 * as undocumented when it was documented -- caught by opening the files.
 *
 * wb-lazy.js's WB_LAZY_ONLY_ATTRIBUTES is a second registry: x-* attributes the
 * lazy runtime dispatches that tag-map.js does not list (#666). Pass
 * { includeLazy: true } for the full surface a page can use.
 *
 * Shared by tests/compliance/every-behavior-is-documented.spec.ts and
 * scripts/generate-behavior-cross-reference.mjs, so the two cannot disagree
 * about what "every behavior" means.
 */
import fs from 'node:fs';
import path from 'node:path';

const ENTRY = /^\s*'([^']+)'\s*:\s*'([^']+)'/gm;

function entries(src) {
  return [...src.matchAll(ENTRY)].map(([, key, value]) => ({ key, value: value.trim() }));
}

/** The body of `export const WB_LAZY_ONLY_ATTRIBUTES = { ... };` */
function lazyBlock(src) {
  const start = src.indexOf('export const WB_LAZY_ONLY_ATTRIBUTES = {');
  if (start < 0) return '';
  const end = src.indexOf('\n};', start);
  return src.slice(start, end < 0 ? undefined : end);
}

/**
 * @param {string} root  repository root
 * @param {{ includeLazy?: boolean }} [opts]
 * @returns {Array<{ token: string, name: string, key: string, autoInjected: boolean }>}
 */
export function reachableBehaviors(root, { includeLazy = false } = {}) {
  const tagMap = fs.readFileSync(path.join(root, 'src', 'core', 'tag-map.js'), 'utf8');
  const all = entries(tagMap);
  if (includeLazy) all.push(...entries(lazyBlock(fs.readFileSync(path.join(root, 'src', 'core', 'wb-lazy.js'), 'utf8'))));
  const out = new Map();
  for (const { key, value: name } of all) {
    // A typed input variant is a host selector, not a behavior with its own doc.
    if (key.includes('[type=')) continue;
    // A key WITHOUT the x- prefix is a tag: <button> injects `button` on its own.
    // A key WITH it is opted into by attribute and has no tag that implies it.
    const autoInjected = !/^\[?x-/.test(key);
    // A tag is named by the behavior it injects: <article> injects card, so the
    // attribute a reader types for it elsewhere is x-card, not x-article.
    const token = autoInjected
      ? name.toLowerCase()
      : key.replace(/^\[/, '').replace(/\]$/, '').replace(/^x-/, '').toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(token)) continue;
    if (!/^[a-zA-Z][a-zA-Z0-9.-]*$/.test(name)) continue;
    out.set(`${token}|${name}`, { token, name, key, autoInjected });
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}
