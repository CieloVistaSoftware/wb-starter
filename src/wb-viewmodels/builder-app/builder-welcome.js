/**
 * WB Builder Welcome Screen
 * Shows template chooser when canvas is empty
 */

import { 
  PAGE_TEMPLATES, 
  SECTION_TEMPLATES, 
  PAGE_CATEGORIES,
  SECTION_CATEGORIES,
  expandPageTemplate, 
  getSectionTemplate,
  getPageTemplatesByCategory 
} from './builder-templates.js';

// =============================================================================
// WELCOME SCREEN
// =============================================================================

let welcomeVisible = false;
let activeCategory = 'all';

/**
 * Show the welcome screen
 */
export function showWelcome() {
  if (welcomeVisible) return;
  welcomeVisible = true;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'welcomeOverlay';
  overlay.className = 'welcome-overlay';
  
  overlay.innerHTML = `
    <div class="welcome-container">
      <button class="welcome-skip" onclick="window.skipWelcome()" title="Start with blank canvas">
        Start Blank
      </button>
      
      <div class="welcome-header">
        <h1>🚀 What are you building today?</h1>
        <div class="welcome-controls">
          <select class="welcome-view-select" onchange="window.switchWelcomeTab(this.value)">
            <option value="pages">📄 Full Pages</option>
            <option value="sections">🧩 Sections</option>
          </select>
        </div>
      </div>
      
      <div class="welcome-content">
        <!-- PAGES PANEL -->
        <div class="welcome-panel active" id="welcomePagesPanel">
          <div class="category-filters">
            <button class="category-filter active" data-category="all" onclick="window.filterPageCategory('all')">
              All
            </button>
            ${PAGE_CATEGORIES.map(cat => `
              <button class="category-filter" data-category="${cat.id}" onclick="window.filterPageCategory('${cat.id}')" title="${cat.desc}">
                ${cat.icon} ${cat.name}
              </button>
            `).join('')}
          </div>
          
          <div class="template-grid template-grid--pages" id="pagesGrid">
            <div class="template-card template-card--page template-card--blank" onclick="window.skipWelcome()">
              <div class="template-card__icon">⬜</div>
              <div class="template-card__name">Blank Canvas</div>
              <div class="template-card__desc">Start from scratch with an empty page</div>
            </div>
            ${renderPageTemplates('all')}
          </div>
        </div>
        
        <!-- SECTIONS PANEL -->
        <div class="welcome-panel" id="welcomeSectionsPanel">
          <p class="welcome-section-hint">Pick sections to build your own page:</p>
          
          <div class="section-category-list">
            ${SECTION_CATEGORIES.map(cat => `
              <div class="section-category-group">
                <h3 class="section-category-title">${cat.icon} ${cat.name}</h3>
                <div class="section-category-items">
                  ${SECTION_TEMPLATES.filter(t => t.category === cat.id).map(t => `
                    <div class="template-card template-card--section" onclick="window.selectSectionTemplate('${t.id}')">
                      <div class="template-card__icon">${t.icon}</div>
                      <div class="template-card__name">${t.name}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });
}

/**
 * Render page templates (optionally filtered by category)
 */
function renderPageTemplates(category) {
  const templates = category === 'all' 
    ? PAGE_TEMPLATES 
    : getPageTemplatesByCategory(category);
  
  if (templates.length === 0) {
    return '<div class="no-templates">No templates in this category</div>';
  }
  
  return templates.map(t => `
    <div class="template-card template-card--page" onclick="window.selectPageTemplate('${t.id}')">
      <div class="template-card__icon">${t.icon}</div>
      <div class="template-card__name">${t.name}</div>
      <div class="template-card__desc">${t.desc}</div>
      <div class="template-card__preview">${t.preview}</div>
    </div>
  `).join('');
}

/**
 * Hide the welcome screen
 */
export function hideWelcome() {
  const overlay = document.getElementById('welcomeOverlay');
  if (!overlay) return;
  
  overlay.classList.remove('visible');
  setTimeout(() => {
    overlay.remove();
    welcomeVisible = false;
  }, 300);
}

/**
 * Check if welcome should be shown - DISABLED (templates in sidebar now)
 */
export function shouldShowWelcome() {
  return false; // Templates are in sidebar - no modal needed
}

// =============================================================================
// GLOBAL HANDLERS (called from onclick)
// =============================================================================

window.skipWelcome = () => {
  hideWelcome();
};

/**
 * Open templates - just focus sidebar (no modal)
 */
export function openTemplates() {
  // Focus the sidebar search
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.remove('collapsed');
    const search = document.getElementById('templateSearch');
    if (search) {
      search.focus();
      search.select();
    }
  }
}

window.openTemplatesChooser = () => {
  openTemplates();
};

window.switchWelcomeTab = (tab) => {
  // Update select if it exists (and wasn't the trigger)
  const select = document.querySelector('.welcome-view-select');
  if (select && select.value !== tab) {
    select.value = tab;
  }
  
  // Update panels
  document.getElementById('welcomePagesPanel').classList.toggle('active', tab === 'pages');
  document.getElementById('welcomeSectionsPanel').classList.toggle('active', tab === 'sections');
};

window.filterPageCategory = (category) => {
  activeCategory = category;
  
  // Update filter buttons
  document.querySelectorAll('.category-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  
  // Re-render templates
  const grid = document.getElementById('pagesGrid');
  if (grid) {
    grid.innerHTML = renderPageTemplates(category);
  }
};

window.selectPageTemplate = async (templateId) => {
  const template = PAGE_TEMPLATES.find(t => t.id === templateId);
  if (!template) return;
  
  hideWelcome();
  
  // Set template name on body
  document.body.dataset.templateName = template.name;
  
  // Small delay for animation
  await new Promise(r => setTimeout(r, 350));
  
  // Remove empty placeholder
  document.getElementById('empty')?.remove();
  
  // Get all components from page template
  const components = expandPageTemplate(template);
  
  // Insert each component
  for (const comp of components) {
    await insertTemplateComponent(comp);
  }
  
  // Show toast
  if (window.toast) {
    window.toast(`Loaded "${template.name}" template`);
  }
  
  // Update counts
  if (window.upd) window.upd();
  if (window.renderTree) window.renderTree();
  if (window.saveHist) window.saveHist();
  
  // Trigger onboarding flow
  setTimeout(() => {
    if (window.updateFlowState) window.updateFlowState();
  }, 500);
};

window.selectSectionTemplate = async (templateId) => {
  const pageTemplate = getSectionTemplate(templateId);
  if (!template) return;
  
  hideWelcome();
  
  // Small delay for animation
  await new Promise(r => setTimeout(r, 350));
  
  // Remove empty placeholder
  document.getElementById('empty')?.remove();
  
  // Insert section components
  for (const comp of template.components) {
    await insertTemplateComponent(comp);
  }
  
  // Show toast
  if (window.toast) {
    window.toast(`Added "${template.name}" section`);
  }
  
  // Update counts
  if (window.upd) window.upd();
  if (window.renderTree) window.renderTree();
  if (window.saveHist) window.saveHist();
  
  // Trigger onboarding flow
  setTimeout(() => {
    if (window.updateFlowState) window.updateFlowState();
  }, 500);
};

// =============================================================================
// COMPONENT INSERTION
// =============================================================================

/**
 * Find the drop zone for a container wrapper
 */
function findContainerDropZone(wrapper) {
  // For containers, the drop zone is the element with
  const containerEl = wrapper.querySelector('wb-container');
  if (containerEl) return containerEl;
  
  // Fallback: the element with data-wb
  const wbEl = wrapper.querySelector('');
  if (wbEl) return wbEl;
  
  return null;
}

/**
 * Find the grid element inside a grid wrapper
 */
function findGridElement(wrapper) {
  return wrapper.querySelector('wb-grid') || wrapper.querySelector('.wb-grid');
}

/**
 * Insert a component from template (handles nested children)
 * This properly nests children inside their parent containers/grids
 */
async function insertTemplateComponent(comp, parentWrapper = null) {
  let wrapper = null;
  
  // Determine where to add this component
  if (parentWrapper) {
    // Adding to a parent container or grid
    const parentConfig = JSON.parse(parentWrapper.dataset.c || '{}');
    
    if (parentWrapper.dataset.grid || parentConfig.b === 'grid') {
      // Parent is a grid - use addToGrid
      if (window.addToGrid) {
        window.addToGrid(comp, parentWrapper);
        // Find the just-added wrapper (last grid-child in the grid)
        const gridEl = findGridElement(parentWrapper);
        if (gridEl) {
          wrapper = gridEl.querySelector('.dropped:last-child');
        }
      }
    } else {
      // Parent is a container - manually add to drop zone
      const dropZone = findContainerDropZone(parentWrapper);
      if (dropZone) {
        wrapper = addChildToContainer(comp, parentWrapper, dropZone);
      } else {
        // Fallback: use add() but manually move it
        wrapper = window.add(comp);
        if (wrapper) {
          const fallbackZone = parentWrapper.querySelector('');
          if (fallbackZone) {
            fallbackZone.appendChild(wrapper);
            wrapper.dataset.parent = parentWrapper.id;
            wrapper.classList.add('container-child');
          }
        }
      }
    }
  } else {
    // Root level component - add to canvas
    if (window.add) {
      wrapper = window.add(comp);
    }
  }
  
  if (!wrapper) return null;
  
  // Handle grid children (gridChildren array in template)
  if (comp.gridChildren && Array.isArray(comp.gridChildren)) {
    for (const child of comp.gridChildren) {
      await insertTemplateComponent(child, wrapper);
    }
  }
  
  // Handle container children (children array with container flag)
  if (comp.children && Array.isArray(comp.children) && comp.container) {
    for (const child of comp.children) {
      // Only process component definitions (have 'n' for name or 'b' for behavior)
      if (child.n || child.b) {
        await insertTemplateComponent(child, wrapper);
      }
    }
  }
  
  return wrapper;
}

/**
 * Manually add a child to a container's drop zone
 */
function addChildToContainer(comp, containerWrapper, dropZone) {
  // Generate unique ID
  const base = (comp.b || comp.t || 'el').toLowerCase().replace(/[^a-z0-9]/g, '');
  const id = base + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  
  const w = document.createElement('div');
  w.className = 'dropped container-child';
  if (comp.container || comp.b === 'container' || comp.b === 'grid') {
    w.classList.add('is-container');
  }
  w.id = id;
  w.dataset.c = JSON.stringify(comp);
  w.dataset.parent = containerWrapper.id;
  
  // Build controls
  let controls = '<div class="controls">';
  controls += `<button class="ctrl-btn" onclick="moveUp('${id}')" title="Move up">⬆️</button>`;
  controls += `<button class="ctrl-btn" onclick="moveDown('${id}')" title="Move down">⬇️</button>`;
  controls += `<button class="ctrl-btn" onclick="dup('${id}')" title="Duplicate">📋</button>`;
  controls += `<button class="ctrl-btn del" onclick="del('${id}')" title="Delete">🗑️</button>`;
  controls += '</div>';
  w.innerHTML = controls;
  
  // Create the actual element
  const el = createTemplateElement(comp, id);
  w.appendChild(el);
  
  // Add to drop zone
  dropZone.appendChild(w);
  
  // Scan with WB
  if (window.WB && window.WB.scan) {
    window.WB.scan(w);
  }
  
  return w;
}

/**
 * Create the inner element for a template component
 */
function createTemplateElement(comp, id) {
  const t = comp.t || 'div';
  const el = document.createElement(t);
  el.id = id + '-el';
  
  if (comp.b) el.dataset.wb = comp.b;
  
  if (comp.d) {
    for (const [k, v] of Object.entries(comp.d)) {
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k === 'src' && ['IMG', 'AUDIO', 'VIDEO'].includes(el.tagName)) el.src = v;
      else if (k === 'href') el.href = v;
      else if (k === 'placeholder') el.placeholder = v;
      else if (k === 'type' && t === 'input') el.type = v;
      else el.dataset[k] = v;
    }
  }
  
  // Apply container styles immediately
  if (comp.b === 'container' && comp.d) {
    el.style.display = 'flex';
    el.style.flexDirection = comp.d.direction || 'column';
    el.style.flexWrap = (comp.d.wrap === true || comp.d.wrap === 'true') ? 'wrap' : 'nowrap';
    if (comp.d.gap) {
      el.style.gap = comp.d.gap;
      el.style.setProperty('--gap', comp.d.gap);
    }
    if (comp.d.padding) el.style.padding = comp.d.padding;
    
    const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
    const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between' };
    if (comp.d.align) el.style.alignItems = alignMap[comp.d.align] || comp.d.align;
    if (comp.d.justify) el.style.justifyContent = justifyMap[comp.d.justify] || comp.d.justify;
  }
  
  // Apply grid styles
  if (comp.b === 'grid' && comp.d) {
    el.style.display = 'grid';
    el.style.gap = comp.d.gap || '1rem';
    el.style.gridTemplateColumns = `repeat(${comp.d.columns || 3}, 1fr)`;
  }
  
  // Make semantic elements editable
  const semanticTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'BUTTON', 'A'];
  if (semanticTags.includes(el.tagName) || (comp.d && comp.d.text)) {
    el.setAttribute('contenteditable', 'true');
    el.classList.add('canvas-editable');
    el.dataset.editableKey = 'text';
  }
  
  return el;
}

// =============================================================================
// CSS STYLES
// =============================================================================

export function injectWelcomeStyles() {
  if (document.getElementById('welcomeStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'welcomeStyles';
  style.textContent = `
    /* Welcome Overlay */
    .welcome-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(12px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .welcome-overlay.visible {
      opacity: 1;
    }
    
    /* Container */
    .welcome-container {
      background: var(--bg-primary, #1a1a2e);
      border: 1px solid var(--border-color, #333);
      border-radius: 20px;
      width: 95vw;
      max-width: 1200px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: 0 25px 80px -12px rgba(0, 0, 0, 0.6);
      transform: translateY(20px) scale(0.98);
      transition: transform 0.3s ease;
    }
    
    .welcome-overlay.visible .welcome-container {
      transform: translateY(0) scale(1);
    }
    
    /* Skip Button */
    .welcome-skip {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: transparent;
      border: 1px solid var(--border-color, #444);
      color: var(--text-secondary, #888);
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
      z-index: 10;
    }
    
    .welcome-skip:hover {
      background: var(--bg-secondary, #252542);
      color: var(--text-primary, #fff);
      border-color: var(--primary, #6366f1);
    }
    
    /* Header */
    .welcome-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem 1rem;
      flex-shrink: 0;
      border-bottom: 1px solid var(--border-color, #333);
      margin-bottom: 1rem;
    }
    
    .welcome-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary, #fff);
    }
    
    .welcome-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-right: 3rem; /* Space for skip button */
    }
    
    .welcome-view-select {
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      color: var(--text-primary, #fff);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      outline: none;
    }
    
    .welcome-view-select:focus {
      border-color: var(--primary, #6366f1);
    }
    
    /* Category Filters */
    .category-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0 0 1.5rem;
      justify-content: center;
    }
    
    .category-filter {
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      color: var(--text-secondary, #888);
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      transition: all 0.2s;
      white-space: nowrap;
    }
    
    .category-filter:hover {
      background: var(--bg-tertiary, #2a2a4a);
      color: var(--text-primary, #fff);
      border-color: var(--primary, #6366f1);
    }
    
    .category-filter.active {
      background: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      color: #fff;
    }
    
    /* Content */
    .welcome-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 2rem 2rem;
    }
    
    .welcome-panel {
      display: none;
    }
    
    .welcome-panel.active {
      display: block;
    }
    
    .welcome-section-hint {
      text-align: center;
      color: var(--text-secondary, #888);
      margin: 0 0 1.5rem;
      font-size: 1rem;
    }
    
    /* Template Grid */
    .template-grid {
      display: grid;
      gap: 1rem;
    }
    
    .template-grid--pages {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
    
    .template-grid--sections {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
    
    .no-templates {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: var(--text-tertiary, #666);
    }
    
    /* Section Categories */
    .section-category-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .section-category-group {
      background: var(--bg-secondary, #252542);
      border-radius: 12px;
      padding: 1rem;
    }
    
    .section-category-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-secondary, #888);
      margin: 0 0 0.75rem;
      padding-left: 0.25rem;
    }
    
    .section-category-items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.5rem;
    }
    
    /* Template Card */
    .template-card {
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .template-card:hover {
      border-color: var(--primary, #6366f1);
      background: var(--bg-tertiary, #2a2a4a);
      transform: translateY(-3px);
      box-shadow: 0 12px 30px -8px rgba(99, 102, 241, 0.25);
    }
    
    .template-card__icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      line-height: 1;
    }
    
    .template-card--section {
      padding: 0.75rem;
    }
    
    .template-card--section .template-card__icon {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }
    
    .template-card--section .template-card__name {
      font-size: 0.8rem;
    }
    
    .template-card__name {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-primary, #fff);
      margin-bottom: 0.25rem;
    }
    
    .template-card__desc {
      font-size: 0.8rem;
      color: var(--text-secondary, #888);
      line-height: 1.4;
      flex: 1;
    }
    
    .template-card__preview {
      font-size: 0.7rem;
      color: var(--text-tertiary, #666);
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color, #444);
      line-height: 1.5;
    }
    
    /* Blank Card Special Styling */
    .template-card--blank {
      border-style: dashed;
      border-width: 2px;
      background: transparent;
    }
    
    .template-card--blank:hover {
      border-style: solid;
      background: var(--bg-secondary, #252542);
    }
    
    /* Scrollbar */
    .welcome-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .welcome-content::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .welcome-content::-webkit-scrollbar-thumb {
      background: var(--border-color, #444);
      border-radius: 4px;
    }
    
    .welcome-content::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary, #666);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .welcome-container {
        width: 98vw;
        max-height: 95vh;
        border-radius: 16px;
      }
      
      .welcome-header h1 {
        font-size: 1.5rem;
      }
      
      .template-grid--pages {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      }
      
      .category-filters {
        justify-content: flex-start;
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 1rem;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Auto-inject styles
injectWelcomeStyles();
