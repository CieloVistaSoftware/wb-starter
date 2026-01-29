/**
 * Builder Editor Toolbar
 * CKEditor-style toolbar for page editing
 * 
 * SPECS (2026-01-20):
 * - Text elements MUST have default lorem ipsum content
 * - Properties panel MUST be vertical/columnar layout (never horizontal)
 * - Text content textarea MUST auto-grow as user types
 * - Inline styles are OPTIONAL (shown as comment placeholder)
 * - Each element has theme selector dropdown
 * - Text content updates LIVE as user types (no blur required)
 * - +Element and +Component buttons ALWAYS add to selected element or canvas end
 * 
 * DEV MODE: No alerts/prompts - everything is inline
 */

// Lorem ipsum for text elements
const LOREM_SHORT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
const LOREM_MEDIUM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

// HTML5 Semantic Elements - FLAT DISPLAY (no hiding in submenus)
const HTML_ELEMENTS = {
  structure: {
    label: '📦 Structure',
    items: [
      { tag: 'div', label: 'div' },
      { tag: 'section', label: 'section' },
      { tag: 'article', label: 'article' },
      { tag: 'main', label: 'main' },
      { tag: 'header', label: 'header' },
      { tag: 'footer', label: 'footer' },
      { tag: 'nav', label: 'nav' },
      { tag: 'aside', label: 'aside' }
    ]
  },
  text: {
    label: '📝 Text',
    items: [
      { tag: 'p', label: 'p' },
      { tag: 'h1', label: 'h1' },
      { tag: 'h2', label: 'h2' },
      { tag: 'h3', label: 'h3' },
      { tag: 'h4', label: 'h4' },
      { tag: 'span', label: 'span' },
      { tag: 'blockquote', label: 'blockquote' },
      { tag: 'pre', label: 'pre' }
    ]
  },
  inline: {
    label: '🔗 Inline',
    items: [
      { tag: 'a', label: 'a' },
      { tag: 'strong', label: 'strong' },
      { tag: 'em', label: 'em' },
      { tag: 'code', label: 'code' },
      { tag: 'mark', label: 'mark' }
    ]
  },
  lists: {
    label: '📋 Lists',
    items: [
      { tag: 'ul', label: 'ul' },
      { tag: 'ol', label: 'ol' },
      { tag: 'li', label: 'li' }
    ]
  },
  table: {
    label: '📊 Table',
    items: [
      { tag: 'table', label: 'table' },
      { tag: 'tr', label: 'tr' },
      { tag: 'th', label: 'th' },
      { tag: 'td', label: 'td' }
    ]
  },
  forms: {
    label: '📝 Forms',
    items: [
      { tag: 'form', label: 'form' },
      { tag: 'input', label: 'input' },
      { tag: 'textarea', label: 'textarea' },
      { tag: 'select', label: 'select' },
      { tag: 'button', label: 'button' },
      { tag: 'label', label: 'label' }
    ]
  },
  media: {
    label: '🖼️ Media',
    items: [
      { tag: 'img', label: 'img' },
      { tag: 'video', label: 'video' },
      { tag: 'audio', label: 'audio' },
      { tag: 'iframe', label: 'iframe' }
    ]
  }
};

// Available themes
const AVAILABLE_THEMES = [
  { value: '', label: 'Default (inherit)' },
  { value: 'wb-dark', label: 'Dark' },
  { value: 'wb-light', label: 'Light' },
  { value: 'wb-ocean', label: 'Ocean' },
  { value: 'wb-forest', label: 'Forest' },
  { value: 'wb-sunset', label: 'Sunset' },
  { value: 'wb-midnight', label: 'Midnight' }
];

// X-attributes (Alpine.js style)
const X_ATTRIBUTES = [
  { attr: 'x-data', label: 'x-data', desc: 'Reactive data' },
  { attr: 'x-bind', label: 'x-bind', desc: 'Bind attr' },
  { attr: 'x-on', label: 'x-on', desc: 'Events' },
  { attr: 'x-text', label: 'x-text', desc: 'Text content' },
  { attr: 'x-model', label: 'x-model', desc: '2-way bind' },
  { attr: 'x-show', label: 'x-show', desc: 'Toggle' },
  { attr: 'x-if', label: 'x-if', desc: 'Conditional' },
  { attr: 'x-for', label: 'x-for', desc: 'Loop' }
];

// Current state
let currentPage = 'home';
let selectedElement = null;
let selectedWrapper = null;
let activeDropdown = null;
let customElementsSchema = null;

