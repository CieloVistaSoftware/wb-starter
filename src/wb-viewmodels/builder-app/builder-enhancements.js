/**
 * WB Page Builder - Enhanced Features v2.0
 * 
 * FEATURES:
 * 1. Configuration Panel - User control center
 * 2. Right-click Component Browser - All WB components on context menu
 * 3. Left/Right Drawer System - Resizable panels
 * 4. Status Bar - Relative URL & Template indicator
 * 5. Smart Component Browser - Categories for cards
 * 6. Pages Dropdown - Compact menu
 * 7. Docs Page File Selector - Easy .md file navigation
 * 8. Examples Page Guidance - .md best practice tips
 */

// ============================================================================
// WB COMPONENT LIBRARY - Complete categorized library
// ============================================================================

const WB_COMPONENT_LIBRARY = {
  // Layout Components
  layout: {
    name: 'Layout',
    icon: '📐',
    description: 'Structural components for page layout',
    components: [
      { id: 'wb-stack', icon: '⬇️', name: 'Stack', desc: 'Vertical flow layout' },
      { id: 'wb-cluster', icon: '➡️', name: 'Cluster', desc: 'Horizontal flow layout' },
      { id: 'wb-grid', icon: '⊞', name: 'Grid', desc: 'CSS Grid layout' },
      { id: 'wb-container', icon: '📦', name: 'Container', desc: 'Content container' },
      { id: 'wb-sidebar', icon: '◧', name: 'Sidebar', desc: 'Sidebar layout' },
      { id: 'wb-center', icon: '⊕', name: 'Center', desc: 'Center content' },
      { id: 'wb-cover', icon: '▣', name: 'Cover', desc: 'Full-height cover' },
      { id: 'wb-switcher', icon: '⇄', name: 'Switcher', desc: 'Responsive switcher' },
      { id: 'wb-reel', icon: '◁▷', name: 'Reel', desc: 'Horizontal scroll' },
      { id: 'wb-frame', icon: '⬚', name: 'Frame', desc: 'Aspect ratio frame' }
    ]
  },
  
  // Card Components - THE BIG LIBRARY
  cards: {
    name: 'Cards',
    icon: '🃏',
    description: 'Card components for content display',
    subcategories: {
      basic: {
        name: 'Basic Cards',
        components: [
          { id: 'wb-card', icon: '🃏', name: 'Card', desc: 'Basic card' },
          { id: 'wb-cardimage', icon: '🖼️', name: 'Image Card', desc: 'Card with image' },
          { id: 'wb-cardvideo', icon: '🎬', name: 'Video Card', desc: 'Card with video' },
          { id: 'wb-cardhorizontal', icon: '↔️', name: 'Horizontal', desc: 'Side-by-side layout' }
        ]
      },
      content: {
        name: 'Content Cards',
        components: [
          { id: 'wb-cardprofile', icon: '👤', name: 'Profile', desc: 'User profile card' },
          { id: 'wb-cardtestimonial', icon: '💬', name: 'Testimonial', desc: 'Customer quote' },
          { id: 'wb-cardstats', icon: '📊', name: 'Stats', desc: 'Statistics display' },
          { id: 'wb-cardfile', icon: '📄', name: 'File', desc: 'File download card' }
        ]
      },
      commerce: {
        name: 'Commerce Cards',
        components: [
          { id: 'wb-cardpricing', icon: '💰', name: 'Pricing', desc: 'Pricing tier card' },
          { id: 'wb-cardproduct', icon: '🛍️', name: 'Product', desc: 'Product display' },
          { id: 'wb-cardportfolio', icon: '🎨', name: 'Portfolio', desc: 'Portfolio item' }
        ]
      },
      interactive: {
        name: 'Interactive Cards',
        components: [
          { id: 'wb-cardlink', icon: '🔗', name: 'Link Card', desc: 'Clickable link card' },
          { id: 'wb-cardoverlay', icon: '📋', name: 'Overlay', desc: 'Hover overlay card' },
          { id: 'wb-cardbutton', icon: '🔘', name: 'Button Card', desc: 'Card as button' },
          { id: 'wb-cardexpandable', icon: '📂', name: 'Expandable', desc: 'Expand/collapse card' }
        ]
      },
      special: {
        name: 'Special Cards',
        components: [
          { id: 'wb-cardhero', icon: '🦸', name: 'Hero Card', desc: 'Large hero card' },
          { id: 'wb-cardnotification', icon: '🔔', name: 'Notification', desc: 'Alert/notification' },
          { id: 'wb-cardminimizable', icon: '➖', name: 'Minimizable', desc: 'Can minimize' },
          { id: 'wb-carddraggable', icon: '✋', name: 'Draggable', desc: 'Drag and drop' }
        ]
      }
    }
  },
  
  // Content Components
  content: {
    name: 'Content',
    icon: '📝',
    description: 'Content display components',
    components: [
      { id: 'wb-hero', icon: '🦸', name: 'Hero', desc: 'Hero section' },
      { id: 'wb-header', icon: '📰', name: 'Header', desc: 'Page header' },
      { id: 'wb-footer', icon: '📎', name: 'Footer', desc: 'Page footer' },
      { id: 'wb-mdhtml', icon: '📄', name: 'Markdown', desc: 'Markdown content' }
    ]
  },
  
  // Interactive Components
  interactive: {
    name: 'Interactive',
    icon: '🎮',
    description: 'Interactive UI components',
    components: [
      { id: 'wb-tabs', icon: '📁', name: 'Tabs', desc: 'Tab panels' },
      { id: 'wb-collapse', icon: '📄', name: 'Collapse', desc: 'Collapsible section' },
      { id: 'wb-dropdown', icon: '🔽', name: 'Dropdown', desc: 'Dropdown menu' },
      { id: 'wb-drawer', icon: '◨', name: 'Drawer', desc: 'Slide-out drawer' }
    ]
  },
  
  // Feedback Components
  feedback: {
    name: 'Feedback',
    icon: '💬',
    description: 'User feedback components',
    components: [
      { id: 'wb-alert', icon: '⚠️', name: 'Alert', desc: 'Alert message' },
      { id: 'wb-badge', icon: '🏷️', name: 'Badge', desc: 'Badge/tag' },
      { id: 'wb-progress', icon: '📊', name: 'Progress', desc: 'Progress bar' },
      { id: 'wb-spinner', icon: '⏳', name: 'Spinner', desc: 'Loading spinner' },
      { id: 'wb-rating', icon: '⭐', name: 'Rating', desc: 'Star rating' }
    ]
  }
};

