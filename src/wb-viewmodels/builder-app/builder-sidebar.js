import { getComponentType } from './behavior-types.js';

/**
 * WB Builder Sidebar
 * Search-first component sidebar with recent/popular components
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const POPULAR_COMPONENTS = [
  'card', 'container', 'button', 'image', 'grid', 'hero'
];

// Common components - most frequently used, displayed as visual tiles
// These are draggable AND clickable
const COMMON_COMPONENTS = [
  // Row 1: Structure
  { id: 'card', icon: '📝', label: 'Card', tag: 'basic-card' },
  { id: 'hero', icon: '⚡', label: 'Hero', tag: 'hero-section' },
  { id: 'container', icon: '📦', label: 'Section', tag: 'section' },
  { id: 'grid', icon: '🔲', label: 'Grid', tag: 'grid-layout' },
  
  // Row 2: Content
  { id: 'cardimage', icon: '🖼️', label: 'Image', tag: 'image-card' },
  { id: 'cardstats', icon: '📊', label: 'Stats', tag: 'stats-card' },
  { id: 'button', icon: '🔘', label: 'Button', tag: 'button' },
  { id: 'alert', icon: '🎯', label: 'Alert', tag: 'alert-box' },
  
  // Row 3: Interactive
  { id: 'form', icon: '📋', label: 'Form', tag: 'form' },
  { id: 'tabs', icon: '📑', label: 'Tabs', tag: 'nav-tabs' },
  { id: 'accordion', icon: '📂', label: 'Accordion', tag: 'accordion-el' },
  { id: 'modal', icon: '🪟', label: 'Modal', tag: 'modal-el' },
];

const QUICK_ADD = [
  { label: 'H1', icon: 'H₁', search: 'Heading 1' },
  { label: 'H2', icon: 'H₂', search: 'Heading 2' },
  { label: 'P', icon: '¶', search: 'Paragraph' },
  { label: 'Btn', icon: '⬜', search: 'Button' },
  { label: 'Img', icon: '🖼', search: 'Image' },
  { label: 'Card', icon: '🃏', search: 'Card' },
  { label: 'Grid', icon: '▦', search: 'Grid' },
  { label: 'Box', icon: '📦', search: 'Container' }
];

// =============================================================================
// STATE
// =============================================================================

let recentComponents = [];
let favorites = [];
let searchQuery = '';
let allComponents = [];

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the search-first sidebar
 */
export function initSearchSidebar(components) {
  allComponents = components;
  loadRecentComponents();
  loadFavorites();
  injectSidebarStyles();
  
  // Wait for DOM to be ready
  setTimeout(() => {
    renderSidebar();
  }, 0);
}

/**
 * Update components list (call when components change)
 */
export function updateComponents(components) {
  allComponents = components;
  renderComponentList();
}

// =============================================================================
// RECENT COMPONENTS
// =============================================================================

function loadRecentComponents() {
  try {
    recentComponents = JSON.parse(localStorage.getItem('wb-recent-components') || '[]');
  } catch {
    recentComponents = [];
  }
}

function saveRecentComponents() {
  localStorage.setItem('wb-recent-components', JSON.stringify(recentComponents.slice(0, 8)));
}

/**
 * Track component usage
 */
export function trackComponentUsage(behaviorName) {
  if (!behaviorName) return;
  
  // Remove if already exists
  recentComponents = recentComponents.filter(b => b !== behaviorName);
  
  // Add to front
  recentComponents.unshift(behaviorName);
  
  // Keep only last 8
  recentComponents = recentComponents.slice(0, 8);
  
  saveRecentComponents();
  renderRecentSection();
}

// =============================================================================
// FAVORITES (syncs with builder.js favorites system)
// =============================================================================

function loadFavorites() {
  try {
    favorites = JSON.parse(localStorage.getItem('wb-favorites') || '[]');
  } catch {
    favorites = [];
  }
}

/**
 * Refresh favorites from localStorage (call after toggleFavorite)
 */
export function refreshFavorites() {
  loadFavorites();
  renderFavoritesSection();
  renderComponentList(); // Update star states
}

