import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'url';
import path from 'path';

/**
 * AN x- TOKEN NAMED AFTER AN HTML ELEMENT MUST BE ONE nativeMap MAPS (#1105)
 * =========================================================================
 * `x-button` is right: <button> gets the button behavior natively, and
 * `<div x-button>` is how a host that is not a <button> asks for the same
 * thing. `x-span` was wrong: no element maps to it, and <span> is the element
 * MDN defines as carrying no meaning, so the name said nothing about what the
 * behavior did (status-coloured text and window dots). It is now x-status;
 * x-span lives on only in BEHAVIOR_ALIASES.
 *
 * Nothing guarded the registry before: no-redundant-x-attribute.spec.ts
 * catches `<mark x-mark>` in markup, not a token added to tag-map.js.
 */

// MDN's HTML element reference (current elements, not obsolete ones).
const HTML_ELEMENTS = new Set(('a abbr address area article aside audio b base bdi bdo blockquote body br '
  + 'button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em '
  + 'embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe '
  + 'img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup '
  + 'option output p picture pre progress q rp rt ruby s samp script search section select slot small '
  + 'source span strong style sub summary sup table tbody td template textarea tfoot th thead time title '
  + 'tr track u ul var video wbr').split(' '));

async function load() {
  const root = process.cwd();
  const tagMap = await import(pathToFileURL(path.join(root, 'src/core/tag-map.js')).href);
  const aliases = await import(pathToFileURL(path.join(root, 'src/core/attribute-aliases.js')).href);
  return { extensionMap: tagMap.extensionMap, nativeMap: tagMap.nativeMap, BEHAVIOR_ALIASES: aliases.BEHAVIOR_ALIASES };
}

test('every x- token named after an element maps the same behavior that element gets', async () => {
  const { extensionMap, nativeMap } = await load();
  // 'input[type="checkbox"]' -> input; ':is(...)' selectors carry no element name.
  const nativeBehavior = new Map<string, Set<string>>();
  for (const [selector, behavior] of Object.entries(nativeMap) as [string, string][]) {
    const tag = (selector.match(/^[a-z][a-z0-9]*/) || [])[0];
    if (!tag) continue;
    if (!nativeBehavior.has(tag)) nativeBehavior.set(tag, new Set());
    nativeBehavior.get(tag)!.add(behavior);
  }
  const named = Object.keys(extensionMap).filter((t) => HTML_ELEMENTS.has(t.slice(2)));
  expect(named.length, 'the registry was read, so this can fail').toBeGreaterThan(10);
  const wrong = named.filter((t) => !nativeBehavior.get(t.slice(2))?.has(extensionMap[t]))
    .map((t) => `${t} -> ${extensionMap[t]} (<${t.slice(2)}> gets ${[...(nativeBehavior.get(t.slice(2)) || [])].join(', ') || 'nothing'})`);
  expect(wrong, 'name the token for what it does, and keep the old name in BEHAVIOR_ALIASES').toEqual([]);
});

test('x-span is gone from the registry and lives on only as an alias of x-status', async () => {
  const { extensionMap, BEHAVIOR_ALIASES } = await load();
  expect(extensionMap['x-span']).toBeUndefined();
  expect(extensionMap['x-status']).toBe('status');
  expect(BEHAVIOR_ALIASES.span).toBe('status');
});
