/**
 * WB Builder Canvas Sections
 * Header/Main/Footer structure with targeted insertion
 */

// State
let currentView = 'site'; // Enforce site view
let targetSection = 'header'; // START WITH HEADER - first thing users add
let insertMode = 'append'; // 'append', 'before', 'after', 'inside'
let insertTarget = null;
let idCounter = Date.now();

// --- Helpers ---

function saveHistory() {
  if (window.saveHist) window.saveHist();
}

function showToast(msg) {
  if (window.toast) window.toast(msg);
}

function cleanupDragIndicators() {
  document.querySelectorAll('.drag-above, .drag-below, .drag-target').forEach(el => {
    el.classList.remove('drag-above', 'drag-below', 'drag-target');
  });
}

function removeEmptyState(container) {
  container?.querySelector('.section-empty')?.remove();
}

// --- Main Logic ---

/**
 * Initialize section-based canvas
 */
export function initCanvasSections() {
  // Inject styles first
  injectSectionStyles();
  
  // Initialize Site View (Enforced)
  initSiteView();
  
  console.log('[CanvasSections] Initialized, view:', currentView);
}

/**
 * Add view toggle button to left sidebar
 */
function addViewToggleButton() {
  // Remove existing
  document.getElementById('viewToggleContainer')?.remove();
  
  const toggleContainer = document.createElement('div');
  toggleContainer.id = 'viewToggleContainer';
  toggleContainer.className = 'view-toggle-container';
  
  toggleContainer.innerHTML = `
    <div class="view-toggle">
      <button id="sections-btn" class="view-btn ${currentView === 'site' ? 'active' : ''}" view="site" onclick="window.setCanvasView('site')">
        <span class="view-icon">📄</span>
        <span class="view-label">Page View</span>
      </button>
      <button id="components-btn" class="view-btn ${currentView === 'components' ? 'active' : ''}" view="components" onclick="window.setCanvasView('components')">
        <span class="view-icon">🧩</span>
        <span class="view-label">Components</span>
      </button>
    </div>
    <p class="view-hint">Press 'V' to toggle</p>
  `;
  
  // Insert at top of sidebar
  const sidebar = document.getElementById('sidebar') || document.getElementById('templateBrowser');
  if (sidebar) {
    const firstChild = sidebar.querySelector('.search-container') || sidebar.firstChild;
    if (firstChild) {
      sidebar.insertBefore(toggleContainer, firstChild);
    } else {
      sidebar.insertBefore(toggleContainer, sidebar.firstChild);
    }
  }
}

/**
 * Toggle between views
 */
function toggleView() {
  setCanvasView(currentView === 'site' ? 'components' : 'site');
}

/**
 * Switch canvas view
 */
export function setCanvasView(view) {
  currentView = view;
  localStorage.setItem('wb-canvas-view', view);
  
  // Update toggle buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  if (view === 'site') {
    initSiteView();
  } else {
    initComponentsView();
  }
  
  showToast(`${view === 'site' ? 'Page' : 'Components'} View`);
}

/**
 * Initialize Site View (Header/Main/Footer)
 */
function initSiteView() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // Check if already in site view
  if (canvas.querySelector('#canvas-header')) {
    updateSectionUI();
    return;
  }
  
  // Collect existing content
  const existingElements = [];
  canvas.querySelectorAll(':scope > .dropped').forEach(el => {
    existingElements.push(el);
  });
  
  // Create structure
  canvas.innerHTML = `
    <header id="canvas-header" class="canvas-section collapsed" section="header">
      <div class="section-bar" onclick="window.toggleCanvasSection && window.toggleCanvasSection('header')">
        <span class="section-icon">🔝</span>
        <span class="section-name">Header</span>
        <span class="section-id">#canvas-header</span>
      </div>
      <div class="section-content" drop-zone="header"></div>
    </header>
    
    <main id="canvas-main" class="canvas-section canvas-section--main collapsed" section="main">
      <div class="section-bar" onclick="window.toggleCanvasSection && window.toggleCanvasSection('main')">
        <span class="section-icon">📄</span>
        <span class="section-name" id="main-section-name">Main Content</span>
        <span class="section-id">#canvas-main</span>
      </div>
      <div class="section-content" drop-zone="main"></div>
    </main>
    
    <footer id="canvas-footer" class="canvas-section collapsed" section="footer">
      <div class="section-bar" onclick="window.toggleCanvasSection && window.toggleCanvasSection('footer')">
        <span class="section-icon">🔻</span>
        <span class="section-name">Footer</span>
        <span class="section-id">#canvas-footer</span>
      </div>
      <div class="section-content" drop-zone="footer"></div>
    </footer>
  `;
  
  // Move existing content to correct section
  const mainZone = canvas.querySelector('[drop-zone="main"]');
  existingElements.forEach(el => {
    ensureElementSetup(el);
    
    // Check for saved section
    let sectionId = 'main';
    try {
      const c = JSON.parse(el.dataset.c || '{}');
      if (c.d && c.d._section) {
        sectionId = c.d._section;
      }
    } catch (e) {}
    
    const zone = canvas.querySelector(`[drop-zone="${sectionId}"]`) || mainZone;
    zone.appendChild(el);
  });
  
  // Setup interactions
  setupCanvasInteractions(canvas);
  
  // Activate default section (Fix regression: header collapsed)
  if (targetSection) {
      const section = canvas.querySelector(`.canvas-section[section="${targetSection}"]`);
      if (section) {
          section.classList.remove('collapsed');
          section.classList.add('is-target');
      }
  }
  
  // Show empty states
  updateEmptyStates();
}

