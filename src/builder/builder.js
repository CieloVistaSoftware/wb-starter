/**
 * WB Page Builder - Main Application
 * Consolidated builder logic with proper script tag escaping
 */

// ============================================
// STATE MANAGEMENT
// ============================================
let draggedComponent = null;
let selectedComponent = null;
let components = [];
let componentIdCounter = 0;

const globalSections = { header: [], footer: [] };

let pages = [{
  id: 'home',
  name: 'Home',
  slug: 'index.html',
  main: [{
    id: 'comp-home-hero',
    type: 'hero',
    section: 'main',
    html: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 4rem 2rem; text-align: center; color: white; border-radius: 8px;"><h2 style="font-size: 2.5rem; margin: 0 0 1rem 0;">Welcome to Your Site</h2><p style="font-size: 1.1rem; margin: 0;">Your value proposition goes here</p></div>',
    data: {}
  }]
}];

let currentPageId = 'home';
const builderSettings = { snapToGrid: true, gridSize: 8, showGrid: false, autoSave: true };

// ============================================
// COMPONENT TEMPLATES
// ============================================
const componentTemplates = {
  hero: {
    name: 'Hero Section',
    icon: '🦸',
    html: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 4rem 2rem; text-align: center; color: white; border-radius: 8px;"><h2 style="font-size: 2.5rem; margin: 0 0 1rem 0;">Welcome to Your Site</h2><p style="font-size: 1.1rem; margin: 0;">Your value proposition goes here</p></div>'
  },
  navbar: {
    name: 'Navigation Bar',
    icon: '🔝',
    html: null,
    getHtml: (data) => {
      const logoText = (typeof data === 'string') ? data : (data?.logo || 'Logo');
      const links = pages.slice(0, 4).map(p => 
        `<a href="${p.slug}" style="color: var(--text-secondary); text-decoration: none;">${p.name}</a>`
      ).join('');
      return `<div style="display: flex; gap: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 6px; align-items: center;"><span style="font-weight: 700;">${logoText}</span>${links}</div>`;
    }
  },
  features: {
    name: 'Features Grid',
    icon: '✨',
    isFeatureGrid: true,
    getHtml: (data) => {
      const cards = data?.cards || [
        { icon: '✨', title: 'Feature 1', description: 'Description goes here' },
        { icon: '⚡', title: 'Feature 2', description: 'Description goes here' },
        { icon: '🚀', title: 'Feature 3', description: 'Description goes here' }
      ];
      return `<div class="feature-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">${cards.map((card, i) => `<div class="feature-card-item" card-index="${i}" style="padding: 1.5rem; background: var(--bg-tertiary); border-radius: 8px; text-align: center; cursor: pointer; border: 2px solid transparent;"><div style="font-size: 2rem; margin-bottom: 0.5rem;">${card.icon}</div><h3 style="margin: 0 0 0.5rem 0;">${card.title}</h3><p style="margin: 0; color: var(--text-secondary);">${card.description}</p></div>`).join('')}</div>`;
    }
  },
  testimonials: {
    name: 'Testimonials',
    icon: '💬',
    html: '<div style="padding: 2rem; background: var(--bg-secondary); border-radius: 8px;"><p style="font-style: italic; margin: 0 0 1rem 0; color: var(--text-secondary);">"Great service! Highly recommended."</p><p style="margin: 0; font-weight: 600;">— John Doe, CEO at TechCorp</p></div>'
  },
  cta: {
    name: 'Call to Action',
    icon: '📞',
    isCTA: true,
    getHtml: (data) => {
      const phone = data?.phoneNumber || '(555) 123-4567';
      return `<div style="background: linear-gradient(135deg, ${data?.gradientStart || '#667eea'} 0%, ${data?.gradientEnd || '#764ba2'} 100%); padding: 3rem 2rem; border-radius: 8px; text-align: center; color: white;"><h2 style="margin: 0 0 1rem 0;">${data?.title || 'Ready to get started?'}</h2><p style="margin: 0 0 1.5rem 0; opacity: 0.9;">${data?.description || 'Contact us today!'}</p><a href="tel:${phone.replace(/[^0-9+]/g, '')}" style="display: inline-flex; padding: 0.75rem 2rem; background: white; color: #667eea; border-radius: 6px; font-weight: 600; text-decoration: none;">📞 ${phone}</a></div>`;
    }
  },
  card: {
    name: 'Card',
    icon: '🃏',
    isCard: true,
    getHtml: (data) => `<div style="padding: 1.5rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px;"><div style="margin-bottom: 1rem; background: var(--bg-secondary); border-radius: 6px; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; font-size: 3rem;">${data?.icon || '🖼️'}</div><h3 style="margin: 0 0 0.75rem 0;">${data?.title || 'Card Title'}</h3><p style="margin: 0; color: var(--text-secondary);">${data?.description || 'Card content goes here'}</p></div>`
  },
  footer: {
    name: 'Footer',
    icon: '🔻',
    html: '<div style="padding: 2rem; text-align: center; border-top: 1px solid var(--border-color);"><p style="margin: 0; color: var(--text-secondary);">© 2025 Your Company. All rights reserved.</p></div>'
  }
};