// WB Component attributes (layout components)
const WB_COMPONENT_ATTRS = {
  'wb-grid': {
    description: 'Grid layout',
    categories: {
      '📐 Layout': [
        { name: 'columns', type: 'select', options: ['1', '2', '3', '4', '5', '6', 'auto-fit', 'auto-fill'], default: '3' },
        { name: 'gap', type: 'text', default: '1rem' },
        { name: 'min-width', type: 'text', default: '200px' }
      ]
    }
  },
  'wb-flex': {
    description: 'Flexbox layout',
    categories: {
      '📐 Layout': [
        { name: 'direction', type: 'select', options: ['row', 'row-reverse', 'column', 'column-reverse'], default: 'row' },
        { name: 'wrap', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'], default: 'nowrap' },
        { name: 'justify', type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around'], default: 'flex-start' },
        { name: 'align', type: 'select', options: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'], default: 'stretch' },
        { name: 'gap', type: 'text', default: '1rem' }
      ]
    }
  },
  'wb-stack': {
    description: 'Vertical stack',
    categories: {
      '📐 Layout': [
        { name: 'gap', type: 'text', default: '1rem' },
        { name: 'align', type: 'select', options: ['start', 'center', 'end', 'stretch'], default: 'stretch' }
      ]
    }
  },
  'wb-container': {
    description: 'Centered container',
    categories: {
      '📐 Layout': [
        { name: 'max-width', type: 'text', default: '1200px' },
        { name: 'padding', type: 'text', default: '1rem' }
      ]
    }
  },
  'wb-sidebar': {
    description: 'Sidebar layout',
    categories: {
      '📐 Layout': [
        { name: 'side', type: 'select', options: ['left', 'right'], default: 'left' },
        { name: 'side-width', type: 'text', default: '300px' },
        { name: 'gap', type: 'text', default: '1rem' }
      ]
    }
  }
};

/**
 * Initialize the editor toolbar
 */
function initEditorToolbar() {
  console.log('[EditorToolbar] Init');
  populateDropdowns();
  loadCustomElementsSchema();
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.toolbar-dropdown') && !e.target.closest('.toolbar-btn')) {
      closeAllDropdowns();
    }
  });
  
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Load custom-elements.json schema
 */
async function loadCustomElementsSchema() {
  try {
    const response = await fetch('data/custom-elements.json');
    if (response.ok) {
      customElementsSchema = await response.json();
      console.log('[EditorToolbar] Schema loaded');
    }
  } catch (err) {
    console.warn('[EditorToolbar] Schema load failed:', err);
  }
}

/**
 * Get component attributes from schema or fallback
 */
function getComponentAttributes(tagName) {
  const tag = tagName.toLowerCase();
  
  if (WB_COMPONENT_ATTRS[tag]) {
    return WB_COMPONENT_ATTRS[tag];
  }
  
  if (customElementsSchema?.modules) {
    for (const module of customElementsSchema.modules) {
      for (const decl of module.declarations || []) {
        if (decl.tagName === tag && decl.attributes?.length > 0) {
          const categories = {};
          decl.attributes.forEach(attr => {
            const catName = getCategoryForAttribute(attr.name);
            if (!categories[catName]) categories[catName] = [];
            
            const attrDef = {
              name: attr.name.replace('data-', ''),
              default: attr.default || ''
            };
            
            const typeText = attr.type?.text || '';
            if (typeText.includes('|')) {
              attrDef.type = 'select';
              attrDef.options = typeText.split('|').map(s => s.trim());
            } else if (typeText === 'boolean') {
              attrDef.type = 'boolean';
            } else {
              attrDef.type = 'text';
            }
            
            categories[catName].push(attrDef);
          });
          
          return { description: decl.description || tag, categories };
        }
      }
    }
  }
  
  return null;
}

function getCategoryForAttribute(attrName) {
  const name = attrName.toLowerCase().replace('data-', '');
  if (['variant', 'size', 'color', 'theme'].some(k => name.includes(k))) return '🎨 Appearance';
  if (['columns', 'gap', 'width', 'height', 'align', 'justify'].some(k => name.includes(k))) return '📐 Layout';
  if (['src', 'href', 'url', 'image', 'icon'].some(k => name.includes(k))) return '🔗 Media';
  if (['title', 'subtitle', 'label', 'text', 'content'].some(k => name.includes(k))) return '📝 Content';
  return '⚙️ Properties';
}

function populateDropdowns() {
  const elementEl = document.getElementById('dropdown-element');
  const componentEl = document.getElementById('dropdown-component');
  const xattrEl = document.getElementById('dropdown-xattr-props');
  
  if (elementEl) elementEl.innerHTML = buildElementDropdown();
  if (componentEl) componentEl.innerHTML = buildComponentDropdown();
  if (xattrEl) xattrEl.innerHTML = buildXAttrDropdown();
}

function handleKeyboardShortcuts(e) {
  if (!e.metaKey && !e.ctrlKey) return;
  
  switch (e.key.toLowerCase()) {
    case 'b': e.preventDefault(); applyFormat('strong'); break;
    case 'i': e.preventDefault(); applyFormat('em'); break;
    case 'u': e.preventDefault(); applyFormat('u'); break;
    case 'z': e.preventDefault(); if (e.shiftKey) redo(); else undo(); break;
  }
}

function toggleDropdown(dropdownId, buttonEl) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) {
    console.error('[EditorToolbar] Dropdown not found:', dropdownId);
    return;
  }
  
  const isOpen = dropdown.classList.contains('open');
  closeAllDropdowns();
  
  if (!isOpen) {
    dropdown.classList.add('open');
    activeDropdown = dropdownId;
    const rect = buttonEl.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (rect.bottom + 2) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.zIndex = '10000';
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.toolbar-dropdown.open').forEach(d => d.classList.remove('open'));
  const menu = document.getElementById('add-child-menu');
  if (menu) menu.classList.remove('open');
  activeDropdown = null;
}