/**
 * Initialize Components View (flat canvas)
 */
function initComponentsView() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // Collect all elements from sections
  const allElements = [];
  canvas.querySelectorAll('.canvas-section .dropped').forEach(el => {
    allElements.push(el);
  });
  
  // Clear and rebuild
  canvas.innerHTML = '';
  canvas.classList.add('components-view');
  
  // Add elements back
  allElements.forEach(el => {
    ensureElementSetup(el);
    canvas.appendChild(el);
  });
  
  // Setup interactions
  setupCanvasInteractions(canvas);
  
  if (allElements.length === 0) {
    canvas.innerHTML = `
      <div class="canvas-empty">
        <div class="empty-icon">🧩</div>
        <div class="empty-text">Drag components here</div>
      </div>
    `;
  }
}

/**
 * Set target section for new elements
 */
export function setTargetSection(sectionId) {
  // Prefer unified activator if available (Maintains single source of truth)
  if (window.unifiedActivateSection) {
    window.unifiedActivateSection(sectionId);
    
    // Also update local state
    targetSection = sectionId;
    insertMode = 'append';
    insertTarget = null;
    updateInsertIndicator();
    return;
  }

  targetSection = sectionId;
  insertMode = 'append';
  insertTarget = null;
  
  // Update canvas UI - remove is-target and add collapsed back to others
  document.querySelectorAll('.canvas-section').forEach(section => {
    const isTarget = section.dataset.section === sectionId;
    section.classList.toggle('is-target', isTarget);
    
    // Expand target section, collapse others
    if (isTarget) {
      section.classList.remove('collapsed');
    } else {
      section.classList.add('collapsed');
    }
  });
  
  // Clear insert indicators
  document.querySelectorAll('.insert-indicator').forEach(i => i.remove());
  document.querySelectorAll('.dropped').forEach(el => {
    el.classList.remove('insert-before', 'insert-after', 'insert-inside');
  });
  
  // Update sidebar indicator
  updateInsertIndicator();
  
  // Sync expand state to template browser localStorage
  const collapsed = JSON.parse(localStorage.getItem('tb-collapsed-sections') || '{"header":true,"main":true,"footer":true}');
  collapsed[sectionId] = false; // Expand this section
  localStorage.setItem('tb-collapsed-sections', JSON.stringify(collapsed));
  
  // Dispatch event to sync tree panel
  document.dispatchEvent(new CustomEvent('wb:canvas:section:clicked', { detail: { section: sectionId } }));
  
  // Scroll to section - 5rem (80px) below header
  const pageSection = document.querySelector(`[section="${sectionId}"]`);
  if (section) {
    const builderHeader = document.getElementById('builderHeader');
    const headerHeight = builderHeader ? builderHeader.offsetHeight : 0;
    const offset = headerHeight + 80; // 5rem = 80px
    
    const viewport = document.getElementById('viewport');
    if (viewport) {
      const sectionTop = section.offsetTop;
      viewport.scrollTo({ top: Math.max(0, sectionTop - offset), behavior: 'smooth' });
    }
  }
}

/**
 * Set insertion point relative to an element
 */
export function setInsertPoint(elementId, mode) {
  const element = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!element) return;
  
  insertTarget = element;
  insertMode = mode;
  
  // Clear previous indicators
  document.querySelectorAll('.dropped').forEach(el => {
    el.classList.remove('insert-before', 'insert-after', 'insert-inside');
  });
  
  // Add indicator class
  element.classList.add(`insert-${mode}`);
  
  // Determine section from element
  const section = element.closest('.canvas-section');
  if (section) {
    targetSection = section.dataset.section;
    document.querySelectorAll('.canvas-section').forEach(s => {
      s.classList.toggle('is-target', s.dataset.section === targetSection);
    });
  }
  
  updateInsertIndicator();
  closeAllMenus();
  
  showToast(`Insert ${mode} this element`);
}

