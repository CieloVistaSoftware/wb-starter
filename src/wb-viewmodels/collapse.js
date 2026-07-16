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
 * Custom Tag:
 *   Single:  <wb-accordion title="Question">answer content…</wb-accordion>
 *   Multi:   <wb-accordion>
 *              <div accordion-title="Q1">answer 1…</div>
 *              <div accordion-title="Q2">answer 2…</div>
 *            </wb-accordion>
 * When children carry [accordion-title] (v3 canonical; [data-accordion-title]/
 * [data-title] accepted for back-compat) each child becomes an independently
 * expandable item. A <wb-accordion> with no titled children builds a single
 * item from its own title attribute. Any OTHER element with neither falls
 * back to the single-item collapse() behavior.
 *
 * ⚠️ <wb-accordion> is DEPRECATED — prefer the native semantic <details>/
 * <summary> element (see src/wb-viewmodels/semantics/details.js). Retained
 * for back-compat; emits a one-time console warning. Ported from the
 * `extends HTMLElement` class removed in #279 — same DOM/class output
 * (.wb-accordion-item/-head/-title/-icon/-body), so existing CSS and tests
 * keep working unchanged.
 *
 * CSS: src/styles/behaviors/accordion.css + collapse.css
 * Emits: wb:accordion:ready, wb:accordion:toggle
 * -----------------------------------------------------------------------------
 */
let _accordionDeprecationWarned = false;

function buildAccordionItem(element, title, contentHtml, open) {
  const item = document.createElement('div');
  item.className = 'wb-accordion-item' + (open ? ' open' : '');

  const head = document.createElement('div');
  head.className = 'wb-accordion-head';
  head.setAttribute('role', 'button');
  head.setAttribute('tabindex', '0');
  head.setAttribute('aria-expanded', String(open));

  const label = document.createElement('span');
  label.className = 'wb-accordion-title';
  label.textContent = title;

  const icon = document.createElement('span');
  icon.className = 'wb-accordion-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = open ? '▾' : '▸';

  head.appendChild(label);
  head.appendChild(icon);

  const body = document.createElement('div');
  body.className = 'wb-accordion-body';
  body.innerHTML = contentHtml;

  item.appendChild(head);
  item.appendChild(body);

  const toggle = () => {
    try {
      const isOpen = item.classList.toggle('open');
      head.setAttribute('aria-expanded', String(isOpen));
      icon.textContent = isOpen ? '▾' : '▸';
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

  return item;
}

export function accordion(element, options = {}) {
  try {
    // Idempotent: if already hydrated, don't rebuild — a second pass would
    // wipe item innerHTML and reset any open state / rebind handlers.
    if (element.dataset.wbHydrated === '1') {
      return () => element.classList.remove('wb-accordion');
    }

    if (element.tagName === 'WB-ACCORDION' && !_accordionDeprecationWarned) {
      _accordionDeprecationWarned = true;
      console.warn('[wb-accordion] is deprecated — use the semantic <details>/<summary> element instead.');
    }

    // v3: plain `accordion-title` is canonical; data-* accepted for back-compat.
    const sections = Array.from(element.children).filter(
      child => child.hasAttribute('accordion-title') ||
        child.hasAttribute('data-accordion-title') || child.hasAttribute('data-title')
    );

    if (sections.length > 0) {
      element.classList.add('wb-accordion');
      const items = sections.map((sec, i) =>
        buildAccordionItem(
          element,
          sec.getAttribute('accordion-title') || 'Accordion Item',
          sec.innerHTML,
          sec.hasAttribute('open') || (i === 0 && element.hasAttribute('open'))
        )
      );
      element.innerHTML = '';
      for (const item of items) { element.appendChild(item); }

      element.dataset.wbHydrated = '1';
      element.dispatchEvent(new CustomEvent('wb:accordion:ready', {
        bubbles: true,
        detail: { items: items.length }
      }));
      return () => element.classList.remove('wb-accordion');
    }

    // <wb-accordion> with no titled children — single form:
    // <wb-accordion title="Q">answer</wb-accordion>
    if (element.tagName === 'WB-ACCORDION') {
      const title = element.getAttribute('title') || '';
      const content = element.innerHTML;
      element.innerHTML = '';
      element.classList.add('wb-accordion');
      element.appendChild(buildAccordionItem(element, title, content, element.hasAttribute('open')));
      element.dataset.wbHydrated = '1';
      return () => element.classList.remove('wb-accordion');
    }

    // Any other element with neither titled children nor being a
    // <wb-accordion> — fall back to single-item collapse.
    return collapse(element, options);
  } catch (err) {
    console.error('[wb-accordion] init error', err);
    element.dataset.wbError = err.message;
  }
}

export default collapse;
