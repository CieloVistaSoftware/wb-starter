import WB from '../core/wb-lazy.js';
import { getComponentExclusions } from '../builderExclusions.js';
import { THEMES } from '../behaviors/js/themecontrol.js';
import { BEHAVIOR_TYPES, getComponentType } from './behavior-types.js';
import { Events } from '../core/events.js';
import BuilderValidation from './builder-validation.js';
import { showWelcome, hideWelcome, shouldShowWelcome, openTemplates as openTemplatesChooser } from './builder-welcome.js';
import { initSearchSidebar, trackComponentUsage } from './builder-sidebar.js';
import { showTemplateChecklist, showIssuesPanel, updateBadges, analyzeComponent, analyzeCanvas } from './builder-incomplete.js';
import {
  initInlineEditing,
  isContainer,
  getContainerConfig,
  canDropInto,
  findContainerFromTarget,
  findDropZone,
  showDropZoneHighlight,
  hideDropZoneHighlight,
  injectEditingStyles,
  initResizeHandles,
  addResizeHandle,
  initSnapGrid,
  injectSnapGridStyles,
  getEditableKey
} from './builder-editing.js';
import {
  loadPropertyConfig,
  renderPropertiesPanel,
  getDefaultValue
} from './builder-properties.js';
import { showDocs, closeDocsModal, switchDocsTab } from './builder-docs.js';

// Expose WB globally
window.WB = WB;

// =============================================================================
// DRAWER SYSTEM - Using WB drawerLayout behavior
// =============================================================================
// Note: Drawers are now initialized declaratively via data-wb="drawerLayout" in builder.html

// === TOGGLE FUNCTIONS ===
window.toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.wbToggle) sidebar.wbToggle();
};

window.togglePanel = () => {
  const panel = document.getElementById('panelRight');
  if (panel && panel.wbToggle) panel.wbToggle();
};

// Toggle Properties Panel visibility via hamburger menu
window.togglePropsPanel = () => {
  const propsPanel = document.getElementById('propsPanel');
  const toggleBtn = document.getElementById('propsToggleBtn');
  const componentList = document.getElementById('componentList');
  if (!propsPanel) return;
  const isOpen = propsPanel.classList.toggle('open');

  // Toggle visibility between list and props
  if (componentList) {
    if (isOpen) {
      componentList.style.display = 'none';
      propsPanel.style.display = 'flex';
    } else {
      componentList.style.display = 'flex';
      propsPanel.style.display = 'none';
    }
  }

  // Update button state
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isOpen);
    toggleBtn.title = isOpen ? 'Hide Properties Panel' : 'Show Properties Panel';
  }
  // Save state
  localStorage.setItem('wb-props-panel-open', isOpen);
  // If opening and a component is selected, render its properties
  if (isOpen && sel) {
    renderProps(sel);
  }
};

// Toggle category section collapse
window.toggleCategory = (categoryId) => {
  const section = document.getElementById(categoryId + 'Section');
  if (section) {
    section.classList.toggle('collapsed');
    // Save state
    const collapsed = JSON.parse(localStorage.getItem('wb-collapsed-categories') || '{}');
    collapsed[categoryId] = section.classList.contains('collapsed');
    localStorage.setItem('wb-collapsed-categories', JSON.stringify(collapsed));
  }
};

// Bind toggle buttons after DOM ready
function bindToggleButtons() {
  // Sidebar toggle
  // document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);

  // Panel toggle
  // document.getElementById('panelToggle')?.addEventListener('click', togglePanel);

  // Props panel toggle
  document.getElementById('propsToggleBtn')?.addEventListener('click', togglePropsPanel);

  // Category expanders
  document.querySelectorAll('.category-expander-btn[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      if (category) toggleCategory(category);
    });
  });

  // Generic event bindings
  const bindings = [
    // Header
    { id: 'previewBtn', fn: window.togglePreview },
    { id: 'templatesBtn', fn: window.openTemplates },
    { id: 'shortcutsBtn', fn: window.showShortcuts },
    { id: 'headerNotesBtn', fn: window.toggleNotesDrawer },

    // Toolbar
    { id: 'undoBtn', fn: window.undo },
    { id: 'redoBtn', fn: window.redo },
    { id: 'saveHtmlBtn', fn: window.saveAsHTML },
    { id: 'exportBtn', fn: window.exportJSON },
    { id: 'importBtn', fn: window.importJSON },
    { id: 'clearCanvasBtn', fn: window.resetCanvas },

    // Modals & Drawers
    { id: 'shortcutsCloseBtn', fn: window.closeShortcuts },
    { id: 'templatesCloseBtn', fn: window.closeTemplates },
    { id: 'docsCloseBtn', fn: closeDocsModal }, // Imported
    { id: 'notesCloseBtn', fn: window.toggleNotesDrawer },
    { id: 'notesBackdrop', fn: window.toggleNotesDrawer },

    // Notes
    { id: 'notesCopyBtn', fn: window.copyNotes },
    { id: 'notesSaveBtn', fn: window.saveNotesToFile },
    { id: 'notesClearBtn', fn: window.clearNotes },

    // Favorites
    { id: 'favoritesClearBtn', fn: window.clearFavorites }
  ];

  bindings.forEach(({ id, fn }) => {
    document.getElementById(id)?.addEventListener('click', fn);
  });

  // Docs tabs
  document.getElementById('docsTabBtn')?.addEventListener('click', () => switchDocsTab('docs'));
  document.getElementById('schemaTabBtn')?.addEventListener('click', () => switchDocsTab('schema'));

  // Snap grid
  document.getElementById('snapGrid')?.addEventListener('change', (e) => toggleSnapGrid(e.target.checked));

  // Search filter
  document.getElementById('search')?.addEventListener('input', filter);
}

// Bind toggle buttons moved to initNewFeatures to ensure all functions are defined


// Restore properties panel state on load
function restorePropsPanel() {
  const savedState = localStorage.getItem('wb-props-panel-open');
  if (savedState === 'true') {
    const propsPanel = document.getElementById('propsPanel');
    const toggleBtn = document.getElementById('propsToggleBtn');
    const componentList = document.getElementById('componentList');

    if (propsPanel) {
      propsPanel.classList.add('open');
      propsPanel.style.display = 'flex';
    }
    if (toggleBtn) toggleBtn.classList.add('active');

    if (componentList) {
      componentList.style.display = 'none';
    }
  }
}

// === KEYBOARD SHORTCUTS FOR PANELS ===
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
  // P = Toggle properties panel
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    togglePropsPanel();
  }
  // [ = Toggle both panels
  if (e.key === '[') {
    e.preventDefault();
    toggleSidebar();
    togglePanel();
  }
});

// Expose property functions for builder-tree.js
window.renderPropertiesPanel = renderPropertiesPanel;
window.loadPropertyConfig = loadPropertyConfig;
window.showDocs = showDocs;
window.closeDocsModal = closeDocsModal;
window.switchDocsTab = switchDocsTab;

let C = { All: [] };

// Viewport sizes
const VP_SIZES = {
  desktop: { w: 1200, h: 800 },
  tablet: { w: 768, h: 1024 },
  mobile: { w: 375, h: 667 }
};

let sel = null, cid = 0, hist = [], hi = -1, prev = false, exclusions = [];
let currentVP = 'desktop';

// Expose sel globally for builder-tree.js
Object.defineProperty(window, 'sel', {
  get: () => sel,
  set: (v) => { sel = v; }
});

// Expose Events globally for anchor validation
window.Events = Events;

// Populate theme select from THEMES constant (DRY - single source of truth)
function populateThemeSelect() {
  const select = document.getElementById('pageTheme');
  if (!select) return;

  select.innerHTML = THEMES.map(t =>
    `<option value="${t.id}" title="${t.description}">${t.name}</option>`
  ).join('');
}

async function start() {
  // Setup global error catching
  Events.setupGlobalHandlers();

  // Load property configuration for enhanced property panel
  await loadPropertyConfig();

  // Load components and templates
  try {
    const [compRes, tempRes] = await Promise.all([
      fetch('src/builder/components.json'),
      fetch('src/builder/templates.json')
    ]);
    
    if (compRes.ok) C.All = await compRes.json();
    if (tempRes.ok) TEMPLATES = await tempRes.json();
  } catch (e) {
    console.error('Failed to load builder config:', e);
  }

  populateThemeSelect();
  exclusions = await getComponentExclusions();

  // Initialize WB behaviors (scans document for data-wb)
  await WB.init({ scan: true, observe: true });

  // Filter components and initialize search sidebar
  const filteredComponents = C.All.filter(x => !x.b || !exclusions.includes(x.b));
  initSearchSidebar(filteredComponents);

  // Note: renderList() is now handled by initSearchSidebar
  // restoreCollapsedCategories() is also handled by sidebar
  enableBuilderInteractions();
  load();
  initNotes();
  updateVPInfo();
  initCanvasEditing();
  restorePropsPanel(); // Restore properties panel state

  // Show welcome screen if canvas is empty (after load)
  setTimeout(() => {
    if (shouldShowWelcome()) {
      showWelcome();
    }
  }, 100);
}

// Initialize inline editing for the canvas
function initCanvasEditing() {
  const cv = document.getElementById('canvas');
  if (!cv) return;

  // Inject editing styles
  injectEditingStyles();

  // Initialize inline editing
  initInlineEditing(cv, {
    onSave: (wrapperId, key, value) => {
      // Update property panel if component is selected
      const wrapper = document.getElementById(wrapperId);
      if (wrapper && wrapper.classList.contains('selected')) {
        renderProps(wrapper);
      }
      saveHist();
    },
    WB: WB
  });

  // Initialize resize handles for component width adjustment
  initResizeHandles(cv);

  // Initialize snap grid for draggable components
  initSnapGrid(cv);
}

// Component type categorization and getComponentType are now imported from behavior-types.js