/**
 * Clear insertion point
 */
export function clearInsertPoint() {
  insertTarget = null;
  insertMode = 'append';
  
  document.querySelectorAll('.dropped').forEach(el => {
    el.classList.remove('insert-before', 'insert-after', 'insert-inside');
  });
  
  updateInsertIndicator();
}

/**
 * Update insert indicator in sidebar
 */
function updateInsertIndicator() {
  let indicator = document.getElementById('insertIndicator');
  
  if (!indicator) {
    const container = document.getElementById('viewToggleContainer');
    if (container) {
      indicator = document.createElement('div');
      indicator.id = 'insertIndicator';
      indicator.className = 'insert-indicator-bar';
      container.appendChild(indicator);
    }
  }
  
  if (!indicator) return;
  
  const sectionName = targetSection.charAt(0).toUpperCase() + targetSection.slice(1);
  
  if (insertTarget) {
    const targetName = insertTarget.dataset?.wb || 
                       insertTarget.querySelector('')?.dataset?.wb || 
                       'element';
    indicator.innerHTML = `
      <div class="insert-info">
        <span class="insert-icon">📍</span>
        <span>Insert <strong>${insertMode}</strong> "${targetName}"</span>
      </div>
      <button class="insert-clear" onclick="window.clearInsertPoint()">✕</button>
    `;
    indicator.classList.add('has-target');
  } else {
    indicator.innerHTML = `
      <div class="insert-info">
        <span class="insert-icon">➕</span>
        <span>Adding to <strong>${sectionName}</strong></span>
      </div>
    `;
    indicator.classList.remove('has-target');
  }
}

/**
 * Get current drop configuration
 */
export function getDropConfig() {
  return {
    section: targetSection,
    mode: insertMode,
    target: insertTarget,
    dropZone: document.querySelector(`[drop-zone="${targetSection}"]`) || document.getElementById('canvas')
  };
}

/**
 * Update element section metadata
 */
function updateElementSection(element) {
  const section = element.closest('.canvas-section');
  if (!section) return;
  
  const sectionId = section.dataset.section;
  
  try {
    const c = JSON.parse(element.dataset.c || '{}');
    if (!c.d) c.d = {};
    c.d._section = sectionId;
    element.dataset.c = JSON.stringify(c);
  } catch (e) {
    console.error('Error updating element section:', e);
    // Initialize if broken
    element.dataset.c = JSON.stringify({ d: { _section: sectionId } });
  }
}

/**
 * Add HTML to a specific section
 * @param {string} html - HTML string to add
 * @param {string} section - 'header' | 'main' | 'footer'
 * @param {object} template - Optional template metadata
 */
export function addHTMLToSection(html, section, template = null) {
  // Set target section
  targetSection = section;
  insertMode = 'append';
  insertTarget = null;
  
  // Update UI
  updateSectionUI();
  
  // Create wrapper element
  const wrapper = document.createElement('div');
  wrapper.className = 'dropped';
  wrapper.innerHTML = html;
  
  // If template has metadata, store it
  if (template) {
    wrapper.dataset.templateId = template.id;
    wrapper.dataset.templateName = template.name;
  }
  
  // Add to canvas
  addElementToCanvas(wrapper);
  
  // Re-init behaviors
  if (window.WB?.scan) window.WB.scan(wrapper);
  
  saveHistory();
  
  // Refresh tree
  if (window.renderComponentList) window.renderComponentList();
  
  return wrapper;
}

// Expose globally
window.addHTMLToSection = addHTMLToSection;

/**
 * Add element to canvas (called by template browser and drag-drop)
 */