// ============================================================================
// PAGE TEMPLATES - What page types are available
// ============================================================================

const PAGE_TEMPLATES = {
  blank: { 
    id: 'blank', 
    name: 'Blank Page', 
    icon: '📄', 
    desc: 'Empty page to start from scratch',
    defaultComponents: []
  },
  home: { 
    id: 'home', 
    name: 'Home', 
    icon: '🏠', 
    desc: 'Landing page with hero and features',
    defaultComponents: ['hero', 'features', 'cta']
  },
  about: { 
    id: 'about', 
    name: 'About', 
    icon: 'ℹ️', 
    desc: 'About page with team and mission',
    defaultComponents: ['hero', 'card']
  },
  contact: { 
    id: 'contact', 
    name: 'Contact', 
    icon: '📞', 
    desc: 'Contact form and information',
    defaultComponents: ['cta']
  },
  services: { 
    id: 'services', 
    name: 'Services', 
    icon: '⚙️', 
    desc: 'Services or features list',
    defaultComponents: ['hero', 'features']
  },
  portfolio: { 
    id: 'portfolio', 
    name: 'Portfolio', 
    icon: '🖼️', 
    desc: 'Project gallery showcase',
    defaultComponents: ['hero']
  },
  faq: { 
    id: 'faq', 
    name: 'FAQ', 
    icon: '❓', 
    desc: 'Frequently asked questions',
    defaultComponents: []
  },
  docs: { 
    id: 'docs', 
    name: 'Documentation', 
    icon: '📚', 
    desc: 'Documentation page - uses .md files',
    defaultComponents: [],
    isDocsPage: true,
    guidance: '💡 Best Practice: Use .md (Markdown) files for documentation content. HTML is also supported but Markdown is recommended for maintainability.'
  },
  examples: { 
    id: 'examples', 
    name: 'Examples', 
    icon: '🧪', 
    desc: 'Code examples and demos',
    defaultComponents: [],
    isExamplesPage: true,
    guidance: '💡 Tip: .md files are the best way to write documentation and examples. Direct HTML is also supported if needed.'
  }
};

// ============================================================================
// STATUS BAR MANAGER
// ============================================================================

class StatusBarManager {
  constructor() {
    this.currentPage = null;
    this.templateUsed = null;
    this.rootPath = '/';
  }
  
  /**
   * Set the current page and update status bar
   * @param {Object} page - Page object with id, name, slug
   */
  setCurrentPage(page) {
    this.currentPage = page;
    this.updateDisplay();
  }
  
  /**
   * Set the template that created this site
   * @param {string} templateName - Name of template used
   */
  setTemplateUsed(templateName) {
    this.templateUsed = templateName;
    this.updateDisplay();
  }
  
  /**
   * Get the relative URL from root
   * @param {string} slug - Page slug
   * @returns {string} Relative URL path
   */
  getRelativeUrl(slug) {
    if (!slug) return '/';
    // Normalize the slug
    let url = slug.startsWith('/') ? slug : '/' + slug;
    // Remove .html extension for display
    url = url.replace(/\.html$/, '');
    // Handle index as root
    if (url === '/index') url = '/';
    return url;
  }
  
  /**
   * Update the status bar display
   */
  updateDisplay() {
    const statusEl = document.getElementById('status');
    const activeEl = document.getElementById('activeElement');
    const pageInfoEl = document.getElementById('pageInfo');
    
    if (this.currentPage && activeEl) {
      const relativeUrl = this.getRelativeUrl(this.currentPage.slug);
      activeEl.innerHTML = `
        <span style="color: #10b981;">
          <strong>📄 Page:</strong> ${this.currentPage.name}
        </span>
        <span style="margin-left: 1rem; color: var(--text-secondary);">
          <strong>URL:</strong> <code style="background: var(--bg-tertiary); padding: 0.1rem 0.4rem; border-radius: 3px;">${relativeUrl}</code>
        </span>
      `;
    }
    
    // Show template indicator if template was used
    if (this.templateUsed && pageInfoEl) {
      pageInfoEl.innerHTML = `
        <span style="color: var(--primary);">
          🎨 Template: <strong>${this.templateUsed}</strong>
        </span>
      `;
    }
  }
}

// ============================================================================
// SMART COMPONENT BROWSER
// ============================================================================

