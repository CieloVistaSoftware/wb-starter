/**
 * Builder Export - Export, import, and Persistent State functions
 */

const PERSISTENT_STATE_KEY = 'wb-builder-persistent-state';

// Debounce timer for save operations
let saveDebounceTimer = null;
const SAVE_DEBOUNCE_MS = 2000; // 2 seconds

// ============================================================================
// PERSISTENT STATE - Auto-save work, never lose progress
// ============================================================================

/**
 * Save current builder state to localStorage (debounced)
 * Called automatically on changes and before page unload
 */
function savePersistentState(immediate = false) {
  // Clear existing timer
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  
  // If immediate (e.g., beforeunload), save now
  if (immediate) {
    _doSavePersistentState();
    return;
  }
  
  // Otherwise debounce
  saveDebounceTimer = setTimeout(() => {
    _doSavePersistentState();
    saveDebounceTimer = null;
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Internal: Actually perform the save
 */
function _doSavePersistentState() {
  // Save current page's main content to pages array
  const currentPage = getCurrentPage();
  if (currentPage) {
    currentPage.main = components
      .filter(c => c.section === 'main')
      .map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }));
  }
  
  // Build state object
  const state = {
    version: '1.0',
    savedAt: Date.now(),
    componentIdCounter: componentIdCounter,
    currentPageId: currentPageId,
    pages: pages,
    global: {
      header: components
        .filter(c => c.section === 'header')
        .map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data })),
      footer: components
        .filter(c => c.section === 'footer')
        .map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }))
    }
  };
  
  // Save to localStorage
  try {
    localStorage.setItem(PERSISTENT_STATE_KEY, JSON.stringify(state));
    console.log('[Builder] State saved:', components.length, 'components');
  } catch (err) {
    console.error('[Builder] Failed to save state:', err);
  }
}

/**
 * Check for and restore persistent state on page load
 * @returns {boolean} true if state was restored
 */
function loadPersistentState() {
  const savedState = localStorage.getItem(PERSISTENT_STATE_KEY);
  if (!savedState) return false;
  
  try {
    const state = JSON.parse(savedState);
    
    // Validate state has content
    const hasContent = (state.global?.header?.length > 0) ||
                       (state.global?.footer?.length > 0) ||
                       state.pages?.some(p => p.main?.length > 0);
    
    if (!hasContent) {
      console.log('[Builder] Saved state is empty, starting fresh');
      return false;
    }
    
    console.log('[Builder] Restoring persistent state...');
    restorePersistentState(state);
    return true;
    
  } catch (err) {
    console.error('[Builder] Error loading persistent state:', err);
    return false;
  }
}

/**
 * Restore builder state from saved data
 */
function restorePersistentState(state) {
  // Clear existing components from DOM only (not localStorage)
  clearBuilderDOM();
  
  // Restore counter and pages
  componentIdCounter = state.componentIdCounter || 0;
  pages = state.pages || [{ id: 'home', name: 'Home', slug: 'index.html', main: [] }];
  currentPageId = state.currentPageId || 'home';
  
  // Restore header components
  if (state.global?.header) {
    state.global.header.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) {
        restoreComponent({ ...compData, section: 'header' }, template);
      } else {
        restoreGenericComponent({ ...compData, section: 'header' });
      }
    });
  }
  
  // Restore main components for current page
  const currentPage = pages.find(p => p.id === currentPageId);
  if (currentPage?.main) {
    currentPage.main.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) {
        restoreComponent(compData, template);
      } else {
        restoreGenericComponent(compData);
      }
    });
  }
  
  // Restore footer components
  if (state.global?.footer) {
    state.global.footer.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) {
        restoreComponent({ ...compData, section: 'footer' }, template);
      } else {
        restoreGenericComponent({ ...compData, section: 'footer' });
      }
    });
  }
  
  // Update UI
  renderPagesList();
  renderComponentLibrary();
  updateComponentCount();
  updateCanvasSectionsVisibility(getCurrentPage());
  
  const savedDate = new Date(state.savedAt).toLocaleTimeString();
  console.log('[Builder] State restored:', components.length, 'components,', pages.length, 'pages');
}

/**
 * Clear builder DOM without clearing localStorage
 */
