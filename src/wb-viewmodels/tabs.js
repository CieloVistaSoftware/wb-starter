/**
 * WB Tabs Behavior
 * -----------------------------------------------------------------------------
 * Tab panels from child elements
 * 
 * Custom Tag: <wb-tabs>
 * -----------------------------------------------------------------------------
 */
export function tabs(element, options = {}) {
  element.classList.add('wb-tabs');

  // 1. Check if structure exists (Pre-rendered from Template)
  let nav = element.querySelector('.wb-tabs__nav');
  let panelsContainer = element.querySelector('.wb-tabs__panels');

  // 2. If not, build it from children (Behavior Mode)
  if (!nav) {
    const originalPanels = Array.from(element.children);
    if (originalPanels.length === 0) return () => {};

    // Create Containers
    nav = document.createElement('nav');
    nav.className = 'wb-tabs__nav';
    nav.setAttribute('role', 'tablist');
    Object.assign(nav.style, {
      display: 'flex',
      gap: '0',
      borderBottom: '1px solid var(--border-color, #374151)',
      marginBottom: '0.5rem'
    });

    panelsContainer = document.createElement('div');
    panelsContainer.className = 'wb-tabs__panels';
    Object.assign(panelsContainer.style, {
      width: '100%',
      marginTop: '0.5rem'
    });

    // Process Panels
    originalPanels.forEach((panel, i) => {
      const title = panel.dataset.tabTitle || panel.dataset.tab || `Tab ${i + 1}`;
      const isActive = i === 0;

      // Create Tab Button
      const button = document.createElement('button');
      button.className = `wb-tabs__tab ${isActive ? 'wb-tabs__tab--active' : ''}`;
      button.setAttribute('role', 'tab');
      button.dataset.index = i;
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
      panelWrapper.className = 'wb-tabs__panel';
      panelWrapper.setAttribute('role', 'tabpanel');
      panelWrapper.dataset.index = i;
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
    const tab = e.target.closest('.wb-tabs__tab');
    if (!tab) return;

    const index = parseInt(tab.dataset.index);

    // Update tabs
    nav.querySelectorAll('.wb-tabs__tab').forEach((t, i) => {
      const active = i === index;
      t.classList.toggle('wb-tabs__tab--active', active);
      t.style.borderBottomColor = active ? 'var(--primary, #6366f1)' : 'transparent';
      t.style.fontWeight = active ? '600' : '400';
      t.style.opacity = active ? '1' : '0.7';
      t.setAttribute('aria-selected', active);
    });

    // Update panels
    const panels = panelsContainer ? panelsContainer.querySelectorAll('.wb-tabs__panel') : element.querySelectorAll('.wb-tabs__panel');
    panels.forEach((p, i) => {
      p.style.display = i === index ? 'block' : 'none';
    });

    element.dispatchEvent(new CustomEvent('wb:tabs:change', { 
      bubbles: true, 
      detail: { index, title: tab.textContent } 
    }));
  };

  nav.addEventListener('click', clickHandler);

  element.dataset.wbReady = 'tabs';
  return () => {
    element.classList.remove('wb-tabs');
    nav.removeEventListener('click', clickHandler);
  };
}

export default tabs;
