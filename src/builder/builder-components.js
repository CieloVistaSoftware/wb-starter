/**
 * Builder Components - Component creation and management
 */

/**
 * Ensure drop zone is always the last element in a container
 * Call this after any operation that modifies the canvas
 */
function ensureDropZoneLast(containerId = 'main-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const dropZone = container.querySelector('.canvas-drop-zone');
  if (dropZone && dropZone !== container.lastElementChild) {
    container.appendChild(dropZone);
  }
}

// Ensure all section drop zones are last
function ensureAllDropZonesLast() {
  ['main-container', 'header-container', 'footer-container'].forEach(id => {
    ensureDropZoneLast(id);
  });
}

// Render component library
function renderComponentLibrary() {
  const library = document.getElementById('componentLibrary');
  if (!library) return;
  
  const pageSet = pageComponentSets[currentPageId] || pageComponentSets.default;
  let html = '';
  
  if (currentPageId === 'home') {
    if (pageSet.header && pageSet.header.length > 0) {
      html += '<h3>🔝 Header Components</h3>';
      pageSet.header.forEach(comp => {
        html += `<div class="component-item" draggable="true" component="${comp.id}">${comp.icon} ${comp.name}</div>`;
      });
    }
  }
  
  if (pageSet.main && pageSet.main.length > 0) {
    const sectionTitle = currentPageId === 'home' ? '📄 Main Content' : `📄 ${getCurrentPage()?.name || 'Page'} Components`;
    html += `<h3>${sectionTitle}</h3>`;
    pageSet.main.forEach(comp => {
      html += `<div class="component-item" draggable="true" component="${comp.id}">${comp.icon} ${comp.name}</div>`;
    });
  }
  
  if (currentPageId === 'home') {
    if (pageSet.footer && pageSet.footer.length > 0) {
      html += '<h3>🔻 Footer Components</h3>';
      pageSet.footer.forEach(comp => {
        html += `<div class="component-item" draggable="true" component="${comp.id}">${comp.icon} ${comp.name}</div>`;
      });
    }
  } else {
    html += `<div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 6px; font-size: 0.8rem; color: var(--text-secondary);">
      <strong>💡 Tip:</strong> Header & Footer are shared across all pages. Edit them on the Home page.
    </div>`;
  }
  
  library.innerHTML = html;
  
  library.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedComponent = item.dataset.component;
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
}