function clearBuilderDOM() {
  ['header', 'main', 'footer'].forEach(section => {
    const container = document.getElementById(`${section}-container`);
    if (!container) return;
    const dropZone = container.querySelector('.canvas-drop-zone');
    container.querySelectorAll('.canvas-component').forEach(el => el.remove());
    if (dropZone) dropZone.classList.remove('has-items');
  });
  
  components = [];
  selectedComponent = null;
  
  document.getElementById('propertiesPanel').innerHTML = 
    `<div class="properties-empty">Click a component to edit its properties</div>`;
}

/**
 * Reset builder - clear everything including persistent state
 */
function resetBuilder() {
  if (!confirm('⚠️ Reset Builder?\n\nThis will clear ALL your work and cannot be undone.\n\nAre you sure?')) {
    return;
  }
  
  // Clear localStorage
  localStorage.removeItem(PERSISTENT_STATE_KEY);
  
  // Clear DOM and state
  clearBuilderDOM();
  
  // Reset to defaults
  pages = [{ id: 'home', name: 'Home', slug: 'index.html', main: [], showHeader: true, showFooter: true }];
  currentPageId = 'home';
  componentIdCounter = 0;
  
  // Update UI
  renderPagesList();
  renderComponentLibrary();
  updateComponentCount();
  updateCanvasSectionsVisibility(getCurrentPage());
  
  console.log('[Builder] Reset complete');
}

/**
 * Refresh builder - reload page to pick up framework changes
 */
function refreshBuilder() {
  // Save state first
  savePersistentState();
  
  // Reload the page
  setTimeout(() => window.location.reload(), 100);
}

/**
 * Restore a component without a template (e.g., semantic elements)
 */
function restoreGenericComponent(compData) {
  const section = compData.section || 'main';
  const container = document.getElementById(`${section}-container`);
  if (!container) return;
  
  const dropZone = container.querySelector('.canvas-drop-zone');
  
  // Create component wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'canvas-component';
  wrapper.id = compData.id;
  wrapper.tabIndex = 0;
  
  const name = compData.data?.name || compData.type || 'Element';
  const icon = compData.data?.icon || '🏷️';
  
  wrapper.innerHTML = `
    <div class="component-overlay">
      <span class="component-label">${icon} ${name}</span>
      <button class="component-delete-btn" onclick="deleteComponent('${compData.id}')">Delete</button>
    </div>
    <div class="component-content" contenteditable="true">${compData.html || ''}</div>
  `;
  
  // Insert before drop zone
  container.insertBefore(wrapper, dropZone);
  dropZone.classList.add('has-items');
  
  // Track component
  components.push({
    id: compData.id,
    type: compData.type,
    section: section,
    html: compData.html,
    data: compData.data || {},
    element: wrapper
  });
  
  // Setup click handler
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    selectComponent(compData.id);
  });
}

/**
 * Setup auto-save on state changes
 */
