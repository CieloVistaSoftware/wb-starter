/**
 * Builder Component Core
 * Core component creation, management, and canvas operations
 */

// ============================================================================
// DROP ZONE MANAGEMENT
// ============================================================================

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

/**
 * Ensure all section drop zones are last
 */
function ensureAllDropZonesLast() {
  ['main-container', 'header-container', 'footer-container'].forEach(id => {
    ensureDropZoneLast(id);
  });
}

// ============================================================================
// COMPONENT LIBRARY
// ============================================================================

/**
 * Render component library sidebar
 */
function renderComponentLibrary() {
  const library = document.getElementById('componentLibrary');
  if (!library) return;
  
  const pageSet = pageComponentSets[currentPageId] || pageComponentSets.default;
  let html = '';
  
  if (currentPageId === 'home') {
    if (pageSet.header && pageSet.header.length > 0) {
      html += '<h3>🔝 Header Components</h3>';
      pageSet.header.forEach(comp => {
        html += `<div class="component-item" draggable="true" data-component="${comp.id}">${comp.icon} ${comp.name}</div>`;
      });
    }
  }
  
  if (pageSet.main && pageSet.main.length > 0) {
    const sectionTitle = currentPageId === 'home' ? '📄 Main Content' : `📄 ${getCurrentPage()?.name || 'Page'} Components`;
    html += `<h3>${sectionTitle}</h3>`;
    pageSet.main.forEach(comp => {
      html += `<div class="component-item" draggable="true" data-component="${comp.id}" data-test="component-item-${comp.id}">${comp.icon} ${comp.name}</div>`;
    });
  }
  
  if (currentPageId === 'home') {
    if (pageSet.footer && pageSet.footer.length > 0) {
      html += '<h3>🔻 Footer Components</h3>';
      pageSet.footer.forEach(comp => {
        html += `<div class="component-item" draggable="true" data-component="${comp.id}">${comp.icon} ${comp.name}</div>`;
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
      window.setDraggedComponent(item.dataset.component);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
}

// ============================================================================
// COMPONENT CREATION
// ============================================================================

/**
 * Add component to canvas
 */
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
  componentEl.dataset.type = componentType;
  
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

  ensureDropZoneLast(`${section}-container`);
  updateComponentCount();
  
  if (window.scheduleSave) window.scheduleSave();

  // Drain any component-adds that were queued by the test-friendly stub
  // (prevents races where tests invoked the stub before the real impl loaded)
  try {
    if (window.__wb_queuedAdds && Array.isArray(window.__wb_queuedAdds) && window.__wb_queuedAdds.length) {
      const q = window.__wb_queuedAdds.splice(0);
      for (const args of q) {
        try { addComponentToCanvas.apply(null, args); } catch (err) { console.warn('[wb-init] drained queued add failed', err && err.message); }
      }
    }
  } catch (e) { /* ignore environments that restrict access */ }
}

/**
 * Restore a component from saved data
 */
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
  componentEl.dataset.type = compData.type;
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
  
  ensureDropZoneLast(`${compData.section}-container`);
}

// ============================================================================
// COMPONENT SELECTION & MANAGEMENT
// ============================================================================

/**
 * Select component and scroll into view
 */
function selectComponent(element, componentType, template) {
  document.querySelectorAll('.canvas-component.selected').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  
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
 * Delete component
 */
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
    
    if (window.scheduleSave) window.scheduleSave();
  }
}

/**
 * Duplicate component
 */
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

/**
 * Move component up
 */
function moveComponentUp(componentId) {
  document.getElementById('builderContextMenu')?.remove();
  const el = document.getElementById(componentId);
  if (!el) return;
  
  const prev = el.previousElementSibling;
  if (prev && !prev.classList.contains('canvas-drop-zone') && !prev.classList.contains('section-label')) {
    el.parentNode.insertBefore(el, prev);
  }
}

/**
 * Move component down
 */
function moveComponentDown(componentId) {
  document.getElementById('builderContextMenu')?.remove();
  const el = document.getElementById(componentId);
  if (!el) return;
  
  const next = el.nextElementSibling;
  if (next && !next.classList.contains('canvas-drop-zone')) {
    el.parentNode.insertBefore(next, el);
  }
}

/**
 * Update component count display
 */
function updateComponentCount() {
  document.getElementById('componentCount').textContent = 
    `${components.length} component${components.length !== 1 ? 's' : ''}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
  window.ensureDropZoneLast = ensureDropZoneLast;
  window.ensureAllDropZonesLast = ensureAllDropZonesLast;
  window.renderComponentLibrary = renderComponentLibrary;
  window.addComponentToCanvas = addComponentToCanvas;
  window.restoreComponent = restoreComponent;
  window.selectComponent = selectComponent;
  window.deleteComponent = deleteComponent;
  window.duplicateComponent = duplicateComponent;
  window.moveComponentUp = moveComponentUp;
  window.moveComponentDown = moveComponentDown;
  window.updateComponentCount = updateComponentCount;
}

console.log('[BuilderComponentCore] ✅ Loaded');
