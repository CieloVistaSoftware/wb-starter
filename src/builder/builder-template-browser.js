/**
 * WB Builder Template Browser
 * Grid layout in left sidebar
 */

let templates = [];
let categories = [];
let searchQuery = '';
let selectedCategory = null;

export async function initTemplateBrowser() {
  await loadTemplates();
  injectStyles();
  render();
}

async function loadTemplates() {
  try {
    let res = await fetch('/templates/index.json');
    if (res.ok) {
      const data = await res.json();
      templates = data.templates || [];
      categories = data.categories || [];
      console.log('[Templates] Loaded', templates.length, 'templates');
      return;
    }
    
    res = await fetch('/data/templates.json');
    if (res.ok) {
      const data = await res.json();
      templates = data.templates || [];
      categories = data.categories || [];
    }
  } catch (err) {
    console.error('[Templates] Load failed:', err);
  }
}

async function fetchTemplateHTML(templateId) {
  try {
    const res = await fetch(`/templates/${templateId}.html`);
    if (res.ok) return await res.text();
    return null;
  } catch (err) {
    return null;
  }
}

function getFilteredTemplates() {
  let filtered = [...templates];
  
  if (selectedCategory) {
    filtered = filtered.filter(t => t.category === selectedCategory);
  }
  
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }
  
  // Sort A-Z
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  
  return filtered;
}

function render() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let container = sidebar.querySelector('.template-browser');
  
  if (!container) {
    const oldElements = sidebar.querySelectorAll('.search, .favorites-section, .categories, #list, #searchContainer');
    oldElements.forEach(el => el.remove());
    
    container = document.createElement('div');
    container.className = 'template-browser';
    
    const resizeHandle = sidebar.querySelector('.sidebar-resize-handle');
    const collapsedLabel = sidebar.querySelector('.sidebar-collapsed-label');
    const toggle = sidebar.querySelector('.sidebar-toggle');
    
    if (resizeHandle) resizeHandle.after(container);
    else if (collapsedLabel) collapsedLabel.after(container);
    else if (toggle) toggle.after(container);
    else sidebar.appendChild(container);
  }

  const filtered = getFilteredTemplates();

  container.innerHTML = `
    <div class="tb-search">
      <input type="text" id="tbSearch" placeholder="Search..." value="${searchQuery}" />
    </div>
    
    <div class="tb-section">
      <div class="tb-header">CATEGORIES</div>
      <div class="tb-cats">
        <button class="tb-cat${!selectedCategory ? ' active' : ''}" data-cat="">All (${templates.length})</button>
        ${categories.map(c => {
          const count = templates.filter(t => t.category === c.id).length;
          return `<button class="tb-cat${selectedCategory === c.id ? ' active' : ''}" data-cat="${c.id}">${c.icon} ${c.name} (${count})</button>`;
        }).join('')}
      </div>
    </div>
    
    <div class="tb-section tb-section-grow">
      <div class="tb-header">TEMPLATES (${filtered.length})</div>
      <div class="tb-grid">
        ${filtered.length === 0 ? '<div class="tb-empty">No templates found</div>' : filtered.map(t => {
          const cat = categories.find(c => c.id === t.category);
          return `<button class="tb-card" data-id="${t.id}" title="${t.name}">
            <span class="tb-card-icon">${cat?.icon || '📄'}</span>
            <span class="tb-card-name">${t.name}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  `;
  
  bindEvents();
}

function bindEvents() {
  // Search
  const search = document.getElementById('tbSearch');
  if (search) {
    search.oninput = (e) => {
      searchQuery = e.target.value;
      render();
    };
  }
  
  // Categories
  document.querySelectorAll('.tb-cat').forEach(btn => {
    btn.onclick = () => {
      selectedCategory = btn.dataset.cat || null;
      render();
    };
  });
  
  // Template cards
  document.querySelectorAll('.tb-card').forEach(card => {
    card.onclick = () => {
      const id = card.dataset.id;
      console.log('[Templates] Clicked:', id);
      useTemplate(id);
    };
  });
}

async function useTemplate(id) {
  const template = templates.find(t => t.id === id);
  if (!template) {
    console.error('[Templates] Not found:', id);
    return;
  }
  
  console.log('[Templates] Using:', template.name);
  
  // HTML template
  if (!template.components) {
    const html = await fetchTemplateHTML(id);
    if (html) {
      if (window.addTemplateHTML) {
        window.addTemplateHTML(html, template);
      } else if (window.addHTML) {
        window.addHTML(html);
      }
    } else {
      console.error('[Templates] HTML not found for:', id);
      if (window.toast) window.toast('Template file not found');
    }
    return;
  }
  
  // JSON template
  if (window.addTemplate) {
    window.addTemplate(template);
  }
}

function injectStyles() {
  if (document.getElementById('tbStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'tbStyles';
  style.textContent = `
    .template-browser {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      background: var(--bg-primary, #1a1a2e);
    }
    
    .tb-search {
      padding: 8px;
      border-bottom: 1px solid var(--border-color, #333);
    }
    
    .tb-search input {
      width: 100%;
      padding: 8px 12px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
    }
    
    .tb-search input:focus {
      outline: none;
      border-color: var(--primary, #6366f1);
    }
    
    .tb-section {
      padding: 8px;
      border-bottom: 1px solid var(--border-color, #333);
    }
    
    .tb-section-grow {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-bottom: none;
    }
    
    .tb-header {
      font-size: 11px;
      font-weight: 700;
      color: #888;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    
    .tb-cats {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .tb-cat {
      padding: 4px 8px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 4px;
      color: #aaa;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .tb-cat:hover {
      border-color: var(--primary, #6366f1);
      color: #fff;
    }
    
    .tb-cat.active {
      background: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      color: #fff;
    }
    
    /* GRID */
    .tb-grid {
      flex: 1;
      overflow-y: scroll;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      padding: 4px;
      align-content: start;
    }
    
    .tb-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 12px 8px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      min-height: 70px;
    }
    
    .tb-card:hover {
      border-color: var(--primary, #6366f1);
      background: var(--bg-tertiary, #2a2a4a);
      transform: translateY(-2px);
    }
    
    .tb-card-icon {
      font-size: 20px;
    }
    
    .tb-card-name {
      font-size: 10px;
      color: #fff;
      text-align: center;
      line-height: 1.2;
      word-break: break-word;
    }
    
    .tb-empty {
      grid-column: 1 / -1;
      padding: 24px;
      text-align: center;
      color: #666;
    }
    
    /* Scrollbar */
    .tb-grid::-webkit-scrollbar {
      width: 10px;
    }
    
    .tb-grid::-webkit-scrollbar-track {
      background: #1a1a2e;
    }
    
    .tb-grid::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 5px;
      border: 2px solid #1a1a2e;
    }
    
    .tb-grid::-webkit-scrollbar-thumb:hover {
      background: var(--primary, #6366f1);
    }
  `;
  
  document.head.appendChild(style);
}

export async function refreshTemplates() {
  await loadTemplates();
  render();
}

export function getTemplates() { return templates; }
export function getCategories() { return categories; }

export default {
  init: initTemplateBrowser,
  refresh: refreshTemplates,
  getTemplates,
  getCategories
};
