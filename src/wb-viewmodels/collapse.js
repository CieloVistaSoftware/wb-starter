/**
 * Collapse Behavior
 * -----------------------------------------------------------------------------
 * Collapsible content sections.
 * CSS: src/styles/behaviors/collapse.css
 * Zero inline styles.
 *
 * Custom Tag: <wb-collapse>
 * Helper Attribute: [x-collapse]
 * -----------------------------------------------------------------------------
 */
export function collapse(element, options = {}) {
  const config = {
    heading: options.heading || element.getAttribute('heading') || 'Toggle',
    open: options.open ?? element.hasAttribute('expanded') ?? element.hasAttribute('open'),
    target: options.target || element.getAttribute('target'),
    ...options
  };

  element.classList.add('wb-collapse');

  // If target is specified, act as a remote trigger
  if (config.target) {
    const targetEl = document.querySelector(config.target);
    if (targetEl) {
      let isTargetOpen = config.open;
      targetEl.classList.toggle('wb-collapse--open', isTargetOpen);
      element.setAttribute('aria-expanded', isTargetOpen);

      element.addEventListener('click', () => {
        isTargetOpen = !isTargetOpen;
        targetEl.classList.toggle('wb-collapse--open', isTargetOpen);
        element.setAttribute('aria-expanded', isTargetOpen);
        element.dispatchEvent(new CustomEvent('wb:collapse:toggle', {
          bubbles: true,
          detail: { open: isTargetOpen, target: config.target }
        }));
      });

      return () => element.classList.remove('wb-collapse');
    }
  }

  // Default behavior: Wrap content (Accordion style)
  const content = element.innerHTML;
  element.innerHTML = '';

  const trigger = document.createElement('wb-button');
  trigger.className = 'wb-collapse__trigger';
  trigger.setAttribute('aria-expanded', config.open);

  const label = document.createElement('span');
  label.textContent = config.heading;
  trigger.appendChild(label);

  const icon = document.createElement('span');
  icon.className = 'wb-collapse__icon';
  icon.textContent = '▼';
  trigger.appendChild(icon);

  const contentEl = document.createElement('div');
  contentEl.className = 'wb-collapse__content';
  contentEl.innerHTML = content;

  element.appendChild(trigger);
  element.appendChild(contentEl);

  if (config.open) {
    element.classList.add('wb-collapse--open');
  }

  let isOpen = config.open;

  trigger.addEventListener('click', () => {
    isOpen = !isOpen;
    element.classList.toggle('wb-collapse--open', isOpen);
    trigger.setAttribute('aria-expanded', isOpen);
    element.dispatchEvent(new CustomEvent('wb:collapse:toggle', {
      bubbles: true,
      detail: { open: isOpen }
    }));
  });

  element.wbCollapse = {
    toggle: () => trigger.click(),
    open: () => { if (!isOpen) trigger.click(); },
    close: () => { if (isOpen) trigger.click(); },
    get isOpen() { return isOpen; }
  };

  return () => element.classList.remove('wb-collapse', 'wb-collapse--open');
}

// Accordion is an alias for collapse
export const accordion = collapse;

export default collapse;
