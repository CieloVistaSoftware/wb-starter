/**
 * Component landmark guard — one rule, one file.
 *
 * A <header>, <footer>, <nav> or <aside> INSIDE a component is that
 * component's chrome, not the page's.
 *
 * John: "cards are simply an article with headers, main and footers." A card's
 * structure IS semantic HTML, so card.js builds real <header>/<footer>
 * elements. But those tags also map to the page-level header()/footer()
 * behaviors, so every card header got `x-header` and the site-navbar treatment
 * on top of its own -- `.x-header`'s padding beat card.css's header padding and
 * stacked 26px under the subtitle where 8px was asked for.
 *
 * wb.js decided this inline three different ways: getAutoInjectBehavior()
 * (a8a7362e), a narrower copy in its scan loop (#159), and none at all in its
 * observer loop. wb-lazy.js -- the runtime cards.html and the SPA actually
 * run -- had no copy anywhere, so on every lazy page the card header was still
 * hijacked. The injection loops of both runtimes now ask this one function.
 *
 * Scoped by CONTEXT rather than an opt-out attribute. An earlier attempt
 * stamped x-ignore on all 12 places card.js builds chrome, which fixed the
 * symptom by writing a marker into every card's markup for a reader to trip
 * over. Where the element sits already answers the question.
 *
 * Deliberately CARD-scoped. getAutoInjectBehavior() also treats any BEM block
 * (`[class*="__"]`) as a host, but applying that on the injection loops would
 * silence a page-level <header> written inside `.x-demo__grid` -- the header
 * behavior's own demos. That broader rule stays where it was.
 */

import { CARD_TAGS } from './semantic-attributes.js';

const LANDMARKS = new Set(['header', 'footer', 'nav', 'aside']);

/**
 * A card host: an <article> (a card by auto-injection), any card attribute
 * ([x-card], [x-cardstats], [x-cardexpandable], ... -- semantic-attributes.js
 * keeps the list), or anything still marked with an x-card class.
 *
 * #969: the typed cards used to be caught by `[class*="x-card"]` alone, through
 * the identity classes card.js stamped on them (`x-card--stats`,
 * `x-card-horizontal`). Those are gone -- the attribute already said it -- so
 * the attribute is what names the host here too. Without it a
 * <div x-cardstats>'s own <header> would take the page header behavior.
 *
 * And a <dialog> (#874): dialog.js builds its chrome from real <header> and
 * <footer> elements too, and they came out `x-dialog__header x-header`, so the
 * dialog title row took the page navbar's 0.8em text and 60px min-height and
 * its footer took the page footer's behavior. A landmark inside a dialog is
 * the dialog's.
 */
export const COMPONENT_HOST = ['article', 'dialog', ...CARD_TAGS.map((t) => `[${t}]`), '[class*="x-card"]'].join(', ');

/**
 * Is this element a landmark that belongs to an enclosing component, and so
 * must NOT receive the page-level landmark behavior?
 *
 * @param {Element} element
 * @returns {boolean}
 */
export function isComponentLandmark(element) {
  if (!element?.tagName || !LANDMARKS.has(element.tagName.toLowerCase())) return false;
  return !!element.parentElement?.closest(COMPONENT_HOST);
}