/**
 * Build Element dropdown - FLAT LAYOUT (category + items visible)
 */
function buildElementDropdown() {
  let html = '<div class="dropdown-flat">';
  
  Object.entries(HTML_ELEMENTS).forEach(([catKey, cat]) => {
    html += `<div class="dropdown-category">`;
    html += `<div class="dropdown-category-label">${cat.label}</div>`;
    html += `<div class="dropdown-category-items">`;
    cat.items.forEach(item => {
      html += `<button class="dropdown-item-flat" onclick="EditorToolbar.insertElement('${item.tag}')">&lt;${item.tag}&gt;</button>`;
    });
    html += `</div></div>`;
  });
  
  html += '</div>';
  return html;
}

/**
 * Build Component dropdown - FLAT LAYOUT
 */
function buildComponentDropdown() {
  const components = typeof window.builderComponents !== 'undefined' 
    ? window.builderComponents 
    : [
      { name: 'card', tag: 'wb-card', category: 'content', icon: '📇' },
      { name: 'grid', tag: 'wb-grid', category: 'layout', icon: '🔲' },
      { name: 'flex', tag: 'wb-flex', category: 'layout', icon: '↔️' },
      { name: 'stack', tag: 'wb-stack', category: 'layout', icon: '📚' },
      { name: 'container', tag: 'wb-container', category: 'layout', icon: '📦' },
      { name: 'tabs', tag: 'wb-tabs', category: 'content', icon: '📑' },
      { name: 'hero', tag: 'wb-cardhero', category: 'content', icon: '🦸' },
      { name: 'profile', tag: 'wb-cardprofile', category: 'content', icon: '👤' },
      { name: 'pricing', tag: 'wb-cardpricing', category: 'content', icon: '💰' },
      { name: 'header', tag: 'wb-header', category: 'page', icon: '🔝' },
      { name: 'footer', tag: 'wb-footer', category: 'page', icon: '🔻' }
    ];
  
  const categories = {};
  components.forEach(comp => {
    const cat = comp.category || 'other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(comp);
  });
  
  let html = '<div class="dropdown-flat">';
  
  Object.entries(categories).forEach(([catName, items]) => {
    html += `<div class="dropdown-category">`;
    html += `<div class="dropdown-category-label">${catName.charAt(0).toUpperCase() + catName.slice(1)}</div>`;
    html += `<div class="dropdown-category-items">`;
    items.forEach(comp => {
      html += `<button class="dropdown-item-flat" onclick="EditorToolbar.insertComponent('${comp.tag}')">${comp.icon} ${comp.name}</button>`;
    });
    html += `</div></div>`;
  });
  
  html += '</div>';
  return html;
}

function buildXAttrDropdown() {
  let html = '<div class="dropdown-flat"><div class="dropdown-category">';
  html += '<div class="dropdown-category-label">x-attributes</div>';
  html += '<div class="dropdown-category-items">';
  X_ATTRIBUTES.forEach(item => {
    html += `<button class="dropdown-item-flat" onclick="EditorToolbar.addXAttribute('${item.attr}')" title="${item.desc}">${item.label}</button>`;
  });
  html += '</div></div></div>';
  return html;
}

function filterComponents(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#dropdown-component .dropdown-item-flat').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(q) ? '' : 'none';
  });
}

function selectPage(pageName) {
  currentPage = pageName;
  closeAllDropdowns();
  const btn = document.querySelector('.page-selector-btn');
  if (btn) btn.innerHTML = `📄 ${pageName} <span class="dropdown-caret">▼</span>`;
  if (typeof switchToPage === 'function') switchToPage(pageName);
}

/**
 * Insert element - ALWAYS adds to canvas end (main toolbar behavior)
 * Use addChildElement() when adding inside a specific component
 */
function insertElement(tag) {
  closeAllDropdowns();
  const element = createElementWithDefaults(tag);
  // Main toolbar: always add to canvas end, not inside selected element
  addElementToCanvas(element, tag);
}