function renderList() {
  // Get category containers
  const elementsList = document.getElementById('elementsList');
  const containersList = document.getElementById('containersList');
  const effectsList = document.getElementById('effectsList');
  const actionsList = document.getElementById('actionsList');

  // Fallback to old behavior if new HTML structure not present
  const l = document.getElementById('list');
  if (!elementsList) {
    l.innerHTML = '';
    for (const [cat, items] of Object.entries(C)) {
      const filtered = items.filter(x => !x.b || !exclusions.includes(x.b));
      const e = document.createElement('div');
      e.innerHTML = '<h3 class="cat-header">' + cat + '</h3><div class="cat-items">' + filtered.map(x => {
        const desc = x.n + (x.b ? ' (' + x.b + ')' : '');
        return '<div class="comp-item" draggable="true" data-c=\'' + JSON.stringify(x) + '\' title="' + desc + '"><span class="comp-icon">' + x.i + '</span><span class="comp-name">' + x.n + '</span></div>';
      }).join('') + '</div>';
      l.appendChild(e);
    }
    return;
  }

  // Clear all category lists
  elementsList.innerHTML = '';
  containersList.innerHTML = '';
  effectsList.innerHTML = '';
  actionsList.innerHTML = '';

  // Categorize and render components
  const counts = { element: 0, container: 0, modifier: 0, action: 0 };

  C.All.filter(x => !x.b || !exclusions.includes(x.b)).forEach(comp => {
    const type = getComponentType(comp);
    counts[type]++;

    const desc = comp.n + (comp.b ? ' (' + comp.b + ')' : '');
    const isFav = favorites.includes(comp.b);

    const item = document.createElement('div');
    item.className = 'comp-item' + (isFav ? ' favorite' : '');
    item.draggable = true;
    item.dataset.c = JSON.stringify(comp);
    item.dataset.type = type;
    item.title = desc;

    item.innerHTML = `
      <span class="comp-type-dot ${type}"></span>
      <span class="comp-icon">${comp.i}</span>
      <span class="comp-name">${comp.n}</span>
      <button class="comp-fav" onclick="event.stopPropagation(); toggleFavorite('${comp.b}')" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">${isFav ? '★' : '☆'}</button>
    `;

    // Add to appropriate category
    switch (type) {
      case 'container':
        containersList.appendChild(item);
        break;
      case 'modifier':
        effectsList.appendChild(item);
        break;
      case 'action':
        actionsList.appendChild(item);
        break;
      default:
        elementsList.appendChild(item);
    }
  });

  // Update counts
  document.getElementById('elementsCount').textContent = counts.element;
  document.getElementById('containersCount').textContent = counts.container;
  document.getElementById('effectsCount').textContent = counts.modifier;
  document.getElementById('actionsCount').textContent = counts.action;
}

// Restore collapsed state on load
function restoreCollapsedCategories() {
  const collapsed = JSON.parse(localStorage.getItem('wb-collapsed-categories') || '{}');
  Object.entries(collapsed).forEach(([id, isCollapsed]) => {
    if (isCollapsed) {
      const section = document.getElementById(id + 'Section');
      if (section) section.classList.add('collapsed');
    }
  });
}

window.filter = () => {
  const s = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('.comp-item').forEach(i => i.style.display = i.textContent.toLowerCase().includes(s) ? '' : 'none');
};

function findInsertionPoint(dropZone, clientX, clientY, isRow) {
  // If row mode, always append to end (user request)
  if (isRow) return null;

  const children = Array.from(dropZone.children).filter(c => c.classList.contains('dropped'));

  for (const child of children) {
    const rect = child.getBoundingClientRect();
    // Column mode: check vertical position
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) {
      return child;
    }
  }
  return null;
}

let builderCleanup = [];

