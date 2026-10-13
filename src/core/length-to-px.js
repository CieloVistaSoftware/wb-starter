/**
 * length-to-px.js — a CSS length, as the px number a drag or a clamp needs.
 * ==========================================================================
 *
 * Sizes are written in rem (Law 19, #294), but a resize handle compares them
 * with `e.clientX`, which is px. `parseInt('12.5rem')` reads 12 -- a 200px
 * minimum silently became a 12px one, and the sheet, the notes drawer and the
 * stagelight radius each did that sum by hand.
 *
 *   lengthToPx('12.5rem')        // 200 at a 16px root, 225 at 18px
 *   lengthToPx('320px')          // 320
 *   lengthToPx('2em', 0, host)   // 2 × host's font size
 *   lengthToPx('50%', 300)       // 300 -- a percentage has no px without a box
 *
 * rem resolves against the root's computed font size, em against `element`'s
 * (the root's when none is given). A bare number is px. Anything else -- %, vw,
 * an empty or unreadable value -- returns `fallback`.
 */

function fontSizeOf(el) {
  const target = el || document.documentElement;
  return parseFloat(getComputedStyle(target).fontSize) || 16;
}

/**
 * @param {string|number} value - a CSS length such as '12.5rem', '200px' or 200
 * @param {number} [fallback=0] - returned when `value` is not a px/rem/em length
 * @param {Element} [element] - the element an `em` value is relative to
 * @returns {number} the length in px
 */
export function lengthToPx(value, fallback = 0, element) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const m = /^\s*(-?\d*\.?\d+)\s*(px|rem|em)?\s*$/i.exec(String(value ?? ''));
  if (!m) return fallback;
  const n = parseFloat(m[1]);
  const unit = (m[2] || 'px').toLowerCase();
  if (unit === 'px') return n;
  if (unit === 'rem') return n * fontSizeOf(null);
  return n * fontSizeOf(element);
}
