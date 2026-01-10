// =============================================================================
// BUILDER TREE - Compact 1rem rows, canvas-order sync, green selection
// =============================================================================

let expandedSections = { header: true, main: false, footer: false };
let expandedContainers = {}; // Track expanded state of container components
let activeSection = 'header';
let allSectionsExpanded = true;

// Inject compact styles
(function injectTreeStyles() {
  if (document.getElementById('tree-compact-styles')) return;
  const style = document.createElement('style');
  style.id = 'tree-compact-styles';
  style.textContent = `
    /* Page sections - MUST BE EXPANDABLE */
    .page-section {
      margin-bottom: 4px;
      border: 1px solid var(--border-color, #333);
      border-radius: 4px;
      background: var(--bg-secondary, #1a1a2e);
    }
    .page-section-header {
      display: flex;
      align-items: center;
      padding: 6px 8px;
      cursor: pointer;
      background: var(--bg-tertiary, #252542);
      font-size: 12px;
      gap: 6px;
      user-select: none;
    }
    .page-section-header:hover { background: var(--bg-secondary); }
    .page-section-icon { font-size: 12px; }
    .page-section-title { flex: 1; font-weight: 600; }
    .page-section-count {
      font-size: 10px;
      padding: 1px 6px;
      background: var(--bg-primary);
      border-radius: 8px;
      color: var(--text-muted);
    }
    .page-section-toggle { 
      font-size: 10px; 
      color: var(--text-muted); 
      transition: transform 0.2s;
    }
    
    /* COLLAPSED STATE - body hidden */
    .page-section-body {
      padding: 4px;
      display: block;
    }
    .page-section.collapsed .page-section-body {
      display: none !important;
    }
    .page-section.collapsed .page-section-toggle {
      transform: rotate(-90deg);
    }
    
    /* Active section in tree panel */
    .page-section.active { border-color: #22c55e; }
    .page-section.active .page-section-header { background: #22c55e; color: white; }
    .page-section.active .page-section-count { background: rgba(255,255,255,0.2); color: white; }
    
    /* COMPACT 1rem rows */
    .tree-item {
      display: flex;
      align-items: center;
      height: 1.5rem; /* Increased slightly for better clickability */
      line-height: 1.5rem;
      padding: 0 4px;
      margin: 1px 0;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      gap: 4px;
      background: var(--bg-primary);
      border: 1px solid transparent;
      transition: all 0.1s;
    }
    .tree-item:hover { background: var(--bg-tertiary); }
    .tree-item.selected {
      background: rgba(34, 197, 94, 0.15) !important;
      border-color: #22c55e !important;
      color: #22c55e;
    }
    .tree-item-indent {
      display: inline-block;
      width: 0;
      transition: width 0.1s;
    }
    .tree-toggle-btn {
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 2px;
    }
    .tree-toggle-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    /* Spacer for non-container items ensures alignment */
    .tree-toggle-spacer { width: 14px; display: inline-block; }

    .tree-item-icon { font-size: 12px; flex-shrink: 0; }
    .tree-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tree-item-id { font-size: 9px; color: var(--text-muted); font-family: monospace; display: none; }
    .tree-item:hover .tree-item-id { display: inline; }
    
    .tree-item-del {
      opacity: 0;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 10px;
      padding: 4px;
      border-radius: 4px;
    }
    .tree-item:hover .tree-item-del { opacity: 0.6; }
    .tree-item-del:hover { opacity: 1 !important; color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    
    /* Canvas selection - GREEN for individual components */
    .dropped.selected {
      outline: 2px solid #22c55e !important;
      outline-offset: 2px;
    }
    
    /* Canvas section selection - GREEN for all components in section */
    .dropped.section-selected {
      outline: 2px solid #22c55e !important;
      outline-offset: 2px;
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
    }
    
    /* Empty state */
    .tree-empty {
      padding: 8px;
      text-align: center;
      color: var(--text-muted);
      font-size: 11px;
    }
  `;
  document.head.appendChild(style);
})();

// Get components in canvas order (top to bottom)
function getCanvasComponents() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return [];
  return Array.from(canvas.querySelectorAll('.dropped:not(.grid-child):not(.container-child)'));
}

// Categorize component into header/main/footer
function categorizeComponent(wrapper) {
  const c = JSON.parse(wrapper.dataset.c || '{}');
  const el = wrapper.firstElementChild;  // Get actual component element
  const tag = el?.tagName?.toLowerCase() || c.t || 'div';
  const behavior = (c.b || '').toLowerCase();
  const name = (c.n || '').toLowerCase();
  
  // Header patterns
  if (tag === 'nav' || tag === 'header' || 
      behavior.includes('navbar') || behavior.includes('nav') || behavior.includes('menu') ||
      name.includes('nav') || name.includes('header') || name.includes('menu')) {
    return 'header';
  }
  
  // Footer patterns  
  if (tag === 'footer' || behavior.includes('footer') || name.includes('footer')) {
    return 'footer';
  }
  
  return 'main';
}

