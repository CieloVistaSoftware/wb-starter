// =============================================================================
// RIGHT PANEL - Component List with Container Support
// Shows dropped components in reverse order (newest at top)
// Click to expand - shows properties OR child editor for containers
// Drag & drop reordering in both canvas and panel
// Right-click context menu: Docs and Schema viewer
// Validation integration for property changes
// =============================================================================

let expandedItemId = null;
let draggedItemId = null;
let currentDocsComponent = null;
let schemaCache = {};
let markedLoaded = false;
let markedPromise = null;

// Global state for properties tab
window.activePropsTab = window.activePropsTab || 'props';

// Inject styles for tabs
(function injectTreeStyles() {
  if (document.getElementById('tree-styles')) return;
  const style = document.createElement('style');
  style.id = 'tree-styles';
  style.textContent = `
    .props-tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 0.5rem;
      background: var(--bg-secondary);
    }
    .props-tab {
      flex: 1;
      padding: 0.5rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .props-tab:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }
    .props-tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      background: var(--bg-tertiary);
      font-weight: 600;
    }
    .props-content {
      padding: 0.25rem;
    }
    .props-loading {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
      font-style: italic;
    }
    
    /* Fixes requested by user */
    .panel-item-header {
      padding: 0.75rem 1rem !important; /* Larger click area */
      min-height: 40px !important;
      cursor: pointer;
    }
    
    .panel-item.selected {
      border-color: #22c55e !important; /* Green border */
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2) !important;
    }
    
    /* Also style the canvas element */
    .dropped.selected {
      border-color: #22c55e !important;
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2) !important;
    }
  `;
  document.head.appendChild(style);
})();

// =============================================================================
// LOAD MARKED.JS FOR MARKDOWN RENDERING (same approach as mdhtml behavior)
// =============================================================================
async function loadMarked() {
  if (markedLoaded && window.marked) return window.marked;
  
  if (markedPromise) return markedPromise;
  
  markedPromise = new Promise((resolve, reject) => {
    if (window.marked) {
      markedLoaded = true;
      resolve(window.marked);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.onload = () => {
      markedLoaded = true;
      resolve(window.marked);
    };
    script.onerror = () => reject(new Error('Failed to load marked.js'));
    document.head.appendChild(script);
  });
  
  return markedPromise;
}

// =============================================================================
// HREF SUGGESTIONS - Project pages + Recent URLs
// =============================================================================
const PROJECT_PAGES = [
  { label: '📄 Home', value: '#home' },
  { label: '📄 About', value: '#about' },
  { label: '📄 Components', value: '#components' },
  { label: '📄 Contact', value: '#contact' },
  { label: '📄 Docs', value: '#docs' },
  { label: '📄 Features', value: '#features' },
  { label: '📄 New Page', value: '#newpage' }
];

// Get recent URLs from localStorage
function getRecentUrls() {
  try {
    return JSON.parse(localStorage.getItem('wb-recent-urls') || '[]');
  } catch {
    return [];
  }
}

// Add URL to recent list (only after validation)
function addRecentUrl(url) {
  if (!url || url.startsWith('#')) return;
  
  let recent = getRecentUrls();
  recent = recent.filter(u => u !== url);
  recent.unshift(url);
  recent = recent.slice(0, 10);
  localStorage.setItem('wb-recent-urls', JSON.stringify(recent));
}

// Get all href suggestions
function getHrefSuggestions() {
  const suggestions = [...PROJECT_PAGES];
  const recent = getRecentUrls();
  
  if (recent.length > 0) {
    recent.forEach(url => {
      suggestions.push({ label: '🌐 ' + url, value: url });
    });
  }
  
  return suggestions;
}

// Validate URL - checks if it resolves
async function validateUrl(url) {
  // Internal anchors - check if page exists
  if (url.startsWith('#')) {
    const pageId = url.slice(1);
    const validPages = ['home', 'about', 'components', 'contact', 'docs', 'features', 'newpage'];
    if (validPages.includes(pageId)) {
      return { valid: true };
    }
    return { valid: false, reason: `Page "${pageId}" does not exist` };
  }
  
  // External URLs - must start with http:// or https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, reason: 'URL must start with http:// or https://' };
  }
  
  // Basic URL format check
  try {
    new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
  
  // Try to fetch the URL (HEAD request to check if it exists)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // Allow cross-origin (won't get status but won't error)
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return { valid: true };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { valid: false, reason: 'URL timeout - server not responding' };
    }
    // no-cors mode doesn't give us status, so assume it's reachable if no network error
    return { valid: true };
  }
}

// Show error toast (uses Events module from builder.js)
function showUrlError(message) {
  if (window.Events) {
    window.Events.error('URL Validation', message);
  } else {
    console.error('[URL Validation]', message);
  }
}

// Expose for use in updP
window.addRecentUrl = addRecentUrl;
window.validateUrl = validateUrl;

// Get selected component from main builder.js
function getSelectedId() {
  return window.sel?.id || null;
}

function renderTree() {
  renderComponentList();
}

// Expose globally for builder.js module
window.renderTree = renderTree;
window.autoExtendCanvas = autoExtendCanvas;