class SmartComponentBrowser {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.searchTerm = '';
    this.expandedCategories = new Set(['layout', 'content']);
  }
  
  /**
   * Render the component browser with categories
   */
  render() {
    if (!this.container) return;
    
    let html = `
      <div class="component-browser">
        <div class="browser-search">
          <input type="text" 
                 placeholder="🔍 Search components..." 
                 value="${this.searchTerm}"
                 oninput="componentBrowser.search(this.value)">
        </div>
        <div class="browser-categories">
    `;
    
    // Render each category
    for (const [catId, category] of Object.entries(WB_COMPONENT_LIBRARY)) {
      const isExpanded = this.expandedCategories.has(catId);
      const matchesSearch = this.categoryMatchesSearch(category);
      
      if (!matchesSearch && this.searchTerm) continue;
      
      html += `
        <div class="browser-category ${isExpanded ? 'expanded' : ''}">
          <div class="category-header" onclick="componentBrowser.toggleCategory('${catId}')">
            <span class="category-icon">${category.icon}</span>
            <span class="category-name">${category.name}</span>
            <span class="category-count">${this.getCategoryCount(category)}</span>
            <span class="category-arrow">${isExpanded ? '▼' : '▶'}</span>
          </div>
          <div class="category-content" style="display: ${isExpanded ? 'block' : 'none'};">
      `;
      
      // Handle subcategories (like cards)
      if (category.subcategories) {
        for (const [subId, subcat] of Object.entries(category.subcategories)) {
          html += this.renderSubcategory(subId, subcat);
        }
      } else if (category.components) {
        html += this.renderComponents(category.components);
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  /**
   * Render a subcategory (like card types)
   */
  renderSubcategory(subId, subcat) {
    const matchesSearch = this.componentsMatchSearch(subcat.components);
    if (!matchesSearch && this.searchTerm) return '';
    
    return `
      <div class="browser-subcategory">
        <div class="subcategory-header">${subcat.name}</div>
        ${this.renderComponents(subcat.components)}
      </div>
    `;
  }
  
  /**
   * Render a list of components
   */
  renderComponents(components) {
    let html = '<div class="components-list">';
    
    for (const comp of components) {
      if (this.searchTerm && !this.componentMatchesSearch(comp)) continue;
      
      html += `
        <div class="component-item" 
             draggable="true"
             component="${comp.id}"
             title="${comp.desc}"
             ondragstart="handleDragStart(event, '${comp.id}')">
          <span class="comp-icon">${comp.icon}</span>
          <span class="comp-name">${comp.name}</span>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }
  
  /**
   * Search components
   */
  search(term) {
    this.searchTerm = term.toLowerCase();
    this.render();
  }
  
  /**
   * Toggle category expansion
   */
  toggleCategory(catId) {
    if (this.expandedCategories.has(catId)) {
      this.expandedCategories.delete(catId);
    } else {
      this.expandedCategories.add(catId);
    }
    this.render();
  }
  
  /**
   * Get count of components in a category
   */
  getCategoryCount(category) {
    if (category.components) return category.components.length;
    if (category.subcategories) {
      return Object.values(category.subcategories)
        .reduce((sum, sub) => sum + sub.components.length, 0);
    }
    return 0;
  }
  
  /**
   * Check if category matches search
   */
  categoryMatchesSearch(category) {
    if (!this.searchTerm) return true;
    if (category.name.toLowerCase().includes(this.searchTerm)) return true;
    if (category.components) return this.componentsMatchSearch(category.components);
    if (category.subcategories) {
      return Object.values(category.subcategories)
        .some(sub => this.componentsMatchSearch(sub.components));
    }
    return false;
  }
  
  /**
   * Check if any component matches search
   */
  componentsMatchSearch(components) {
    return components.some(c => this.componentMatchesSearch(c));
  }
  
  /**
   * Check if single component matches search
   */
  componentMatchesSearch(comp) {
    const term = this.searchTerm;
    return comp.id.toLowerCase().includes(term) ||
           comp.name.toLowerCase().includes(term) ||
           comp.desc.toLowerCase().includes(term);
  }
}

// ============================================================================
// PAGES DROPDOWN MANAGER
// ============================================================================

class PagesDropdownManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.isOpen = false;
  }
  
  /**
   * Render the pages dropdown
   * @param {Array} pages - Array of page objects
   * @param {string} currentPageId - Currently active page ID
   */
  render(pages, currentPageId) {
    if (!this.container) return;
    
    const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
    
    this.container.innerHTML = `
      <div class="pages-dropdown">
        <button class="pages-dropdown-trigger" onclick="pagesDropdown.toggle()">
          <span class="current-page-icon">${currentPage?.icon || '📄'}</span>
          <span class="current-page-name">${currentPage?.name || 'Home'}</span>
          <span class="dropdown-arrow">${this.isOpen ? '▲' : '▼'}</span>
        </button>
        <div class="pages-dropdown-menu" style="display: ${this.isOpen ? 'block' : 'none'};">
          ${pages.map(p => `
            <div class="page-dropdown-item ${p.id === currentPageId ? 'active' : ''}" 
                 onclick="pagesDropdown.selectPage('${p.id}')">
              <span class="page-icon">${p.icon || '📄'}</span>
              <span class="page-name">${p.name}</span>
              <span class="page-url">${p.slug || ''}</span>
              ${p.id !== 'home' ? `<button class="page-delete-btn" onclick="event.stopPropagation(); deletePage('${p.id}')">×</button>` : ''}
            </div>
          `).join('')}
          <div class="page-dropdown-divider"></div>
          <div class="page-dropdown-item add-page" onclick="pagesDropdown.showAddPageDialog()">
            <span class="page-icon">➕</span>
            <span class="page-name">Add New Page</span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Toggle dropdown open/closed
   */
  toggle() {
    this.isOpen = !this.isOpen;
    const menu = this.container.querySelector('.pages-dropdown-menu');
    if (menu) menu.style.display = this.isOpen ? 'block' : 'none';
    const arrow = this.container.querySelector('.dropdown-arrow');
    if (arrow) arrow.textContent = this.isOpen ? '▲' : '▼';
  }
  
  /**
   * Close dropdown
   */
  close() {
    this.isOpen = false;
    const menu = this.container.querySelector('.pages-dropdown-menu');
    if (menu) menu.style.display = 'none';
  }
  
  /**
   * Select a page
   */
  selectPage(pageId) {
    this.close();
    if (typeof switchToPage === 'function') {
      switchToPage(pageId);
    }
  }
  
  /**
   * Show add page dialog
   */
  showAddPageDialog() {
    this.close();
    if (typeof showAddPageModal === 'function') {
      showAddPageModal();
    }
  }
}

// ============================================================================
// DOCS FILE SELECTOR
// ============================================================================

class DocsFileSelector {
  constructor() {
    this.docsFolder = 'docs/';
    this.selectedFile = null;
  }
  
  /**
   * Show file selector dialog for docs
   */
  show() {
    // Remove existing
    document.getElementById('docsFileSelectorDialog')?.remove();
    
    const dialog = document.createElement('div');
    dialog.id = 'docsFileSelectorDialog';
    dialog.className = 'modal-overlay';
    dialog.onclick = (e) => { if (e.target === dialog) dialog.remove(); };
    
    dialog.innerHTML = `
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header">
          <h2>📁 Select Documentation File</h2>
          <button class="modal-close" onclick="document.getElementById('docsFileSelectorDialog').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="docs-guidance" style="background: rgba(99, 102, 241, 0.1); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
            <p style="margin: 0; font-size: 0.9rem;">
              💡 <strong>Best Practice:</strong> Use <code>.md</code> (Markdown) files for documentation. 
              They're easier to maintain and version control. HTML is also supported if needed.
            </p>
          </div>
          
          <div class="file-selector">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Docs Folder Path</label>
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" id="docsPathInput" value="${this.docsFolder}" 
                     placeholder="docs/" style="flex: 1;">
              <button class="btn btn-secondary" onclick="docsFileSelector.browse()">Browse</button>
            </div>
          </div>
          
          <div class="file-list" id="docsFileList" style="margin-top: 1rem; max-height: 300px; overflow-y: auto;">
            <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
              Enter a docs folder path and click Browse to see files
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('docsFileSelectorDialog').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="docsFileSelector.selectFile()">Select File</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
  }
  
  /**
   * Browse docs folder (simulated for now)
   */
  browse() {
    const fileList = document.getElementById('docsFileList');
    if (!fileList) return;
    
    // Simulated file list - in real implementation, this would fetch from server
    const sampleFiles = [
      { name: 'README.md', type: 'md', size: '2.4 KB' },
      { name: 'getting-started.md', type: 'md', size: '5.1 KB' },
      { name: 'api-reference.md', type: 'md', size: '12.3 KB' },
      { name: 'components/', type: 'folder', children: 3 },
      { name: 'examples/', type: 'folder', children: 7 },
      { name: 'troubleshooting.html', type: 'html', size: '3.2 KB' }
    ];
    
    fileList.innerHTML = sampleFiles.map(f => `
      <div class="file-item ${f.type === 'folder' ? 'folder' : ''}" 
           onclick="docsFileSelector.handleFileClick('${f.name}', '${f.type}')"
           style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid var(--border-color); cursor: pointer;">
        <span class="file-icon">${f.type === 'folder' ? '📁' : (f.type === 'md' ? '📄' : '🌐')}</span>
        <span class="file-name" style="flex: 1;">${f.name}</span>
        <span class="file-meta" style="color: var(--text-secondary); font-size: 0.8rem;">
          ${f.type === 'folder' ? `${f.children} items` : f.size}
        </span>
        ${f.type === 'md' ? '<span style="background: #10b981; color: white; font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 3px;">RECOMMENDED</span>' : ''}
      </div>
    `).join('');
  }
  
  /**
   * Handle file click
   */
  handleFileClick(fileName, type) {
    if (type === 'folder') {
      const input = document.getElementById('docsPathInput');
      if (input) {
        input.value = this.docsFolder + fileName;
        this.docsFolder = input.value;
        this.browse();
      }
    } else {
      this.selectedFile = this.docsFolder + fileName;
      // Highlight selection
      document.querySelectorAll('.file-item').forEach(el => el.style.background = '');
      event.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
    }
  }
  
  /**
   * Select the file
   */
  selectFile() {
    if (this.selectedFile) {
      console.log('Selected docs file:', this.selectedFile);
      // Would integrate with page creation
      document.getElementById('docsFileSelectorDialog')?.remove();
      return this.selectedFile;
    }
  }
}

// ============================================================================
// EXAMPLES PAGE GUIDANCE
// ============================================================================

function showExamplesPageGuidance() {
  const panel = document.getElementById('propertiesPanel');
  if (!panel) return;
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>🧪 Examples Page</h4>
      
      <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1)); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h5 style="margin: 0 0 0.75rem 0; color: var(--primary);">💡 Best Practice</h5>
        <p style="margin: 0; font-size: 0.9rem; line-height: 1.6;">
          <strong>Use .md (Markdown) files</strong> for your examples and documentation. 
          They're easier to write, maintain, and version control.
        </p>
      </div>
      
      <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
        <h5 style="margin: 0 0 0.5rem 0;">✅ Recommended: Markdown</h5>
        <code style="display: block; background: var(--bg-color); padding: 0.75rem; border-radius: 4px; font-size: 0.85rem;">
# My Example<br>
<br>
\`\`\`javascript<br>
const greeting = "Hello!";<br>
console.log(greeting);<br>
\`\`\`
        </code>
      </div>
      
      <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 6px;">
        <h5 style="margin: 0 0 0.5rem 0;">🌐 Also Supported: HTML</h5>
        <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
          Direct HTML is supported if you need more control, but Markdown is preferred.
        </p>
      </div>
      
      <button class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;" 
              onclick="docsFileSelector.show()">
        📁 Select Example Files
      </button>
    </div>
  `;
}

// ============================================================================
// CSS STYLES FOR ENHANCEMENTS
// ============================================================================

const ENHANCEMENT_STYLES = `
/* Pages Dropdown */
.pages-dropdown {
  position: relative;
}

.pages-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.pages-dropdown-trigger:hover {
  border-color: var(--primary);
}

.pages-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-top: 0.25rem;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  max-height: 300px;
  overflow-y: auto;
}

.page-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s;
}

.page-dropdown-item:hover {
  background: var(--bg-tertiary);
}

.page-dropdown-item.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.page-dropdown-item .page-url {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.page-dropdown-item .page-delete-btn {
  opacity: 0;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  line-height: 1;
}

.page-dropdown-item:hover .page-delete-btn {
  opacity: 1;
}

.page-dropdown-divider {
  border-top: 1px solid var(--border-color);
  margin: 0.25rem 0;
}

.page-dropdown-item.add-page {
  color: var(--primary);
}

/* Component Browser */
.component-browser {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.browser-search input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.browser-search input:focus {
  outline: none;
  border-color: var(--primary);
}

.browser-category {
  background: var(--bg-tertiary);
  border-radius: 6px;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.category-header:hover {
  background: rgba(99, 102, 241, 0.1);
}

.category-icon {
  font-size: 1rem;
}

.category-name {
  flex: 1;
  font-weight: 600;
  font-size: 0.85rem;
}

.category-count {
  background: var(--bg-color);
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.category-arrow {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.category-content {
  padding: 0.5rem;
  background: var(--bg-secondary);
}

.browser-subcategory {
  margin-bottom: 0.75rem;
}

.subcategory-header {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  font-weight: 700;
}

.components-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: move;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.component-item:hover {
  border-color: var(--primary);
  background: rgba(99, 102, 241, 0.1);
}

.component-item .comp-icon {
  font-size: 1rem;
}

.component-item .comp-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status Bar Enhancements */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-bar code {
  font-family: 'Monaco', 'Menlo', monospace;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
`;

// ============================================================================
// INITIALIZATION
// ============================================================================

// Global instances
let statusBarManager;
let componentBrowser;
let pagesDropdown;
let docsFileSelector;

/**
 * Initialize all enhancements
 */
function initBuilderEnhancements() {
  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = ENHANCEMENT_STYLES;
  document.head.appendChild(styleEl);
  
  // Initialize managers
  statusBarManager = new StatusBarManager();
  componentBrowser = new SmartComponentBrowser('componentLibrary');
  pagesDropdown = new PagesDropdownManager('pagesSection');
  docsFileSelector = new DocsFileSelector();
  
  console.log('✅ Builder enhancements initialized');
}

// ============================================================================
// CONTAINER COMPONENT BROWSER
// Shows component selection when a container is clicked
// ============================================================================

// Container types that can hold other components
const CONTAINER_TYPES = ['wb-container', 'wb-stack', 'wb-cluster', 'wb-grid', 'wb-sidebar', 'wb-cover', 'wb-switcher', 'wb-center'];

/**
 * Check if a component type is a container
 * @param {string} componentType - The type to check
 * @returns {boolean}
 */
function isContainerType(componentType) {
  return CONTAINER_TYPES.includes(componentType);
}

/**
 * Render container properties with embedded component browser
 * @param {HTMLElement} panel - The properties panel element
 * @param {Object} containerData - Data about the container
 */
function showContainerProperties(panel, containerData) {
  const { componentId, componentType, element, data } = containerData;
  
  // Get display info for this container type
  const typeInfo = getContainerTypeInfo(componentType);
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>${typeInfo.icon} ${typeInfo.name}</h4>
      
      <!-- Container Settings -->
      <div class="container-settings" style="margin-bottom: 1.5rem;">
        <div class="property">
          <label>Gap</label>
          <select id="containerGap" onchange="updateContainerSetting('${componentId}', 'gap', this.value)">
            <option value="0" ${data?.gap === '0' ? 'selected' : ''}>None</option>
            <option value="0.5rem" ${data?.gap === '0.5rem' ? 'selected' : ''}>Small (0.5rem)</option>
            <option value="1rem" ${data?.gap === '1rem' || !data?.gap ? 'selected' : ''}>Medium (1rem)</option>
            <option value="1.5rem" ${data?.gap === '1.5rem' ? 'selected' : ''}>Large (1.5rem)</option>
            <option value="2rem" ${data?.gap === '2rem' ? 'selected' : ''}>XL (2rem)</option>
          </select>
        </div>
        
        <div class="property">
          <label>Padding</label>
          <select id="containerPadding" onchange="updateContainerSetting('${componentId}', 'padding', this.value)">
            <option value="0" ${data?.padding === '0' ? 'selected' : ''}>None</option>
            <option value="0.5rem" ${data?.padding === '0.5rem' ? 'selected' : ''}>Small (0.5rem)</option>
            <option value="1rem" ${data?.padding === '1rem' || !data?.padding ? 'selected' : ''}>Medium (1rem)</option>
            <option value="1.5rem" ${data?.padding === '1.5rem' ? 'selected' : ''}>Large (1.5rem)</option>
            <option value="2rem" ${data?.padding === '2rem' ? 'selected' : ''}>XL (2rem)</option>
          </select>
        </div>
        
        ${componentType === 'wb-grid' ? `
        <div class="property">
          <label>Columns</label>
          <select id="containerColumns" onchange="updateContainerSetting('${componentId}', 'columns', this.value)">
            <option value="2" ${data?.columns === '2' || !data?.columns ? 'selected' : ''}>2 Columns</option>
            <option value="3" ${data?.columns === '3' ? 'selected' : ''}>3 Columns</option>
            <option value="4" ${data?.columns === '4' ? 'selected' : ''}>4 Columns</option>
            <option value="auto" ${data?.columns === 'auto' ? 'selected' : ''}>Auto-fit</option>
          </select>
        </div>
        ` : ''}
        
        ${componentType === 'wb-stack' ? `
        <div class="property">
          <label>Alignment</label>
          <select id="containerAlign" onchange="updateContainerSetting('${componentId}', 'align', this.value)">
            <option value="stretch" ${data?.align === 'stretch' || !data?.align ? 'selected' : ''}>Stretch</option>
            <option value="flex-start" ${data?.align === 'flex-start' ? 'selected' : ''}>Start</option>
            <option value="center" ${data?.align === 'center' ? 'selected' : ''}>Center</option>
            <option value="flex-end" ${data?.align === 'flex-end' ? 'selected' : ''}>End</option>
          </select>
        </div>
        ` : ''}
        
        ${componentType === 'wb-cluster' ? `
        <div class="property">
          <label>Justify</label>
          <select id="containerJustify" onchange="updateContainerSetting('${componentId}', 'justify', this.value)">
            <option value="flex-start" ${data?.justify === 'flex-start' || !data?.justify ? 'selected' : ''}>Start</option>
            <option value="center" ${data?.justify === 'center' ? 'selected' : ''}>Center</option>
            <option value="flex-end" ${data?.justify === 'flex-end' ? 'selected' : ''}>End</option>
            <option value="space-between" ${data?.justify === 'space-between' ? 'selected' : ''}>Space Between</option>
            <option value="space-around" ${data?.justify === 'space-around' ? 'selected' : ''}>Space Around</option>
          </select>
        </div>
        ` : ''}
      </div>
      
      <!-- Nested Components -->
      <div class="nested-components-section">
        <h4 style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">📦 Children (${data?.nestedComponents?.length || 0})</h4>
        <div id="nestedComponentsList" style="margin-bottom: 1rem;">
          ${renderNestedComponentsList(data?.nestedComponents || [])}
        </div>
      </div>
      
      <!-- Add Component Browser -->
      <div class="add-component-section" style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <h4>➕ Add Component</h4>
        <div class="container-component-browser">
          <input type="text" 
                 id="containerComponentSearch" 
                 class="browser-search-input" 
                 placeholder="🔍 Search components..." 
                 oninput="filterContainerComponents(this.value)" 
                 style="width: 100%; padding: 0.6rem; margin-bottom: 0.75rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
          <div id="containerComponentList" class="container-component-list" style="max-height: 400px; overflow-y: auto;">
            ${renderContainerComponentBrowser(componentId)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get display info for container types
 */
function getContainerTypeInfo(type) {
  const info = {
    'wb-container': { icon: '📦', name: 'Container' },
    'wb-stack': { icon: '⬇️', name: 'Stack (Vertical)' },
    'wb-cluster': { icon: '➡️', name: 'Cluster (Horizontal)' },
    'wb-grid': { icon: '⊞', name: 'Grid' },
    'wb-sidebar': { icon: '◧', name: 'Sidebar' },
    'wb-cover': { icon: '▣', name: 'Cover' },
    'wb-switcher': { icon: '⇄', name: 'Switcher' },
    'wb-center': { icon: '⊕', name: 'Center' }
  };
  return info[type] || { icon: '📦', name: type };
}

/**
 * Render list of currently nested components
 */
function renderNestedComponentsList(nestedComponents) {
  if (!nestedComponents || nestedComponents.length === 0) {
    return `<div style="padding: 1rem; background: var(--bg-tertiary); border-radius: 6px; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">
      No components added yet. Add one below!
    </div>`;
  }
  
  return nestedComponents.map((nested, idx) => {
    const info = getComponentInfo(nested.type);
    return `
      <div class="nested-component-item" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: 4px; margin-bottom: 0.5rem;">
        <span style="font-size: 1.1rem;">${info.icon}</span>
        <span style="flex: 1; font-size: 0.85rem;">${info.name}</span>
        <button onclick="selectNestedComponent('${nested.id}')" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.8rem;">✏️</button>
        <button onclick="removeNestedFromContainer('${nested.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem;">🗑️</button>
      </div>
    `;
  }).join('');
}

/**
 * Get component info from library
 */
function getComponentInfo(componentType) {
  for (const [catId, category] of Object.entries(WB_COMPONENT_LIBRARY)) {
    if (category.components) {
      const found = category.components.find(c => c.id === componentType);
      if (found) return { icon: found.icon, name: found.name };
    }
    if (category.subcategories) {
      for (const subcat of Object.values(category.subcategories)) {
        const found = subcat.components.find(c => c.id === componentType);
        if (found) return { icon: found.icon, name: found.name };
      }
    }
  }
  return { icon: '📦', name: componentType.replace('wb-', '').replace('-', ' ') };
}

/**
 * Render the component browser for containers
 */
function renderContainerComponentBrowser(containerId, searchTerm = '') {
  let html = '';
  const term = searchTerm.toLowerCase();
  
  for (const [catId, category] of Object.entries(WB_COMPONENT_LIBRARY)) {
    let categoryHtml = '';
    
    // Handle subcategories (like cards)
    if (category.subcategories) {
      for (const [subId, subcat] of Object.entries(category.subcategories)) {
        const matchingComponents = subcat.components.filter(c => 
          !term || c.id.toLowerCase().includes(term) || c.name.toLowerCase().includes(term) || c.desc.toLowerCase().includes(term)
        );
        
        if (matchingComponents.length > 0) {
          categoryHtml += `
            <div class="browser-subcategory" style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); padding: 0.25rem 0.5rem; margin-top: 0.5rem;">${subcat.name}</div>
            ${renderComponentItems(matchingComponents, containerId)}
          `;
        }
      }
    } else if (category.components) {
      const matchingComponents = category.components.filter(c => 
        !term || c.id.toLowerCase().includes(term) || c.name.toLowerCase().includes(term) || c.desc.toLowerCase().includes(term)
      );
      
      if (matchingComponents.length > 0) {
        categoryHtml = renderComponentItems(matchingComponents, containerId);
      }
    }
    
    if (categoryHtml) {
      html += `
        <div class="browser-category-section" style="margin-bottom: 1rem;">
          <div class="browser-category-header" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: 4px; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem;">
            <span>${category.icon}</span>
            <span>${category.name}</span>
            <span style="margin-left: auto; font-size: 0.7rem; color: var(--text-secondary);">${category.description || ''}</span>
          </div>
          ${categoryHtml}
        </div>
      `;
    }
  }
  
  if (!html) {
    html = `<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No components found</div>`;
  }
  
  return html;
}

/**
 * Render individual component items for the browser
 */
function renderComponentItems(components, containerId) {
  return `
    <div class="component-items" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
      ${components.map(comp => `
        <div class="browser-component-item" 
             onclick="addComponentToContainer('${containerId}', '${comp.id}')"
             title="${comp.desc}"
             style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: all 0.15s;">
          <span style="font-size: 1rem;">${comp.icon}</span>
          <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${comp.name}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Filter components in the container browser
 */
function filterContainerComponents(searchTerm) {
  const containerId = window.currentSelectedContainerId;
  if (!containerId) return;
  
  const listEl = document.getElementById('containerComponentList');
  if (listEl) {
    listEl.innerHTML = renderContainerComponentBrowser(containerId, searchTerm);
  }
}

/**
 * Add a component to a container
 */
function addComponentToContainer(containerId, componentType) {
  // Find the parent component
  if (typeof window.components === 'undefined' || !Array.isArray(window.components)) {
    console.error('components array not found');
    return;
  }
  
  const parentComp = window.components.find(c => c.id === containerId);
  if (!parentComp) {
    console.error('Parent container not found:', containerId);
    return;
  }
  
  // Get or create nested components array
  if (!parentComp.data) parentComp.data = {};
  if (!parentComp.data.nestedComponents) parentComp.data.nestedComponents = [];
  
  // Generate unique ID
  const nestedId = `nested-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Get component info
  const info = getComponentInfo(componentType);
  
  // Add to nested components
  parentComp.data.nestedComponents.push({
    id: nestedId,
    type: componentType,
    config: {}
  });
  
  // Update the container's visual content
  updateContainerDisplay(parentComp);
  
  // Update the nested list in properties panel
  const listEl = document.getElementById('nestedComponentsList');
  if (listEl) {
    listEl.innerHTML = renderNestedComponentsList(parentComp.data.nestedComponents);
  }
  
  // Update status
  if (typeof window.updateStatus === 'function') {
    window.updateStatus(`Added ${info.name} to container`);
  }
}

/**
 * Update the visual display of a container
 */
function updateContainerDisplay(comp) {
  const contentEl = comp.element?.querySelector('.component-content');
  if (!contentEl) return;
  
  const nested = comp.data?.nestedComponents || [];
  const typeInfo = getContainerTypeInfo(comp.type);
  
  // Build display CSS based on container type
  let containerStyle = 'padding: 1rem; border: 2px dashed var(--primary); border-radius: 8px; min-height: 80px;';
  
  switch(comp.type) {
    case 'wb-stack':
      containerStyle += ` display: flex; flex-direction: column; gap: ${comp.data?.gap || '1rem'}; align-items: ${comp.data?.align || 'stretch'};`;
      break;
    case 'wb-cluster':
      containerStyle += ` display: flex; flex-direction: row; flex-wrap: wrap; gap: ${comp.data?.gap || '1rem'}; justify-content: ${comp.data?.justify || 'flex-start'};`;
      break;
    case 'wb-grid':
      const cols = comp.data?.columns || '2';
      containerStyle += cols === 'auto' 
        ? ` display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: ${comp.data?.gap || '1rem'};`
        : ` display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: ${comp.data?.gap || '1rem'};`;
      break;
    default:
      containerStyle += ` display: flex; flex-direction: column; gap: ${comp.data?.gap || '1rem'};`;
  }
  
  if (comp.data?.padding) {
    containerStyle += ` padding: ${comp.data.padding};`;
  }
  
  // Build nested components HTML
  let nestedHtml = '';
  if (nested.length === 0) {
    nestedHtml = `<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">
      <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${typeInfo.icon}</div>
      <div style="font-size: 0.85rem;">Click to add components</div>
    </div>`;
  } else {
    nestedHtml = nested.map(n => {
      const info = getComponentInfo(n.type);
      return `
        <div class="nested-component-visual" 
             nested-id="${n.id}" 
             style="padding: 1rem; background: rgba(99, 102, 241, 0.1); border: 1px dashed var(--primary); border-radius: 6px; text-align: center; cursor: pointer;"
             onclick="event.stopPropagation(); selectNestedComponent('${n.id}')">
          <span style="font-size: 1.2rem;">${info.icon}</span>
          <span style="margin-left: 0.5rem; font-size: 0.85rem;">${info.name}</span>
        </div>
      `;
    }).join('');
  }
  
  contentEl.innerHTML = `<div style="${containerStyle}">${nestedHtml}</div>`;
  comp.html = contentEl.innerHTML;
}

/**
 * Update a container setting
 */
function updateContainerSetting(containerId, setting, value) {
  const comp = window.components?.find(c => c.id === containerId);
  if (!comp) return;
  
  if (!comp.data) comp.data = {};
  comp.data[setting] = value;
  
  updateContainerDisplay(comp);
  
  if (typeof window.updateStatus === 'function') {
    window.updateStatus(`Updated container ${setting}`);
  }
}

/**
 * Select a nested component for editing
 */
function selectNestedComponent(nestedId) {
  // Find the nested component across all containers
  for (const comp of (window.components || [])) {
    const nested = comp.data?.nestedComponents?.find(n => n.id === nestedId);
    if (nested) {
      if (typeof window.showNestedComponentProperties === 'function') {
        window.showNestedComponentProperties(nestedId, nested.type, comp.id);
      }
      break;
    }
  }
}

/**
 * Remove a nested component from its container
 */
function removeNestedFromContainer(nestedId) {
  for (const comp of (window.components || [])) {
    const idx = comp.data?.nestedComponents?.findIndex(n => n.id === nestedId);
    if (idx !== undefined && idx >= 0) {
      comp.data.nestedComponents.splice(idx, 1);
      updateContainerDisplay(comp);
      
      // Update the nested list in properties panel
      const listEl = document.getElementById('nestedComponentsList');
      if (listEl) {
        listEl.innerHTML = renderNestedComponentsList(comp.data.nestedComponents);
      }
      
      if (typeof window.updateStatus === 'function') {
        window.updateStatus('Component removed from container');
      }
      break;
    }
  }
}

// ============================================================================
// CSS FOR CONTAINER BROWSER
// ============================================================================

const CONTAINER_BROWSER_STYLES = `
/* Container Component Browser */
.browser-component-item:hover {
  border-color: var(--primary) !important;
  background: rgba(99, 102, 241, 0.1) !important;
}

.nested-component-item:hover {
  background: var(--bg-secondary) !important;
}

.nested-component-visual:hover {
  background: rgba(99, 102, 241, 0.2) !important;
}

.container-component-list::-webkit-scrollbar {
  width: 6px;
}

.container-component-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.container-component-list::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}
`;

// ============================================================================
// MAIN SECTION MANAGEMENT
// Updates the Main Content section label and applies green "active" border
// ============================================================================

/**
 * Update the Main Content section label to show current page name
 * @param {string} pageName - Name of the current page
 */
function updateMainSectionName(pageName) {
  // Try ID first, then fallback to selector
  let label = document.getElementById('main-section-label');
  if (!label) {
    label = document.querySelector('#canvas-main .section-label');
  }
  if (!label) {
    // Silent fail - element may not exist yet
    return;
  }
  
  if (pageName && pageName.trim()) {
    label.textContent = `Main Content / ${pageName}`;
  } else {
    label.textContent = 'Main Content';
  }
}

/**
 * Activate the Main Content section with a green border (like selected page)
 * Removes focus from other sections first
 */
function activateMainSection() {
  // Try ID first, then fallback to selector
  let mainSection = document.getElementById('canvas-main-section');
  if (!mainSection) {
    mainSection = document.getElementById('canvas-main');
  }
  if (!mainSection) {
    // Silent fail - element may not exist yet
    return;
  }
  
  // Remove focused class from all canvas sections
  document.querySelectorAll('.canvas-section.focused').forEach(el => {
    el.classList.remove('focused');
  });
  
  // Add focused class to main section
  mainSection.classList.add('focused');
}

/**
 * Deactivate the Main Content section (remove green border)
 */
function deactivateMainSection() {
  const mainSection = document.getElementById('canvas-main-section');
  if (mainSection) {
    mainSection.classList.remove('focused');
  }
}

// Export for use
if (typeof window !== 'undefined') {
  // Main section management
  window.updateMainSectionName = updateMainSectionName;
  window.activateMainSection = activateMainSection;
  window.deactivateMainSection = deactivateMainSection;
  
  window.WB_COMPONENT_LIBRARY = WB_COMPONENT_LIBRARY;
  window.PAGE_TEMPLATES = PAGE_TEMPLATES;
  window.StatusBarManager = StatusBarManager;
  window.SmartComponentBrowser = SmartComponentBrowser;
  window.PagesDropdownManager = PagesDropdownManager;
  window.DocsFileSelector = DocsFileSelector;
  window.initBuilderEnhancements = initBuilderEnhancements;
  window.showExamplesPageGuidance = showExamplesPageGuidance;
  
  // Container browser exports
  window.CONTAINER_TYPES = CONTAINER_TYPES;
  window.isContainerType = isContainerType;
  window.showContainerProperties = showContainerProperties;
  window.filterContainerComponents = filterContainerComponents;
  window.addComponentToContainer = addComponentToContainer;
  window.updateContainerSetting = updateContainerSetting;
  window.selectNestedComponent = selectNestedComponent;
  window.removeNestedFromContainer = removeNestedFromContainer;
  window.updateContainerDisplay = updateContainerDisplay;
  window.getContainerTypeInfo = getContainerTypeInfo;
  window.getComponentInfo = getComponentInfo;
  
  // Inject container browser styles
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = CONTAINER_BROWSER_STYLES;
      document.head.appendChild(style);
    });
  } else {
    const style = document.createElement('style');
    style.textContent = CONTAINER_BROWSER_STYLES;
    document.head.appendChild(style);
  }
}