// Add component to canvas
function addComponentToCanvas(componentType, section, customData = null) {
  const template = componentTemplates[componentType];
  if (!template) return;

  if (componentType === 'features' && section !== 'main') {
    alert('⚠️ Features component can only be added to the Main Content section');
    return;
  }

  const existingComponent = components.find(c => c.section === section && c.type === componentType);
  if (existingComponent && !customData) {
    if (!confirm(`A "${template.name}" already exists in the ${section} section.\n\nAdd another one?`)) return;
  }

  const componentId = `comp-${componentIdCounter++}`;
  let componentData = customData || {};
  
  // Initialize data for different component types
  if (template.isFeatureGrid && !componentData.cards) {
    componentData.cards = [
      { icon: '✨', title: 'Feature 1', description: 'Description goes here' },
      { icon: '⚡', title: 'Feature 2', description: 'Description goes here' },
      { icon: '🚀', title: 'Feature 3', description: 'Description goes here' }
    ];
    componentData.selectedCard = 0;
  }
  
  if (template.isPricingGrid && !componentData.cards) {
    componentData.cards = [
      { name: 'Basic', price: '$29', period: '/month', features: ['Feature 1', 'Feature 2'], highlighted: false },
      { name: 'Pro', price: '$99', period: '/month', features: ['All Basic features', 'Feature 3'], highlighted: true },
      { name: 'Enterprise', price: 'Custom', period: '', features: ['All Pro features', 'Dedicated support'], highlighted: false }
    ];
    componentData.selectedCard = 0;
  }
  
  if (template.isCard && !componentData.cardType) {
    componentData.cardType = 'basic';
    componentData.icon = '🖼️';
    componentData.title = 'Card Title';
    componentData.description = 'Card content goes here';
  }
  
  if (template.isCTA && !componentData.contactType) {
    componentData.contactType = 'phone';
    componentData.phoneNumber = '(555) 123-4567';
    componentData.title = 'Ready to get started?';
    componentData.description = 'Contact us today!';
    componentData.gradientStart = '#667eea';
    componentData.gradientEnd = '#764ba2';
  }
  
  let html = template.getHtml ? template.getHtml(componentData) : template.html;
  
  const componentEl = document.createElement('div');
  componentEl.className = 'canvas-component';
  componentEl.id = componentId;
  componentEl.tabIndex = 0;
  componentEl.dataset.type = componentType; // For CSS spacing rules
  
  const isEditable = !template.isFeatureGrid && !template.isPricingGrid && !template.isCard && !template.isCTA;
  componentEl.innerHTML = `
    <div class="component-content" ${isEditable ? 'contenteditable="true"' : ''}>${html}</div>
    <div class="component-overlay">
      <span class="component-label">${template.icon} ${template.name}</span>
      <div class="component-overlay-actions">
        <button id="html-btn-${componentId}" class="component-html-btn" onclick="toggleComponentHtml('${componentId}', event)" title="Show/Hide HTML">{ }</button>
        <button id="delete-btn-${componentId}" class="component-delete-btn" onclick="deleteComponent('${componentId}', event)" title="Delete">🗑️</button>
      </div>
    </div>
    <div class="component-html-view" style="display: none;"></div>
  `;
  
  componentEl.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('component-delete-btn') && 
        !e.target.classList.contains('component-html-btn')) {
      selectComponent(componentEl, componentType, template);
    }
  });
  
  const contentEl = componentEl.querySelector('.component-content');
  contentEl.addEventListener('blur', () => {
    const comp = components.find(c => c.id === componentId);
    if (comp) {
      comp.html = contentEl.innerHTML;
      if (window.scheduleSave) window.scheduleSave();
    }
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
    type: componentType,
    section: section,
    element: componentEl,
    template: template,
    html: html,
    data: componentData
  });
  
  if (template.isFeatureGrid) setupFeatureGridClickHandlers(componentId);
  if (template.isPricingGrid) setupPricingGridClickHandlers(componentId);
  if (componentType === 'navbar') createNavbarPages();

  // Ensure drop zone stays last
  ensureDropZoneLast(`${section}-container`);

  updateComponentCount();
  
  // Schedule auto-save
  if (window.scheduleSave) window.scheduleSave();
}

// Restore a component from saved data
function restoreComponent(compData, template) {
  const componentId = compData.id || `comp-${componentIdCounter++}`;
  
  let html = compData.html;
  if (!html && template.getHtml) {
    if (compData.type === 'navbar') {
      html = template.getHtml(compData.data?.logo || 'Logo');
    } else {
      html = template.getHtml(compData.data || {});
    }
  }
  if (!html) html = template.html;
  
  const isEditable = !template.isFeatureGrid && !template.isPricingGrid && !template.isCard && !template.isCTA;
  
  const componentEl = document.createElement('div');
  componentEl.className = 'canvas-component';
  componentEl.id = componentId;
  componentEl.tabIndex = 0;
  componentEl.dataset.type = compData.type; // For CSS spacing rules
  componentEl.innerHTML = `
    <div class="component-content" ${isEditable ? 'contenteditable="true"' : ''}>${html}</div>
    <div class="component-overlay">
      <span class="component-label">${template.icon} ${template.name}</span>
      <div class="component-overlay-actions">
        <button id="html-btn-${componentId}" class="component-html-btn" onclick="toggleComponentHtml('${componentId}', event)" title="Show/Hide HTML">{ }</button>
        <button id="delete-btn-${componentId}" class="component-delete-btn" onclick="deleteComponent('${componentId}', event)" title="Delete">🗑️</button>
      </div>
    </div>
    <div class="component-html-view" style="display: none;"></div>
  `;
  
  componentEl.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('component-delete-btn') &&
        !e.target.classList.contains('component-html-btn')) {
      selectComponent(componentEl, compData.type, template);
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
  
  const container = document.getElementById(`${compData.section}-container`);
  const dropZone = container.querySelector('.canvas-drop-zone');
  container.insertBefore(componentEl, dropZone);
  dropZone.classList.add('has-items');
  
  components.push({
    id: componentId,
    type: compData.type,
    section: compData.section,
    element: componentEl,
    template: template,
    html: html,
    data: compData.data || {}
  });
  
  if (template.isFeatureGrid) setupFeatureGridClickHandlers(componentId);
  if (template.isPricingGrid) setupPricingGridClickHandlers(componentId);
  
  // Ensure drop zone stays last
  ensureDropZoneLast(`${compData.section}-container`);
}

