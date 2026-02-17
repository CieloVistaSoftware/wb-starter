/**
 * Select - Enhanced <select> element
 * CSS targets `select` tag directly — no classes, no inline styles.
 * JS only handles clearable wrapper if requested.
 *
 * Usage:
 *   <select>
 *     <option value>Choose...</option>
 *     <option value="1">Option 1</option>
 *   </select>
 */
export function select(element, options = {}) {
  if (element.tagName !== 'SELECT') return () => {};

  const clearable = options.clearable ?? element.hasAttribute('clearable');

  if (clearable) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-select-clearable';
    if (element.parentNode) {
      element.parentNode.insertBefore(wrapper, element);
    }
    wrapper.appendChild(element);

    const clearBtn = document.createElement('wb-button');
    clearBtn.className = 'wb-select__clear';
    clearBtn.textContent = '\u00d7';
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      element.selectedIndex = -1;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    });
    wrapper.appendChild(clearBtn);
  }

  element.wbSelect = {
    getValue: () => element.value,
    setValue: (v) => { element.value = v; },
    getSelectedOptions: () => Array.from(element.selectedOptions),
    clear: () => { element.selectedIndex = -1; }
  };

  return () => {};
}

export default { select };
