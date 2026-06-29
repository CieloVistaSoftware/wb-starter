/**
 * WBAccordion Component — DEPRECATED
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-accordion title="Question">answer content…</wb-accordion>
 *
 * ⚠️ DEPRECATED — prefer the native semantic <details>/<summary> element
 * (see src/wb-viewmodels/semantics/details.js). Retained for back-compat: the
 * showcase still demos <wb-accordion>, so it must render and toggle correctly,
 * but new code should use <details>. Emits a one-time console warning.
 *
 * Builds the collapsible structure expected by src/styles/behaviors/accordion.css
 * (.wb-accordion-item / .wb-accordion-head / .wb-accordion-body, toggled by the
 * `.open` class). Previously <wb-accordion> was neither a custom element nor a
 * behavior, so the `title` was ignored and the body never collapsed.
 * -----------------------------------------------------------------------------
 */
export class WBAccordion extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;

    if (!WBAccordion._deprecationWarned) {
      WBAccordion._deprecationWarned = true;
      console.warn('[wb-accordion] is deprecated — use the semantic <details>/<summary> element instead.');
    }

    const title = this.getAttribute('title') || '';
    const open = this.hasAttribute('open');
    const content = this.innerHTML;
    this.innerHTML = '';

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
    body.innerHTML = content;

    const toggle = () => {
      const isOpen = item.classList.toggle('open');
      head.setAttribute('aria-expanded', String(isOpen));
      icon.textContent = isOpen ? '▾' : '▸';
      this.dispatchEvent(new CustomEvent('wb:accordion:toggle', { bubbles: true, detail: { open: isOpen } }));
    };

    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    item.appendChild(head);
    item.appendChild(body);
    this.appendChild(item);
  }
}

if (!customElements.get('wb-accordion')) {
  customElements.define('wb-accordion', WBAccordion);
}