// =============================================================================
// RENDERING
// =============================================================================

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  // Find or create the sidebar content container
  let content = sidebar.querySelector('.sidebar-content');
  if (!content) {
    // Preserve existing elements we need
    const toggle = sidebar.querySelector('.sidebar-toggle');
    const collapsedLabel = sidebar.querySelector('.sidebar-collapsed-label');
    const resizeHandle = sidebar.querySelector('.sidebar-resize-handle');
    
    // Clear and rebuild
    sidebar.innerHTML = '';
    
    if (toggle) sidebar.appendChild(toggle);
    if (collapsedLabel) sidebar.appendChild(collapsedLabel);
    if (resizeHandle) sidebar.appendChild(resizeHandle);
    
    content = document.createElement('div');
    content.className = 'sidebar-content';
    sidebar.appendChild(content);
  }
  
  content.innerHTML = `
    <div class="sidebar-search">
      <input 
        type="text" 
        id="componentSearch" 
        placeholder="🔍 Search components..." 
        autocomplete="off"
        value="${searchQuery}"
      />
      ${searchQuery ? '<button class="search-clear" onclick="window.clearComponentSearch()">✕</button>' : ''}
    </div>
    
    <div class="sidebar-common">
      <div class="section-header">
        <span>⭐ Common</span>
        <span class="section-hint">click or drag</span>
      </div>
      <div class="common-tiles">
        ${COMMON_COMPONENTS.map(c => `
          <div class="common-tile" 
               draggable="true" 
               data-behavior="${c.id}"
               data-tag="${c.tag}"
               title="${c.label} - click to add or drag to canvas">
            <span class="common-tile__icon">${c.icon}</span>
            <span class="common-tile__label">${c.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="sidebar-quick-add">
      <div class="section-header">
        <span>📝 Text</span>
      </div>
      <div class="quick-add-grid">
        ${QUICK_ADD.map(q => `
          <button class="quick-add-btn" onclick="window.quickAddComponent('${q.search}')" title="Add ${q.search}">
            <span class="quick-add-icon">${q.icon}</span>
            <span class="quick-add-label">${q.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
    
    <div class="sidebar-sections">
      <div class="sidebar-section" id="recentSection" style="display: none;">
        <div class="section-header">
          <span>🕐 Recent</span>
        </div>
        <div class="section-items" id="recentItems"></div>
      </div>
      
      <div class="sidebar-section" id="popularSection">
        <div class="section-header">
          <span>⭐ Popular</span>
        </div>
        <div class="section-items" id="popularItems"></div>
      </div>
      
      <div class="sidebar-section sidebar-section--categories" id="categoriesSection">
        <div class="category-group" id="containersGroup">
          <div class="category-header" onclick="window.toggleSidebarCategory('containers')">
            <span>📐 Containers</span>
            <span class="category-count" id="containersCount">0</span>
            <span class="category-chevron">▶</span>
          </div>
          <div class="category-items collapsed" id="containersList"></div>
        </div>
        
        <div class="category-group" id="elementsGroup">
          <div class="category-header" onclick="window.toggleSidebarCategory('elements')">
            <span>📦 Elements</span>
            <span class="category-count" id="elementsCount">0</span>
            <span class="category-chevron">▶</span>
          </div>
          <div class="category-items collapsed" id="elementsList"></div>
        </div>
        
        <div class="category-group" id="effectsGroup">
          <div class="category-header" onclick="window.toggleSidebarCategory('effects')">
            <span>✨ Effects</span>
            <span class="category-count" id="effectsCount">0</span>
            <span class="category-chevron">▶</span>
          </div>
          <div class="category-items collapsed" id="effectsList"></div>
        </div>
        
        <div class="category-group" id="actionsGroup">
          <div class="category-header" onclick="window.toggleSidebarCategory('actions')">
            <span>⚡ Actions</span>
            <span class="category-count" id="actionsCount">0</span>
            <span class="category-chevron">▶</span>
          </div>
          <div class="category-items collapsed" id="actionsList"></div>
        </div>
      </div>
      
      <div class="sidebar-section" id="searchResultsSection" style="display: none;">
        <div class="section-header">
          <span>🔍 Results</span>
          <span class="search-result-count" id="searchResultCount">0</span>
        </div>
        <div class="section-items" id="searchResults"></div>
      </div>
    </div>
  `;
  
  // Attach search event
  const searchInput = document.getElementById('componentSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      handleSearch(searchQuery);
      updateClearButton();
    });
    
    // Focus on Ctrl+K or / (when not in input)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !isInputFocused())) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        clearSearch();
        searchInput.blur();
      }
    });
  }
  
  renderRecentSection();
  renderPopularSection();
  renderComponentList();
  restoreCategoryState();
  attachCommonTileHandlers();
}

/**
 * Attach drag and click handlers to common component tiles
 */