export function addElementToCanvas(element) {
  // Ensure setup
  ensureElementSetup(element);
  
  // Get drop zone
  const dropZone = document.querySelector(`[drop-zone="${targetSection}"]`) || 
                   document.getElementById('canvas');
  
  // Insert based on mode
  if (insertTarget && insertMode !== 'append') {
    switch (insertMode) {
      case 'before':
        insertTarget.before(element);
        break;
      case 'after':
        insertTarget.after(element);
        break;
      case 'inside':
        // Find inner container or append to element
        const inner = insertTarget.querySelector('.section-content, [data-drop-zone], wb-container') || 
                      insertTarget.querySelector('') ||
                      insertTarget;
        inner.appendChild(element);
        break;
    }
    
    // Clear insert point after use
    clearInsertPoint();
  } else {
    // Remove empty state if present
    removeEmptyState(dropZone);
    dropZone.appendChild(element);
  }
  
  // Update section data
  updateElementSection(element);
  
  // Update empty states
  updateEmptyStates();
  
  // Scroll into view
  setTimeout(() => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
  
  return element;
}

/**
 * Track component counts for readable ID generation
 */
const componentCounts = {};

/**
 * Generate a readable ID for a component
 * e.g., "column2-1", "sidebarLeft-2", "hero-1"
 */
function generateReadableId(element) {
  // Try to get the component name from various sources
  let baseName = '';
  
  // Check c for template/component info
  try {
    const c = JSON.parse(element.dataset.c || '{}');
    baseName = c.n || c.b || '';
  } catch (e) {}
  
  // Check template name
  if (!baseName && element.dataset.templateName) {
    baseName = element.dataset.templateName;
  }
  
  // Check wb attribute
  if (!baseName) {
    const wbEl = element.querySelector('');
    baseName = element.dataset?.wb || wbEl?.dataset?.wb || '';
  }
  
  // Clean up the name - remove spaces, special chars, convert to camelCase
  baseName = baseName
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
    .split(/[\s-]+/)                  // Split on spaces and dashes
    .map((word, i) => {
      if (i === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('') || 'el';
  
  // Increment counter for this base name
  if (!componentCounts[baseName]) {
    componentCounts[baseName] = 0;
  }
  componentCounts[baseName]++;
  
  return `${baseName}-${componentCounts[baseName]}`;
}

/**
 * Ensure element has ID and controls
 */
function ensureElementSetup(element) {
  // Ensure ID - use readable format
  if (!element.id) {
    element.id = generateReadableId(element);
  }
  
  // Ensure controls
  if (!element.querySelector('.el-controls')) {
    addElementControls(element);
  }
  
  // Make draggable for reordering
  element.draggable = true;
  
  return element;
}

/**
 * Add control buttons to element
 */
function addElementControls(element) {
  // Remove old controls if they exist
  element.querySelector('.el-controls')?.remove();
  element.querySelector('.controls')?.remove(); // Old style
  element.querySelector('.el-id-label')?.remove(); // Old ID label
  
  // Add ID label
  const idLabel = document.createElement('span');
  idLabel.className = 'el-id-label';
  idLabel.textContent = '#' + element.id;
  element.insertBefore(idLabel, element.firstChild);
  
  const controls = document.createElement('div');
  controls.className = 'el-controls';
  controls.innerHTML = `
    <button id="btn-drag-${element.id}" class="el-btn el-btn-drag" title="Drag to reorder">⋮⋮</button>
    <button id="btn-insert-${element.id}" class="el-btn el-btn-insert" title="Insert relative to this" onclick="event.stopPropagation(); window.showInsertMenu('${element.id}', event)">+</button>
    <button id="btn-delete-${element.id}" class="el-btn el-btn-delete" title="Remove" onclick="event.stopPropagation(); window.removeCanvasElement('${element.id}')">✕</button>
  `;
  
  element.insertBefore(controls, element.firstChild);
}

/**
 * Remove element from canvas
 */
export function removeCanvasElement(id) {
  const element = document.getElementById(id);
  if (!element) return;
  
  // Check for nested content
  const hasChildren = element.querySelectorAll('.dropped').length > 0;
  if (hasChildren) {
    if (!confirm('Remove this element and all its contents?')) return;
  }
  
  // Store section for empty state check
  const section = element.closest('.canvas-section');
  
  element.remove();
  
  // Update empty states
  updateEmptyStates();
  
  saveHistory();
  showToast('Removed');
  
  closeAllMenus();
}

/**
 * Show insert menu for element
 */
function showInsertMenu(id, event) {
  closeAllMenus();
  
  const element = document.getElementById(id);
  if (!element) return;
  
  const menu = document.createElement('div');
  menu.className = 'el-menu';
  menu.id = 'elementMenu';
  
  menu.innerHTML = `
    <div class="el-menu-header">Insert Position</div>
    <button onclick="window.setInsertPoint('${id}', 'before')">
      <span class="menu-icon">↑</span> Before this element
    </button>
    <button onclick="window.setInsertPoint('${id}', 'after')">
      <span class="menu-icon">↓</span> After this element
    </button>
    <button onclick="window.setInsertPoint('${id}', 'inside')">
      <span class="menu-icon">⤵</span> Inside this element
    </button>
    <hr>
    <div class="el-menu-header">Actions</div>
    <button onclick="window.duplicateCanvasElement('${id}'); window.closeAllMenus();">
      <span class="menu-icon">⧉</span> Duplicate
    </button>
    <button onclick="window.moveCanvasElement('${id}', 'up'); window.closeAllMenus();">
      <span class="menu-icon">▲</span> Move Up
    </button>
    <button onclick="window.moveCanvasElement('${id}', 'down'); window.closeAllMenus();">
      <span class="menu-icon">▼</span> Move Down
    </button>
    <hr>
    <button onclick="window.moveToSection('${id}', 'header'); window.closeAllMenus();">
      <span class="menu-icon">🔝</span> Move to Header
    </button>
    <button onclick="window.moveToSection('${id}', 'main'); window.closeAllMenus();">
      <span class="menu-icon">📄</span> Move to Main
    </button>
    <button onclick="window.moveToSection('${id}', 'footer'); window.closeAllMenus();">
      <span class="menu-icon">🔻</span> Move to Footer
    </button>
    <hr>
    <button class="danger" onclick="window.removeCanvasElement('${id}')">
      <span class="menu-icon">✕</span> Remove
    </button>
  `;
  
  // Position menu
  menu.style.position = 'fixed';
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.style.zIndex = '10005';
  
  document.body.appendChild(menu);
  
  // Adjust if off-screen
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
  });
  
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 10);
}
window.showInsertMenu = showInsertMenu;

/**
 * Close all menus
 */
function closeAllMenus() {
  document.querySelectorAll('.el-menu').forEach(m => m.remove());
}
window.closeAllMenus = closeAllMenus;

/**
 * Move element up/down
 */
function moveCanvasElement(id, direction) {
  const el = document.getElementById(id);
  if (!el) return;
  
  const sibling = direction === 'up' ? el.previousElementSibling : el.nextElementSibling;
  if (sibling?.classList.contains('dropped')) {
    if (direction === 'up') {
      sibling.before(el);
    } else {
      sibling.after(el);
    }
    saveHistory();
  }
}
window.moveCanvasElement = moveCanvasElement;

/**
 * Move element to different section
 */
function moveToSection(id, sectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  
  const dropZone = document.querySelector(`[drop-zone="${sectionId}"]`);
  if (!dropZone) return;
  
  // Remove empty state
  removeEmptyState(dropZone);
  
  dropZone.appendChild(el);
  updateEmptyStates();
  
  saveHistory();
  showToast(`Moved to ${sectionId}`);
}
window.moveToSection = moveToSection;

/**
 * Duplicate element
 */
function duplicateCanvasElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  
  const clone = el.cloneNode(true);
  
  // Generate new ID
  const behavior = clone.dataset?.wb || clone.querySelector('')?.dataset?.wb || 'el';
  clone.id = `${behavior}-${(++idCounter).toString(36)}`;
  
  // Update nested IDs
  clone.querySelectorAll('[id]').forEach(nested => {
    const nestedBehavior = nested.dataset?.wb || 'el';
    nested.id = `${nestedBehavior}-${(++idCounter).toString(36)}`;
  });
  
  // Update controls
  clone.querySelector('.el-controls')?.remove();
  addElementControls(clone);
  
  el.after(clone);
  
  // Re-init behaviors
  if (window.WB?.scan) window.WB.scan(clone);
  
  saveHistory();
  showToast('Duplicated');
}
window.duplicateCanvasElement = duplicateCanvasElement;

