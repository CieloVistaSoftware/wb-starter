/**
 * Builder UI - User interface functions (drawers, menus, settings)
 */

// Update status bar message
function updateStatus(message) {
  const statusEl = document.querySelector('.status-bar .status-message, #status-message');
  if (statusEl) {
    statusEl.textContent = message;
  } else {
    // Fallback: try to find any status area
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
      let msgEl = statusBar.querySelector('.status-message');
      if (!msgEl) {
        msgEl = document.createElement('span');
        msgEl.className = 'status-message';
        msgEl.style.cssText = 'margin-left: 1rem; color: var(--text-secondary);';
        statusBar.appendChild(msgEl);
      }
      msgEl.textContent = message;
    }
  }
  console.log('[Builder Status]', message);
}

// Update active element in status bar
function updateActiveElement(type, name, icon) {
  const el = document.getElementById('activeElement');
  if (type === 'page') {
    const page = pages.find(p => p.name === name);
    const relUrl = page ? (page.slug === 'index.html' ? '/' : '/' + page.slug.replace(/\.html$/, '')) : '/';
    el.innerHTML = `<span style="color: #10b981;"><strong>📄 Page:</strong> ${name} <code style="background: rgba(99, 102, 241, 0.2); padding: 0.15rem 0.4rem; border-radius: 3px; font-family: monospace; font-size: 0.8rem; margin-left: 0.5rem;">${relUrl}</code></span>`;
  } else if (type === 'component') {
    el.innerHTML = `<span style="color: var(--primary);"><strong>${icon}</strong> ${name}</span>`;
  }
}

// Set template indicator
function setTemplateIndicator(templateName) {
  const el = document.getElementById('templateIndicator');
  if (!el) return;
  if (templateName) {
    el.innerHTML = `<span style="color: var(--primary); font-size: 0.85rem;">🎨 Template: ${templateName}</span>`;
    el.style.display = 'inline';
  } else {
    el.style.display = 'none';
  }
}

// Toggle drawer (BEM: wb-drawer--collapsed)
function toggleDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  
  const isCollapsed = drawer.classList.contains('wb-drawer--collapsed');
  const position = drawerId === 'leftDrawer' ? 'left' : 'right';
  const toggle = drawer.querySelector('.wb-drawer__toggle');
  
  if (isCollapsed) {
    // Expand
    drawer.classList.remove('wb-drawer--collapsed');
    const savedWidth = localStorage.getItem(`wb-drawer-${drawerId}-width`);
    const defaultWidth = position === 'left' ? '280px' : '350px';
    drawer.style.width = savedWidth || defaultWidth;
    drawer.style.minWidth = savedWidth || defaultWidth;
    if (toggle) toggle.textContent = position === 'left' ? '◀' : '▶';
  } else {
    // Collapse
    drawer.classList.add('wb-drawer--collapsed');
    // Let CSS handle collapsed width via --wb-drawer-collapsed-width
    drawer.style.width = '';
    drawer.style.minWidth = '';
    if (toggle) toggle.textContent = position === 'left' ? '▶' : '◀';
  }
}

// Resize drawer
function startResize(e, drawerId, position) {
  e.preventDefault();
  const drawer = document.getElementById(drawerId);
  if (!drawer || drawer.classList.contains('wb-drawer--collapsed')) return;
  
  resizingDrawer = { drawer, position };
  resizeStartX = e.clientX;
  resizeStartWidth = drawer.offsetWidth;
  drawer.classList.add('resizing');
  
  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
}

function doResize(e) {
  if (!resizingDrawer) return;
  
  const { drawer, position } = resizingDrawer;
  let newWidth;
  
  if (position === 'left') {
    newWidth = resizeStartWidth + (e.clientX - resizeStartX);
  } else {
    newWidth = resizeStartWidth - (e.clientX - resizeStartX);
  }
  
  newWidth = Math.max(200, Math.min(500, newWidth));
  drawer.style.width = newWidth + 'px';
  drawer.style.minWidth = newWidth + 'px';
}

