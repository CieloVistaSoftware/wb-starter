/**
 * Builder App - Main Orchestrator
 * -----------------------------------------------------------------------------
 * Loads all view panels and initializes the builder application.
 * Uses HTML imports via fetch for modular view management.
 * -----------------------------------------------------------------------------
 */

// ─────────────────────────────────────────────────────────────────────────────
// View Loader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load an HTML view into a container
 * @param {string} containerId - ID of the container element
 * @param {string} viewPath - Path to the HTML view file
 * @returns {Promise<HTMLElement>} - The container element
 */
async function loadView(containerId, viewPath) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[Builder] Container not found: ${containerId}`);
    return null;
  }

  try {
    const response = await fetch(viewPath);
    if (!response.ok) {
      throw new Error(`Failed to load ${viewPath}: ${response.status}`);
    }
    const html = await response.text();
    container.innerHTML = html;
    console.log(`[Builder] Loaded view: ${viewPath}`);
    return container;
  } catch (error) {
    console.error(`[Builder] Error loading view ${viewPath}:`, error);
    container.innerHTML = `<div class="view-error">Failed to load view</div>`;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder Initialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize the builder application
 */
async function initBuilderApp() {
  console.log('[Builder] Initializing...');

  // Load all views in parallel
  const viewPromises = [
    loadView('top-bar-content', 'src/builder/views/top-bar.html'),
    loadView('components-panel-content', 'src/builder/views/components-panel.html'),
    loadView('canvas-content', 'src/builder/views/canvas-view.html'),
    loadView('properties-panel-content', 'src/builder/views/properties-panel.html'),
    loadView('status-bar-content', 'src/builder/views/status-bar.html')
  ];

  await Promise.all(viewPromises);
  console.log('[Builder] All views loaded');

  // Dispatch event for other scripts to know views are ready
  document.dispatchEvent(new CustomEvent('builder:views-loaded'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-initialize when DOM is ready
// ─────────────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBuilderApp);
} else {
  initBuilderApp();
}

// Export for module usage
export { loadView, initBuilderApp };