/**
 * Insert component - ALWAYS adds to canvas end (main toolbar behavior)
 * Use addChildComponent() when adding inside a specific component
 */
function insertComponent(tag) {
  closeAllDropdowns();
  const element = document.createElement(tag);
  element.id = generateElementId(tag);
  // Special-case: provide sensible defaults for components that need children
  if (tag === 'wb-tabs') {
    element.innerHTML = `
      <wb-tab label="Tab 1">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</wb-tab>
      <wb-tab label="Tab 2">Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</wb-tab>
      <wb-tab label="Tab 3">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</wb-tab>
    `;
  }
  // Main toolbar: always add to canvas end, not inside selected element
  addElementToCanvas(element, tag);
}

/**
 * Generate unique element ID
 */
function generateElementId(tag) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `${tag}-${timestamp}-${random}`;
}

/**
 * Create element with sensible defaults
 * SPEC: Text elements MUST have lorem ipsum
 */
function createElementWithDefaults(tag) {
  const el = document.createElement(tag);
  
  // Always assign a unique ID
  el.id = generateElementId(tag);
  
  switch (tag) {
    // Text elements - ALWAYS lorem ipsum
    case 'p': 
      el.textContent = LOREM_SHORT; 
      break;
    case 'h1': 
      el.textContent = 'Main Heading Title'; 
      break;
    case 'h2': 
      el.textContent = 'Section Heading'; 
      break;
    case 'h3': 
      el.textContent = 'Subsection Heading'; 
      break;
    case 'h4': 
      el.textContent = 'Minor Heading'; 
      break;
    case 'span': 
      el.textContent = 'Inline text'; 
      break;
    case 'blockquote': 
      el.textContent = LOREM_MEDIUM; 
      break;
    case 'pre': 
      el.textContent = '// Code block\nconst example = "hello";'; 
      break;
    case 'code':
      el.textContent = 'code snippet';
      break;
    case 'strong':
      el.textContent = 'bold text';
      break;
    case 'em':
      el.textContent = 'emphasized text';
      break;
    case 'mark':
      el.textContent = 'highlighted text';
      break;
      
    // Interactive elements
    case 'a': 
      el.href = '#'; 
      el.textContent = 'Link Text'; 
      break;
    case 'button': 
      el.textContent = 'Button'; 
      el.type = 'button'; 
      break;
    case 'input': 
      el.type = 'text'; 
      el.placeholder = 'Enter text...'; 
      break;
    case 'textarea':
      el.placeholder = 'Enter longer text...';
      el.rows = 3;
      break;
    case 'label':
      el.textContent = 'Label';
      break;
      
    // Media
    case 'img': 
      el.src = 'https://via.placeholder.com/400x200?text=Image'; 
      el.alt = 'Placeholder image'; 
      break;
    case 'video':
      el.controls = true;
      el.style.width = '100%';
      break;
    case 'audio':
      el.controls = true;
      break;
    case 'iframe':
      el.src = 'about:blank';
      el.style.width = '100%';
      el.style.height = '300px';
      el.style.border = '1px solid #ccc';
      break;
      
    // Lists
    case 'ul': 
    case 'ol': 
      el.innerHTML = '<li>First item</li><li>Second item</li><li>Third item</li>'; 
      break;
    case 'li':
      el.textContent = 'List item';
      break;
      
    // Tables
    case 'table': 
      el.innerHTML = '<thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Cell A</td><td>Cell B</td></tr></tbody>'; 
      break;
    case 'tr':
      el.innerHTML = '<td>Cell</td><td>Cell</td>';
      break;
    case 'th':
    case 'td':
      el.textContent = 'Cell';
      break;
      
    // Structure elements
    default:
      if (['div', 'section', 'article', 'main', 'header', 'footer', 'nav', 'aside', 'form'].includes(tag)) {
        // Container elements - minimal placeholder, NOT lorem
        el.dataset.placeholder = `${tag} container`;
      }
  }
  
  return el;
}

/**
 * Create component overlay HTML with action buttons
 */
function createOverlayHTML(wrapperId, tag) {
  return `
    <div class="component-overlay">
      <span class="component-label">&lt;${tag}&gt;</span>
      <div class="component-actions">
        <button class="action-btn" onclick="event.stopPropagation(); EditorToolbar.showAddChildMenu('${wrapperId}', 'element', this)" title="Add child element">+ Element</button>
        <button class="action-btn action-btn-alt" onclick="event.stopPropagation(); EditorToolbar.showAddChildMenu('${wrapperId}', 'component', this)" title="Add child component">+ Component</button>
        <button class="view-btn active" mode="render" onclick="event.stopPropagation(); EditorToolbar.setViewMode('${wrapperId}', 'render')" title="Render view">👁️</button>
        <button class="view-btn" mode="html" onclick="event.stopPropagation(); EditorToolbar.setViewMode('${wrapperId}', 'html')" title="HTML view">&lt;/&gt;</button>
      </div>
      <button class="component-delete-btn" onclick="event.stopPropagation(); EditorToolbar.removeElement('${wrapperId}')">🗑️</button>
    </div>
    <div class="component-content"></div>
    <pre class="component-html-view" style="display:none;"></pre>
  `;
}

