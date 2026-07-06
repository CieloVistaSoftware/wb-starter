/**
 * WBAccordion Component — DEPRECATED
 * -----------------------------------------------------------------------------
 * Custom Tag:
 *   Single:  <wb-accordion title="Question">answer content…</wb-accordion>
 *   Multi:   <wb-accordion>
 *              <div data-accordion-title="Q1">answer 1…</div>
 *              <div data-accordion-title="Q2">answer 2…</div>
 *            </wb-accordion>
 *
 * ⚠️ DEPRECATED — prefer the native semantic <details>/<summary> element
 * (see src/wb-viewmodels/semantics/details.js). Retained for back-compat: the
 * showcase still demos <wb-accordion>, so it must render and toggle correctly,
 * but new code should use <details>. Emits a one-time console warning.
 *
 * Builds the collapsible structure expected by src/styles/behaviors/accordion.css
 * (.wb-accordion-item / .wb-accordion-head / .wb-accordion-body, toggled by the
 * `.open` class). Each [data-accordion-title] child becomes its own item; the
 * multi-item form previously rendered one empty-titled item that dumped every
 * answer into a single body (#215).
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

    // Multi-item form: one accordion item per titled child. v3 canonical is the
    // PLAIN [accordion-title]; [data-accordion-title] accepted for back-compat. (#215)
    const sections = Array.from(this.querySelectorAll('[accordion-title], [data-accordion-title]'));
    if (sections.length > 0) {
      const items = sections.map((sec, i) =>
        this._buildItem(
          sec.getAttribute('accordion-title') || sec.getAttribute('data-accordion-title') || '',
          sec.innerHTML,
          sec.hasAttribute('open') || (i === 0 && this.hasAttribute('open'))
        )
      );
      this.innerHTML = '';
      for (const item of items) { this.appendChild(item); }
      return;
    }

    // Single form: <wb-accordion title="Q">answer</wb-accordion>
    const title = this.getAttribute('title') || '';
    const content = this.innerHTML;
    this.innerHTML = '';
    this.appendChild(this._buildItem(title, content, this.hasAttribute('open')));
  }

  /** Build one collapsible item (head + body) with its own toggle wiring. */
  _buildItem(title, contentHtml, open) {
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
    return item;
  }
}

if (!customElements.get('wb-accordion')) {
  customElements.define('wb-accordion', WBAccordion);
}
