// Standalone label behavior extracted from enhancements.js
//
// `x-label="text"` goes directly on the form control (input, select,
// textarea, ...) — its value IS the label text. The behavior creates the
// real <label> element, associates it via for/id, and inserts it right
// before the control so it renders to the control's left by default.
// `label-position="right"` puts it after the control instead (RTL layouts —
// Hebrew, Arabic — commonly want the label on the right).
let _autoId = 0;

export function label(element, options = {}) {
  const config = {
    required: options.required ?? element.hasAttribute('required'),
    optional: options.optional ?? element.hasAttribute('optional'),
    position: options.position || element.getAttribute('label-position') || 'left',
    ...options
  };

  const text = options.text ?? element.getAttribute('x-label');
  const onRight = config.position === 'right';

  let labelEl = element;
  let group = null;
  if (text) {
    if (!element.id) element.id = `wb-label-target-${++_autoId}`;
    labelEl = document.createElement('label');
    labelEl.setAttribute('for', element.id);
    labelEl.textContent = text;

    // Group the label + control together so a flowing/wrapping layout
    // never splits them onto separate lines (a bare pair of siblings could
    // wrap between them, stranding the label on its own line).
    group = document.createElement('span');
    group.className = 'wb-label-group';
    element.parentNode.insertBefore(group, element);
    if (onRight) {
      group.appendChild(element);
      group.appendChild(labelEl);
    } else {
      group.appendChild(labelEl);
      group.appendChild(element);
    }
  }

  labelEl.classList.add('wb-label');
  if (onRight) labelEl.classList.add('wb-label--right');
  if (config.required) labelEl.classList.add('wb-label--required');
  if (config.optional) labelEl.classList.add('wb-label--optional');

  return () => {
    labelEl.classList.remove('wb-label', 'wb-label--right', 'wb-label--required', 'wb-label--optional');
    if (labelEl !== element) {
      labelEl.remove();
      if (group && group.parentNode) {
        group.parentNode.insertBefore(element, group);
        group.remove();
      }
    }
  };
}