// Select component and scroll into view
function selectComponent(element, componentType, template) {
  document.querySelectorAll('.canvas-component.selected').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  
  // Scroll component into view at top of canvas viewport
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  selectedComponent = {
    id: element.id,
    type: componentType,
    element: element,
    template: template
  };

  updateActiveElement('component', template.name, template.icon);
  showProperties(template);
}

/**
 * Toggle HTML view for a component
 * Shows/hides the raw HTML code inline in the canvas element
 */
function toggleComponentHtml(componentId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const componentEl = document.getElementById(componentId);
  if (!componentEl) return;

  const contentEl = componentEl.querySelector('.component-content');
  const htmlView = componentEl.querySelector('.component-html-view');
  const htmlBtn = componentEl.querySelector('.component-html-btn');
  
  if (!contentEl || !htmlView) return;

  const isVisible = htmlView.style.display !== 'none';
  
  if (isVisible) {
    // Switch back to visual view - save any edits first
    const textarea = htmlView.querySelector('textarea');
    if (textarea) {
      contentEl.innerHTML = textarea.value;
      // Update stored component data
      const comp = components.find(c => c.id === componentId);
      if (comp) comp.html = textarea.value;
    }
    
    htmlView.style.display = 'none';
    contentEl.style.display = '';
    
    // Restore original height and padding
    if (componentEl.dataset.originalHeight !== undefined) {
      componentEl.style.height = componentEl.dataset.originalHeight;
      delete componentEl.dataset.originalHeight;
    }
    if (componentEl.dataset.originalPadding !== undefined) {
      componentEl.style.padding = componentEl.dataset.originalPadding;
      delete componentEl.dataset.originalPadding;
    }
    
    if (htmlBtn) {
      htmlBtn.classList.remove('active');
      htmlBtn.title = 'Show HTML';
      htmlBtn.style.background = '';
    }
  } else {
    // Switch to HTML view
    const html = contentEl.innerHTML;
    const formatted = formatHtml(html);
    const lineCount = formatted.split('\n').length;
    const displayLines = Math.min(Math.max(lineCount, 4), 24); // min 4, max 24
    const textareaHeight = (displayLines * 38) + 32; // 38px per line (24px font * 1.6 line-height) + padding
    console.log(`[HTML Editor] Lines: ${lineCount}, Display: ${displayLines}, Height: ${textareaHeight}px`);
    
    // Load highlight.js CSS if not already loaded
    if (!document.querySelector('link[href*="highlight.js"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
      document.head.appendChild(link);
    }
    
    // Load highlight.js if not already loaded
    if (!window.hljs) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
      script.onload = () => {
        // Load HTML/XML language
        const xmlScript = document.createElement('script');
        xmlScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/xml.min.js';
        xmlScript.onload = () => initHtmlEditor(componentId, formatted, textareaHeight, displayLines, contentEl, htmlView, htmlBtn);
        document.head.appendChild(xmlScript);
      };
      document.head.appendChild(script);
    } else {
      initHtmlEditor(componentId, formatted, textareaHeight, displayLines, contentEl, htmlView, htmlBtn);
    }
  }
}

/**
 * Initialize the HTML editor with syntax highlighting
 */