function enableBuilderInteractions() {
  if (builderCleanup.length > 0) return;

  const cv = document.getElementById('canvas');

  // --- 1. Drag & Drop ---
  const handleDragStart = e => {
    const item = e.target.closest('.comp-item');
    if (item) {
      item.classList.add('dragging');
      e.dataTransfer.setData('c', item.dataset.c);
    }
    // Lock dropped items
    if (e.target.classList.contains('dropped')) {
      e.preventDefault();
      return false;
    }
  };
  document.addEventListener('dragstart', handleDragStart);

  const handleDragEnd = e => {
    const item = e.target.closest('.comp-item');
    if (item) {
      item.classList.remove('dragging');
      hideDropZoneHighlight();
    }
  };
  document.addEventListener('dragend', handleDragEnd);

  const handleDragOver = e => {
    e.preventDefault();
    cv.classList.add('drag-over');
    showDropZoneHighlight(e.target);

    // Smart Snap Highlight for new components
    if (cv.classList.contains('snap-enabled')) {
      const SNAP_GRID_SIZE = 20;
      let highlight = document.getElementById('snap-guide-lines');
      if (!highlight) {
        highlight = document.createElement('div');
        highlight.id = 'snap-guide-lines';
        highlight.className = 'snap-guide-lines';
        cv.appendChild(highlight);
      }

      const canvasRect = cv.getBoundingClientRect();
      const relativeX = e.clientX - canvasRect.left;
      const relativeY = e.clientY - canvasRect.top;

      // Snap to grid
      const gridX = Math.floor(relativeX / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
      const gridY = Math.floor(relativeY / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;

      highlight.style.left = gridX + 'px';
      highlight.style.top = gridY + 'px';
      highlight.style.display = 'block';
    }
  };
  cv.addEventListener('dragover', handleDragOver);

  const handleDragLeave = (e) => {
    if (!cv.contains(e.relatedTarget)) {
      cv.classList.remove('drag-over');
      hideDropZoneHighlight();

      // Remove highlight
      const highlight = document.getElementById('snap-guide-lines');
      if (highlight) highlight.remove();
    }
  };
  cv.addEventListener('dragleave', handleDragLeave);

  const handleDrop = e => {
    e.preventDefault();
    cv.classList.remove('drag-over');
    hideDropZoneHighlight();

    // Remove highlight
    const highlight = document.getElementById('snap-guide-lines');
    if (highlight) highlight.remove();

    const d = e.dataTransfer.getData('c');
    if (d) {
      const component = JSON.parse(d);

      // Check if this is a modifier/action being dropped onto an existing element
      const componentType = getComponentType(component);
      if (componentType === 'modifier' || componentType === 'action') {
        const existingWrapper = e.target.closest('.dropped');
        if (existingWrapper) {
          addBehaviorToComponent(existingWrapper, component.b);
          return;
        }
      }

      // Check if dropping into a grid (existing behavior)
      const gridEl = e.target.closest('.dropped[data-grid]');
      if (gridEl) {
        addToGrid(component, gridEl);
        return;
      }

      // Check if dropping into a container component
      const containerInfo = findContainerFromTarget(e.target);
      if (containerInfo && containerInfo.behavior !== 'grid') {
        if (canDropInto(containerInfo.behavior, component.b)) {
          const dropZone = findDropZone(containerInfo.wrapper, containerInfo.config);
          if (dropZone) {
            // Get instance data to check direction
            let isRow = false;
            try {
              const cData = JSON.parse(containerInfo.wrapper.dataset.c);
              isRow = cData.d && cData.d.direction === 'row';
            } catch (e) { }

            const referenceNode = findInsertionPoint(dropZone, e.clientX, e.clientY, isRow);
            addToContainer(component, containerInfo.wrapper, dropZone, referenceNode);
            return;
          }
        }
      }

      // Default: add to canvas root
      const w = add(component);

      // Apply Smart Snap position if enabled
      if (cv.classList.contains('snap-enabled')) {
        const SNAP_GRID_SIZE = 20;
        const canvasRect = cv.getBoundingClientRect();
        const relativeX = e.clientX - canvasRect.left;
        const relativeY = e.clientY - canvasRect.top;

        const gridX = Math.floor(relativeX / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
        const gridY = Math.floor(relativeY / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;

        w.style.position = 'absolute';
        w.style.left = gridX + 'px';
        w.style.top = gridY + 'px';
        w.style.margin = '0';
        w.style.zIndex = '1000'; // Ensure it's top-most

        // Update component data
        try {
          const c = JSON.parse(w.dataset.c);
          if (!c.d) c.d = {};
          c.d._posX = gridX + 'px';
          c.d._posY = gridY + 'px';
          c.d._zIndex = '1000';
          w.dataset.c = JSON.stringify(c);
          saveHist(); // Save again with position
        } catch (err) { }
      }
    }
  };
  cv.addEventListener('drop', handleDrop);

  // --- 2. Click Selection ---
  const handleClick = e => {
    const w = e.target.closest('.dropped');
    if (w && !e.target.closest('.controls')) {
      let propKey = null;
      let el = e.target;
      while (el && el !== w && w.contains(el)) {
        const key = getEditableKey(el);
        if (key) {
          if (key !== 'text') { propKey = key; break; }
          else if (!propKey) { propKey = key; }
        }
        el = el.parentElement;
      }
      selComp(w, propKey);
    }
    if (!e.target.closest('.save-dropdown')) {
      document.getElementById('saveMenu')?.classList.remove('show');
    }
  };
  document.addEventListener('click', handleClick);

  // --- 3. Keydown Shortcuts ---
  const handleKeydown = (e) => {
    const target = e.target;
    const isEditing = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    if (e.key === 'Escape') {
      closeShortcuts();
      closeTemplates();
      closeDocsModal();
      if (sel) {
        sel.classList.remove('selected');
        sel = null;
        renderTree();
      }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z': if (!e.shiftKey) { e.preventDefault(); undo(); } break;
        case 'y': e.preventDefault(); redo(); break;
        case 's': e.preventDefault(); savePage(); break;
        case 'e': e.preventDefault(); exportJSON(); break;
        case 'i': if (!isEditing) { e.preventDefault(); importJSON(); } break;
        case 'p': e.preventDefault(); togglePreview(); break;
        case 'd': if (!isEditing && sel) { e.preventDefault(); duplicateComponent(sel.id); } break;
        case 'c': if (!isEditing && sel) { e.preventDefault(); copyAsHTML(); } break;
      }
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        toggleNotesDrawer();
      }
      return;
    }

    if (isEditing) return;

    switch (e.key) {
      case 'Delete':
      case 'Backspace': if (sel) { e.preventDefault(); del(sel.id); } break;
      case 'ArrowUp': if (sel && !snapEnabled) { e.preventDefault(); moveUp(sel.id); } break;
      case 'ArrowDown': if (sel && !snapEnabled) { e.preventDefault(); moveDown(sel.id); } break;
      case 't': case 'T': openTemplates(); break;
      case 'g': case 'G': toggleSnapGrid(!snapEnabled); break;
      case 'f': case 'F': if (sel) { const c = JSON.parse(sel.dataset.c); toggleFavorite(c.b); } break;
      case '?': showShortcuts(); break;
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // --- 4. Context Menu ---
  const handleContextMenu = e => {
    if (!e.shiftKey) return;
    const wrapper = e.target.closest('.dropped');
    if (!wrapper) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, wrapper);
  };
  document.addEventListener('contextmenu', handleContextMenu);

  // --- 5. Live Editing Input ---
  const handleInput = (e) => {
    const target = e.target;
    const isEditable = target.classList.contains('canvas-editable') ||
      target.classList.contains('editing') ||
      target.isContentEditable;
    if (!isEditable) return;
    const wrapper = target.closest('.dropped');
    if (!wrapper) return;

    let key = target.dataset.editableKey;
    if (!key && typeof getEditableKey === 'function') {
      key = getEditableKey(target);
    }
    key = key || 'text';
    const newValue = target.textContent;
    const c = JSON.parse(wrapper.dataset.c);
    if (c.d) {
      c.d[key] = newValue;
      wrapper.dataset.c = JSON.stringify(c);
    }
    if (wrapper.classList.contains('selected')) {
      let propInput = document.getElementById(`prop-${wrapper.id}-${key}`);
      if (!propInput) {
        propInput = document.querySelector(`.prop-input[oninput*="'${key}'"]`);
      }
      if (propInput && propInput !== document.activeElement) {
        propInput.value = newValue;
      }
    }
    clearTimeout(window.editDebounce);
    window.editDebounce = setTimeout(() => saveHist(), 500);
  };
  if (cv) cv.addEventListener('input', handleInput);

  // --- 6. Inline Editing ---
  const cleanupInline = initInlineEditing(cv, { WB });

  // --- Cleanup Function ---
  builderCleanup.push(() => {
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragend', handleDragEnd);
    cv.removeEventListener('dragover', handleDragOver);
    cv.removeEventListener('dragleave', handleDragLeave);
    cv.removeEventListener('drop', handleDrop);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('contextmenu', handleContextMenu);
    if (cv) cv.removeEventListener('input', handleInput);
    if (cleanupInline) cleanupInline();
  });
}

function disableBuilderInteractions() {
  builderCleanup.forEach(fn => fn());
  builderCleanup = [];
}

// Generate unique ID based on component type
function genId(c) {
  const base = (c.b || c.t || 'el').toLowerCase().replace(/[^a-z0-9]/g, '');
  return base + '-' + (++cid);
}


function add(c, parentId = null) {
  const cv = document.getElementById('canvas');
  document.getElementById('empty')?.remove();
  const id = genId(c);
  const w = document.createElement('div');
  w.className = 'dropped';
  if (c.container || c.b === 'container' || c.b === 'grid') w.classList.add('is-container');
  w.id = id;
  w.dataset.c = JSON.stringify(c);
  if (parentId) w.dataset.parent = parentId;
  const isGrid = c.b === 'grid';
  if (isGrid) w.dataset.grid = 'true';
  let controls = '<div class="controls">';
  controls += '<button class="ctrl-btn" onclick="moveUp(\'' + id + '\')" title="Move up">⬆️</button>';
  controls += '<button class="ctrl-btn" onclick="moveDown(\'' + id + '\')" title="Move down">⬇️</button>';
  if (parentId) {
    const parent = document.getElementById(parentId);
    if (parent?.dataset.grid) {
      controls += '<div class="span-btns">';
      controls += '<button class="span-btn" onclick="setSpan(\'' + id + '\',1)" title="Span 1 column">1</button>';
      controls += '<button class="span-btn" onclick="setSpan(\'' + id + '\',2)" title="Span 2 columns">2</button>';
      controls += '<button class="span-btn" onclick="setSpan(\'' + id + '\',3)" title="Span 3 columns">3</button>';
      controls += '</div>';
    }
  }
  controls += '<button class="ctrl-btn" onclick="dup(\'' + id + '\')" title="Duplicate">📋</button>';
  controls += '<button class="ctrl-btn del" onclick="del(\'' + id + '\')" title="Delete">🗑️</button>';
  controls += '</div>';
  w.innerHTML = controls;
  const builderEl = mkEl(c, id);
  // Apply data-* attributes from c.d to builder element
  if (c.d && typeof c.d === 'object') {
    Object.entries(c.d).forEach(([key, value]) => {
      builderEl.setAttribute('data-' + key, value);
    });
    // Apply hoverText to wrapper as well (for canvas mode visibility)
    if (c.d.hoverText) {
      w.setAttribute('title', c.d.hoverText);
    }
    // Restore width if present (from resize handle)
    if (c.d._width) {
      w.style.width = c.d._width;
      w.style.maxWidth = c.d._width;
    }
  }
  w.appendChild(builderEl);
  cv.appendChild(w);
  WB.scan(w);
  addResizeHandle(w);
  try {
    selComp(w);
  } catch (e) {
    Events.error('Builder', 'selComp failed in add()', { stack: e.stack, component: c.n });
  }
  updCount();
  renderTree();
  autoExtendCanvas();
  saveHist();
  updateBadges();
  return w;
}

function remove(id) {
  const el = document.getElementById(id);
  if (el && el.classList.contains('dropped')) {
    el.remove();
    updCount();
    renderTree();
    autoExtendCanvas();
    saveHist();
    return true;
  }
  return false;
}

function update(id, props = {}) {
  const el = document.getElementById(id);
  if (el && el.classList.contains('dropped')) {
    Object.entries(props).forEach(([key, value]) => {
      if (key.startsWith('data-')) {
        el.setAttribute(key, value);
      } else {
        el[key] = value;
      }
    });
    WB.scan(el);
    saveHist();
    return el;
  }
  return null;
}

function reset() {
  const cv = document.getElementById('canvas');
  if (cv) {
    cv.innerHTML = '';
    updCount();
    renderTree();
    autoExtendCanvas();
    saveHist();
    return true;
  }
  return false;
}

function get(id) {
  return document.getElementById(id);
}

window.builderAPI = {
  add,
  remove,
  update,
  reset,
  get
};

// Expose add and addToGrid globally for tests, external scripts, and templates
window.add = add;
window.addToGrid = addToGrid;
window.upd = upd;
window.toast = toast;

// =============================================================================
// ADD/REMOVE BEHAVIORS FROM EXISTING COMPONENTS
// =============================================================================

/**
 * Add a behavior to an existing component (space-separated in data-wb)
 */
function addBehaviorToComponent(wrapper, behaviorName) {
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return;

  // Get current behaviors
  const currentBehaviors = el.dataset.wb.split(/\s+/).filter(Boolean);

  // Check if already has this behavior
  if (currentBehaviors.includes(behaviorName)) {
    toast(`Already has ${behaviorName}`);
    return;
  }

  // Add the new behavior
  currentBehaviors.push(behaviorName);
  el.dataset.wb = currentBehaviors.join(' ');

  // Update component data to track added behaviors
  const c = JSON.parse(wrapper.dataset.c);
  c.behaviors = currentBehaviors;
  wrapper.dataset.c = JSON.stringify(c);

  // Re-scan to apply new behavior
  WB.scan(wrapper);

  // Update properties panel if this component is selected
  if (wrapper.classList.contains('selected')) {
    renderProps(wrapper);
  }

  saveHist();
  toast(`Added ${behaviorName}`);
}

/**
 * Remove a behavior from an existing component
 */
function removeBehaviorFromComponent(wrapper, behaviorName) {
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return;

  const c = JSON.parse(wrapper.dataset.c);
  const primaryBehavior = c.b;

  // Don't allow removing the primary behavior
  if (behaviorName === primaryBehavior) {
    toast(`Can't remove primary behavior`);
    return;
  }

  // Get current behaviors and remove the specified one
  const currentBehaviors = el.dataset.wb.split(/\s+/).filter(b => b && b !== behaviorName);
  el.dataset.wb = currentBehaviors.join(' ');

  // Update component data
  c.behaviors = currentBehaviors;
  wrapper.dataset.c = JSON.stringify(c);

  // Remove the behavior's effects
  WB.remove(el, behaviorName);

  // Re-scan to reapply remaining behaviors
  WB.scan(wrapper);

  // Update properties panel if selected
  if (wrapper.classList.contains('selected')) {
    renderProps(wrapper);
  }

  saveHist();
  toast(`Removed ${behaviorName}`);
}

/**
 * Toggle a behavior on/off for a component
 */
window.toggleBehavior = (wrapperId, behaviorName, enabled) => {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  if (enabled) {
    addBehaviorToComponent(wrapper, behaviorName);
  } else {
    removeBehaviorFromComponent(wrapper, behaviorName);
  }
};

/**
 * Get all behaviors currently on a component
 */
function getComponentBehaviors(wrapper) {
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return [];
  return el.dataset.wb.split(/\s+/).filter(Boolean);
}

// Expose for properties panel
window.getComponentBehaviors = getComponentBehaviors;
window.addBehaviorToComponent = addBehaviorToComponent;
window.removeBehaviorFromComponent = removeBehaviorFromComponent;
window.BEHAVIOR_TYPES = BEHAVIOR_TYPES;

function addToGrid(c, gridWrapper) {
  const id = genId(c);
  const gridId = gridWrapper.id;
  const gridEl = gridWrapper.querySelector('[data-wb="grid"]');

  const w = document.createElement('div');
  w.className = 'dropped grid-child';
  if (c.container || c.b === 'container' || c.b === 'grid') w.classList.add('is-container');
  w.id = id;
  w.dataset.c = JSON.stringify(c);
  w.dataset.parent = gridId;
  w.dataset.span = '1';

  // Build controls with span buttons
  let controls = '<div class="controls">';
  controls += '<button class="ctrl-btn" onclick="moveUp(\'' + id + '\')" title="Move up">⬆️</button>';
  controls += '<button class="ctrl-btn" onclick="moveDown(\'' + id + '\')" title="Move down">⬇️</button>';
  controls += '<div class="span-btns">';
  controls += '<button class="span-btn active" onclick="setSpan(\'' + id + '\',1)" title="Span 1 column">1</button>';
  controls += '<button class="span-btn" onclick="setSpan(\'' + id + '\',2)" title="Span 2 columns">2</button>';
  controls += '<button class="span-btn" onclick="setSpan(\'' + id + '\',3)" title="Span 3 columns">3</button>';
  controls += '</div>';
  controls += '<button class="ctrl-btn" onclick="dup(\'' + id + '\')" title="Duplicate">📋</button>';
  controls += '<button class="ctrl-btn del" onclick="del(\'' + id + '\')" title="Delete">🗑️</button>';
  controls += '</div>';

  w.innerHTML = controls;
  w.appendChild(mkEl(c, id));

  gridEl.appendChild(w);
  WB.scan(w);

  try {
    selComp(w);
  } catch (e) {
    Events.error('Builder', 'selComp failed in addToGrid()', { stack: e.stack, component: c.n });
  }

  updCount();
  renderTree();
  autoExtendCanvas();
  saveHist();
}

window.setSpan = (id, span) => {
  const w = document.getElementById(id);
  if (!w) return;

  w.dataset.span = span;
  w.style.gridColumn = 'span ' + span;

  // Update active button
  w.querySelectorAll('.span-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i + 1) === span);
  });

  saveHist();
};

// Add component to a container's drop zone
function addToContainer(c, containerWrapper, dropZone, referenceNode = null) {
  const id = genId(c);
  const containerId = containerWrapper.id;

  // Remove placeholder if present (added by layouts.js when empty)
  if (dropZone.children.length > 0) {
    const firstChild = dropZone.firstElementChild;
    // The placeholder is a plain div, while components are wrapped in .dropped
    if (firstChild && !firstChild.classList.contains('dropped') && firstChild.innerText.includes('Drop components here')) {
      dropZone.innerHTML = '';
    }
  }

  const w = document.createElement('div');
  w.className = 'dropped container-child';
  if (c.container || c.b === 'container' || c.b === 'grid') w.classList.add('is-container');
  w.id = id;
  w.dataset.c = JSON.stringify(c);
  w.dataset.parent = containerId;

  // Build controls (simpler than grid - no span buttons)
  let controls = '<div class="controls">';
  controls += '<button class="ctrl-btn" onclick="moveUp(\'' + id + '\')" title="Move up">⬆️</button>';
  controls += '<button class="ctrl-btn" onclick="moveDown(\'' + id + '\')" title="Move down">⬇️</button>';
  controls += '<button class="ctrl-btn" onclick="dup(\'' + id + '\')" title="Duplicate">📋</button>';
  controls += '<button class="ctrl-btn del" onclick="del(\'' + id + '\')" title="Delete">🗑️</button>';
  controls += '</div>';

  w.innerHTML = controls;
  w.appendChild(mkEl(c, id));

  // Restore width if present
  if (c.d && c.d._width) {
    w.style.width = c.d._width;
    w.style.maxWidth = c.d._width;
  }

  // Append to the drop zone (not replace)
  if (referenceNode) {
    dropZone.insertBefore(w, referenceNode);
  } else {
    dropZone.appendChild(w);
  }

  WB.scan(w);

  try {
    selComp(w);
  } catch (e) {
    Events.error('Builder', 'selComp failed in addToContainer()', { stack: e.stack, component: c.n });
  }

  updCount();
  renderTree();
  autoExtendCanvas();
  saveHist();
}

function mkEl(c, id) {
  const t = c.t || 'div';
  const el = document.createElement(t);
  el.id = id + '-el';

  if (c.b) el.dataset.wb = c.b;
  if (c.d) {
    for (const [k, v] of Object.entries(c.d)) {
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k === 'hoverText') el.setAttribute('title', v);
      else if (k === 'src' && ['IMG', 'AUDIO', 'VIDEO', 'SOURCE', 'IFRAME'].includes(el.tagName)) el.src = v;
      else if (k === 'placeholder') el.placeholder = v;
      else if (k === 'href') {
        el.href = v;
        // If href is an anchor (starts with #) and no element exists with that ID, create it
        if (typeof v === 'string' && v.startsWith('#')) {
          const targetId = v.slice(1);
          if (targetId && !document.getElementById(targetId)) {
            const anchorTarget = document.createElement('div');
            anchorTarget.id = targetId;
            anchorTarget.style.height = '1px';
            anchorTarget.style.width = '1px';
            anchorTarget.style.position = 'relative';
            anchorTarget.style.pointerEvents = 'none';
            anchorTarget.setAttribute('data-generated-anchor', 'true');
            // Insert at end of canvas (or body if not found)
            const canvas = document.getElementById('canvas') || document.body;
            canvas.appendChild(anchorTarget);
          }
        }
      }
      else if (k === 'type' && t === 'input') el.type = v;
      else el.dataset[k] = v;
    }

    // Fallback: Use label as text if text is missing (for buttons, etc)
    if (!c.d.text && c.d.label && ['BUTTON', 'A', 'LABEL', 'SPAN', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
      el.textContent = c.d.label;
    }
  }

  // Handle components with predefined children (like accordion, tabs, tables, selects)
  if (c.children && Array.isArray(c.children)) {
    const createChild = (childDef) => {
      const tagName = childDef.t || 'div';
      const childEl = document.createElement(tagName);

      // Attributes
      if (childDef.d) {
        Object.entries(childDef.d).forEach(([k, v]) => {
          if (k === 'class') childEl.className = v;
          else childEl.setAttribute(k, v);
        });
      }

      // Specific properties
      if (childDef.title) childEl.dataset.title = childDef.title;
      if (childDef.tabTitle) childEl.dataset.tabTitle = childDef.tabTitle;
      if (childDef.value) childEl.value = childDef.value;

      // Content
      if (childDef.content) childEl.innerHTML = childDef.content;
      if (childDef.text) childEl.textContent = childDef.text;

      // Recursive children
      if (childDef.children && Array.isArray(childDef.children)) {
        childDef.children.forEach(grandChild => {
          childEl.appendChild(createChild(grandChild));
        });
      }

      return childEl;
    };

    c.children.forEach(child => {
      el.appendChild(createChild(child));
    });
  }

  // Clock variants
  if (c.b === 'clock' && c.d) {
    if (c.d.variant === 'digital') el.classList.add('clock-digital');
    if (c.d.variant === 'analog') el.classList.add('clock-analog');
    if (c.d.variant === 'led') el.classList.add('clock-led');
  }

  // Make all semantic elements contenteditable for text
  const semanticTags = [
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'BUTTON', 'A', 'LI', 'LABEL',
    'ARTICLE', 'SECTION', 'HEADER', 'FOOTER', 'NAV', 'ASIDE', 'MAIN', 'ADDRESS', 'FIGURE', 'FIGCAPTION', 'TIME', 'MARK', 'CITE', 'SUMMARY', 'DETAILS', 'DT', 'DD', 'DL', 'UL', 'OL', 'PRE', 'CODE', 'BLOCKQUOTE', 'SMALL', 'STRONG', 'EM', 'B', 'I', 'U', 'SUP', 'SUB', 'LEGEND', 'CAPTION', 'TD', 'TH', 'TR', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'FORM', 'FIELDSET', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION'
  ];
  if (semanticTags.includes(el.tagName) || (c.d && c.d.text)) {
    el.setAttribute('contenteditable', 'true');
    el.classList.add('canvas-editable');
    el.dataset.editableKey = 'text';
  }

  // AUDIO: Just set up data attributes - let the audio behavior handle EQ UI
  // The behavior in media.js will create the 15-band EQ when showEq is true
  if (c.b === 'audio' && c.d) {
    // Set showEq as data attribute so the behavior can read it
    if (c.d.showEq === true || c.d.showEq === 'true') {
      el.dataset.showEq = 'true';
    }
  }

  // CONTAINER: Explicitly set layout styles to ensure immediate visual feedback
  // This matches the behavior in layouts.js but applies it synchronously
  if (c.b === 'container' && c.d) {
    el.style.display = 'flex';
    el.style.flexDirection = c.d.direction || 'column';

    if (c.d.wrap !== undefined) {
      el.style.flexWrap = (c.d.wrap === true || c.d.wrap === 'true') ? 'wrap' : 'nowrap';
    } else {
      el.style.flexWrap = 'wrap'; // Default
    }

    if (c.d.gap) {
      el.style.gap = c.d.gap;
      el.style.setProperty('--gap', c.d.gap);
    } else {
      el.style.removeProperty('--gap');
    }

    // Map align/justify
    const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
    const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };

    if (c.d.align) el.style.alignItems = alignMap[c.d.align] || c.d.align;
    if (c.d.justify) el.style.justifyContent = justifyMap[c.d.justify] || c.d.justify;

    // Padding
    if (c.d.padding) el.style.padding = c.d.padding;
  }

  return el;
}

function selComp(w, scrollToProperty = null) {
  document.querySelectorAll('.dropped').forEach(d => d.classList.remove('selected'));
  w.classList.add('selected');
  sel = w;
  // Update right panel selection
  document.querySelectorAll('.panel-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.id === w.id);
  });
  // Render tree (handled by builder-tree.js)
  renderTree();

  // Auto-open properties panel when component is selected
  const propsPanel = document.getElementById('propsPanel');
  const toggleBtn = document.getElementById('propsToggleBtn');
  if (propsPanel && !propsPanel.classList.contains('open')) {
    propsPanel.classList.add('open');
    if (toggleBtn) toggleBtn.classList.add('active');
    localStorage.setItem('wb-props-panel-open', 'true');
  }

  // Render properties for selected component
  renderProps(w, scrollToProperty);
}

