/**
 * Builder State - Single Source of Truth
 * 
 * Uses Design by Contract from builder-contracts.js
 * All state access goes through BuilderState methods
 */

const STORAGE_KEY = 'wb-builder-state';

// ═══════════════════════════════════════════════════════════════════════════
// BUILDER STATE - Single Source of Truth
// ═══════════════════════════════════════════════════════════════════════════

const BuilderState = {
  // Private state
  _components: [],
  _selectedComponent: null,
  _draggedComponent: null,
  _componentIdCounter: 0,
  _pages: [{ 
    id: 'home', 
    name: 'Home', 
    slug: 'index.html', 
    main: [
      { id: 'comp-home-hero', type: 'hero', section: 'main', html: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 4rem 2rem; text-align: center; color: white; border-radius: 8px;"><h2 style="font-size: 2.5rem; margin: 0 0 1rem 0;">Welcome to Your Site</h2><p style="font-size: 1.1rem; margin: 0;">Your value proposition goes here</p></div>', data: {} }
    ], 
    showHeader: true, 
    showFooter: true 
  }],
  _currentPageId: 'home',
  _globalSections: { header: [], footer: [] },
  _settings: {
    autoSave: false,
    autoSaveInterval: 30,
    showGrid: true,
    snapToGrid: false,
    gridSize: 20,
    defaultTheme: 'dark',
    confirmDelete: true,
    showTooltips: true,
    collapseLeftDrawer: false,
    collapseRightDrawer: false
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMPONENT ACCESSORS
  // ─────────────────────────────────────────────────────────────────────────
  
  get components() {
    return this._components;
  },

  findComponent(id) {
    // ═══ PRECONDITIONS ═══
    const ctx = { fn: 'findComponent', id };
    if (!id) {
      warn(false, 'findComponent called with falsy id', ctx);
      return undefined;
    }
    
    return this._components.find(c => c.id === id);
  },

  addComponent(component) {
    // ═══ PRECONDITIONS ═══
    const ctx = { fn: 'addComponent', componentId: component?.id };
    require(is.object(component), 'component must be object', ctx);
    require(is.nonEmptyString(component.id), 'component.id required', ctx);
    require(!this._components.find(c => c.id === component.id), 
      `Duplicate component id: ${component.id}`, ctx);

    // ═══ EXECUTE ═══
    this._components.push(component);

    // ═══ POSTCONDITIONS ═══
    ensure(this._components.includes(component), 'Component not added', ctx);
    assertInvariants('addComponent');

    return component;
  },

  removeComponent(id) {
    // ═══ PRECONDITIONS ═══
    const ctx = { fn: 'removeComponent', id };
    require(is.nonEmptyString(id), 'id required', ctx);

    const index = this._components.findIndex(c => c.id === id);
    if (index === -1) {
      warn(false, `Component not found for removal: ${id}`, ctx);
      return undefined;
    }

    // ═══ EXECUTE ═══
    const [removed] = this._components.splice(index, 1);

    // ═══ POSTCONDITIONS ═══
    ensure(!this._components.find(c => c.id === id), 'Component still exists', ctx);
    assertInvariants('removeComponent');

    return removed;
  },

  updateComponentData(id, key, value) {
    // ═══ PRECONDITIONS ═══
    const ctx = { fn: 'updateComponentData', id, key, value };
    console.log('[updateComponentData] CALLED with:', { id, key, value });
    
    // Defensive: check if contracts are loaded
    if (typeof require === 'function' && typeof is !== 'undefined') {
      require(is.nonEmptyString(id), 'id required', ctx);
      require(is.nonEmptyString(key), 'key required', ctx);
    } else if (!id || !key) {
      console.error('updateComponentData: id and key are required', ctx);
      return null;
    }

    const comp = this.findComponent(id);
    console.log('[updateComponentData] Found component:', comp ? comp.id : 'NOT FOUND');
    if (!comp) {
      console.warn('updateComponentData: Component not found', ctx);
      return null;
    }

    // ═══ EXECUTE ═══
    console.log('[updateComponentData] BEFORE - comp.data:', JSON.stringify(comp.data));
    comp.data = comp.data || {};
    comp.data[key] = value;

    // If we're updating the elementTheme, also keep the DOM and comp.html in sync so
    // consumers that read `comp.html` (exports / tests) reflect the current DOM.
    if (key === 'elementTheme') {
      const theme = value || '';
      try {
        const contentEl = comp.element?.querySelector('.component-content');
        // Prefer the first meaningful child; fall back to firstElementChild
        const targetEl = contentEl?.querySelector('*') || contentEl?.firstElementChild;
        if (targetEl) {
          if (theme) targetEl.setAttribute('data-theme', theme);
          else targetEl.removeAttribute('data-theme');
        }

        // Persist the current DOM snapshot into comp.html so exports and tests
        // observe the attribute change immediately.
        if (contentEl) {
          comp.html = contentEl.innerHTML;
        }

        console.log('[updateComponentData] synced elementTheme -> DOM + comp.html', comp.id, theme);
      } catch (err) {
        console.warn('[updateComponentData] failed to sync elementTheme to DOM/comp.html', err);
      }
    }

    console.log('[updateComponentData] AFTER - comp.data:', JSON.stringify(comp.data));

    // ═══ POSTCONDITIONS ═══
    if (typeof ensure === 'function') {
      ensure(comp.data[key] === value, 
        `Data not set: expected ${value}, got ${comp.data[key]}`, ctx);
      if (typeof assertInvariants === 'function') {
        assertInvariants('updateComponentData');
      }
    }

    return comp;
  },

  clearComponents() {
    const ctx = { fn: 'clearComponents', previousCount: this._components.length };
    
    // ═══ EXECUTE ═══
    this._components.length = 0;
    
    // ═══ POSTCONDITIONS ═══
    ensure(this._components.length === 0, 'Components not cleared', ctx);
    // Note: Don't assertInvariants here - called during load when state is incomplete
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SELECTION ACCESSORS
  // ─────────────────────────────────────────────────────────────────────────

  get selectedComponent() {
    return this._selectedComponent;
  },

  setSelectedComponent(comp) {
    const ctx = { fn: 'setSelectedComponent', compId: comp?.id };
    
    // Allow null or valid component
    if (comp !== null) {
      warn(is.component(comp), 'setSelectedComponent expects null or valid component', ctx);
    }
    
    this._selectedComponent = comp;
    // Note: Invariant check happens at assertInvariants if enabled
  },

  get draggedComponent() {
    return this._draggedComponent;
  },

  setDraggedComponent(comp) {
    this._draggedComponent = comp;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE ACCESSORS
  // ─────────────────────────────────────────────────────────────────────────

  get pages() {
    return this._pages;
  },

  get currentPageId() {
    return this._currentPageId;
  },

  setCurrentPageId(id) {
    const ctx = { fn: 'setCurrentPageId', id };
    require(is.nonEmptyString(id), 'pageId required', ctx);
    this._currentPageId = id;
  },

  findPage(id) {
    return this._pages.find(p => p.id === id);
  },

  get globalSections() {
    return this._globalSections;
  },

  get settings() {
    return this._settings;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ID GENERATION
  // ─────────────────────────────────────────────────────────────────────────

  nextComponentId() {
    this._componentIdCounter++;
    return `comp-${this._componentIdCounter}`;
  },

  get componentIdCounter() {
    return this._componentIdCounter;
  },

  setComponentIdCounter(val) {
    require(is.number(val) && val >= 0, 'counter must be non-negative number');
    this._componentIdCounter = val;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PERSISTENCE
  // ─────────────────────────────────────────────────────────────────────────

  save() {
    const ctx = { fn: 'save' };
    
    try {
      const componentData = this._components.map(c => ({
        id: c.id,
        type: c.type,
        section: c.section,
        html: c.html,
        data: c.data
      }));

      const state = {
        components: componentData,
        pages: this._pages,
        currentPageId: this._currentPageId,
        globalSections: this._globalSections,
        componentIdCounter: this._componentIdCounter
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('[BuilderState] Saved:', componentData.length, 'components');
      return true;
    } catch (e) {
      console.error('[BuilderState] Save failed:', e);
      return false;
    }
  },

  load() {
    const ctx = { fn: 'load' };
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      const state = JSON.parse(saved);
      require(is.object(state), 'Invalid saved state', ctx);

      // ═══ EXECUTE ═══
      if (state.pages) this._pages = state.pages;
      if (state.currentPageId) this._currentPageId = state.currentPageId;
      if (state.globalSections) this._globalSections = state.globalSections;
      if (is.number(state.componentIdCounter)) {
        this._componentIdCounter = state.componentIdCounter;
      }

      // Clear components (preserves array reference)
      this.clearComponents();

      if (Array.isArray(state.components)) {
        state.components.forEach(compData => {
          const template = typeof componentTemplates !== 'undefined' 
            ? componentTemplates[compData.type] 
            : null;
            
          if (template && typeof restoreComponent === 'function') {
            restoreComponent(compData, template);
          } else if (compData.type?.startsWith('semantic-')) {
            const tag = compData.type.replace('semantic-', '');
            const pseudoTemplate = {
              name: compData.data?.name || tag,
              icon: compData.data?.icon || '🏷️',
              html: compData.html,
              isSemantic: true,
              tag: tag
            };
            if (typeof restoreComponent === 'function') {
              restoreComponent(compData, pseudoTemplate);
            }
          }
        });
      }

      // Update UI
      if (typeof renderPagesList === 'function') renderPagesList();
      if (typeof renderComponentLibrary === 'function') renderComponentLibrary();
      if (typeof updateComponentCount === 'function') updateComponentCount();

      console.log('[BuilderState] Loaded:', this._components.length, 'components');
      
      // ═══ POSTCONDITIONS ═══
      assertInvariants('load');
      
      return true;
    } catch (e) {
      console.error('[BuilderState] Load failed:', e);
      return false;
    }
  },

  initAutoSave() {
    let saveTimeout = null;

    window.scheduleSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this.save();
        saveTimeout = null;
      }, 1000);
    };

    window.addEventListener('beforeunload', () => this.save());
    console.log('[BuilderState] Auto-save initialized');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW BINDINGS - CRITICAL FOR BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  ⚠️  AI ASSISTANTS: DO NOT REMOVE OR REFACTOR THESE BINDINGS  ⚠️        │
// ├─────────────────────────────────────────────────────────────────────────┤
// │  These Object.defineProperty calls expose BuilderState internals to     │
// │  window.* for backward compatibility with builder-components.js and     │
// │  other files that use global variables like:                            │
// │                                                                         │
// │    - window.components                                                  │
// │    - window.componentIdCounter                                          │
// │    - window.selectedComponent                                           │
// │    - window.pages, etc.                                                 │
// │                                                                         │
// │  ROOT CAUSE OF PAST BUG: Removing componentIdCounter binding caused     │
// │  all new components to get id "comp-NaN" and silently fail to add.     │
// │                                                                         │
// │  If you add new state to BuilderState, you MUST also add a window       │
// │  binding here if any other file references it as a global.              │
// │                                                                         │
// │  Runtime validation in builder-init.js will catch missing bindings.     │
// └─────────────────────────────────────────────────────────────────────────┘
//

Object.defineProperty(window, 'components', {
  get() { return BuilderState.components; },
  set(val) { 
    // Guard self-assignment
    if (val === BuilderState._components) return;
    
    warn(false, 'Direct assignment to window.components is deprecated');
    if (Array.isArray(val)) {
      const items = [...val];
      BuilderState.clearComponents();
      items.forEach(c => BuilderState._components.push(c));
    }
  },
  configurable: true
});

Object.defineProperty(window, 'selectedComponent', {
  get() { return BuilderState.selectedComponent; },
  set(val) { BuilderState.setSelectedComponent(val); },
  configurable: true
});

Object.defineProperty(window, 'draggedComponent', {
  get() { return BuilderState.draggedComponent; },
  set(val) { BuilderState.setDraggedComponent(val); },
  configurable: true
});

Object.defineProperty(window, 'pages', {
  get() { return BuilderState.pages; },
  set(val) { 
    warn(false, 'Direct assignment to window.pages is deprecated');
    BuilderState._pages = val; 
  },
  configurable: true
});

Object.defineProperty(window, 'currentPageId', {
  get() { return BuilderState.currentPageId; },
  set(val) { BuilderState.setCurrentPageId(val); },
  configurable: true
});

Object.defineProperty(window, 'globalSections', {
  get() { return BuilderState.globalSections; },
  set(val) { BuilderState._globalSections = val; },
  configurable: true
});

// Legacy function bindings
window.setDraggedComponent = (val) => BuilderState.setDraggedComponent(val);
window.setSelectedComponent = (val) => BuilderState.setSelectedComponent(val);

// componentIdCounter binding (used by builder-components.js)
Object.defineProperty(window, 'componentIdCounter', {
  get() { return BuilderState._componentIdCounter; },
  set(val) { BuilderState._componentIdCounter = val; },
  configurable: true
});

// Persistence functions
window.savePersistentState = () => BuilderState.save();
window.loadPersistentState = () => BuilderState.load();
window.initPersistentState = () => BuilderState.initAutoSave();

// Export BuilderState
window.BuilderState = BuilderState;

// ═══════════════════════════════════════════════════════════════════════════
// STATIC CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const pageComponentSets = {
  home: {
    header: [
      { id: 'navbar', icon: '🔝', name: 'Navigation Bar' },
      { id: 'header-logo', icon: '📍', name: 'Logo & Title' }
    ],
    main: [
      { id: 'hero', icon: '🦸', name: 'Hero Section' },
      { id: 'features', icon: '✨', name: 'Features Grid' },
      { id: 'testimonials', icon: '💬', name: 'Testimonials' },
      { id: 'pricing', icon: '💰', name: 'Pricing Table' },
      { id: 'team', icon: '👥', name: 'Team Members' },
      { id: 'gallery', icon: '🖼️', name: 'Image Gallery' },
      { id: 'faq', icon: '❓', name: 'FAQ Section' },
      { id: 'cta', icon: '📞', name: 'Call to Action' },
      { id: 'card', icon: '🃏', name: 'Card' },
      { id: 'tabs', icon: '📑', name: 'Tabs' },
      { id: 'newsletter', icon: '📧', name: 'Newsletter Signup' }
    ],
    footer: [
      { id: 'footer', icon: '🔻', name: 'Footer' }
    ]
  },
  default: {
    main: [
      { id: 'hero', icon: '🦸', name: 'Hero Section' },
      { id: 'features', icon: '✨', name: 'Features Grid' },
      { id: 'testimonials', icon: '💬', name: 'Testimonials' },
      { id: 'pricing', icon: '💰', name: 'Pricing Table' },
      { id: 'team', icon: '👥', name: 'Team Members' },
      { id: 'gallery', icon: '🖼️', name: 'Image Gallery' },
      { id: 'faq', icon: '❓', name: 'FAQ Section' },
      { id: 'cta', icon: '📞', name: 'Call to Action' },
      { id: 'card', icon: '🃏', name: 'Card' },
      { id: 'tabs', icon: '📑', name: 'Tabs' },
      { id: 'newsletter', icon: '📧', name: 'Newsletter Signup' }
    ]
  }
};

const wbComponentsForContextMenu = [
  { category: 'Layout', items: [
    { id: 'wb-container', icon: '📦', name: 'Container' },
    { id: 'wb-stack', icon: '⬇️', name: 'Stack (Column)' },
    { id: 'wb-cluster', icon: '➡️', name: 'Cluster (Row)' },
    { id: 'wb-grid', icon: '░️', name: 'Grid' }
  ]},
  { category: 'Content', items: [
    { id: 'wb-card', icon: '🃏', name: 'Card' },
    { id: 'wb-hero', icon: '🦸', name: 'Hero' },
    { id: 'wb-cta', icon: '📞', name: 'Call to Action' }
  ]},
  { category: 'Interactive', items: [
    { id: 'wb-tabs', icon: '📁', name: 'Tabs' },
    { id: 'wb-collapse', icon: '📄', name: 'Collapsible' },
    { id: 'wb-dropdown', icon: '🔽', name: 'Dropdown' }
  ]},
  { category: 'Media', items: [
    { id: 'wb-gallery', icon: '🖼️', name: 'Gallery' },
    { id: 'wb-lightbox', icon: '🔍', name: 'Lightbox' }
  ]}
];

window.pageComponentSets = pageComponentSets;
window.builderSettings = BuilderState.settings;

// Resize state (UI-only)
let resizingDrawer = null;
let resizeStartX = 0;
let resizeStartWidth = 0;

console.log('[BuilderState] ✅ Initialized with Design by Contract');