/**
 * Get the canvas container
 */
function getCanvasContainer() {
  return document.getElementById('main-container') || 
         document.getElementById('canvas-elements') ||
         document.querySelector('.canvas-elements');
}

/**
 * Add element to canvas
 */
function addElementToCanvas(element, tag) {
  const container = getCanvasContainer();
  if (!container) {
    console.error('[EditorToolbar] No canvas container found');
    return;
  }
  
  // Hide empty state
  const emptyState = container.querySelector('.canvas-empty-state, .canvas-drop-zone');
  if (emptyState) emptyState.style.display = 'none';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'canvas-component';
  wrapper.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  wrapper.tabIndex = 0;
  wrapper.dataset.viewMode = 'render';
  wrapper.dataset.tag = tag;
  
  wrapper.innerHTML = createOverlayHTML(wrapper.id, tag);
  wrapper.querySelector('.component-content').appendChild(element);
  
  wrapper.addEventListener('click', (e) => {
    if (!e.target.closest('.action-btn') && 
        !e.target.closest('.view-btn') && 
        !e.target.closest('.component-delete-btn')) {
      e.stopPropagation();
      selectElement(wrapper);
    }
  });
  
  container.appendChild(wrapper);
  selectElement(wrapper);
  updateElementCount();
  
  console.log('[EditorToolbar] Added to canvas:', tag);
}

/**
 * Add element as child of wrapper
 */
function addAsChild(parentWrapper, element, tag) {
  const content = parentWrapper.querySelector('.component-content');
  if (!content) {
    console.error('[EditorToolbar] No content container in parent');
    return;
  }
  
  const wrapper = document.createElement('div');
  wrapper.className = 'canvas-component canvas-component-child';
  wrapper.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  wrapper.tabIndex = 0;
  wrapper.dataset.viewMode = 'render';
  wrapper.dataset.tag = tag;
  wrapper.dataset.parent = parentWrapper.id;
  
  wrapper.innerHTML = createOverlayHTML(wrapper.id, tag);
  wrapper.querySelector('.component-content').appendChild(element);
  
  wrapper.addEventListener('click', (e) => {
    if (!e.target.closest('.action-btn') && 
        !e.target.closest('.view-btn') && 
        !e.target.closest('.component-delete-btn')) {
      e.stopPropagation();
      selectElement(wrapper);
    }
  });
  
  content.appendChild(wrapper);
  selectElement(wrapper);
  updateElementCount();
  
  console.log('[EditorToolbar] Added as child:', tag, 'to', parentWrapper.id);
}

/**
 * Set view mode: 'render' or 'html'
 */
function setViewMode(wrapperId, mode) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;
  
  wrapper.dataset.viewMode = mode;
  const content = wrapper.querySelector('.component-content');
  const htmlView = wrapper.querySelector('.component-html-view');
  const btns = wrapper.querySelectorAll('.view-btn');
  
  btns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  
  if (mode === 'html') {
    content.style.display = 'none';
    htmlView.style.display = 'block';
    const html = content.innerHTML;
    htmlView.textContent = formatHTML(html);
  } else {
    content.style.display = '';
    htmlView.style.display = 'none';
  }
}

/**
 * Simple HTML formatter
 */
function formatHTML(html) {
  let formatted = '';
  let indent = 0;
  const tokens = html.replace(/>\s*</g, '>\n<').split('\n');
  
  tokens.forEach(token => {
    if (token.match(/^<\/\w/)) indent--;
    formatted += '  '.repeat(Math.max(0, indent)) + token.trim() + '\n';
    if (token.match(/^<\w[^>]*[^\/]>$/)) indent++;
  });
  
  return formatted.trim();
}

function removeElement(id) {
  const el = document.getElementById(id);
  if (el) {
    el.remove();
    selectedElement = null;
    selectedWrapper = null;
    updateElementCount();
    
    // Clear properties panel
    const panel = document.getElementById('propertiesPanel');
    if (panel) panel.innerHTML = '<div class="properties-empty">Select an element to edit</div>';
    
    // Show empty state if needed
    const container = getCanvasContainer();
    if (container) {
      const remaining = container.querySelectorAll('.canvas-component');
      if (remaining.length === 0) {
        const emptyState = container.querySelector('.canvas-empty-state, .canvas-drop-zone');
        if (emptyState) emptyState.style.display = '';
      }
    }
  }
}

