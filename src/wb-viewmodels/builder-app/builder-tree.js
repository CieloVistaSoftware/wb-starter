/**
 * Compact component tree with canvas-order sync.
 * - Section management, expand/collapse, highlighting.
 */
export function cc() {}

// =============================================================================
// BUILDER TREE - Compact 1rem rows, canvas-order sync, green selection
// =============================================================================

let expandedSections = { header: false, main: true, footer: false }; // Main expanded by default
let expandedContainers = {}; // Track expanded state of container components
let autoExpandedIds = new Set(); // Track which components we auto-expanded
let activeSection = null;
let allSectionsExpanded = false;
let domElementRegistry = new Map(); // Store DOM element references for highlighting
window._domElementRegistry = domElementRegistry; // Expose for properties panel
let highlightedDomKey = null; // Currently highlighted DOM element key

// Inject compact styles
(function injectTreeStyles() {
  if (document.getElementById('tree-compact-styles')) return;
  const style = document.createElement('style');
  style.id = 'tree-compact-styles';
  style.textContent = `
    /* Page sections - MUST BE EXPANDABLE */
    .page-section {
      margin-bottom: 4px;
      border: 1px solid var(--border-color, #333);
      border-radius: 4px;
      background: var(--bg-secondary, #1a1a2e);
    }
    .page-section-header {
      display: flex;
      align-items: center;
      padding: 6px 8px;
      cursor: pointer;
      background: var(--bg-tertiary, #252542);
      font-size: 12px;
      gap: 6px;
      user-select: none;
    }
    .page-section-header:hover { background: var(--bg-secondary); }
    .page-section-icon { font-size: 12px; }
    .page-section-title { flex: 1; font-weight: 600; }
    .page-section-count {
      font-size: 10px;
      padding: 1px 6px;
      background: var(--bg-primary);
      border-radius: 8px;
      color: var(--text-muted);
    }
    .page-section-toggle { 
      font-size: 10px; 
      color: var(--text-muted); 
      transition: transform 0.2s;
    }
    
    /* COLLAPSED STATE - body hidden */
    .page-section-body {
      padding: 4px;
      display: block;
    }
    .page-section.collapsed .page-section-body {
      display: none !important;
    }
    .page-section.collapsed .page-section-toggle {
      transform: rotate(-90deg);
    }
    
    /* Active section in tree panel */
    .page-section.active { border-color: #22c55e; }
    .page-section.active .page-section-header { background: #22c55e; color: white; }
    .page-section.active .page-section-count { background: rgba(255,255,255,0.2); color: white; }
    
    /* COMPACT 1rem rows */
    .tree-item {
      display: flex;
      align-items: center;
      height: 1.5rem; /* Increased slightly for better clickability */
      line-height: 1.5rem;
      padding: 0 4px;
      margin: 1px 0;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      gap: 4px;
      background: var(--bg-primary);
      border: 1px solid transparent;
      transition: all 0.1s;
    }
    .tree-item:hover { background: var(--bg-tertiary); }
    .tree-item.selected {
      background: rgba(34, 197, 94, 0.15) !important;
      border-color: #22c55e !important;
      color: #22c55e;
    }
    .tree-item-indent {
      display: inline-block;
      width: 0;
      transition: width 0.1s;
    }
    .tree-toggle-btn {
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 2px;
    }
    .tree-toggle-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    /* Spacer for non-container items ensures alignment */
    .tree-toggle-spacer { width: 14px; display: inline-block; }

    .tree-item-icon { font-size: 12px; flex-shrink: 0; }
    .tree-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tree-item-id { font-size: 9px; color: var(--text-muted); font-family: monospace; margin-left: auto; }
    
    .tree-item-del {
      opacity: 0;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 10px;
      padding: 4px;
      border-radius: 4px;
    }
    .tree-item:hover .tree-item-del { opacity: 0.6; }
    .tree-item-del:hover { opacity: 1 !important; color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    
    /* Edit button for text elements */
    .tree-item-edit {
      opacity: 0;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 10px;
      padding: 2px 4px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .tree-item:hover .tree-item-edit { opacity: 0.6; }
    .tree-item-edit:hover { opacity: 1 !important; color: #3b82f6; background: rgba(59, 130, 246, 0.15); }
    
    /* Canvas selection - GREEN for individual components */
    .dropped.selected {
      outline: 2px solid #22c55e !important;
      outline-offset: 2px;
    }
    
    /* Canvas section selection - GREEN for all components in section */
    .dropped.section-selected {
      outline: 2px solid #22c55e !important;
      outline-offset: 2px;
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
    }
    
    /* Empty state */
    .tree-empty {
      padding: 8px;
      text-align: center;
      color: var(--text-muted);
      font-size: 11px;
    }
    
    /* DOM element highlight on canvas - GREEN like components */
    .dom-highlight {
      outline: 2px solid #22c55e !important;
      outline-offset: 2px;
    }
    
    /* Tree item for DOM children - clickable */
    .tree-item-dom {
      opacity: 0.8;
    }
    .tree-item-dom:hover {
      opacity: 1;
      background: var(--bg-tertiary);
    }
    .tree-item-dom.highlighted {
      background: rgba(34, 197, 94, 0.15) !important;
      border-color: #22c55e !important;
      color: #22c55e;
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
})();

// Get components in canvas order (top to bottom)
function getCanvasComponents() {
  const canvasCompEl = document.getElementById('canvas');
  if (!canvasCompEl) return [];
  return Array.from(canvasCompEl.querySelectorAll('.dropped:not(.grid-child):not(.container-child)'));
}

// Categorize component into header/main/footer
function categorizeComponent(wrapper) {
  const c = JSON.parse(wrapper.dataset.c || '{}');
  // Handle both: div.dropped > section OR section.dropped (wrapper IS the element)
  const wrapperTag = wrapper.tagName?.toLowerCase();
  const isSemanticWrapper = ['section', 'nav', 'header', 'footer', 'main', 'article', 'aside'].includes(wrapperTag);
  const el = isSemanticWrapper ? wrapper : wrapper.firstElementChild;
  const tag = el?.tagName?.toLowerCase() || c.t || 'div';
  const behavior = (c.b || '').toLowerCase();
  const name = (c.n || '').toLowerCase();
  
  // Header patterns
  if (tag === 'nav' || tag === 'header' || 
      behavior.includes('navbar') || behavior.includes('nav') || behavior.includes('menu') ||
      name.includes('nav') || name.includes('header') || name.includes('menu')) {
    return 'header';
  }
  
  // Footer patterns  
  if (tag === 'footer' || behavior.includes('footer') || name.includes('footer')) {
    return 'footer';
  }
  
  return 'main';
}

// Get all components in a specific section
function getComponentsInSection(section) {
  const components = getCanvasComponents();
  return components.filter(w => categorizeComponent(w) === section);
}

// Render the tree
function renderTree() {
  const panel = document.getElementById('componentList');
  if (!panel) return;
  
  // Clear DOM element registry
  domElementRegistry.clear();
  
  const components = getCanvasComponents();
  const selectedId = window.sel?.id || null;
  
  // Group by section while preserving order within each
  const sections = { header: [], main: [], footer: [] };
  components.forEach(w => {
    const section = categorizeComponent(w);
    sections[section].push(w);
  });
  
  // ALWAYS show Header/Main/Footer sections, even when empty
  panel.innerHTML = `
    ${renderSection('header', '🔝', 'Header', 'Navigation, menus, logo', sections.header, selectedId)}
    ${renderSection('main', '📄', 'Main', 'Content sections for your page', sections.main, selectedId)}
    ${renderSection('footer', '🔻', 'Footer', 'Links, copyright, credits', sections.footer, selectedId)}
  `;
  
  // Update canvas insert points
  updateCanvasInsertPoints();
}

function renderSection(key, icon, title, subtitle, items, selectedId) {
  const isSectionExpanded = expandedSections[key];
  const isActive = activeSection === key;
  
  let itemsHtml = '';
  if (items.length === 0) {
    itemsHtml = '<div class="tree-empty">Empty</div>';
  } else {
    itemsHtml = items.map(w => renderTreeItem(w, selectedId)).join('');
  }
  
  // Use 'collapsed' class when NOT expanded
  const collapsedClass = isSectionExpanded ? '' : 'collapsed';
  
  // Click on header toggles expand/collapse and syncs canvas
  return `
    <div class="page-section ${collapsedClass} ${isActive ? 'active' : ''}" data-section="${key}">
      <div class="page-section-header" onclick="window.selectSection('${key}')">
        <span class="page-section-icon">${icon}</span>
        <div style="flex:1;">
          <span class="page-section-title">${title}</span>
          <div style="font-size:10px; color:var(--text-muted); font-weight:normal;">${subtitle}</div>
        </div>
        <span class="page-section-count">${items.length}</span>
        <span class="page-section-toggle">▼</span>
      </div>
      <div class="page-section-body">${itemsHtml}</div>
    </div>
  `;
}

// Icon map for semantic HTML elements
const ELEMENT_ICONS = {
  // Structure
  section: '📑', article: '📰', aside: '📌', header: '🔝', footer: '🔻', nav: '🧭', main: '📄',
  div: '📦', span: '🏷️',
  // Text
  h1: '🔤', h2: '🔤', h3: '🔤', h4: '🔤', h5: '🔤', h6: '🔤',
  p: '📝', a: '🔗', strong: '💪', em: '✨', blockquote: '💬', code: '💻', pre: '📋',
  // Media
  img: '🖼️', picture: '🖼️', video: '🎬', audio: '🔊', svg: '🎨', canvas: '🎨', iframe: '🪟',
  // Forms
  form: '📋', input: '✏️', textarea: '📝', button: '🔘', select: '📋', label: '🏷️',
  // Lists
  ul: '📋', ol: '🔢', li: '•',
  // Table
  table: '📊', tr: '➡️', td: '📦', th: '📦',
  // Other
  figure: '🖼️', figcaption: '📝', hr: '➖', br: '↵'
};

// Get display info for any DOM element
// CRITICAL: Must show meaningful content - text, alt text, titles, etc.
function getElementDisplayInfo(el) {
  const tag = el.tagName?.toLowerCase() || 'element';
  const icon = ELEMENT_ICONS[tag] || '📦';
  
  // Build display name from tag + meaningful content
  let name = tag;
  
  // Special handling for specific elements - show actual content
  if (tag === 'img') {
    const alt = el.alt || el.title || el.src?.split('/')?.pop()?.slice(0, 20) || 'image';
    name = `img: ${alt}`;
  } else if (tag === 'svg') {
    // Check for title or aria-label
    const title = el.querySelector('title')?.textContent || el.getAttribute('aria-label') || 'icon';
    name = `svg: ${title.slice(0, 15)}`;
  } else if (tag === 'a') {
    const linkText = el.textContent?.trim()?.slice(0, 20) || el.title || el.href?.split('/')?.pop()?.slice(0, 15) || 'link';
    name = linkText + (linkText.length >= 20 ? '…' : '');
  } else if (['h1','h2','h3','h4','h5','h6'].includes(tag)) {
    const headingText = el.textContent?.trim()?.slice(0, 30) || 'Heading';
    name = `${tag}: "${headingText}${headingText.length >= 30 ? '…' : ''}"`;
  } else if (['p','span','label','figcaption'].includes(tag)) {
    const paraText = el.textContent?.trim()?.slice(0, 30);
    if (paraText) name = `${tag}: "${paraText}${paraText.length >= 30 ? '…' : ''}"`;
  } else if (tag === 'button') {
    // Get actual button text, excluding icon pseudo-elements
    let btnText = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        btnText += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && !['SVG', 'I', 'SPAN'].includes(node.tagName)) {
        btnText += node.textContent;
      }
    }
    btnText = btnText.trim().slice(0, 20) || el.title || el.value || el.getAttribute('aria-label') || 'button';
    name = `button: "${btnText}"`;
  } else if (tag === 'input') {
    const type = el.type || 'text';
    const placeholder = el.placeholder?.slice(0, 15) || '';
    name = placeholder ? `input[${type}]: "${placeholder}"` : `input[${type}]`;
  } else if (tag === 'textarea') {
    const areaText = el.placeholder?.slice(0, 20) || el.textContent?.trim()?.slice(0, 20) || '';
    name = areaText ? `textarea: "${areaText}"` : 'textarea';
  } else if (tag === 'select') {
    const selected = el.options?.[el.selectedIndex]?.text?.slice(0, 15) || '';
    name = selected ? `select: "${selected}"` : 'select';
  } else if (tag === 'li') {
    const liText = el.textContent?.trim()?.slice(0, 25);
    if (liText) name = `• ${liText}${liText.length >= 25 ? '…' : ''}`;
  } else if (tag === 'th' || tag === 'td') {
    const cellText = el.textContent?.trim()?.slice(0, 20);
    if (cellText) name = `${tag}: "${cellText}"`;
  } else if (tag === 'video') {
    const videoSrc = el.src || el.querySelector('source')?.src || '';
    name = `video: ${videoSrc.split('/').pop()?.slice(0, 15) || 'video'}`;
  } else if (tag === 'audio') {
    const audioSrc = el.src || el.querySelector('source')?.src || '';
    name = `audio: ${audioSrc.split('/').pop()?.slice(0, 15) || 'audio'}`;
  } else if (tag === 'iframe') {
    const iframeSrc = el.src?.slice(0, 25) || 'iframe';
    name = `iframe: ${iframeSrc}`;
  } else {
    // For divs and other containers, show class hint
    const firstClass = el.className?.split?.(' ')?.[0];
    if (firstClass && !firstClass.startsWith('dropped') && !firstClass.startsWith('selected') && !firstClass.startsWith('dom-')) {
      name = `.${firstClass.slice(0, 20)}`;
    }
  }
  
  return { tag, icon, name };
}

// Check if element has meaningful children to show
function hasVisibleChildren(el) {
  if (!el.children || el.children.length === 0) return false;
  // Skip if only whitespace text nodes or script/style
  const dominated = Array.from(el.children).filter(c => 
    !['SCRIPT', 'STYLE', 'BR', 'HR'].includes(c.tagName)
  );
  return dominated.length > 0;
}

// CRITICAL: Find ALL meaningful content elements anywhere in the component
// This finds h1, h2, p, button, a, img, svg, etc. - the ACTUAL CONTENT users care about
const MEANINGFUL_TAGS = new Set([
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',  // Headings
  'P', 'SPAN', 'LABEL', 'FIGCAPTION',  // Text
  'A', 'BUTTON',                        // Interactive
  'IMG', 'SVG', 'VIDEO', 'AUDIO', 'PICTURE', 'CANVAS', // Media
  'INPUT', 'TEXTAREA', 'SELECT',        // Forms
  'LI', 'TH', 'TD',                     // List/table items
  'BLOCKQUOTE', 'CODE', 'PRE'           // Special text
]);

function findMeaningfulContent(root) {
  const results = [];
  
  function walk(el) {
    if (!el || !el.children) return;
    
    for (const child of el.children) {
      // Skip script, style, etc.
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BR'].includes(child.tagName)) continue;
      
      // Skip dropped wrappers (handled separately)
      if (child.classList.contains('dropped')) continue;
      
      // Skip builder UI controls
      if (child.classList.contains('resize-handle') || 
          child.classList.contains('delete-btn') ||
          child.classList.contains('component-toolbar') ||
          child.classList.contains('insert-between') ||
          child.classList.contains('el-controls') ||
          child.classList.contains('el-id-label') ||
          child.classList.contains('wb-resize-handle') ||
          child.classList.contains('wb-width-indicator') ||
          child.classList.contains('wb-width-presets') ||
          child.classList.contains('controls') ||
          child.dataset.builderUi) continue;
      
      // Is this a meaningful content element?
      if (MEANINGFUL_TAGS.has(child.tagName)) {
        // Skip tiny buttons that are likely UI controls (like hamburger menus)
        if (child.tagName === 'BUTTON') {
          const btnText = child.textContent?.trim();
          const ariaLabel = child.getAttribute('aria-label')?.toLowerCase() || '';
          // Skip if: hamburger menu, close button, or text is just symbols/icons
          if (ariaLabel.includes('menu') || ariaLabel.includes('toggle') || ariaLabel.includes('close') ||
              !btnText || btnText.length <= 2 || /^[\:\+\-\x\×\=\|\<\>\☰\≡]+$/i.test(btnText)) {
            // But still check inside for nested content
            walk(child);
            continue;
          }
        }
        
        // Skip anchor links that are just # or icons
        if (child.tagName === 'A') {
          const anchorText = child.textContent?.trim();
          const href = child.getAttribute('href') || '';
          // Skip if no real text and just a hash link
          if ((!anchorText || anchorText.length <= 1) && (href === '#' || href.startsWith('#'))) {
            walk(child);
            continue;
          }
        }
        
        results.push(child);
        // Don't recurse into meaningful elements - they're leaf nodes for display
        if (child.tagName === 'A' || child.tagName === 'BUTTON') {
          // Links and buttons might contain icons - but we show the button itself
          continue;
        }
      }
      
      // Recurse into containers (div, section, nav, etc.) to find nested content
      walk(child);
    }
  }
  
  walk(root);
  return results;
}

// Helper to find the ACTUAL component element inside a wrapper
// Skips all builder UI elements (controls, labels, resize handles, etc.)
function getActualComponentElement(wrapper) {
  const wrapperTag = wrapper.tagName?.toLowerCase();
  
  // If wrapper IS a semantic element (new structure), return it
  const semanticTags = ['section', 'nav', 'header', 'footer', 'main', 'article', 'aside', 'wb-container'];
  if (semanticTags.includes(wrapperTag)) {
    return wrapper;
  }
  
  // Old structure: div.dropped > (UI elements) > actual-component
  // Find the first non-UI child that's an actual component element
  for (const child of wrapper.children) {
    // Skip all builder UI elements using classList.contains (safer)
    if (child.classList?.contains('el-controls') ||
        child.classList?.contains('el-id-label') ||
        child.classList?.contains('controls') ||
        child.classList?.contains('wb-resize-handle') ||
        child.classList?.contains('wb-width-indicator') ||
        child.classList?.contains('wb-width-presets') ||
        child.classList?.contains('insert-between') ||
        child.classList?.contains('ctrl-btn') ||
        child.dataset?.builderUi) {
      continue;
    }
    
    // Found the actual component element
    return child;
  }
  
  // Fallback: return wrapper itself
  return wrapper;
}

function renderTreeItem(wrapper, selectedId, level = 0) {
  const c = JSON.parse(wrapper.dataset.c || '{}');
  const id = wrapper.id;
  if (!id) return '';
  
  const isSelected = selectedId === id;
  const shortId = id.length > 12 ? id.slice(0, 10) + '…' : id;
  
  // Get the actual component element (handles both old and new structures)
  const componentEl = getActualComponentElement(wrapper);
  
  // Use component name from data, or derive from element
  let displayName = c.n || c.b || '';
  let icon = c.i || '📦';
  
  if (!displayName && componentEl) {
    const info = getElementDisplayInfo(componentEl);
    displayName = info.name;
    icon = info.icon;
  }
  if (!displayName) displayName = 'Element';
  
  // Check for children - both .dropped wrappers AND actual DOM children
  const droppedChildren = Array.from(wrapper.querySelectorAll(':scope > .dropped, :scope > * > .dropped')).slice(0, 10);
  
  // Get actual DOM children - search the component element for meaningful content
  // CRITICAL: Show ALL meaningful content - find text, images, buttons, headings ANYWHERE in the tree
  const domChildren = componentEl ? findMeaningfulContent(componentEl) : [];
  
  const hasChildren = droppedChildren.length > 0 || domChildren.length > 0;
  
  // AUTO-EXPAND components with meaningful content by default
  // Only if user hasn't explicitly collapsed it (expandedContainers[id] === false)
  let isItemExpanded = expandedContainers[id];
  if (isItemExpanded === undefined && hasChildren) {
    // Auto-expand if has content and user hasn't toggled it
    isItemExpanded = true;
    autoExpandedIds.add(id);
  }
  
  const indentStyle = `width: ${level * 12}px;`;
  
  let toggleHtml = '<span class="tree-toggle-spacer"></span>';
  if (hasChildren) {
    toggleHtml = `
      <span class="tree-toggle-btn" onclick="event.stopPropagation(); window.toggleContainerExpand('${id}')">
        ${isItemExpanded ? '▼' : '▶'}
      </span>
    `;
  }
  
  let html = `
    <div class="tree-item ${isSelected ? 'selected' : ''}" data-id="${id}" onclick="window.selectFromTree('${id}')">
      <span class="tree-item-indent" style="${indentStyle}"></span>
      ${toggleHtml}
      <span class="tree-item-icon">${icon}</span>
      <span class="tree-item-name">${displayName}</span>
      <span class="tree-item-id">#${shortId}</span>
      <button class="tree-item-del" onclick="event.stopPropagation(); window.del('${id}')" title="Delete">✕</button>
    </div>
  `;
  
  // Render children if expanded
  if (isItemExpanded && hasChildren) {
    // First render any .dropped children
    html += droppedChildren.map(child => renderTreeItem(child, selectedId, level + 1)).join('');
    
    // Then render actual DOM content (can be expanded to show nested elements)
    html += domChildren.map(child => renderDOMChild(child, level + 1, 6, id, true)).join('');
  }
  
  return html;
}

// Render a DOM child element (clickable, highlights on canvas)
// CRITICAL: Must show meaningful content - text, images, icons, headings, buttons, etc.
// showChildren = false means this is a flattened content item (no expansion needed)
function renderDOMChild(el, level = 1, maxDepth = 6, parentPath = 'root', showChildren = true) {
  if (level > maxDepth) return ''; // Prevent infinite depth
  
  const info = getElementDisplayInfo(el);
  const indentStyle = `width: ${level * 12}px;`;
  
  // For flattened content display, don't show expand toggle
  const children = showChildren ? Array.from(el.children).filter(c => 
    !['SCRIPT', 'STYLE', 'BR', 'NOSCRIPT', 'TEMPLATE'].includes(c.tagName)
  ) : [];
  const hasChildren = showChildren && children.length > 0;
  
  // Create stable key from element path (tag + index among siblings)
  const siblingIndex = el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0;
  const elKey = `${parentPath}/${info.tag}-${siblingIndex}`;
  const escapedKey = elKey.replace(/'/g, "\\'");
  const isDomExpanded = expandedContainers[elKey] === true;
  const isHighlighted = highlightedDomKey === elKey;
  
  // Register this element for click handling
  domElementRegistry.set(elKey, el);
  
  // Get element ID or first class for display
  let idDisplay = '';
  if (el.id) {
    idDisplay = `#${el.id.slice(0, 12)}${el.id.length > 12 ? '…' : ''}`;
  } else if (el.className && typeof el.className === 'string') {
    const firstClass = el.className.split(' ')[0];
    if (firstClass && !firstClass.startsWith('dom-')) {
      idDisplay = `.${firstClass.slice(0, 12)}${firstClass.length > 12 ? '…' : ''}`;
    }
  }
  if (!idDisplay) {
    idDisplay = info.tag;
  }
  
  let toggleHtml = '<span class="tree-toggle-spacer"></span>';
  if (hasChildren) {
    toggleHtml = `
      <span class="tree-toggle-btn" onclick="event.stopPropagation(); window.toggleContainerExpand('${escapedKey}')">
        ${isDomExpanded ? '▼' : '▶'}
      </span>
    `;
  }
  
  // Determine if this element has editable text
  const editableTags = ['A', 'BUTTON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'LABEL', 'LI'];
  const isEditable = editableTags.includes(el.tagName);
  const editBtn = isEditable ? `<button class="tree-item-edit" onclick="event.stopPropagation(); window.editDOMElementText('${escapedKey}')" title="Edit text">✏️</button>` : '';
  
  let templateHtml = `
    <div class="tree-item tree-item-dom ${isHighlighted ? 'highlighted' : ''}" data-dom-key="${elKey}" onclick="window.highlightDOMElement('${escapedKey}')" ondblclick="window.inspectDOMElement('${escapedKey}')">
      <span class="tree-item-indent" style="${indentStyle}"></span>
      ${toggleHtml}
      <span class="tree-item-icon">${info.icon}</span>
      <span class="tree-item-name">${info.name}</span>
      ${editBtn}
      <span class="tree-item-id">${idDisplay}</span>
    </div>
  `;
  
  // Recursively render children if expanded
  if (isDomExpanded && hasChildren) {
    html += children.map(child => renderDOMChild(child, level + 1, maxDepth, elKey)).join('');
  }
  
  return html;
}

// Toggle container expansion
window.toggleContainerExpand = (id) => {
  // If undefined (auto-expanded), set to false (collapse)
  // If true, set to false
  // If false, set to true
  const current = expandedContainers[id];
  if (current === undefined || current === true) {
    expandedContainers[id] = false;
  } else {
    expandedContainers[id] = true;
  }
  renderTree();
};

// Highlight a DOM element on canvas (for non-dropped elements)
window.highlightDOMElement = (elKey) => {
  // Clear previous DOM highlight
  document.querySelectorAll('.dom-highlight').forEach(e => e.classList.remove('dom-highlight'));
  
  // Clear previous tree highlight
  document.querySelectorAll('.tree-item-dom.highlighted').forEach(e => e.classList.remove('highlighted'));
  
  // Get the element from registry
  const highlightEl = domElementRegistry.get(elKey);
  if (!highlightEl) {
    console.warn('[Tree] DOM element not found in registry:', elKey);
    return;
  }
  
  // Update state
  highlightedDomKey = elKey;
  
  // Highlight on canvas
  highlightEl.classList.add('dom-highlight');
  
  // Highlight in tree
  const treeItem = document.querySelector(`.tree-item-dom[data-dom-key="${elKey}"]`);
  if (treeItem) {
    treeItem.classList.add('highlighted');
  }
  
  // Scroll into view on canvas
  highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  console.log('[Tree] Highlighted DOM element:', elKey, highlightEl);
};

// Inspect a DOM element - show debug info (double-click handler)
window.inspectDOMElement = (elKey) => {
  const inspectEl = domElementRegistry.get(elKey);
  if (!inspectEl) {
    console.warn('[Tree] DOM element not found for inspection:', elKey);
    return;
  }
  
  // Build comprehensive debug info
  const cs = window.getComputedStyle(inspectEl);
  const debugInfo = {
    key: elKey,
    tagName: inspectEl.tagName,
    id: inspectEl.id || '(none)',
    className: inspectEl.className || '(none)',
    textContent: inspectEl.textContent?.trim()?.slice(0, 100) || '(empty)',
    attributes: {},
    computedStyle: {
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      overflow: cs.overflow,
      height: cs.height,
      width: cs.width,
      maxHeight: cs.maxHeight,
      position: cs.position,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize
    },
    boundingRect: inspectEl.getBoundingClientRect(),
    parentTag: inspectEl.parentElement?.tagName || '(none)',
    parentId: inspectEl.parentElement?.id || '(none)',
    childCount: inspectEl.children?.length || 0,
    outerHTML: inspectEl.outerHTML?.slice(0, 500) + (inspectEl.outerHTML?.length > 500 ? '...' : '')
  };
  
  // Collect all attributes
  for (const attr of inspectEl.attributes || []) {
    debugInfo.attributes[attr.name] = attr.value;
  }
  
  const text = JSON.stringify(debugInfo, null, 2);
  
  // Copy to clipboard
  navigator.clipboard.writeText(text).then(() => {
    if (window.toast) window.toast('Element debug info copied!');
  }).catch(err => {
    console.error('Copy failed:', err);
    console.log('=== DOM ELEMENT DEBUG INFO ===');
    console.log(text);
    if (window.toast) window.toast('Check console for debug info');
  });
  
  // Also log to console for easy viewing
  console.log('[Tree] Inspecting DOM element:', elKey);
  console.log(debugInfo);
  console.log('Actual element:', inspectEl);
};

// Edit DOM element text - inline editing without triggering element actions
window.editDOMElementText = (elKey) => {
  const editEl = domElementRegistry.get(elKey);
  if (!editEl) {
    console.warn('[Tree] DOM element not found for editing:', elKey);
    return;
  }
  
  // Get current text (direct text content, not nested)
  let currentText = '';
  for (const node of editEl.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      currentText += node.textContent;
    }
  }
  currentText = currentText.trim() || editEl.textContent?.trim() || '';
  
  // Prompt for new text
  const newText = prompt('Edit text:', currentText);
  
  if (newText !== null && newText !== currentText) {
    // Find and update the text node, or set textContent if simple element
    let updated = false;
    for (const node of editEl.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.textContent = newText;
        updated = true;
        break;
      }
    }
    
    // If no text node found, and element has no child elements, set textContent directly
    if (!updated && editEl.children.length === 0) {
      editEl.textContent = newText;
    } else if (!updated) {
      // Prepend text node if element has children but no text node
      editEl.insertBefore(document.createTextNode(newText), editEl.firstChild);
    }
    
    // Save history
    if (window.saveHist) window.saveHist();
    
    // Refresh tree to show updated text
    renderTree();
    
    if (window.toast) window.toast('Text updated');
    console.log('[Tree] Updated text for:', elKey, '->', newText);
  }
};

