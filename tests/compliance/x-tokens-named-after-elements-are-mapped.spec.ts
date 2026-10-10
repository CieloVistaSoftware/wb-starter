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
  return { extensionMap: tagMap.extensionMap, nativeMap: tagMap.nativeMap, BEHAVIOR_ALIASES: tagMap.BEHAVIOR_ALIASES };
}

/**
 * Tokens this rule was blind to until #831 (2026-10-10). They lived in
 * wb-lazy.js's own WB_LAZY_ONLY_ATTRIBUTES table, which this spec never read,
 * and moving that table into tag-map.js put them in front of it. Each is named
 * after an element that maps no behavior natively. Fixing one means either
 * auto-injecting it on every such element on every page or renaming an
 * attribute the docs teach (docs/behaviors/ul.md: "Add x-ul to a <ul>"), both
 * behavior changes the #831 merge was not allowed to make. Listed so the rule
 * keeps holding for everything else, and frozen: an entry that stops being a
 * violation must be deleted, so the list can only shrink.
 */
const UNMAPPED_SINCE_831: Record<string, string> = {
  'x-ul': '<ul x-ul> is the documented form; <ul> does not auto-inject ul',
  'x-ol': '<ol x-ol> is the documented form; <ol> does not auto-inject ol',
  'x-dl': '<dl x-dl> is the documented form; <dl> does not auto-inject dl',
  'x-search': '<input x-search> is the documented form; <search> is a different element and maps nothing',
};

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
  const violating = named.filter((t) => !nativeBehavior.get(t.slice(2))?.has(extensionMap[t]));
  const wrong = violating.filter((t) => !(t in UNMAPPED_SINCE_831))
    .map((t) => `${t} -> ${extensionMap[t]} (<${t.slice(2)}> gets ${[...(nativeBehavior.get(t.slice(2)) || [])].join(', ') || 'nothing'})`);
  expect(wrong, 'name the token for what it does, and keep the old name in BEHAVIOR_ALIASES').toEqual([]);
  const fixed = Object.keys(UNMAPPED_SINCE_831).filter((t) => !violating.includes(t));
  expect(fixed, 'these now satisfy the rule: delete them from UNMAPPED_SINCE_831').toEqual([]);
});

test('x-span is gone from the registry and lives on only as an alias of x-status', async () => {
  const { extensionMap, BEHAVIOR_ALIASES } = await load();
  expect(extensionMap['x-span']).toBeUndefined();
  expect(extensionMap['x-status']).toBe('status');
  expect(BEHAVIOR_ALIASES.span).toBe('status');
});