// Expose selComp globally for builder-tree.js
window.selComp = selComp;

function renderProps(w, scrollToProperty = null) {
  const p = document.getElementById('propsPanel');
  if (!p) return;

  // Use the new enhanced property panel system
  renderPropertiesPanel(w, p, (wid, key, value) => {
    // This is the onChange callback - call updP to update the component
    updP(wid, key, value);
  }, scrollToProperty);

  // Show issues panel for this component
  showIssuesPanel(w);
}

// Auto-wrap element in a row container if width < 100%
async function wrapInRowContainer(wrapper) {
  const parentId = wrapper.dataset.parent;
  const parent = document.getElementById(parentId);

  // Check if parent is already a row container
  if (parent) {
    const pConfig = JSON.parse(parent.dataset.c);
    if (pConfig.b === 'container' && pConfig.d && pConfig.d.direction === 'row') {
      return; // Already in a row container
    }
  }

  // Create new container config
  const containerConfig = {
    n: 'Row Container',
    b: 'container',
    t: 'section',
    d: {
      direction: 'row',
      columns: 1,
      gap: '1rem',
      align: 'start',
      justify: 'start',
      wrap: true,
      padding: '1rem',
      width: '100%'
    },
    container: true
  };

  const containerId = genId(containerConfig);
  const containerWrapper = document.createElement('div');
  containerWrapper.className = 'dropped';
  containerWrapper.id = containerId;
  containerWrapper.dataset.c = JSON.stringify(containerConfig);
  if (parentId) containerWrapper.dataset.parent = parentId;

  // Controls
  let controls = '<div class="controls">';
  controls += '<button class="ctrl-btn" onclick="moveUp(\'' + containerId + '\')" title="Move up">⬆️</button>';
  controls += '<button class="ctrl-btn" onclick="moveDown(\'' + containerId + '\')" title="Move down">⬇️</button>';
  controls += '<button class="ctrl-btn" onclick="dup(\'' + containerId + '\')" title="Duplicate">📋</button>';
  controls += '<button class="ctrl-btn del" onclick="del(\'' + containerId + '\')" title="Delete">🗑️</button>';
  controls += '</div>';
  containerWrapper.innerHTML = controls;

  const builderEl = mkEl(containerConfig, containerId);
  // Apply default styles
  builderEl.style.display = 'flex';
  builderEl.style.flexDirection = 'row';
  builderEl.style.width = '100%';
  builderEl.style.gap = '1rem';
  builderEl.style.padding = '1rem';

  containerWrapper.appendChild(builderEl);

  // Insert container before the current element
  if (wrapper.parentNode) {
    wrapper.parentNode.insertBefore(containerWrapper, wrapper);

    // Move current element into container
    // Use findDropZone to be safe, or fallback to builderEl
    const dropZone = findDropZone(containerWrapper, containerConfig) || builderEl;
    dropZone.appendChild(wrapper);

    // Update wrapper's parent pointer
    wrapper.dataset.parent = containerId;
    wrapper.classList.add('container-child');

    // Scan and update
    WB.scan(containerWrapper);
    addResizeHandle(containerWrapper);

    renderTree();
    saveHist();

    toast('Auto-wrapped in Row Container');
  }
}

