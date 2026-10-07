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

import { moveKeepingFocus } from '../core/keep-focus.js';

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

const FIELDS = 'input, textarea, select';

export function floatinglabel(element, options = {}) {
  // Two authoring forms. On the field itself (<input x-floatinglabel label=..>)
  // this builds the wrapper and the label. On a CONTAINER that already holds a
  // field and its <label> -- the form the Behaviors page example uses -- the
  // container IS the wrapper and the author's label is the one that floats.
  // The container form used to be treated as the field: the <div> got an id
  // and an empty generated label, and the real label never moved.
  const isField = element.matches(FIELDS);
  const field = isField ? element : element.querySelector(FIELDS);
  if (!field) return () => {};

  let wrapper = element;
  if (isField) {
    wrapper = document.createElement('div');
    moveKeepingFocus(element, () => {   // #961
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    });
  }
  wrapper.classList.add('x-floating-label');
  wrapper.classList.add(`x-floating-label--${field.tagName.toLowerCase()}`);

  // for= needs an id to point at. Reuse the author's when there is one — this
  // page makes duplicate ids a hard runtime error (#724/#730), so a generated
  // id must never collide with an existing one.
  if (!field.id) {
    // Test the CANDIDATE, then assign. Assigning first and re-reading
    // element.id made the element its own collision match, so the loop never
    // ended and the renderer hung (#786).
    let candidate;
    do { candidate = `x-floating-label-${++uid}`; } while (document.getElementById(candidate));
    field.id = candidate;
  }

  // The visible text, decided before the placeholder is cleared below.
  //
  // An explicit label= wins over placeholder=. The old order had it backwards:
  // placeholder is a hint about FORMAT ("name@example.com"), label= is what the
  // field IS ("Email address"), and floating one of them out of the box should
  // promote the name, not the example. A whitespace placeholder (" ", the
  // :placeholder-shown idiom) is not text.
  const placeholder = (field.placeholder || '').trim();
  const authored = isField ? null
    : ([...element.querySelectorAll('label')].find((l) => field.id && l.htmlFor === field.id) || element.querySelector('label'));
  const text = element.getAttribute('label') || options.label || (authored && authored.textContent.trim()) || placeholder || '';

  const label = authored || document.createElement('label');
  label.classList.add('x-floating-label__label');
  label.textContent = text;
  label.htmlFor = field.id;
  if (!authored) wrapper.appendChild(label);

  // A <label for> is the accessible name for a form control, so aria-label is
  // not added on top: two names on one control is a conflict, and the
  // ACCESSIBLE-NAME rules treat aria-label as an override to reach for only
  // when no visible label exists. Here one does.

  // Tell the browser what the field is for, so autofill has something to match.
  // Never overwrite an author's own autocomplete — they know their form's
  // context and this map cannot.
  const auto = AUTOCOMPLETE_BY_TYPE[field.type];
  if (auto && !field.hasAttribute('autocomplete')) {
    field.setAttribute('autocomplete', auto);
  }

  // The placeholder has to go — it would sit behind the resting label and
  // render as two overlapping strings. It is not silently dropped: whatever it
  // said is kept as the title, so the format hint survives as a tooltip
  // instead of being destroyed.
  if (field.placeholder) {
    if (placeholder && !field.title && placeholder !== text) field.title = placeholder;
    field.placeholder = '';
  }

  const checkValue = () => {
    // A <select> always shows its selected option, so its label never has
    // room to rest inside the box.
    const filled = field.tagName === 'SELECT' || Boolean(field.value);
    wrapper.classList.toggle(
      'x-floating-label--active',
      filled || document.activeElement === field,
    );
  };

  field.addEventListener('focus', checkValue);
  field.addEventListener('blur', checkValue);
  field.addEventListener('input', checkValue);
  // Autofill fills the field without ever firing 'input' in some browsers,
  // which used to leave the label sitting on top of filled-in text. 'change'
  // covers that, and is the case this fix makes MORE likely by enabling
  // autofill in the first place.
  field.addEventListener('change', checkValue);
  checkValue();

  return () => {
    field.removeEventListener('focus', checkValue);
    field.removeEventListener('blur', checkValue);
    field.removeEventListener('input', checkValue);
    field.removeEventListener('change', checkValue);
    if (isField) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    } else {
      wrapper.classList.remove('x-floating-label', 'x-floating-label--active', `x-floating-label--${field.tagName.toLowerCase()}`);
      label.classList.remove('x-floating-label__label');
    }
  };
}