function initPersistentState() {
  // Save before page unload (immediate, no debounce)
  window.addEventListener('beforeunload', () => {
    savePersistentState(true);
  });
  
  // Auto-save periodically (every 10 seconds if there are components)
  setInterval(() => {
    if (components.length > 0) {
      savePersistentState();
    }
  }, 10000);
  
  console.log('[Builder] Persistent state initialized');
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Extract clean HTML from canvas section (removes builder UI wrappers)
 * @param {string} section - 'header', 'main', or 'footer'
 * @returns {string} Clean HTML content
 */
function extractCanvasHTML(section) {
  const container = document.getElementById(`${section}-container`);
  if (!container) return '';
  
  let html = '';
  
  // Get all canvas-component wrappers
  container.querySelectorAll(':scope > .canvas-component').forEach(wrapper => {
    html += extractComponentHTML(wrapper);
  });
  
  return html;
}

/**
 * Recursively extract clean HTML from a canvas-component wrapper
 * @param {HTMLElement} wrapper - The .canvas-component wrapper element
 * @returns {string} Clean HTML without builder UI
 */
function extractComponentHTML(wrapper) {
  const content = wrapper.querySelector(':scope > .component-content');
  if (!content) return '';
  
  // Clone the content to avoid modifying the original
  const clone = content.cloneNode(true);
  
  // Remove builder UI elements first
  clone.querySelectorAll('.component-overlay, .component-delete-btn, .component-html-view').forEach(el => el.remove());
  
  // Process nested canvas-component children recursively
  clone.querySelectorAll('.canvas-component').forEach(nestedWrapper => {
    const nestedHTML = extractComponentHTML(nestedWrapper);
    const placeholder = document.createElement('div');
    placeholder.innerHTML = nestedHTML;
    // Replace the wrapper with its clean content
    nestedWrapper.replaceWith(...placeholder.childNodes);
  });
  
  return clone.innerHTML;
}

// Preview site
function previewSite() {
  // Extract HTML directly from DOM canvas (works with both old components and EditorToolbar elements)
  const globalHeaderHTML = extractCanvasHTML('header');
  const globalFooterHTML = extractCanvasHTML('footer');
  const mainHTML = extractCanvasHTML('main');
  
  // Debug logging
  console.log('[Preview] Header HTML length:', globalHeaderHTML.length);
  console.log('[Preview] Footer HTML length:', globalFooterHTML.length);
  console.log('[Preview] Main HTML length:', mainHTML.length);
  if (globalFooterHTML) {
    console.log('[Preview] Footer HTML preview:', globalFooterHTML.substring(0, 200));
  } else {
    console.warn('[Preview] Footer HTML is EMPTY - checking footer-container...');
    const footerContainer = document.getElementById('footer-container');
    console.log('[Preview] Footer container exists:', !!footerContainer);
    console.log('[Preview] Footer components:', components.filter(c => c.section === 'footer').length);
  }
  
  // Build page content - include ALL pages with their content
  const pageContents = pages.map(p => {
    const isCurrentPage = p.id === currentPageId;
    // For current page, use live DOM content; for others, use stored HTML
    const content = isCurrentPage ? mainHTML : (p.main || []).map(c => c.html || '').join('');
    return `<div class="page-content" id="page-${p.id}">${content || '<p style="padding: 1rem; color: #888;">No content</p>'}</div>`;
  }).join('');

  // Store preview data in localStorage for preview.html to read
  // NOTE: Data is kept for refresh button functionality
  const previewData = {
    theme: document.documentElement.dataset.theme || 'dark',
    header: globalHeaderHTML,
    pages: pageContents,
    footer: globalFooterHTML,
    currentPage: currentPageId,
    timestamp: Date.now()
  };
  localStorage.setItem('wb-builder-preview', JSON.stringify(previewData));
  
  console.log('[Preview] Data saved to localStorage, opening preview window...');
  
  // Open preview page
  window.open('preview.html', 'preview', 'width=1200,height=800');
}

// Show save menu
function showSaveMenu(event) {
  event.stopPropagation();
  document.getElementById('saveMenu')?.remove();
  
  const menu = document.createElement('div');
  menu.id = 'saveMenu';
  menu.style.cssText = `position: fixed; top: ${event.target.getBoundingClientRect().bottom + 5}px; right: 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; min-width: 220px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000;`;
  
  menu.innerHTML = `
    <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Save Project</div>
    <button onclick="exportAsJSON()" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; text-align: left;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">
      <span style="font-size: 1.2rem;">💾</span>
      <div><div style="font-weight: 600;">Project File (.json)</div><div style="font-size: 0.75rem; color: var(--text-secondary);">Reopen in builder later</div></div>
    </button>
    <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-top: 0.5rem; border-top: 1px solid var(--border-color);">Export Website</div>
    <button onclick="exportAsSPA()" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; text-align: left;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">
      <span style="font-size: 1.2rem;">📄</span>
      <div><div style="font-weight: 600;">Single Page (SPA)</div><div style="font-size: 0.75rem; color: var(--text-secondary);">One HTML file</div></div>
    </button>
    <button onclick="exportAsMPA()" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; text-align: left;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">
      <span style="font-size: 1.2rem;">📁</span>
      <div><div style="font-weight: 600;">Multi-Page (MPA)</div><div style="font-size: 0.75rem; color: var(--text-secondary);">Separate HTML files</div></div>
    </button>
  `;
  
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', closeMenu); }
    });
  }, 10);
}