/**
 * Update empty states for sections
 */
function updateEmptyStates() {
  ['header', 'main', 'footer'].forEach(sectionId => {
    const dropZone = document.querySelector(`[drop-zone="${sectionId}"]`);
    if (!dropZone) return;
    
    // Remove empty states - we don't show "click to add" messages anymore
    removeEmptyState(dropZone);
  });
}

/**
 * Update section UI
 */
function updateSectionUI() {
  document.querySelectorAll('.canvas-section').forEach(section => {
    const isTarget = section.dataset.section === targetSection;
    section.classList.toggle('is-target', isTarget);
    
    // Ensure the target is expanded, others collapsed
    if (isTarget) {
      section.classList.remove('collapsed');
    } else {
      section.classList.add('collapsed');
    }
  });
}

/**
 * Setup canvas interactions
 */
function setupCanvasInteractions(canvas) {
  // Click to select element
  canvas.addEventListener('click', (e) => {
    const clickedElement = e.target.closest('.dropped');
    if (!clickedElement) return;
    if (e.target.closest('.el-controls, .el-btn')) return;
    
    // Deselect others
    canvas.querySelectorAll('.dropped.selected').forEach(el => el.classList.remove('selected'));
    clickedElement.classList.add('selected');
    
    // Update properties panel
    if (window.selComp) {
      window.selComp(clickedElement);
    }
  });
  
  // Right-click context menu
  canvas.addEventListener('contextmenu', (e) => {
    const contextElement = e.target.closest('.dropped');
    if (contextElement) {
      e.preventDefault();
      window.showInsertMenu(contextElement.id, e);
    }
  });
  
  // Drag reordering
  setupDragReorder(canvas);
}

