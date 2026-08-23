import { readFlag } from '../core/read-attr.js';
/**
 * Fill Behavior
 * -----------------------------------------------------------------------------
 * Makes an element as wide as its container allows.
 * CSS: src/styles/behaviors/fill.css
 * Zero inline styles.
 *
 * Helper Attribute: [x-fill]
 * -----------------------------------------------------------------------------
 *
 * #764 -- John: "I would like a behavior that makes the element always as wide
 * as possible given it's container."
 *
 * WHY THIS IS NOT JUST width: 100%
 *
 * "As wide as possible" depends entirely on the layout the element lands in,
 * and width is the wrong property in three of the four common cases:
 *
 *   - inline (<a>, <span>, <button>): width is ignored outright until the box
 *     is block or inline-block. width:100% on an inline element does nothing.
 *   - flex item: sized by flex-basis/flex-grow. width:100% loses to
 *     flex-shrink and to a sibling's flex-grow; the element ends up whatever
 *     the flex algorithm decides.
 *   - grid item: needs justify-self:stretch, and a single-cell item cannot
 *     reach the full track row without spanning it.
 *   - block: width:100% is right, but only with box-sizing:border-box, or
 *     padding and borders push it PAST its container.
 *
 * So the behavior reads the parent's computed display and applies the property
 * that actually governs width there, rather than one property everywhere.
 * That is a runtime decision because the parent's display is not knowable from
 * the element's own markup.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not strip a max-width. A variant class or design token that caps a
 * component at, say, 40rem is a deliberate constraint, and "as wide as
 * possible" still means "as wide as you are allowed to be". Pass
 * `ignore-max-width` to override that when the cap is the thing in the way.
 */

/** Parent display values that mean "the parent controls my width". */
const FLEX = new Set(['flex', 'inline-flex']);
const GRID = new Set(['grid', 'inline-grid']);

export function fill(element, options = {}) {
  const config = {
    // Opt out of respecting an inherited max-width. Off by default: a cap is
    // usually someone's decision, not an accident.
    // readFlag, not readAttr: readAttr returns its fallback ('') for a missing
    // attribute and never null, so a presence test against it is always true.
    ignoreMaxWidth: readFlag(element, 'ignore-max-width', Boolean(options.ignoreMaxWidth)),
  };

  const parent = element.parentElement;
  const parentDisplay = parent ? getComputedStyle(parent).display : 'block';

  const added = ['wb-fill'];

  if (FLEX.has(parentDisplay)) {
    // flex-grow:1 + flex-basis:0 makes this item absorb the free space. Without
    // basis:0 the item's own content width is subtracted first, so two filled
    // siblings with different content end up different widths.
    added.push('wb-fill--flex');
  } else if (GRID.has(parentDisplay)) {
    // justify-self covers the track; column:1/-1 covers the ROW, which is what
    // "as wide as the container" means to someone looking at the page rather
    // than at the grid definition.
    added.push('wb-fill--grid');
  } else {
    // Block formatting context. An inline element needs a box before width
    // applies at all -- .wb-fill--block sets display:block for exactly that.
    added.push('wb-fill--block');
  }

  if (config.ignoreMaxWidth) added.push('wb-fill--ignore-max');

  element.classList.add(...added);

  return () => {
    element.classList.remove(...added);
  };
}