// Export as SPA
function exportAsSPA() {
  document.getElementById('saveMenu')?.remove();
  
  // Extract HTML directly from DOM canvas
  const headerHTML = extractCanvasHTML('header');
  const footerHTML = extractCanvasHTML('footer');
  const mainHTML = extractCanvasHTML('main');
  
  const pageContents = pages.map(p => {
    const isCurrentPage = p.id === currentPageId;
    const content = isCurrentPage ? mainHTML : (p.main || []).map(c => c.html || '').join('');
    return `<section class="page" page="${p.id}">${content || '<p>Empty page</p>'}</section>`;
  }).join('\n');
  
  const navLinks = pages.map(p => `<a href="#${p.id}" class="nav-link" page="${p.id}">${p.name}</a>`).join('\n');
  
  const spaHTML = `<!DOCTYPE html>
<html lang="en" theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg-color: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #334155; --text-primary: #f1f5f9; --text-secondary: #94a3b8; --border-color: #334155; --primary: #6366f1; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: var(--bg-color); color: var(--text-primary); min-height: 100vh; display: flex; flex-direction: column; }
    header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); }
    main { flex: 1; max-width: 1200px; margin: 0 auto; padding: 2rem; width: 100%; }
    footer { background: var(--bg-secondary); border-top: 1px solid var(--border-color); margin-top: auto; }
    .site-nav { display: flex; gap: 1rem; padding: 1rem 2rem; align-items: center; }
    .site-nav .brand { font-weight: 700; font-size: 1.2rem; margin-right: auto; }
    .nav-link { color: var(--text-secondary); text-decoration: none; padding: 0.5rem 1rem; border-radius: 6px; }
    .nav-link:hover, .nav-link.active { color: var(--text-primary); background: var(--bg-tertiary); }
    .page { display: none; }
    .page.active { display: block; }
    /* Element Spacing */
    .page > * { margin-bottom: 4rem; }
    .page > *:last-child { margin-bottom: 0; }
    section, article, aside { margin-bottom: 2rem; }
    section:last-child, article:last-child { margin-bottom: 0; }
    p, h1, h2, h3, h4, ul, ol, blockquote { margin-bottom: 1rem; }
    p:last-child, h1:last-child, h2:last-child, h3:last-child { margin-bottom: 0; }
    figure, img, video { margin-bottom: 1.5rem; }
    figure:last-child, img:last-child { margin-bottom: 0; }
  </style>
</head>
<body>
  <header>${headerHTML || `<nav class="site-nav"><span class="brand">My Site</span>${navLinks}</nav>`}</header>
  <main>${pageContents}</main>
  <footer>${footerHTML || '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">© 2026 My Website</div>'}</footer>
  <script>
    function router() {
      const hash = window.location.hash.slice(1) || 'home';
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      const page = document.querySelector('.page[page="' + hash + '"]');
      const link = document.querySelector('.nav-link[page="' + hash + '"]');
      if (page) page.classList.add('active');
      if (link) link.classList.add('active');
      if (!page) { const home = document.querySelector('.page[page="home"]'); if (home) home.classList.add('active'); }
    }
    window.addEventListener('hashchange', router);
    window.addEventListener('DOMContentLoaded', router);
  </script>
</body>
</html>`;
  
  downloadFile('website-spa.html', spaHTML);
}