// Get all components in a specific section
function getComponentsInSection(section) {
  const components = getCanvasComponents();
  return components.filter(w => categorizeComponent(w) === section);
}

// Render the tree
function renderTree() {
  const panel = document.getElementById('componentList');
  if (!panel) return;
  
  const components = getCanvasComponents();
  const selectedId = window.sel?.id || null;
  
  // Group by section while preserving order within each
  const sections = { header: [], main: [], footer: [] };
  components.forEach(w => {
    const section = categorizeComponent(w);
    sections[section].push(w);
  });
  
  // ALWAYS show Header/Main/Footer sections, even when empty
  panel.innerHTML = `
    ${renderSection('header', '🔝', 'Header', 'Navigation, menus, logo', sections.header, selectedId)}
    ${renderSection('main', '📄', 'Main', 'Content sections for your page', sections.main, selectedId)}
    ${renderSection('footer', '🔻', 'Footer', 'Links, copyright, credits', sections.footer, selectedId)}
  `;
  
  // Update canvas insert points
  updateCanvasInsertPoints();
}

function renderSection(key, icon, title, subtitle, items, selectedId) {
  const isExpanded = expandedSections[key];
  const isActive = activeSection === key;
  
  let itemsHtml = '';
  if (items.length === 0) {
    itemsHtml = '<div class="tree-empty">Empty</div>';
  } else {
    itemsHtml = items.map(w => renderTreeItem(w, selectedId)).join('');
  }
  
  // Use 'collapsed' class when NOT expanded
  const collapsedClass = isExpanded ? '' : 'collapsed';
  
  // Click on header toggles expand/collapse and syncs canvas
  return `
    <div class="page-section ${collapsedClass} ${isActive ? 'active' : ''}" data-section="${key}">
      <div class="page-section-header" onclick="window.selectSection('${key}')">
        <span class="page-section-icon">${icon}</span>
        <div style="flex:1;">
          <span class="page-section-title">${title}</span>
          <div style="font-size:10px; color:var(--text-muted); font-weight:normal;">${subtitle}</div>
        </div>
        <span class="page-section-count">${items.length}</span>
        <span class="page-section-toggle">▼</span>
      </div>
      <div class="page-section-body">${itemsHtml}</div>
    </div>
  `;
}

function renderTreeItem(wrapper, selectedId, level = 0) {
  const c = JSON.parse(wrapper.dataset.c || '{}');
  const id = wrapper.id;
  const isSelected = selectedId === wrapper.id;
  const shortId = id.length > 12 ? id.slice(0, 10) + '…' : id;
  
  // Use the component name (n) which should match template browser name
  const displayName = c.n || c.b || 'Component';
  
  // Checking for container capability
  const isContainer = wrapper.classList.contains('is-container') || c.t === 'section' || c.b === 'container' || c.b === 'grid';
  // Check for ANY children with matching parent ID
  // Note: getCanvasComponents() returns roots, but querySelectorAll('.dropped') gets descendants.
  // We need to find direct children of *this* component.
  const allDropped = Array.from(document.querySelectorAll('.dropped'));
  const children = allDropped.filter(el => el.dataset.parent === id);
  const hasChildren = children.length > 0;
  
  const isExpanded = expandedContainers[id] === true;
  
  // Indentation
  const indentStyle = `width: ${level * 12}px;`;
  
  // Toggle button or spacer
  let toggleHtml = '<span class="tree-toggle-spacer"></span>';
  if (isContainer || hasChildren) {
    toggleHtml = `
      <span class="tree-toggle-btn" onclick="event.stopPropagation(); window.toggleContainerExpand('${id}')">
        ${isExpanded ? '▼' : '▶'}
      </span>
    `;
  }
  
  let html = `
    <div class="tree-item ${isSelected ? 'selected' : ''}" data-id="${id}" onclick="window.selectFromTree('${id}')">
      <span class="tree-item-indent" style="${indentStyle}"></span>
      ${toggleHtml}
      <span class="tree-item-icon">${c.i || '📦'}</span>
      <span class="tree-item-name">${displayName}</span>
      <span class="tree-item-id">#${shortId}</span>
      <button class="tree-item-del" onclick="event.stopPropagation(); window.del('${id}')" title="Delete">✕</button>
    </div>
  `;
  
  // Recursively render children if expanded
  if (isExpanded && hasChildren) {
    html += children.map(child => renderTreeItem(child, selectedId, level + 1)).join('');
  }
  
  return html;
}

