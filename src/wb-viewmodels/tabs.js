/**
 * WB Tabs Behavior
 * -----------------------------------------------------------------------------
 * Tab navigation with support for <wb-tab> children
 * 
 * Custom Tag: <wb-tabs>
 * Child Tag: <wb-tab label="..." icon="..." disabled closable badge="..." lazy>
 * -----------------------------------------------------------------------------
 */
export function tabs(element, options = {}) {
  element.classList.add('wb-tabs');

  // 1. Check if structure already exists (Pre-rendered from Template)
  let nav = element.querySelector('.wb-tabs__nav');
  let panelsContainer = element.querySelector('.wb-tabs__panels');

  // 2. If not, build it from children (Behavior Mode)
  if (!nav) {
    // Support both <wb-tab> and legacy <div tab-title>
    const originalPanels = Array.from(element.children);
    if (originalPanels.length === 0) return () => {};

    // Find which tab should be active
    let activeIndex = 0;
    originalPanels.forEach((panel, i) => {
      if (panel.hasAttribute('active') || panel.getAttribute('active') === 'true') {
        activeIndex = i;
      }
    });

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
      // Phase 2: 'label' is standard, 'title' is legacy fallback
      // Support <wb-tab label="..."> or legacy <div tab-title="...">
      const isWbTab = panel.tagName.toLowerCase() === 'wb-tab';
      const label = isWbTab 
        ? (panel.getAttribute('label') || panel.getAttribute('title') || `Tab ${i + 1}`)  // 'title' is legacy
        : (panel.dataset.label || panel.dataset.tabTitle || panel.dataset.tab || `Tab ${i + 1}`);
      
      // Get wb-tab specific attributes
      const icon = panel.getAttribute('icon') || '';
      const disabled = panel.hasAttribute('disabled');
      const closable = panel.hasAttribute('closable');
      const badge = panel.getAttribute('badge') || '';
      const lazy = panel.hasAttribute('lazy');
      
      const isActive = i === activeIndex;

      // Create Tab Button
      const button = document.createElement('button');
      button.className = `wb-tabs__tab${isActive ? ' wb-tabs__tab--active' : ''}${disabled ? ' wb-tabs__tab--disabled' : ''}`;
      button.setAttribute('role', 'tab');
      button.dataset.index = i;
      button.setAttribute('aria-selected', isActive);
      button.setAttribute('aria-controls', `panel-${i}`);
      button.id = `tab-${i}`;
      if (disabled) {
        button.setAttribute('aria-disabled', 'true');
        button.disabled = true;
      }
      
      // Build button content: icon + title + badge + close
      let buttonHTML = '';
      if (icon) {
        buttonHTML += `<span class="wb-tabs__icon">${icon}</span>`;
      }
      buttonHTML += `<span class="wb-tabs__title">${label}</span>`;
      if (badge) {
        buttonHTML += `<span class="wb-tabs__badge">${badge}</span>`;
      }
      if (closable) {
        buttonHTML += `<span class="wb-tabs__close" close="${i}" aria-label="Close tab">×</span>`;
      }
      button.innerHTML = buttonHTML;
      
      Object.assign(button.style, {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.75rem',
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: 'inherit',
        fontSize: '0.8rem',
        borderBottom: `2px solid ${isActive ? 'var(--primary, #6366f1)' : 'transparent'}`,
        marginBottom: '-1px',
        fontWeight: isActive ? '600' : '400',
        opacity: disabled ? '0.4' : (isActive ? '1' : '0.7')
      });

      nav.appendChild(button);

      // Create Panel Wrapper
      const panelWrapper = document.createElement('section');
      panelWrapper.className = 'wb-tabs__panel';
      panelWrapper.setAttribute('role', 'tabpanel');
      panelWrapper.dataset.index = i;
      panelWrapper.id = `panel-${i}`;
      panelWrapper.setAttribute('aria-labelledby', `tab-${i}`);
      if (lazy) {
        panelWrapper.dataset.lazy = 'true';
        panelWrapper.dataset.loaded = isActive ? 'true' : 'false';
      }
      Object.assign(panelWrapper.style, {
        padding: '1rem',
        border: '1px solid var(--border-color, #e0e0e0)',
        borderRadius: '4px',
        background: 'var(--bg-primary, #fff)',
        display: isActive ? 'block' : 'none'
      });
      
      // Handle lazy loading
      if (lazy && !isActive) {
        // Store original content for later
        panelWrapper.dataset.lazyContent = panel.innerHTML;
      } else {
        // Move all children of the original panel to the new wrapper
        while (panel.firstChild) {
          panelWrapper.appendChild(panel.firstChild);
        }
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
    // Handle close button click
    const closeBtn = e.target.closest('.wb-tabs__close');
    if (closeBtn) {
      e.stopPropagation();
      const closeIndex = parseInt(closeBtn.dataset.close);
      const tab = nav.querySelector(`[index="${closeIndex}"]`);
      const panel = panelsContainer.querySelector(`[index="${closeIndex}"]`);
      
      element.dispatchEvent(new CustomEvent('wb:tab:close', {
        bubbles: true,
        detail: { 
          index: closeIndex, 
          label: tab?.querySelector('.wb-tabs__title')?.textContent || '',
          title: tab?.querySelector('.wb-tabs__title')?.textContent || ''  // Legacy alias
        }
      }));
      
      // Remove tab and panel
      tab?.remove();
      panel?.remove();
      
      // Reindex remaining tabs and panels
      reindexTabs();
      
      // If we closed the active tab, activate the first available
      const activeTab = nav.querySelector('.wb-tabs__tab--active');
      if (!activeTab) {
        const firstTab = nav.querySelector('.wb-tabs__tab:not(.wb-tabs__tab--disabled)');
        if (firstTab) {
          activateTab(parseInt(firstTab.dataset.index));
        }
      }
      return;
    }
    
    // Handle tab click
    const tab = e.target.closest('.wb-tabs__tab');
    if (!tab || tab.disabled || tab.classList.contains('wb-tabs__tab--disabled')) return;

    const index = parseInt(tab.dataset.index);
    activateTab(index);
  };

  function activateTab(index) {
    const previousIndex = getCurrentActiveIndex();
    
    // Update tabs
    nav.querySelectorAll('.wb-tabs__tab').forEach((t) => {
      const i = parseInt(t.dataset.index);
      const active = i === index;
      const disabled = t.classList.contains('wb-tabs__tab--disabled');
      t.classList.toggle('wb-tabs__tab--active', active);
      t.style.borderBottomColor = active ? 'var(--primary, #6366f1)' : 'transparent';
      t.style.fontWeight = active ? '600' : '400';
      t.style.opacity = disabled ? '0.4' : (active ? '1' : '0.7');
      t.setAttribute('aria-selected', active);
    });

    // Update panels
    const panels = panelsContainer.querySelectorAll('.wb-tabs__panel');
    panels.forEach((p) => {
      const i = parseInt(p.dataset.index);
      const shouldShow = i === index;
      p.style.display = shouldShow ? 'block' : 'none';
      
      // Handle lazy loading
      if (shouldShow && p.dataset.lazy === 'true' && p.dataset.loaded !== 'true') {
        p.innerHTML = p.dataset.lazyContent || '';
        p.dataset.loaded = 'true';
        delete p.dataset.lazyContent;
      }
    });

    element.dispatchEvent(new CustomEvent('wb:tabs:change', { 
      bubbles: true, 
      detail: { index, previousIndex } 
    }));
  }

  function getCurrentActiveIndex() {
    const activeTab = nav.querySelector('.wb-tabs__tab--active');
    return activeTab ? parseInt(activeTab.dataset.index) : 0;
  }

  function reindexTabs() {
    nav.querySelectorAll('.wb-tabs__tab').forEach((tab, i) => {
      tab.dataset.index = i;
      tab.id = `tab-${i}`;
      tab.setAttribute('aria-controls', `panel-${i}`);
      const closeBtn = tab.querySelector('.wb-tabs__close');
      if (closeBtn) closeBtn.dataset.close = i;
    });
    panelsContainer.querySelectorAll('.wb-tabs__panel').forEach((panel, i) => {
      panel.dataset.index = i;
      panel.id = `panel-${i}`;
      panel.setAttribute('aria-labelledby', `tab-${i}`);
    });
  }

  nav.addEventListener('click', clickHandler);

  // Expose methods on the element
  element.setActiveTab = (index) => activateTab(index);
  element.getActiveTab = () => getCurrentActiveIndex();
  element.next = () => {
    const current = getCurrentActiveIndex();
    const tabs = nav.querySelectorAll('.wb-tabs__tab:not(.wb-tabs__tab--disabled)');
    const indices = Array.from(tabs).map(t => parseInt(t.dataset.index));
    const currentPos = indices.indexOf(current);
    if (currentPos < indices.length - 1) {
      activateTab(indices[currentPos + 1]);
    }
  };
  element.prev = () => {
    const current = getCurrentActiveIndex();
    const tabs = nav.querySelectorAll('.wb-tabs__tab:not(.wb-tabs__tab--disabled)');
    const indices = Array.from(tabs).map(t => parseInt(t.dataset.index));
    const currentPos = indices.indexOf(current);
    if (currentPos > 0) {
      activateTab(indices[currentPos - 1]);
    }
  };
  element.first = () => {
    const firstTab = nav.querySelector('.wb-tabs__tab:not(.wb-tabs__tab--disabled)');
    if (firstTab) activateTab(parseInt(firstTab.dataset.index));
  };
  element.last = () => {
    const tabs = nav.querySelectorAll('.wb-tabs__tab:not(.wb-tabs__tab--disabled)');
    if (tabs.length) activateTab(parseInt(tabs[tabs.length - 1].dataset.index));
  };

  element.dataset.wbReady = 'tabs';
  return () => {
    element.classList.remove('wb-tabs');
    nav.removeEventListener('click', clickHandler);
  };
}

/**
 * WB Tab Behavior (no-op, handled by parent wb-tabs)
 * -----------------------------------------------------------------------------
 * The <wb-tab> element is processed by its parent <wb-tabs>.
 * This behavior just marks it as ready.
 * -----------------------------------------------------------------------------
 */
export function tab(element, options = {}) {
  element.classList.add('wb-tab');
  element.dataset.wbReady = 'tab';
  
  // No-op - parent wb-tabs handles everything
  return () => {
    element.classList.remove('wb-tab');
  };
}

export default tabs;
