/**
 * WB Builder Template Browser
 * Grid layout in left sidebar with Site Builder mode
 */

let templates = [];
let categories = [];
let searchQuery = '';
let selectedCategory = null;
let viewMode = 'site'; // 'grid' or 'site'
let activeTreeSection = null; // 'header' | 'main' | 'footer' | null - synced from tree

// Site sections mapping - which categories go where
const SITE_SECTIONS = {
  header: {
    icon: '🔝',
    title: 'Header',
    layout: 'horizontal',
    categories: ['navbar', 'header', 'navigation', 'nav'],
    keywords: ['nav', 'header', 'menu', 'logo', 'topbar', 'navigation'],
    order: 0
  },
  /* Pages section removed as per requirement
  pages: {
    icon: '📑',
    title: 'Pages',
    layout: 'grid',
    categories: ['page', 'landing', 'full-page'],
    keywords: ['page', 'landing', 'home', 'about', 'contact', 'help', 'privacy', 'terms', 'blog', 'portfolio', 'dashboard', 'login', 'signup', 'register', '404', 'error', 'coming soon', 'maintenance'],
    order: 1
  },
  */
  main: {
    icon: '📄',
    title: 'Main',
    layout: 'grid',
    // Ordered top-to-bottom as they'd appear on a page
    categoryOrder: [
      'spa',       // SPA sections with standard IDs (#home, #about, etc.)
      'hero',      // First thing after header
      'features',  // What you offer
      'services',  // What you do
      'about',     // Who you are
      'team',      // Your people
      'stats',     // Social proof numbers
      'testimonials', // Customer quotes
      'gallery',   // Visual showcase
      'pricing',   // How much
      'faq',       // Common questions
      'cta',       // Call to action
      'contact',   // Get in touch
      'content',   // Generic content
      'section'    // Other sections
    ],
    // Exclude header, footer, and full pages
    excludeCategories: ['navbar', 'header', 'navigation', 'nav', 'footer', 'page', 'landing', 'full-page'],
    excludeKeywords: ['footer', 'copyright', 'nav', 'header', 'menu'],
    order: 2
  },
  footer: {
    icon: '🔻',
    title: 'Footer',
    layout: 'horizontal',
    categories: ['footer'],
    keywords: ['footer', 'copyright', 'bottom', 'contact-footer', 'address', 'created by', 'social links'],
    order: 3
  }
};

// Detailed tooltip descriptions for template types
const TOOLTIP_DESCRIPTIONS = {
  // Categories
  'spa': 'SPA Section - Component with anchor ID for single-page navigation',
  'navbar': 'Navigation Bar - Top menu with links and logo',
  'nav': 'Navigation - Site menu and links',
  'header': 'Header - Top section with branding',
  'hero': 'Hero Section - Large banner area, first impression',
  'features': 'Features - Showcase product/service benefits',
  'services': 'Services - List of offerings',
  'about': 'About - Company/personal information',
  'team': 'Team - Staff profiles and bios',
  'stats': 'Statistics - Numbers and achievements',
  'testimonials': 'Testimonials - Customer reviews and quotes',
  'gallery': 'Gallery - Image/media showcase',
  'pricing': 'Pricing - Plans and costs',
  'faq': 'FAQ - Frequently Asked Questions',
  'cta': 'Call to Action - Prompt users to take action',
  'contact': 'Contact - Get in touch form/info',
  'content': 'Content - General text and media',
  'footer': 'Footer - Bottom section with links, copyright',
  'landing': 'Landing Page - Complete marketing page',
  'page': 'Full Page - Complete page template',
  'dashboard': 'Dashboard - Admin/user control panel',
  'portfolio': 'Portfolio - Work showcase',
  'blog': 'Blog - Article listing or post',
  
  // Common abbreviations
  'nav': 'Navigation',
  'cta': 'Call to Action',
  'faq': 'Frequently Asked Questions',
  'stats': 'Statistics',
  'info': 'Information',
  'btn': 'Button',
  'img': 'Image',
  'bg': 'Background',
  'sm': 'Small',
  'md': 'Medium',
  'lg': 'Large',
  'v1': 'Version 1',
  'v2': 'Version 2',
  'alt': 'Alternative',
  'min': 'Minimal',
  'std': 'Standard',
  'pro': 'Professional'
};

// Empty section containers - can hold other content
const SECTION_CONTAINERS = [
  { id: 'blank', icon: '📦', name: 'Blank', desc: 'Empty section container', cols: 1 },
  { id: '2-col', icon: '▥', name: '2 Column', desc: 'Two column layout', cols: 2 },
  { id: '3-col', icon: '▤', name: '3 Column', desc: 'Three column layout', cols: 3 },
  { id: '4-col', icon: '⊞', name: '4 Column', desc: 'Four column grid', cols: 4 },
  { id: 'sidebar-left', icon: '◧', name: 'Sidebar Left', desc: 'Content with left sidebar', cols: 'sidebar-left' },
  { id: 'sidebar-right', icon: '◨', name: 'Sidebar Right', desc: 'Content with right sidebar', cols: 'sidebar-right' },
  { id: 'full-width', icon: '▭', name: 'Full Width', desc: 'Edge-to-edge section', cols: 'full' },
  { id: 'centered', icon: '◯', name: 'Centered', desc: 'Centered narrow content', cols: 'centered' }
];

// Common page types for the Pages section
const PAGE_TYPES = [
  { id: 'home', icon: '🏠', name: 'Home', description: 'Main landing page for your site' },
  { id: 'about', icon: '👋', name: 'About', description: 'Tell visitors who you are' },
  { id: 'contact', icon: '📞', name: 'Contact', description: 'How to get in touch' },
  { id: 'help', icon: '❓', name: 'Help', description: 'Support and assistance' },
  { id: 'services', icon: '⚙️', name: 'Services', description: 'What you offer' },
  { id: 'portfolio', icon: '💼', name: 'Portfolio', description: 'Showcase your work' },
  { id: 'blog', icon: '📝', name: 'Blog', description: 'Articles and posts' },
  { id: 'pricing', icon: '💰', name: 'Pricing', description: 'Plans and costs' },
  { id: 'login', icon: '🔐', name: 'Login', description: 'User sign in page' },
  { id: 'signup', icon: '📋', name: 'Sign Up', description: 'New user registration' },
  { id: 'privacy', icon: '🔒', name: 'Privacy', description: 'Privacy policy page' },
  { id: 'terms', icon: '📜', name: 'Terms', description: 'Terms of service' },
  { id: '404', icon: '🚫', name: '404', description: 'Page not found error' },
  { id: 'coming-soon', icon: '🚧', name: 'Coming Soon', description: 'Pre-launch placeholder' }
];

export async function initTemplateBrowser() {
  await loadTemplates();
  injectStyles();
  
  // Check workflow state for site mode
  checkWorkflowMode();
  
  // INITIAL STATE: Header is active and expanded by default
  const collapsed = { header: false, main: true, footer: true };
  localStorage.setItem('tb-collapsed-sections', JSON.stringify(collapsed));
  
  // Active section defaults to header
  activeTreeSection = 'header';
  
  // Listen for section activation from tree panel
  document.addEventListener('wb:section:activated', (e) => {
    activeTreeSection = e.detail.section;
    render();
  });
  
  // Listen for canvas section clicks to sync state
  document.addEventListener('wb:canvas:section:clicked', (e) => {
    const section = e.detail.section;
    if (section) {
      activeTreeSection = section;
      // Update collapsed state - expand clicked section
      const storedCollapsed = JSON.parse(localStorage.getItem('tb-collapsed-sections') || '{}');
      storedCollapsed[section] = false;
      localStorage.setItem('tb-collapsed-sections', JSON.stringify(storedCollapsed));
      render();
    }
  });
  
  render();
  
  // No auto-activation - user clicks a section to activate it
}

function checkWorkflowMode() {
  try {
    const workflowState = JSON.parse(localStorage.getItem('wb-builder-workflow') || '{}');
    if (workflowState.intent === 'website') {
      viewMode = 'site';
    }
    // Restore view mode from localStorage
    const savedViewMode = localStorage.getItem('tb-view-mode');
    if (savedViewMode === 'grid' || savedViewMode === 'site') {
      viewMode = savedViewMode;
    }
  } catch {}
}