/**
 * Setup drag reordering
 */
function setupDragReorder(canvas) {
  let draggedElement = null;
  
  canvas.addEventListener('dragstart', (e) => {
    const droppedStart = e.target.closest('.dropped');
    if (droppedStart) {
      draggedElement = droppedStart;
      droppedStart.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', droppedStart.id);
    }
  });
  
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedElement) return;
    
    const droppedOver = e.target.closest('.dropped');
    if (droppedOver && droppedOver !== draggedElement) {
      const overRect = droppedOver.getBoundingClientRect();
      const overMidY = overRect.top + overRect.height / 2;
      
      // Clear previous indicators
      cleanupDragIndicators();
      
      droppedOver.classList.add(e.clientY < overMidY ? 'drag-above' : 'drag-below');
    }
    
    // Also allow dropping on sections
    const overSection = e.target.closest('.canvas-section');
    if (overSection && !e.target.closest('.dropped')) {
      overSection.classList.add('drag-target');
    }
  });
  
  canvas.addEventListener('dragleave', (e) => {
    const droppedLeave = e.target.closest('.dropped');
    if (droppedLeave) {
      droppedLeave.classList.remove('drag-above', 'drag-below');
    }
    const leaveSection = e.target.closest('.canvas-section');
    if (leaveSection) {
      leaveSection.classList.remove('drag-target');
    }
  });
  
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    
    // Clear all indicators
    cleanupDragIndicators();
    
    if (!draggedElement) return;
    
    const droppedTarget = e.target.closest('.dropped');
    if (droppedTarget && droppedTarget !== draggedElement) {
      const dropRect = droppedTarget.getBoundingClientRect();
      const dropMidY = dropRect.top + dropRect.height / 2;
      
      if (e.clientY < dropMidY) {
        droppedTarget.before(draggedElement);
      } else {
        droppedTarget.after(draggedElement);
      }
      
      saveHistory();
    } else {
      // Dropped on section directly
      const dropSection = e.target.closest('.canvas-section');
      if (dropSection) {
        const dropZone = dropSection.querySelector('[data-drop-zone]');
        if (dropZone) {
          removeEmptyState(dropZone);
          dropZone.appendChild(draggedElement);
          updateEmptyStates();
          saveHistory();
        }
      }
    }
  });
  
  canvas.addEventListener('dragend', () => {
    if (draggedElement) {
      draggedElement.classList.remove('dragging');
      draggedElement = null;
    }
    cleanupDragIndicators();
  });
}

/**
 * Update main section name when page changes
 * @param {string} pageName - Name of the current page
 */
export function updateMainSectionName(pageName) {
  const nameEl = document.getElementById('main-section-name');
  if (nameEl) {
    nameEl.textContent = pageName ? `Main Content / ${pageName}` : 'Main Content';
  }
}

/**
 * Activate main section with green border when page switches
 */
export function activateMainSection() {
  setTargetSection('main');
}

// Expose globally
window.setCanvasView = setCanvasView;
window.setTargetSection = setTargetSection;
window.setInsertPoint = setInsertPoint;
window.clearInsertPoint = clearInsertPoint;
window.removeCanvasElement = removeCanvasElement;
window.addElementToCanvas = addElementToCanvas;
window.getDropConfig = getDropConfig;
window.updateMainSectionName = updateMainSectionName;
window.activateMainSection = activateMainSection;

/**
 * Inject styles
 */