function initHtmlEditor(componentId, formatted, textareaHeight, displayLines, contentEl, htmlView, htmlBtn) {
  const escaped = escapeHtml(formatted);
  let highlighted = escaped;
  
  // Apply highlight.js if available
  if (window.hljs) {
    try {
      highlighted = hljs.highlight(formatted, { language: 'xml' }).value;
    } catch (e) {
      console.warn('[HTML Editor] Highlight failed:', e);
    }
  }
  
  // Layered editor: textarea behind, highlighted code on top
  // Editor fills 100% of parent with minimal top spacing
  htmlView.innerHTML = `
    <div id="html-editor-container-${componentId}" style="display: flex; flex-direction: column; width: 100%; height: 100%; margin: 0; padding: 0.25rem 0 0 0;">
      <div style="position: relative; flex: 1; border-radius: 6px; overflow: hidden; width: 100%; min-height: 0;">
        <textarea id="html-edit-${componentId}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 1rem; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 24px; background: transparent; color: transparent; caret-color: #fff; border: none; border-radius: 6px; resize: none; line-height: 1.6; overflow: auto; z-index: 2; white-space: pre-wrap; word-wrap: break-word; box-sizing: border-box;"
          spellcheck="false">${escapeHtml(formatted)}</textarea>
        <pre id="html-display-${componentId}" 
          aria-hidden="true"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 1rem; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 24px; background: #282c34; color: #abb2bf; border: none; border-radius: 6px; overflow: auto; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; margin: 0; z-index: 1; pointer-events: none; box-sizing: border-box;"><code class="hljs language-xml">${highlighted}</code></pre>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-shrink: 0;">
        <button id="html-save-${componentId}" class="btn btn-primary btn-sm" style="flex: 1;">💾 Apply Changes</button>
        <button id="html-cancel-${componentId}" class="btn btn-secondary btn-sm">Cancel</button>
      </div>
    </div>
  `;
  
  // Make htmlView fill parent and set parent to 80vh
  const componentEl = document.getElementById(componentId);
  htmlView.style.cssText = 'display: flex; width: 100%; height: 100%; padding: 0; margin: 0;';
  contentEl.style.display = 'none';
  
  // Set component to 80vh height while editing
  if (componentEl) {
    componentEl.dataset.originalHeight = componentEl.style.height || '';
    componentEl.dataset.originalPadding = componentEl.style.padding || '';
    componentEl.style.height = '80vh';
    componentEl.style.padding = '0';
  }
  
  if (htmlBtn) {
    htmlBtn.classList.add('active');
    htmlBtn.title = 'Hide HTML';
    htmlBtn.style.background = 'var(--primary)';
  }
  
  const textarea = document.getElementById(`html-edit-${componentId}`);
  const display = document.getElementById(`html-display-${componentId}`);
  
  // Sync highlighting on input
  textarea?.addEventListener('input', () => {
    if (window.hljs && display) {
      try {
        const code = textarea.value;
        const highlighted = hljs.highlight(code, { language: 'xml' }).value;
        display.innerHTML = `<code class="hljs language-xml">${highlighted}</code>`;
      } catch (e) {
        display.innerHTML = `<code>${escapeHtml(textarea.value)}</code>`;
      }
    }
  });
  
  // Sync scroll position
  textarea?.addEventListener('scroll', () => {
    if (display) {
      display.scrollTop = textarea.scrollTop;
      display.scrollLeft = textarea.scrollLeft;
    }
  });
  
  // Focus textarea
  textarea?.focus();
  
  // Keyboard shortcuts
  textarea?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      document.getElementById(`html-save-${componentId}`)?.click();
    }
    if (e.key === 'Escape') {
      toggleComponentHtml(componentId, null);
    }
    // Tab key inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      textarea.dispatchEvent(new Event('input'));
    }
  });
  
  // Apply button handler
  document.getElementById(`html-save-${componentId}`)?.addEventListener('click', () => {
    const ta = document.getElementById(`html-edit-${componentId}`);
    if (ta) {
      contentEl.innerHTML = ta.value;
      const comp = components.find(c => c.id === componentId);
      if (comp) comp.html = ta.value;
    }
    toggleComponentHtml(componentId, null);
  });
  
  // Cancel button handler
  document.getElementById(`html-cancel-${componentId}`)?.addEventListener('click', () => {
    toggleComponentHtml(componentId, null);
  });
  
  // Scroll component to top of viewport
  componentEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/**
 * Escape HTML entities for display
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Basic HTML formatter for readability
 */
