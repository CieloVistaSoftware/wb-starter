/**
 * Builder Semantic Elements
 * Semantic HTML element creation, behaviors, and context menu
 */

// ============================================================================
// X-BEHAVIOR DEFINITIONS
// Each behavior has: name, attr, desc, and applicable tags
// ============================================================================

const X_BEHAVIORS = {
  // Interaction behaviors
  tooltip: {
    name: 'Tooltip',
    attr: 'x-tooltip',
    desc: 'Shows a tooltip on hover/focus with custom text',
    icon: '💬',
    tags: ['all']
  },
  copy: {
    name: 'Copy',
    attr: 'x-copy',
    desc: 'Copy text to clipboard on click',
    icon: '📋',
    tags: ['all']
  },
  toggle: {
    name: 'Toggle',
    attr: 'x-toggle',
    desc: 'Toggle a CSS class on click with visual feedback',
    icon: '🔀',
    tags: ['all']
  },
  collapse: {
    name: 'Collapse',
    attr: 'x-collapse',
    desc: 'Make content collapsible/expandable',
    icon: '📂',
    tags: ['section', 'article', 'aside', 'div', 'details', 'nav']
  },
  
  // Visual effects
  ripple: {
    name: 'Ripple',
    attr: 'x-ripple',
    desc: 'Material-style ripple effect on click',
    icon: '💧',
    tags: ['all']
  },
  
  // Position behaviors
  sticky: {
    name: 'Sticky',
    attr: 'x-sticky',
    desc: 'Stick element to top when scrolling past it',
    icon: '📌',
    tags: ['header', 'nav', 'aside', 'div', 'section']
  },
  scrollalong: {
    name: 'Scroll Along',
    attr: 'x-scrollalong',
    desc: 'Sidebar that follows scroll using CSS sticky',
    icon: '📄',
    tags: ['aside', 'nav', 'div']
  },
  
  // Movement behaviors
  draggable: {
    name: 'Draggable',
    attr: 'x-draggable',
    desc: 'Make element draggable with mouse/touch',
    icon: '✨',
    tags: ['all']
  },
  resizable: {
    name: 'Resizable',
    attr: 'x-resizable',
    desc: 'Make element resizable with drag handles',
    icon: '↔️',
    tags: ['div', 'aside', 'section', 'article', 'figure', 'img', 'video', 'iframe']
  },
  
  // Scroll behaviors  
  scrollProgress: {
    name: 'Scroll Progress',
    attr: 'x-scroll-progress',
    desc: 'Shows scroll progress indicator',
    icon: '📊',
    tags: ['div', 'header', 'nav']
  },
  
  // Theme behaviors
  darkmode: {
    name: 'Dark Mode',
    attr: 'x-darkmode',
    desc: 'Apply dark theme to target element',
    icon: '🌙',
    tags: ['div', 'section', 'article', 'main', 'aside']
  }
};

/**
 * Get applicable behaviors for a semantic tag
 */
function getApplicableBehaviors(tag) {
  const applicable = [];
  for (const [key, behavior] of Object.entries(X_BEHAVIORS)) {
    if (behavior.tags.includes('all') || behavior.tags.includes(tag)) {
      applicable.push({ key, ...behavior });
    }
  }
  return applicable;
}

// ============================================================================
// SEMANTIC PROPERTIES PANEL
// ============================================================================

/**
 * Show properties panel for semantic elements
 * Order: 1. Text Content, 2. Style, then other properties
 */
