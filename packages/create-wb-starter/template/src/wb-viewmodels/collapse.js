import { readFlag } from '../core/read-attr.js';
/**
 * Collapse Behavior
 * -----------------------------------------------------------------------------
 * Collapsible content sections.
 * CSS: src/styles/behaviors/collapse.css
 * Zero inline styles.
 *
 * Custom Tag: <div x-collapse>
 * Helper Attribute: [x-collapse]
 * -----------------------------------------------------------------------------
 */
export function collapse(element, options = {}) {
  const config = {
    heading: options.heading || element.getAttribute('heading') || element.getAttribute('title') || 'Toggle',
    // #chained-??-bug: `hasAttribute()` always returns a real boolean (never
    // null/undefined), so a bare `A ?? B ?? C` chain never reaches C -- the
    // middle term always "wins" once options.open is unset, and `open` alone
    // (no `expanded`) silently did nothing. Confirmed live: <div x-collapse
    // open> rendered collapsed while <div x-collapse expanded> rendered
    // open. OR the two hasAttribute() checks together so either attribute
    // opens it.
    open: options.open ?? (element.hasAttribute('expanded') || element.hasAttribute('open')),
    target: options.target || element.getAttribute('target'),
    ...options
  };

  // #448: no classList.add('x-collapse') -- collapse.css selects the
  // `x-collapse` TAG directly now, so the class just duplicated the tag
  // name. (No live demo/page usage of x-collapse on a non-<div x-collapse>
  // element was found.)

  // If target is specified, act as a remote trigger
  if (config.target) {
    const targetEl = document.querySelector(config.target);
    if (targetEl) {
      let isTargetOpen = config.open;
      targetEl.classList.toggle('x-collapse--open', isTargetOpen);
      element.setAttribute('aria-expanded', isTargetOpen);

      element.addEventListener('click', () => {
        isTargetOpen = !isTargetOpen;
        targetEl.classList.toggle('x-collapse--open', isTargetOpen);
        element.setAttribute('aria-expanded', isTargetOpen);
        element.dispatchEvent(new CustomEvent('wb:collapse:toggle', {
          bubbles: true,
          detail: { open: isTargetOpen, target: config.target }
        }));
      });

      return () => element.classList.remove('x-collapse');
    }
  }

  // Default behavior: Wrap content (Accordion style)
  const content = element.innerHTML;
  element.innerHTML = '';

  const trigger = document.createElement('x-button');
  trigger.className = 'x-collapse__trigger';
  trigger.setAttribute('aria-expanded', config.open);

  const label = document.createElement('span');
  label.textContent = config.heading;
  trigger.appendChild(label);

  const icon = document.createElement('span');
  icon.className = 'x-collapse__icon';
  icon.textContent = '▼';
  trigger.appendChild(icon);

  const contentEl = document.createElement('div');
  contentEl.className = 'x-collapse__content';
  contentEl.innerHTML = content;

  element.appendChild(trigger);
  element.appendChild(contentEl);

  if (config.open) {
    element.classList.add('x-collapse--open');
  }

  let isOpen = config.open;

  trigger.addEventListener('click', () => {
    isOpen = !isOpen;
    element.classList.toggle('x-collapse--open', isOpen);
    trigger.setAttribute('aria-expanded', isOpen);
    element.dispatchEvent(new CustomEvent('wb:collapse:toggle', {
      bubbles: true,
      detail: { open: isOpen }
    }));
  });

  element.wbCollapse = {
    toggle: () => trigger.click(),
    show: () => { if (!isOpen) trigger.click(); },
    hide: () => { if (isOpen) trigger.click(); },
    get isOpen() { return isOpen; }
  };

  return () => element.classList.remove('x-collapse', 'x-collapse--open');
}

/**
 * Accordion Behavior
 * -----------------------------------------------------------------------------
 * Custom Tag:
 *   Single:  <div x-accordion title="Question">answer content…</div>
 *   Multi:   <div x-accordion>
 *              <div accordion-title="Q1">answer 1…</div>
 *              <div accordion-title="Q2">answer 2…</div>
 *            </div>
 * When children carry [accordion-title] (v3 canonical; [data-accordion-title]/
 * [data-title] accepted for back-compat) each child becomes an independently
 * expandable item. A <div x-accordion> with no titled children builds a single
 * item from its own title attribute. Any OTHER element with neither falls
 * back to the single-item collapse() behavior.
 *
 * ⚠️ <div x-accordion> is DEPRECATED — prefer the native semantic <details>/
 * <summary> element (see src/wb-viewmodels/semantics/details.js). Retained
 * for back-compat; emits a one-time console warning. Ported from the
 * `extends HTMLElement` class removed in #279 — same DOM/class output
 * (.x-accordion-item/-head/-title/-icon/-body), so existing CSS and tests
 * keep working unchanged.
 *
 * CSS: src/styles/behaviors/accordion.css + collapse.css
 * Emits: wb:accordion:ready, wb:accordion:toggle
 * -----------------------------------------------------------------------------
 */