function stopResize() {
  if (!resizingDrawer) return;
  
  const { drawer } = resizingDrawer;
  drawer.classList.remove('resizing');
  localStorage.setItem(`wb-drawer-${drawer.id}-width`, drawer.style.width);
  
  resizingDrawer = null;
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
}

// Initialize drawers
function initDrawers() {
  ['leftDrawer', 'rightDrawer'].forEach(id => {
    const drawer = document.getElementById(id);
    if (!drawer) return;
    
    const savedWidth = localStorage.getItem(`wb-drawer-${id}-width`);
    if (savedWidth) {
      drawer.style.width = savedWidth;
      drawer.style.minWidth = savedWidth;
    }
  });
}

// Load settings
function loadSettings() {
  const saved = localStorage.getItem('wb-builder-settings');
  if (saved) {
    try {
      builderSettings = { ...builderSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }
}

// Save settings
function saveSettings() {
  localStorage.setItem('wb-builder-settings', JSON.stringify(builderSettings));
}

// Update setting
function updateSetting(key, value) {
  builderSettings[key] = value;
  
  if (key === 'showGrid') {
    const viewport = document.querySelector('.canvas-viewport');
    if (viewport) {
      viewport.style.background = value 
        ? 'linear-gradient(45deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px), linear-gradient(-45deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)'
        : 'transparent';
      viewport.style.backgroundSize = value ? `${builderSettings.gridSize}px ${builderSettings.gridSize}px` : '';
    }
  }
}

// Show config panel
function showConfigPanel() {
  document.getElementById('configPanel')?.remove();
  
  const panel = document.createElement('div');
  panel.id = 'configPanel';
  panel.className = 'config-panel';
  panel.onclick = (e) => { if (e.target === panel) panel.remove(); };
  
  panel.innerHTML = `
    <div class="config-dialog" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
        <h2 style="margin: 0; font-size: 1.2rem;">⚙️ Builder Settings</h2>
        <button onclick="document.getElementById('configPanel').remove()" style="background: none; border: none; color: var(--text-primary); font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div style="padding: 1.5rem;">
        <div style="margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 0.9rem; color: var(--text-secondary);">💾 Auto-Save</h3>
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 6px;">
            <span>Enable Auto-Save</span>
            <input type="checkbox" ${builderSettings.autoSave ? 'checked' : ''} onchange="updateSetting('autoSave', this.checked)">
          </label>
        </div>
        <div style="margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 0.9rem; color: var(--text-secondary);">🎨 Canvas</h3>
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 6px; margin-bottom: 0.5rem;">
            <span>Show Grid</span>
            <input type="checkbox" ${builderSettings.showGrid ? 'checked' : ''} onchange="updateSetting('showGrid', this.checked)">
          </label>
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 6px;">
            <span>Confirm Before Delete</span>
            <input type="checkbox" ${builderSettings.confirmDelete ? 'checked' : ''} onchange="updateSetting('confirmDelete', this.checked)">
          </label>
        </div>
        <div style="margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 0.9rem; color: var(--text-secondary);">📊 Storage</h3>
          <button class="btn btn-danger btn-sm" onclick="if(confirm('Clear all saved data?')) { localStorage.clear(); location.reload(); }">🗑️ Clear All Data</button>
        </div>
      </div>
      <div style="padding: 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 1rem;">
        <button class="btn btn-secondary" onclick="document.getElementById('configPanel').remove()">Close</button>
        <button class="btn btn-primary" onclick="saveSettings(); document.getElementById('configPanel').remove();">Save</button>
      </div>
    </div>
  `;
  
  panel.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
  document.body.appendChild(panel);
}

// Context menu
function showComponentContextMenu(e, componentEl) {
  e.preventDefault();
  document.getElementById('builderContextMenu')?.remove();
  
  // Find the section this component belongs to
  const container = componentEl.closest('[id$="-container"]');
  const section = container ? container.id.replace('-container', '') : 'main';
  
  const menu = document.createElement('div');
  menu.id = 'builderContextMenu';
  menu.className = 'context-menu';
  menu.style.cssText = `position: fixed; left: ${e.clientX}px; top: ${e.clientY}px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; min-width: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000;`;
  
  const buttonStyle = 'display: block; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; text-align: left; border-radius: 4px;';
  const hrStyle = 'border: none; border-top: 1px solid var(--border-color); margin: 0.5rem 0;';
  
  menu.innerHTML = `
    <button id="ctx-insert-component" style="${buttonStyle}">📦 Insert Component</button>
    <button id="ctx-insert-html5" style="${buttonStyle}">🏗️ Insert HTML5 Element</button>
    <hr style="${hrStyle}">
    <button id="ctx-inspect" style="${buttonStyle}">🔍 Inspect</button>
    <button id="ctx-edit" style="${buttonStyle}">✏️ Edit Properties</button>
    <button id="ctx-duplicate" style="${buttonStyle}">📋 Duplicate</button>
    <hr style="${hrStyle}">
    <button id="ctx-move-up" style="${buttonStyle}">⬆️ Move Up</button>
    <button id="ctx-move-down" style="${buttonStyle}">⬇️ Move Down</button>
    <hr style="${hrStyle}">
    <button id="ctx-delete" style="${buttonStyle}; color: #ef4444;">🗑️ Delete</button>
  `;
  
  document.body.appendChild(menu);
  
  // Add hover effects
  menu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bg-tertiary)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'none');
  });
  
  // Add click handlers
  document.getElementById('ctx-insert-component').addEventListener('click', () => {
    menu.remove();
    showComponentPicker(section, 'components');
  });
  
  document.getElementById('ctx-insert-html5').addEventListener('click', () => {
    menu.remove();
    showComponentPicker(section, 'html5');
  });
  
  document.getElementById('ctx-inspect').addEventListener('click', () => {
    menu.remove();
    inspectElement(componentEl);
  });
  
  document.getElementById('ctx-edit').addEventListener('click', () => {
    menu.remove();
    componentEl.click();
  });
  
  document.getElementById('ctx-duplicate').addEventListener('click', () => {
    menu.remove();
    duplicateComponent(componentEl.id);
  });
  
  document.getElementById('ctx-move-up').addEventListener('click', () => {
    menu.remove();
    moveComponentUp(componentEl.id);
  });
  
  document.getElementById('ctx-move-down').addEventListener('click', () => {
    menu.remove();
    moveComponentDown(componentEl.id);
  });
  
  document.getElementById('ctx-delete').addEventListener('click', () => {
    menu.remove();
    deleteComponent(componentEl.id);
  });
  
  // Adjust position if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
  
  setTimeout(() => {
    const closeMenu = (ev) => {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    document.addEventListener('click', closeMenu);
  }, 0);
}