// Toggle container expansion
window.toggleContainerExpand = (id) => {
  expandedContainers[id] = !expandedContainers[id];
  renderTree();
};

// Toggle section expand/collapse - clicking header toggles expand state
window.toggleSectionExpand = (section) => {
  console.log('[Tree] Toggle expand:', section);
  expandedSections[section] = !expandedSections[section];
  
  // Sync with canvas section and properties panel
  syncSectionState(section, expandedSections[section]);
  
  renderTree();
};

// Sync section state across all panels (tree, canvas, properties)
function syncSectionState(section, isExpanded) {
  // Dispatch event for template browser to sync
  const collapsed = JSON.parse(localStorage.getItem('tb-collapsed-sections') || '{}');
  collapsed[section] = !isExpanded;
  localStorage.setItem('tb-collapsed-sections', JSON.stringify(collapsed));
  
  // Also sync properties panel sections if visible
  const propCategory = document.querySelector(`.prop-category[data-section="${section}"]`);
  if (propCategory) {
    propCategory.classList.toggle('collapsed', !isExpanded);
  }
}

// Unified Section Activation - Single Source of Truth
window.unifiedActivateSection = (sectionId) => {
  // 1. Update State - FOCUS MODE (Collapse others)
  activeSection = sectionId;
  const sections = ['header', 'main', 'footer'];
  sections.forEach(s => expandedSections[s] = (s === sectionId));
  
  // 2. Perform Layout Updates Synchronously
  const viewport = document.getElementById('viewport');
  const targetSection = document.querySelector(`.canvas-section[data-section="${sectionId}"]`);
  
  if (targetSection && viewport) {
    // A. Apply classes to trigger layout change (collapsing siblings)
    document.querySelectorAll('.canvas-section').forEach(s => {
      const isTarget = (s.getAttribute('data-section') === sectionId);
      s.classList.toggle('collapsed', !isTarget);
      s.classList.toggle('is-target', isTarget);
    });

    // B. Calculate scroll position immediately after layout update
    // Force browser to recalculate layout by reading offsetTop
    // We want the target section to appear at the very top of the viewport
    
    let scrollTarget = 0;
    
    if (sectionId === 'header') {
       // Header is always at the absolute top
       scrollTarget = 0;
    } else {
       // For Main/Footer, we want to align them to the top
       // Since the siblings above are collapsed (but maybe still have a bar height),
       // we simply calculate the element's position relative to the scroll container.
       // The easy way: relative offset to the frame + frame's offset in viewport
       // Or safer: scrollIntoView logic manually manually implemented
       
       // Because we just changed classes, we must let the browser know we want new positions
       // offsetTop forces a reflow, so it gets the correct new position
       const elementTop = targetSection.offsetTop;
       
       // .frame has padding/border, and .viewport has padding.
       // We want to line up the element top with the viewport top (or close to it)
       // The simple heuristic: scroll to the element's offsetTop (relative to #canvas frame)
       // This ignores the #canvas margins/padding inside viewport, but 
       // typically #canvas is centered or has 1rem padding.
       
       // Let's check viewport scrollTop context.
       // viewport -> frame -> section
       // If I scroll viewport.scrollTop to X.
       
       // Let's use getBoundingClientRect logic which accounts for everything
       // However, we need to apply the scroll *relative* to current position
       const vRect = viewport.getBoundingClientRect();
       const tRect = targetSection.getBoundingClientRect(); // This forces reflow with new classes
       
       // Current scroll position
       const currentScroll = viewport.scrollTop;
       
       // Calculate delta to move target top to viewport top + 10px padding
       // delta = tRect.top - vRect.top
       // newScroll = currentScroll + delta - padding
       scrollTarget = currentScroll + (tRect.top - vRect.top) - 10;
    }

    // C. Execute Scroll
    viewport.scrollTo({ top: scrollTarget, behavior: 'auto' });
  }
  
  // 3. Update Properties Panel
  document.querySelectorAll('.prop-category[data-section]').forEach(cat => {
      cat.classList.toggle('collapsed', cat.dataset.section !== sectionId);
  });
  
  // 4. Update Tree UI
  renderTree();
  
  // 5. Dispatch Event
  document.dispatchEvent(new CustomEvent('wb:section:activated', { 
    detail: { section: sectionId, expanded: true } 
  }));
};

// SELECT a section - calls unified activator
window.selectSection = (section) => {
  window.unifiedActivateSection(section);
};

// Legacy function - now calls selectSection
window.toggleTreeSection = (section) => {
  window.selectSection(section);
};

