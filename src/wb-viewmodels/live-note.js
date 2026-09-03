/**
 * live-note.js — helpers for the Behaviors page's "what am I looking at" note.
 *
 * #994 — John, on `x-avatar · shape=circle` reading "shows a indigo
 * background" over a photograph of Ada Lovelace: "This is a lie."
 *
 * It was true of the CSS and false to the eye. The avatar's box really is
 * rgb(38,38,217) — the fallback colour behind the initials — but a child <img>
 * filled it exactly, so none of it was visible.
 *
 * These live in a module rather than inline in pages/behaviors.html because
 * the first regression test written for the fix PASSED with the bug
 * reintroduced: inline, the only way to reach the logic was to drive the page,
 * and the page rebuilds its example on every selection — resetting any
 * geometry a test tried to set up. A guard that cannot fail is not a guard.
 * Extracted, both rules are testable directly against controlled DOM.
 *
 * `occludingChild` takes an `isOpaque` predicate instead of importing a colour
 * parser, so the page keeps its single `parseRgb` (which handles Chrome's
 * `color(srgb …)` form) and nothing is duplicated.
 */

/** Elements that paint their own content over the box. */
const REPLACED = ['img', 'picture', 'video', 'canvas', 'svg'];

/** Fraction of the box a child must cover before it hides the background. */
export const COVER_THRESHOLD = 0.9;

/**
 * "a" or "an", chosen from the word that follows.
 * colourName() returns indigo, orange, amber, olive, azure — all vowel-initial.
 * @param {string} word
 * @returns {'a'|'an'}
 */
export function articleFor(word) {
  return /^[aeiou]/i.test(String(word || '')) ? 'an' : 'a';
}

/**
 * `shows an indigo background`, never `shows a indigo background`.
 * @param {string} noun
 * @param {string} [tail]
 * @returns {string}
 */
export function shows(noun, tail) {
  return `shows ${articleFor(noun)} ${noun}${tail ? ' ' + tail : ''}`;
}

/**
 * What, if anything, is painted over this element's background.
 *
 * Returns the tag name of a covering replaced element ('img', 'video', …),
 * 'covered' for a child carrying its own opaque background across the box, or
 * null when the background really is what the reader sees.
 *
 * @param {Element} el
 * @param {(color: string) => boolean} isOpaque  true if a computed colour is opaque
 * @returns {string|null}
 */
export function occludingChild(el, isOpaque) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return null;
  const box = el.getBoundingClientRect();
  if (!box.width || !box.height) return null;
  const area = box.width * box.height;

  for (const child of el.querySelectorAll('*')) {
    const r = child.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if ((r.width * r.height) / area < COVER_THRESHOLD) continue;

    const tag = child.tagName.toLowerCase();
    if (REPLACED.includes(tag)) return tag;
    if (isOpaque && isOpaque(getComputedStyle(child).backgroundColor)) return 'covered';
  }
  return null;
}

/**
 * How a covering child should be described, or null to fall through to the
 * background/border description.
 * @param {string|null} covered  the return value of occludingChild
 * @returns {string|null}
 */
export function describeCover(covered) {
  if (covered === 'img' || covered === 'picture') return 'shows an image';
  if (covered === 'video') return 'shows a video';
  if (covered === 'canvas' || covered === 'svg') return shows(covered, 'drawing');
  return null;
}