// Export as MPA
function exportAsMPA() {
  document.getElementById('saveMenu')?.remove();
  
  // Extract HTML directly from DOM canvas
  const headerHTML = extractCanvasHTML('header');
  const footerHTML = extractCanvasHTML('footer');
  const mainHTML = extractCanvasHTML('main');
  
  const files = pages.map(p => {
    const isCurrentPage = p.id === currentPageId;
    const pageMainHTML = isCurrentPage ? mainHTML : (p.main || []).map(c => c.html || '').join('');
    const navLinks = pages.map(pg => `<a href="${pg.slug}" class="nav-link ${pg.id === p.id ? 'active' : ''}">${pg.name}</a>`).join('\n');
    
    const html = `<!DOCTYPE html>
<html lang="en" theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.name} - My Website</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg-color: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #334155; --text-primary: #f1f5f9; --text-secondary: #94a3b8; --border-color: #334155; --primary: #6366f1; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: var(--bg-color); color: var(--text-primary); min-height: 100vh; display: flex; flex-direction: column; }
    header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); }
    main { flex: 1; max-width: 1200px; margin: 0 auto; padding: 2rem; width: 100%; }
    footer { background: var(--bg-secondary); border-top: 1px solid var(--border-color); margin-top: auto; }
    .site-nav { display: flex; gap: 1rem; padding: 1rem 2rem; align-items: center; }
    .site-nav .brand { font-weight: 700; font-size: 1.2rem; margin-right: auto; }
    .nav-link { color: var(--text-secondary); text-decoration: none; padding: 0.5rem 1rem; border-radius: 6px; }
    .nav-link:hover, .nav-link.active { color: var(--text-primary); background: var(--bg-tertiary); }
    /* Element Spacing */
    main > * { margin-bottom: 4rem; }
    main > *:last-child { margin-bottom: 0; }
    section, article, aside { margin-bottom: 2rem; }
    section:last-child, article:last-child { margin-bottom: 0; }
    p, h1, h2, h3, h4, ul, ol, blockquote { margin-bottom: 1rem; }
    p:last-child, h1:last-child, h2:last-child, h3:last-child { margin-bottom: 0; }
    figure, img, video { margin-bottom: 1.5rem; }
    figure:last-child, img:last-child { margin-bottom: 0; }
  </style>
</head>
<body>
  <header>${headerHTML || `<nav class="site-nav"><span class="brand">My Site</span>${navLinks}</nav>`}</header>
  <main>${pageMainHTML || '<p>Empty page</p>'}</main>
  <footer>${footerHTML || '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">© 2026 My Website</div>'}</footer>
</body>
</html>`;
    
    return { name: p.slug, content: html };
  });
  
  let delay = 0;
  files.forEach(f => { setTimeout(() => downloadFile(f.name, f.content), delay); delay += 500; });
}

// Export as JSON
function exportAsJSON() {
  document.getElementById('saveMenu')?.remove();
  
  const currentPage = getCurrentPage();
  if (currentPage) {
    currentPage.main = components.filter(c => c.section === 'main').map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }));
  }
  
  const projectData = {
    version: '1.0',
    title: 'My Website',
    created: new Date().toISOString(),
    global: {
      header: components.filter(c => c.section === 'header').map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data })),
      footer: components.filter(c => c.section === 'footer').map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }))
    },
    pages: pages
  };
  
  downloadFile('website-project.json', JSON.stringify(projectData, null, 2));
}

// Download file helper
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Show open menu
function showOpenMenu(event) {
  event.stopPropagation();
  document.getElementById('openMenu')?.remove();
  
  const btn = event.target.closest('.btn');
  const rect = btn.getBoundingClientRect();
  
  const menu = document.createElement('div');
  menu.id = 'openMenu';
  menu.className = 'dropdown-menu';
  menu.style.cssText = `position: fixed; top: ${rect.bottom + 5}px; left: ${rect.left}px; z-index: 10000; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; min-width: 220px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);`;
  
  menu.innerHTML = `
    <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); font-weight: 700;">Open Project</div>
    <button onclick="triggerJsonUpload()" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; text-align: left;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">📂 Open Project File (.json)</button>
    <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; border-top: 1px solid var(--border-color); margin-top: 0.5rem;">Load From Site</div>
    <button onclick="loadSiteJson()" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; text-align: left;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">⚙️ Load config/site.json</button>
    <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; border-top: 1px solid var(--border-color); margin-top: 0.5rem;">Templates</div>
    <button onclick="loadPreset('saas')" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; text-align: left;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">🚀 SaaS Website</button>
    <button onclick="loadPreset('portfolio')" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; text-align: left;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">🎨 Portfolio</button>
  `;
  
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('click', function closeMenu() {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    });
  }, 10);
}

// Load site.json from config folder
async function loadSiteJson() {
  document.getElementById('openMenu')?.remove();
  
  try {
    const response = await fetch('config/site.json');
    if (!response.ok) throw new Error(`site.json not found (${response.status})`);
    const json = await response.json();
    loadSiteFromJson(json, 'config/site.json');
  } catch (err) {
    alert('Error loading site.json: ' + err.message);
  }
}