window.changeCardType = (wrapperId, newType) => {
  const w = document.getElementById(wrapperId);
  if (!w) return;

  const c = JSON.parse(w.dataset.c);
  const oldType = c.b;

  if (oldType === newType) return;

  // Update behavior
  c.b = newType;

  // Update name if it was the default name
  if (c.n.startsWith('Card')) {
    // Try to find a nice name for the new type
    const typeName = newType.replace('card', '');
    c.n = 'Card ' + typeName.charAt(0).toUpperCase() + typeName.slice(1);
    if (newType === 'card') c.n = 'Card';
  }

  w.dataset.c = JSON.stringify(c);

  const el = w.querySelector('[data-wb]');
  if (el) {
    // Remove old behavior
    WB.remove(el, oldType);

    // Update data-wb attribute
    // Note: A component might have multiple behaviors (e.g. "card animate")
    // We need to replace the card* behavior but keep others
    const behaviors = el.dataset.wb.split(/\s+/);
    const newBehaviors = behaviors.map(b => b === oldType ? newType : b);

    // If the old type wasn't found (maybe it was just 'card' but data-wb had 'cardpricing'), 
    // we should check if any card* behavior exists and replace it, or just append.
    // But usually c.b matches the primary behavior.

    el.dataset.wb = newBehaviors.join(' ');

    // Re-scan
    WB.scan(w);

    // Refresh properties panel
    renderProps(w);

    // Refresh tree
    renderTree();

    saveHist();
    toast(`Morphed to ${c.n}`);
  }
};

window.updP = async (wid, k, v) => {
  const w = document.getElementById(wid);
  if (!w) return;
  const c = JSON.parse(w.dataset.c);
  const oldValue = c.d[k];
  c.d[k] = v;

  // Track if icon changed (for tree refresh)
  let iconChanged = false;

  // Update icon when alert type changes
  if (c.b === 'alert' && k === 'type') {
    const alertIcons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    c.i = alertIcons[v] || 'ℹ️';
    iconChanged = true;
  }

  w.dataset.c = JSON.stringify(c);

  // Handle system properties that affect the wrapper directly
  if (k === '_posX') {
    w.style.left = v;
    if (w.style.position !== 'absolute' && w.style.position !== 'fixed') {
      w.style.position = 'absolute';
    }
  } else if (k === '_posY') {
    w.style.top = v;
    if (w.style.position !== 'absolute' && w.style.position !== 'fixed') {
      w.style.position = 'absolute';
    }
  } else if (k === '_zIndex') {
    w.style.zIndex = v;
  } else if (k === '_width') {
    w.style.width = v;
    w.style.maxWidth = v;
  } else if (k === '_height') {
    w.style.height = v;
  }

  const el = w.querySelector('[data-wb]');
  if (el) {
    // Update the data attribute
    if (k === 'text') {
      el.textContent = v;
    } else if (k === 'src') {
      el.src = v;
    } else if (k === 'hoverText') {
      el.setAttribute('title', v);
      // Also set on wrapper for canvas mode visibility
      if (v) w.setAttribute('title', v);
      else w.removeAttribute('title');
    } else {
      el.dataset[k] = v;
    }

    // Update container styles directly for immediate feedback
    if (c.b === 'container') {
      if (k === 'gap') {
        el.style.gap = v;
        el.style.setProperty('--gap', v);
      } else if (k === 'direction') {
        el.style.flexDirection = v;
      } else if (k === 'wrap') {
        el.style.flexWrap = (v === true || v === 'true') ? 'wrap' : 'nowrap';
      } else if (k === 'align') {
        const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
        el.style.alignItems = alignMap[v] || v;
      } else if (k === 'justify') {
        const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };
        el.style.justifyContent = justifyMap[v] || v;
      } else if (k === 'padding') {
        el.style.padding = v;
      }
    }

    // Force re-render: remove wbReady flag and re-scan
    // This makes WB treat it as a new element
    delete el.dataset.wbReady;
    WB.remove(el); // Clean up old behavior
    WB.scan(w);    // Re-apply behavior with new data

    // Run validation and compliance test
    if (c.b && BuilderValidation) {
      const testResult = await BuilderValidation.runComplianceTest(c.b, el, k, v);

      // If validation failed, log a fix when user corrects it
      if (!testResult.schemaValid || !testResult.behaviorValid) {
        // Store pending fix info for when user corrects
        w.dataset.pendingFix = JSON.stringify({
          component: c.b,
          property: k,
          invalidValue: v,
          errors: testResult.errors
        });
      } else if (w.dataset.pendingFix) {
        // Value was corrected - log the fix
        const pendingFix = JSON.parse(w.dataset.pendingFix);
        await BuilderValidation.logFix({
          component: c.b,
          property: k,
          issue: pendingFix.errors.map(e => e.message).join('; '),
          action: `Changed ${k} from invalid value to valid value`,
          oldValue: pendingFix.invalidValue,
          newValue: v
        });
        delete w.dataset.pendingFix;
      }
    }

    // Auto-wrap logic for width changes
    if (k === 'width') {
      if (v !== '100%' && v !== '') {
        // Enable flow layout for non-full-width elements
        w.style.display = 'inline-block';
        w.style.verticalAlign = 'top';
        w.style.marginRight = '0.5rem';
      } else {
        // Reset to default block behavior
        w.style.display = '';
        w.style.verticalAlign = '';
        w.style.marginRight = '';
      }
      // await wrapInRowContainer(w); // Disabled: Users prefer natural flow over auto-containers
    }
  }

  // Only re-render tree if icon changed (prevents input losing focus)
  if (iconChanged) {
    renderTree();
  }

  // Update incomplete badges
  updateBadges();

  // Refresh issues panel if this component is selected
  if (w.classList.contains('selected')) {
    showIssuesPanel(w);
  }

  saveHist();
};

window.del = id => {
  const w = document.getElementById(id);
  if (w) {
    w.remove();
    updCount();
    saveHist();
    chkEmpty();
    renderTree();
    autoExtendCanvas();
    updateBadges();
  }
  if (sel?.id === id) {
    sel = null;
  }
};

window.dup = id => { const w = document.getElementById(id); if (w) { add(JSON.parse(w.dataset.c), w.dataset.parent); renderTree(); autoExtendCanvas(); } };
// moveUp and moveDown are defined later in the file


// Viewport with size info
window.setVP = s => {
  currentVP = s;
  const f = document.querySelector('.frame');
  document.querySelectorAll('.tool-btn[data-vp]').forEach(b => b.classList.remove('active'));
  document.querySelector('.tool-btn[data-vp="' + s + '"]')?.classList.add('active');
  f.style.maxWidth = VP_SIZES[s].w + 'px';
  updateVPInfo();
};

function updateVPInfo() {
  const vpInfo = document.getElementById('vpInfo');
  if (!vpInfo) return; // Element may not exist in simplified toolbar
  const size = VP_SIZES[currentVP];
  vpInfo.textContent = size.w + ' × ' + size.h + 'px';
}

// Save dropdown actions
window.toggleSaveMenu = () => {
  document.getElementById('saveMenu').classList.toggle('show');
};

window.savePage = () => {
  const cv = document.getElementById('canvas');
  const data = [];
  cv.querySelectorAll('.dropped:not(.grid-child)').forEach(w => {
    const item = { ...JSON.parse(w.dataset.c), id: w.id };
    // Include grid children
    if (w.dataset.grid) {
      item.children = [];
      w.querySelectorAll('.grid-child').forEach(gc => {
        item.children.push({ ...JSON.parse(gc.dataset.c), id: gc.id, span: gc.dataset.span });
      });
    }
    data.push(item);
  });

  const pageTheme = document.getElementById('pageTheme').value;
  localStorage.setItem('wb-builder-page', JSON.stringify({ theme: pageTheme, components: data }));
  toast('Page saved!');
  document.getElementById('saveMenu')?.classList.remove('show');
};

window.saveAsHTML = () => {
  const cv = document.getElementById('canvas');
  let html = '';
  cv.querySelectorAll('.dropped').forEach(w => {
    const el = w.querySelector('[data-wb]') || w.querySelector('*:not(.controls)');
    if (el) html += el.outerHTML + '\n';
  });

  // Create download
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'page-export.html';
  a.click();
  URL.revokeObjectURL(url);

  toast('Exported HTML!');
  document.getElementById('saveMenu')?.classList.remove('show');
};

window.exportCode = window.saveAsHTML;

window.resetCanvas = () => {
  if (confirm('Reset canvas? This will clear all components.')) {
    document.getElementById('canvas').innerHTML = '<div class="empty" id="empty"><div class="empty-icon">📦</div><h3>Drag components here</h3><p>Build your page visually</p></div>';
    localStorage.removeItem('wb-builder-page');
    sel = null;
    hist = [];
    hi = -1;
    cid = 0;
    updCount();
    renderTree(); // Update right panel
  }
  document.getElementById('saveMenu')?.classList.remove('show');
};

function load() {
  const data = localStorage.getItem('wb-builder-page');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach(c => add(c));
      } else {
        if (parsed.theme) {
          document.getElementById('pageTheme').value = parsed.theme;
          document.documentElement.dataset.theme = parsed.theme;
          document.getElementById('canvas').dataset.theme = parsed.theme;
        }
        if (parsed.components) {
          parsed.components.forEach(c => {
            add(c);
            // Add grid children
            if (c.children) {
              const gridWrapper = document.getElementById(c.id);
              c.children.forEach(gc => {
                addToGrid(gc, gridWrapper);
                if (gc.span) setSpan(gc.id, parseInt(gc.span));
              });
            }
          });
        }
      }
      // Update badges after load
      setTimeout(() => updateBadges(), 100);
    } catch (e) { console.error(e); }
  }
}

function saveHist() {
  const cv = document.getElementById('canvas');
  hist = hist.slice(0, hi + 1);
  hist.push(cv.innerHTML);
  hi = hist.length - 1;
  if (hist.length > 50) { hist.shift(); hi--; }
  updateUndoRedoButtons();
}

// Expose saveHist globally for builder-tree.js
window.saveHist = saveHist;

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) undoBtn.disabled = hi <= 0;
  if (redoBtn) redoBtn.disabled = hi >= hist.length - 1;
}

