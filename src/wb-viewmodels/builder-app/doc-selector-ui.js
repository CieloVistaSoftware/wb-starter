/**
 * Doc Selector UI Component for Property Panel
 * Allows users to select which documentation files to display
 * from a manifest.json file
 */

// Cache for loaded manifests
const manifestCache = {};

/**
 * Create doc selector UI
 * @param {object} propDef - Property definition from propertyconfig.json
 * @param {string} currentValue - Current comma-separated list of selected docs
 * @param {function} onChange - Callback when selection changes
 * @param {HTMLElement} selectedElement - Currently selected element in canvas
 * @returns {HTMLElement}
 */
export function createDocSelector(propDef, currentValue, onChange, selectedElement) {
  const container = document.createElement('div');
  container.className = 'doc-selector';
  
  // Get manifest path from element or use default
  const manifestPath = selectedElement?.dataset.manifest || 
                       selectedElement?.getAttribute('manifest') ||
                       'docs/manifest.json';
  
  // Parse current value
  const selectedDocs = currentValue ? currentValue.split(',').map(s => s.trim()) : [];
  
  // Show loading state
  container.innerHTML = `
    <div class="doc-selector__loading">
      <span class="doc-selector__spinner">⏳</span>
      Loading documentation list...
    </div>
  `;
  
  // Load manifest and render
  loadManifest(manifestPath).then(manifest => {
    renderSelector(container, manifest, selectedDocs, onChange);
  }).catch(err => {
    container.innerHTML = `
      <div class="doc-selector__error">
        <span class="doc-selector__error-icon">⚠️</span>
        <span>Failed to load manifest: ${err.message}</span>
      </div>
    `;
  });
  
  return container;
}

/**
 * Load manifest file
 */
async function loadManifest(path) {
  if (manifestCache[path]) {
    return manifestCache[path];
  }
  
  const fetchPath = path.startsWith('/') ? path : '/' + path;
  const response = await fetch(fetchPath);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const manifest = await response.json();
  manifestCache[path] = manifest;
  return manifest;
}

/**
 * Render the selector UI
 */