// Toggle the builder's issues panel (create singleton on-demand if missing)
async function toggleBuilderIssues() {
  let issuesEl = document.getElementById('builderIssuesDrawer') || document.querySelector('wb-issues#siteIssuesDrawer') || document.querySelector('wb-issues');
  // Create global singleton if it doesn't exist
  if (!issuesEl) {
    issuesEl = document.createElement('wb-issues');
    // prefer site id so other pages can target the same element
    issuesEl.id = 'siteIssuesDrawer';
    document.body.appendChild(issuesEl);
    if (window.WB && typeof window.WB.scan === 'function') {
      try { window.WB.scan(issuesEl); } catch (e) { console.warn('[WB] scan failed for issues element', e); }
    }

    // Wait briefly for the behavior to initialize (dataset.wbReady === 'issues')
    const start = Date.now();
    while ((issuesEl.dataset.wbReady !== 'issues') && (Date.now() - start < 1000)) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  if (typeof issuesEl.open === 'function') {
    try { return issuesEl.open(); } catch (e) { console.warn('issuesEl.open() failed', e); }
  }
  const trigger = issuesEl.querySelector('.wb-issues__trigger');
  if (trigger) trigger.click();
}

// Inspect element in DevTools
function inspectElement(el) {
  // Close context menu first
  document.getElementById('builderContextMenu')?.remove();
  
  if (!el) return;
  
  // Store for console access
  window.$i = el;
  
  // inspect() is only available when DevTools is already open
  if (typeof inspect === 'function') {
    inspect(el);
    console.log('%c[Inspect] Element selected in Elements panel', 'color: #10b981');
  } else {
    // DevTools not open - use debugger to trigger it
    console.log('%c[Inspect] Pausing to open DevTools...', 'color: #f59e0b; font-weight: bold');
    console.log('%c[Inspect] After resuming, run: inspect($i)', 'color: #60a5fa');
    console.log('%c[Inspect] Element:', 'color: #60a5fa', el);
    // debugger will open DevTools (if browser configured to do so)
    // User can then run inspect($i) in console
    debugger;
  }
}

/**
 * Show component picker dialog
 * @param {string} section - The section to add components to (main, header, footer)
 * @param {string} filter - Filter type: 'all', 'components', or 'html5'
 */
function showComponentPicker(section, filter = 'all') {
  // Remove existing menu
  document.getElementById('semanticContextMenu')?.remove();
  
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

  const title = filter === 'components' ? '📦 Insert Component' 
              : filter === 'html5' ? '🏗️ Insert HTML5 Element' 
              : '📦 Add Component';

  menu.innerHTML = `
    <div class="semantic-header" style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid var(--border-color); cursor:grab; user-select:none; background: var(--bg-tertiary); flex-shrink: 0;">
      <div style="line-height:1.3">
        <div style="font-weight:700; font-size:1.1rem;">${title}</div>
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

  // Helper to create a component card
  function createCard(icon, name, subtitle, onClick) {
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

  // Build content based on filter
  function renderContent() {
    content.innerHTML = '';
    
    // PAGE COMPONENTS (if filter is 'all' or 'components')
    if (filter === 'all' || filter === 'components') {
      const pageSet = window.pageComponentSets?.[window.currentPageId] || window.pageComponentSets?.default;
      let pageComponents = [];
      
      if (section === 'header' && pageSet?.header) {
        pageComponents = pageSet.header;
      } else if (section === 'footer' && pageSet?.footer) {
        pageComponents = pageSet.footer;
      } else if (pageSet?.main) {
        pageComponents = pageSet.main;
      }
      
      if (pageComponents.length > 0) {
        const sectionEl = document.createElement('div');
        sectionEl.style.marginBottom = '1.5rem';
        
        const headerEl = document.createElement('div');
        headerEl.style.cssText = 'font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);';
        headerEl.textContent = '🎯 Page Components';
        sectionEl.appendChild(headerEl);
        
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, 180px); gap: 0.6rem; justify-content: start;';
        
        pageComponents.forEach(comp => {
          const card = createCard(comp.icon, comp.name, 'Page Component', () => {
            if (typeof window.addComponentToCanvas === 'function') {
              window.addComponentToCanvas(comp.id, section);
            }
            menu.remove();
          });
          grid.appendChild(card);
        });
        
        sectionEl.appendChild(grid);
        content.appendChild(sectionEl);
      }
    }
    
    // SEMANTIC/HTML5 ELEMENTS (if filter is 'all' or 'html5')
    if (filter === 'all' || filter === 'html5') {
      const SEMANTIC_ELEMENTS = window.SEMANTIC_ELEMENTS || {};
      
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
          const card = createCard(item.icon, item.name, `<${item.tag}>`, () => {
            if (typeof window.addSemanticElement === 'function') {
              window.addSemanticElement(item.tag, section, item);
            }
            menu.remove();
          });
          grid.appendChild(card);
        });
        
        catSection.appendChild(grid);
        content.appendChild(catSection);
      }
    }
  }

  renderContent();

  // Save width on resize
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

// Expose UI functions to window for external access and testing
window.updateStatus = updateStatus;
window.updateActiveElement = updateActiveElement;
window.setTemplateIndicator = setTemplateIndicator;
window.toggleDrawer = toggleDrawer;
window.showConfigPanel = showConfigPanel;
window.showComponentContextMenu = showComponentContextMenu;
window.showComponentPicker = showComponentPicker;
window.toggleBuilderIssues = toggleBuilderIssues;
window.inspectElement = inspectElement;
