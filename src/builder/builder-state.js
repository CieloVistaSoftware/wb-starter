/**
 * Builder State - Global state variables
 */

// Storage key
const STORAGE_KEY = 'wb-builder-state';

// Component state
let components = [];
let selectedComponent = null;
let draggedComponent = null;
let componentIdCounter = 0;

// Page state
let pages = [{ id: 'home', name: 'Home', slug: 'index.html', main: [
  { id: 'comp-home-hero', type: 'hero', section: 'main', html: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 4rem 2rem; text-align: center; color: white; border-radius: 8px;"><h2 style="font-size: 2.5rem; margin: 0 0 1rem 0;">Welcome to Your Site</h2><p style="font-size: 1.1rem; margin: 0;">Your value proposition goes here</p></div>', data: {} }
], showHeader: true, showFooter: true }];
let currentPageId = 'home';

// Global sections (shared across all pages)
let globalSections = {
  header: [],
  footer: []
};

/**
 * Save state to localStorage
 */
function savePersistentState() {
  try {
    // Collect component data (without DOM element references)
    const componentData = components.map(c => ({
      id: c.id,
      type: c.type,
      section: c.section,
      html: c.html,
      data: c.data
    }));
    
    const state = {
      components: componentData,
      pages: pages,
      currentPageId: currentPageId,
      globalSections: globalSections,
      componentIdCounter: componentIdCounter
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('[Builder] State saved:', componentData.length, 'components');
  } catch (e) {
    console.warn('[Builder] Failed to save state:', e);
  }
}

/**
 * Load state from localStorage
 * Returns true if state was loaded, false otherwise
 */
function loadPersistentState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    
    const state = JSON.parse(saved);
    
    // Restore state variables
    if (state.pages) pages = state.pages;
    if (state.currentPageId) currentPageId = state.currentPageId;
    if (state.globalSections) globalSections = state.globalSections;
    if (state.componentIdCounter) componentIdCounter = state.componentIdCounter;
    
    // Clear and restore components
    components = [];
    
    // Restore components to DOM
    if (state.components && state.components.length > 0) {
      state.components.forEach(compData => {
        const template = componentTemplates[compData.type];
        if (template) {
          restoreComponent(compData, template);
        } else if (compData.type?.startsWith('semantic-')) {
          // Handle semantic elements
          const tag = compData.type.replace('semantic-', '');
          const pseudoTemplate = {
            name: compData.data?.name || tag,
            icon: compData.data?.icon || '🏷️',
            html: compData.html,
            isSemantic: true,
            tag: tag
          };
          restoreComponent(compData, pseudoTemplate);
        }
      });
    }
    
    // Update UI
    renderPagesList();
    renderComponentLibrary();
    updateComponentCount();
    
    console.log('[Builder] State loaded:', components.length, 'components');
    return true;
  } catch (e) {
    console.warn('[Builder] Failed to load state:', e);
    return false;
  }
}

/**
 * Initialize auto-save on state changes
 */
function initPersistentState() {
  // Save state periodically (every 5 seconds if changes occurred)
  let saveTimeout = null;
  
  window.scheduleSave = function() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      savePersistentState();
      saveTimeout = null;
    }, 1000); // Debounce: save 1 second after last change
  };
  
  // Save before page unload
  window.addEventListener('beforeunload', () => {
    savePersistentState();
  });
  
  console.log('[Builder] Auto-save initialized');
}

// Expose persistence functions
window.savePersistentState = savePersistentState;
window.loadPersistentState = loadPersistentState;
window.initPersistentState = initPersistentState;

// Expose state on window for tests and external access
window.components = components;
window.pages = pages;
window.globalSections = globalSections;
window.currentPageId = currentPageId;

// Builder settings
let builderSettings = {
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
};

// Page component sets - defines which components are available per page type
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
      { id: 'newsletter', icon: '📧', name: 'Newsletter Signup' }
    ]
  }
};

// WB Components for context menu
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

// Resize state
let resizingDrawer = null;
let resizeStartX = 0;
let resizeStartWidth = 0;

// Expose state to window for tests and external access
window.pageComponentSets = pageComponentSets;
window.builderSettings = builderSettings;