function renderComponentList() {
  const panel = document.getElementById('componentList');
  if (!panel) return;
  
  const components = Array.from(document.querySelectorAll('.dropped:not(.grid-child)'));
  const selectedId = getSelectedId();
  
  if (components.length === 0) {
    panel.innerHTML = `
      <div class="panel-right-empty">
        <div style="font-size:1.5rem;opacity:0.5;margin-bottom:0.5rem">📦</div>
        <p>Drop components to add</p>
      </div>
    `;
    return;
  }
  
  // Reverse order (newest at top)
  const reversed = [...components].reverse();
  
  panel.innerHTML = '';
  
  reversed.forEach(comp => {
    const c = JSON.parse(comp.dataset.c);
    const isSelected = selectedId === comp.id;
    const isExpanded = expandedItemId === comp.id;
    const isContainer = c.container === true;
    
    const item = document.createElement('div');
    item.className = 'panel-item' + (isSelected ? ' selected' : '') + (isExpanded ? ' expanded' : '');
    item.dataset.id = comp.id;
    
    // Header row: hamburger | icon | name | red checkmark (remove)
    const header = document.createElement('div');
    header.className = 'panel-item-header';
    
    // Hamburger drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'panel-item-hamburger';
    dragHandle.textContent = '☰';
    dragHandle.title = 'Drag to reorder';
    dragHandle.draggable = true;
    dragHandle.ondragstart = (e) => {
      e.stopPropagation();
      draggedItemId = comp.id;
      item.classList.add('dragging');
      e.dataTransfer.setData('text/plain', comp.id);
      e.dataTransfer.effectAllowed = 'move';
    };
    dragHandle.ondragend = () => {
      item.classList.remove('dragging');
      draggedItemId = null;
      document.querySelectorAll('.panel-item.drag-over').forEach(el => el.classList.remove('drag-over'));
    };
    
    const icon = document.createElement('span');
    icon.className = 'panel-item-icon';
    icon.textContent = c.i || '📦';
    
    const name = document.createElement('span');
    name.className = 'panel-item-name';
    name.textContent = c.n + (isContainer ? ' ▼' : '');
    name.title = c.n + ' (' + comp.id + ')' + (isContainer ? ' - Container' : '');
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'panel-item-remove';
    removeBtn.innerHTML = '✓';
    removeBtn.title = 'Remove component';
    removeBtn.onclick = (e) => { 
      e.stopPropagation(); 
      window.del(comp.id); 
    };
    
    header.appendChild(dragHandle);
    header.appendChild(icon);
    header.appendChild(name);
    header.appendChild(removeBtn);
    
    // Drop zone for reordering
    item.draggable = false; // Only drag via handle
    item.ondragover = (e) => {
      e.preventDefault();
      if (draggedItemId && draggedItemId !== comp.id) {
        item.classList.add('drag-over');
      }
    };
    item.ondragleave = () => {
      item.classList.remove('drag-over');
    };
    item.ondrop = (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (draggedItemId && draggedItemId !== comp.id) {
        reorderComponents(draggedItemId, comp.id);
      }
    };
    
    // Click to toggle expand/select
    header.onclick = () => {
      window.selComp(comp);
      // Scroll into view
      comp.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (expandedItemId === comp.id) {
        expandedItemId = null;
      } else {
        expandedItemId = comp.id;
      }
      renderComponentList();
    };
    
    item.appendChild(header);
    
    // Expanded section - different UI for containers vs regular components
    if (isExpanded) {
      const propsDiv = document.createElement('div');
      propsDiv.className = 'panel-item-props';
      
      // Render Tabs
      const tabsHtml = `
        <div class="props-tabs">
          <button class="props-tab ${window.activePropsTab === 'props' ? 'active' : ''}" onclick="window.switchPropsTab('props')">Properties</button>
          <button class="props-tab ${window.activePropsTab === 'docs' ? 'active' : ''}" onclick="window.switchPropsTab('docs')">Docs</button>
          <button class="props-tab ${window.activePropsTab === 'schema' ? 'active' : ''}" onclick="window.switchPropsTab('schema')">Schema</button>
        </div>
        <div class="props-content" id="props-content-${comp.id}"></div>
      `;
      propsDiv.innerHTML = tabsHtml;
      item.appendChild(propsDiv);
      
      // Render Content
      const contentContainer = propsDiv.querySelector(`#props-content-${comp.id}`);
      renderExpandedContent(contentContainer, comp.id, c);
    }
    
    panel.appendChild(item);
    
    // Render grid children under parent (if any) - for Grid component
    if (comp.dataset.grid) {
      const children = Array.from(comp.querySelectorAll('.grid-child')).reverse();
      children.forEach(child => {
        const cc = JSON.parse(child.dataset.c);
        const childSelected = selectedId === child.id;
        const childExpanded = expandedItemId === child.id;
        
        const childItem = document.createElement('div');
        childItem.className = 'panel-item panel-item--child' + (childSelected ? ' selected' : '') + (childExpanded ? ' expanded' : '');
        childItem.dataset.id = child.id;
        childItem.style.marginLeft = '1rem';
        childItem.style.borderLeftColor = 'var(--primary)';
        
        const childHeader = document.createElement('div');
        childHeader.className = 'panel-item-header';
        
        const childIcon = document.createElement('span');
        childIcon.className = 'panel-item-icon';
        childIcon.textContent = cc.i || '📦';
        
        const childName = document.createElement('span');
        childName.className = 'panel-item-name';
        childName.textContent = cc.n;
        childName.title = cc.n + ' (span ' + (child.dataset.span || 1) + ')';
        
        const childRemoveBtn = document.createElement('button');
        childRemoveBtn.className = 'panel-item-remove';
        childRemoveBtn.textContent = '✕';
        childRemoveBtn.onclick = (e) => { 
          e.stopPropagation(); 
          window.del(child.id); 
        };
        
        childHeader.appendChild(childIcon);
        childHeader.appendChild(childName);
        childHeader.appendChild(childRemoveBtn);
        
        childHeader.onclick = () => {
          window.selComp(child);
          // Scroll into view
          child.scrollIntoView({ behavior: 'smooth', block: 'center' });

          if (expandedItemId === child.id) {
            expandedItemId = null;
          } else {
            expandedItemId = child.id;
          }
          renderComponentList();
        };
        
        childItem.appendChild(childHeader);
        
        // Child properties
        if (childExpanded) {
          const childPropsDiv = document.createElement('div');
          childPropsDiv.className = 'panel-item-props';
          
          // Render Tabs for child
          const tabsHtml = `
            <div class="props-tabs">
              <button class="props-tab ${window.activePropsTab === 'props' ? 'active' : ''}" onclick="window.switchPropsTab('props')">Properties</button>
              <button class="props-tab ${window.activePropsTab === 'docs' ? 'active' : ''}" onclick="window.switchPropsTab('docs')">Docs</button>
              <button class="props-tab ${window.activePropsTab === 'schema' ? 'active' : ''}" onclick="window.switchPropsTab('schema')">Schema</button>
            </div>
            <div class="props-content" id="props-content-${child.id}"></div>
          `;
          childPropsDiv.innerHTML = tabsHtml;
          childItem.appendChild(childPropsDiv);
          
          // Render Content
          const contentContainer = childPropsDiv.querySelector(`#props-content-${child.id}`);
          renderExpandedContent(contentContainer, child.id, cc);
        }
        
        panel.appendChild(childItem);
      });
    }
  });
}

