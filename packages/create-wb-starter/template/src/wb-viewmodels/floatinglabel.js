/**
 * floatinglabel — a label that sits in the field and rises out of it on focus.
 *
 * #765 — John: "the browser does not detect this as a email input
 * <input x-floatinglabel label='Email address' type='email'> it doesn't give
 * any hints."
 *
 * type= was never the problem: this behavior does not touch it, so native
 * validation and the mobile @ keyboard always worked. What was missing was
 * everything a browser uses to RECOGNISE a field. The old 23-line version
 * built a <label> with no for=, left the input with no id, derived no
 * autocomplete, and then cleared the placeholder — so a field that IS an email
 * input announced itself as an anonymous text box, with no accessible name and
 * nothing for Chrome's autofill to key on.
 */

/**
 * What a given input type is FOR, in autocomplete's vocabulary.
 *
 * Only types with one honest answer. `password` is deliberately absent: it is
 * either current-password or new-password depending on whether this is a
 * sign-in or a sign-up form, and guessing wrong is worse than staying quiet —
 * Chrome offers to save the wrong credential on a new-password field marked
 * current-password. Authors who know which one it is can say so themselves.
 */
const AUTOCOMPLETE_BY_TYPE = {
  email: 'email',
  tel: 'tel',
  url: 'url',
  search: 'off',
};

let uid = 0;

export function floatinglabel(element, options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'x-floating-label';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  // The visible text, decided before the placeholder is cleared below.
  //
  // An explicit label= wins over placeholder=. The old order had it backwards:
  // placeholder is a hint about FORMAT ("name@example.com"), label= is what the
  // field IS ("Email address"), and floating one of them out of the box should
  // promote the name, not the example.
  const text = element.getAttribute('label') || options.label || element.placeholder || '';

  // for= needs an id to point at. Reuse the author's when there is one — this
  // page makes duplicate ids a hard runtime error (#724/#730), so a generated
  // id must never collide with an existing one.
  if (!element.id) {
    do { element.id = `x-floating-label-${++uid}`; } while (document.getElementById(element.id));
  }

  const label = document.createElement('label');
  label.className = 'x-floating-label__label';
  label.textContent = text;
  label.htmlFor = element.id;
  wrapper.appendChild(label);

  // A <label for> is the accessible name for a form control, so aria-label is
  // not added on top: two names on one control is a conflict, and the
  // ACCESSIBLE-NAME rules treat aria-label as an override to reach for only
  // when no visible label exists. Here one does.

  // Tell the browser what the field is for, so autofill has something to match.
  // Never overwrite an author's own autocomplete — they know their form's
  // context and this map cannot.
  const auto = AUTOCOMPLETE_BY_TYPE[element.type];
  if (auto && !element.hasAttribute('autocomplete')) {
    element.setAttribute('autocomplete', auto);
  }

  // The placeholder has to go — it would sit behind the resting label and
  // render as two overlapping strings. It is not silently dropped: whatever it
  // said is kept as the title, so the format hint survives as a tooltip
  // instead of being destroyed.
  if (element.placeholder) {
    if (!element.title && element.placeholder !== text) element.title = element.placeholder;
    element.placeholder = '';
  }

  const checkValue = () => {
    wrapper.classList.toggle(
      'x-floating-label--active',
      Boolean(element.value) || document.activeElement === element,
    );
  };

  element.addEventListener('focus', checkValue);
  element.addEventListener('blur', checkValue);
  element.addEventListener('input', checkValue);
  // Autofill fills the field without ever firing 'input' in some browsers,
  // which used to leave the label sitting on top of filled-in text. 'change'
  // covers that, and is the case this fix makes MORE likely by enabling
  // autofill in the first place.
  element.addEventListener('change', checkValue);
  checkValue();

  return () => {
    element.removeEventListener('focus', checkValue);
    element.removeEventListener('blur', checkValue);
    element.removeEventListener('input', checkValue);
    element.removeEventListener('change', checkValue);
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
  };
}