async function loadTemplates() {
  try {
    let res = await fetch('/src/wb-views/index.json?caller=builder-template-browser');
    if (res.ok) {
      const data = await res.json();
      templates = data.templates || [];
      categories = data.categories || [];
      console.log('[Templates] Loaded', templates.length, 'templates');
      return;
    }
    
    res = await fetch('/data/templates.json?caller=builder-template-browser');
    if (res.ok) {
      const fallbackData = await res.json();
      templates = fallbackData.templates || [];
      categories = fallbackData.categories || [];
    }
  } catch (err) {
    console.error('[Templates] Load failed:', err);
  }
}

async function fetchTemplateHTML(templateId) {
  try {
    // Try partials first (most likely location)
    let res = await fetch(`/src/wb-views/partials/${templateId}.html?caller=builder-template-browser`);
    if (res.ok) return await res.text();
    
    // Try full
    res = await fetch(`/src/wb-views/full/${templateId}.html?caller=builder-template-browser`);
    if (res.ok) return await res.text();

    // Fallback to root (legacy)
    res = await fetch(`/src/wb-views/${templateId}.html?caller=builder-template-browser`);
    if (res.ok) return await res.text();
    
    return null;
  } catch (err) {
    return null;
  }
}

function getFilteredTemplates() {
  let filtered = [...templates];
  
  if (selectedCategory) {
    filtered = filtered.filter(t => t.category === selectedCategory);
  }
  
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }
  
  // Sort A-Z
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  
  return filtered;
}

/**
 * Get template IDs already used in the canvas
 * Checks both template-id and template-name attributes
 */
function getTemplatesInCanvas() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return new Set();
  
  const used = new Set();
  
  // Check all dropped elements
  canvas.querySelectorAll('.dropped').forEach(wrapper => {
    // Check for templateId
    const templateId = wrapper.dataset.templateId;
    if (templateId) used.add(templateId);
    
    // Check for templateName and match to template
    const templateName = wrapper.dataset.templateName;
    if (templateName) {
      const matchingTemplate = templates.find(t => t.name === templateName);
      if (matchingTemplate) used.add(matchingTemplate.id);
    }
    
    // Also check component data for name matching
    try {
      const c = JSON.parse(wrapper.dataset.c || '{}');
      if (c.n) {
        const componentTemplate = templates.find(t => t.name === c.n);
        if (componentTemplate) used.add(componentTemplate.id);
      }
    } catch {}
  });
  
  return used;
}

/**
 * Generate detailed tooltip for a template
 * Expands abbreviations and adds category description
 * @param {object} template - The template object
 * @param {string} targetSection - Optional section context ('header', 'main', 'footer')
 */
function generateTooltip(template, targetSection = null) {
  const name = template.name || '';
  const category = template.category || '';
  const tags = template.tags || [];
  
  // Start with full name
  let tooltip = name;
  
  // Expand any abbreviations in the name
  const words = name.split(/[\s\-_]+/);
  const expanded = words.map(word => {
    const lower = word.toLowerCase();
    if (TOOLTIP_DESCRIPTIONS[lower] && lower !== word.toLowerCase()) {
      return `${word} (${TOOLTIP_DESCRIPTIONS[lower]})`;
    }
    // Check common abbreviations
    const abbrevs = ['cta', 'faq', 'nav', 'btn', 'img', 'bg', 'sm', 'md', 'lg', 'v1', 'v2', 'alt', 'min', 'std', 'pro'];
    if (abbrevs.includes(lower)) {
      return `${word} (${TOOLTIP_DESCRIPTIONS[lower]})`;
    }
    return word;
  });
  
  // Check if name has abbreviations that need expanding
  const hasAbbrev = words.some(w => ['cta', 'faq', 'nav', 'btn', 'img', 'bg', 'sm', 'md', 'lg', 'v1', 'v2'].includes(w.toLowerCase()));
  if (hasAbbrev) {
    tooltip = expanded.join(' ');
  }
  
  // Add category description
  const catLower = category.toLowerCase();
  if (TOOLTIP_DESCRIPTIONS[catLower]) {
    tooltip += `\n\n${TOOLTIP_DESCRIPTIONS[catLower]}`;
  } else {
    tooltip += `\n\nCategory: ${category}`;
  }
  
  // Add tags if present
  if (tags.length > 0) {
    tooltip += `\nTags: ${tags.join(', ')}`;
  }
  
  // Add section-specific usage hint
  const sectionNames = {
    header: 'Header',
    main: 'Main Content',
    footer: 'Footer'
  };
  const sectionName = sectionNames[targetSection] || 'canvas';
  tooltip += `\n\nClick to add to ${sectionName}`;
  
  return tooltip;
}

// Categorize a template into header/pages/main/footer
function getSiteSection(template) {
  const cat = (template.category || '').toLowerCase();
  const name = (template.name || '').toLowerCase();
  const tags = (template.tags || []).map(t => t.toLowerCase());
  
  // Check header first (most specific)
  const header = SITE_SECTIONS.header;
  if (header.categories.some(c => cat.includes(c)) ||
      header.keywords.some(kw => name.includes(kw) || tags.some(t => t.includes(kw)))) {
    return 'header';
  }
  
  // Check footer
  const footer = SITE_SECTIONS.footer;
  if (footer.categories.some(c => cat.includes(c)) ||
      footer.keywords.some(kw => name.includes(kw) || tags.some(t => t.includes(kw)))) {
    return 'footer';
  }
  
  /* Pages check removed
  // Check pages (full page templates)
  const pages = SITE_SECTIONS.pages;
  if (pages.categories.some(c => cat.includes(c)) ||
      pages.keywords.some(kw => name.includes(kw) || tags.some(t => t.includes(kw)))) {
    return 'pages';
  }
  */
  
  // Everything else goes to main (sections)
  return 'main';
}

// Get sort priority for main content (lower = higher on page)
function getMainContentPriority(template) {
  const cat = (template.category || '').toLowerCase();
  const name = (template.name || '').toLowerCase();
  const categoryOrder = SITE_SECTIONS.main.categoryOrder;
  
  // Find matching category in order list
  for (let i = 0; i < categoryOrder.length; i++) {
    if (cat.includes(categoryOrder[i]) || name.includes(categoryOrder[i])) {
      return i;
    }
  }
  
  return categoryOrder.length; // Unknown goes last
}

function getTemplatesBySection() {
  const sections = {
    header: [],
    // pages: [], // Removed
    main: [],
    footer: []
  };
  
  let filtered = [...templates];
  
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }
  
  filtered.forEach(t => {
    const section = getSiteSection(t);
    if (sections[section]) {
      sections[section].push(t);
    }
  });
  
  // Sort header and footer alphabetically
  sections.header.sort((a, b) => a.name.localeCompare(b.name));
  sections.footer.sort((a, b) => a.name.localeCompare(b.name));
  // sections.pages.sort((a, b) => a.name.localeCompare(b.name)); // Removed
  
  // Sort main by page order (hero first, then features, etc.)
  sections.main.sort((a, b) => {
    const priorityA = getMainContentPriority(a);
    const priorityB = getMainContentPriority(b);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.name.localeCompare(b.name); // Alphabetical within same priority
  });
  
  return sections;
}

function render() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let container = sidebar.querySelector('.template-browser');
  
  if (!container) {
    const oldElements = sidebar.querySelectorAll('.search, .favorites-section, .categories, #list, #searchContainer');
    oldElements.forEach(el => el.remove());
    
    container = document.createElement('div');
    container.className = 'template-browser';
    
    const resizeHandle = sidebar.querySelector('.sidebar-resize-handle');
    const collapsedLabel = sidebar.querySelector('.sidebar-collapsed-label');
    const toggle = sidebar.querySelector('.sidebar-toggle');
    
    if (resizeHandle) resizeHandle.after(container);
    else if (collapsedLabel) collapsedLabel.after(container);
    else if (toggle) toggle.after(container);
    else sidebar.appendChild(container);
  }

  if (viewMode === 'site') {
    renderSiteMode(container);
  } else {
    renderGridMode(container);
  }
  
  bindEvents();
}