window.switchPropsTab = (tab) => {
  window.activePropsTab = tab;
  renderTree();
};

function renderContainerChildrenEditor(id, c) {
  const el = document.getElementById(id);
  if (!el) return '<div class="prop-empty">Container element not found</div>';
  
  // Find direct children components
  // We want .dropped elements that are inside this element, 
  // but not inside another .dropped element that is inside this element.
  const allDropped = Array.from(el.querySelectorAll('.dropped'));
  const directChildren = allDropped.filter(child => {
    const parentDropped = child.parentElement.closest('.dropped');
    return parentDropped === el;
  });
  
  if (directChildren.length === 0) {
    return '<div class="prop-empty" style="padding:0.5rem;color:var(--text-muted);font-style:italic">No children components</div>';
  }
  
  let html = '<div class="prop-category"><div class="prop-category-header"><span class="prop-category-label">Children</span><span class="prop-category-count">' + directChildren.length + '</span></div><div class="prop-category-body">';
  
  directChildren.forEach(child => {
    let childC;
    try {
      childC = JSON.parse(child.dataset.c);
    } catch(e) {
      childC = { n: 'Unknown', i: '?' };
    }
    
    html += `
      <div class="panel-item" style="margin-bottom:4px;border:1px solid var(--border-color)">
        <div class="panel-item-header">
          <span class="panel-item-icon">${childC.i || '📦'}</span>
          <span class="panel-item-name">${childC.n}</span>
          <button class="panel-item-remove" onclick="event.stopPropagation(); window.del('${child.id}')" title="Remove">🗑️</button>
        </div>
      </div>
    `;
  });
  
  html += '</div></div>';
  return html;
}

async function renderExpandedContent(container, id, c) {
  container.innerHTML = '';
  
  if (window.activePropsTab === 'props') {
    if (c.container) {
       // Render Container Editor
       // 1. Properties Section
       if (c.d && Object.keys(c.d).length > 0) {
         const propsSection = document.createElement('div');
         propsSection.className = 'container-props-section';
         container.appendChild(propsSection);
         
         if (window.renderPropertiesPanel) {
           const wrapper = document.getElementById(id);
           window.renderPropertiesPanel(wrapper, propsSection, (wid, k, v) => window.updP(wid, k, v));
         } else {
           propsSection.innerHTML = renderInlineProps(id, c);
         }
       }
       
       // 2. Children Section
       const childrenSection = document.createElement('div');
       childrenSection.innerHTML = renderContainerChildrenEditor(id, c);
       container.appendChild(childrenSection);
       
    } else {
       // Regular Component
       if (window.renderPropertiesPanel) {
         const wrapper = document.getElementById(id);
         window.renderPropertiesPanel(wrapper, container, (wid, k, v) => window.updP(wid, k, v));
       } else {
         container.innerHTML = renderInlineProps(id, c);
       }
    }
  } else if (window.activePropsTab === 'docs') {
    container.innerHTML = '<div class="props-loading">Loading docs...</div>';
    await loadDocsContentToContainer(c.b, 'docs', container);
  } else if (window.activePropsTab === 'schema') {
    container.innerHTML = '<div class="props-loading">Loading schema...</div>';
    await loadDocsContentToContainer(c.b, 'schema', container);
  }
}

async function loadDocsContentToContainer(behavior, tab, container) {
  try {
    if (tab === 'docs') {
      const response = await fetch(`src/behaviors/docs/${behavior}.md`);
      if (response.ok) {
        const markdown = await response.text();
        const html = await renderMarkdown(markdown);
        container.innerHTML = `<div class="docs-content">${html}</div>`;
      } else {
        container.innerHTML = `<div class="props-loading">No documentation found</div>`;
      }
    } else if (tab === 'schema') {
      const response = await fetch(`src/behaviors/schema/${behavior}.schema.json`);
      if (response.ok) {
        const schema = await response.json();
        container.innerHTML = renderSchemaViewer(schema, behavior);
      } else {
        container.innerHTML = `<div class="props-loading">No schema found</div>`;
      }
    }
  } catch (err) {
    container.innerHTML = `<div class="props-loading" style="color:var(--danger-color)">Error: ${err.message}</div>`;
  }
}