function selectElement(wrapper) {
  // Deselect previous
  document.querySelectorAll('.canvas-component.selected').forEach(el => el.classList.remove('selected'));
  
  wrapper.classList.add('selected');
  selectedWrapper = wrapper;
  selectedElement = wrapper.querySelector('.component-content > *');
  
  const xattrSection = document.getElementById('xAttrSection');
  if (xattrSection) xattrSection.style.display = '';
  
  updatePropertiesPanel(wrapper);
}

function updateElementCount() {
  const container = getCanvasContainer();
  if (!container) return;
  
  const count = container.querySelectorAll('.canvas-component').length;
  
  // Update multiple possible status elements
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = `${count} element${count !== 1 ? 's' : ''}`;
  
  const countEl = document.getElementById('componentCount');
  if (countEl) countEl.textContent = `${count} component${count !== 1 ? 's' : ''}`;
}

/**
 * Update properties panel - COLUMNAR LAYOUT
 * SPEC: All property rows must be vertical (label above input)
 * SPEC: Text content must auto-grow
 * SPEC: Live update as user types
 */
function updatePropertiesPanel(wrapper) {
  const panel = document.getElementById('propertiesPanel');
  if (!panel) return;
  
  const label = wrapper.querySelector('.component-label')?.textContent || 'Element';
  const content = wrapper.querySelector('.component-content > *');
  const tag = content?.tagName?.toLowerCase() || 'unknown';
  
  const isWBComponent = tag.startsWith('wb-');
  const componentDef = isWBComponent ? getComponentAttributes(tag) : null;
  
  let html = `
    <div class="prop-header prop-header--vertical">
      <span class="prop-header-icon">${isWBComponent ? '🧩' : '🎯'}</span>
      <div class="prop-header-info">
        <div class="prop-header-name">${label}</div>
        <div class="prop-header-id">#${wrapper.id}</div>
      </div>
    </div>
  `;
  
  if (componentDef?.description) {
    html += `<div class="prop-desc">${componentDef.description}</div>`;
  }
  
  // Text Content - SPEC: Auto-grow, live update (moved to top)
  const skipContent = ['wb-grid', 'wb-flex', 'wb-stack', 'wb-container', 'wb-tabs', 'br', 'hr', 'img', 'input', 'video', 'audio', 'iframe'];
  if (!skipContent.includes(tag)) {
    const textContent = content?.textContent || '';
    html += `
      <div class="prop-category">
        <div class="prop-category-label">📝 Text Content</div>
        <div class="prop-row">
          <textarea class="prop-textarea prop-textarea-autogrow" 
            oninput="EditorToolbar.updateElementContent('${wrapper.id}', this.value); this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';"
            style="min-height: 60px; resize: vertical;">${escapeHtml(textContent)}</textarea>
        </div>
      </div>
    `;
  }
  
  // Inline Style section - SPEC: Optional (moved to top)
  const currentStyle = content?.getAttribute('style') || '';
  html += `
    <div class="prop-category">
      <div class="prop-category-label">🎨 Inline Style (optional)</div>
      <div class="prop-row">
        <textarea class="prop-textarea prop-textarea-code prop-textarea-autogrow" 
          placeholder="/* Optional: Add inline styles here */&#10;/* e.g. color: red; padding: 1rem; */"
          oninput="EditorToolbar.updateElementStyle('${wrapper.id}', this.value); this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';"
          style="min-height: 40px; resize: vertical;">${escapeHtml(currentStyle)}</textarea>
      </div>
    </div>
  `;

  // Theme selector - SPEC: Every element can have a static theme
  html += `
    <div class="prop-category">
      <div class="prop-category-label">🎨 Theme</div>
      <div class="prop-row">
        <label class="prop-label">Element Theme</label>
        <select class="prop-select" onchange="EditorToolbar.updateElementTheme('${wrapper.id}', this.value)">
          ${AVAILABLE_THEMES.map(t => 
            `<option value="${t.value}" ${content?.dataset?.theme === t.value ? 'selected' : ''}>${t.label}</option>`
          ).join('')}
        </select>
      </div>
    </div>
  `;
  
  // WB Component attributes from schema - COLUMNAR display
  if (componentDef?.categories) {
    Object.entries(componentDef.categories).forEach(([catName, attrs]) => {
      html += `<div class="prop-category">`;
      html += `<div class="prop-category-label">${catName}</div>`;
      
      attrs.forEach(attr => {
        const currentValue = content?.getAttribute(attr.name) || content?.getAttribute('data-' + attr.name) || '';
        const inputId = `attr-${attr.name}-${wrapper.id}`;
        
        html += `<div class="prop-row">`;
        html += `<label class="prop-label" for="${inputId}">${attr.name}</label>`;
        
        if (attr.type === 'select' && attr.options) {
          html += `<select id="${inputId}" class="prop-select" onchange="EditorToolbar.updateElementAttr('${wrapper.id}', '${attr.name}', this.value)">`;
          html += `<option value="">default</option>`;
          attr.options.forEach(opt => {
            html += `<option value="${opt}" ${currentValue === opt ? 'selected' : ''}>${opt}</option>`;
          });
          html += `</select>`;
        } else if (attr.type === 'boolean') {
          html += `<input type="checkbox" id="${inputId}" ${currentValue === 'true' ? 'checked' : ''} 
            onchange="EditorToolbar.updateElementAttr('${wrapper.id}', '${attr.name}', this.checked ? 'true' : '')">`;
        } else {
          html += `<textarea id="${inputId}" class="prop-textarea prop-textarea-autogrow prop-textarea-short" 
            placeholder="${attr.default || ''}" 
            oninput="EditorToolbar.updateElementAttr('${wrapper.id}', '${attr.name}', this.value); this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';">${escapeHtml(currentValue)}</textarea>`;
        }
        
        html += `</div>`;
      });
      
      html += `</div>`;
    });
  }
  
  // ALL existing attributes on the element
  if (content && content.attributes.length > 0) {
    html += `<div class="prop-category">`;
    html += `<div class="prop-category-label">📋 All Attributes</div>`;
    
    Array.from(content.attributes).forEach(attr => {
      if (attr.name === 'style') return; // Separate section
      
      const inputId = `existing-${attr.name}-${wrapper.id}`;
      html += `<div class="prop-row">`;
      html += `<label class="prop-label" for="${inputId}">${attr.name}</label>`;
      html += `<div style="display: flex; gap: 0.25rem; align-items: flex-start;">`;
      html += `<textarea id="${inputId}" class="prop-textarea prop-textarea-autogrow prop-textarea-short" style="flex: 1;"
        oninput="EditorToolbar.updateElementAttr('${wrapper.id}', '${attr.name}', this.value); this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';">${escapeHtml(attr.value)}</textarea>`;
      html += `<button class="prop-remove-btn" onclick="EditorToolbar.removeElementAttr('${wrapper.id}', '${attr.name}')" title="Remove">×</button>`;
      html += `</div></div>`;
    });
    
    html += `</div>`;
  }
  
  // Add new attribute section
  html += `
    <div class="prop-category">
      <div class="prop-category-label">➕ Add Attribute</div>
      <div class="prop-row">
        <label class="prop-label">Name</label>
        <textarea id="new-attr-name-${wrapper.id}" class="prop-textarea prop-textarea-autogrow prop-textarea-short" 
          placeholder="attribute name"
          oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';"></textarea>
      </div>
      <div class="prop-row">
        <label class="prop-label">Value</label>
        <textarea id="new-attr-value-${wrapper.id}" class="prop-textarea prop-textarea-autogrow prop-textarea-short" 
          placeholder="attribute value"
          oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';"></textarea>
      </div>
      <button class="prop-add-btn" onclick="EditorToolbar.addNewAttribute('${wrapper.id}')">Add Attribute</button>
    </div>
  `;
  
  panel.innerHTML = html;
  panel.classList.remove('properties-empty');
  
  // Auto-size textareas
  setTimeout(() => {
    panel.querySelectorAll('.prop-textarea-autogrow').forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, 0);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Update element text content - LIVE
 */
function updateElementContent(wrapperId, value) {
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) {
    const content = wrapper.querySelector('.component-content > *');
    if (content) {
      content.textContent = value;
    }
  }
}

/**
 * Update element theme
 */
function updateElementTheme(wrapperId, theme) {
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) {
    const content = wrapper.querySelector('.component-content > *');
    if (content) {
      // Remove old theme classes
      AVAILABLE_THEMES.forEach(t => {
        if (t.value) content.classList.remove(t.value);
      });
      // Add new theme
      if (theme) {
        content.classList.add(theme);
        content.dataset.theme = theme;
      } else {
        delete content.dataset.theme;
      }
    }
  }
}

