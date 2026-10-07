/**
 * keep-focus.js — re-parent a form control without taking the reader's focus away (#961)
 *
 * A behavior that wraps a control (`wrapper.appendChild(element)`) removes it
 * from the document for an instant. Removing the focused element blurs it, and
 * the browser does not give focus back when the element is re-inserted. So a
 * reader who clicked into a field and started typing while the page was still
 * upgrading it lost every keystroke after the wrap: they went to <body>.
 *
 * Measured on demos/playground.html (#961): the "Sample form" renders, a
 * reader (or a test) focuses Full Name, input.js wraps it in
 * .x-input__wrapper--native, focus drops to <body>, the typed text goes
 * nowhere, and the form's `required` check then blocks the submit. 2 runs in
 * 40 under CPU load.
 *
 * moveKeepingFocus() runs the move and, if the element (or something inside
 * it) had focus before and lost it, focuses it again and puts the caret and
 * selection back where they were. The move and the restore happen in the same
 * task, so nothing typed can land between them.
 *
 * @param {Element} element - the element about to be moved
 * @param {() => void} move - performs the DOM move
 */
export function moveKeepingFocus(element, move) {
  const doc = element && element.ownerDocument;
  const active = doc ? doc.activeElement : null;
  const hadFocus = !!active && active !== doc.body
    && (active === element || element.contains(active));
  /** @type {{ start: number|null, end: number|null, dir: string|undefined } | null} */
  let selection = null;
  if (hadFocus) {
    try {
      const field = /** @type {HTMLInputElement} */ (active);
      if (typeof field.selectionStart === 'number') {
        selection = { start: field.selectionStart, end: field.selectionEnd, dir: field.selectionDirection || undefined };
      }
    } catch { /* this input type has no selection (checkbox, range, ...) */ }
  }

  move();

  if (!hadFocus || !active.isConnected || doc.activeElement === active) return;
  /** @type {HTMLElement} */ (active).focus({ preventScroll: true });
  if (selection) {
    try {
      /** @type {HTMLInputElement} */ (active).setSelectionRange(selection.start, selection.end, /** @type {any} */ (selection.dir));
    } catch { /* no selection API on this control */ }
  }
}