// Scroll canvas to the first component in a section (used externally)
window.scrollCanvasToSection = (section) => {
  const sectionComponents = getComponentsInSection(section);
  
  if (sectionComponents.length > 0) {
    sectionComponents[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      const positions = { header: 0, main: 0.3, footer: 0.85 };
      const scrollTarget = canvas.scrollHeight * (positions[section] || 0);
      canvas.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }
  }
};

// Select from tree - scrolls canvas to element and clears section selection
window.selectFromTree = (id) => {
  const wrapper = document.getElementById(id);
  if (!wrapper) return;
  
  // Clear section selection
  document.querySelectorAll('.dropped.section-selected').forEach(el => el.classList.remove('section-selected'));
  activeSection = null;
  
  // Use the builder's selection function
  if (window.selComp) {
    window.selComp(wrapper, null, true);
  } else {
    // Fallback
    document.querySelectorAll('.dropped').forEach(d => d.classList.remove('selected'));
    wrapper.classList.add('selected');
    window.sel = wrapper;
  }
  
  // Scroll canvas to element
  wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Re-render to clear active section highlight
  renderTree();
};

// Scroll tree to selected item
window.scrollTreeToSelected = (id) => {
  const treeItem = document.querySelector(`.tree-item[data-id="${id}"]`);
  if (treeItem) {
    treeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

// Collapse/expand ALL sections at once
window.setAllTreeSections = (expanded) => {
  allSectionsExpanded = expanded;
  expandedSections.header = expanded;
  expandedSections.main = expanded;
  expandedSections.footer = expanded;
  renderTree();
};

window.getActiveSection = () => activeSection;
window.setActiveSection = (section) => {
  activeSection = section;
  if (section) expandedSections[section] = true;
  renderTree();
};

// Clear section selection (called when clicking elsewhere)
window.clearSectionSelection = () => {
  document.querySelectorAll('.dropped.section-selected').forEach(el => el.classList.remove('section-selected'));
  activeSection = null;
  renderTree();
};

// Expose globally
window.renderTree = renderTree;
window.initTree = initTree;

// export { initTree, renderTree }; // Moved to bottom

// Update insert points on canvas between components
function updateCanvasInsertPoints() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // Remove existing insert points (except the main button)
  canvas.querySelectorAll('.insert-between').forEach(el => el.remove());
  
  const components = Array.from(canvas.querySelectorAll('.dropped'));
  
  // Add insert points between each component
  components.forEach((comp, index) => {
    // Add insert point after each component
    const insertPoint = document.createElement('div');
    insertPoint.className = 'insert-between';
    insertPoint.onclick = () => {
      if (window.openChooser) {
        window.openChooser('after', comp.id);
      }
    };
    comp.after(insertPoint);
  });
}
window.updateCanvasInsertPoints = updateCanvasInsertPoints;

// Auto-extend canvas
window.autoExtendCanvas = function() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // Enforce 100% height at all times
  canvas.style.minHeight = '100%';
};

// Initialize
function initTree() {
  // Try to sync with existing DOM state if available
  if (window.getActiveSection) {
    const current = window.getActiveSection();
    if (current && current !== 'main') { // 'main' is fallback, ignore if we want header default
       activeSection = current;
       expandedSections[current] = true;
    }
  }

  // Ensure initial sync
  renderTree();
  
  // Listen for canvas section clicks to sync state
  document.addEventListener('wb:canvas:section:clicked', (e) => {
    const section = e.detail.section;
    if (section) {
      // Expand this section in tree
      expandedSections[section] = true;
      activeSection = section;
      renderTree();
    }
  });
  
  // Listen for canvas section toggle events
  document.addEventListener('wb:canvas:section:toggled', (e) => {
    const section = e.detail.section;
    const expanded = e.detail.expanded;
    if (section) {
      expandedSections[section] = expanded;
      if (expanded) activeSection = section;
      renderTree();
    }
  });
  
  // Listen for template browser section toggles to sync state
  document.addEventListener('wb:template:section:toggled', (e) => {
    const section = e.detail.section;
    const expanded = e.detail.expanded;
    if (section) {
      expandedSections[section] = expanded;
      if (expanded) activeSection = section;
      renderTree();
    }
  });
  
  window.WB_TREE_INITIALIZED = true;
}

// Auto-init only if not a module environment (legacy fallback)
// If imported as module, caller must invoke initTree
if (typeof process === 'undefined' && !window.WB_BUILDER_MODULE_MODE) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.WB_TREE_INITIALIZED) initTree();
    });
  } else {
    // Only init if not already done
    if (!window.WB_TREE_INITIALIZED) initTree();
  }
}
export { initTree, renderTree };