function attachCommonTileHandlers() {
  const tiles = document.querySelectorAll('.common-tile');
  
  tiles.forEach(tile => {
    const behavior = tile.dataset.behavior;
    const tag = tile.dataset.tag;
    
    // Find the component in allComponents
    const comp = allComponents.find(c => c.b === behavior) || {
      n: tile.querySelector('.common-tile__label')?.textContent || behavior,
      b: behavior,
      i: tile.querySelector('.common-tile__icon')?.textContent || '📦',
      tag: tag
    };
    
    // Drag start
    tile.addEventListener('dragstart', (e) => {
      tile.classList.add('dragging');
      e.dataTransfer.setData('c', JSON.stringify(comp));
      e.dataTransfer.effectAllowed = 'copy';
      
      // Track usage
      if (behavior) trackComponentUsage(behavior);
    });
    
    // Drag end
    tile.addEventListener('dragend', () => {
      tile.classList.remove('dragging');
    });
    
    // Click to add
    tile.addEventListener('click', () => {
      if (window.add) {
        window.add(comp);
        if (behavior) trackComponentUsage(behavior);
      }
    });
  });
}

function updateClearButton() {
  const searchContainer = document.querySelector('.sidebar-search');
  const existingClear = searchContainer?.querySelector('.search-clear');
  
  if (searchQuery && !existingClear && searchContainer) {
    const btn = document.createElement('button');
    btn.className = 'search-clear';
    btn.textContent = '✕';
    btn.onclick = () => {
      window.clearComponentSearch();
    };
    searchContainer.appendChild(btn);
  } else if (!searchQuery && existingClear) {
    existingClear.remove();
  }
}

function renderRecentSection() {
  const container = document.getElementById('recentItems');
  const section = document.getElementById('recentSection');
  if (!container || !section) return;
  
  if (recentComponents.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = '';
  
  const items = recentComponents
    .map(b => allComponents.find(c => c.b === b))
    .filter(Boolean)
    .slice(0, 4);
  
  container.innerHTML = items.map(c => renderComponentItem(c)).join('');
  attachDragHandlers(container);
}

function renderPopularSection() {
  const container = document.getElementById('popularItems');
  if (!container) return;
  
  const items = POPULAR_COMPONENTS
    .map(b => allComponents.find(c => c.b === b))
    .filter(Boolean);
  
  container.innerHTML = items.map(c => renderComponentItem(c)).join('');
  attachDragHandlers(container);
}

function renderFavoritesSection() {
  // Favorites are now shown in the main list with star indicators
}

function renderComponentList() {
  // Categorize components
  const containers = [];
  const elements = [];
  const effects = [];
  const actions = [];
  
  allComponents.forEach(comp => {
    const type = getComponentType(comp);
    switch (type) {
      case 'container': containers.push(comp); break;
      case 'modifier': effects.push(comp); break;
      case 'action': actions.push(comp); break;
      default: elements.push(comp);
    }
  });
  
  // Render each category
  renderCategory('containers', containers);
  renderCategory('elements', elements);
  renderCategory('effects', effects);
  renderCategory('actions', actions);
}

function renderCategory(name, items) {
  const container = document.getElementById(name + 'List');
  const countEl = document.getElementById(name + 'Count');
  
  if (container) {
    container.innerHTML = items.map(c => renderComponentItem(c)).join('');
    attachDragHandlers(container);
  }
  
  if (countEl) {
    countEl.textContent = items.length;
  }
}

function renderComponentItem(comp) {
  const data = JSON.stringify(comp).replace(/"/g, '&quot;');
  const isFav = favorites.includes(comp.b);
  return `
    <div class="comp-item${isFav ? ' favorite' : ''}" draggable="true" data-c="${data}" data-behavior="${comp.b || ''}" title="${comp.n}${comp.b ? ' (' + comp.b + ')' : ''}">
      <span class="comp-icon">${comp.i}</span>
      <span class="comp-name">${comp.n}</span>
      ${isFav ? '<span class="comp-star">★</span>' : ''}
    </div>
  `;
}

function attachDragHandlers(container) {
  container.querySelectorAll('.comp-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      item.classList.add('dragging');
      e.dataTransfer.setData('c', item.dataset.c);
      
      // Track usage
      const dragComp = JSON.parse(item.dataset.c);
      if (dragComp.b) {
        trackComponentUsage(dragComp.b);
      }
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
    
    // Click to add (in addition to drag)
    item.addEventListener('click', () => {
      const clickComp = JSON.parse(item.dataset.c);
      if (window.add) {
        window.add(clickComp);
        if (clickComp.b) trackComponentUsage(clickComp.b);
      }
    });
  });
}

// =============================================================================
// SEARCH
// =============================================================================

function handleSearch(query) {
  const searchSection = document.getElementById('searchResultsSection');
  const categoriesSection = document.getElementById('categoriesSection');
  const recentSection = document.getElementById('recentSection');
  const popularSection = document.getElementById('popularSection');
  
  if (!query.trim()) {
    // Show normal view
    if (searchSection) searchSection.style.display = 'none';
    if (categoriesSection) categoriesSection.style.display = '';
    if (recentSection && recentComponents.length > 0) recentSection.style.display = '';
    if (popularSection) popularSection.style.display = '';
    return;
  }
  
  // Show search results
  if (searchSection) searchSection.style.display = '';
  if (categoriesSection) categoriesSection.style.display = 'none';
  if (recentSection) recentSection.style.display = 'none';
  if (popularSection) popularSection.style.display = 'none';
  
  // Filter components
  const q = query.toLowerCase();
  const results = allComponents.filter(c => {
    return c.n.toLowerCase().includes(q) || 
           (c.b && c.b.toLowerCase().includes(q));
  });
  
  // Render results
  const resultsContainer = document.getElementById('searchResults');
  const countEl = document.getElementById('searchResultCount');
  
  if (resultsContainer) {
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No components found</div>';
    } else {
      resultsContainer.innerHTML = results.map(c => renderComponentItem(c)).join('');
      attachDragHandlers(resultsContainer);
    }
  }
  
  if (countEl) {
    countEl.textContent = results.length;
  }
}