function formatHtml(html) {
  // Remove extra whitespace
  let formatted = html.replace(/\s+/g, ' ').trim();
  
  // Add newlines after closing tags
  formatted = formatted.replace(/(<\/[^>]+>)/g, '$1\n');
  
  // Add newlines before opening tags (except inline elements)
  formatted = formatted.replace(/(<(?!span|a|strong|em|b|i|u|code|mark|small|sub|sup)[a-z][^>]*>)/gi, '\n$1');
  
  // Clean up multiple newlines
  formatted = formatted.replace(/\n\s*\n/g, '\n');
  
  // Basic indentation
  const lines = formatted.split('\n');
  let indent = 0;
  const indentedLines = lines.map(line => {
    line = line.trim();
    if (!line) return '';
    
    // Decrease indent for closing tags
    if (line.match(/^<\//) && indent > 0) {
      indent--;
    }
    
    const indentedLine = '  '.repeat(indent) + line;
    
    // Increase indent for opening tags (not self-closing)
    if (line.match(/^<[a-z][^>]*[^/]>$/i) && !line.match(/^<(img|br|hr|input|meta|link)/i)) {
      indent++;
    }
    
    return indentedLine;
  });
  
  return indentedLines.filter(l => l).join('\n');
}

// Delete component
function deleteComponent(id, event) {
  if (event) event.stopPropagation();
  
  const component = components.find(c => c.id === id);
  if (component) {
    if (component.type === 'navbar') {
      const navbarPages = pages.filter(p => p.id === 'about' || p.id === 'contact');
      if (navbarPages.length > 0) {
        const deletePages = confirm(
          `Delete the Navigation Bar?\n\nAlso delete the linked pages (${navbarPages.map(p => p.name).join(', ')})?\n\nClick OK to delete navbar AND pages\nClick Cancel to delete navbar only`
        );
        if (deletePages) {
          pages = pages.filter(p => p.id !== 'about' && p.id !== 'contact');
          if (currentPageId === 'about' || currentPageId === 'contact') {
            switchToPage('home');
          }
          renderPagesList();
        }
      }
    }
    
    component.element.remove();
    components = components.filter(c => c.id !== id);
    selectedComponent = null;
    document.getElementById('propertiesPanel').innerHTML = 
      `<div class="properties-empty">Click a component to edit its properties</div>`;
    updateComponentCount();
    
    // Schedule auto-save
    if (window.scheduleSave) window.scheduleSave();
}
}

// Duplicate component
function duplicateComponent(componentId) {
  document.getElementById('builderContextMenu')?.remove();
  
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const newComp = {
    ...comp,
    id: `comp-${componentIdCounter++}`,
    data: { ...comp.data }
  };
  
  restoreComponent(newComp, comp.template);
  updateComponentCount();
}

// Move component up
function moveComponentUp(componentId) {
  document.getElementById('builderContextMenu')?.remove();
  const el = document.getElementById(componentId);
  if (!el) return;
  
  const prev = el.previousElementSibling;
  if (prev && !prev.classList.contains('canvas-drop-zone') && !prev.classList.contains('section-label')) {
    el.parentNode.insertBefore(el, prev);
  }
}

// Move component down
function moveComponentDown(componentId) {
  document.getElementById('builderContextMenu')?.remove();
  const el = document.getElementById(componentId);
  if (!el) return;
  
  const next = el.nextElementSibling;
  if (next && !next.classList.contains('canvas-drop-zone')) {
    el.parentNode.insertBefore(next, el);
  }
}

// Update component count
function updateComponentCount() {
  document.getElementById('componentCount').textContent = 
    `${components.length} component${components.length !== 1 ? 's' : ''}`;
}

// ============================================================================
// X-BEHAVIOR DEFINITIONS FOR SEMANTIC ELEMENTS
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

/**
 * Show properties panel for semantic elements
 */
function showSemanticProperties(comp) {
  const panel = document.getElementById('propertiesPanel');
  const tag = comp.data?.tag || 'div';
  const behaviors = getApplicableBehaviors(tag);
  
  // Get currently applied behaviors from the component's HTML
  const appliedBehaviors = {};
  const contentEl = comp.element?.querySelector('.component-content');
  const semanticEl = contentEl?.firstElementChild;
  
  for (const behavior of behaviors) {
    if (semanticEl?.hasAttribute(behavior.attr)) {
      appliedBehaviors[behavior.attr] = semanticEl.getAttribute(behavior.attr) || '';
    }
  }
  
  const behaviorsHtml = behaviors.map(b => {
    const isEnabled = b.attr in appliedBehaviors;
    const currentValue = appliedBehaviors[b.attr] || '';
    
    // Special handling for tooltip - show input when enabled
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
      </p>
      
      <div class="property">
        <label>ID</label>
        <input type="text" value="${comp.data?.elementId || ''}" 
          placeholder="Optional element ID"
          readonly disabled title="IDs are static; edit source files to change">
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.35rem;">IDs are static and must be edited in source files (e.g., pages/ or templates/). The builder does not allow changing IDs.</div>
      </div>
      
      <div class="property">
        <label>CSS Classes</label>
        <input type="text" value="${comp.data?.cssClasses || ''}" 
          placeholder="space-separated classes"
          onchange="updateSemanticClasses('${comp.id}', this.value)">
      </div>
      
      <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 0.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem;">🛠️ WB Behaviors</label>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Add interactivity with x- attributes</p>
        ${behaviorsHtml}
      </div>
    </div>
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete</button>
  `;
}

/**
 * Toggle a behavior on a semantic element
 */
function toggleSemanticBehavior(componentId, behaviorAttr, enabled) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const contentEl = comp.element.querySelector('.component-content');
  if (!contentEl) return;
  
  // Get the actual semantic element inside
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
  
  // Update the attribute value
  semanticEl.setAttribute(behaviorAttr, value);
  
  // Update stored HTML
  comp.html = contentEl.innerHTML;
}

/**
 * Update semantic element ID
 */
function updateSemanticId(componentId, newId) {
  // IDs are treated as static sources of truth and cannot be changed via the builder UI.
  // This function is intentionally a no-op to enforce static IDs. Log an explanatory message for developers.
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  console.warn('[Builder] ID changes are disabled. Edit source files to change element IDs. Attempted to set:', newId);
  // If UI attempted to change value, reset stored value (no mutation)
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
  
  // Remove old custom classes, keep wb- classes
  const existingClasses = Array.from(semanticEl.classList);
  const wbClasses = existingClasses.filter(c => c.startsWith('wb-'));
  semanticEl.className = '';
  wbClasses.forEach(c => semanticEl.classList.add(c));
  
  // Add new classes
  if (classes.trim()) {
    classes.trim().split(/\s+/).forEach(c => semanticEl.classList.add(c));
  }
  
  comp.data.cssClasses = classes.trim();
  comp.html = contentEl.innerHTML;
}

// Export semantic property functions
if (typeof window !== 'undefined') {
  window.X_BEHAVIORS = X_BEHAVIORS;
  window.getApplicableBehaviors = getApplicableBehaviors;
  window.showSemanticProperties = showSemanticProperties;
  window.toggleSemanticBehavior = toggleSemanticBehavior;
  window.updateBehaviorValue = updateBehaviorValue;
  window.updateSemanticId = updateSemanticId;
  window.updateSemanticClasses = updateSemanticClasses;
}

// ============================================================================
// SEMANTIC ELEMENTS CONTEXT MENU
// Right-click on drop zones to add semantic HTML elements
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

/**
 * Show component picker context menu on drop zone right-click
 * Features: Shows ALL components (page components + semantic elements), no scrollbars
 */
function showSemanticContextMenu(e, dropZone) {
  e.preventDefault();

  // Remove existing menu
  document.getElementById('semanticContextMenu')?.remove();

  const section = dropZone.dataset.section;
  
  // Load saved width from localStorage
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
  
  // Center horizontally, position near top
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
      <!-- content populated by JS -->
    </div>
  `;

  document.body.appendChild(menu);

  const header = menu.querySelector('.semantic-header');
  const content = menu.querySelector('.semantic-content');
  const closeBtn = menu.querySelector('.semantic-close-btn');

  // Build all components
  function renderAllComponents() {
    content.innerHTML = '';
    
    // Get page components for current page
    const pageSet = pageComponentSets[currentPageId] || pageComponentSets.default;
    
    // === PAGE COMPONENTS SECTION ===
    const pageSection = document.createElement('div');
    pageSection.style.marginBottom = '1.5rem';
    
    // Collect all page components based on section
    let pageComponents = [];
    
    if (section === 'header' && pageSet.header) {
      pageComponents = pageSet.header;
    } else if (section === 'footer' && pageSet.footer) {
      pageComponents = pageSet.footer;
    } else if (section === 'main' && pageSet.main) {
      pageComponents = pageSet.main;
    } else {
      // Show all for main by default
      pageComponents = pageSet.main || [];
    }
    
    if (pageComponents.length > 0) {
      const sectionHeader = document.createElement('div');
      sectionHeader.style.cssText = 'font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);';
      sectionHeader.textContent = '🎯 Page Components';
      pageSection.appendChild(sectionHeader);
      
      const grid = document.createElement('div');
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, 180px); gap: 0.6rem; justify-content: start;';
      
      pageComponents.forEach(comp => {
        const card = createComponentCard(comp.icon, comp.name, 'Page Component', comp.id, () => {
          addComponentToCanvas(comp.id, section);
          menu.remove();
        });
        grid.appendChild(card);
      });
      
      pageSection.appendChild(grid);
      content.appendChild(pageSection);
    }
    
    // === SEMANTIC ELEMENTS SECTION ===
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
        const card = createComponentCard(item.icon, item.name, `<${item.tag}>`, item.tag, () => {
          addSemanticElement(item.tag, section, item);
          menu.remove();
        });
        grid.appendChild(card);
      });
      
      catSection.appendChild(grid);
      content.appendChild(catSection);
    }
  }
  
  // Helper to create a component card
  function createComponentCard(icon, name, subtitle, id, onClick) {
    // Sanitize icon - only allow text/emoji, not HTML
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

  renderAllComponents();

  // Save width on resize
  const resizeObserver = new ResizeObserver(() => {
    const rect = menu.getBoundingClientRect();
    const newSize = { width: Math.round(rect.width) };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSize));
    } catch (e) { /* ignore */ }
  });
  resizeObserver.observe(menu);

  // Close handler
  closeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    resizeObserver.disconnect();
    menu.remove();
  });

  // Click outside to close (deferred)
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

  // Keyboard: Esc to close
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