function showSemanticProperties(comp) {
  const panel = document.getElementById('propertiesPanel');
  const tag = comp.data?.tag || 'div';
  const behaviors = getApplicableBehaviors(tag);
  
  const appliedBehaviors = {};
  const contentEl = comp.element?.querySelector('.component-content');
  const semanticEl = contentEl?.firstElementChild;
  
  // Ensure element is contenteditable
  if (semanticEl && !semanticEl.hasAttribute('contenteditable')) {
    semanticEl.setAttribute('contenteditable', 'true');
  }
  
  const currentTextContent = semanticEl?.textContent || '';
  const currentStyle = semanticEl?.getAttribute('style') || '';
  
  for (const behavior of behaviors) {
    if (semanticEl?.hasAttribute(behavior.attr)) {
      appliedBehaviors[behavior.attr] = semanticEl.getAttribute(behavior.attr) || '';
    }
  }
  
  const behaviorsHtml = behaviors.map(b => {
    const isEnabled = b.attr in appliedBehaviors;
    const currentValue = appliedBehaviors[b.attr] || '';
    
    let extraInput = '';
    if (b.attr === 'x-tooltip' && isEnabled) {
      extraInput = `
        <div style="margin: 0.5rem 0 0.5rem 2.5rem; padding-left: 0.5rem; border-left: 2px solid var(--primary);">
          <input type="text" 
            value="${currentValue.replace(/"/g, '&quot;')}" 
            placeholder="Enter tooltip text..."
            onchange="updateBehaviorValue('${comp.id}', 'x-tooltip', this.value)"
            style="width: 100%; font-size: 0.85rem;">
        </div>
      `;
    }
    
    return `
      <label class="behavior-checkbox" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; background: var(--bg-tertiary); border-radius: 6px; cursor: pointer; margin-bottom: ${isEnabled && b.attr === 'x-tooltip' ? '0' : '0.5rem'};" title="${b.desc}">
        <input type="checkbox" 
          ${isEnabled ? 'checked' : ''}
          onchange="toggleSemanticBehavior('${comp.id}', '${b.attr}', this.checked)"
          style="accent-color: var(--primary); width: 18px; height: 18px;">
        <span style="font-size: 1rem;">${b.icon}</span>
        <span style="flex: 1; font-weight: 500;">${b.name}</span>
        <span style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">${b.attr}</span>
      </label>
      ${extraInput}
    `;
  }).join('');
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>${comp.data?.icon || '🏷️'} ${comp.data?.name || 'Element'}</h4>
      <p style="color: var(--text-secondary); font-size: 0.8rem; margin: -0.25rem 0 0.5rem 0;">
        <code style="background: var(--bg-tertiary); padding: 0.2rem 0.5rem; border-radius: 4px;">&lt;${tag}&gt;</code>
        <span style="margin-left: 0.5rem; font-size: 0.7rem; color: var(--text-muted);">contenteditable</span>
      </p>
      
      <!-- 1. TEXT CONTENT (First) -->
      <div class="property">
        <label>📝 Text Content</label>
        <textarea 
          id="textContent-${comp.id}"
          rows="3"
          placeholder="Enter text content..."
          onchange="updateSemanticTextContent('${comp.id}', this.value)"
          style="width: 100%; font-family: inherit; resize: vertical;">${currentTextContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
        <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
          💡 Edit text here or directly on the canvas
        </p>
      </div>
      
      <!-- 2. STYLE (Second) -->
      <div class="property">
        <label>🎨 Style</label>
        <textarea 
          id="style-${comp.id}"
          rows="3"
          placeholder="CSS styles (e.g., color: red; padding: 1rem;)"
          onchange="updateSemanticStyle('${comp.id}', this.value)"
          style="width: 100%; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85rem; resize: vertical;">${currentStyle.replace(/"/g, '&quot;')}</textarea>
        <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
          💡 Inline CSS styles for this element
        </p>
      </div>
      
      <!-- 3. ID -->
      <div class="property">
        <label>ID</label>
        <input type="text" value="${comp.data?.elementId || ''}" 
          placeholder="Optional element ID"
          readonly disabled title="IDs are static; edit source files to change">
        <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:0.25rem;">IDs are static — edit source files to change.</div>
      </div>
      
      <!-- 4. CSS Classes -->
      <div class="property">
        <label>CSS Classes</label>
        <input type="text" value="${comp.data?.cssClasses || ''}" 
          placeholder="space-separated classes"
          onchange="updateSemanticClasses('${comp.id}', this.value)">
      </div>
      
      <!-- 5. WB Behaviors -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 0.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem;">🛠️ WB Behaviors</label>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Add interactivity with x- attributes</p>
        ${behaviorsHtml}
      </div>
    </div>
    ${typeof getThemeSelectorHtml === 'function' ? getThemeSelectorHtml(comp) : ''}
    ${typeof getInlineStyleToggleHtml === 'function' ? getInlineStyleToggleHtml(comp) : ''}
    ${typeof getSpacingControlsHtml === 'function' ? getSpacingControlsHtml(comp) : ''}
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete</button>
  `;
}

// ============================================================================
// SEMANTIC UPDATE FUNCTIONS
// ============================================================================

/**
 * Update semantic element text content
 */
function updateSemanticTextContent(componentId, text) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const contentEl = comp.element?.querySelector('.component-content');
  const semanticEl = contentEl?.firstElementChild;
  if (!semanticEl) return;
  
  semanticEl.textContent = text;
  semanticEl.setAttribute('contenteditable', 'true');
  comp.html = contentEl.innerHTML;
  
  if (window.scheduleSave) window.scheduleSave();
}

/**
 * Update semantic element inline style
 */
function updateSemanticStyle(componentId, styleString) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const contentEl = comp.element?.querySelector('.component-content');
  const semanticEl = contentEl?.firstElementChild;
  if (!semanticEl) return;
  
  if (styleString.trim()) {
    semanticEl.setAttribute('style', styleString);
  } else {
    semanticEl.removeAttribute('style');
  }
  
  comp.html = contentEl.innerHTML;
  
  if (window.scheduleSave) window.scheduleSave();
  if (typeof updateStatus === 'function') updateStatus('Style updated');
}

/**
 * Toggle a behavior on a semantic element
 */
function toggleSemanticBehavior(componentId, behaviorAttr, enabled) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const contentEl = comp.element.querySelector('.component-content');
  if (!contentEl) return;
  
  const semanticEl = contentEl.firstElementChild;
  if (!semanticEl) return;
  
  if (enabled) {
    semanticEl.setAttribute(behaviorAttr, '');
  } else {
    semanticEl.removeAttribute(behaviorAttr);
  }
  
  comp.html = contentEl.innerHTML;
  showSemanticProperties(comp);
}

/**
 * Update a behavior attribute value (e.g., tooltip text)
 */
function updateBehaviorValue(componentId, behaviorAttr, value) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const contentEl = comp.element.querySelector('.component-content');
  const semanticEl = contentEl?.firstElementChild;
  if (!semanticEl) return;
  
  semanticEl.setAttribute(behaviorAttr, value);
  comp.html = contentEl.innerHTML;
}

/**
 * Update semantic element ID (no-op - IDs are static)
 */
function updateSemanticId(componentId, newId) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  console.warn('[Builder] ID changes are disabled. Edit source files to change element IDs. Attempted to set:', newId);
  comp.data.elementId = comp.data.elementId || '';
}

/**
 * Update semantic element CSS classes
 */
function updateSemanticClasses(componentId, classes) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const contentEl = comp.element.querySelector('.component-content');
  const semanticEl = contentEl?.firstElementChild;
  if (!semanticEl) return;
  
  const existingClasses = Array.from(semanticEl.classList);
  const wbClasses = existingClasses.filter(c => c.startsWith('wb-'));
  semanticEl.className = '';
  wbClasses.forEach(c => semanticEl.classList.add(c));
  
  if (classes.trim()) {
    classes.trim().split(/\s+/).forEach(c => semanticEl.classList.add(c));
  }
  
  comp.data.cssClasses = classes.trim();
  comp.html = contentEl.innerHTML;
}

// ============================================================================
// SEMANTIC ELEMENTS CATALOG
// ============================================================================

const SEMANTIC_ELEMENTS = {
  structure: {
    name: 'Structure',
    items: [
      { tag: 'section', icon: '📑', name: 'Section', desc: 'Thematic grouping of content' },
      { tag: 'article', icon: '📰', name: 'Article', desc: 'Self-contained composition' },
      { tag: 'aside', icon: '📎', name: 'Aside', desc: 'Tangentially related content' },
      { tag: 'nav', icon: '🧭', name: 'Nav', desc: 'Navigation links' },
      { tag: 'main', icon: '🎯', name: 'Main', desc: 'Main content of document' },
      { tag: 'div', icon: '📦', name: 'Div', desc: 'Generic container' }
    ]
  },
  content: {
    name: 'Content',
    items: [
      { tag: 'header', icon: '🔝', name: 'Header', desc: 'Introductory content' },
      { tag: 'footer', icon: '🔻', name: 'Footer', desc: 'Footer for section' },
      { tag: 'figure', icon: '🖼️', name: 'Figure', desc: 'Self-contained figure' },
      { tag: 'figcaption', icon: '📝', name: 'Figcaption', desc: 'Caption for figure' },
      { tag: 'blockquote', icon: '💬', name: 'Blockquote', desc: 'Extended quotation' },
      { tag: 'address', icon: '📍', name: 'Address', desc: 'Contact information' }
    ]
  },
  interactive: {
    name: 'Interactive',
    items: [
      { tag: 'details', icon: '📂', name: 'Details', desc: 'Disclosure widget' },
      { tag: 'summary', icon: '📋', name: 'Summary', desc: 'Summary for details' },
      { tag: 'dialog', icon: '💭', name: 'Dialog', desc: 'Dialog box' }
    ]
  },
  text: {
    name: 'Text',
    items: [
      { tag: 'p', icon: '¶', name: 'Paragraph', desc: 'Paragraph of text' },
      { tag: 'h1', icon: 'H1', name: 'Heading 1', desc: 'Top-level heading' },
      { tag: 'h2', icon: 'H2', name: 'Heading 2', desc: 'Section heading' },
      { tag: 'h3', icon: 'H3', name: 'Heading 3', desc: 'Subsection heading' },
      { tag: 'pre', icon: '💻', name: 'Pre', desc: 'Preformatted text' },
      { tag: 'code', icon: '⌨️', name: 'Code', desc: 'Code snippet' }
    ]
  },
  lists: {
    name: 'Lists',
    items: [
      { tag: 'ul', icon: '•', name: 'Unordered List', desc: 'Bullet list' },
      { tag: 'ol', icon: '1.', name: 'Ordered List', desc: 'Numbered list' },
      { tag: 'dl', icon: '📖', name: 'Definition List', desc: 'Term/definition pairs' }
    ]
  },
  media: {
    name: 'Media',
    items: [
      { tag: 'img', icon: '🖼️', name: 'Image', desc: 'Image element' },
      { tag: 'video', icon: '🎬', name: 'Video', desc: 'Video player' },
      { tag: 'audio', icon: '🔊', name: 'Audio', desc: 'Audio player' },
      { tag: 'iframe', icon: '🪟', name: 'IFrame', desc: 'Embedded frame' }
    ]
  }
};

// ============================================================================
// SEMANTIC ELEMENT DEFAULT CONTENT
// ============================================================================

/**
 * Get default content and styles for a semantic tag
 */
function getSemanticDefaults(tag) {
  let defaultContent = '';
  let defaultStyles = 'padding: 1rem; border: 1px dashed var(--border-color); border-radius: 6px; min-height: 60px;';
  
  switch(tag) {
    case 'section':
    case 'article':
    case 'aside':
    case 'main':
    case 'div':
      defaultContent = `<p style="color: var(--text-secondary); margin: 0;">Click to edit ${tag} content...</p>`;
      break;
    case 'nav':
      defaultContent = `<a href="#" style="margin-right: 1rem;">Link 1</a><a href="#" style="margin-right: 1rem;">Link 2</a><a href="#">Link 3</a>`;
      defaultStyles += ' display: flex; gap: 1rem;';
      break;
    case 'header':
    case 'footer':
      defaultContent = `<p style="color: var(--text-secondary); margin: 0;">${tag.charAt(0).toUpperCase() + tag.slice(1)} content...</p>`;
      break;
    case 'figure':
      defaultContent = `<div style="background: var(--bg-tertiary); height: 150px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">🖼️ Image placeholder</div><figcaption style="text-align: center; margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">Figure caption</figcaption>`;
      break;
    case 'figcaption':
      defaultContent = 'Figure caption text';
      defaultStyles = 'text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 0.5rem;';
      break;
    case 'blockquote':
      defaultContent = `<p style="font-style: italic; margin: 0;">"This is a quotation..."</p><cite style="display: block; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">— Author Name</cite>`;
      defaultStyles += ' border-left: 4px solid var(--primary); padding-left: 1.5rem;';
      break;
    case 'address':
      defaultContent = `123 Street Name<br>City, State 12345<br><a href="mailto:email@example.com">email@example.com</a>`;
      break;
    case 'details':
      defaultContent = `<summary style="cursor: pointer; font-weight: 600;">Click to expand</summary><p style="margin: 0.5rem 0 0 0;">Hidden content goes here...</p>`;
      break;
    case 'summary':
      defaultContent = 'Summary text (use inside details)';
      break;
    case 'dialog':
      defaultContent = `<p style="margin: 0;">Dialog content</p>`;
      defaultStyles += ' background: var(--bg-primary);';
      break;
    case 'p':
      defaultContent = 'Paragraph text goes here. Click to edit.';
      defaultStyles = 'margin: 0; padding: 0.5rem 0;';
      break;
    case 'h1':
      defaultContent = 'Heading 1';
      defaultStyles = 'font-size: 2rem; font-weight: 700; margin: 0; padding: 0.5rem 0;';
      break;
    case 'h2':
      defaultContent = 'Heading 2';
      defaultStyles = 'font-size: 1.5rem; font-weight: 600; margin: 0; padding: 0.5rem 0;';
      break;
    case 'h3':
      defaultContent = 'Heading 3';
      defaultStyles = 'font-size: 1.25rem; font-weight: 600; margin: 0; padding: 0.5rem 0;';
      break;
    case 'pre':
      defaultContent = 'function example() {\n  console.log("code here");\n}';
      defaultStyles = 'background: var(--bg-tertiary); padding: 1rem; border-radius: 6px; font-family: monospace; overflow-x: auto;';
      break;
    case 'code':
      defaultContent = 'const code = "inline";';
      defaultStyles = 'background: var(--bg-tertiary); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace;';
      break;
    case 'ul':
      defaultContent = '<li>List item 1</li><li>List item 2</li><li>List item 3</li>';
      defaultStyles = 'padding-left: 1.5rem; margin: 0;';
      break;
    case 'ol':
      defaultContent = '<li>First item</li><li>Second item</li><li>Third item</li>';
      defaultStyles = 'padding-left: 1.5rem; margin: 0;';
      break;
    case 'dl':
      defaultContent = '<dt style="font-weight: 600;">Term 1</dt><dd style="margin-left: 1rem;">Definition 1</dd><dt style="font-weight: 600;">Term 2</dt><dd style="margin-left: 1rem;">Definition 2</dd>';
      defaultStyles = 'margin: 0;';
      break;
    case 'img':
      defaultContent = '';
      defaultStyles = 'display: block; width: 100%; max-width: 400px; height: 200px; background: var(--bg-tertiary); border-radius: 6px;';
      break;
    case 'video':
      defaultContent = '<source src="" type="video/mp4"><p>Video not supported</p>';
      defaultStyles = 'width: 100%; max-width: 600px; background: var(--bg-tertiary); border-radius: 6px;';
      break;
    case 'audio':
      defaultContent = '<source src="" type="audio/mpeg"><p>Audio not supported</p>';
      defaultStyles = 'width: 100%;';
      break;
    case 'iframe':
      defaultContent = '';
      defaultStyles = 'width: 100%; height: 300px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-tertiary);';
      break;
    default:
      defaultContent = `${tag} content`;
  }
  
  return { defaultContent, defaultStyles };
}

// ============================================================================
// ADD SEMANTIC ELEMENT TO CANVAS
// ============================================================================

/**
 * Add a semantic HTML element to the canvas
 */
function addSemanticElement(tag, section, itemInfo) {
  const componentId = `comp-${componentIdCounter++}`;
  const { defaultContent, defaultStyles } = getSemanticDefaults(tag);
  const html = `<${tag} style="${defaultStyles}">${defaultContent}</${tag}>`;
  
  const componentEl = document.createElement('div');
  componentEl.className = 'canvas-component';
  componentEl.id = componentId;
  componentEl.tabIndex = 0;
  componentEl.dataset.type = `semantic-${tag}`;
  componentEl.innerHTML = `
    <div class="component-content" contenteditable="true">${html}</div>
    <div class="component-overlay">
      <span class="component-label">${itemInfo.icon} ${itemInfo.name}</span>
      <div class="component-overlay-actions">
        <button id="html-btn-${componentId}" class="component-html-btn" onclick="toggleComponentHtml('${componentId}', event)" title="Show/Hide HTML">{ }</button>
        <button id="delete-btn-${componentId}" class="component-delete-btn" onclick="deleteComponent('${componentId}', event)" title="Delete">🗑️</button>
      </div>
    </div>
    <div class="component-html-view" style="display: none;"></div>
  `;

  const pseudoTemplate = {
    name: itemInfo.name,
    icon: itemInfo.icon,
    html: html,
    isSemantic: true,
    tag: tag
  };
  
  componentEl.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('component-delete-btn') &&
        !e.target.classList.contains('component-html-btn')) {
      selectComponent(componentEl, `semantic-${tag}`, pseudoTemplate);
    }
  });
  
  const contentEl = componentEl.querySelector('.component-content');
  contentEl.addEventListener('blur', () => {
    const comp = components.find(c => c.id === componentId);
    if (comp) comp.html = contentEl.innerHTML;
  });
  contentEl.addEventListener('input', () => {
    const comp = components.find(c => c.id === componentId);
    if (comp) comp.html = contentEl.innerHTML;
  });
  
  componentEl.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedComponent && selectedComponent.id === componentId) {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.getAttribute('contenteditable') === 'true') return;
      deleteComponent(componentId);
    }
  });
  
  const container = document.getElementById(`${section}-container`);
  const dropZone = container.querySelector('.canvas-drop-zone');
  container.insertBefore(componentEl, dropZone);
  dropZone.classList.add('has-items');
  
  components.push({
    id: componentId,
    type: `semantic-${tag}`,
    section: section,
    element: componentEl,
    template: pseudoTemplate,
    html: html,
    data: { tag: tag, name: itemInfo.name, icon: itemInfo.icon }
  });
  
  ensureDropZoneLast(`${section}-container`);
  updateComponentCount();
  
  if (window.scheduleSave) window.scheduleSave();
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

/**
 * Show component picker context menu on drop zone right-click
 */
function showSemanticContextMenu(e, dropZone) {
  e.preventDefault();

  document.getElementById('semanticContextMenu')?.remove();

  const section = dropZone.getAttribute('section') || dropZone.dataset.section;
  
  const STORAGE_KEY = 'wb-semantic-menu-size';
  let savedWidth = 1000;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.width) savedWidth = parsed.width;
    }
  } catch (e) { /* use defaults */ }

  const menu = document.createElement('div');
  menu.id = 'semanticContextMenu';
  menu.className = 'context-menu semantic-menu';
  menu.tabIndex = -1;
  
  const startLeft = Math.max(20, (window.innerWidth - savedWidth) / 2);
  const startTop = Math.max(20, window.innerHeight * 0.03);
  
  menu.style.cssText = `
    position: fixed;
    left: ${startLeft}px;
    top: ${startTop}px;
    width: ${savedWidth}px;
    min-width: 600px;
    max-width: 95vw;
    max-height: 94vh;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 10px 50px rgba(0,0,0,0.5);
    z-index: 10000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  menu.innerHTML = `
    <div class="semantic-header" style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid var(--border-color); cursor:grab; user-select:none; background: var(--bg-tertiary); flex-shrink: 0;">
      <div style="line-height:1.3">
        <div style="font-weight:700; font-size:1.1rem;">📦 Add Component</div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">to <strong>${section}</strong> section • Click to add</div>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <button class="semantic-close-btn" title="Close (Esc)" style="background:var(--bg-secondary);border:1px solid var(--border-color);cursor:pointer;padding:0.4rem 0.6rem;border-radius:6px;font-size:0.9rem;">✕</button>
      </div>
    </div>
    <div class="semantic-content" style="padding:1rem; overflow-y: auto; flex: 1;">
    </div>
  `;

  document.body.appendChild(menu);

  const header = menu.querySelector('.semantic-header');
  const content = menu.querySelector('.semantic-content');
  const closeBtn = menu.querySelector('.semantic-close-btn');

  function createComponentCard(icon, name, subtitle, id, onClick) {
    const safeIcon = (icon && icon.length < 10 && !icon.includes('<')) ? icon : '📦';
    
    const card = document.createElement('div');
    card.className = 'component-picker-card';
    card.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      cursor: pointer;
      background: var(--bg-tertiary);
      border: 1px solid transparent;
      transition: all 0.15s ease;
      width: 180px;
      height: 60px;
      box-sizing: border-box;
    `;
    card.innerHTML = `
      <div style="font-size:1.2rem; width:32px; text-align:center; flex-shrink:0;">${safeIcon}</div>
      <div style="flex:1; min-width:0; overflow:hidden;">
        <div style="font-weight:600; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
        <div style="font-size:0.7rem; color:var(--text-muted); font-family:monospace;">${subtitle}</div>
      </div>
    `;

    card.addEventListener('mouseenter', () => {
      card.style.background = 'var(--primary)';
      card.style.color = 'white';
      card.style.borderColor = 'var(--primary)';
      card.style.transform = 'translateY(-1px)';
      card.style.boxShadow = '0 3px 10px rgba(99, 102, 241, 0.25)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = 'var(--bg-tertiary)';
      card.style.color = '';
      card.style.borderColor = 'transparent';
      card.style.transform = 'none';
      card.style.boxShadow = 'none';
    });
    card.addEventListener('click', onClick);
    
    return card;
  }

  function renderAllComponents() {
    content.innerHTML = '';
    
    const pageSet = pageComponentSets[currentPageId] || pageComponentSets.default;
    
    // Page Components Section
    const pageSection = document.createElement('div');
    pageSection.style.marginBottom = '1.5rem';
    
    let pageComponents = [];
    if (section === 'header' && pageSet.header) pageComponents = pageSet.header;
    else if (section === 'footer' && pageSet.footer) pageComponents = pageSet.footer;
    else if (section === 'main' && pageSet.main) pageComponents = pageSet.main;
    else pageComponents = pageSet.main || [];
    
    if (pageComponents.length > 0) {
      const sectionHeader = document.createElement('div');
      sectionHeader.style.cssText = 'font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);';
      sectionHeader.textContent = '🎯 Page Components';
      pageSection.appendChild(sectionHeader);
      
      const grid = document.createElement('div');
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, 180px); gap: 0.6rem; justify-content: start;';
      
      pageComponents.forEach(comp => {
        const card = createComponentCard(comp.icon, comp.name, 'Page Component', comp.id, () => {
          try {
            addComponentToCanvas(comp.id, section);
          } catch (err) {
            console.error('[SemanticMenu] addComponentToCanvas failed', err);
          }
          setTimeout(() => menu.remove(), 50);
        });
        grid.appendChild(card);
      });
      
      pageSection.appendChild(grid);
      content.appendChild(pageSection);
    }
    
    // Semantic Elements Sections
    for (const [catId, category] of Object.entries(SEMANTIC_ELEMENTS)) {
      const catSection = document.createElement('div');
      catSection.style.marginBottom = '1.5rem';
      
      const catHeader = document.createElement('div');
      catHeader.style.cssText = 'font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);';
      catHeader.textContent = `🏗️ ${category.name}`;
      catSection.appendChild(catHeader);
      
      const grid = document.createElement('div');
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, 180px); gap: 0.6rem; justify-content: start;';
      
      category.items.forEach(item => {
        const card = createComponentCard(item.icon, item.name, `<${item.tag}>`, item.tag, async () => {
          addSemanticElement(item.tag, section, item);
          menu.remove();
        });
        grid.appendChild(card);
      });
      
      catSection.appendChild(grid);
      content.appendChild(catSection);
    }
  }

  renderAllComponents();

  // Resize observer
  const resizeObserver = new ResizeObserver(() => {
    const rect = menu.getBoundingClientRect();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ width: Math.round(rect.width) }));
    } catch (e) { /* ignore */ }
  });
  resizeObserver.observe(menu);

  // Close handlers
  closeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    resizeObserver.disconnect();
    menu.remove();
  });

  setTimeout(() => {
    function outsideClick(e) {
      if (!menu.contains(e.target)) {
        resizeObserver.disconnect();
        menu.remove();
        document.removeEventListener('click', outsideClick);
      }
    }
    document.addEventListener('click', outsideClick);
  }, 0);

  function keyHandler(e) {
    if (e.key === 'Escape') {
      resizeObserver.disconnect();
      menu.remove();
      document.removeEventListener('keydown', keyHandler);
    }
  }
  document.addEventListener('keydown', keyHandler);

  // Draggable header
  let dragging = false;
  let startX = 0, startY = 0, origLeft = 0, origTop = 0;

  function clampPosition(left, top) {
    const rect = menu.getBoundingClientRect();
    return {
      left: Math.max(8, Math.min(left, window.innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(top, window.innerHeight - rect.height - 8))
    };
  }

  function onPointerMove(ev) {
    if (!dragging) return;
    const { left, top } = clampPosition(origLeft + ev.clientX - startX, origTop + ev.clientY - startY);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }

  function onPointerUp() {
    dragging = false;
    header.style.cursor = 'grab';
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  }

  header.addEventListener('pointerdown', (ev) => {
    if (ev.target.closest('button')) return;
    ev.preventDefault();
    dragging = true;
    startX = ev.clientX;
    startY = ev.clientY;
    origLeft = menu.getBoundingClientRect().left;
    origTop = menu.getBoundingClientRect().top;
    header.style.cursor = 'grabbing';
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
  window.X_BEHAVIORS = X_BEHAVIORS;
  window.getApplicableBehaviors = getApplicableBehaviors;
  window.showSemanticProperties = showSemanticProperties;
  window.updateSemanticTextContent = updateSemanticTextContent;
  window.updateSemanticStyle = updateSemanticStyle;
  window.toggleSemanticBehavior = toggleSemanticBehavior;
  window.updateBehaviorValue = updateBehaviorValue;
  window.updateSemanticId = updateSemanticId;
  window.updateSemanticClasses = updateSemanticClasses;
  window.SEMANTIC_ELEMENTS = SEMANTIC_ELEMENTS;
  window.getSemanticDefaults = getSemanticDefaults;
  window.addSemanticElement = addSemanticElement;
  window.showSemanticContextMenu = showSemanticContextMenu;
}

console.log('[BuilderSemantic] ✅ Loaded');
