/**
 * drag-start.js — the opening move of a mouse or touch drag (#883)
 *
 * card.js's draggable card and draggable.js each began their mousedown
 * handler with the same lines: ignore anything but the left button, suppress
 * the default (text selection), and record where the pointer went down. The
 * touch paths call the same handlers with a synthetic event carrying
 * button 0 and their own preventDefault, so they pass through here too.
 *
 * @param {{button: number, clientX: number, clientY: number, preventDefault: Function}} e
 * @returns {{x: number, y: number} | null} the start point, or null for a
 *   non-left button (the caller then ignores the event)
 */
export function dragStartPoint(e) {
  if (e.button !== 0) return null; // Left click only
  e.preventDefault(); // Prevent text selection
  return { x: e.clientX, y: e.clientY };
}