const pageComponentSets = {
  home: {
    header: [{ id: 'navbar', icon: '🔝', name: 'Navigation Bar' }],
    main: [
      { id: 'hero', icon: '🦸', name: 'Hero Section' },
      { id: 'features', icon: '✨', name: 'Features' },
      { id: 'testimonials', icon: '💬', name: 'Testimonials' },
      { id: 'cta', icon: '📞', name: 'Call to Action' },
      { id: 'card', icon: '🃏', name: 'Card' }
    ],
    footer: [{ id: 'footer', icon: '🔻', name: 'Footer' }]
  },
  default: {
    main: [
      { id: 'hero', icon: '🦸', name: 'Page Header' },
      { id: 'card', icon: '🃏', name: 'Content Card' },
      { id: 'cta', icon: '📞', name: 'Call to Action' }
    ]
  }
};

// ============================================
// UI UTILITIES
// ============================================
function updateStatus(msg) {
  const el = document.getElementById('status');
  if (el) el.textContent = msg;
}

function updateComponentCount() {
  const el = document.getElementById('componentCount');
  if (el) el.textContent = `${components.length} component${components.length !== 1 ? 's' : ''}`;
}

function updateActiveElement(type, name) {
  const el = document.getElementById('activeElement');
  if (!el) return;
  if (type === 'page') {
    const page = pages.find(p => p.name === name);
    const url = page?.slug === 'index.html' ? '/' : '/' + (page?.slug || '').replace('.html', '');
    el.innerHTML = `<span style="color: #10b981;"><strong>📄 Page:</strong> ${name} <code style="background: rgba(99, 102, 241, 0.2); padding: 0.15rem 0.4rem; border-radius: 3px; font-family: monospace; font-size: 0.8rem; margin-left: 0.5rem;">${url}</code></span>`;
  } else {
    el.innerHTML = `<span style="color: var(--primary);"><strong>${name}</strong></span>`;
  }
}

function closeAllMenus() {
  ['exportMenu', 'loadSiteMenu', 'newPageDialog', 'configPanel'].forEach(id => document.getElementById(id)?.remove());
}

// ============================================
// COMPONENT MANAGEMENT
// ============================================
function addComponentToCanvas(componentType, section, customData = null) {
  const template = componentTemplates[componentType];
  if (!template) return;

  const componentId = `comp-${componentIdCounter++}`;
  let componentData = customData || {};
  
  // Initialize data for special types
  if (template.isFeatureGrid && !componentData.cards) {
    componentData.cards = [
      { icon: '✨', title: 'Feature 1', description: 'Description goes here' },
      { icon: '⚡', title: 'Feature 2', description: 'Description goes here' },
      { icon: '🚀', title: 'Feature 3', description: 'Description goes here' }
    ];
  }
  if (template.isCTA && !componentData.title) {
    componentData = { title: 'Ready to get started?', description: 'Contact us today!', phoneNumber: '(555) 123-4567', gradientStart: '#667eea', gradientEnd: '#764ba2' };
  }
  if (template.isCard && !componentData.title) {
    componentData = { icon: '🖼️', title: 'Card Title', description: 'Card content goes here' };
  }
  
  // For navbar, create pages FIRST so links are correct
  if (componentType === 'navbar') createNavbarPages();
  
  const html = template.getHtml ? template.getHtml(componentData) : template.html;
  const isEditable = !template.isFeatureGrid && !template.isCard && !template.isCTA;
  
  const componentEl = document.createElement('div');
  componentEl.className = 'canvas-component';
  componentEl.id = componentId;
  componentEl.tabIndex = 0;
  componentEl.innerHTML = `
    <div class="component-content" ${isEditable ? 'contenteditable="true"' : ''}>${html}</div>
    <div class="component-overlay">
      <span class="component-label">${template.icon} ${template.name}</span>
      <button class="component-delete-btn" onclick="deleteComponent('${componentId}', event)">🗑️</button>
    </div>
  `;
  
  componentEl.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('component-delete-btn')) {
      selectComponent(componentEl, componentType, template);
    }
  });
  
  const contentEl = componentEl.querySelector('.component-content');
  contentEl.addEventListener('blur', () => {
    const comp = components.find(c => c.id === componentId);
    if (comp) comp.html = contentEl.innerHTML;
  });

  const container = document.getElementById(`${section}-container`);
  const dropZone = container.querySelector('.canvas-drop-zone');
  container.insertBefore(componentEl, dropZone);
  dropZone.classList.add('has-items');

  components.push({ id: componentId, type: componentType, section, element: componentEl, template, html, data: componentData });
  
  updateComponentCount();
  updateStatus(`Added ${template.name}`);
}