function renderGridMode(container) {
  const filtered = getFilteredTemplates();

  const selectedCatInfo = selectedCategory 
    ? categories.find(c => c.id === selectedCategory) 
    : null;
  const selectedLabel = selectedCatInfo 
    ? `${selectedCatInfo.icon} ${selectedCatInfo.name}` 
    : `All Templates`;

  container.innerHTML = `
    <div class="tb-toolbar">
      <div class="tb-search">
        <input type="text" id="tbSearch" placeholder="Search..." value="${searchQuery}" />
      </div>
      <div class="tb-filter">
        <select id="tbCategory" class="tb-select">
          <option value="">📁 All (${templates.length})</option>
          ${categories.map(c => {
            const count = templates.filter(t => t.category === c.id).length;
            return `<option value="${c.id}" ${selectedCategory === c.id ? 'selected' : ''}>${c.icon} ${c.name} (${count})</option>`;
          }).join('')}
        </select>
      </div>
      <button id="tb-mode-btn-site" class="tb-mode-btn" onclick="window.tbToggleMode()" title="Switch to Site Builder view">
        🌐
      </button>
    </div>
    
    <div class="tb-results">
      <div class="tb-results-header">
        <span class="tb-results-label">${selectedLabel}</span>
        <span class="tb-results-count">${filtered.length}</span>
      </div>
      <div class="tb-grid">
        ${filtered.length === 0 ? '<div class="tb-empty">No templates found</div>' : filtered.map(t => {
          const cat = categories.find(c => c.id === t.category);
          const tooltip = generateTooltip(t);
          return `<button id="tb-grid-card-${t.id}" class="tb-card" data-id="${t.id}" title="${tooltip.replace(/"/g, '&quot;')}">
            <span class="tb-card-icon">${cat?.icon || '📄'}</span>
            <span class="tb-card-name">${t.name}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderSiteMode(container) {
  const sections = getTemplatesBySection();
  const templatesInCanvas = getTemplatesInCanvas();
  
  // Get collapsed state - ALL COLLAPSED BY DEFAULT
  const sectionCollapsedState = JSON.parse(localStorage.getItem('tb-collapsed-sections') || '{"header":true,"main":true,"footer":true}');

  // Section order and subtitles
  const sectionOrder = ['header', 'main', 'footer'];
  const subtitles = {
    header: 'Navigation, menus, logo',
    main: 'Content sections for your page',
    footer: 'Links, copyright, credits'
  };

  // ALWAYS show all three sections - clicking expands/collapses them
  container.innerHTML = `
    <div class="tb-toolbar">
      <div class="tb-search">
        <input type="text" id="tbSearch" placeholder="Search..." value="${searchQuery}" />
      </div>
      <button id="tb-mode-btn-grid" class="tb-mode-btn active" onclick="window.tbToggleMode()" title="Switch to Grid view">
        📁
      </button>
    </div>
    
    <div class="tb-site-sections">
      ${sectionOrder.map(id => {
        const section = SITE_SECTIONS[id];
        const items = sections[id] || [];
        const isCollapsed = sectionCollapsedState[id] !== false; // Default to collapsed
        const isActive = activeTreeSection === id;
        const isHorizontal = section.layout === 'horizontal';
        const layoutClass = isHorizontal ? 'tb-grid-horizontal' : 'tb-grid-compact';
        
        return `
          <div class="tb-site-section ${isCollapsed ? 'collapsed' : ''} ${isActive ? 'filtered-active' : ''}" data-section="${id}">
            <button id="tb-section-header-${id}" class="tb-section-header" tabindex="-1" onclick="window.tbToggleSection('${id}')">
              <span class="tb-section-icon">${section.icon}</span>
              <div class="tb-section-info">
                <span class="tb-section-title">${section.title}</span>
                <span class="tb-section-subtitle">${subtitles[id]}</span>
              </div>
              <span class="tb-section-count">${items.length}</span>
              <span class="tb-section-arrow">${isCollapsed ? '▶' : '▼'}</span>
            </button>
            <div class="tb-section-content">
              ${id === 'main' ? renderSectionsRow() : ''}
              <div class="tb-grid ${layoutClass}">
                ${items.length === 0 
                  ? `<div class="tb-empty-small">No ${section.title.toLowerCase()} templates yet</div>`
                  : items.map(t => {
                    const cat = categories.find(c => c.id === t.category);
                    const tooltip = generateTooltip(t, id);
                    const isInCanvas = templatesInCanvas.has(t.id);
                    const inCanvasClass = isInCanvas ? 'in-canvas' : '';
                    return `<button id="tb-site-card-${t.id}" class="tb-card tb-card-small ${inCanvasClass}" data-id="${t.id}" title="${tooltip.replace(/"/g, '&quot;')}"${isInCanvas ? ' disabled' : ''}>
                      <span class="tb-card-icon">${cat?.icon || '📄'}</span>
                      <span class="tb-card-name">${t.name}</span>
                    </button>`;
                  }).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render the Sections row - empty containers that can hold content
 */
function renderSectionsRow() {
  const sectionsCollapsed = JSON.parse(localStorage.getItem('tb-collapsed-sections') || '{}');
  const sectionsRowCollapsed = sectionsCollapsed['sections-row'];
  
  return `
    <div class="tb-sections-row ${sectionsRowCollapsed ? 'collapsed' : ''}">
      <button id="tb-sections-header" class="tb-sections-header" tabindex="-1" onclick="window.tbToggleSectionsRow()">
        <span class="tb-section-icon">📏</span>
        <div class="tb-section-info">
          <span class="tb-section-title">Sections</span>
          <span class="tb-section-subtitle">Empty containers for content</span>
        </div>
        <span class="tb-section-count">${SECTION_CONTAINERS.length}</span>
        <span class="tb-section-arrow">${sectionsRowCollapsed ? '▶' : '▼'}</span>
      </button>
      <div class="tb-sections-content">
        <div class="tb-sections-grid">
          ${SECTION_CONTAINERS.map(s => `
            <button id="tb-section-btn-${s.id}" class="tb-section-btn" 
                    data-section-type="${s.id}" 
                    title="${s.desc}\n\nClick to add to canvas"
                    onclick="window.tbAddSection('${s.id}')">
              <span class="tb-section-btn-icon">${s.icon}</span>
              <span class="tb-section-btn-name">${s.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Toggle sections row collapse
window.tbToggleSectionsRow = () => {
  const rowCollapsed = JSON.parse(localStorage.getItem('tb-collapsed-sections') || '{}');
  rowCollapsed['sections-row'] = !rowCollapsed['sections-row'];
  localStorage.setItem('tb-collapsed-sections', JSON.stringify(rowCollapsed));
  render();
};

// Add an empty section container to the canvas
window.tbAddSection = (sectionType) => {
  const pageSection = SECTION_CONTAINERS.find(s => s.id === sectionType);
  if (!section) return;
  
  const html = generateSectionHTML(section);
  
  if (window.addTemplateHTML) {
    window.addTemplateHTML(html, { name: section.name + ' Section', icon: section.icon });
  } else if (window.addHTML) {
    window.addHTML(html);
  }
  
  if (window.toast) {
    window.toast(`Added ${section.name} section`);
  }
  
  triggerOnboardingHint();
};

/**
 * Generate HTML for an empty section container
 */
function generateSectionHTML(section) {
  const id = 'section-' + Date.now();
  
  // Generate column structure based on type
  let innerHTML = '';
  let sectionStyle = 'background: var(--bg-secondary, #f8f9fa); min-height: 200px; padding: 3rem 1rem;';
  
  // Common drop zone style
  const dropStyle = 'min-height: 100px; border: 2px dashed #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #888;';
  
  switch (section.cols) {
    case 1:
      innerHTML = `
        <div class="wb-drop-zone" data-drop="true" style="${dropStyle}">
          <span>Drop content here</span>
        </div>`;
      break;
      
    case 2:
      innerHTML = `
        <div style="display: flex; flex-direction: row; gap: 1.5rem; width: 100%;">
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1;">
            <span>Column 1</span>
          </div>
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1;">
            <span>Column 2</span>
          </div>
        </div>`;
      break;
      
    case 3:
      innerHTML = `
        <div style="display: flex; flex-direction: row; gap: 1.5rem; width: 100%;">
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1;">
            <span>Column 1</span>
          </div>
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1;">
            <span>Column 2</span>
          </div>
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1;">
            <span>Column 3</span>
          </div>
        </div>`;
      break;
      
    case 4:
      innerHTML = `
        <div style="display: flex; flex-direction: row; gap: 1rem; width: 100%;">
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1; min-height: 80px;">
            <span>1</span>
          </div>
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1; min-height: 80px;">
            <span>2</span>
          </div>
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1; min-height: 80px;">
            <span>3</span>
          </div>
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1; min-height: 80px;">
            <span>4</span>
          </div>
        </div>`;
      break;
      
    case 'sidebar-left':
      innerHTML = `
        <div style="display: flex; flex-direction: row; gap: 1.5rem; width: 100%; min-height: 300px;">
          <aside class="wb-drop-zone" data-drop="true" style="${dropStyle} width: 250px; flex-shrink: 0; min-height: 200px; background: rgba(0,0,0,0.05);">
            <span>Sidebar</span>
          </aside>
          <main class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1; min-height: 200px;">
            <span>Main Content</span>
          </main>
        </div>`;
      break;
      
    case 'sidebar-right':
      innerHTML = `
        <div style="display: flex; flex-direction: row; gap: 1.5rem; width: 100%; min-height: 300px;">
          <main class="wb-drop-zone" data-drop="true" style="${dropStyle} flex: 1; min-height: 200px;">
            <span>Main Content</span>
          </main>
          <aside class="wb-drop-zone" data-drop="true" style="${dropStyle} width: 250px; flex-shrink: 0; min-height: 200px; background: rgba(0,0,0,0.05);">
            <span>Sidebar</span>
          </aside>
        </div>`;
      break;
      
    case 'full':
      sectionStyle = 'background: var(--bg-secondary, #f8f9fa); min-height: 200px; padding: 3rem 0;';
      innerHTML = `
        <div class="wb-drop-zone" data-drop="true" style="${dropStyle} min-height: 150px; margin: 0 16px;">
          <span>Full Width Content</span>
        </div>`;
      break;
      
    case 'centered':
      innerHTML = `
        <div style="max-width: 42rem; margin: 0 auto; width: 100%;">
          <div class="wb-drop-zone" data-drop="true" style="${dropStyle}">
            <span>Centered Content</span>
          </div>
        </div>`;
      break;
      
    default:
      innerHTML = `
        <div class="wb-drop-zone" data-drop="true" style="${dropStyle}">
          <span>Drop content here</span>
        </div>`;
  }
  
  return `<section id="${id}" style="${sectionStyle}">${innerHTML}</section>`;
}

// Clear the section filter
window.tbClearFilter = () => {
  activeTreeSection = null;
  // Also clear the tree panel's active section
  if (window.setActiveSection) {
    window.setActiveSection(null);
  }
  render();
};

window.tbToggleMode = () => {
  viewMode = viewMode === 'site' ? 'grid' : 'site';
  localStorage.setItem('tb-view-mode', viewMode);
  render();
};

window.tbToggleSection = (sectionId) => {
  const sectionCollapsed = JSON.parse(localStorage.getItem('tb-collapsed-sections') || '{}');
  const wasCollapsed = sectionCollapsed[sectionId] !== false;
  
  // Toggle collapsed state
  sectionCollapsed[sectionId] = !wasCollapsed;
  localStorage.setItem('tb-collapsed-sections', JSON.stringify(sectionCollapsed));
  
  // When EXPANDING a section, also activate it in the canvas (make it green)
  if (wasCollapsed) {
    // Set this section as the target in canvas
    if (window.setTargetSection) {
      window.setTargetSection(sectionId);
    }
  }
  
  // Dispatch event to sync tree panel
  document.dispatchEvent(new CustomEvent('wb:template:section:toggled', { 
    detail: { section: sectionId, expanded: wasCollapsed } 
  }));
  
  render();
};

function bindEvents() {
  // Search
  const search = document.getElementById('tbSearch');
  if (search) {
    search.oninput = (e) => {
      searchQuery = e.target.value;
      render();
    };
  }
  
  // Category dropdown (grid mode only)
  const categorySelect = document.getElementById('tbCategory');
  if (categorySelect) {
    categorySelect.onchange = (e) => {
      selectedCategory = e.target.value || null;
      render();
    };
  }
  
  // Template cards - single click selects, double-click adds to active section
  document.querySelectorAll('.tb-card').forEach(card => {
    // Single click - add to canvas (default behavior)
    card.onclick = () => {
      const clickId = card.dataset.id;
      console.log('[Templates] Clicked:', clickId);
      useTemplate(clickId);
      card.blur(); // Remove focus after click
    };
    
    // Double-click - add to end of active section
    card.ondblclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dblClickId = card.dataset.id;
      const section = activeTreeSection || window.getActiveSection?.() || 'main';
      console.log('[Templates] Double-clicked:', dblClickId, 'for section:', section);
      useTemplateInSection(dblClickId, section);
    };
  });
}

/**
 * Add template to canvas at a specific section
 * @param {string} id - Template ID
 * @param {string} section - 'header' | 'main' | 'footer'
 */
async function useTemplateInSection(id, section) {
  const template = templates.find(t => t.id === id);
  if (!template) {
    console.error('[Templates] Not found:', id);
    return;
  }
  
  console.log('[Templates] Adding to section:', section, template.name);
  
  // Get the category icon
  const cat = categories.find(c => c.id === template.category);
  const icon = cat?.icon || '📄';
  
  // Get HTML content
  let html = null;
  if (!template.components) {
    html = await fetchTemplateHTML(id);
  }
  
  if (html && window.addHTMLToSection) {
    window.addHTMLToSection(html, section, { name: template.name, icon: icon });
  } else if (html && window.addTemplateHTML) {
    window.addTemplateHTML(html, { name: template.name, icon: icon });
  } else if (html && window.addHTML) {
    // Fallback to regular add
    window.addHTML(html);
  } else if (template.components && window.addTemplateToSection) {
    window.addTemplateToSection(template, section);
  } else if (template.components && window.addTemplate) {
    window.addTemplate(template);
  }
  
  if (window.toast) {
    window.toast(`Added ${template.name} to ${section}`);
  }
  
  triggerOnboardingHint();
}

async function useTemplate(id) {
  const template = templates.find(t => t.id === id);
  if (!template) {
    console.error('[Templates] Not found:', id);
    return;
  }
  
  console.log('[Templates] Using:', template.name);
  
  // Get the category icon
  const cat = categories.find(c => c.id === template.category);
  const icon = cat?.icon || '📄';
  
  // AUTO-DETECT TARGET SECTION based on template type (header/main/footer)
  const targetSection = getSiteSection(template);
  console.log('[Templates] Auto-routing to section:', targetSection);
  
  // Set the target section BEFORE adding - this ensures addElementToCanvas routes correctly
  if (window.setTargetSection) {
    window.setTargetSection(targetSection);
  }
  
  // HTML template
  if (!template.components) {
    const html = await fetchTemplateHTML(id);
    if (html) {
      // Use addTemplateHTML - it will use the targetSection we just set
      if (window.addTemplateHTML) {
        window.addTemplateHTML(html, { name: template.name, icon: icon });
      } else if (window.addHTML) {
        window.addHTML(html);
      }
      
      // Auto-scaffold linked sections
      await autoScaffoldFromLinks(html, template);
      
    } else {
      console.error('[Templates] HTML not found for:', id);
      if (window.toast) window.toast('Template file not found');
    }
    triggerOnboardingHint();
    render(); // Re-render to update "in-canvas" badges
    return;
  }
  
  // JSON template
  if (window.addTemplate) {
    window.addTemplate(template);
  }
  triggerOnboardingHint();
  render(); // Re-render to update "in-canvas" badges
}

/**
 * Auto-scaffold sections based on nav links in the template
 * If a header has links to #Home, #About, #Services, etc.
 * automatically add those sections with matching IDs
 */
async function autoScaffoldFromLinks(html, template) {
  // Parse the HTML to find anchor links
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find all internal links (href starting with #)
  const links = doc.querySelectorAll('a[href^="#"]');
  const linkedSections = [];
  
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    const text = link.textContent.trim();
    
    // Only process hash links with actual IDs
    if (href.startsWith('#') && href.length > 1) {
      const id = href.substring(1); // Remove the #
      // Use the link text as the section title, or capitalize the ID
      const title = text || id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
      
      // Avoid duplicates
      if (!linkedSections.find(s => s.id === id)) {
        linkedSections.push({ id, title, href });
      }
    }
  });
  
  if (linkedSections.length === 0) return;
  
  console.log('[Templates] Found nav links to scaffold:', linkedSections);
  
  // Set target to main section for all scaffolded content
  if (window.setTargetSection) {
    window.setTargetSection('main');
  }
  
  // Create a section for each link
  for (const section of linkedSections) {
    // Skip if section already exists on canvas
    if (document.getElementById(section.id)) {
      console.log('[Templates] Section already exists:', section.id);
      continue;
    }
    
    // Try to find a matching template first
    const matchingTemplate = findMatchingTemplate(section.id, section.title);
    
    if (matchingTemplate) {
      // Use the matching template
      const templateHtml = await fetchTemplateHTML(matchingTemplate.id);
      if (templateHtml && window.addHTML) {
        // Inject the ID into the template's first element
        const modifiedHtml = injectSectionId(templateHtml, section.id);
        console.log('[Templates] Adding matched template for:', section.title);
        window.addHTML(modifiedHtml);
      }
    } else {
      // Create a placeholder section with the ID
      addPlaceholderSectionWithId(section.id, section.title);
    }
  }
  
  if (window.toast && linkedSections.length > 0) {
    window.toast(`Created ${linkedSections.length} section${linkedSections.length > 1 ? 's' : ''} from nav links`);
  }
}

/**
 * Find a template that matches the section name
 */
function findMatchingTemplate(sectionId, sectionTitle) {
  // Start with initial terms (use Set to avoid duplicates and infinite loops)
  const searchTerms = new Set([
    sectionId.toLowerCase(), 
    sectionTitle.toLowerCase()
  ]);
  
  // Common mappings - NOTE: values should NOT include the key itself to avoid loops
  const mappings = {
    'home': ['hero', 'landing', 'welcome'],
    'about': ['company', 'team', 'who-we-are'],
    'services': ['features', 'offerings', 'what-we-do'],
    'portfolio': ['gallery', 'work', 'projects'],
    'contact': ['get-in-touch', 'reach', 'connect'],
    'pricing': ['plans', 'packages', 'rates'],
    'testimonials': ['reviews', 'feedback', 'quotes'],
    'faq': ['questions', 'help', 'support'],
    'blog': ['news', 'articles', 'posts'],
    'features': ['benefits', 'highlights']
  };
  
  // Expand search terms with mappings (iterate over copy to avoid infinite loop)
  const initialTerms = [...searchTerms];
  for (const term of initialTerms) {
    if (mappings[term]) {
      for (const mapped of mappings[term]) {
        searchTerms.add(mapped);
      }
    }
  }
  
  // Convert back to array for searching
  const termsArray = [...searchTerms];
  
  // Search templates
  return templates.find(t => {
    const tName = t.name.toLowerCase();
    const tId = t.id.toLowerCase();
    const tCat = (t.category || '').toLowerCase();
    
    return termsArray.some(term => 
      tName.includes(term) || tId.includes(term) || tCat.includes(term)
    );
  });
}

/**
 * Inject an ID into the first element of HTML
 */
function injectSectionId(html, id) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const firstEl = doc.body.firstElementChild;
  
  if (firstEl) {
    firstEl.id = id;
  }
  
  return doc.body.innerHTML;
}

/**
 * Add a placeholder section with a specific ID
 */
function addPlaceholderSectionWithId(id, title) {
  const html = `
    <section id="${id}" class="py-16 px-4" style="background: var(--bg-secondary, #f8f9fa); min-height: 300px;">
      <div class="container mx-auto max-w-4xl text-center">
        <h2 class="text-3xl font-bold mb-4">${title}</h2>
        <p class="text-gray-600 mb-8">This section was auto-created from your navigation link.</p>
        <p class="text-sm text-gray-400">Replace this content or drag a template here.</p>
      </div>
    </section>
  `;
  
  if (window.addHTML) {
    console.log('[Templates] Adding placeholder section:', id, '-', title);
    window.addHTML(html);
  }
}

/**
 * Add a placeholder section when no template exists
 */
function addPlaceholderSection(sectionName) {
  const title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
  const html = `
    <section id="${sectionName}" class="py-16 px-4" style="background: var(--bg-secondary, #f8f9fa); min-height: 300px;">
      <div class="container mx-auto max-w-4xl text-center">
        <h2 class="text-3xl font-bold mb-4">${title}</h2>
        <p class="text-gray-600 mb-8">This section was auto-created from your navigation link.</p>
        <p class="text-sm text-gray-400">Replace this content or drag a ${title} template here.</p>
      </div>
    </section>
  `;
  
  if (window.addHTML) {
    console.log('[Templates] Adding placeholder section:', sectionName);
    window.addHTML(html);
  }
}

/**
 * Add documentation section with instructions
 */
function addDocsSection() {
  const docsHtml = `
    <section id="docs" class="py-16 px-4" style="background: var(--bg-primary, #fff);">
      <div class="container mx-auto max-w-4xl">
        <h2 class="text-3xl font-bold mb-4 text-center">📚 Documentation</h2>
        <p class="text-gray-600 mb-8 text-center">Learn how to use our product with these guides.</p>
        
        <div class="bg-gray-50 rounded-lg p-6 mb-8" style="background: var(--bg-secondary, #f1f5f9);">
          <h3 class="text-xl font-semibold mb-4">📁 Documentation Structure</h3>
          <p class="text-gray-600 mb-4">Create a <code class="bg-gray-200 px-2 py-1 rounded">/docs</code> folder with Markdown files:</p>
          
          <div class="bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
            <div>docs/</div>
            <div>├── index.json      <span class="text-gray-500"># Required: defines doc structure</span></div>
            <div>├── getting-started.md</div>
            <div>├── installation.md</div>
            <div>├── configuration.md</div>
            <div>└── api-reference.md</div>
          </div>
          
          <h4 class="font-semibold mb-2">📝 index.json Example:</h4>
          <pre class="bg-gray-800 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>{
  "title": "Documentation",
  "description": "Learn how to use our product",
  "pages": [
    {
      "id": "getting-started",
      "title": "Getting Started",
      "file": "getting-started.md",
      "icon": "🚀"
    },
    {
      "id": "installation",
      "title": "Installation",
      "file": "installation.md",
      "icon": "📦"
    },
    {
      "id": "configuration",
      "title": "Configuration",
      "file": "configuration.md",
      "icon": "⚙️"
    },
    {
      "id": "api-reference",
      "title": "API Reference",
      "file": "api-reference.md",
      "icon": "📖"
    }
  ]
}</code></pre>
        </div>
        
        <div class="bg-blue-50 rounded-lg p-6" style="background: rgba(99, 102, 241, 0.1);">
          <h3 class="text-xl font-semibold mb-4">📑 Starter Template: getting-started.md</h3>
          <pre class="bg-gray-800 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code># Getting Started

Welcome to our documentation! This guide will help you get up and running.

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Quick Start

\`\`\`bash
# Install the package
npm install your-package

# Run the development server
npm run dev
\`\`\`

## Next Steps

- [Installation Guide](installation.md)
- [Configuration Options](configuration.md)
- [API Reference](api-reference.md)

## Need Help?

Join our community or open an issue on GitHub.</code></pre>
        </div>
        
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="#getting-started" class="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
            <span class="text-2xl mb-2 block">🚀</span>
            <h4 class="font-semibold">Getting Started</h4>
            <p class="text-sm text-gray-500">Quick start guide</p>
          </a>
          <a href="#installation" class="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
            <span class="text-2xl mb-2 block">📦</span>
            <h4 class="font-semibold">Installation</h4>
            <p class="text-sm text-gray-500">Setup instructions</p>
          </a>
          <a href="#api-reference" class="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
            <span class="text-2xl mb-2 block">📖</span>
            <h4 class="font-semibold">API Reference</h4>
            <p class="text-sm text-gray-500">Full API documentation</p>
          </a>
        </div>
      </div>
    </section>
  `;
  
  if (window.addHTML) {
    console.log('[Templates] Adding docs section with instructions');
    window.addHTML(docsHtml);
  }
}

/**
 * Add Free Trial / Pricing section
 * Includes pricing cards with plans and payment CTA
 */
function addFreeTrialSection() {
  const html = `
    <section id="pricing" class="py-20 px-4" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div class="container mx-auto max-w-6xl">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-white mb-4">Start Your Free Trial</h2>
          <p class="text-xl text-white/80">No credit card required. Cancel anytime.</p>
        </div>
        
        <!-- Trial Rules -->
        <div class="bg-white/10 backdrop-blur rounded-xl p-6 mb-12 max-w-2xl mx-auto">
          <h3 class="text-xl font-semibold text-white mb-4">📋 Free Trial Includes:</h3>
          <ul class="text-white/90 space-y-2">
            <li class="flex items-center gap-2"><span class="text-green-300">✓</span> 14 days full access to all features</li>
            <li class="flex items-center gap-2"><span class="text-green-300">✓</span> No credit card required to start</li>
            <li class="flex items-center gap-2"><span class="text-green-300">✓</span> Unlimited projects during trial</li>
            <li class="flex items-center gap-2"><span class="text-green-300">✓</span> Full customer support</li>
            <li class="flex items-center gap-2"><span class="text-green-300">✓</span> Cancel anytime, no questions asked</li>
          </ul>
        </div>
        
        <!-- Pricing Cards -->
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Free Plan -->
          <div class="bg-white rounded-2xl p-8 shadow-xl">
            <div class="text-center mb-6">
              <h3 class="text-xl font-bold text-gray-800">Free</h3>
              <div class="mt-4">
                <span class="text-4xl font-bold">$0</span>
                <span class="text-gray-500">/month</span>
              </div>
            </div>
            <ul class="space-y-3 mb-8">
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> 1 project</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> Basic features</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> Community support</li>
              <li class="flex items-center gap-2 text-gray-400"><span>✗</span> Advanced analytics</li>
              <li class="flex items-center gap-2 text-gray-400"><span>✗</span> Priority support</li>
            </ul>
            <a href="#signup" class="block w-full py-3 text-center border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Get Started
            </a>
          </div>
          
          <!-- Pro Plan (Popular) -->
          <div class="bg-white rounded-2xl p-8 shadow-xl ring-4 ring-purple-500 relative">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <div class="text-center mb-6">
              <h3 class="text-xl font-bold text-gray-800">Pro</h3>
              <div class="mt-4">
                <span class="text-4xl font-bold">$29</span>
                <span class="text-gray-500">/month</span>
              </div>
            </div>
            <ul class="space-y-3 mb-8">
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> Unlimited projects</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> All features</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> Advanced analytics</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> Priority support</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> API access</li>
            </ul>
            <a href="#contact" class="block w-full py-3 text-center bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Start Free Trial
            </a>
          </div>
          
          <!-- Enterprise Plan -->
          <div class="bg-white rounded-2xl p-8 shadow-xl">
            <div class="text-center mb-6">
              <h3 class="text-xl font-bold text-gray-800">Enterprise</h3>
              <div class="mt-4">
                <span class="text-4xl font-bold">Custom</span>
              </div>
            </div>
            <ul class="space-y-3 mb-8">
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> Everything in Pro</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> Dedicated support</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> Custom integrations</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> SLA guarantee</li>
              <li class="flex items-center gap-2 text-gray-600"><span class="text-green-500">✓</span> On-premise option</li>
            </ul>
            <a href="mailto:sales@yourcompany.com?subject=Enterprise%20Inquiry" class="block w-full py-3 text-center border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
        
        <!-- Payment Note -->
        <div class="text-center mt-12">
          <p class="text-white/70 text-sm">💳 Secure payment via Stripe. Cancel anytime.</p>
          <div class="flex justify-center gap-4 mt-4 opacity-70">
            <span class="text-white">💳 Visa</span>
            <span class="text-white">💳 Mastercard</span>
            <span class="text-white">💳 Amex</span>
            <span class="text-white">🅿️ PayPal</span>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Contact/Signup Form -->
    <section id="signup" class="py-16 px-4" style="background: #f8fafc;">
      <div class="container mx-auto max-w-xl">
        <div class="bg-white rounded-2xl p-8 shadow-lg">
          <h3 class="text-2xl font-bold text-center mb-2">🚀 Start Your Free Trial</h3>
          <p class="text-gray-600 text-center mb-8">Get started in under 2 minutes</p>
          
          <form action="#" method="POST" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" required 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     placeholder="John Smith">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
              <input type="email" name="email" required 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     placeholder="john@company.com">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input type="text" name="company" 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     placeholder="Acme Inc.">
            </div>
            <button type="submit" 
                    class="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors">
              Start 14-Day Free Trial →
            </button>
          </form>
          
          <p class="text-xs text-gray-500 text-center mt-4">
            By signing up, you agree to our <a href="#terms" class="underline">Terms of Service</a> 
            and <a href="#privacy" class="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </section>
  `;
  
  if (window.addHTML) {
    console.log('[Templates] Adding free trial/pricing section');
    window.addHTML(html);
  }
}

/**
 * Add Schedule Demo section
 * Button opens email with pre-filled subject line
 */
function addScheduleDemoSection() {
  const html = `
    <section id="demo" class="py-20 px-4" style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);">
      <div class="container mx-auto max-w-4xl text-center">
        <span class="text-5xl mb-6 block">🎥</span>
        <h2 class="text-4xl font-bold text-white mb-4">See It In Action</h2>
        <p class="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          Schedule a personalized demo with our team. We'll walk you through all the features 
          and answer any questions you have.
        </p>
        
        <div class="bg-white/10 backdrop-blur rounded-xl p-8 max-w-lg mx-auto mb-8">
          <h3 class="text-xl font-semibold text-white mb-4">📅 What to Expect:</h3>
          <ul class="text-white/90 text-left space-y-3">
            <li class="flex items-center gap-3"><span class="text-green-300">✓</span> 30-minute personalized walkthrough</li>
            <li class="flex items-center gap-3"><span class="text-green-300">✓</span> Live Q&A with our product experts</li>
            <li class="flex items-center gap-3"><span class="text-green-300">✓</span> Custom solutions for your use case</li>
            <li class="flex items-center gap-3"><span class="text-green-300">✓</span> No commitment required</li>
          </ul>
        </div>
        
        <!-- Email button with pre-filled subject -->
        <a href="mailto:demo@yourcompany.com?subject=Demo%20Request%20-%20Schedule%20a%20Product%20Demo&body=Hi%2C%0A%0AI'd%20like%20to%20schedule%20a%20demo%20of%20your%20product.%0A%0AMy%20preferred%20times%3A%0A-%20%0A-%20%0A%0ACompany%3A%20%0ARole%3A%20%0A%0AThank%20you!" 
           class="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-900 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg">
          <span>📧</span>
          Schedule Your Demo
        </a>
        
        <p class="text-white/60 text-sm mt-6">
          Or call us directly: <a href="tel:+1234567890" class="underline">+1 (234) 567-890</a>
        </p>
        
        <!-- Alternative: Calendly embed placeholder -->
        <div class="mt-12 bg-white/5 rounded-xl p-6 max-w-md mx-auto">
          <p class="text-white/70 text-sm mb-2">💡 Pro Tip: Embed your calendar</p>
          <code class="text-xs text-green-300 bg-black/30 px-3 py-2 rounded block">
            &lt;!-- Add Calendly widget here --&gt;<br>
            &lt;div class="calendly-inline-widget" data-url="https://calendly.com/your-link"&gt;&lt;/div&gt;
          </code>
        </div>
      </div>
    </section>
  `;
  
  if (window.addHTML) {
    console.log('[Templates] Adding schedule demo section');
    window.addHTML(html);
  }
}

/**
 * Add Signup/Registration section
 */
function addSignupSection() {
  const html = `
    <section id="signup" class="py-16 px-4" style="background: #f8fafc;">
      <div class="container mx-auto max-w-md">
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <div class="text-center mb-8">
            <span class="text-4xl mb-4 block">👋</span>
            <h2 class="text-2xl font-bold">Create Your Account</h2>
            <p class="text-gray-600 mt-2">Join thousands of happy users</p>
          </div>
          
          <form action="#" method="POST" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" name="firstName" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" name="lastName" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" required 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                     placeholder="you@example.com">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" required minlength="8"
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                     placeholder="Min. 8 characters">
            </div>
            
            <div class="flex items-center gap-2">
              <input type="checkbox" id="terms" name="terms" required class="rounded">
              <label for="terms" class="text-sm text-gray-600">
                I agree to the <a href="#terms" class="text-purple-600 underline">Terms</a> 
                and <a href="#privacy" class="text-purple-600 underline">Privacy Policy</a>
              </label>
            </div>
            
            <button type="submit" 
                    class="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Create Account
            </button>
          </form>
          
          <div class="mt-6 text-center">
            <p class="text-gray-600 text-sm">
              Already have an account? <a href="#login" class="text-purple-600 font-semibold">Sign in</a>
            </p>
          </div>
          
          <div class="mt-8 pt-6 border-t border-gray-200">
            <p class="text-center text-sm text-gray-500 mb-4">Or continue with</p>
            <div class="grid grid-cols-2 gap-4">
              <button class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span>🔵</span> Google
              </button>
              <button class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span>⚫</span> GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  
  if (window.addHTML) {
    console.log('[Templates] Adding signup section');
    window.addHTML(html);
  }
}

/**
 * Add articles section for reading time cards
 * Creates individual article pages that cards can link to
 */
function addArticlesSection(articles) {
  // Generate word count estimate: ~200 words per minute reading
  const getWordCount = (minutes) => minutes * 200;
  
  // Generate placeholder paragraphs based on reading time
  const generateContent = (readTime, title) => {
    const paragraphs = Math.max(3, Math.ceil(readTime * 1.5));
    let content = '';
    
    const intros = [
      `In this article, we'll explore the key concepts behind ${title.toLowerCase()} and how they can benefit your workflow.`,
      `Understanding ${title.toLowerCase()} is essential for anyone looking to improve their skills in this area.`,
      `Let's dive deep into ${title.toLowerCase()} and discover why it matters for your success.`
    ];
    
    const middles = [
      `One of the most important aspects to consider is how this applies to real-world scenarios. Many professionals have found that implementing these strategies leads to significant improvements in productivity and outcomes.`,
      `Research shows that taking a structured approach yields the best results. By following proven methodologies, you can avoid common pitfalls and accelerate your progress.`,
      `The key to success lies in consistent practice and continuous learning. As you become more familiar with these concepts, you'll find new ways to apply them in your daily work.`,
      `Industry experts recommend starting with the fundamentals before moving on to more advanced topics. This solid foundation will serve you well as you tackle more complex challenges.`,
      `Case studies from leading organizations demonstrate the effectiveness of these approaches. Companies that have adopted these practices report improved efficiency and better outcomes.`
    ];
    
    const conclusions = [
      `In conclusion, mastering these concepts will set you apart in your field. Start implementing what you've learned today and see the difference it makes.`,
      `We hope this guide has provided valuable insights. Remember, the journey of learning is ongoing, and each step forward brings new opportunities.`,
      `Thank you for reading. If you found this helpful, be sure to check out our other articles on related topics.`
    ];
    
    content += `<p class="text-lg text-gray-700 mb-6 leading-relaxed">${intros[Math.floor(Math.random() * intros.length)]}</p>`;
    
    content += `<h2 class="text-2xl font-bold mt-10 mb-4">Key Concepts</h2>`;
    for (let i = 0; i < Math.min(paragraphs - 2, middles.length); i++) {
      content += `<p class="text-gray-600 mb-4 leading-relaxed">${middles[i]}</p>`;
      if (i === 1) {
        content += `<h2 class="text-2xl font-bold mt-10 mb-4">Practical Applications</h2>`;
      }
    }
    
    content += `<h2 class="text-2xl font-bold mt-10 mb-4">Conclusion</h2>`;
    content += `<p class="text-gray-600 mb-4 leading-relaxed">${conclusions[Math.floor(Math.random() * conclusions.length)]}</p>`;
    
    return content;
  };
  
  // Create each article
  articles.forEach((article, index) => {
    const wordCount = getWordCount(article.readTime);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const templateHtml = `
      <article id="${article.articleId}" class="py-16 px-4" style="background: ${index % 2 === 0 ? '#fff' : '#f8fafc'};">
        <div class="container mx-auto max-w-3xl">
          <!-- Article Header -->
          <header class="mb-10">
            <a href="#blog" class="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4">
              <span>←</span> Back to all articles
            </a>
            <h1 class="text-4xl font-bold text-gray-900 mb-4">${article.title}</h1>
            ${article.description ? `<p class="text-xl text-gray-600 mb-6">${article.description}</p>` : ''}
            
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
              <span class="flex items-center gap-1">
                <span>📅</span> ${today}
              </span>
              <span class="flex items-center gap-1">
                <span>⏱️</span> ${article.readTime} min read
              </span>
              <span class="flex items-center gap-1">
                <span>📝</span> ~${wordCount.toLocaleString()} words
              </span>
            </div>
          </header>
          
          <!-- Article Content -->
          <div class="prose prose-lg max-w-none">
            ${generateContent(article.readTime, article.title)}
          </div>
          
          <!-- Article Footer -->
          <footer class="mt-12 pt-8 border-t border-gray-200">
            <div class="bg-purple-50 rounded-xl p-6" style="background: rgba(99, 102, 241, 0.1);">
              <h3 class="font-semibold text-gray-900 mb-2">💡 About This Article</h3>
              <p class="text-gray-600 text-sm mb-4">
                This is placeholder content generated by WB Page Builder. Replace this with your actual article content.
              </p>
              <div class="bg-gray-800 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <div class="text-green-400 mb-2">&lt;!-- To customize this article: --&gt;</div>
                <div>1. Edit the content directly in the builder</div>
                <div>2. Or create a Markdown file: <span class="text-yellow-300">docs/${article.articleId}.md</span></div>
                <div>3. Link it in your <span class="text-yellow-300">docs/index.json</span></div>
              </div>
            </div>
            
            <!-- Share & Navigation -->
            <div class="flex flex-wrap justify-between items-center mt-8 gap-4">
              <div class="flex gap-3">
                <span class="text-gray-500 text-sm">Share:</span>
                <a href="#" class="text-gray-400 hover:text-blue-500">🐦 Twitter</a>
                <a href="#" class="text-gray-400 hover:text-blue-600">🔗 LinkedIn</a>
                <a href="#" class="text-gray-400 hover:text-gray-600">📋 Copy link</a>
              </div>
              <a href="#blog" class="text-purple-600 hover:text-purple-700 font-medium">
                View all articles →
              </a>
            </div>
          </footer>
        </div>
      </article>
    `;
    
    if (window.addHTML) {
      console.log('[Templates] Adding article:', article.title);
      window.addHTML(html);
    }
  });
  
  if (window.toast) {
    window.toast(`Created ${articles.length} article${articles.length > 1 ? 's' : ''} from reading time cards`);
  }
}

