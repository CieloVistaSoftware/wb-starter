/**
 * Semantic Property Attributes
 * -----------------------------------------------------------------------------
 * Plain attributes that attach a behavior directly to a semantic HTML element
 * by property name, no `x-` prefix required -- e.g. <button tooltip="Hi">,
 * <span badge="success">, <button ripple>, <button toast-message="Saved">.
 * This is a real, intentional feature, not legacy syntax.
 *
 * Single source of truth for both engines (src/core/wb.js and
 * src/core/wb-lazy.js), so a page loading either one supports the same
 * attribute vocabulary. Before this module existed, each engine kept its own
 * copy and only wb-lazy.js's ever had this table -- wb.js (the engine
 * index.html/main.js actually load) silently never matched these attributes
 * at all (#354).
 * -----------------------------------------------------------------------------
 */

export const SEMANTIC_PROPERTY_ATTRIBUTES = {
  tooltip: 'tooltip',
  'toast-message': 'toast',
  ripple: 'ripple',
  badge: 'badge',
};

// Every x-card* family tag treats `badge` AND `tooltip` as its own component
// props (composeCard renders `badge` as an internal .x-card__badge span, and
// wires `tooltip`/`hoverText` straight to the same themed tooltip.js behavior
// itself -- #283). The bare [badge]/[tooltip] selectors below would
// otherwise also match these cards, double-applying feedback.js's badge()
// on the card ROOT element (confirmed: a <article badge="NEW" variant="glass">
// picked up x-badge/x-badge--glass classes and collapsed to fit-content
// width instead of filling its grid column) -- and for `tooltip`, RACING
// composeCard()'s own tooltip wiring: this generic auto-inject calls tooltip()
// with no explicit content, so it falls back to reading the element's
// `title` attribute chain and, as a side effect, strips the native `title`
// attribute immediately. If that generic injection's dynamic import happened
// to resolve before card behavior's, composeCard() would then read an
// already-stripped `title` attribute and silently drop the card's heading
// (confirmed live: <article title="…" tooltip="…"> intermittently rendered
// with no header at all, depending on import timing). Excluded explicitly so
// card components keep sole ownership of their own `badge`/`tooltip`
// attributes.
export const CARD_TAGS = [
  'x-card', 'x-cardbutton', 'x-carddraggable', 'x-cardexpandable', 'x-cardfile',
  'x-cardhero', 'x-cardhorizontal', 'x-cardimage', 'x-cardlink', 'x-card-link',
  'x-cardminimizable', 'x-cardnotification', 'x-cardoverlay', 'x-cardportfolio',
  'x-cardpricing', 'x-cardproduct', 'x-cardprofile', 'x-cardstats',
  'x-cardtestimonial', 'x-cardvideo',
];
// #625/#626: the tag-based exclusion above only ever covered the x-card*
// CUSTOM TAGS -- it has no way to recognize a semantic
// <article x-behavior="card">/<article x-card> (the now-preferred,
// semantic-HTML-first way to author a card per John's "pull away from our
// wb tags" directive). Confirmed live: docs/components/cards/card.md's own
// "Card anatomy" example, rewritten to <article x-behavior="card"
// badge="LIVE">, picked up x-badge/x-badge--live classes on the ROOT
// element -- the exact double-application bug this file's own CARD_TAGS
// comment already documents for the x-card TAG case, just re-surfaced for
// the attribute-decoration case, which the exclusion never accounted for.
// Extend the same exclusion pattern to BOTH attribute forms (x-card is now
// the registered dedicated key, tag-map.js; x-behavior="card" is the
// always-available generic fallback -- either can be used, so both must be
// excluded here).
const CARD_BEHAVIOR_NAMES = ['card']; // extend as more card variants migrate to semantic HTML + x-behavior
// <article> is the third form, and the one the docs now use. It IS a card by
// auto-injection (tag-map's nativeMap), so it owns its own `badge` exactly as
// <x-card> and [x-card] do -- but it is not a card TAG and carries no x-card
// attribute, so neither existing exclusion caught it. The result was
// `<article badge="NEW">` getting x-badge and x-badge--glass painted onto the
// CARD, which is the same double-application this file already documents
// twice, surfacing a third time now that the plain semantic form is primary.
const CARD_TAG_EXCLUSIONS = CARD_TAGS.map(tag => `:not(${tag})`).join('')
  + ':not(article)'
  + CARD_BEHAVIOR_NAMES.map(b => `:not([x-behavior~="${b}"])`).join('')
  + CARD_BEHAVIOR_NAMES.map(b => `:not([x-${b}])`).join('');

/**
 * { selector, behavior } pairs, one per SEMANTIC_PROPERTY_ATTRIBUTES entry,
 * ready to feed straight into a `querySelectorAll(selector)` + inject loop.
 */
const CARD_OWNED_ATTRIBUTES = ['badge', 'tooltip'];

export const semanticPropertyMappings = Object.entries(SEMANTIC_PROPERTY_ATTRIBUTES).map(([attr, behavior]) => ({
  selector: CARD_OWNED_ATTRIBUTES.includes(attr) ? `[${attr}]${CARD_TAG_EXCLUSIONS}` : `[${attr}]`,
  behavior,
}));