function renderChildItem(parentId, child, idx, parentConfig) {
  // Determine which fields to show based on child structure
  const fields = Object.keys(child);
  
  let html = `<div class="container-child-item" data-index="${idx}">`;
  html += '<div class="container-child-header">';
  html += `<span class="container-child-number">${idx + 1}</span>`;
  html += `<button class="container-child-remove" onclick="window.removeContainerChild('${parentId}', ${idx})" title="Remove">✕</button>`;
  html += '</div>';
  
  // Render editable fields for this child
  fields.forEach(field => {
    const value = child[field] || '';
    const isLongText = field === 'content' || value.length > 50;
    
    html += `<div class="prop-row">`;
    html += `<label class="prop-label">${field}</label>`;
    
    if (isLongText) {
      html += `<textarea class="prop-input prop-textarea" 
        onchange="window.updateContainerChild('${parentId}', ${idx}, '${field}', this.value)"
        rows="2">${escapeHtml(value)}</textarea>`;
    } else {
      html += `<input class="prop-input" value="${escapeHtml(value)}" 
        oninput="window.updateContainerChild('${parentId}', ${idx}, '${field}', this.value)">`;
    }
    
    html += '</div>';
  });
  
  // Move up/down buttons
  html += '<div class="container-child-actions">';
  html += `<button class="container-child-move" onclick="window.moveContainerChild('${parentId}', ${idx}, -1)" title="Move up" ${idx === 0 ? 'disabled' : ''}>↑</button>`;
  html += `<button class="container-child-move" onclick="window.moveContainerChild('${parentId}', ${idx}, 1)" title="Move down">↓</button>`;
  html += '</div>';
  
  html += '</div>';
  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =============================================================================
// REGULAR PROPERTIES EDITOR
// =============================================================================
function renderInlineProps(id, c) {
  if (!c.d || Object.keys(c.d).length === 0) return '';
  
  // Content-editable fields to skip (edited directly in canvas)
  // Exception: cardlink needs 'content' in panel since it's in a dynamic element
  const contentEditableFields = ['title', 'message', 'text', 'quote', 'description'];
  const skipContent = c.b !== 'cardlink'; // Only skip 'content' for non-cardlink components
  if (skipContent) contentEditableFields.push('content');
  
  // Help tooltips for properties
  const tooltips = {
    href: 'Link URL - must be a valid page (#home) or external URL (https://...)',
    src: 'Image or media source URL',
    columns: 'Number of grid columns (1-4)',
    mode: 'Layout mode: column-first or row-first',
    type: 'Visual style variant',
    size: 'Component size (sm, md, lg, xl)',
    status: 'User status indicator',
    variant: 'Color/style variant',
    placeholder: 'Input placeholder text',
    offset: 'Pixels to offset from top when scrolling to anchor (accounts for fixed headers)',
    volume: 'Audio volume (0-1)',
    bass: 'Bass adjustment (-12 to +12)',
    treble: 'Treble adjustment (-12 to +12)',
    plan: 'Pricing plan name',
    price: 'Price display (e.g. $29)',
    period: 'Billing period (e.g. /month)',
    features: 'Comma-separated feature list',
    cta: 'Call-to-action button text',
    ctaHref: 'Button link URL - must be valid',
    items: 'Comma-separated list of items',
    separator: 'Separator character between items',
    target: 'Target date/time (ISO format)',
    value: 'Current value',
    max: 'Maximum value',
    min: 'Minimum value',
    label: 'Display label text',
    name: 'Name or identifier',
    icon: 'Icon character or emoji',
    trend: 'Trend direction (up/down)',
    trendValue: 'Trend percentage (e.g. +12%)',
    multiple: 'Allow multiple selections',
    dismissible: 'Can be closed/dismissed',
    loop: 'Loop playback',
    autoplay: 'Start automatically',
    muted: 'Start muted',
    content: 'Main content text (shown in card body)',
    footer: 'Footer text (shown at bottom of card)'
  };
  
  // Dropdown fields with options
  const dropdownFields = {
    columns: ['1', '2', '3', '4'],
    mode: ['column', 'row'],
    imageAspect: ['16:9', '1:1', '4:3'],
    imagePosition: ['top', 'bottom', 'overlay'],
    type: ['info', 'success', 'warning', 'error'],
    size: ['sm', 'md', 'lg', 'xl'],
    status: ['', 'online', 'offline', 'busy', 'away'],
    variant: ['default', 'primary', 'success', 'warning', 'error', 'info']
  };
  
  // Alert type icons mapping
  const alertIcons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  
  // Checkbox fields
  const checkboxFields = [
    'allowImage', 'featured', 'hoverable', 'multiple', 'dismissible', 'pill', 'showEq', 'loop', 'autoplay', 'muted',
    'elevated', 'clickable', 'visible', 'checked', 'disabled', 'readonly', 'required', 'selected', 'open', 'fluid', 'rounded', 'outlined'
  ];
  
  // Range slider fields with min/max/step
  const rangeFields = {
    volume: { min: 0, max: 1, step: 0.1, label: 'Volume' },
    bass: { min: -12, max: 12, step: 1, label: 'Bass' },
    treble: { min: -12, max: 12, step: 1, label: 'Treble' },
    offset: { min: 0, max: 200, step: 10, label: 'Offset (px)' }
  };
  
  // Special image picker fields (show preset options + custom input)
  const imagePickerFields = ['src'];
  
  // Preset avatar images
  const avatarPresets = [
    { label: 'Person 1', value: 'https://i.pravatar.cc/80?img=1' },
    { label: 'Person 2', value: 'https://i.pravatar.cc/80?img=2' },
    { label: 'Person 3', value: 'https://i.pravatar.cc/80?img=3' },
    { label: 'Person 4', value: 'https://i.pravatar.cc/80?img=4' },
    { label: 'Person 5', value: 'https://i.pravatar.cc/80?img=5' },
    { label: 'Woman 1', value: 'https://i.pravatar.cc/80?img=32' },
    { label: 'Woman 2', value: 'https://i.pravatar.cc/80?img=47' },
    { label: 'Woman 3', value: 'https://i.pravatar.cc/80?img=44' },
    { label: 'Custom...', value: 'custom' }
  ];
  
  let html = '';
  
  for (const [k, v] of Object.entries(c.d)) {
    // Skip content-editable fields (edited directly in canvas)
    if (contentEditableFields.includes(k)) continue;
    
    // Skip empty status fields in display
    const displayValue = v || '';
    
    const isBool = checkboxFields.includes(k) || 
                   typeof v === 'boolean' || 
                   String(v).toLowerCase() === 'true' || 
                   String(v).toLowerCase() === 'false';

    if (isBool) {
      const isChecked = String(v).toLowerCase() === 'true' || v === true || v === '1';
      const tip = tooltips[k] || '';
      html += `
        <div class="prop-row">
          <label class="prop-label--checkbox" ${tip ? `title="${tip}"` : ''}>
            <input type="checkbox" class="prop-checkbox" ${isChecked ? 'checked' : ''} 
              onchange="window.updP('${id}','${k}',this.checked ? 'true' : 'false')">
            ${k} ${tip ? '<span class="prop-help">?</span>' : ''}
          </label>
        </div>
      `;
    } else if (k === 'src' && c.b === 'avatar') {
      // Special avatar image picker
      const isCustom = !avatarPresets.some(p => p.value === v);
      html += `
        <div class="prop-row">
          <label class="prop-label">Avatar Image</label>
          <select class="prop-input prop-select" onchange="window.handleAvatarSelect('${id}', this.value)">
            ${avatarPresets.map(p => {
              const selected = (p.value === v) || (p.value === 'custom' && isCustom);
              return `<option value="${p.value}" ${selected ? 'selected' : ''}>${p.label}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="prop-row" id="custom-src-${id}" style="${isCustom ? '' : 'display:none;'}">
          <label class="prop-label">Custom URL</label>
          <input class="prop-input" value="${escapeHtml(isCustom ? v : '')}" 
            placeholder="https://..."
            oninput="window.updP('${id}','src',this.value)">
        </div>
      `;
    } else if (k === 'source') {
      // JSON array editor for autocomplete source
      let items = [];
      try { items = JSON.parse(v || '[]'); } catch(e) {}
      html += `
        <div class="prop-row">
          <label class="prop-label">Suggestions</label>
          <textarea class="prop-input prop-textarea" rows="3" 
            placeholder="One item per line"
            oninput="window.updateSourceList('${id}', this.value)">${items.join('\n')}</textarea>
          <small class="prop-hint">Enter one suggestion per line</small>
        </div>
      `;
    } else if (rangeFields[k]) {
      // Range slider with value display
      const range = rangeFields[k];
      const numValue = parseFloat(displayValue) || 0;
      html += `
        <div class="prop-row">
          <label class="prop-label">${range.label || k}</label>
          <div class="prop-range-wrapper">
            <input type="range" class="prop-range" 
              min="${range.min}" max="${range.max}" step="${range.step}" 
              value="${numValue}"
              oninput="window.updP('${id}','${k}',this.value); this.nextElementSibling.textContent=this.value;">
            <span class="prop-range-value">${numValue}</span>
          </div>
        </div>
      `;
    } else if (dropdownFields[k]) {
      const tip = tooltips[k] || '';
      html += `
        <div class="prop-row">
          <label class="prop-label" ${tip ? `title="${tip}"` : ''}>${k} ${tip ? '<span class="prop-help">?</span>' : ''}</label>
          <select class="prop-input prop-select" onchange="window.updP('${id}','${k}',this.value)">
            ${dropdownFields[k].map(opt => {
              const optLabel = opt === '' ? '(none)' : opt;
              return `<option value="${opt}" ${displayValue === opt ? 'selected' : ''}>${optLabel}</option>`;
            }).join('')}
          </select>
        </div>
      `;
    } else if (k === 'href' || k === 'ctaHref') {
      // Special href field with suggestions (project pages + recent URLs)
      const tip = tooltips[k] || 'Link URL (e.g. #home or https://...)';
      const suggestions = getHrefSuggestions();
      const datalistId = `href-list-${id}-${k}`;
      html += `
        <div class="prop-row prop-row--href">
          <label class="prop-label" title="${tip}">${k} <span class="prop-help">?</span></label>
          <input class="prop-input prop-input--url" value="${escapeHtml(displayValue)}" 
            list="${datalistId}"
            placeholder="#page or https://..."
            title="${escapeHtml(displayValue)}"
            onchange="window.handleHrefChange('${id}','${k}',this.value)">
          <datalist id="${datalistId}">
            ${suggestions.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
          </datalist>
          <small class="prop-url-preview">${escapeHtml(displayValue)}</small>
        </div>
      `;
    } else {
      const tip = tooltips[k] || '';
      html += `
        <div class="prop-row">
          <label class="prop-label" ${tip ? `title="${tip}"` : ''}>${k} ${tip ? '<span class="prop-help">?</span>' : ''}</label>
          <input class="prop-input" value="${escapeHtml(displayValue)}" 
            onchange="window.updP('${id}','${k}',this.value)">
        </div>
      `;
    }
  }
  
  return html;
}

// Handle avatar image selection
window.handleAvatarSelect = (id, value) => {
  const customInput = document.getElementById(`custom-src-${id}`);
  if (value === 'custom') {
    // Show custom input
    if (customInput) customInput.style.display = '';
  } else {
    // Hide custom input and update
    if (customInput) customInput.style.display = 'none';
    window.updP(id, 'src', value);
  }
};

// Handle autocomplete source list (textarea -> JSON array)
window.updateSourceList = (id, textValue) => {
  const items = textValue.split('\n').map(s => s.trim()).filter(Boolean);
  const jsonValue = JSON.stringify(items);
  window.updP(id, 'source', jsonValue);
};

// Handle href field changes - validates URL before accepting
window.handleHrefChange = async (id, key, value) => {
  const input = document.querySelector(`input[list="href-list-${id}-${key}"]`);
  
  // Show loading state
  if (input) {
    input.style.borderColor = 'var(--warning-color)';
    input.disabled = true;
  }
  
  // Validate the URL
  const result = await validateUrl(value);
  
  if (input) {
    input.disabled = false;
  }
  
  if (!result.valid) {
    // Show error - red border and error toast
    if (input) {
      input.style.borderColor = 'var(--danger-color)';
      input.classList.add('invalid-url');
    }
    showUrlError(`Invalid URL: ${result.reason}`);
    return; // Don't update the property
  }
  
  // Valid URL - green flash then normal
  if (input) {
    input.style.borderColor = 'var(--success-color)';
    input.classList.remove('invalid-url');
    setTimeout(() => {
      input.style.borderColor = '';
    }, 1000);
  }
  
  // Save external URLs to recent list
  if (value.startsWith('http://') || value.startsWith('https://')) {
    addRecentUrl(value);
  }
  
  // Update the property
  window.updP(id, key, value);
};

// =============================================================================
// CONTAINER CHILD MANAGEMENT FUNCTIONS
// =============================================================================

// Add a new child to container
window.addContainerChild = (parentId) => {
  const wrapper = document.getElementById(parentId);
  if (!wrapper) return;
  
  const c = JSON.parse(wrapper.dataset.c);
  if (!c.childTemplate) return;
  
  // Clone the template
  const newChild = { ...c.childTemplate };
  
  // Initialize children array if needed
  if (!c.children) c.children = [];
  c.children.push(newChild);
  
  // Save and re-render
  wrapper.dataset.c = JSON.stringify(c);
  rebuildContainerElement(wrapper, c);
  renderComponentList();
};

// Remove a child from container
window.removeContainerChild = (parentId, index) => {
  const wrapper = document.getElementById(parentId);
  if (!wrapper) return;
  
  const c = JSON.parse(wrapper.dataset.c);
  if (!c.children || index < 0 || index >= c.children.length) return;
  
  c.children.splice(index, 1);
  
  wrapper.dataset.c = JSON.stringify(c);
  rebuildContainerElement(wrapper, c);
  renderComponentList();
};

// Update a child's property
window.updateContainerChild = (parentId, index, field, value) => {
  const wrapper = document.getElementById(parentId);
  if (!wrapper) return;
  
  const c = JSON.parse(wrapper.dataset.c);
  if (!c.children || index < 0 || index >= c.children.length) return;
  
  c.children[index][field] = value;
  
  wrapper.dataset.c = JSON.stringify(c);
  rebuildContainerElement(wrapper, c);
  // Don't re-render list to avoid losing focus while typing
};

// Move a child up or down
window.moveContainerChild = (parentId, index, direction) => {
  const wrapper = document.getElementById(parentId);
  if (!wrapper) return;
  
  const c = JSON.parse(wrapper.dataset.c);
  if (!c.children) return;
  
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= c.children.length) return;
  
  // Swap
  [c.children[index], c.children[newIndex]] = [c.children[newIndex], c.children[index]];
  
  wrapper.dataset.c = JSON.stringify(c);
  rebuildContainerElement(wrapper, c);
  renderComponentList();
};

// Rebuild the actual DOM element for a container
function rebuildContainerElement(wrapper, c) {
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return;
  
  // Clear existing children
  el.innerHTML = '';
  
  // Rebuild children from config
  if (c.children && Array.isArray(c.children)) {
    c.children.forEach(child => {
      const childEl = document.createElement('div');
      if (child.title) childEl.dataset.title = child.title;
      if (child.tabTitle) childEl.dataset.tabTitle = child.tabTitle;
      if (child.content) childEl.innerHTML = child.content;
      if (child.text) childEl.textContent = child.text;
      el.appendChild(childEl);
    });
  }
  
  // Force re-render of the behavior
  delete el.dataset.wbReady;
  if (window.WB) {
    window.WB.remove(el);
    window.WB.scan(wrapper);
  }
  
  // Save history
  if (window.saveHist) window.saveHist();
}

// =============================================================================
// AUTO-EXTEND CANVAS
// =============================================================================
function autoExtendCanvas() {
  const frame = document.querySelector('.frame');
  const components = document.querySelectorAll('.dropped:not(.grid-child)');
  
  if (components.length === 0) {
    frame.style.minHeight = '600px';
    return;
  }
  
  const frameRect = frame.getBoundingClientRect();
  let maxBottom = 0;
  
  components.forEach(comp => {
    const rect = comp.getBoundingClientRect();
    const relativeBottom = (rect.bottom - frameRect.top) + 40;
    if (relativeBottom > maxBottom) maxBottom = relativeBottom;
  });
  
  const newHeight = Math.max(600, maxBottom);
  frame.style.minHeight = newHeight + 'px';
}

window.addEventListener('resize', autoExtendCanvas);
document.addEventListener('scroll', autoExtendCanvas);

// =============================================================================
// DRAG & DROP REORDERING
// =============================================================================
function reorderComponents(draggedId, targetId) {
  const canvas = document.getElementById('canvas');
  const dragged = document.getElementById(draggedId);
  const target = document.getElementById(targetId);
  
  if (!dragged || !target || !canvas) return;
  
  // Insert dragged before target
  canvas.insertBefore(dragged, target);
  
  // Save and re-render
  if (window.saveHist) window.saveHist();
  renderTree();
}

// Canvas drag-and-drop reordering
function initCanvasDragDrop() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  canvas.addEventListener('dragstart', (e) => {
    const dropped = e.target.closest('.dropped');
    if (dropped && !e.target.classList.contains('comp-item')) {
      dropped.classList.add('dragging');
      e.dataTransfer.setData('reorder', dropped.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  });
  
  canvas.addEventListener('dragend', (e) => {
    const dropped = e.target.closest('.dropped');
    if (dropped) {
      dropped.classList.remove('dragging');
      document.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
        el.classList.remove('drag-over-above', 'drag-over-below');
      });
    }
  });
  
  canvas.addEventListener('dragover', (e) => {
    const reorderId = e.dataTransfer.types.includes('reorder');
    if (!reorderId) return;
    
    e.preventDefault();
    const dropped = e.target.closest('.dropped');
    if (dropped && !dropped.classList.contains('dragging')) {
      const rect = dropped.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      
      dropped.classList.remove('drag-over-above', 'drag-over-below');
      if (e.clientY < midY) {
        dropped.classList.add('drag-over-above');
      } else {
        dropped.classList.add('drag-over-below');
      }
    }
  });
  
  canvas.addEventListener('dragleave', (e) => {
    const dropped = e.target.closest('.dropped');
    if (dropped) {
      dropped.classList.remove('drag-over-above', 'drag-over-below');
    }
  });
  
  canvas.addEventListener('drop', (e) => {
    const reorderId = e.dataTransfer.getData('reorder');
    if (!reorderId) return;
    
    e.preventDefault();
    const target = e.target.closest('.dropped');
    if (target && target.id !== reorderId) {
      const dragged = document.getElementById(reorderId);
      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      
      if (e.clientY < midY) {
        canvas.insertBefore(dragged, target);
      } else {
        canvas.insertBefore(dragged, target.nextSibling);
      }
      
      if (window.saveHist) window.saveHist();
      renderTree();
    }
    
    document.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below');
    });
  });
}

// Initialize canvas drag-drop after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCanvasDragDrop);
} else {
  initCanvasDragDrop();
}

// =============================================================================
// DOCS & SCHEMA VIEWER
// =============================================================================
window.openDocs = async (behavior, tab = 'docs') => {
  currentDocsComponent = behavior;
  const modal = document.getElementById('docsModal');
  const titleEl = document.getElementById('docsModalTitle');
  const bodyEl = document.getElementById('docsModalBody');
  
  if (!modal || !bodyEl) return;
  
  titleEl.textContent = behavior.charAt(0).toUpperCase() + behavior.slice(1);
  modal.classList.add('open');
  
  // Set active tab
  document.querySelectorAll('.docs-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Load content
  await loadDocsContent(behavior, tab);
};

window.switchDocsTab = async (tab) => {
  document.querySelectorAll('.docs-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  if (currentDocsComponent) {
    await loadDocsContent(currentDocsComponent, tab);
  }
};

window.closeDocsModal = () => {
  const modal = document.getElementById('docsModal');
  if (modal) modal.classList.remove('open');
  currentDocsComponent = null;
};

async function loadDocsContent(behavior, tab) {
  const bodyEl = document.getElementById('docsModalBody');
  if (!bodyEl) return;
  
  bodyEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted)">🔄 Loading...</div>';
  
  try {
    if (tab === 'docs') {
      // Load markdown docs
      const response = await fetch(`src/behaviors/docs/${behavior}.md`);
      if (response.ok) {
        const markdown = await response.text();
        const html = await renderMarkdown(markdown);
        bodyEl.innerHTML = `<div class="docs-content">${html}</div>`;
      } else {
        bodyEl.innerHTML = `
          <div style="text-align:center;padding:2rem;">
            <div style="font-size:3rem;opacity:0.5;margin-bottom:1rem">📝</div>
            <h3>No documentation found</h3>
            <p style="color:var(--text-muted)">Documentation for <code>${behavior}</code> is not yet available.</p>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-top:1rem">
              Expected path: <code>src/behaviors/docs/${behavior}.md</code>
            </p>
          </div>
        `;
      }
    } else if (tab === 'schema') {
      // Load JSON schema
      const response = await fetch(`src/behaviors/schema/${behavior}.schema.json`);
      if (response.ok) {
        const schema = await response.json();
        bodyEl.innerHTML = renderSchemaViewer(schema, behavior);
      } else {
        bodyEl.innerHTML = `
          <div style="text-align:center;padding:2rem;">
            <div style="font-size:3rem;opacity:0.5;margin-bottom:1rem">📋</div>
            <h3>No schema found</h3>
            <p style="color:var(--text-muted)">Schema for <code>${behavior}</code> is not yet defined.</p>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-top:1rem">
              Expected path: <code>src/behaviors/schema/${behavior}.schema.json</code>
            </p>
          </div>
        `;
      }
    }
  } catch (err) {
    bodyEl.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--danger-color)">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h3>Error loading content</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

// Render markdown using marked.js (loaded dynamically)
async function renderMarkdown(md) {
  try {
    const marked = await loadMarked();
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true
    });
    return marked.parse(md);
  } catch (err) {
    console.error('[Docs] Failed to load marked.js:', err);
    // Fallback to simple rendering
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^\* (.+)$/gim, '<li>$1</li>')
      .replace(/^- (.+)$/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>');
  }
}

// Schema viewer renderer
function renderSchemaViewer(schema, behavior) {
  let html = `<div class="schema-viewer">`;
  
  // Header info
  html += `<h2 style="margin-top:0">📋 ${behavior} Schema</h2>`;
  if (schema.description) {
    html += `<p style="color:var(--text-secondary)">${schema.description}</p>`;
  }
  
  // Properties
  if (schema.properties) {
    html += `<h3>Properties</h3>`;
    for (const [name, prop] of Object.entries(schema.properties)) {
      const typeStr = getTypeString(prop);
      const required = schema.required?.includes(name) ? ' <span style="color:var(--danger-color)">(required)</span>' : '';
      
      html += `
        <div class="schema-prop">
          <span class="schema-prop-name">${name}</span>
          <span class="schema-prop-type">${typeStr}</span>
          ${required}
          ${prop.description ? `<div class="schema-prop-desc">${prop.description}</div>` : ''}
          ${prop.default !== undefined ? `<div class="schema-prop-desc">Default: <code>${JSON.stringify(prop.default)}</code></div>` : ''}
          ${prop.enum ? `<div class="schema-prop-desc">Options: ${prop.enum.map(e => `<code>${e}</code>`).join(', ')}</div>` : ''}
          ${prop.minimum !== undefined ? `<div class="schema-prop-desc">Min: ${prop.minimum}</div>` : ''}
          ${prop.maximum !== undefined ? `<div class="schema-prop-desc">Max: ${prop.maximum}</div>` : ''}
        </div>
      `;
    }
  }
  
  // Raw JSON
  html += `
    <details style="margin-top:1.5rem">
      <summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem">View raw JSON</summary>
      <pre style="margin-top:0.5rem;font-size:0.8rem">${JSON.stringify(schema, null, 2)}</pre>
    </details>
  `;
  
  html += `</div>`;
  return html;
}

function getTypeString(prop) {
  if (prop.enum) return 'enum';
  if (prop.type === 'array') return `array<${prop.items?.type || 'any'}>`;
  return prop.type || 'any';
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDocsModal();
  }
});

// Close modal on backdrop click
document.getElementById('docsModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'docsModal') {
    closeDocsModal();
  }
});

// =============================================================================
// INLINE PROPERTY VALIDATION
// =============================================================================
async function getSchema(behavior) {
  if (schemaCache[behavior]) return schemaCache[behavior];
  
  try {
    const response = await fetch(`src/behaviors/schema/${behavior}.schema.json`);
    if (response.ok) {
      const schema = await response.json();
      schemaCache[behavior] = schema;
      return schema;
    }
  } catch (err) {
    console.warn(`[TreeValidation] No schema for ${behavior}`);
  }
  return null;
}

function validatePropertyValue(value, propSchema) {
  if (!propSchema) return { valid: true, errors: [] };
  
  const errors = [];
  const type = propSchema.type;
  
  // Empty values
  if (value === '' || value === null || value === undefined) {
    return { valid: !propSchema.required, errors: propSchema.required ? [{ message: 'Required field' }] : [] };
  }
  
  switch (type) {
    case 'number':
    case 'integer':
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push({ message: 'Must be a number' });
      } else {
        if (type === 'integer' && !Number.isInteger(num)) {
          errors.push({ message: 'Must be an integer' });
        }
        if (propSchema.minimum !== undefined && num < propSchema.minimum) {
          errors.push({ message: `Min: ${propSchema.minimum}` });
        }
        if (propSchema.maximum !== undefined && num > propSchema.maximum) {
          errors.push({ message: `Max: ${propSchema.maximum}` });
        }
      }
      break;
      
    case 'string':
      if (propSchema.minLength && value.length < propSchema.minLength) {
        errors.push({ message: `Min length: ${propSchema.minLength}` });
      }
      if (propSchema.maxLength && value.length > propSchema.maxLength) {
        errors.push({ message: `Max length: ${propSchema.maxLength}` });
      }
      if (propSchema.pattern && !new RegExp(propSchema.pattern).test(value)) {
        errors.push({ message: 'Invalid format' });
      }
      break;
  }
  
  // Enum validation
  if (propSchema.enum && !propSchema.enum.includes(value)) {
    errors.push({ message: `Must be: ${propSchema.enum.join(', ')}` });
  }
  
  return { valid: errors.length === 0, errors };
}

// Validate and style input
async function validateInput(input, behavior, propName, value) {
  const schema = await getSchema(behavior);
  if (!schema || !schema.properties || !schema.properties[propName]) {
    input.classList.remove('invalid', 'valid');
    return true;
  }
  
  const result = validatePropertyValue(value, schema.properties[propName]);
  
  input.classList.toggle('invalid', !result.valid);
  input.classList.toggle('valid', result.valid && value !== '');
  
  // Update title with error messages
  if (!result.valid && result.errors.length > 0) {
    input.title = result.errors.map(e => e.message).join(', ');
  } else {
    input.title = '';
  }
  
  return result.valid;
}

// Make validateInput available globally for inline handlers
window.validateTreeInput = validateInput;

// =============================================================================
// RIGHT-CLICK CONTEXT MENU FOR PANEL ITEMS
// =============================================================================
function showPanelContextMenu(x, y, behavior, componentName) {
  // Remove existing menu
  document.getElementById('panelContextMenu')?.remove();
  
  const menu = document.createElement('div');
  menu.id = 'panelContextMenu';
  menu.className = 'panel-context-menu';
  menu.innerHTML = `
    <button class="panel-ctx-item" data-action="docs">
      <span>📖</span> View Docs
    </button>
    <button class="panel-ctx-item" data-action="schema">
      <span>📋</span> View Schema
    </button>
  `;
  
  // Position menu
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    z-index: 1000;
  `;
  
  // Handle clicks
  menu.querySelectorAll('.panel-ctx-item').forEach(item => {
    item.onclick = () => {
      const action = item.dataset.action;
      menu.remove();
      if (action === 'docs') {
        openDocs(behavior, 'docs');
      } else if (action === 'schema') {
        openDocs(behavior, 'schema');
      }
    };
  });
  
  document.body.appendChild(menu);
  
  // Adjust position if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
  
  // Close on click outside
  setTimeout(() => {
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
        document.removeEventListener('contextmenu', closeMenu);
      }
    };
    document.addEventListener('click', closeMenu);
    document.addEventListener('contextmenu', closeMenu);
  }, 0);
}

// Add context menu listener for panel-right
document.addEventListener('contextmenu', (e) => {
  // Check if right-click is on a panel item
  const panelItem = e.target.closest('.panel-item');
  const panelRight = e.target.closest('.panel-right');
  
  if (panelItem && panelRight) {
    e.preventDefault();
    
    // Get component data from the canvas element
    const compId = panelItem.dataset.id;
    const wrapper = document.getElementById(compId);
    
    if (wrapper) {
      const c = JSON.parse(wrapper.dataset.c);
      showPanelContextMenu(e.clientX, e.clientY, c.b, c.n);
    }
  }
});

// Inject context menu styles
(function injectContextMenuStyles() {
  if (document.getElementById('panel-context-menu-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'panel-context-menu-styles';
  style.textContent = `
    .panel-context-menu {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.4rem 0;
      min-width: 160px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      animation: panelCtxFadeIn 0.15s ease;
    }
    
    @keyframes panelCtxFadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .panel-ctx-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.6rem 1rem;
      background: none;
      border: none;
      color: var(--text-primary);
      font-size: 0.85rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
    }
    
    .panel-ctx-item:hover {
      background: var(--bg-tertiary);
    }
    
    .panel-ctx-item:first-child {
      border-radius: 6px 6px 0 0;
    }
    
    .panel-ctx-item:last-child {
      border-radius: 0 0 6px 6px;
    }
    
    .panel-ctx-item span {
      font-size: 1rem;
    }
    
    /* Docs content styling */
    .docs-content {
      line-height: 1.7;
    }
    
    .docs-content h1 {
      font-size: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .docs-content h2 {
      font-size: 1.25rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: var(--primary);
    }
    
    .docs-content h3 {
      font-size: 1.1rem;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
    }
    
    .docs-content code {
      background: var(--bg-tertiary);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85em;
      font-family: 'Consolas', 'Monaco', monospace;
    }
    
    .docs-content pre {
      background: var(--bg-tertiary);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    
    .docs-content pre code {
      background: none;
      padding: 0;
    }
    
    .docs-content ul, .docs-content ol {
      padding-left: 1.5rem;
      margin: 0.75rem 0;
    }
    
    .docs-content li {
      margin: 0.35rem 0;
    }
    
    .docs-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    
    .docs-content th, .docs-content td {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      text-align: left;
    }
    
    .docs-content th {
      background: var(--bg-secondary);
      font-weight: 600;
    }
    
    .docs-content blockquote {
      border-left: 3px solid var(--primary);
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      background: var(--bg-secondary);
      border-radius: 0 6px 6px 0;
    }
    
    .docs-content a {
      color: var(--primary);
    }
    
    .docs-content a:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);
})();
