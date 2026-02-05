/**
 * Sidebar, right panel, and tab switching.
 * - Toggle visibility, panel state management.
 */
export function cc() {}

// === TOGGLE FUNCTIONS ===

/**
 * Toggle left sidebar visibility
 */
export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  if (sidebar.wbToggle) {
    sidebar.wbToggle();
  } else {
    // Fallback: manual toggle
    const isCollapsed = sidebar.classList.toggle('collapsed');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) toggleBtn.textContent = isCollapsed ? '▶' : '◀';
  }
}

/**
 * Toggle right panel visibility
 */
export function togglePanel() {
  const panel = document.getElementById('panelRight');
  if (!panel) return;
  
  if (panel.wbToggle) {
    panel.wbToggle();
  } else {
    // Fallback: manual toggle
    const panelCollapsed = panel.classList.toggle('collapsed');
    const collapseToggle = document.getElementById('panelToggle');
    if (collapseToggle) collapseToggle.textContent = panelCollapsed ? '◀' : '▶';
  }
}

/**
 * Switch between Tree+Props (combined) and Decorate tabs in Right Panel
 * CRITICAL: Tree tab is DEFAULT. NEVER auto-switch tabs. User controls tabs.
 * @param {string} tab - 'tree', 'props', or 'decorate'
 */
export function switchPanelTab(tab) {
  const treeTab = document.getElementById('tabTree');
  const decorateTab = document.getElementById('tabDecorate');
  const componentList = document.getElementById('componentList');
  const propsPanel = document.getElementById('propsPanel');
  const decoratePanel = document.getElementById('decoratePanel');
  
  // Headers for each tab
  const treeHeader = document.getElementById('treeHeader');
  const propsHeader = document.getElementById('propsHeader');
  const decorateHeader = document.getElementById('decorateHeader');

  // Reset all tabs, panels, and headers
  treeTab?.classList.remove('active');
  decorateTab?.classList.remove('active');
  if (componentList) componentList.style.display = 'none';
  if (propsPanel) {
    propsPanel.style.display = 'none';
    propsPanel.classList.remove('open');
  }
  if (decoratePanel) {
    decoratePanel.style.display = 'none';
    decoratePanel.classList.remove('open');
  }
  if (treeHeader) treeHeader.style.display = 'none';
  if (propsHeader) propsHeader.style.display = 'none';
  if (decorateHeader) decorateHeader.style.display = 'none';

  // Handle 'props' as alias for 'tree' (combined view)
  if (tab === 'props') tab = 'tree';

  // Activate selected tab
  if (tab === 'tree') {
    treeTab?.classList.add('active');
    // Show BOTH tree and props in combined view
    if (componentList) componentList.style.display = 'flex';
    if (treeHeader) treeHeader.style.display = 'flex';
    
    // Explicitly show Properties header to distinguish the section
    if (propsHeader) {
      propsHeader.style.display = 'flex';
      propsHeader.style.borderTop = '1px solid var(--border-color)';
    }

    // Also show props panel below tree with shared space
    if (propsPanel) {
      propsPanel.style.display = 'flex';
      propsPanel.classList.add('open');
      propsPanel.style.flex = '1';
      propsPanel.style.overflowY = 'auto';
      propsPanel.style.minHeight = '0';
    }
    
    // Render props if we have a selection
    if (window.sel && window.renderProps) {
      window.renderProps(window.sel);
    }
  } else if (tab === 'decorate') {
    decorateTab?.classList.add('active');
    if (decoratePanel) {
      decoratePanel.style.display = 'flex';
      decoratePanel.classList.add('open');
    }
    if (decorateHeader) decorateHeader.style.display = 'flex';
    
    // Render decorations if we have a selection
    if (window.sel && typeof window.renderDecorationsPanel === 'function') {
      window.renderDecorationsPanel(window.sel, decoratePanel);
    } else if (decoratePanel) {
      decoratePanel.innerHTML = `
        <div class="prop-panel-flexcol">
          <div class="prop-loading" style="text-align: center; padding: 2rem;">
            <span style="font-size: 2rem;">🎯</span>
            <p style="margin-top: 1rem; color: var(--text-secondary);">Select a component to decorate</p>
          </div>
        </div>
      `;
    }
  }

  localStorage.setItem('wb-active-panel-tab', tab);
}

/**
 * Toggle category section collapse
 * @param {string} categoryId - Category identifier
 */
export function toggleCategory(categoryId) {
  const section = document.getElementById(categoryId + 'Section');
  if (section) {
    section.classList.toggle('collapsed');
    // Save state
    const collapsed = JSON.parse(localStorage.getItem('wb-collapsed-categories') || '{}');
    collapsed[categoryId] = section.classList.contains('collapsed');
    localStorage.setItem('wb-collapsed-categories', JSON.stringify(collapsed));
  }
}

/**
 * Restore collapsed state on load
 */
export function restoreCollapsedCategories() {
  const collapsed = JSON.parse(localStorage.getItem('wb-collapsed-categories') || '{}');
  Object.entries(collapsed).forEach(([id, isCollapsed]) => {
    if (isCollapsed) {
      const section = document.getElementById(id + 'Section');
      if (section) section.classList.add('collapsed');
    }
  });
}

/**
 * Restore properties panel state on load
 */
export function restorePanelTab() {
  const savedTab = localStorage.getItem('wb-active-panel-tab') || 'tree';
  switchPanelTab(savedTab);
}

/**
 * Setup keyboard shortcuts for panels
 */
export function setupPanelKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Skip if typing in input
    if (document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA' ||
      document.activeElement?.isContentEditable) return;

    // \ = Toggle left sidebar
    if (e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
    // ] = Toggle right panel
    if (e.key === ']') {
      e.preventDefault();
      togglePanel();
    }
    // P = Toggle between tree and decorate tabs
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      const currentTab = localStorage.getItem('wb-active-panel-tab') || 'tree';
      switchPanelTab(currentTab === 'tree' ? 'decorate' : 'tree');
    }
    // [ = Toggle both panels
    if (e.key === '[') {
      e.preventDefault();
      toggleSidebar();
      togglePanel();
    }
  });
}

// Expose to window for HTML onclick handlers
window.toggleSidebar = toggleSidebar;
window.togglePanel = togglePanel;
window.switchPanelTab = switchPanelTab;
window.toggleCategory = toggleCategory;