function updateElementAttr(wrapperId, attr, value) {
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) {
    const content = wrapper.querySelector('.component-content > *');
    if (content) {
      if (value) content.setAttribute(attr, value);
      else content.removeAttribute(attr);
    }
  }
}

function removeElementAttr(wrapperId, attr) {
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) {
    const content = wrapper.querySelector('.component-content > *');
    if (content) {
      content.removeAttribute(attr);
      updatePropertiesPanel(wrapper);
    }
  }
}

function addNewAttribute(wrapperId) {
  const nameInput = document.getElementById(`new-attr-name-${wrapperId}`);
  const valueInput = document.getElementById(`new-attr-value-${wrapperId}`);
  
  if (!nameInput || !valueInput) return;
  
  const name = nameInput.value.trim();
  const value = valueInput.value;
  
  if (!name) return;
  
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) {
    const content = wrapper.querySelector('.component-content > *');
    if (content) {
      content.setAttribute(name, value);
      updatePropertiesPanel(wrapper);
    }
  }
}

function updateElementStyle(wrapperId, styleText) {
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) {
    const content = wrapper.querySelector('.component-content > *');
    if (content) {
      if (styleText.trim()) {
        content.setAttribute('style', styleText);
      } else {
        content.removeAttribute('style');
      }
    }
  }
}

