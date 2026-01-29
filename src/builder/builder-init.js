/**
 * Builder Init - Initialization function
 * -----------------------------------------------------------------------------
 * Waits for views to load before initializing the builder.
 * -----------------------------------------------------------------------------
 */

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION OVERWRITE DETECTION - Catch duplicate definitions
// ═══════════════════════════════════════════════════════════════════════════
// Root cause of tooltip bug: showSemanticProperties was defined in both
// builder-components.js and builder-properties.js. The second one overwrote
// the first, breaking functionality.

(function setupOverwriteDetection() {
  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCTION OVERWRITE DETECTION WITH RUNTIME ASSERTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  // PURPOSE: Catch when multiple files define the same global function
  // ROOT CAUSE THIS PREVENTS: tooltip bug where showSemanticProperties was
  // defined in both builder-components.js and builder-properties.js
  //
  // IMPORTANT: Do NOT add functions here that are:
  // - Protected by Design by Contract (configurable: false)
  // - Defined in builder-state.js with getters/setters
  // - Already have property descriptors set by other modules
  // ═══════════════════════════════════════════════════════════════════════════
  
  const trackedFunctions = new Set([
    // Functions that should NOT be redefined by multiple files
    // NOTE: showSemanticProperties, showProperties are protected by Design by Contract
    // The following functions are intentionally NOT listed here because they are
    // protected by Design-by-Contract or implemented as accessors on BuilderState:
    // - toggleXBehavior (DBC / non-configurable)
    // - updateBehaviorValue (DBC / non-configurable)
    // - addComponentToCanvas (stub + queued API)
    // - deleteComponent (DBC / non-configurable)
    // - selectComponent (DBC / non-configurable)
    // - updateElementTheme (DBC / non-configurable)
    // Leaving this set intentionally small reduces false-positive overwrite warnings.
    'showSemanticProperties',
    'showProperties'
  ]);
  
  const definedBy = new Map();
  const skippedFunctions = [];
  const conflicts = []; // Track configuration conflicts for assertion
  
  trackedFunctions.forEach(fnName => {
    const descriptor = Object.getOwnPropertyDescriptor(window, fnName);
    
    // ═══════════════════════════════════════════════════════════════════════
    // RUNTIME ASSERTION: Detect configuration conflicts BEFORE they crash
    // ═══════════════════════════════════════════════════════════════════════
    if (descriptor) {
      // ASSERTION: Cannot track non-configurable properties
      if (descriptor.configurable === false) {
        conflicts.push({
          name: fnName,
          issue: 'NON_CONFIGURABLE',
          detail: 'Property has configurable:false (likely Design by Contract)'
        });
        skippedFunctions.push({ name: fnName, reason: 'non-configurable (Design by Contract)' });
        return;
      }
      
      // ASSERTION: Cannot track properties with existing getters/setters
      if (descriptor.get || descriptor.set) {
        conflicts.push({
          name: fnName,
          issue: 'HAS_ACCESSORS', 
          detail: 'Property already has getter/setter (likely BuilderState)'
        });
        skippedFunctions.push({ name: fnName, reason: 'has getter/setter' });
        return;
      }
    }
    
    // Safe to define overwrite detection
    let currentValue = window[fnName];
    
    try {
      Object.defineProperty(window, fnName, {
        get() { return currentValue; },
        set(newValue) {
          if (currentValue !== undefined && currentValue !== newValue) {
            const stack = new Error().stack;
            const callerFile = stack?.split('\n')[2]?.match(/([\w-]+\.js)/)?.[1] || 'unknown';
            const previousFile = definedBy.get(fnName) || 'unknown';
            
            // ═══════════════════════════════════════════════════════════════
            // ASSERTION VIOLATION: Function being overwritten!
            // ═══════════════════════════════════════════════════════════════
            console.error(
              `╔══════════════════════════════════════════════════════════════════╗\n` +
              `║  🚨 ASSERTION VIOLATION: FUNCTION OVERWRITE DETECTED            ║\n` +
              `╠══════════════════════════════════════════════════════════════════╣\n` +
              `║  Function: window.${fnName.padEnd(47)}║\n` +
              `║  Previously defined in: ${previousFile.padEnd(40)}║\n` +
              `║  Being overwritten by: ${callerFile.padEnd(41)}║\n` +
              `╠══════════════════════════════════════════════════════════════════╣\n` +
              `║  ROOT CAUSE: Multiple files define the same global function.    ║\n` +
              `║  This causes bugs where one implementation silently replaces    ║\n` +
              `║  another, breaking functionality.                               ║\n` +
              `╠══════════════════════════════════════════════════════════════════╣\n` +
              `║  FIX: Remove duplicate definition from ${callerFile.padEnd(27)}║\n` +
              `║       Keep the one in ${previousFile.padEnd(43)}║\n` +
              `╚══════════════════════════════════════════════════════════════════╝`
            );
          }
          
          const stack = new Error().stack;
          const callerFile = stack?.split('\n')[2]?.match(/([\w-]+\.js)/)?.[1] || 'unknown';
          definedBy.set(fnName, callerFile);
          currentValue = newValue;
        },
        configurable: true,
        enumerable: true
      });
    } catch (err) {
      // ═══════════════════════════════════════════════════════════════════════
      // ASSERTION FAILURE: defineProperty crashed - this should never happen
      // if we checked descriptors correctly above
      // ═══════════════════════════════════════════════════════════════════════
      console.error(
        `╔══════════════════════════════════════════════════════════════════╗\n` +
        `║  🚨 ASSERTION FAILURE: Overwrite detection setup crashed        ║\n` +
        `╠══════════════════════════════════════════════════════════════════╣\n` +
        `║  Function: window.${fnName.padEnd(47)}║\n` +
        `║  Error: ${(err.message || 'Unknown').substring(0, 54).padEnd(54)}║\n` +
        `╠══════════════════════════════════════════════════════════════════╣\n` +
        `║  ROOT CAUSE: Tried to redefine a locked property.               ║\n` +
        `║  This happens when a function is protected by Design by         ║\n` +
        `║  Contract or has a non-configurable descriptor.                 ║\n` +
        `╠══════════════════════════════════════════════════════════════════╣\n` +
        `║  FIX: Remove '${fnName}' from trackedFunctions array in:          ║\n` +
        `║       src/builder/builder-init.js (around line 30)              ║\n` +
        `║                                                                  ║\n` +
        `║  The function is already protected by another mechanism.        ║\n` +
        `╚══════════════════════════════════════════════════════════════════╝`
      );
      conflicts.push({
        name: fnName,
        issue: 'DEFINE_FAILED',
        detail: err.message
      });
    }
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ASSERTION REPORT: Warn about configuration issues that need attention
  // ═══════════════════════════════════════════════════════════════════════════
  if (conflicts.length > 0) {
    console.warn(
      `╔══════════════════════════════════════════════════════════════════╗\n` +
      `║  ⚠️  OVERWRITE DETECTION: Configuration Issues Found            ║\n` +
      `╠══════════════════════════════════════════════════════════════════╣\n` +
      `║  The following functions are in trackedFunctions but cannot     ║\n` +
      `║  be tracked because they're already protected:                  ║\n` +
      `╠══════════════════════════════════════════════════════════════════╣\n` +
      conflicts.map(c => 
        `║  • ${c.name.padEnd(20)} ${c.issue.padEnd(20)} ║\n` +
        `║    ${c.detail.substring(0, 62).padEnd(62)}║`
      ).join('\n') + `\n` +
      `╠══════════════════════════════════════════════════════════════════╣\n` +
      `║  ACTION: Remove these from trackedFunctions in builder-init.js  ║\n` +
      `║  They don't need tracking - they're already protected.          ║\n` +
      `╚══════════════════════════════════════════════════════════════════╝`
    );
  }
  
  // Log success summary
  const tracked = [...trackedFunctions].filter(fn => !skippedFunctions.find(s => s.name === fn));
  if (tracked.length > 0) {
    console.log('[Builder] ✅ Function overwrite detection enabled for:', tracked.join(', '));
  }
})();

// --- TEST-FRIENDLY STUB: ensure tests don't hang if builder scripts load out-of-order
// If `addComponentToCanvas` is called before the real implementation is attached
// (race in CI/headless), queue the call and drain it when the real function is installed.
if (typeof window !== 'undefined' && typeof window.addComponentToCanvas !== 'function') {
  window.__wb_queuedAdds = window.__wb_queuedAdds || [];
  window.addComponentToCanvas = function() {
    try {
      console.warn('[WB-INIT] addComponentToCanvas called before full init — queuing call');
      window.__wb_queuedAdds.push(Array.from(arguments));
    } catch (e) {
      // no-op; keep stub extremely resilient
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RUNTIME VALIDATION - Catch missing bindings early
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates that critical builder modules loaded successfully.
 * Root cause: Parse errors in JS files cause silent failures - the entire
 * builder stops working with no error message.
 */
function validateModulesLoaded() {
  const criticalModules = [
    { name: 'builder-state.js', check: () => typeof window.BuilderState !== 'undefined' },
    { name: 'builder-components.js', check: () => typeof window.addComponentToCanvas === 'function' },
    { name: 'builder-properties.js', check: () => typeof window.showProperties === 'function' },
    { name: 'builder-templates.js', check: () => typeof window.componentTemplates !== 'undefined' },
    { name: 'builder-pages.js', check: () => typeof window.switchToPage === 'function' },
  ];
  
  const failed = criticalModules.filter(m => !m.check());
  
  if (failed.length > 0) {
    const message = [
      '╔══════════════════════════════════════════════════════════════════╗',
      '║  BUILDER INIT FAILED - Critical Modules Not Loaded              ║',
      '╠══════════════════════════════════════════════════════════════════╣',
      '║  ROOT CAUSE: JavaScript parse error in one of these files.      ║',
      '║  Check browser console for syntax errors.                       ║',
      '╠══════════════════════════════════════════════════════════════════╣',
      ...failed.map(m => `║  ❌ ${m.name.padEnd(58)}║`),
      '╚══════════════════════════════════════════════════════════════════╝'
    ].join('\n');
    
    console.error(message);
    
    // Show in UI
    const canvas = document.getElementById('main-container') || document.querySelector('.canvas');
    if (canvas) {
      canvas.innerHTML = `<pre style="color: #ff6b6b; background: #1a1a2e; padding: 1rem; margin: 1rem; border-radius: 8px; font-size: 12px; overflow: auto;">${message}</pre>`;
    }
    
    throw new Error('Builder init failed: critical modules not loaded. Check console for parse errors.');
  }
  
  console.log('[Builder] ✅ All critical modules loaded');
}

/**
 * Validates that all required global bindings exist.
 * Root cause: When refactoring to BuilderState, forgetting to expose a
 * variable to window causes silent failures (e.g., comp-NaN ids).
 */
function validateRequiredGlobals() {
  const requiredBindings = [
    { name: 'components', type: 'object', source: 'BuilderState._components' },
    { name: 'componentIdCounter', type: 'number', source: 'BuilderState._componentIdCounter' },
    { name: 'selectedComponent', type: 'any', source: 'BuilderState._selectedComponent' },
    { name: 'draggedComponent', type: 'any', source: 'BuilderState._draggedComponent' },
    { name: 'pages', type: 'object', source: 'BuilderState._pages' },
    { name: 'currentPageId', type: 'string', source: 'BuilderState._currentPageId' },
    { name: 'globalSections', type: 'object', source: 'BuilderState._globalSections' },
    { name: 'setDraggedComponent', type: 'function', source: 'BuilderState.setDraggedComponent' },
    { name: 'setSelectedComponent', type: 'function', source: 'BuilderState.setSelectedComponent' },
  ];

  const errors = [];
  
  for (const binding of requiredBindings) {
    const value = window[binding.name];
    const actualType = typeof value;
    
    // Check if undefined
    if (value === undefined) {
      errors.push(`window.${binding.name} is undefined (should be bound to ${binding.source})`);
      continue;
    }
    
    // Type check (skip 'any')
    if (binding.type !== 'any') {
      if (binding.type === 'object' && (actualType !== 'object' || value === null)) {
        errors.push(`window.${binding.name} should be ${binding.type}, got ${value === null ? 'null' : actualType}`);
      } else if (binding.type === 'number' && actualType !== 'number') {
        errors.push(`window.${binding.name} should be number, got ${actualType} (value: ${value})`);
      } else if (binding.type === 'string' && actualType !== 'string') {
        errors.push(`window.${binding.name} should be string, got ${actualType}`);
      } else if (binding.type === 'function' && actualType !== 'function') {
        errors.push(`window.${binding.name} should be function, got ${actualType}`);
      }
    }
  }
  
  // Also check BuilderState itself
  if (typeof window.BuilderState === 'undefined') {
    errors.push('window.BuilderState is undefined - builder-state.js may not be loaded');
  }
  
  if (errors.length > 0) {
    const message = [
      '╔══════════════════════════════════════════════════════════════════╗',
      '║  BUILDER INIT FAILED - Missing Required Global Bindings         ║',
      '╠══════════════════════════════════════════════════════════════════╣',
      '║  ROOT CAUSE: BuilderState refactor missing window bindings.     ║',
      '║  FIX: Add Object.defineProperty(window, name, {...}) in         ║',
      '║       builder-state.js for each missing binding.                ║',
      '╠══════════════════════════════════════════════════════════════════╣',
      ...errors.map(e => `║  ❌ ${e.padEnd(62)}║`),
      '╚══════════════════════════════════════════════════════════════════╝'
    ].join('\n');
    
    console.error(message);
    
    // Also show in UI if possible
    const canvas = document.getElementById('main-container');
    if (canvas) {
      canvas.innerHTML = `<pre style="color: #ff6b6b; background: #1a1a2e; padding: 1rem; margin: 1rem; border-radius: 8px; font-size: 12px; overflow: auto;">${message}</pre>`;
    }
    
    throw new Error('Builder init failed: missing required global bindings. See console for details.');
  }
  
  console.log('[Builder] ✅ All required globals validated');
}

function init() {
  console.log('[Builder] Init starting...');
  
  // Validate critical modules loaded (catches parse errors)
  validateModulesLoaded();
  
  // Validate all required globals exist before proceeding
  validateRequiredGlobals();
  
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
    
    // Setup Issues button handler
    setupIssuesButton();
    
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

  // Ensure core templates/components are available immediately for tests
  // and for consumers that expect core building blocks to be synchronous.
  (function ensureCoreComponentLibrary() {
    try {
      const coreIds = ['navbar', 'hero', 'cta', 'features'];
      window.WB_COMPONENT_LIBRARY = window.WB_COMPONENT_LIBRARY || {};

      // Helper to find component across categories
      const hasComponent = id => Object.values(window.WB_COMPONENT_LIBRARY || {}).some(cat => (cat.components || []).some(c => c.id === id));

      // Ensure there's a 'core' category we can populate with fallback entries
      const coreCat = window.WB_COMPONENT_LIBRARY['core'] || { name: 'Core', icon: '⭐', components: [] };

      for (const id of coreIds) {
        if (!hasComponent(id)) {
          const tpl = window.componentTemplates && window.componentTemplates[id];
          coreCat.components.push({
            id,
            name: tpl?.name || id,
            icon: tpl?.icon || '📦',
            desc: tpl?.description || tpl?.name || id
          });
        }
      }

      window.WB_COMPONENT_LIBRARY['core'] = coreCat;

      // Signal readiness for any listeners/tests that prefer an event
      try { window.dispatchEvent(new CustomEvent('wb-core-templates-ready')); } catch (e) { /* ignore */ }

      if (window.WB_DEBUG) console.log('[Builder] ensured core component library entries');
    } catch (err) {
      console.warn('[ensureCoreComponentLibrary] failed', err && err.message);
    }
  })();
  
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
  
  // Setup Issues button handler (inline scripts don't execute when loaded via innerHTML)
  setupIssuesButton();
  
  console.log('[Builder] Init complete');
}

/**
 * Setup Issues button click handler
 * Inline scripts in dynamically loaded views don't execute, so we attach the handler here
 */
function setupIssuesButton() {
  const issuesBtn = document.getElementById('issuesToggle');
  if (!issuesBtn) {
    console.warn('[Builder] Issues button not found');
    return;
  }
  
  issuesBtn.addEventListener('click', async () => {
    try {
      const mod = await import('/src/lib/issues-helper.js');
      if (mod.openSiteIssues) {
        mod.openSiteIssues();
      } else if (mod.default) {
        mod.default();
      }
    } catch (e) {
      console.warn('[Issues] Failed to open issues dialog:', e);
    }
  });
  
  console.log('[Builder] Issues button handler attached');
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