/**
 * Add a semantic HTML element to the canvas
 */
function addSemanticElement(tag, section, itemInfo) {
  const componentId = `comp-${componentIdCounter++}`;
  
  // Generate appropriate default content based on tag
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
  
  const html = `<${tag} style="${defaultStyles}">${defaultContent}</${tag}>`;
  
  const componentEl = document.createElement('div');
  componentEl.className = 'canvas-component';
  componentEl.id = componentId;
  componentEl.tabIndex = 0;
  componentEl.dataset.type = `semantic-${tag}`; // For CSS spacing rules
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

  // IDs are static and must be maintained in source files; do not auto-generate IDs at runtime.
  
  // Create a pseudo-template for the semantic element
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
  
  // Ensure drop zone stays last
  ensureDropZoneLast(`${section}-container`);
  
  updateComponentCount();
  
  // Schedule auto-save
  if (window.scheduleSave) window.scheduleSave();
}

// Export semantic functions
if (typeof window !== 'undefined') {
  window.SEMANTIC_ELEMENTS = SEMANTIC_ELEMENTS;
  window.showSemanticContextMenu = showSemanticContextMenu;
  window.addSemanticElement = addSemanticElement;
  // Expose component management functions for tests
  window.addComponentToCanvas = addComponentToCanvas;
  window.deleteComponent = deleteComponent;
  window.selectComponent = selectComponent;
  window.duplicateComponent = duplicateComponent;
  window.moveComponentUp = moveComponentUp;
  window.moveComponentDown = moveComponentDown;
  window.updateComponentCount = updateComponentCount;
  window.renderComponentLibrary = renderComponentLibrary;
  window.toggleComponentHtml = toggleComponentHtml;
  // Drop zone utilities
  window.ensureDropZoneLast = ensureDropZoneLast;
  window.ensureAllDropZonesLast = ensureAllDropZonesLast;
}

// Setup drag handlers
document.addEventListener('dragstart', (e) => {
  if (e.target.classList.contains('component-item')) {
    draggedComponent = e.target.dataset.component;
    e.dataTransfer.effectAllowed = 'copy';
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
  const dropZone = e.target.closest('.canvas-drop-zone');
  if (dropZone) {
    dropZone.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'copy';
  }
});

document.addEventListener('dragleave', (e) => {
  const dropZone = e.target.closest('.canvas-drop-zone');
  if (dropZone) dropZone.classList.remove('drag-over');
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  const dropZone = e.target.closest('.canvas-drop-zone');
  if (dropZone && draggedComponent) {
    const section = dropZone.dataset.section;
    addComponentToCanvas(draggedComponent, section);
    draggedComponent = null;
    dropZone.classList.remove('drag-over');
    // Ensure drop zone stays last after drop
    ensureDropZoneLast(`${section}-container`);
  }
});