window.undo = () => {
  if (hi > 0) {
    hi--;
    document.getElementById('canvas').innerHTML = hist[hi];
    WB.scan(document.getElementById('canvas'));
    updCount();
    renderTree();
    updateUndoRedoButtons();
    updateBadges();
    toast('Undo');
  }
};

window.redo = () => {
  if (hi < hist.length - 1) {
    hi++;
    document.getElementById('canvas').innerHTML = hist[hi];
    WB.scan(document.getElementById('canvas'));
    updCount();
    renderTree();
    updateUndoRedoButtons();
    updateBadges();
    toast('Redo');
  }
};

// =============================================================================
// EXPORT/IMPORT JSON
// =============================================================================
window.exportJSON = () => {
  const cv = document.getElementById('canvas');
  const data = [];

  // Check for incomplete components first
  const allWrappers = cv.querySelectorAll('.dropped');
  let issueCount = 0;
  let warningCount = 0;

  allWrappers.forEach(w => {
    const analysis = analyzeComponent(w);
    issueCount += analysis.issues.length;
    warningCount += analysis.warnings.length;
  });

  // Warn user about incomplete items
  if (issueCount > 0) {
    const proceed = confirm(`⚠️ ${issueCount} required field${issueCount > 1 ? 's are' : ' is'} missing.\n\nExport anyway?`);
    if (!proceed) {
      toast('Export cancelled - fix issues first');
      updateBadges();
      return;
    }
  } else if (warningCount > 0) {
    toast(`Note: ${warningCount} placeholder value${warningCount > 1 ? 's' : ''} detected`);
  }

  cv.querySelectorAll('.dropped:not(.grid-child):not(.container-child)').forEach(w => {
    const item = {
      ...JSON.parse(w.dataset.c),
      id: w.id
    };

    // Include grid children
    if (w.dataset.grid) {
      item.children = [];
      w.querySelectorAll('.grid-child').forEach(gc => {
        item.children.push({
          ...JSON.parse(gc.dataset.c),
          id: gc.id,
          span: gc.dataset.span
        });
      });
    }

    // Include container children
    const containerChildren = w.querySelectorAll('.container-child');
    if (containerChildren.length > 0) {
      item.children = item.children || [];
      containerChildren.forEach(cc => {
        item.children.push({
          ...JSON.parse(cc.dataset.c),
          id: cc.id
        });
      });
    }

    data.push(item);
  });

  const exportData = {
    version: '1.0.0',
    exported: new Date().toISOString(),
    theme: document.getElementById('pageTheme')?.value || 'dark',
    components: data,
    metadata: {
      componentCount: data.length,
      source: 'WB Page Builder'
    }
  };

  // Create and download file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `page-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  toast(`Exported ${data.length} components`);
};

window.importJSON = () => {
  // Create file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.components || !Array.isArray(data.components)) {
        toast('Invalid file format');
        return;
      }

      // Confirm import
      const count = data.components.length;
      if (!confirm(`Import ${count} components? This will clear the current canvas.`)) {
        return;
      }

      // Clear canvas
      document.getElementById('canvas').innerHTML = '';
      sel = null;
      hist = [];
      hi = -1;
      cid = 0;

      // Set theme if present
      if (data.theme) {
        const themeSelect = document.getElementById('pageTheme');
        if (themeSelect) {
          themeSelect.value = data.theme;
          document.documentElement.dataset.theme = data.theme;
          document.getElementById('canvas').dataset.theme = data.theme;
        }
      }

      // Add components
      data.components.forEach(c => {
        add(c);

        // Add grid children if present
        if (c.children && c.children.length > 0) {
          const gridWrapper = document.getElementById(c.id);
          if (gridWrapper?.dataset.grid) {
            c.children.forEach(gc => {
              addToGrid(gc, gridWrapper);
              if (gc.span) setSpan(gc.id, parseInt(gc.span));
            });
          }
        }
      });

      saveHist();
      toast(`Imported ${count} components`);

    } catch (err) {
      console.error('[Import Error]', err);
      toast('Failed to import: ' + err.message);
    }
  };

  input.click();
};

function updCount() {
  const n = document.querySelectorAll('.dropped').length;
  document.getElementById('count').textContent = n + ' component' + (n !== 1 ? 's' : '');
}

// Alias for updCount plus tree refresh
function upd() {
  updCount();
  if (window.renderTree) renderTree();
  if (window.autoExtendCanvas) autoExtendCanvas();
}

function chkEmpty() {
  const cv = document.getElementById('canvas');
  if (!cv.querySelector('.dropped')) {
    cv.innerHTML = '<div class="empty" id="empty"><div class="empty-icon">📦</div><h3>Drag components here</h3><p>Build your page visually</p></div>';
  }
}

function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// Theme dropdown
document.getElementById('pageTheme')?.addEventListener('change', (e) => {
  const theme = e.target.value;
  document.documentElement.dataset.theme = theme;
  document.getElementById('canvas').dataset.theme = theme;
});

// Sync theme from component events (e.g. when using the Theme Control component)
document.addEventListener('wb:theme:change', (e) => {
  const theme = e.detail.theme;
  const select = document.getElementById('pageTheme');
  if (select && select.value !== theme) {
    select.value = theme;
    document.documentElement.dataset.theme = theme;
    document.getElementById('canvas').dataset.theme = theme;
  }
});

// Live editing listener moved to enableBuilderInteractions

// Click handlers moved to enableBuilderInteractions

// Keydown handlers moved to enableBuilderInteractions

// =============================================================================
// RIGHT-CLICK CONTEXT MENU (Shift+Right-click for custom menu)
// =============================================================================
// Context menu listener moved to enableBuilderInteractions