function applyFormat(tag) {
  document.execCommand('formatBlock', false, tag);
}

function clearFormatting() {
  document.execCommand('removeFormat', false, null);
}

function addXAttribute(attr) {
  closeAllDropdowns();
  
  if (!selectedElement) {
    console.warn('[EditorToolbar] Select an element first');
    return;
  }
  
  selectedElement.setAttribute(attr, '');
  if (selectedWrapper) updatePropertiesPanel(selectedWrapper);
}

function addCustomAttribute() {
  closeAllDropdowns();
  console.log('[EditorToolbar] Use properties panel to add custom attributes');
}

function createNewPage() {
  closeAllDropdowns();
  if (typeof addNewPage === 'function') {
    addNewPage('new-page-' + Date.now());
  }
}

function undo() { document.execCommand('undo', false, null); }
function redo() { document.execCommand('redo', false, null); }

/**
 * Show add child menu for a component
 */
let addChildTarget = null;

function showAddChildMenu(wrapperId, menuType, buttonEl) {
  addChildTarget = wrapperId;
  
  let menu = document.getElementById('add-child-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'add-child-menu';
    menu.className = 'toolbar-dropdown dropdown-wide';
    document.body.appendChild(menu);
  }
  
  // Build menu content based on type
  if (menuType === 'element') {
    menu.innerHTML = buildElementDropdown().replace(
      /EditorToolbar\.insertElement\('([^']+)'\)/g, 
      "EditorToolbar.addChildElement('$1')"
    );
  } else {
    menu.innerHTML = buildComponentDropdown().replace(
      /EditorToolbar\.insertComponent\('([^']+)'\)/g,
      "EditorToolbar.addChildComponent('$1')"
    );
  }
  
  // Position and show
  const rect = buttonEl.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = Math.min(rect.left, window.innerWidth - 250) + 'px';
  menu.style.zIndex = '10001';
  menu.style.maxHeight = '400px';
  menu.style.overflowY = 'auto';
  menu.classList.add('open');
  
  // Close on outside click
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!menu.contains(e.target) && !e.target.closest('.action-btn')) {
        menu.classList.remove('open');
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 10);
}

/**
 * Add element as child of target component
 */
function addChildElement(tag) {
  if (!addChildTarget) {
    // No target - add to canvas
    insertElement(tag);
    return;
  }
  
  const wrapper = document.getElementById(addChildTarget);
  if (!wrapper) return;
  
  const element = createElementWithDefaults(tag);
  addAsChild(wrapper, element, tag);
  
  const menu = document.getElementById('add-child-menu');
  if (menu) menu.classList.remove('open');
  
  addChildTarget = null;
}

/**
 * Add component as child of target component
 */
function addChildComponent(tag) {
  if (!addChildTarget) {
    // No target - add to canvas
    insertComponent(tag);
    return;
  }
  
  const wrapper = document.getElementById(addChildTarget);
  if (!wrapper) return;
  
  const element = document.createElement(tag);
  element.id = generateElementId(tag);
  addAsChild(wrapper, element, tag);
  
  const menu = document.getElementById('add-child-menu');
  if (menu) menu.classList.remove('open');
  
  addChildTarget = null;
}

// Export
window.EditorToolbar = {
  init: initEditorToolbar,
  populateDropdowns,
  toggleDropdown,
  closeAllDropdowns,
  selectPage,
  insertElement,
  insertComponent,
  addXAttribute,
  addCustomAttribute,
  removeElement,
  selectElement,
  filterComponents,
  updateElementContent,
  updateElementAttr,
  removeElementAttr,
  addNewAttribute,
  updateElementStyle,
  updateElementTheme,
  setViewMode,
  showAddChildMenu,
  addChildElement,
  addChildComponent,
  undo,
  redo,
  buildElementDropdown,
  buildComponentDropdown,
  buildXAttrDropdown,
  HTML_ELEMENTS,
  X_ATTRIBUTES,
  AVAILABLE_THEMES
};

// Auto-init
function tryInit() {
  if (document.getElementById('dropdown-element') || document.querySelector('.canvas-toolbar')) {
    initEditorToolbar();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInit);
} else {
  tryInit();
}

document.addEventListener('builder:views-loaded', () => {
  console.log('[EditorToolbar] Views loaded');
  initEditorToolbar();
});