function clearSearch() {
  searchQuery = '';
  const input = document.getElementById('componentSearch');
  if (input) input.value = '';
  handleSearch('');
  updateClearButton();
}

// =============================================================================
// CATEGORY TOGGLE
// =============================================================================

window.toggleSidebarCategory = (name) => {
  const items = document.getElementById(name + 'List');
  const group = document.getElementById(name + 'Group');
  
  if (items && group) {
    const isCollapsed = items.classList.toggle('collapsed');
    group.classList.toggle('expanded', !isCollapsed);
    
    // Save state
    const state = JSON.parse(localStorage.getItem('wb-sidebar-categories') || '{}');
    state[name] = !isCollapsed;
    localStorage.setItem('wb-sidebar-categories', JSON.stringify(state));
  }
};

function restoreCategoryState() {
  const state = JSON.parse(localStorage.getItem('wb-sidebar-categories') || '{}');
  
  Object.entries(state).forEach(([name, isOpen]) => {
    const items = document.getElementById(name + 'List');
    const group = document.getElementById(name + 'Group');
    
    if (items && group && isOpen) {
      items.classList.remove('collapsed');
      group.classList.add('expanded');
    }
  });
}

// =============================================================================
// QUICK ADD
// =============================================================================

window.quickAddComponent = (searchTerm) => {
  const comp = allComponents.find(c => c.n === searchTerm);
  if (comp && window.add) {
    window.add(comp);
    if (comp.b) trackComponentUsage(comp.b);
  }
};

window.clearComponentSearch = () => {
  clearSearch();
  document.getElementById('componentSearch')?.focus();
};

// =============================================================================
// HELPERS
// =============================================================================

// getComponentType is now imported from behavior-types.js

function isInputFocused() {
  const active = document.activeElement;
  return active && (
    active.tagName === 'INPUT' || 
    active.tagName === 'TEXTAREA' || 
    active.isContentEditable
  );
}

// =============================================================================
// STYLES
// =============================================================================