function showContextMenu(x, y, wrapper) {
  // Remove existing menu
  document.getElementById('builderContextMenu')?.remove();

  const c = JSON.parse(wrapper.dataset.c);
  const menu = document.createElement('div');
  menu.id = 'builderContextMenu';
  menu.className = 'context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: var(--bg-secondary, #1f2937);
    border: 1px solid var(--border-color, #374151);
    border-radius: 8px;
    padding: 0.5rem 0;
    min-width: 200px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: fadeIn 0.15s ease;
  `;

  menu.innerHTML = `
    <button class="ctx-item" onclick="viewSchema('${c.b}')">📋 View Schema</button>
    <button class="ctx-item" onclick="selComp(document.getElementById('${wrapper.id}'))">⚙️ Edit Properties</button>
    <hr class="ctx-divider">
    <button class="ctx-item" onclick="dup('${wrapper.id}')">📄 Duplicate</button>
    <button class="ctx-item" onclick="moveUp('${wrapper.id}')">⬆️ Move Up</button>
    <button class="ctx-item" onclick="moveDown('${wrapper.id}')">⬇️ Move Down</button>
    <hr class="ctx-divider">
    <button class="ctx-item ctx-item--danger" onclick="del('${wrapper.id}')">🗑️ Delete</button>
  `;

  // Style the menu items
  const style = document.createElement('style');
  style.textContent = `
    .ctx-item {
      display: block;
      width: 100%;
      padding: 0.5rem 1rem;
      text-align: left;
      background: none;
      border: none;
      color: var(--text-primary, #fff);
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.15s;
    }
    .ctx-item:hover { background: var(--bg-tertiary, #374151); }
    .ctx-item--danger { color: #ef4444; }
    .ctx-item--danger:hover { background: rgba(239, 68, 68, 0.1); }
    .ctx-divider { border: none; border-top: 1px solid var(--border-color, #374151); margin: 0.25rem 0; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `;
  menu.appendChild(style);

  document.body.appendChild(menu);

  // Adjust position if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 10) + 'px';

  // Close on click outside
  setTimeout(() => {
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    document.addEventListener('click', closeMenu);
  }, 0);
}

window.viewSchema = (behavior) => {
  // Close context menu
  document.getElementById('builderContextMenu')?.remove();

  // Open the docs modal instead of a new window
  showDocs(behavior, 'schema');
};

// =============================================================================
// NOTES MODAL (NEW)
// =============================================================================
let notesOpen = false;
let notesModal = null;

function initNotes() {
  const textarea = document.getElementById('notesArea');
  if (textarea) {
    textarea.value = localStorage.getItem('wb-builder-notes') || '';
    textarea.addEventListener('input', () => {
      localStorage.setItem('wb-builder-notes', textarea.value);
    });
  }

  // Initialize modal references
  notesModal = document.getElementById('notesModal');

  if (!notesModal) return;

  // ========================================
  // WIDTH RESIZE (left edge)
  // ========================================
  let isResizingWidth = false;
  let startX = 0;
  let startWidth = 0;

  notesModal.addEventListener('mousedown', (e) => {
    const rect = notesModal.getBoundingClientRect();
    // Left edge for width resize
    if (e.clientX < rect.left + 8 && e.clientY > rect.top + 8 && e.clientY < rect.bottom - 8) {
      isResizingWidth = true;
      startX = e.clientX;
      startWidth = rect.width;
      notesModal.classList.add('resizing-width');
      document.body.style.cursor = 'ew-resize';
      e.preventDefault();
    }
  });

  // ========================================
  // HEIGHT RESIZE (bottom edge)
  // ========================================
  let isResizingHeight = false;
  let startY = 0;
  let startHeight = 0;

  notesModal.addEventListener('mousedown', (e) => {
    const rect = notesModal.getBoundingClientRect();
    // Bottom edge for height resize
    if (e.clientY > rect.bottom - 8 && e.clientX > rect.left + 8) {
      isResizingHeight = true;
      startY = e.clientY;
      startHeight = rect.height;
      notesModal.classList.add('resizing-height');
      document.body.style.cursor = 'ns-resize';
      e.preventDefault();
    }
  });

  // ========================================
  // MOUSE MOVE HANDLER
  // ========================================
  document.addEventListener('mousemove', (e) => {
    if (isResizingWidth) {
      // Dragging left = increase width, dragging right = decrease
      const deltaX = startX - e.clientX;
      const newWidth = Math.max(300, Math.min(window.innerWidth * 0.66, startWidth + deltaX));
      notesModal.style.width = newWidth + 'px';
    }
    if (isResizingHeight) {
      // Dragging down = increase height, dragging up = decrease
      const maxHeight = window.innerHeight - 56 - 40; // header and footer
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(200, Math.min(maxHeight, startHeight + deltaY));
      notesModal.style.height = newHeight + 'px';
    }
  });

  // ========================================
  // MOUSE UP HANDLER
  // ========================================
  document.addEventListener('mouseup', () => {
    if (isResizingWidth) {
      isResizingWidth = false;
      notesModal.classList.remove('resizing-width');
      document.body.style.cursor = '';
      localStorage.setItem('wb-notes-width', notesModal.style.width);
    }
    if (isResizingHeight) {
      isResizingHeight = false;
      notesModal.classList.remove('resizing-height');
      document.body.style.cursor = '';
      localStorage.setItem('wb-notes-height', notesModal.style.height);
    }
  });

  // Restore saved size
  const savedWidth = localStorage.getItem('wb-notes-width');
  const savedHeight = localStorage.getItem('wb-notes-height');
  if (savedWidth) notesModal.style.width = savedWidth;
  if (savedHeight) notesModal.style.height = savedHeight;
}

window.toggleNotesDrawer = () => {
  if (!notesModal) notesModal = document.getElementById('notesModal');
  const backdrop = document.getElementById('notesBackdrop');

  if (!notesModal) {
    console.error('Notes modal not found');
    return;
  }

  notesOpen = !notesOpen;
  notesModal.classList.toggle('open', notesOpen);
  backdrop?.classList.toggle('open', notesOpen);

  localStorage.setItem('wb-notes-open', notesOpen);
};

window.copyNotes = () => {
  const text = document.getElementById('notesArea').value;
  if (!text.trim()) {
    showNotesStatus('No notes to copy', 'error');
    return;
  }
  navigator.clipboard.writeText(text).then(() => showNotesStatus('Copied to clipboard!', 'success'));
};

window.saveNotesToFile = async () => {
  const text = document.getElementById('notesArea').value;

  if (!text.trim()) {
    showNotesStatus('Nothing to save', 'info');
    return;
  }

  const data = {
    notes: [{ id: 'builder', content: text, updated: new Date().toISOString() }]
  };

  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'data/notes.json',
        data: data
      })
    });

    if (!response.ok) {
      const error = await response.json();
      showNotesStatus('Error: ' + (error.error || 'Save failed'), 'error');
      return;
    }

    const result = await response.json();

    if (result.duplicate) {
      showNotesStatus('No changes to save', 'info');
    } else {
      showNotesStatus('Saved to data/notes.json', 'success');
    }
  } catch (err) {
    console.error('[Save Error]', err);
    showNotesStatus('Save failed: ' + err.message, 'error');
  }
};

window.clearNotes = () => {
  const textarea = document.getElementById('notesArea');
  if (!textarea.value.trim() || confirm('Clear all notes?')) {
    textarea.value = '';
    localStorage.removeItem('wb-builder-notes');
    showNotesStatus('Notes cleared', 'success');
  }
};

function showNotesStatus(msg, type) {
  const status = document.getElementById('notesStatus');
  status.textContent = msg;
  status.className = 'notes-modal-status ' + type;
  setTimeout(() => {
    status.textContent = '';
    status.className = 'notes-modal-status';
  }, 3000);
}

start();

// Drawer resize logic is handled in the DOMContentLoaded block at the top of this file

// =============================================================================
// PREVIEW MODE
// =============================================================================
let previewMode = false;
let previewExitBtn = null;

window.togglePreview = () => {
  try {
    previewMode = !previewMode;
    console.log('Toggling preview mode:', previewMode);
    document.body.classList.toggle('preview-mode', previewMode);

    const previewBtn = document.getElementById('previewBtn');

    if (previewMode) {
      // Disable all builder interactions
      try {
        disableBuilderInteractions();
      } catch (e) {
        console.error('Error disabling interactions:', e);
      }

      // Deselect current component
      if (sel) {
        sel.classList.remove('selected');
        sel = null;
        if (window.renderTree) renderTree();
      }

      // Hide header in preview
      const header = document.querySelector('.builder-header');
      if (header) header.style.display = 'none';

      const footer = document.querySelector('.builder-footer');
      if (footer) footer.style.display = 'none';

      const container = document.querySelector('.builder-container');
      if (container) {
        container.style.top = '0';
        container.style.bottom = '0';
      }

      // Add exit button
      previewExitBtn = document.createElement('button');
      previewExitBtn.className = 'preview-exit';
      previewExitBtn.innerHTML = '✕ Exit Preview';
      previewExitBtn.onclick = togglePreview;
      document.body.appendChild(previewExitBtn);

      toast('Preview Mode - Press Escape or click Exit to return');
    } else {
      // Re-enable builder interactions
      try {
        enableBuilderInteractions();
      } catch (e) {
        console.error('Error enabling interactions:', e);
        toast('Error restoring builder interactions. Please reload.');
      }

      // Restore header
      const header = document.querySelector('.builder-header');
      if (header) header.style.display = '';

      const footer = document.querySelector('.builder-footer');
      if (footer) footer.style.display = '';

      const container = document.querySelector('.builder-container');
      if (container) {
        container.style.top = '';
        container.style.bottom = '';
      }

      // Remove exit button
      previewExitBtn?.remove();
      previewExitBtn = null;
    }
  } catch (err) {
    console.error('Preview toggle error:', err);
    alert('Error toggling preview mode: ' + err.message);
  }
};

// =============================================================================
// FAVORITES SYSTEM
// =============================================================================
let favorites = JSON.parse(localStorage.getItem('wb-favorites') || '[]');

function renderFavorites() {
  const section = document.getElementById('favoritesSection');
  const list = document.getElementById('favoritesList');

  if (!section || !list) return;

  if (favorites.length === 0) {
    section.classList.remove('has-items');
    return;
  }

  section.classList.add('has-items');
  list.innerHTML = '';

  favorites.forEach(behavior => {
    const comp = C.All.find(c => c.b === behavior);
    if (!comp) return;

    const item = document.createElement('div');
    item.className = 'comp-item favorite';
    item.draggable = true;
    item.dataset.c = JSON.stringify(comp);
    item.innerHTML = `
      <span class="comp-icon">${comp.i}</span>
      <span class="comp-name">${comp.n}</span>
      <button class="comp-fav" onclick="event.stopPropagation(); toggleFavorite('${comp.b}')" title="Remove from favorites">★</button>
    `;

    item.ondragstart = (e) => {
      e.dataTransfer.setData('c', JSON.stringify(comp));
      e.dataTransfer.effectAllowed = 'copy';
    };

    list.appendChild(item);
  });
}

window.toggleFavorite = (behavior) => {
  const idx = favorites.indexOf(behavior);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    toast(`Removed from favorites`);
  } else {
    favorites.push(behavior);
    toast(`Added to favorites`);
  }
  localStorage.setItem('wb-favorites', JSON.stringify(favorites));
  renderFavorites();
  renderList(); // Re-render main list to update star states
};

window.clearFavorites = () => {
  if (confirm('Clear all favorites?')) {
    favorites = [];
    localStorage.setItem('wb-favorites', JSON.stringify(favorites));
    renderFavorites();
    renderList();
    toast('Favorites cleared');
  }
};

// =============================================================================
// TEMPLATES SYSTEM
// =============================================================================
let TEMPLATES = [];

// Use the new template chooser from builder-welcome.js
window.openTemplates = () => {
  // Show the welcome screen with template chooser
  if (openTemplatesChooser) {
    openTemplatesChooser();
  } else {
    // Fallback to old modal if available
    const modal = document.getElementById('templatesModal');
    const grid = document.getElementById('templatesGrid');

    if (!modal || !grid) return;

    grid.innerHTML = TEMPLATES.map(t => `
      <div class="template-card" onclick="insertTemplate('${t.id}')">
        <div class="template-preview">${t.icon}</div>
        <div class="template-name">${t.name}</div>
        <div class="template-desc">${t.desc}</div>
        <div class="template-components">${t.components.length} component${t.components.length > 1 ? 's' : ''}</div>
      </div>
    `).join('');

    modal.classList.add('open');
  }
};

window.closeTemplates = () => {
  // Close the welcome screen if open
  if (hideWelcome) {
    hideWelcome();
  }
  // Also close old modal if exists
  document.getElementById('templatesModal')?.classList.remove('open');
};

window.insertTemplate = async (templateId) => {
  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) return;

  closeTemplates();

  // Track inserted component IDs for checklist
  const insertedIds = [];

  // Insert each component from template
  for (const comp of template.components) {
    const wrapper = await dropComponent(comp);
    if (wrapper) insertedIds.push(wrapper.id);

    // If it has grid children, add them
    if (comp.gridChildren) {
      const lastDropped = document.querySelector('.dropped:last-child');
      if (lastDropped) {
        for (const child of comp.gridChildren) {
          const childWrapper = await dropComponent(child, lastDropped);
          if (childWrapper) insertedIds.push(childWrapper.id);
        }
      }
    }
  }

  toast(`Template "${template.name}" inserted`);
  upd();

  // Update badges and show checklist for incomplete items
  updateBadges();
  setTimeout(() => {
    showTemplateChecklist(template.name, insertedIds);
  }, 300);
};

// Helper to programmatically drop a component
async function dropComponent(comp, targetContainer = null) {
  const canvas = document.getElementById('canvas');
  const target = targetContainer || canvas;

  // Create the dropped element
  const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
  const wrapper = document.createElement('div');
  wrapper.id = id;
  wrapper.className = 'dropped';
  wrapper.dataset.c = JSON.stringify(comp);
  wrapper.draggable = true;

  // Build the inner element
  let el;
  if (comp.t === 'input') {
    el = document.createElement('input');
    el.type = 'text';
  } else {
    el = document.createElement('div');
  }

  el.dataset.wb = comp.b;

  // Apply data attributes
  if (comp.d) {
    for (const [k, v] of Object.entries(comp.d)) {
      if (v !== '' && v !== false && v !== 'false') {
        el.dataset[k] = v;
      }
    }
  }

  // Handle container children
  if (comp.container && comp.children) {
    comp.children.forEach(child => {
      const childEl = document.createElement('div');
      if (child.title) childEl.dataset.title = child.title;
      if (child.content) childEl.innerHTML = child.content;
      el.appendChild(childEl);
    });
  }

  wrapper.innerHTML = `
    <div class="controls">
      <button class="ctrl-btn" onclick="window.duplicateComponent('${id}')" title="Duplicate (Ctrl+D)">📋</button>
      <button class="ctrl-btn" onclick="window.moveUp('${id}')" title="Move Up (↑)">⬆</button>
      <button class="ctrl-btn" onclick="window.moveDown('${id}')" title="Move Down (↓)">⬇</button>
      <button class="ctrl-btn del" onclick="del('${id}')" title="Delete (Del)">🗑</button>
    </div>
  `;
  wrapper.appendChild(el);

  target.appendChild(wrapper);

  // Initialize behaviors
  await WB.scan(wrapper);
  initInlineEditing(wrapper, comp, saveHist);

  // Hide empty state
  const empty = document.getElementById('empty');
  if (empty) empty.style.display = 'none';

  return wrapper;
}

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================
window.showShortcuts = () => {
  document.getElementById('shortcutsModal')?.classList.add('open');
};

window.closeShortcuts = () => {
  document.getElementById('shortcutsModal')?.classList.remove('open');
};

// Enhanced keyboard handler moved to enableBuilderInteractions