let _accordionDeprecationWarned = false;

function buildAccordionItem(element, title, contentHtml, open) {
  const item = document.createElement('div');
  item.className = 'x-accordion-item' + (open ? ' open' : '');

  const head = document.createElement('div');
  head.className = 'x-accordion-head';
  head.setAttribute('role', 'button');
  head.setAttribute('tabindex', '0');
  head.setAttribute('aria-expanded', String(open));

  const label = document.createElement('span');
  label.className = 'x-accordion-title';
  label.textContent = title;

  const icon = document.createElement('span');
  icon.className = 'x-accordion-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = open ? '▾' : '▸';

  head.appendChild(label);
  head.appendChild(icon);

  const body = document.createElement('div');
  body.className = 'x-accordion-body';
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
      console.error('[x-accordion] click error', err);
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
      return () => element.classList.remove('x-accordion');
    }

    if (element.tagName === 'WB-ACCORDION' && !_accordionDeprecationWarned) {
      _accordionDeprecationWarned = true;
      console.warn('[x-accordion] is deprecated — use the semantic <details>/<summary> element instead.');
    }

    // v3: plain `accordion-title` is canonical; data-* accepted for back-compat.
    const sections = Array.from(element.children).filter(
      child => child.hasAttribute('accordion-title') ||
        readFlag(child, 'accordion-title') || readFlag(child, 'title')
    );

    if (sections.length > 0) {
      element.classList.add('x-accordion');
      const items = sections.map((sec, i) =>
        buildAccordionItem(
          element,
          sec.getAttribute('accordion-title') || sec.getAttribute('data-accordion-title') ||
            sec.getAttribute('data-title') || 'Accordion Item',
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
      return () => element.classList.remove('x-accordion');
    }

    // #772 -- John: "Doesn't work write a unit test to prove that make fix add
    // to regression."
    //
    // The showcase example is the SEMANTIC form:
    //
    //   <div x-accordion>
    //     <details summary="How do behaviors attach?">…</details>
    //     <details summary="Is there a shadow root?">…</details>
    //   </div>
    //
    // Sections are collected by looking for `accordion-title`, which a
    // <details> does not carry, so the list came back empty, nothing was
    // built, and three unrelated <details> rendered. Proven by
    // tests/regression/accordion-details-children.spec.ts: opening the second
    // panel left [true, true, false] -- both open, no accordion.
    //
    // <details> already opens and closes on its own. What makes a set of them
    // an ACCORDION is exclusivity, so that is all this adds -- no rebuilding,
    // no innerHTML rewrite, and the native disclosure semantics (keyboard,
    // screen-reader, find-in-page) are kept exactly as the browser provides
    // them.
    const detailsChildren = Array.from(element.children).filter(
      (child) => child.tagName === 'DETAILS'
    );
    if (detailsChildren.length > 0) {
      element.classList.add('x-accordion');

      const onToggle = (e) => {
        const opened = e.target;
        if (!opened.open) return;                 // closing needs no coordination
        for (const other of detailsChildren) {
          if (other !== opened) other.open = false;
        }
        element.dispatchEvent(new CustomEvent('wb:accordion:toggle', {
          bubbles: true,
          detail: { open: opened, index: detailsChildren.indexOf(opened) }
        }));
      };

      // 'toggle' rather than a click handler on <summary>: <details> also opens
      // via keyboard, via find-in-page, and by a script setting .open. A click
      // handler would miss all three and leave two panels open.
      for (const d of detailsChildren) d.addEventListener('toggle', onToggle);

      // More than one already open in the markup is not an accordion state:
      // keep the first and close the rest, so it starts consistent with how it
      // will behave from the first click.
      const preOpened = detailsChildren.filter((d) => d.open);
      for (const d of preOpened.slice(1)) d.open = false;

      element.dataset.wbHydrated = '1';
      element.dispatchEvent(new CustomEvent('wb:accordion:ready', {
        bubbles: true,
        detail: { items: detailsChildren.length }
      }));
      return () => {
        for (const d of detailsChildren) d.removeEventListener('toggle', onToggle);
        element.classList.remove('x-accordion');
      };
    }

    // <div x-accordion> with no titled children — single form:
    // <div x-accordion title="Q">answer</div>
    if (element.tagName === 'WB-ACCORDION') {
      const title = element.getAttribute('title') || '';
      const content = element.innerHTML;
      element.innerHTML = '';
      element.classList.add('x-accordion');
      element.appendChild(buildAccordionItem(element, title, content, element.hasAttribute('open')));
      element.dataset.wbHydrated = '1';
      return () => element.classList.remove('x-accordion');
    }

    // Any other element with neither titled children nor being a
    // <div x-accordion> — fall back to single-item collapse.
    return collapse(element, options);
  } catch (err) {
    console.error('[x-accordion] init error', err);
    element.dataset.wbError = err.message;
  }
}

export default collapse;