// Toggle section expand/collapse - clicking header toggles expand state
window.toggleSectionExpand = (section) => {
  console.log('[Tree] Toggle expand:', section);
  expandedSections[section] = !expandedSections[section];
  
  // Sync with canvas section and properties panel
  syncSectionState(section, expandedSections[section]);
  
  renderTree();
};

// Sync section state across all panels (tree, canvas, properties)
function syncSectionState(section, isExpanded) {
  // Dispatch event for template browser to sync
  const collapsed = JSON.parse(localStorage.getItem('tb-collapsed-sections') || '{}');
  collapsed[section] = !isExpanded;
  localStorage.setItem('tb-collapsed-sections', JSON.stringify(collapsed));
  
  // Also sync properties panel sections if visible
  const propCategory = document.querySelector(`.prop-category[data-section="${section}"]`);
  if (propCategory) {
    propCategory.classList.toggle('collapsed', !isExpanded);
  }
}

// Unified Section Activation - Single Source of Truth
window.unifiedActivateSection = (sectionId) => {
  // 1. Update State - FOCUS MODE (Collapse others)
  activeSection = sectionId;
  const sections = ['header', 'main', 'footer'];
  sections.forEach(s => expandedSections[s] = (s === sectionId));
  
  // 2. Perform Layout Updates Synchronously
  const viewport = document.getElementById('viewport');
  const targetSection = document.querySelector(`.canvas-section[data-section="${sectionId}"]`);
  
  if (targetSection && viewport) {
    // A. Apply classes to trigger layout change (collapsing siblings)
    document.querySelectorAll('.canvas-section').forEach(s => {
      const isTarget = (s.getAttribute('data-section') === sectionId);
      s.classList.toggle('collapsed', !isTarget);
      s.classList.toggle('is-target', isTarget);
    });

    // B. Calculate scroll position immediately after layout update
    // Force browser to recalculate layout by reading offsetTop
    // We want the target section to appear at the very top of the viewport
    
    let scrollTarget = 0;
    
    if (sectionId === 'header') {
       // Header is always at the absolute top
       scrollTarget = 0;
    } else {
       // For Main/Footer, we want to align them to the top
       // Since the siblings above are collapsed (but maybe still have a bar height),
       // we simply calculate the element's position relative to the scroll container.
       // The easy way: relative offset to the frame + frame's offset in viewport
       // Or safer: scrollIntoView logic manually manually implemented
       
       // Because we just changed classes, we must let the browser know we want new positions
       // offsetTop forces a reflow, so it gets the correct new position
       const elementTop = targetSection.offsetTop;
       
       // .frame has padding/border, and .viewport has padding.
       // We want to line up the element top with the viewport top (or close to it)
       // The simple heuristic: scroll to the element's offsetTop (relative to #canvas frame)
       // This ignores the #canvas margins/padding inside viewport, but 
       // typically #canvas is centered or has 1rem padding.
       
       // Let's check viewport scrollTop context.
       // viewport -> frame -> section
       // If I scroll viewport.scrollTop to X.
       
       // Let's use getBoundingClientRect logic which accounts for everything
       // However, we need to apply the scroll *relative* to current position
       const vRect = viewport.getBoundingClientRect();
       const tRect = targetSection.getBoundingClientRect(); // This forces reflow with new classes
       
       // Current scroll position
       const currentScroll = viewport.scrollTop;
       
       // Calculate delta to move target top to viewport top + 10px padding
       // delta = tRect.top - vRect.top
       // newScroll = currentScroll + delta - padding
       scrollTarget = currentScroll + (tRect.top - vRect.top) - 10;
    }

    // C. Execute Scroll
    viewport.scrollTo({ top: scrollTarget, behavior: 'auto' });
  }
  
  // 3. Update Properties Panel
  document.querySelectorAll('.prop-category[data-section]').forEach(cat => {
      cat.classList.toggle('collapsed', cat.dataset.section !== sectionId);
  });
  
  // 4. Update Tree UI
  renderTree();
  
  // 5. Dispatch Event
  document.dispatchEvent(new CustomEvent('wb:section:activated', { 
    detail: { section: sectionId, expanded: true } 
  }));
};