function selectComponent(element, componentType, template) {
  document.querySelectorAll('.canvas-component.selected').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  selectedComponent = { id: element.id, type: componentType, element, template };
  updateActiveElement('component', `${template.icon} ${template.name}`);
  showProperties(template);
}

function deleteComponent(id, event) {
  if (event) event.stopPropagation();
  const comp = components.find(c => c.id === id);
  if (!comp) return;
  comp.element.remove();
  components = components.filter(c => c.id !== id);
  selectedComponent = null;
  document.getElementById('propertiesPanel').innerHTML = '<div class="properties-empty">Click a component to edit its properties</div>';
  updateComponentCount();
  updateStatus('Component deleted');
}

function restoreComponent(compData, template) {
  const componentId = compData.id || `comp-${componentIdCounter++}`;
  let html = compData.html;
  if (!html && template.getHtml) html = template.getHtml(compData.data || {});
  if (!html) html = template.html;
  
  const isEditable = !template.isFeatureGrid && !template.isCard && !template.isCTA;
  const componentEl = document.createElement('div');
  componentEl.className = 'canvas-component';
  componentEl.id = componentId;
  componentEl.tabIndex = 0;
  componentEl.innerHTML = `
    <div class="component-content" ${isEditable ? 'contenteditable="true"' : ''}>${html}</div>
    <div class="component-overlay">
      <span class="component-label">${template.icon} ${template.name}</span>
      <button class="component-delete-btn" onclick="deleteComponent('${componentId}', event)">🗑️</button>
    </div>
  `;
  
  componentEl.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('component-delete-btn')) {
      selectComponent(componentEl, compData.type, template);
    }
  });
  
  const container = document.getElementById(`${compData.section}-container`);
  const dropZone = container.querySelector('.canvas-drop-zone');
  container.insertBefore(componentEl, dropZone);
  dropZone.classList.add('has-items');
  
  components.push({ id: componentId, type: compData.type, section: compData.section, element: componentEl, template, html, data: compData.data || {} });
}

// ============================================
// PAGE MANAGEMENT
// ============================================
function renderPagesList() {
  const list = document.getElementById('pagesList');
  if (!list) return;
  list.innerHTML = pages.map(page => `
    <div class="page-item ${page.id === currentPageId ? 'active' : ''}" onclick="switchToPage('${page.id}')">
      <span class="page-name">${page.name}</span>
      ${page.id !== 'home' ? `<button class="page-delete" onclick="deletePage('${page.id}', event)">✕</button>` : ''}
    </div>
  `).join('');
}