function injectSidebarStyles() {
  if (document.getElementById('sidebarSearchStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'sidebarSearchStyles';
  style.textContent = `
    /* Sidebar Content */
    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    
    /* Search */
    .sidebar-search {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color, #333);
      position: relative;
      flex-shrink: 0;
    }
    
    .sidebar-search input {
      width: 100%;
      padding: 0.75rem 1rem;
      padding-right: 2.5rem;
      background: var(--bg-secondary, #252542);
      border: 2px solid var(--border-color, #444);
      border-radius: 10px;
      color: var(--text-primary, #fff);
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .sidebar-search input:focus {
      border-color: var(--primary, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    
    .sidebar-search input::placeholder {
      color: var(--text-tertiary, #666);
    }
    
    .search-clear {
      position: absolute;
      right: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      background: var(--bg-tertiary, #333);
      border: none;
      color: var(--text-secondary, #888);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      line-height: 1;
      border-radius: 4px;
      transition: all 0.15s;
    }
    
    .search-clear:hover {
      background: var(--primary, #6366f1);
      color: #fff;
    }
    
    /* Common Components Tiles */
    .sidebar-common {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border-color, #333);
      flex-shrink: 0;
    }
    
    .section-hint {
      font-size: 0.6rem;
      color: var(--text-tertiary, #666);
      font-weight: 400;
      text-transform: none;
      letter-spacing: normal;
    }
    
    .common-tiles {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .common-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.625rem 0.25rem;
      background: var(--bg-secondary, #252542);
      border: 2px solid var(--border-color, #444);
      border-radius: 10px;
      cursor: grab;
      transition: all 0.15s;
      aspect-ratio: 1;
      min-height: 60px;
    }
    
    .common-tile:hover {
      background: var(--bg-tertiary, #2a2a4a);
      border-color: var(--primary, #6366f1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }
    
    .common-tile:active {
      transform: translateY(0);
      cursor: grabbing;
    }
    
    .common-tile.dragging {
      opacity: 0.5;
      border-color: var(--primary, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
    }
    
    .common-tile__icon {
      font-size: 1.25rem;
      line-height: 1;
    }
    
    .common-tile__label {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-secondary, #aaa);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    
    .common-tile:hover .common-tile__label {
      color: var(--text-primary, #fff);
    }
    
    /* Quick Add */
    .sidebar-quick-add {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border-color, #333);
      flex-shrink: 0;
    }
    
    .quick-add-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.375rem;
      margin-top: 0.5rem;
    }
    
    .quick-add-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.25rem;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 8px;
      color: var(--text-secondary, #888);
      font-size: 0.65rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .quick-add-btn:hover {
      background: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      color: #fff;
      transform: translateY(-1px);
    }
    
    .quick-add-icon {
      font-size: 1rem;
      line-height: 1;
    }
    
    .quick-add-label {
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    
    /* Sections */
    .sidebar-sections {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }
    
    .sidebar-section {
      margin-bottom: 0.5rem;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary, #666);
    }
    
    .search-result-count {
      background: var(--primary, #6366f1);
      color: #fff;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      font-size: 0.65rem;
    }
    
    .section-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 0.5rem;
    }
    
    /* Category Groups */
    .category-group {
      margin-bottom: 0.25rem;
    }
    
    .category-header {
      display: flex;
      align-items: center;
      padding: 0.625rem 0.75rem;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary, #888);
      transition: all 0.15s;
      border-radius: 8px;
      margin: 0 0.5rem;
    }
    
    .category-header:hover {
      background: var(--bg-secondary, #252542);
      color: var(--text-primary, #fff);
    }
    
    .category-header span:first-child {
      flex: 1;
    }
    
    .category-count {
      background: var(--bg-tertiary, #333);
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      font-size: 0.65rem;
      margin-right: 0.5rem;
    }
    
    .category-chevron {
      font-size: 0.6rem;
      transition: transform 0.2s;
      color: var(--text-tertiary, #666);
    }
    
    .category-group.expanded .category-chevron {
      transform: rotate(90deg);
    }
    
    .category-items {
      padding: 0.25rem 0.5rem 0.5rem;
    }
    
    .category-items.collapsed {
      display: none;
    }
    
    /* Component Items */
    .comp-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-secondary, #252542);
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 0.8rem;
      position: relative;
    }
    
    .comp-item:hover {
      background: var(--bg-tertiary, #2a2a4a);
      border-color: var(--primary, #6366f1);
      transform: translateX(2px);
    }
    
    .comp-item.dragging {
      opacity: 0.5;
      filter: grayscale(100%);
      cursor: grabbing;
    }
    
    .comp-item.favorite {
      background: linear-gradient(135deg, var(--bg-secondary, #252542), rgba(99, 102, 241, 0.1));
    }
    
    .comp-icon {
      font-size: 1.1rem;
      width: 1.5rem;
      text-align: center;
      flex-shrink: 0;
    }
    
    .comp-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary, #fff);
    }
    
    .comp-star {
      color: #fbbf24;
      font-size: 0.75rem;
    }
    
    /* No Results */
    .no-results {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--text-tertiary, #666);
      font-size: 0.875rem;
    }
    
    /* Hide old sidebar elements when using new sidebar */
    .sidebar-content ~ .search,
    .sidebar-content ~ .favorites-section,
    .sidebar-content ~ .categories,
    .sidebar-content ~ #list {
      display: none !important;
    }
    
    /* Scrollbar */
    .sidebar-sections::-webkit-scrollbar {
      width: 6px;
    }
    
    .sidebar-sections::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .sidebar-sections::-webkit-scrollbar-thumb {
      background: var(--border-color, #444);
      border-radius: 3px;
    }
    
    .sidebar-sections::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary, #666);
    }
  `;
  
  document.head.appendChild(style);
}
