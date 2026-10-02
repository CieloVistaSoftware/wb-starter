import { readAttr } from '../core/read-attr.js';
/**
 * Glass Behavior
 * -----------------------------------------------------------------------------
 * The element carries the background scene: whatever is behind it passes
 * through it.
 * CSS: src/styles/behaviors/glass.css
 * Zero inline styles.
 *
 * Helper Attribute: [x-glass]
 * -----------------------------------------------------------------------------
 *
 * #1236 -- John, on the playground's hero #7: "I really like this effect,
 * where background is a part of other elements on top. We should name this as
 * a feature" -- "a button which carries the scene of the background."
 *
 * On that hero the background's wave runs straight through the "Read the
 * Guide" button and out the other side. The button has no picture of its own;
 * its fill is mostly transparent, so the scene IS its picture. Next to it, the
 * solid "Try the Playground" button blocks the scene, and the contrast between
 * the two is the effect.
 *
 * That look was a hand-written CSS recipe, copied separately into the hero,
 * the card's and the badge's glass variants. A plain <button> or <nav> could
 * not ask for it. This behavior is the one way to ask: put x-glass on any
 * element.
 *
 * amount -- how much of the scene comes through:
 *   most  (default) the "Read the Guide" button: 14% tint, 86% scene
 *   some            22% tint
 *   least           30% tint, for busy scenes where text needs more help
 * Kept at or under 30% so light text on the element still reads against a
 * dark scene; past that the tint stops carrying the scene and starts hiding it.
 *
 * It needs a scene behind it. Over a flat colour an x-glass element is just a
 * slightly lighter box -- that is not a fault of the behavior, there is simply
 * nothing to carry.
 */

const AMOUNTS = new Set(['most', 'some', 'least']);

export function glass(element, options = {}) {
  const requested = options.amount || readAttr(element, 'amount', 'most');
  const amount = AMOUNTS.has(requested) ? requested : 'most';

  const added = ['x-glass', `x-glass--${amount}`];
  element.classList.add(...added);

  return () => {
    element.classList.remove(...added);
  };
}
