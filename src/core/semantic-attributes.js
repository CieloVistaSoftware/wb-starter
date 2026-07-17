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

// Every wb-card* family tag treats `badge` as its own component prop
// (cardBase renders it as an internal .wb-card__badge span). The bare
// [badge] selector below would otherwise also match these cards,
// double-applying feedback.js's badge() on the card ROOT element -- stomping
// its layout/border/background with badge styles (confirmed: a <wb-card
// badge="NEW" variant="glass"> picked up wb-badge/wb-badge--glass classes
// and collapsed to fit-content width instead of filling its grid column).
// Excluded explicitly so card components keep sole ownership of their own
// `badge` attribute.
export const CARD_TAGS = [
  'wb-card', 'wb-cardbutton', 'wb-carddraggable', 'wb-cardexpandable', 'wb-cardfile',
  'wb-cardhero', 'wb-cardhorizontal', 'wb-cardimage', 'wb-cardlink', 'wb-card-link',
  'wb-cardminimizable', 'wb-cardnotification', 'wb-cardoverlay', 'wb-cardportfolio',
  'wb-cardpricing', 'wb-cardproduct', 'wb-cardprofile', 'wb-cardstats',
  'wb-cardtestimonial', 'wb-cardvideo',
];
const CARD_TAG_EXCLUSIONS = CARD_TAGS.map(tag => `:not(${tag})`).join('');

/**
 * { selector, behavior } pairs, one per SEMANTIC_PROPERTY_ATTRIBUTES entry,
 * ready to feed straight into a `querySelectorAll(selector)` + inject loop.
 */
export const semanticPropertyMappings = Object.entries(SEMANTIC_PROPERTY_ATTRIBUTES).map(([attr, behavior]) => ({
  selector: attr === 'badge' ? `[${attr}]${CARD_TAG_EXCLUSIONS}` : `[${attr}]`,
  behavior,
}));