function triggerJsonUpload() {
  document.getElementById('openMenu')?.remove();
  document.getElementById('jsonFileInput').click();
}

function handleJsonFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      loadSiteFromJson(json, file.name);
    } catch (err) {
      alert('Error parsing JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function loadPreset(presetName) {
  document.getElementById('openMenu')?.remove();
  
  try {
    const response = await fetch(`templates/presets/${presetName}/site.json`);
    if (!response.ok) throw new Error(`Preset not found (${response.status})`);
    const json = await response.json();
    loadSiteFromJson(json, `${presetName} preset`);
  } catch (err) {
    alert('Error loading preset: ' + err.message);
  }
}

function loadSiteFromJson(json, sourceName) {
  if (components.length > 0 || pages.length > 1) {
    if (!confirm(`This will replace your current site with "${sourceName}".\n\nContinue?`)) return;
  }
  
  clearBuilder();
  
  if (json.version && json.pages) {
    // Project format (exported from builder)
    loadProjectFormat(json);
  } else if (json.header || json.branding || json.navigationMenu) {
    // Config format (site.json - new or old format)
    loadConfigFormat(json);
  } else {
    alert('Unknown JSON format');
    return;
  }
}

function clearBuilder() {
  // Clear persistent state when loading new site
  localStorage.removeItem(PERSISTENT_STATE_KEY);
  
  ['header', 'main', 'footer'].forEach(section => {
    const container = document.getElementById(`${section}-container`);
    if (!container) return;
    const dropZone = container.querySelector('.canvas-drop-zone');
    container.querySelectorAll('.canvas-component').forEach(el => el.remove());
    if (dropZone) dropZone.classList.remove('has-items');
  });
  
  components = [];
  pages = [{ id: 'home', name: 'Home', slug: 'index.html', main: [], showHeader: true, showFooter: true }];
  currentPageId = 'home';
  selectedComponent = null;
  componentIdCounter = 0;
  
  document.getElementById('propertiesPanel').innerHTML = `<div class="properties-empty">Click a component to edit its properties</div>`;
  renderPagesList();
  updateComponentCount();
}

function loadProjectFormat(json) {
  pages = json.pages || [{ id: 'home', name: 'Home', slug: 'index.html', main: [] }];
  currentPageId = 'home';
  
  if (json.global?.header) {
    json.global.header.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) restoreComponent({ ...compData, section: 'header' }, template);
    });
  }
  
  const homePage = pages.find(p => p.id === 'home');
  if (homePage?.main) {
    homePage.main.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) restoreComponent(compData, template);
    });
  }
  
  if (json.global?.footer) {
    json.global.footer.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) restoreComponent({ ...compData, section: 'footer' }, template);
    });
  }
  
  renderPagesList();
  renderComponentLibrary();
  updateComponentCount();
}

