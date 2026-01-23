/**
 * Builder Init - Initialization function
 * -----------------------------------------------------------------------------
 * Waits for views to load before initializing the builder.
 * -----------------------------------------------------------------------------
 */

function init() {
  console.log('[Builder] Init starting...');
  
  // Load settings and initialize drawers
  loadSettings();
  initDrawers();
  
  // Check if we're restoring from a refresh
  if (typeof loadPersistentState === 'function' && loadPersistentState()) {
    console.log('[Builder] Restored from persistent state');
    
    // Still need to set up event handlers
    setupCanvasEventHandlers();
    
    // Initialize persistent state auto-save
    if (typeof initPersistentState === 'function') {
      initPersistentState();
    }
    
    // Show page properties for current page
    const currentPage = getCurrentPage();
    showPageProperties(currentPage);
    updateActiveElement('page', currentPage?.name || 'Home');
    
    if (window.updateMainSectionName) {
      window.updateMainSectionName(currentPage?.name || 'Home');
    }
    if (window.activateMainSection) {
      window.activateMainSection();
    }
    
    console.log('[Builder] Init complete (from persistent state)');
    return;
  }
  
  // Render pages list and component library
  renderPagesList();
  renderComponentLibrary();
  
  // Load Home page's initial content
  const homePage = pages.find(p => p.id === 'home');
  if (homePage && homePage.main && homePage.main.length > 0) {
    homePage.main.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) {
        restoreComponent(compData, template);
      }
    });
  }
  
  updateComponentCount();

  
  // Show page properties for home page
  showPageProperties(homePage);
  
  // Set active element in status bar
  updateActiveElement('page', homePage?.name || 'Home');
  
  // Initialize canvas sections visibility
  updateCanvasSectionsVisibility(getCurrentPage());
  
  // Initialize main section label and border for current page
  if (window.updateMainSectionName) {
    window.updateMainSectionName(homePage?.name || 'Home');
  }
  if (window.activateMainSection) {
    window.activateMainSection();
  }
  
  // Setup canvas event handlers
  setupCanvasEventHandlers();
  
  // Initialize persistent state auto-save
  if (typeof initPersistentState === 'function') {
    initPersistentState();
  }
  
  console.log('[Builder] Init complete');
}

/**
 * Setup canvas event handlers (context menu, section focus)
 */
function setupCanvasEventHandlers() {
  // Add global right-click handler for canvas components
  const canvas = document.querySelector('.canvas');
  if (canvas) {
    canvas.addEventListener('contextmenu', (e) => {
      const componentEl = e.target.closest('.canvas-component');
      if (componentEl) {
        showComponentContextMenu(e, componentEl);
        return;
      }
      
      // Right-click on drop zone shows semantic elements menu
      const dropZone = e.target.closest('.canvas-drop-zone');
      if (dropZone && typeof showSemanticContextMenu === 'function') {
        showSemanticContextMenu(e, dropZone);
      }
    });
  }
  
  // Add section click handlers - click to focus section
  document.querySelectorAll('.canvas-section').forEach(section => {
    section.addEventListener('click', (e) => {
      // Don't focus section if clicking on a component
      if (e.target.closest('.canvas-component')) return;
      
      // Remove focus from all sections
      document.querySelectorAll('.canvas-section.focused').forEach(s => s.classList.remove('focused'));
      
      // Focus this section
      section.classList.add('focused');
      
      // Scroll section into view
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Update status
      const sectionName = section.classList.contains('header') ? 'Header' :
                          section.classList.contains('main') ? 'Main Content' : 'Footer';
      if (typeof updateStatus === 'function') {
        updateStatus(`Focused: ${sectionName}`);
      }
    });
  });
}

/**
 * Start initialization - waits for views if using dynamic loading
 */
function startBuilder() {
  // Check if views are already loaded (elements exist)
  const canvasExists = document.querySelector('.canvas');
  const pagesListExists = document.getElementById('pagesList');
  
  if (canvasExists && pagesListExists) {
    // Views already in DOM, initialize immediately
    init();
  } else {
    // Wait for views to load dynamically
    console.log('[Builder] Waiting for views to load...');
    document.addEventListener('builder:views-loaded', () => {
      // Small delay to ensure DOM is fully updated
      requestAnimationFrame(() => {
        init();
      });
    }, { once: true });
  }
}



  // Start the builder when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBuilder);
  } else {
    startBuilder();
  }
