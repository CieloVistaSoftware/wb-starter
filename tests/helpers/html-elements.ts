/**
 * MDN's HTML element reference (current elements, not obsolete ones) -- the
 * one list of real tag names the compliance specs check against.
 *
 * Used by x-tokens-named-after-elements-are-mapped.spec.ts (#1105: an x- token
 * named after an element) and behavior-schemas-declare-kind.spec.ts (#835: the
 * `element` a schema of kind "element" names).
 */
export const HTML_ELEMENTS: ReadonlySet<string> = new Set(('a abbr address area article aside audio b base bdi bdo blockquote body br '
  + 'button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em '
  + 'embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe '
  + 'img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup '
  + 'option output p picture pre progress q rp rt ruby s samp script search section select slot small '
  + 'source span strong style sub summary sup table tbody td template textarea tfoot th thead time title '
  + 'tr track u ul var video wbr').split(' '));