// SELECT a section - just toggles expand/collapse
window.selectSection = (section) => {
  expandedSections[section] = !expandedSections[section];
  renderTree();
};

// Legacy function - now calls selectSection
window.toggleTreeSection = (section) => {
  window.selectSection(section);
};

// Scroll canvas to the first component in a section (used externally)
window.scrollCanvasToSection = (section) => {
  const sectionComponents = getComponentsInSection(section);
  
  if (sectionComponents.length > 0) {
    sectionComponents[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    const canvasScrollEl = document.getElementById('canvas');
    if (canvasScrollEl) {
      const positions = { header: 0, main: 0.3, footer: 0.85 };
      const scrollToPos = canvasScrollEl.scrollHeight * (positions[section] || 0);
      canvasScrollEl.scrollTo({ top: scrollToPos, behavior: 'smooth' });
    }
  }
};

// Select from tree - scrolls canvas to element and clears section selection
window.selectFromTree = (id) => {
  const wrapper = document.getElementById(id);
  if (!wrapper) return;
  
  // Clear DOM element highlights
  document.querySelectorAll('.dom-highlight').forEach(el => el.classList.remove('dom-highlight'));
  document.querySelectorAll('.tree-item-dom.highlighted').forEach(el => el.classList.remove('highlighted'));
  highlightedDomKey = null;
  
  // Check if it's a container and toggle expansion
  // We want clicking the row to toggle containers for better UX
  const c = JSON.parse(wrapper.dataset.c || '{}');
  const isContainer = wrapper.classList.contains('is-container') || c.t === 'section' || c.b === 'container' || c.b === 'grid';
  
  // Only toggle if we are NOT just selecting (optional refinement, but for now always toggle)
  // Logic: If I click a container, I likely want to see its children or hide them.
  if (isContainer) {
    // If it's already selected, just toggle. 
    // If it's not selected, select AND expand (if not expanded).
    // But the simple requirement "act as toggle" suggests simplest impl: toggle.
    if (window.sel === wrapper) {
       // Already selected, just toggle
       window.toggleContainerExpand(id);
       return; // Don't scroll/re-select if already selected? Or let it fall through?
    } else {
       // New selection. If collapsed, expand it.
       if (!expandedContainers[id]) {
         expandedContainers[id] = true;
       }
       // If already expanded, leave it expanded. 
       // (Don't auto-collapse on selection as that's annoying)
    }
  }

  // Clear section selection
  document.querySelectorAll('.dropped.section-selected').forEach(el => el.classList.remove('section-selected'));
  activeSection = null;
  
  // Use the builder's selection function
  if (window.selComp) {
    window.selComp(wrapper, null, true);
  } else {
    // Fallback
    document.querySelectorAll('.dropped').forEach(d => d.classList.remove('selected'));
    wrapper.classList.add('selected');
    window.sel = wrapper;
  }
  
  // Scroll canvas to element
  wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Re-render to clear active section highlight
  renderTree();
};

// Scroll tree to selected item
window.scrollTreeToSelected = (id) => {
  const selectedTreeItem = document.querySelector(`.tree-item[data-id="${id}"]`);
  if (selectedTreeItem) {
    selectedTreeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

// Collapse/expand ALL sections at once
window.setAllTreeSections = (expanded) => {
  allSectionsExpanded = expanded;
  expandedSections.header = expanded;
  expandedSections.main = expanded;
  expandedSections.footer = expanded;
  renderTree();
};

window.getActiveSection = () => activeSection;
window.setActiveSection = (section) => {
  activeSection = section;
  if (section) expandedSections[section] = true;
  renderTree();
};

// Clear section selection (called when clicking elsewhere)
window.clearSectionSelection = () => {
  document.querySelectorAll('.dropped.section-selected').forEach(el => el.classList.remove('section-selected'));
  activeSection = null;
  renderTree();
};

// Expose globally
window.renderTree = renderTree;
window.initTree = initTree;

// export { initTree, renderTree }; // Moved to bottom

// Update insert points on canvas between components
function updateCanvasInsertPoints() {
  const canvasPointsEl = document.getElementById('canvas');
  if (!canvasPointsEl) return;
  
  // Remove existing insert points (except the main button)
  canvasPointsEl.querySelectorAll('.insert-between').forEach(el => el.remove());
  
  const components = Array.from(canvasPointsEl.querySelectorAll('.dropped'));
  
  // Add insert points between each component
  components.forEach((comp, index) => {
    // Add insert point after each component
    const insertPoint = document.createElement('div');
    insertPoint.className = 'insert-between';
    insertPoint.onclick = () => {
      if (window.openChooser) {
        window.openChooser('after', comp.id);
      }
    };
    comp.after(insertPoint);
  });
}
window.updateCanvasInsertPoints = updateCanvasInsertPoints;

// Auto-extend canvas
window.autoExtendCanvas = function() {
  const canvasExtendEl = document.getElementById('canvas');
  if (!canvasExtendEl) return;
  
  // Enforce 100% height at all times
  canvasExtendEl.style.minHeight = '100%';
};

// Initialize
function initTree() {
  // Try to sync with existing DOM state if available
  if (window.getActiveSection) {
    const current = window.getActiveSection();
    if (current && current !== 'main') { // 'main' is fallback, ignore if we want header default
       activeSection = current;
       expandedSections[current] = true;
    }
  }

  // Ensure initial sync
  renderTree();
  
  // Listen for canvas section clicks to sync state
  document.addEventListener('wb:canvas:section:clicked', (e) => {
    const clickedSection = e.detail.section;
    if (clickedSection) {
      // Expand this section in tree
      expandedSections[clickedSection] = true;
      activeSection = clickedSection;
      renderTree();
    }
  });
  
  // Listen for canvas section toggle events
  document.addEventListener('wb:canvas:section:toggled', (e) => {
    const canvasToggledSection = e.detail.section;
    const expanded = e.detail.expanded;
    if (canvasToggledSection) {
      expandedSections[canvasToggledSection] = expanded;
      if (expanded) activeSection = canvasToggledSection;
      renderTree();
    }
  });
  
  // Listen for template browser section toggles to sync state
  document.addEventListener('wb:template:section:toggled', (e) => {
    const templateToggledSection = e.detail.section;
    const isExpanded = e.detail.expanded;
    if (templateToggledSection) {
      expandedSections[templateToggledSection] = expanded;
      if (expanded) activeSection = templateToggledSection;
      renderTree();
    }
  });
  
  window.WB_TREE_INITIALIZED = true;
}

// Auto-init only if not a module environment (legacy fallback)
// If imported as module, caller must invoke initTree
if (typeof process === 'undefined' && !window.WB_BUILDER_MODULE_MODE) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.WB_TREE_INITIALIZED) initTree();
    });
  } else {
    // Only init if not already done
    if (!window.WB_TREE_INITIALIZED) initTree();
  }
}
export { initTree, renderTree };
