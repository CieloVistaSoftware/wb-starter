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
    heading: options.heading || element.getAttribute('heading') || element.getAttribute('title') || 'Toggle',
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

/**
 * Accordion Behavior
 * -----------------------------------------------------------------------------
 * Multi-item collapsible sections. When children carry [accordion-title]
 * (v3 canonical; [data-accordion-title]/[data-title] accepted for back-compat)
 * each child becomes an independently expandable item.
 * Falls back to the single-item collapse behavior otherwise.
 * CSS: src/styles/behaviors/accordion.css + collapse.css
 * Emits: wb:accordion:ready, wb:accordion:toggle
 * -----------------------------------------------------------------------------
 */
export function accordion(element, options = {}) {
  try {
    // <wb-accordion> is built by its custom element (wb-accordion.js). Never
    // hydrate it a second time here — the double pass found no titled children
    // (already rebuilt) and fell back to collapse(), adding empty extra heads
    // and racing the custom element's toggle wiring.
    if (element.tagName === 'WB-ACCORDION') {
      return () => {};
    }

    // Idempotent: if already hydrated, don't rebuild — a second pass would
    // wipe item innerHTML and reset any open state / rebind handlers.
    if (element.dataset.wbHydrated === '1') {
      return () => element.classList.remove('wb-accordion');
    }

    // v3: plain `accordion-title` is canonical; data-* accepted for back-compat.
    const items = Array.from(element.children).filter(
      child => child.hasAttribute('accordion-title') ||
        child.hasAttribute('data-accordion-title') || child.hasAttribute('data-title')
    );

    // No labelled children — fall back to single-item collapse
    if (items.length === 0) {
      return collapse(element, options);
    }

    element.classList.add('wb-accordion');

    items.forEach(item => {
      const title =
        item.getAttribute('accordion-title') ||
        item.getAttribute('data-accordion-title') ||
        item.getAttribute('data-title') ||
        'Accordion Item';
      const originalContent = item.innerHTML;

      item.innerHTML = '';
      item.classList.add('wb-accordion-item');

      const head = document.createElement('div');
      head.className = 'wb-accordion-head';
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      head.setAttribute('aria-expanded', 'false');

      const headText = document.createElement('span');
      headText.textContent = title;
      head.appendChild(headText);

      const icon = document.createElement('span');
      icon.className = 'wb-collapse__icon';
      icon.textContent = '▼';
      head.appendChild(icon);

      const body = document.createElement('div');
      body.className = 'wb-accordion-body';
      body.innerHTML = originalContent;

      item.appendChild(head);
      item.appendChild(body);

      const toggle = () => {
        try {
          const isOpen = item.classList.toggle('open');
          head.setAttribute('aria-expanded', String(isOpen));
          element.dispatchEvent(new CustomEvent('wb:accordion:toggle', {
            bubbles: true,
            detail: { open: isOpen, title }
          }));
        } catch (err) {
          console.error('[wb-accordion] click error', err);
          element.dataset.wbError = err.message;
        }
      };

      head.addEventListener('click', toggle);
      head.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });

    element.dataset.wbHydrated = '1';
    element.dispatchEvent(new CustomEvent('wb:accordion:ready', {
      bubbles: true,
      detail: { items: items.length }
    }));

    return () => element.classList.remove('wb-accordion');
  } catch (err) {
    console.error('[wb-accordion] init error', err);
    element.dataset.wbError = err.message;
  }
}

export default collapse;