// =============================================================================
// DUPLICATE COMPONENT
// =============================================================================
window.duplicateComponent = (id) => {
  const original = document.getElementById(id);
  if (!original) return;

  const c = JSON.parse(original.dataset.c);

  // Create a new ID
  const newId = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
  const clone = original.cloneNode(true);
  clone.id = newId;

  // Update control buttons
  clone.querySelectorAll('.ctrl-btn').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick) {
      btn.setAttribute('onclick', onclick.replace(id, newId));
    }
  });

  // Insert after original
  original.after(clone);

  // Re-initialize
  WB.scan(clone);
  initInlineEditing(clone, c, saveHist);

  saveHist('Duplicate ' + c.n);
  upd();
  toast('Duplicated ' + c.n);
};

// =============================================================================
// MOVE COMPONENT UP/DOWN
// =============================================================================
window.moveUp = (id) => {
  const el = document.getElementById(id);
  if (!el) return;

  // Find previous dropped component (skip other elements)
  let prev = el.previousElementSibling;
  while (prev && !prev.classList.contains('dropped')) {
    prev = prev.previousElementSibling;
  }

  if (!prev) return;

  // Don't move past the empty state
  if (prev.id === 'empty') return;

  prev.before(el);
  const c = JSON.parse(el.dataset.c);
  saveHist('Move ' + c.n + ' up');
  renderTree();
};

window.moveDown = (id) => {
  const el = document.getElementById(id);
  if (!el) return;

  // Find next dropped component (skip other elements)
  let next = el.nextElementSibling;
  while (next && !next.classList.contains('dropped')) {
    next = next.nextElementSibling;
  }

  if (!next) return;

  next.after(el);
  const c = JSON.parse(el.dataset.c);
  saveHist('Move ' + c.n + ' down');
  renderTree();
};

// =============================================================================
// COPY AS HTML
// =============================================================================
window.copyAsHTML = () => {
  if (!sel) {
    toast('No component selected');
    return;
  }

  const el = sel.querySelector('[data-wb]');
  if (!el) return;

  // Clone and clean up
  const clone = el.cloneNode(true);
  clone.removeAttribute('data-wb-ready');
  clone.classList.remove('wb-mdhtml--loading', 'wb-mdhtml--loaded');

  // Remove contenteditable attributes
  clone.querySelectorAll('[contenteditable]').forEach(ce => {
    ce.removeAttribute('contenteditable');
  });

  const html = clone.outerHTML;

  navigator.clipboard.writeText(html).then(() => {
    toast('HTML copied to clipboard');
  });
};

// =============================================================================
// SNAP GRID
// =============================================================================
let snapEnabled = false;

window.toggleSnapGrid = (enabled) => {
  snapEnabled = enabled;
  const frame = document.getElementById('canvas');
  const checkbox = document.getElementById('snapGrid');

  if (frame) {
    frame.classList.toggle('snap-enabled', enabled);
  }

  if (checkbox) {
    checkbox.checked = enabled;
  }

  localStorage.setItem('wb-snap-grid', enabled);
  toast(enabled ? 'Snap grid enabled' : 'Snap grid disabled');
};

// Restore snap grid setting
if (localStorage.getItem('wb-snap-grid') === 'true') {
  setTimeout(() => toggleSnapGrid(true), 100);
}

// =============================================================================
// UNDO/REDO LABELS
// =============================================================================
let historyLabels = [];
let redoLabels = [];

// Override saveHist to accept label
const originalSaveHist = window.saveHist;
window.saveHist = (label = 'Change') => {
  historyLabels.push(label);
  redoLabels = []; // Clear redo on new action
  if (originalSaveHist) originalSaveHist();
  updateUndoRedoLabels();
};

function updateUndoRedoLabels() {
  const undoLabel = document.getElementById('undoLabel');
  const redoLabel = document.getElementById('redoLabel');

  if (undoLabel) {
    undoLabel.textContent = historyLabels.length > 0 ? historyLabels[historyLabels.length - 1] : '';
  }
  if (redoLabel) {
    redoLabel.textContent = redoLabels.length > 0 ? redoLabels[redoLabels.length - 1] : '';
  }
}

// =============================================================================
// VALIDATION BADGES
// =============================================================================
function validateComponent(wrapper) {
  const c = JSON.parse(wrapper.dataset.c || '{}');
  const el = wrapper.querySelector('[data-wb]');
  if (!el || !c.d) return { valid: true, missing: [] };

  const missing = [];

  // Check required fields based on component type
  const requiredFields = {
    'link': ['href'],
    'cardbutton': ['primary'],
    'cardimage': ['imageSrc'],
    'cardprofile': ['name'],
    'audio': ['src'],
    'video': ['src'],
    'cardpricing': ['plan', 'price']
  };

  const required = requiredFields[c.b] || [];

  for (const field of required) {
    const value = c.d[field] || el.dataset[field];
    if (!value || value.trim() === '') {
      missing.push(field);
    }
  }

  return { valid: missing.length === 0, missing };
}

// Expose for builder-tree.js
window.validateComponent = validateComponent;

// =============================================================================
// LIVE COLLABORATION (WebSocket)
// =============================================================================
let collabSocket = null;
let collabConnected = false;
let collabRoom = null;

function initCollaboration() {
  // Check if WebSocket server is available
  const wsUrl = `ws://${window.location.hostname}:3001/collab`;

  try {
    collabSocket = new WebSocket(wsUrl);

    collabSocket.onopen = () => {
      collabConnected = true;
      updateCollabStatus('connecting');

      // Generate user ID
      collabSocket.userId = 'User-' + Math.random().toString(36).slice(2, 6);

      // Join or create room based on page
      collabRoom = window.location.pathname + window.location.search;
      collabSocket.send(JSON.stringify({
        type: 'join',
        room: collabRoom,
        user: collabSocket.userId
      }));
    };

    collabSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleCollabMessage(msg);
      } catch (e) {
        console.warn('[Collab] Invalid message:', e);
      }
    };

    collabSocket.onclose = () => {
      collabConnected = false;
      updateCollabStatus('offline');
      // Try to reconnect after 5 seconds
      setTimeout(initCollaboration, 5000);
    };

    collabSocket.onerror = () => {
      updateCollabStatus('offline');
    };
  } catch (e) {
    console.log('[Collab] WebSocket not available');
    updateCollabStatus('offline');
  }
}

function updateCollabStatus(status) {
  const statusEl = document.getElementById('collabStatus');
  if (!statusEl) return;

  const dot = statusEl.querySelector('.collab-dot');
  const text = statusEl.querySelector('.collab-text');

  dot.className = 'collab-dot ' + status;

  switch (status) {
    case 'online':
      text.textContent = 'Connected';
      statusEl.title = 'Collaboration: Connected';
      break;
    case 'connecting':
      text.textContent = 'Connecting...';
      statusEl.title = 'Collaboration: Connecting';
      break;
    default:
      text.textContent = 'Offline';
      statusEl.title = 'Collaboration: Offline (WebSocket server not running)';
  }
}

function handleCollabMessage(msg) {
  switch (msg.type) {
    case 'joined':
      updateCollabStatus('online');
      toast(`Collaboration active: ${msg.users} user(s)`);
      break;
    case 'user-joined':
      toast(`${msg.user} joined`);
      break;
    case 'user-left':
      toast(`${msg.user} left`);
      break;
    case 'component-added':
      // Another user added a component
      if (msg.userId !== collabSocket.userId) {
        // Apply the change
        syncComponent(msg.data);
      }
      break;
    case 'component-updated':
      if (msg.userId !== collabSocket.userId) {
        syncComponentUpdate(msg.id, msg.data);
      }
      break;
    case 'component-deleted':
      if (msg.userId !== collabSocket.userId) {
        const el = document.getElementById(msg.id);
        if (el) el.remove();
        upd();
      }
      break;
  }
}

function broadcastChange(type, data) {
  if (!collabConnected || !collabSocket) return;

  collabSocket.send(JSON.stringify({
    type,
    room: collabRoom,
    userId: collabSocket.userId,
    data
  }));
}

function syncComponent(data) {
  // Sync a component from another user
  dropComponent(data).then(() => upd());
}

function syncComponentUpdate(id, data) {
  const el = document.getElementById(id);
  if (!el) return;

  el.dataset.c = JSON.stringify(data);
  const inner = el.querySelector('[data-wb]');
  if (inner && data.d) {
    for (const [k, v] of Object.entries(data.d)) {
      inner.dataset[k] = v;
    }
  }
  WB.scan(el);
}

// Expose for external use
window.broadcastChange = broadcastChange;

// =============================================================================
// SAVE PAGE
// =============================================================================
window.savePage = async () => {
  const canvas = document.getElementById('canvas');

  // Check for incomplete components
  const allWrappers = canvas.querySelectorAll('.dropped');
  let issueCount = 0;

  allWrappers.forEach(w => {
    const analysis = analyzeComponent(w);
    issueCount += analysis.issues.length;
  });

  if (issueCount > 0) {
    const proceed = confirm(`⚠️ ${issueCount} required field${issueCount > 1 ? 's are' : ' is'} missing.\n\nSave anyway?`);
    if (!proceed) {
      toast('Save cancelled - fix issues first');
      updateBadges();
      return;
    }
  }

  const components = Array.from(canvas.querySelectorAll('.dropped')).map(wrapper => {
    return JSON.parse(wrapper.dataset.c);
  });

  const pageData = {
    version: '1.0',
    created: new Date().toISOString(),
    components
  };

  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'data/builder-page.json',
        data: pageData
      })
    });

    if (response.ok) {
      toast('Page saved!');
    } else {
      toast('Save failed');
    }
  } catch (e) {
    toast('Save error: ' + e.message);
  }
};

// =============================================================================
// INITIALIZE NEW FEATURES
// =============================================================================
function initNewFeatures() {
  bindToggleButtons(); // Bind buttons now that all functions are defined
  renderFavorites();
  initCollaboration();

  // Update main component list to include favorite buttons
  const originalRenderList = window.renderList;
  if (originalRenderList) {
    window.renderList = function () {
      originalRenderList();
      // Add favorite buttons to all comp-items
      document.querySelectorAll('.comp-item:not(.favorite)').forEach(item => {
        if (item.querySelector('.comp-fav')) return;

        try {
          const c = JSON.parse(item.dataset.c);
          const isFav = favorites.includes(c.b);
          const btn = document.createElement('button');
          btn.className = 'comp-fav';
          btn.textContent = isFav ? '★' : '☆';
          btn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
          btn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(c.b);
          };
          item.appendChild(btn);
          if (isFav) item.classList.add('favorite');
        } catch (e) { }
      });
    };
  }
}

// Run after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewFeatures);
} else {
  initNewFeatures();
}