function renderSelector(container, manifest, selectedDocs, onChange) {
  if (!manifest || !manifest.categories) {
    container.innerHTML = `
      <div class="doc-selector__error">
        Invalid manifest format
      </div>
    `;
    return;
  }
  
  // Build categories and docs list
  let html = `
    <div class="doc-selector__header">
      <span class="doc-selector__count">${selectedDocs.length} selected</span>
      <button class="doc-selector__clear" title="Clear all">✕ Clear</button>
    </div>
    <div class="doc-selector__search">
      <input type="text" placeholder="Search docs..." class="doc-selector__search-input">
    </div>
    <div class="doc-selector__list">
  `;
  
  for (const category of manifest.categories) {
    if (!category.docs || category.docs.length === 0) continue;
    
    html += `
      <div class="doc-selector__category">
        <div class="doc-selector__category-header">
          <span class="doc-selector__category-icon">${category.icon || '📁'}</span>
          <span class="doc-selector__category-name">${category.name}</span>
          <button class="doc-selector__category-toggle" category="${category.name}">Select All</button>
        </div>
        <div class="doc-selector__category-docs">
    `;
    
    for (const doc of category.docs) {
      const docId = doc.file.replace('.md', '').toLowerCase();
      const isSelected = selectedDocs.some(s => 
        s.toLowerCase() === docId || 
        s.toLowerCase() === doc.file.toLowerCase() ||
        doc.title.toLowerCase().includes(s.toLowerCase())
      );
      
      html += `
        <label class="doc-selector__item ${isSelected ? 'doc-selector__item--selected' : ''}">
          <input type="checkbox" 
                 value="${doc.file}" 
                 heading="${doc.title}"
                 ${isSelected ? 'checked' : ''}>
          <span class="doc-selector__item-title">${doc.title}</span>
        </label>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  
  container.innerHTML = html;
  
  // Event handlers
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  const searchInput = container.querySelector('.doc-selector__search-input');
  const clearBtn = container.querySelector('.doc-selector__clear');
  const countEl = container.querySelector('.doc-selector__count');
  
  // Update function
  const updateSelection = () => {
    const selected = [];
    checkboxes.forEach(cb => {
      if (cb.checked) {
        selected.push(cb.value.replace('.md', ''));
      }
      cb.parentElement.classList.toggle('doc-selector__item--selected', cb.checked);
    });
    
    countEl.textContent = `${selected.length} selected`;
    onChange(selected.join(','));
  };
  
  // Checkbox change
  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateSelection);
  });
  
  // Clear button
  clearBtn.addEventListener('click', () => {
    checkboxes.forEach(cb => cb.checked = false);
    updateSelection();
  });
  
  // Search filter
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.doc-selector__item').forEach(item => {
      const title = item.querySelector('.doc-selector__item-title').textContent.toLowerCase();
      const file = item.querySelector('input').value.toLowerCase();
      const matches = title.includes(query) || file.includes(query);
      item.style.display = matches ? '' : 'none';
    });
    
    // Hide empty categories
    container.querySelectorAll('.doc-selector__category').forEach(cat => {
      const visibleDocs = cat.querySelectorAll('.doc-selector__item:not([style*="none"])');
      cat.style.display = visibleDocs.length > 0 ? '' : 'none';
    });
  });
  
  // Select all in category
  container.querySelectorAll('.doc-selector__category-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.closest('.doc-selector__category');
      const cbs = category.querySelectorAll('input[type="checkbox"]');
      const allChecked = Array.from(cbs).every(cb => cb.checked);
      cbs.forEach(cb => cb.checked = !allChecked);
      btn.textContent = allChecked ? 'Select All' : 'Deselect All';
      updateSelection();
    });
  });
}

// Inject styles
function injectStyles() {
  if (document.getElementById('docSelectorStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'docSelectorStyles';
  style.textContent = `
    .doc-selector {
      max-height: 400px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary, #1a1a2e);
      border: 1px solid var(--border-color, #333);
      border-radius: 8px;
    }
    
    .doc-selector__loading,
    .doc-selector__error {
      padding: 1.5rem;
      text-align: center;
      color: var(--text-secondary, #888);
      font-size: 0.85rem;
    }
    
    .doc-selector__error {
      color: #ef4444;
    }
    
    .doc-selector__spinner {
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .doc-selector__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color, #333);
      background: var(--bg-tertiary, #0d0d1a);
    }
    
    .doc-selector__count {
      font-size: 0.8rem;
      color: var(--text-secondary, #888);
    }
    
    .doc-selector__clear {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .doc-selector__clear:hover {
      background: rgba(239, 68, 68, 0.3);
    }
    
    .doc-selector__search {
      padding: 0.5rem;
      border-bottom: 1px solid var(--border-color, #333);
    }
    
    .doc-selector__search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--bg-primary, #0d0d1a);
      border: 1px solid var(--border-color, #333);
      border-radius: 6px;
      color: var(--text-primary, #fff);
      font-size: 0.85rem;
    }
    
    .doc-selector__search-input:focus {
      outline: none;
      border-color: var(--primary, #6366f1);
    }
    
    .doc-selector__list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }
    
    .doc-selector__category {
      margin-bottom: 0.5rem;
    }
    
    .doc-selector__category-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-tertiary, #252542);
      border-radius: 6px;
      margin-bottom: 0.25rem;
    }
    
    .doc-selector__category-icon {
      font-size: 1rem;
    }
    
    .doc-selector__category-name {
      flex: 1;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary, #fff);
    }
    
    .doc-selector__category-toggle {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      background: rgba(99, 102, 241, 0.2);
      color: var(--primary, #6366f1);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .doc-selector__category-toggle:hover {
      background: rgba(99, 102, 241, 0.3);
    }
    
    .doc-selector__category-docs {
      padding-left: 0.5rem;
    }
    
    .doc-selector__item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s;
    }
    
    .doc-selector__item:hover {
      background: var(--bg-tertiary, #252542);
    }
    
    .doc-selector__item--selected {
      background: rgba(99, 102, 241, 0.15);
    }
    
    .doc-selector__item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--primary, #6366f1);
    }
    
    .doc-selector__item-title {
      font-size: 0.8rem;
      color: var(--text-secondary, #aaa);
    }
    
    .doc-selector__item--selected .doc-selector__item-title {
      color: var(--text-primary, #fff);
    }
  `;
  
  document.head.appendChild(style);
}

// Auto-inject styles
injectStyles();

// Export for property panel
export default createDocSelector;