function renderComponentLibrary() {
  const library = document.getElementById('componentLibrary');
  if (!library) return;
  
  const pageSet = pageComponentSets[currentPageId] || pageComponentSets.default;
  let html = '';
  
  if (currentPageId === 'home' && pageSet.header) {
    html += '<h3>🔝 Header</h3>';
    pageSet.header.forEach(c => html += `<div class="component-item" draggable="true" component="${c.id}">${c.icon} ${c.name}</div>`);
  }
  
  if (pageSet.main) {
    html += '<h3>📄 Main Content</h3>';
    pageSet.main.forEach(c => html += `<div class="component-item" draggable="true" component="${c.id}">${c.icon} ${c.name}</div>`);
  }
  
  if (currentPageId === 'home' && pageSet.footer) {
    html += '<h3>🔻 Footer</h3>';
    pageSet.footer.forEach(c => html += `<div class="component-item" draggable="true" component="${c.id}">${c.icon} ${c.name}</div>`);
  }
  
  library.innerHTML = html;
  
  library.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedComponent = item.dataset.component;
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
}

function switchToPage(pageId) {
  // Save current page
  const currentPage = pages.find(p => p.id === currentPageId);
  if (currentPage) {
    currentPage.main = components.filter(c => c.section === 'main').map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }));
  }
  
  currentPageId = pageId;
  const newPage = pages.find(p => p.id === pageId);
  
  // Clear main section
  const mainContainer = document.getElementById('main-container');
  mainContainer.querySelectorAll('.canvas-component').forEach(el => el.remove());
  mainContainer.querySelector('.canvas-drop-zone').classList.remove('has-items');
  components = components.filter(c => c.section !== 'main');
  selectedComponent = null;
  
  // Load new page
  if (newPage?.main?.length > 0) {
    newPage.main.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) restoreComponent(compData, template);
    });
  }
  
  renderPagesList();
  updateComponentCount();
  updateActiveElement('page', newPage?.name || pageId);
  renderComponentLibrary();
  showPageProperties(newPage);
  
  // Update canvas visibility
  const headerSection = document.querySelector('.canvas-section.header');
  const footerSection = document.querySelector('.canvas-section.footer');
  if (pageId === 'home') {
    headerSection.style.display = '';
    footerSection.style.display = '';
  } else {
    headerSection.style.display = 'none';
    footerSection.style.display = 'none';
  }
}

function deletePage(pageId, event) {
  event?.stopPropagation();
  if (pages.length <= 1) return alert('Cannot delete the last page');
  const page = pages.find(p => p.id === pageId);
  if (!confirm(`Delete "${page.name}" page?`)) return;
  pages = pages.filter(p => p.id !== pageId);
  if (currentPageId === pageId) switchToPage(pages[0].id);
  else renderPagesList();
  updateStatus(`Deleted page: ${page.name}`);
}

function createNavbarPages() {
  const navPages = [
    { id: 'home', name: 'Home', slug: 'index.html' },
    { id: 'about', name: 'About', slug: 'about.html' },
    { id: 'contact', name: 'Contact', slug: 'contact.html' }
  ];
  navPages.forEach(np => {
    if (!pages.find(p => p.id === np.id)) {
      pages.push({ ...np, main: [] });
    }
  });
  renderPagesList();
}

function addNewPage() {
  closeAllMenus();
  const dialog = document.createElement('div');
  dialog.id = 'newPageDialog';
  dialog.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
  dialog.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; width: 350px;">
      <h3 style="margin: 0 0 1.5rem 0;">📄 Add New Page</h3>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">Page Name</label>
        <input type="text" id="newPageName" placeholder="e.g., Services" style="width: 100%; padding: 0.75rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
      </div>
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button onclick="document.getElementById('newPageDialog').remove()" class="btn btn-secondary">Cancel</button>
        <button onclick="createNewPageFromDialog()" class="btn btn-primary">Create</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  document.getElementById('newPageName').focus();
  document.getElementById('newPageName').addEventListener('keydown', e => {
    if (e.key === 'Enter') createNewPageFromDialog();
    if (e.key === 'Escape') dialog.remove();
  });
}

function createNewPageFromDialog() {
  const name = document.getElementById('newPageName').value.trim();
  if (!name) return alert('Please enter a page name');
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (pages.find(p => p.id === id)) return alert('Page already exists');
  pages.push({ id, name, slug: id + '.html', main: [] });
  document.getElementById('newPageDialog').remove();
  switchToPage(id);
  updateStatus(`✅ Created "${name}" page`);
}