function injectSectionStyles() {
  if (document.getElementById('canvasSectionStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'canvasSectionStyles';
  style.textContent = `
    /* View toggle */
    .view-toggle-container {
      padding: 12px;
      border-bottom: 1px solid var(--border-color, #333);
      background: var(--bg-secondary, #1a1a2e);
    }
    
    .view-toggle {
      display: flex;
      gap: 4px;
      background: var(--bg-tertiary, #0d0d1a);
      border-radius: 8px;
      padding: 4px;
    }
    
    .view-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 8px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: var(--text-secondary, #888);
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .view-btn:hover {
      background: var(--bg-secondary, #252542);
      color: var(--text-primary, #fff);
    }
    
    .view-btn.active {
      background: var(--primary, #6366f1);
      color: #fff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    
    .view-icon { font-size: 18px; }
    .view-label { font-size: 11px; font-weight: 600; }
    
    .view-hint {
      margin: 8px 0 0;
      font-size: 10px;
      color: var(--text-tertiary, #666);
      text-align: center;
    }
    
    /* Insert indicator bar */
    .insert-indicator-bar {
      margin-top: 10px;
      padding: 10px 12px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid var(--primary, #6366f1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    
    .insert-indicator-bar.has-target {
      background: rgba(34, 197, 94, 0.15);
      border-color: #22c55e;
    }
    
    .insert-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-primary, #fff);
    }
    
    .insert-info strong {
      color: var(--primary, #6366f1);
    }
    
    .has-target .insert-info strong {
      color: #22c55e;
    }
    
    .insert-clear {
      background: rgba(255,255,255,0.1);
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      color: var(--text-secondary, #888);
      cursor: pointer;
      font-size: 12px;
    }
    
    .insert-clear:hover {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }
    
    /* Canvas sections */
    #canvas {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      background: var(--bg-primary);
      flex: 1 0 auto;
      padding-bottom: 200px;
    }
    
    .canvas-section {
      position: relative;
      border: 2px solid transparent;
      transition: border-color 0.2s, background 0.2s;
    }
    
    .canvas-section[section="header"] {
      flex-shrink: 0;
    }
    
    .canvas-section--main {
      flex: 1;
      min-height: 400px;
    }
    
    .canvas-section[section="footer"] {
      flex-shrink: 0;
      margin-top: auto;
    }
    
    /* Canvas section collapsed state */
    .canvas-section.collapsed .section-content {
      display: none !important;
    }
    .canvas-section.collapsed {
      flex: 0 0 auto !important;
      min-height: auto !important;
    }
    .canvas-section.collapsed .section-bar {
      border-bottom: none;
    }
    
    .canvas-section.is-target {
      border-color: #22c55e !important;
      background: rgba(34, 197, 94, 0.08) !important;
      box-shadow: inset 0 0 0 2px rgba(34, 197, 94, 0.3);
    }
    
    .canvas-section.drag-target {
      background: rgba(99, 102, 241, 0.1);
      border-color: var(--primary, #6366f1);
    }
    
    /* Section bar */
    .section-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: var(--bg-secondary, rgba(0,0,0,0.4));
      border-bottom: 1px solid var(--border-color, #333);
      cursor: pointer;
      user-select: none;
      transition: background 0.15s;
    }
    
    .section-bar:hover {
      background: var(--bg-tertiary, rgba(0,0,0,0.5));
    }
    
    .is-target .section-bar {
      background: rgba(34, 197, 94, 0.25) !important;
      border-color: #22c55e !important;
      border-left: 4px solid #22c55e;
    }
    
    .section-icon { font-size: 16px; }
    .section-name { 
      font-size: 13px; 
      font-weight: 600; 
      color: var(--text-primary, #fff);
      flex: 1;
    }
    .section-id {
      font-family: monospace;
      font-size: 0.65rem;
      color: #888;
      background: rgba(0,0,0,0.3);
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    /* Component ID label - positioned ABOVE the element */
    .el-id-label {
      position: absolute;
      top: -28px;
      left: 0;
      font-family: monospace;
      font-size: 0.65rem;
      color: #fff;
      background: rgba(99, 102, 241, 0.95);
      padding: 3px 8px;
      border-radius: 4px 4px 0 0;
      z-index: 99;
      pointer-events: none;
      white-space: nowrap;
    }
    
    /* Element controls - positioned ABOVE the element, same row as label */
    .el-controls {
      position: absolute;
      top: -28px;
      right: 0;
      display: flex;
      gap: 3px;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 100;
    }
    
    .dropped:hover > .el-controls,
    .dropped.selected > .el-controls {
      opacity: 1;
    }
    
    .el-btn {
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      color: #fff;
    }
    
    .el-btn-drag {
      background: rgba(99, 102, 241, 0.9);
      cursor: grab;
    }
    
    .el-btn-drag:active {
      cursor: grabbing;
    }
    
    .el-btn-insert {
      background: rgba(34, 197, 94, 0.9);
      font-size: 16px;
      font-weight: bold;
    }
    
    .el-btn-delete {
      background: rgba(239, 68, 68, 0.9);
    }
    
    .el-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .section-badge {
      margin-left: auto;
      padding: 4px 10px;
      background: var(--bg-tertiary, #333);
      border-radius: 12px;
      font-size: 11px;
      color: var(--text-secondary, #888);
      opacity: 0;
      transition: opacity 0.15s;
    }
    
    .is-target .section-badge {
      opacity: 1;
      background: #22c55e !important;
      color: #fff;
    }
    
    .section-bar:hover .section-badge {
      opacity: 0.7;
    }
    
    /* Section content */
    .section-content {
      min-height: 60px;
      padding: 1rem;
      width: 100%;
      max-width: 100%;
      overflow: visible;
      box-sizing: border-box;
    }

    .section-content > * {
      max-width: 100%;
      box-sizing: border-box;
    }
    
    /* Drop zone placeholder text */
    .canvas-drop-zone-text {
      text-align: center;
      color: var(--text-muted, #666);
      padding: 1rem;
      font-size: 0.85rem;
      border: 2px dashed var(--border-color, #333);
      border-radius: 6px;
      margin-top: 1rem;
    }
    
    /* Empty state */
    .section-empty {
      padding: 40px 20px;
      text-align: center;
      color: var(--text-secondary, #666);
      cursor: pointer;
      transition: color 0.15s;
    }
    
    .section-empty:hover {
      color: var(--primary, #6366f1);
    }
    
    .section-empty .empty-icon {
      font-size: 36px;
      opacity: 0.4;
      margin-bottom: 8px;
    }
    
    .section-empty .empty-text {
      font-size: 13px;
    }
    
    .canvas-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: var(--text-secondary, #666);
    }
    
    .canvas-empty .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    /* Selected element - 1rem above controls, 1rem below controls */
    .dropped {
      position: relative;
      margin-top: calc(1rem + 28px); /* 1rem gap + controls height */
      padding-top: 1rem; /* 1rem gap below controls before content */
    }
    
    /* First dropped element in section */
    .section-content > .dropped:first-child {
      margin-top: calc(1rem + 28px);
    }
    
    /* Ensure controls bar is clearly on top */
    .dropped > .el-controls,
    .dropped > .el-id-label {
      pointer-events: auto;
    }
    
    .dropped.selected {
      outline: 2px solid var(--primary, #6366f1);
      outline-offset: 2px;
    }
    
    /* Insert indicators on elements */
    .dropped.insert-before {
      border-top: 3px solid #22c55e !important;
      margin-top: 8px;
    }
    
    .dropped.insert-before::before {
      content: '↓ Insert here';
      position: absolute;
      top: -22px;
      left: 50%;
      transform: translateX(-50%);
      background: #22c55e;
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      z-index: 101;
    }
    
    .dropped.insert-after {
      border-bottom: 3px solid #22c55e !important;
      margin-bottom: 8px;
    }
    
    .dropped.insert-after::after {
      content: '↑ Insert here';
      position: absolute;
      bottom: -22px;
      left: 50%;
      transform: translateX(-50%);
      background: #22c55e;
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      z-index: 101;
    }
    
    .dropped.insert-inside {
      box-shadow: inset 0 0 0 3px #22c55e !important;
    }
    
    .dropped.insert-inside::after {
      content: '⤵ Insert inside';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #22c55e;
      color: #fff;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      z-index: 101;
    }
    
    /* Element menu */
    .el-menu {
      background: var(--bg-primary, #1a1a2e);
      border: 1px solid var(--border-color, #333);
      border-radius: 10px;
      padding: 8px;
      min-width: 200px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    }
    
    .el-menu-header {
      padding: 6px 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-tertiary, #666);
    }
    
    .el-menu button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: none;
      color: var(--text-primary, #fff);
      text-align: left;
      cursor: pointer;
      border-radius: 6px;
      font-size: 13px;
      transition: background 0.15s;
    }
    
    .el-menu button:hover {
      background: var(--bg-secondary, #252542);
    }
    
    .el-menu button.danger {
      color: #ef4444;
    }
    
    .el-menu button.danger:hover {
      background: rgba(239, 68, 68, 0.1);
    }
    
    .el-menu .menu-icon {
      width: 20px;
      text-align: center;
    }
    
    .el-menu hr {
      border: none;
      border-top: 1px solid var(--border-color, #333);
      margin: 6px 0;
    }
    
    /* Drag states */
    .dropped.dragging {
      opacity: 0.4;
    }
    
    .dropped.drag-above {
      border-top: 3px solid var(--primary, #6366f1) !important;
    }
    
    .dropped.drag-below {
      border-bottom: 3px solid var(--primary, #6366f1) !important;
    }
  `;
  
  document.head.appendChild(style);
}

// Expose globally for builder-pages.js
window.updateMainSectionName = updateMainSectionName;
window.activateMainSection = activateMainSection;

export default {
  init: initCanvasSections,
  setView: setCanvasView,
  setTarget: setTargetSection,
  setInsertPoint,
  clearInsertPoint,
  addElement: addElementToCanvas,
  removeElement: removeCanvasElement,
  getDropConfig,
  updateMainSectionName,
  activateMainSection
};