function loadConfigFormat(json) {
  // Support both old (branding) and new (header) formats
  const header = json.header || {};
  const branding = json.branding || {};
  const navMenu = json.navigationMenu || [];
  const footer = json.footer || {};
  
  // Filter out external/special pages (like 'builder' which opens externally)
  const externalPages = ['builder', 'schema-viewer'];
  const sitePages = navMenu.filter(item => {
    const pageId = item.menuItemId || item.pageToLoad;
    return !externalPages.includes(pageId);
  });
  
  // Build pages from navigation menu - ALL pages have optional header/footer
  pages = sitePages.map((item, index) => {
    const pageId = item.menuItemId || item.pageToLoad || `page-${index}`;
    return {
      id: pageId,
      name: item.menuItemText || 'Page',
      slug: pageId === 'home' ? 'index.html' : pageId + '.html',
      main: [],
      showHeader: true,  // All pages can show header
      showFooter: true   // All pages can show footer
    };
  });
  
  // Ensure home page exists and is first
  const homeIndex = pages.findIndex(p => p.id === 'home');
  if (homeIndex === -1) {
    pages.unshift({ id: 'home', name: 'Home', slug: 'index.html', main: [], showHeader: true, showFooter: true });
  } else if (homeIndex > 0) {
    // Move home to first position
    const homePage = pages.splice(homeIndex, 1)[0];
    pages.unshift(homePage);
  }
  
  currentPageId = 'home';
  
  console.log('[Builder] Created pages from site.json:', pages.map(p => p.id));
  
  // Get logo text from new or old format
  const logoText = header.companyName || branding.companyName || 'My Site';
  
  // Check header.autoInclude - if true (default), auto-create the header navbar
  if (header.autoInclude !== false) {
    // Add navbar component with navigation from site.json
    addComponentToCanvas('navbar', 'header');
    const navComp = components.find(c => c.type === 'navbar');
    if (navComp) {
      // Build navigation links from pages (not raw navMenu to exclude external)
      const navLinks = pages.slice(0, 6).map(page => ({
        id: page.id,
        text: page.name,
        slug: page.slug,
        emoji: (navMenu.find(n => (n.menuItemId || n.pageToLoad) === page.id)?.menuItemEmoji) || ''
      }));
      
      navComp.data = { 
        logo: logoText,
        logoImage: header.logoImage || '',
        showLogo: header.showLogo !== false,
        links: navLinks,
        sticky: header.sticky || false
      };
      
      // Generate navbar HTML with links that work in preview
      const linksHtml = navLinks.map(link => 
        `<a href="${link.slug}" page="${link.id}" style="color: var(--text-secondary); text-decoration: none; padding: 0.5rem 0.75rem; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">${link.emoji ? link.emoji + ' ' : ''}${link.text}</a>`
      ).join('');
      
      const logoHtml = header.showLogo && header.logoImage 
        ? `<span style="display: flex; align-items: center; gap: 0.5rem;">${header.logoImage}<span style="font-weight: 700;">${logoText}</span></span>`
        : `<span style="font-weight: 700;">${logoText}</span>`;
      
      navComp.html = `<div style="display: flex; gap: 1.5rem; padding: 1rem 1.5rem; background: var(--bg-secondary); border-radius: 8px; align-items: center; flex-wrap: wrap;">
        ${logoHtml}
        <nav style="display: flex; gap: 0.5rem; margin-left: auto; flex-wrap: wrap;">${linksHtml}</nav>
      </div>`;
      navComp.element.querySelector('.component-content').innerHTML = navComp.html;
      
      console.log('[Builder] Auto-included header with', navLinks.length, 'nav links:', navLinks.map(l => l.text));
    }
  }
  
  // Add hero to main
  addComponentToCanvas('hero', 'main');
  const heroComp = components.find(c => c.type === 'hero');
  if (heroComp) {
    const title = json.companyInfo?.businessName || logoText;
    const subtitle = json.companyInfo?.businessTagline || header.subtitle || 'Welcome to our site';
    heroComp.data = { title, subtitle };
    // Update the hero HTML
    heroComp.html = `<div style="padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%); border-radius: 8px;">
      <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">${title}</h1>
      <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">${subtitle}</p>
    </div>`;
    heroComp.element.querySelector('.component-content').innerHTML = heroComp.html;
  }
  
  // Check footer.autoInclude - if true (default), auto-create the footer
  if (footer.autoInclude !== false) {
    addComponentToCanvas('footer', 'footer');
    const footerComp = components.find(c => c.type === 'footer');
    if (footerComp) {
      footerComp.data = {
        copyright: footer.copyrightText || '© 2025 Your Company',
        showSocial: footer.showSocialLinks || false
      };
      console.log('[Builder] Auto-included footer from site.json');
    }
  }
  
  // Update UI
  renderPagesList();
  renderComponentLibrary();
  updateComponentCount();
  updateCanvasSectionsVisibility(getCurrentPage());
  
  const pageNames = pages.map(p => p.name).join(', ');
  console.log(`[Builder] Loaded ${pages.length} pages: ${pageNames}`);
}

// Expose functions to window for tests and external access
window.savePersistentState = savePersistentState;
window.loadPersistentState = loadPersistentState;
window.resetBuilder = resetBuilder;
window.refreshBuilder = refreshBuilder;
window.previewSite = previewSite;
window.exportAsJSON = exportAsJSON;
window.exportAsSPA = exportAsSPA;
window.exportAsMPA = exportAsMPA;
window.showSaveMenu = showSaveMenu;
window.showOpenMenu = showOpenMenu;
