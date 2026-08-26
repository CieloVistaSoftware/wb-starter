/**
 * WB Tabs Behavior
 * -----------------------------------------------------------------------------
 * Tab panels from child elements
 * 
 * Custom Tag: <div x-tabs>
 * -----------------------------------------------------------------------------
 */
export function tabs(element, options = {}) {
  // #448: no classList.add('x-tabs') -- no CSS selector anywhere depends
  // on the bare class.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-tabs> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-tabs> tag does not get a redundant class.
  if (element.tagName.toLowerCase() !== 'x-tabs') element.classList.add('x-tabs');

  // 1. Check if structure exists (Pre-rendered from Template)
  let nav = element.querySelector('.x-tabs__nav');
  let panelsContainer = element.querySelector('.x-tabs__panels');

  // 2. If not, build it from children (Behavior Mode)
  if (!nav) {
    const originalPanels = Array.from(element.children);
    if (originalPanels.length === 0) return () => {};

    // Create Containers
    nav = document.createElement('nav');
    nav.className = 'x-tabs__nav';
    nav.setAttribute('role', 'tablist');
    Object.assign(nav.style, {
      display: 'flex',
      gap: '0',
      borderBottom: '1px solid var(--border-color, #374151)',
      marginBottom: '0.5rem'
    });

    panelsContainer = document.createElement('div');
    panelsContainer.className = 'x-tabs__panels';
    Object.assign(panelsContainer.style, {
      width: '100%',
      marginTop: '0.5rem'
    });

    // tabs.schema.json declares activeTab ("Initially active tab index",
    // default 0), which the docs render as `active-tab`. The opening tab was
    // hard-coded to index 0, so the attribute did nothing (#861). Clamped
    // deliberately: an out-of-range index would open no panel at all, which
    // reads as a broken control rather than a bad attribute value.
    const requestedActive = parseInt(
      options.activeTab ?? element.getAttribute('active-tab') ?? '0', 10,
    );
    const activeIndex = Number.isFinite(requestedActive)
      ? Math.min(Math.max(requestedActive, 0), originalPanels.length - 1)
      : 0;

    // Process Panels
    originalPanels.forEach((panel, i) => {
      // Plain `tab-title`/`tab` is canonical (v3); `data-tab-title` accepted
      // for back-compat (matches the accordion-title dual-read in collapse.js).
      const title = panel.getAttribute('tab-title') || panel.getAttribute('tab') ||
        panel.getAttribute('data-tab-title') || `Tab ${i + 1}`;
      const isActive = i === activeIndex;

      // Create Tab Button
      const button = document.createElement('button');
      // #859: the prefix rename rewrote this class name into an ATTRIBUTE
      // SELECTOR inside a template literal. `[x-tabs]__tab--active` is not
      // a valid CSS identifier, so the active tab matched no rule and
      // rendered identically to an inactive one -- silently, no error.
      button.className = `x-tabs__tab ${isActive ? 'x-tabs__tab--active' : ''}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('index', i);
      button.setAttribute('aria-selected', isActive);
      button.setAttribute('aria-controls', `panel-${i}`);
      button.id = `tab-${i}`;
      button.textContent = title;
      
      Object.assign(button.style, {
        padding: '0.25rem 0.75rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'inherit',
        fontSize: '0.8rem',
        borderBottom: `2px solid ${isActive ? 'var(--primary, #6366f1)' : 'transparent'}`,
        marginBottom: '-1px',
        fontWeight: isActive ? '600' : '400',
        opacity: isActive ? '1' : '0.7'
      });

      nav.appendChild(button);

      // Wrap Panel
      // We move the panel element itself into the container if possible, or wrap its content
      // To preserve event listeners on the panel content, we should just move the node.
      // But we need to wrap it in a section with specific classes/attributes.
      
      const panelWrapper = document.createElement('section');
      panelWrapper.className = 'x-tabs__panel';
      panelWrapper.setAttribute('role', 'tabpanel');
      panelWrapper.setAttribute('index', i);
      panelWrapper.id = `panel-${i}`;
      panelWrapper.setAttribute('aria-labelledby', `tab-${i}`);
      Object.assign(panelWrapper.style, {
        padding: '1rem',
        border: '1px solid var(--border-color, #e0e0e0)',
        borderRadius: '4px',
        background: 'var(--bg-primary, #fff)',
        display: isActive ? 'block' : 'none'
      });
      
      // Move all children of the original panel to the new wrapper
      while (panel.firstChild) {
        panelWrapper.appendChild(panel.firstChild);
      }
      
      panelsContainer.appendChild(panelWrapper);
    });

    // Clear and Append
    element.textContent = '';
    element.appendChild(nav);
    element.appendChild(panelsContainer);
  }

  // 3. Attach Event Listeners
  const clickHandler = (e) => {
    const tab = e.target.closest('.x-tabs__tab');
    if (!tab) return;

    const index = parseInt(tab.getAttribute('index'));

    // Update tabs
    nav.querySelectorAll('.x-tabs__tab').forEach((t, i) => {
      const active = i === index;
      t.classList.toggle('x-tabs__tab--active', active);
      t.style.borderBottomColor = active ? 'var(--primary, #6366f1)' : 'transparent';
      t.style.fontWeight = active ? '600' : '400';
      t.style.opacity = active ? '1' : '0.7';
      t.setAttribute('aria-selected', active);
    });

    // Update panels
    const panels = panelsContainer ? panelsContainer.querySelectorAll('.x-tabs__panel') : element.querySelectorAll('.x-tabs__panel');
    panels.forEach((p, i) => {
      p.style.display = i === index ? 'block' : 'none';
    });

    element.dispatchEvent(new CustomEvent('wb:tabs:change', { 
      bubbles: true, 
      detail: { index, title: tab.textContent } 
    }));
  };

  nav.addEventListener('click', clickHandler);

  return () => {
    element.classList.remove('x-tabs');
    nav.removeEventListener('click', clickHandler);
  };
}

export default tabs;