function triggerOnboardingHint() {
  setTimeout(() => {
    if (window.updateFlowState) {
      window.updateFlowState();
    }
  }, 500);
}

function injectStyles() {
  if (document.getElementById('tbStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'tbStyles';
  style.textContent = `
    .template-browser {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      background: var(--bg-primary, #1a1a2e);
    }
    
    /* Compact toolbar */
    .tb-toolbar {
      display: flex;
      gap: 6px;
      padding: 8px;
      border-bottom: 1px solid var(--border-color, #333);
      align-items: center;
    }
    
    .tb-search {
      flex: 1;
    }
    
    .tb-search input {
      width: 100%;
      padding: 7px 10px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
    }
    
    .tb-search input:focus {
      outline: none;
      border-color: var(--primary, #6366f1);
    }
    
    .tb-filter {
      flex-shrink: 0;
    }
    
    .tb-select {
      padding: 7px 10px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      min-width: 100px;
    }
    
    .tb-select:focus {
      outline: none;
      border-color: var(--primary, #6366f1);
    }
    
    .tb-select option {
      background: var(--bg-secondary, #252542);
      color: #fff;
    }
    
    .tb-mode-btn {
      padding: 6px 10px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 6px;
      color: #888;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .tb-mode-btn:hover {
      border-color: var(--primary, #6366f1);
      color: #fff;
    }
    
    .tb-mode-btn.active {
      background: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      color: #fff;
    }
    
    /* Results area (grid mode) */
    .tb-results {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .tb-results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      background: var(--bg-secondary, #252542);
      border-bottom: 1px solid var(--border-color, #333);
    }
    
    .tb-results-label {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }
    
    .tb-results-count {
      font-size: 11px;
      color: #888;
      background: var(--bg-tertiary, #2a2a4a);
      padding: 2px 8px;
      border-radius: 10px;
    }
    
    /* Site mode */
    .tb-site-hint {
      padding: 8px 12px;
      font-size: 11px;
      color: #888;
      text-align: center;
      background: var(--bg-secondary, #252542);
      border-bottom: 1px solid var(--border-color, #333);
    }
    
    /* Filter hint when section is active */
    .tb-filter-hint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 12px;
      color: #fff;
      background: var(--primary, #6366f1);
      border-bottom: 1px solid var(--border-color, #333);
    }
    
    .tb-clear-filter {
      background: rgba(255,255,255,0.2);
      border: none;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.15s;
    }
    
    .tb-clear-filter:hover {
      background: rgba(255,255,255,0.3);
    }
    
    /* Filtered active section */
    .tb-site-section.filtered-active {
      border: 1px solid #22c55e;
      background: rgba(34, 197, 94, 0.05);
    }
    
    .tb-site-section.filtered-active .tb-section-header {
      background: #22c55e;
      color: white;
    }
    
    .tb-site-section.filtered-active .tb-section-count {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    
    .tb-site-section.filtered-active .tb-section-subtitle {
     color: rgba(255,255,255,0.9);
    }
    
    .tb-site-section.filtered-active .tb-section-count {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    
    .tb-site-section.filtered-active .tb-section-subtitle {
      color: rgba(255,255,255,0.7);
    }
    
    .tb-site-sections {
      flex: 1;
      overflow-y: auto;
    }
    
    .tb-site-section {
      border-bottom: 1px solid var(--border-color, #333);
    }
    
    .tb-section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 12px;
      background: var(--bg-secondary, #252542);
      border: none;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    
    .tb-section-header:hover {
      background: var(--bg-tertiary, #2a2a4a);
    }
    
    .tb-section-icon {
      font-size: 16px;
    }
    
    .tb-section-info {
      flex: 1;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .tb-section-title {
      font-size: 13px;
    }
    
    .tb-section-subtitle {
      font-size: 10px;
      color: #666;
      font-weight: 400;
    }
    
    .tb-section-count {
      font-size: 11px;
      color: #888;
      background: var(--bg-primary, #1a1a2e);
      padding: 2px 8px;
      border-radius: 10px;
    }
    
    .tb-section-arrow {
      font-size: 10px;
      color: #666;
      transition: transform 0.2s;
    }
    
    .tb-site-section.collapsed .tb-section-content {
      display: none;
    }
    
    .tb-section-content {
      padding: 8px;
      background: var(--bg-primary, #1a1a2e);
    }
    
    /* GRID */
    .tb-grid {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      padding: 8px;
      align-content: start;
    }
    
    .tb-grid-compact {
      padding: 0;
      overflow: visible;
    }
    
    /* Horizontal layout for header/footer */
    .tb-grid-horizontal {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      padding: 0;
      overflow-x: auto;
      overflow-y: hidden;
      gap: 6px;
    }
    
    .tb-grid-horizontal .tb-card-small {
      min-height: 50px;
      padding: 6px 4px;
    }
    
    .tb-grid-horizontal .tb-card-icon {
      font-size: 14px;
    }
    
    .tb-grid-horizontal .tb-card-name {
      font-size: 8px;
    }
    
    .tb-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 12px 8px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      min-height: 70px;
    }
    
    .tb-card:hover {
      border-color: var(--primary, #6366f1);
      background: var(--bg-tertiary, #2a2a4a);
      transform: translateY(-2px);
    }
    
    /* Remove ALL focus styling - prevent any persistent selection appearance */
    .tb-card:focus,
    .tb-card:focus-visible,
    .tb-section-header:focus,
    .tb-section-header:focus-visible,
    .tb-mode-btn:focus,
    .tb-mode-btn:focus-visible,
    .tb-clear-filter:focus,
    .tb-clear-filter:focus-visible,
    .tb-site-section:focus,
    .tb-site-section:focus-visible,
    .tb-site-section:focus-within {
      outline: none !important;
      box-shadow: none !important;
    }
    
    /* Ensure sections don't appear selected by default */
    .tb-site-section:not(.filtered-active) .tb-section-header {
      background: var(--bg-secondary, #252542);
    }
    
    .tb-card-small {
      padding: 8px 6px;
      min-height: 55px;
    }
    
    .tb-card-icon {
      font-size: 20px;
    }
    
    .tb-card-small .tb-card-icon {
      font-size: 16px;
    }
    
    .tb-card-name {
      font-size: 10px;
      color: #fff;
      text-align: center;
      line-height: 1.2;
      word-break: break-word;
    }
    
        .tb-card-small .tb-card-name {
      font-size: 9px;
    }
    
    /* Components already in canvas - grayed out */
    .tb-card.in-canvas {
      opacity: 0.4;
      border-color: #555;
      background: var(--bg-primary, #1a1a2e);
      cursor: not-allowed;
      position: relative;
    }
    
    .tb-card.in-canvas:hover {
      transform: none;
      border-color: #555;
      background: var(--bg-primary, #1a1a2e);
    }
    
    .tb-card.in-canvas::after {
      content: '✓ Added';
      position: absolute;
      bottom: 2px;
      right: 2px;
      font-size: 7px;
      color: #22c55e;
      background: rgba(0,0,0,0.6);
      padding: 1px 4px;
      border-radius: 3px;
    }
    
    .tb-empty, .tb-empty-small {
      grid-column: 1 / -1;
      padding: 24px;
      text-align: center;
      color: #666;
    }
    
    .tb-empty-small {
      padding: 16px;
      font-size: 11px;
    }
    
    /* Sections row - empty containers */
    .tb-sections-row {
      margin-bottom: 8px;
      border: 1px solid var(--border-color, #333);
      border-radius: 6px;
      background: var(--bg-tertiary, #2a2a4a);
    }
    
    .tb-sections-header {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 10px;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    
    .tb-sections-header:hover {
      background: rgba(255,255,255,0.05);
    }
    
    .tb-sections-header:focus {
      outline: none;
    }
    
    .tb-sections-row.collapsed .tb-sections-content {
      display: none;
    }
    
    .tb-sections-content {
      padding: 8px;
      border-top: 1px solid var(--border-color, #333);
    }
    
    .tb-sections-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    
    .tb-section-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 8px 4px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .tb-section-btn:hover {
      border-color: #22c55e;
      background: var(--bg-primary, #1a1a2e);
      transform: translateY(-1px);
    }
    
    .tb-section-btn:focus {
      outline: none;
    }
    
    .tb-section-btn-icon {
      font-size: 16px;
    }
    
    .tb-section-btn-name {
      font-size: 8px;
      color: #aaa;
      text-align: center;
      line-height: 1.1;
    }
    
    /* Scrollbar */
    .tb-grid::-webkit-scrollbar,
    .tb-site-sections::-webkit-scrollbar {
      width: 10px;
    }
    
    .tb-grid::-webkit-scrollbar-track,
    .tb-site-sections::-webkit-scrollbar-track {
      background: #1a1a2e;
    }
    
    .tb-grid::-webkit-scrollbar-thumb,
    .tb-site-sections::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 5px;
      border: 2px solid #1a1a2e;
    }
    
    .tb-grid::-webkit-scrollbar-thumb:hover,
    .tb-site-sections::-webkit-scrollbar-thumb:hover {
      background: var(--primary, #6366f1);
    }
  `;
  
  document.head.appendChild(style);
}

// Public API to set view mode
export function setViewMode(mode) {
  if (mode === 'site' || mode === 'grid') {
    viewMode = mode;
    render();
  }
}

export async function refreshTemplates() {
  await loadTemplates();
  render();
}

export function getTemplates() { return templates; }
export function getCategories() { return categories; }

export default {
  init: initTemplateBrowser,
  refresh: refreshTemplates,
  setViewMode,
  getTemplates,
  getCategories
};