// ============================================
// PROPERTIES PANEL
// ============================================
function showProperties(template) {
  const panel = document.getElementById('propertiesPanel');
  const comp = components.find(c => c.id === selectedComponent?.id);
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>${template.icon} ${template.name}</h4>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">Edit content directly in the canvas.</p>
    </div>
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${selectedComponent.id}')">🗑️ Delete</button>
  `;

  // If this is a semantic template, show its semantic properties panel
  try {
    const comp = components.find(c => c.id === selectedComponent?.id);
    if (template && template.isSemantic && comp && typeof showSemanticProperties === 'function') {
      showSemanticProperties(comp);
    }
  } catch (e) {
    console.warn('[Builder] showProperties: failed to show semantic properties', e);
  }
}

function showPageProperties(page) {
  if (!page) return;
  const panel = document.getElementById('propertiesPanel');
  panel.innerHTML = `
    <div class="properties-section">
      <h4>📄 ${page.name}</h4>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">Components: ${page.main?.length || 0}</p>
    </div>
  `;
}

// ============================================
// EXPORT & SAVE
// ============================================
function saveSite() {
  const currentPage = pages.find(p => p.id === currentPageId);
  if (currentPage) {
    currentPage.main = components.filter(c => c.section === 'main').map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }));
  }
  globalSections.header = components.filter(c => c.section === 'header').map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }));
  globalSections.footer = components.filter(c => c.section === 'footer').map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }));
  console.log('Site saved:', { global: globalSections, pages });
  updateStatus('✅ Site saved!');
}

function previewSite() {
  // Save current state
  const currentPage = pages.find(p => p.id === currentPageId);
  if (currentPage) {
    currentPage.main = components.filter(c => c.section === 'main').map(c => ({ id: c.id, type: c.type, section: c.section, html: c.html, data: c.data }));
  }
  // Get header HTML and transform navbar links to use showPage()
  let headerHTML = components.filter(c => c.section === 'header').map(c => c.html || '').join('');
  // Replace href links with onclick handlers for SPA navigation
  pages.forEach(p => {
    headerHTML = headerHTML.replace(
      new RegExp(`href="${p.slug}"`, 'g'),
      `href="#" onclick="showPage('${p.id}'); return false;"`
    );
  });
  const footerHTML = components.filter(c => c.section === 'footer').map(c => c.html || '').join('');
  let pageContents = pages.map(p => `<div id="page-${p.id}" style="display: ${p.id === 'home' ? 'block' : 'none'};">${(p.main || []).map(c => c.html || '').join('')}</div>`).join('');
  if (!pageContents || !pageContents.replace(/<[^>]+>/g, '').trim()) {
    pageContents = '<div style="padding:2rem;color:#888;text-align:center;">No content to preview</div>';
  }
  // Build preview - note the script tag split technique to avoid breaking HTML
  const previewHTML = '<!DOCTYPE html><html lang="en" theme="dark"><head><meta charset="UTF-8"><title>Preview</title><link rel="stylesheet" href="' + window.location.origin + '/src/styles/themes.css"><link rel="stylesheet" href="' + window.location.origin + '/src/styles/site.css"><style>body{font-family:system-ui;background:var(--bg-primary);color:var(--text-primary);margin:0;padding:0;}header{background:var(--bg-secondary);padding:1rem;}main{max-width:1200px;margin:0 auto;padding:2rem;}footer{background:var(--bg-secondary);padding:1rem;margin-top:2rem;}</style></head><body>' + (headerHTML ? '<header>' + headerHTML + '</header>' : '') + '<main>' + pageContents + '</main>' + (footerHTML ? '<footer>' + footerHTML + '</footer>' : '') + '<scr' + 'ipt>function showPage(id){document.querySelectorAll("[id^=page-]").forEach(el=>el.style.display="none");document.getElementById("page-"+id).style.display="block";}</scr' + 'ipt></body></html>';
  try {
    const previewWindow = window.open('', 'preview', 'width=1200,height=800');
    if (previewWindow) {
      previewWindow.document.write(previewHTML);
      previewWindow.document.close();
      updateStatus('✅ Preview opened');
    } else {
      updateStatus('⚠️ Preview window blocked by browser.');
      alert('Preview window was blocked. Please allow popups for this site.');
    }
  } catch (err) {
    updateStatus('❌ Failed to open preview.');
    alert('Failed to open preview: ' + err.message);
  }
}

function showExportMenu(event) {
  event.stopPropagation();
  closeAllMenus();
  const menu = document.createElement('div');
  menu.id = 'exportMenu';
  menu.style.cssText = 'position: fixed; top: ' + (event.target.getBoundingClientRect().bottom + 5) + 'px; right: 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; min-width: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000;';
  menu.innerHTML = `
    <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Export</div>
    <button onclick="exportAsJSON()" style="display: block; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; text-align: left; border-radius: 4px;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">💾 Export as JSON</button>
  `;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', function close(e) { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); } }), 10);
}

function exportAsJSON() {
  closeAllMenus();
  saveSite();
  const json = JSON.stringify({ version: '1.0', global: globalSections, pages }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'site-project.json';
  a.click();
  updateStatus('✅ Exported as JSON');
}

function showLoadSiteMenu(event) {
  event.stopPropagation();
  closeAllMenus();
  const menu = document.createElement('div');
  menu.id = 'loadSiteMenu';
  menu.style.cssText = 'position: fixed; top: ' + (event.target.getBoundingClientRect().bottom + 5) + 'px; right: 120px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; min-width: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000;';
  menu.innerHTML = `<button onclick="document.getElementById('jsonFileInput').click(); document.getElementById('loadSiteMenu').remove();" style="display: block; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-primary); cursor: pointer; text-align: left; border-radius: 4px;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">📂 Load from JSON</button>`;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', function close(e) { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); } }), 10);
}

function handleJsonFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      // Clear current
      components.forEach(c => c.element?.remove());
      components = [];
      document.querySelectorAll('.canvas-drop-zone').forEach(dz => dz.classList.remove('has-items'));
      // Load
      pages = json.pages || [{ id: 'home', name: 'Home', slug: 'index.html', main: [] }];
      currentPageId = 'home';
      if (json.global?.header) json.global.header.forEach(c => { const t = componentTemplates[c.type]; if (t) restoreComponent({ ...c, section: 'header' }, t); });
      const homePage = pages.find(p => p.id === 'home');
      if (homePage?.main) homePage.main.forEach(c => { const t = componentTemplates[c.type]; if (t) restoreComponent(c, t); });
      if (json.global?.footer) json.global.footer.forEach(c => { const t = componentTemplates[c.type]; if (t) restoreComponent({ ...c, section: 'footer' }, t); });
      renderPagesList();
      renderComponentLibrary();
      updateComponentCount();
      updateStatus('✅ Loaded from JSON');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function showConfigPanel() {
  closeAllMenus();
  const panel = document.createElement('div');
  panel.id = 'configPanel';
  panel.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
  panel.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; width: 350px;">
      <h3 style="margin: 0 0 1.5rem 0;">⚙️ Settings</h3>
      <p style="color: var(--text-secondary);">Settings panel - coming soon!</p>
      <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
        <button onclick="document.getElementById('configPanel').remove()" class="btn btn-primary">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
}

// ============================================
// DRAWER FUNCTIONALITY
// ============================================
function toggleDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (drawer) drawer.classList.toggle('collapsed');
}

function startResize(event, drawerId, side) {
  event.preventDefault();
  const drawer = document.getElementById(drawerId);
  const startX = event.clientX;
  const startWidth = drawer.offsetWidth;
  
  function onMouseMove(e) {
    const delta = side === 'left' ? e.clientX - startX : startX - e.clientX;
    drawer.style.width = Math.max(200, Math.min(500, startWidth + delta)) + 'px';
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.body.style.cursor = 'col-resize';
}

// ============================================
// DRAG & DROP
// ============================================
document.addEventListener('dragstart', (e) => {
  if (e.target.classList?.contains('component-item')) {
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
    addComponentToCanvas(draggedComponent, dropZone.dataset.section);
    draggedComponent = null;
    dropZone.classList.remove('drag-over');
  }
});

// ============================================
// INITIALIZATION
// ============================================
function init() {
  console.log('🏗️ WB Page Builder initializing...');
  renderPagesList();
  renderComponentLibrary();
  
  // Load home page content
  const homePage = pages.find(p => p.id === 'home');
  if (homePage?.main?.length > 0) {
    homePage.main.forEach(compData => {
      const template = componentTemplates[compData.type];
      if (template) restoreComponent(compData, template);
    });
  }
  
  updateComponentCount();
  updateActiveElement('page', 'Home');
  showPageProperties(homePage);
  console.log('✅ WB Page Builder ready');
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
