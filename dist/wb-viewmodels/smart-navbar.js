/**
 * Smart Navbar Behavior
 * =============================================================================
 * Implements intelligent navigation bar behaviors based on config/navbar.json
 *
 * Smart Behaviors:
 * - Hide on scroll down, show on scroll up
 * - Shrink on scroll (reduce height)
 * - Background change on scroll (glassmorphism)
 * - Active page highlighting (multiple styles)
 * - Scroll progress indicator
 * - Mobile responsive menu
 * - Right-click context menu to add nav items/pages
 * =============================================================================
 */
// Default config (used if navbar.json not loaded)
const DEFAULT_CONFIG = {
    smartBehaviors: {
        sticky: { enabled: true, offset: 0, zIndex: 1000 },
        hideOnScroll: { enabled: false, threshold: 100, showOnScrollUp: true, animationDuration: '0.3s' },
        shrinkOnScroll: { enabled: true, scrollThreshold: 50, normalHeight: '60px', shrunkHeight: '48px', animationDuration: '0.3s' },
        backgroundOnScroll: { enabled: true, scrollThreshold: 50, initialBackground: 'transparent', scrolledBackground: 'var(--bg-primary)', initialBlur: '0px', scrolledBlur: '20px', addShadow: true },
        activePageHighlight: { enabled: true, style: 'underline', color: 'var(--primary)', matchBy: ['href', 'pageId', 'label'], animateTransition: true },
        progressIndicator: { enabled: false, position: 'bottom', height: '3px', color: 'var(--primary)', showOnScroll: true }
    },
    mobile: { breakpoint: '768px', menuType: 'drawer', hamburgerIcon: '☰', closeIcon: '✕', animationDuration: '0.3s', overlay: true, overlayOpacity: 0.5 },
    themeSwitcher: { enabled: true, position: 'right', icons: { light: '☀️', dark: '🌙', auto: '💻' }, showLabel: false }
};
let navbarConfig = null;
let ticking = false;
/**
 * Load navbar configuration from config/navbar.json
 */
async function loadConfig() {
    if (navbarConfig)
        return navbarConfig;
    try {
        const res = await fetch('/config/navbar.json');
        if (res.ok) {
            navbarConfig = await res.json();
            console.log('[SmartNavbar] Config loaded:', navbarConfig);
        }
        else {
            navbarConfig = DEFAULT_CONFIG;
        }
    }
    catch (e) {
        console.warn('[SmartNavbar] Using default config:', e.message);
        navbarConfig = DEFAULT_CONFIG;
    }
    return navbarConfig;
}
/**
 * Show the Add Nav Item dialog
 */
function showAddNavItemDialog(navbar, clickX, clickY) {
    // Remove existing dialog
    document.getElementById('navItemDialog')?.remove();
    const dialog = document.createElement('div');
    dialog.id = 'navItemDialog';
    dialog.innerHTML = `
    <div class="nav-dialog-overlay" onclick="if(event.target===this)this.parentElement.remove()">
      <div class="nav-dialog-content">
        <div class="nav-dialog-header">
          <h3>➕ Add Navigation Item</h3>
          <button class="nav-dialog-close" onclick="this.closest('#navItemDialog').remove()">✕</button>
        </div>
        <div class="nav-dialog-body">
          <div class="nav-dialog-field">
            <label for="navItemName">Page Name</label>
            <input type="text" id="navItemName" placeholder="e.g., Services, Portfolio, Blog..." autofocus>
            <small>This will create a new page and add it to the navigation</small>
          </div>
          
          <div class="nav-dialog-field">
            <label>Page Options</label>
            <div class="nav-dialog-checkboxes">
              <label class="nav-dialog-checkbox">
                <input type="checkbox" id="navItemShowHeader" checked>
                <span>🔝 Include Header</span>
              </label>
              <label class="nav-dialog-checkbox">
                <input type="checkbox" id="navItemShowFooter" checked>
                <span>🔻 Include Footer</span>
              </label>
            </div>
          </div>
          
          <div class="nav-dialog-field">
            <label>Page Template</label>
            <div class="nav-dialog-templates">
              <label class="nav-dialog-template selected">
                <input type="radio" name="navItemTemplate" value="blank" checked>
                <span>📋 Blank</span>
              </label>
              <label class="nav-dialog-template">
                <input type="radio" name="navItemTemplate" value="services">
                <span>⚙️ Services</span>
              </label>
              <label class="nav-dialog-template">
                <input type="radio" name="navItemTemplate" value="contact">
                <span>📞 Contact</span>
              </label>
              <label class="nav-dialog-template">
                <input type="radio" name="navItemTemplate" value="about">
                <span>ℹ️ About</span>
              </label>
              <label class="nav-dialog-template">
                <input type="radio" name="navItemTemplate" value="portfolio">
                <span>🖼️ Portfolio</span>
              </label>
              <label class="nav-dialog-template">
                <input type="radio" name="navItemTemplate" value="faq">
                <span>❓ FAQ</span>
              </label>
            </div>
          </div>
        </div>
        <div class="nav-dialog-footer">
          <button class="nav-dialog-btn nav-dialog-btn--secondary" onclick="this.closest('#navItemDialog').remove()">Cancel</button>
          <button class="nav-dialog-btn nav-dialog-btn--primary" id="navItemCreate">Create Page</button>
        </div>
      </div>
    </div>
  `;
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
    .nav-dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: navFadeIn 0.2s ease;
    }
    @keyframes navFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .nav-dialog-content {
      background: var(--bg-secondary, #1f2937);
      border: 1px solid var(--border-color, #374151);
      border-radius: 12px;
      width: 450px;
      max-width: 90vw;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: navSlideUp 0.2s ease;
    }
    @keyframes navSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .nav-dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color, #374151);
    }
    .nav-dialog-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-primary, #fff);
    }
    .nav-dialog-close {
      background: none;
      border: none;
      color: var(--text-muted, #9ca3af);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.15s;
    }
    .nav-dialog-close:hover {
      background: var(--bg-tertiary, #374151);
      color: var(--text-primary, #fff);
    }
    .nav-dialog-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .nav-dialog-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .nav-dialog-field label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary, #d1d5db);
    }
    .nav-dialog-field input[type="text"] {
      padding: 0.75rem 1rem;
      background: var(--bg-tertiary, #374151);
      border: 1px solid var(--border-color, #4b5563);
      border-radius: 8px;
      color: var(--text-primary, #fff);
      font-size: 1rem;
      transition: all 0.15s;
    }
    .nav-dialog-field input[type="text"]:focus {
      outline: none;
      border-color: var(--primary, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    .nav-dialog-field small {
      font-size: 0.75rem;
      color: var(--text-muted, #9ca3af);
    }
    .nav-dialog-checkboxes {
      display: flex;
      gap: 1rem;
    }
    .nav-dialog-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-tertiary, #374151);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      color: var(--text-primary, #fff);
    }
    .nav-dialog-checkbox input {
      accent-color: var(--primary, #6366f1);
      width: 16px;
      height: 16px;
    }
    .nav-dialog-templates {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .nav-dialog-template {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.6rem;
      background: var(--bg-tertiary, #374151);
      border: 2px solid var(--border-color, #4b5563);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--text-primary, #fff);
      transition: all 0.15s;
    }
    .nav-dialog-template:hover {
      border-color: var(--primary, #6366f1);
    }
    .nav-dialog-template.selected {
      border-color: var(--primary, #6366f1);
      background: rgba(99, 102, 241, 0.1);
    }
    .nav-dialog-template input {
      display: none;
    }
    .nav-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color, #374151);
    }
    .nav-dialog-btn {
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .nav-dialog-btn--secondary {
      background: var(--bg-tertiary, #374151);
      border: 1px solid var(--border-color, #4b5563);
      color: var(--text-primary, #fff);
    }
    .nav-dialog-btn--secondary:hover {
      background: var(--bg-color, #111827);
    }
    .nav-dialog-btn--primary {
      background: var(--primary, #6366f1);
      border: 1px solid var(--primary, #6366f1);
      color: white;
    }
    .nav-dialog-btn--primary:hover {
      background: var(--primary-dark, #4f46e5);
      transform: translateY(-1px);
    }
  `;
    dialog.appendChild(style);
    document.body.appendChild(dialog);
    // Focus the input
    const nameInput = document.getElementById('navItemName');
    nameInput.focus();
    // Template selection
    dialog.querySelectorAll('.nav-dialog-template').forEach(tpl => {
        tpl.addEventListener('click', () => {
            dialog.querySelectorAll('.nav-dialog-template').forEach(t => t.classList.remove('selected'));
            tpl.classList.add('selected');
            tpl.querySelector('input').checked = true;
        });
    });
    // Enter key to create
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('navItemCreate').click();
        }
        if (e.key === 'Escape') {
            dialog.remove();
        }
    });
    // Create button
    document.getElementById('navItemCreate').addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.style.borderColor = 'var(--danger-color, #ef4444)';
            nameInput.focus();
            return;
        }
        const template = dialog.querySelector('input[name="navItemTemplate"]:checked')?.value || 'blank';
        const showHeader = document.getElementById('navItemShowHeader').checked;
        const showFooter = document.getElementById('navItemShowFooter').checked;
        // Create the page
        createNavPage(navbar, name, template, showHeader, showFooter);
        dialog.remove();
    });
}
/**
 * Create a new navigation page
 */
function createNavPage(navbar, name, template, showHeader, showFooter) {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slug = id + '.html';
    const href = `?page=${id}`;
    // Check if window.pages exists (builder mode)
    if (window.pages) {
        // Check if page already exists
        if (window.pages.find(p => p.id === id)) {
            window.toast?.(`Page "${name}" already exists`, 'warning');
            return;
        }
        // Create page object
        const newPage = {
            id,
            name,
            slug,
            main: [],
            showHeader,
            showFooter
        };
        // Add to pages array
        window.pages.push(newPage);
        // Update navbar links if function exists
        if (window.updateNavbarLinks) {
            window.updateNavbarLinks();
        }
        // Update pages list if function exists  
        if (window.renderPagesList) {
            window.renderPagesList();
        }
        // Switch to the new page
        if (window.switchToPage) {
            window.switchToPage(id);
        }
        window.toast?.(`Page "${name}" created!`, 'success');
    }
    else {
        // SPA mode - just add link to navbar
        addNavLink(navbar, name, href);
        window.toast?.(`Nav item "${name}" added!`, 'success');
    }
    // Dispatch event for other components to listen
    document.dispatchEvent(new CustomEvent('wb:page:created', {
        detail: { id, name, slug, template, showHeader, showFooter }
    }));
}
/**
 * Add a link to the navbar
 */
function addNavLink(navbar, label, href) {
    // Find the nav links container
    const menu = navbar.querySelector('.wb-navbar__menu') || navbar.querySelector('div:not(.wb-navbar__brand)');
    if (menu) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        link.className = 'wb-navbar__item';
        link.style.cssText = `
      opacity: 0.8;
      text-decoration: none;
      color: inherit;
      transition: opacity 0.15s ease;
      white-space: nowrap;
    `;
        link.addEventListener('mouseenter', () => link.style.opacity = '1');
        link.addEventListener('mouseleave', () => {
            if (!link.classList.contains('active')) {
                link.style.opacity = '0.8';
            }
        });
        menu.appendChild(link);
    }
}
/**
 * Show navbar context menu
 */
function showNavbarContextMenu(navbar, x, y, targetLink = null) {
    // Remove existing menu
    document.getElementById('navbarContextMenu')?.remove();
    const menu = document.createElement('div');
    menu.id = 'navbarContextMenu';
    menu.innerHTML = `
    <div class="nav-ctx-menu">
      <button class="nav-ctx-item" data-action="add">
        <span class="nav-ctx-icon">➕</span>
        <span>Add Nav Item</span>
      </button>
      ${targetLink ? `
        <button class="nav-ctx-item" data-action="edit">
          <span class="nav-ctx-icon">✏️</span>
          <span>Edit Link</span>
        </button>
        <button class="nav-ctx-item" data-action="remove">
          <span class="nav-ctx-icon">🗑️</span>
          <span>Remove Link</span>
        </button>
        <hr class="nav-ctx-divider">
      ` : ''}
      <button class="nav-ctx-item" data-action="settings">
        <span class="nav-ctx-icon">⚙️</span>
        <span>Navbar Settings</span>
      </button>
      <button class="nav-ctx-item" data-action="style">
        <span class="nav-ctx-icon">🎨</span>
        <span>Active Style</span>
        <span class="nav-ctx-arrow">▶</span>
      </button>
    </div>
  `;
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
    .nav-ctx-menu {
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: var(--bg-secondary, #1f2937);
      border: 1px solid var(--border-color, #374151);
      border-radius: 8px;
      padding: 0.4rem;
      min-width: 180px;
      z-index: 10000;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      animation: ctxFadeIn 0.15s ease;
    }
    @keyframes ctxFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .nav-ctx-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: none;
      border: none;
      color: var(--text-primary, #fff);
      font-size: 0.875rem;
      text-align: left;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.1s;
    }
    .nav-ctx-item:hover {
      background: var(--bg-tertiary, #374151);
    }
    .nav-ctx-icon {
      font-size: 1rem;
      width: 1.25rem;
      text-align: center;
    }
    .nav-ctx-arrow {
      margin-left: auto;
      font-size: 0.7rem;
      opacity: 0.5;
    }
    .nav-ctx-divider {
      border: none;
      border-top: 1px solid var(--border-color, #374151);
      margin: 0.25rem 0;
    }
  `;
    menu.appendChild(style);
    document.body.appendChild(menu);
    // Adjust position if off-screen
    const rect = menu.querySelector('.nav-ctx-menu').getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.querySelector('.nav-ctx-menu').style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.querySelector('.nav-ctx-menu').style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
    // Handle menu actions
    menu.querySelectorAll('.nav-ctx-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            menu.remove();
            switch (action) {
                case 'add':
                    showAddNavItemDialog(navbar, x, y);
                    break;
                case 'edit':
                    if (targetLink)
                        showEditLinkDialog(navbar, targetLink);
                    break;
                case 'remove':
                    if (targetLink)
                        removeNavLink(navbar, targetLink);
                    break;
                case 'settings':
                    showNavbarSettingsDialog(navbar);
                    break;
                case 'style':
                    showActiveStyleSubmenu(navbar, x + rect.width - 10, y);
                    break;
            }
        });
    });
    // Close on click outside
    setTimeout(() => {
        const close = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', close);
            }
        };
        document.addEventListener('click', close);
    }, 0);
}
/**
 * Show active style submenu
 */
function showActiveStyleSubmenu(navbar, x, y) {
    // Remove existing
    document.getElementById('navbarStyleMenu')?.remove();
    const styles = [
        { id: 'none', label: 'None', icon: '⚫' },
        { id: 'color', label: 'Color Only', icon: '🔵' },
        { id: 'underline', label: 'Underline', icon: '➖' },
        { id: 'pill', label: 'Pill', icon: '💊' },
        { id: 'arrow', label: 'Arrow', icon: '▼' },
        { id: 'dot', label: 'Dot', icon: '⚪' },
        { id: 'glow', label: 'Glow', icon: '✨' }
    ];
    const currentStyle = navbar.dataset.activeStyle || 'underline';
    const menu = document.createElement('div');
    menu.id = 'navbarStyleMenu';
    menu.innerHTML = `
    <div class="nav-ctx-menu" style="left: ${x}px; top: ${y}px;">
      ${styles.map(s => `
        <button class="nav-ctx-item ${s.id === currentStyle ? 'nav-ctx-item--active' : ''}" data-style="${s.id}">
          <span class="nav-ctx-icon">${s.icon}</span>
          <span>${s.label}</span>
          ${s.id === currentStyle ? '<span style="margin-left:auto;">✓</span>' : ''}
        </button>
      `).join('')}
    </div>
    <style>
      .nav-ctx-item--active { background: rgba(99, 102, 241, 0.15) !important; }
    </style>
  `;
    document.body.appendChild(menu);
    menu.querySelectorAll('.nav-ctx-item').forEach(item => {
        item.addEventListener('click', () => {
            const style = item.dataset.style;
            setActiveStyle(navbar, style);
            menu.remove();
        });
    });
    setTimeout(() => {
        const close = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', close);
            }
        };
        document.addEventListener('click', close);
    }, 0);
}
/**
 * Set active link style
 */
function setActiveStyle(navbar, style) {
    navbar.dataset.activeStyle = style;
    // Remove existing style classes
    navbar.classList.remove('wb-navbar--active-none', 'wb-navbar--active-color', 'wb-navbar--active-underline', 'wb-navbar--active-pill', 'wb-navbar--active-arrow', 'wb-navbar--active-dot', 'wb-navbar--active-glow');
    navbar.classList.add(`wb-navbar--active-${style}`);
    // Save preference
    localStorage.setItem('wb-navbar-active-style', style);
    window.toast?.(`Active style: ${style}`, 'info');
}
/**
 * Remove a nav link
 */
function removeNavLink(navbar, link) {
    if (confirm(`Remove "${link.textContent}" from navigation?`)) {
        link.remove();
        window.toast?.('Link removed', 'info');
    }
}
/**
 * Show edit link dialog
 */
function showEditLinkDialog(navbar, link) {
    document.getElementById('editLinkDialog')?.remove();
    const dialog = document.createElement('div');
    dialog.id = 'editLinkDialog';
    dialog.innerHTML = `
    <div class="nav-dialog-overlay" onclick="if(event.target===this)this.parentElement.remove()">
      <div class="nav-dialog-content" style="width: 350px;">
        <div class="nav-dialog-header">
          <h3>✏️ Edit Link</h3>
          <button class="nav-dialog-close" onclick="this.closest('#editLinkDialog').remove()">✕</button>
        </div>
        <div class="nav-dialog-body">
          <div class="nav-dialog-field">
            <label>Label</label>
            <input type="text" id="editLinkLabel" value="${link.textContent}">
          </div>
          <div class="nav-dialog-field">
            <label>URL / Page</label>
            <input type="text" id="editLinkHref" value="${link.getAttribute('href') || '#'}">
          </div>
        </div>
        <div class="nav-dialog-footer">
          <button class="nav-dialog-btn nav-dialog-btn--secondary" onclick="this.closest('#editLinkDialog').remove()">Cancel</button>
          <button class="nav-dialog-btn nav-dialog-btn--primary" id="editLinkSave">Save</button>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(dialog);
    document.getElementById('editLinkLabel').focus();
    document.getElementById('editLinkSave').addEventListener('click', () => {
        link.textContent = document.getElementById('editLinkLabel').value;
        link.href = document.getElementById('editLinkHref').value;
        dialog.remove();
        window.toast?.('Link updated', 'success');
    });
}
/**
 * Show navbar settings dialog
 */
function showNavbarSettingsDialog(navbar) {
    window.toast?.('Settings dialog coming soon!', 'info');
}
/**
 * Smart Navbar Behavior
 */
export async function smartNavbar(element, options = {}) {
    const config = await loadConfig();
    const behaviors = { ...DEFAULT_CONFIG.smartBehaviors, ...config.smartBehaviors, ...options };
    // Add base class
    element.classList.add('wb-navbar', 'wb-navbar--smart');
    // Load saved active style
    const savedStyle = localStorage.getItem('wb-navbar-active-style');
    if (savedStyle) {
        element.dataset.activeStyle = savedStyle;
        element.classList.add(`wb-navbar--active-${savedStyle}`);
    }
    // Store state
    const state = {
        isHidden: false,
        isShrunk: false,
        isScrolled: false,
        lastScrollY: 0
    };
    // =========================================================================
    // RIGHT-CLICK CONTEXT MENU
    // =========================================================================
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // Check if right-clicked on a link
        const targetLink = e.target.closest('a:not(.wb-navbar__brand)');
        showNavbarContextMenu(element, e.clientX, e.clientY, targetLink);
    });
    // =========================================================================
    // STICKY BEHAVIOR
    // =========================================================================
    if (behaviors.sticky?.enabled) {
        element.style.position = 'sticky';
        element.style.top = `${behaviors.sticky.offset || 0}px`;
        element.style.zIndex = behaviors.sticky.zIndex || 1000;
    }
    // =========================================================================
    // HIDE ON SCROLL
    // =========================================================================
    const handleHideOnScroll = () => {
        if (!behaviors.hideOnScroll?.enabled)
            return;
        const scrollY = window.scrollY;
        const threshold = behaviors.hideOnScroll.threshold || 100;
        const duration = behaviors.hideOnScroll.animationDuration || '0.3s';
        element.style.transition = `transform ${duration} ease`;
        if (scrollY > state.lastScrollY && scrollY > threshold) {
            // Scrolling DOWN - hide
            if (!state.isHidden) {
                element.style.transform = 'translateY(-100%)';
                element.classList.add('wb-navbar--hidden');
                state.isHidden = true;
            }
        }
        else if (behaviors.hideOnScroll.showOnScrollUp) {
            // Scrolling UP - show
            if (state.isHidden) {
                element.style.transform = 'translateY(0)';
                element.classList.remove('wb-navbar--hidden');
                state.isHidden = false;
            }
        }
        state.lastScrollY = scrollY;
    };
    // =========================================================================
    // SHRINK ON SCROLL
    // =========================================================================
    const handleShrinkOnScroll = () => {
        if (!behaviors.shrinkOnScroll?.enabled)
            return;
        const scrollY = window.scrollY;
        const threshold = behaviors.shrinkOnScroll.scrollThreshold || 50;
        const normalHeight = behaviors.shrinkOnScroll.normalHeight || '60px';
        const shrunkHeight = behaviors.shrinkOnScroll.shrunkHeight || '48px';
        const duration = behaviors.shrinkOnScroll.animationDuration || '0.3s';
        element.style.transition = `height ${duration} ease, padding ${duration} ease`;
        if (scrollY > threshold && !state.isShrunk) {
            element.style.height = shrunkHeight;
            element.classList.add('wb-navbar--shrunk', 'scrolled');
            state.isShrunk = true;
        }
        else if (scrollY <= threshold && state.isShrunk) {
            element.style.height = normalHeight;
            element.classList.remove('wb-navbar--shrunk', 'scrolled');
            state.isShrunk = false;
        }
    };
    // =========================================================================
    // BACKGROUND ON SCROLL (Glassmorphism)
    // =========================================================================
    const handleBackgroundOnScroll = () => {
        if (!behaviors.backgroundOnScroll?.enabled)
            return;
        const scrollY = window.scrollY;
        const threshold = behaviors.backgroundOnScroll.scrollThreshold || 50;
        element.style.transition = `background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease`;
        if (scrollY > threshold && !state.isScrolled) {
            element.style.background = behaviors.backgroundOnScroll.scrolledBackground || 'var(--bg-primary)';
            element.style.backdropFilter = `blur(${behaviors.backgroundOnScroll.scrolledBlur || '20px'})`;
            element.style.webkitBackdropFilter = `blur(${behaviors.backgroundOnScroll.scrolledBlur || '20px'})`;
            if (behaviors.backgroundOnScroll.addShadow) {
                element.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }
            element.classList.add('wb-navbar--scrolled');
            state.isScrolled = true;
        }
        else if (scrollY <= threshold && state.isScrolled) {
            element.style.background = behaviors.backgroundOnScroll.initialBackground || 'transparent';
            element.style.backdropFilter = `blur(${behaviors.backgroundOnScroll.initialBlur || '0px'})`;
            element.style.webkitBackdropFilter = `blur(${behaviors.backgroundOnScroll.initialBlur || '0px'})`;
            element.style.boxShadow = 'none';
            element.classList.remove('wb-navbar--scrolled');
            state.isScrolled = false;
        }
    };
    // =========================================================================
    // ACTIVE PAGE HIGHLIGHT
    // =========================================================================
    const updateActiveHighlight = () => {
        if (!behaviors.activePageHighlight?.enabled)
            return;
        const style = element.dataset.activeStyle || behaviors.activePageHighlight.style || 'underline';
        const color = behaviors.activePageHighlight.color || 'var(--primary)';
        // Remove existing active classes from links
        element.querySelectorAll('a').forEach(link => {
            link.classList.remove('active', 'wb-navbar__item--active');
            link.removeAttribute('aria-current');
        });
        // Apply style class to navbar (if not already set)
        if (!element.classList.contains(`wb-navbar--active-${style}`)) {
            element.classList.remove('wb-navbar--active-none', 'wb-navbar--active-color', 'wb-navbar--active-underline', 'wb-navbar--active-pill', 'wb-navbar--active-arrow', 'wb-navbar--active-dot', 'wb-navbar--active-glow');
            element.classList.add(`wb-navbar--active-${style}`);
        }
        element.style.setProperty('--wb-navbar-active-color', color);
        // Find and mark active link
        const currentPage = window.currentPage;
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        element.querySelectorAll('a:not(.wb-navbar__brand)').forEach(link => {
            const href = link.getAttribute('href') || '';
            const label = link.textContent?.trim().toLowerCase() || '';
            let isActive = false;
            // Match by href
            if (behaviors.activePageHighlight.matchBy?.includes('href')) {
                if (href === currentPath || href === currentHash || href === `#${currentPage?.id}`) {
                    isActive = true;
                }
                // Match page query param
                const hrefPage = new URLSearchParams(href.split('?')[1] || '').get('page');
                const currentPageParam = new URLSearchParams(window.location.search).get('page');
                if (hrefPage && hrefPage === currentPageParam) {
                    isActive = true;
                }
            }
            // Match by pageId
            if (behaviors.activePageHighlight.matchBy?.includes('pageId') && currentPage?.id) {
                if (href.includes(currentPage.id) || href === `#${currentPage.id}`) {
                    isActive = true;
                }
            }
            // Match by label
            if (behaviors.activePageHighlight.matchBy?.includes('label') && currentPage?.name) {
                if (label === currentPage.name.toLowerCase()) {
                    isActive = true;
                }
            }
            if (isActive) {
                link.classList.add('active', 'wb-navbar__item--active');
                link.setAttribute('aria-current', 'page');
            }
        });
    };
    // =========================================================================
    // SCROLL PROGRESS INDICATOR
    // =========================================================================
    let progressBar = null;
    const setupProgressIndicator = () => {
        if (!behaviors.progressIndicator?.enabled)
            return;
        progressBar = document.createElement('div');
        progressBar.className = 'wb-navbar__progress';
        progressBar.style.cssText = `
      position: absolute;
      ${behaviors.progressIndicator.position || 'bottom'}: 0;
      left: 0;
      width: 0%;
      height: ${behaviors.progressIndicator.height || '3px'};
      background: ${behaviors.progressIndicator.color || 'var(--primary)'};
      transition: width 0.1s linear;
      z-index: 1001;
    `;
        element.appendChild(progressBar);
    };
    const updateProgressIndicator = () => {
        if (!progressBar || !behaviors.progressIndicator?.enabled)
            return;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = (window.scrollY / scrollHeight) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, scrollProgress))}%`;
    };
    // =========================================================================
    // MOBILE MENU
    // =========================================================================
    const setupMobileMenu = () => {
        const mobileConfig = config.mobile || DEFAULT_CONFIG.mobile;
        const breakpoint = parseInt(mobileConfig.breakpoint) || 768;
        const checkMobile = () => {
            if (window.innerWidth <= breakpoint) {
                element.classList.add('wb-navbar--mobile');
                ensureMobileToggle();
            }
            else {
                element.classList.remove('wb-navbar--mobile', 'wb-navbar--menu-open');
                removeMobileToggle();
            }
        };
        const ensureMobileToggle = () => {
            if (element.querySelector('.wb-navbar__toggle'))
                return;
            const toggle = document.createElement('button');
            toggle.className = 'wb-navbar__toggle';
            toggle.innerHTML = mobileConfig.hamburgerIcon || '☰';
            toggle.setAttribute('aria-label', 'Toggle menu');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.addEventListener('click', () => {
                const isOpen = element.classList.toggle('wb-navbar--menu-open');
                toggle.innerHTML = isOpen ? (mobileConfig.closeIcon || '✕') : (mobileConfig.hamburgerIcon || '☰');
                toggle.setAttribute('aria-expanded', isOpen);
            });
            element.appendChild(toggle);
        };
        const removeMobileToggle = () => {
            element.querySelector('.wb-navbar__toggle')?.remove();
        };
        window.addEventListener('resize', checkMobile);
        checkMobile();
    };
    // =========================================================================
    // SCROLL HANDLER (throttled)
    // =========================================================================
    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleHideOnScroll();
                handleShrinkOnScroll();
                handleBackgroundOnScroll();
                updateProgressIndicator();
                ticking = false;
            });
            ticking = true;
        }
    };
    // =========================================================================
    // INITIALIZE
    // =========================================================================
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', updateActiveHighlight);
    window.addEventListener('popstate', updateActiveHighlight);
    // Listen for page changes (SPA navigation)
    document.addEventListener('wb:page:changed', updateActiveHighlight);
    setupProgressIndicator();
    setupMobileMenu();
    updateActiveHighlight();
    // Initial scroll state check
    onScroll();
    // API
    element.wbSmartNavbar = {
        getConfig: () => config,
        updateConfig: async (newConfig) => {
            Object.assign(config, newConfig);
            updateActiveHighlight();
        },
        setActiveStyle: (style) => setActiveStyle(element, style),
        addNavItem: (name, template = 'blank') => {
            createNavPage(element, name, template, true, true);
        },
        show: () => {
            element.style.transform = 'translateY(0)';
            element.classList.remove('wb-navbar--hidden');
            state.isHidden = false;
        },
        hide: () => {
            element.style.transform = 'translateY(-100%)';
            element.classList.add('wb-navbar--hidden');
            state.isHidden = true;
        },
        toggleMobileMenu: () => {
            element.classList.toggle('wb-navbar--menu-open');
        }
    };
    element.dataset.wbReady = 'smart-navbar';
    // Cleanup
    return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('hashchange', updateActiveHighlight);
        window.removeEventListener('popstate', updateActiveHighlight);
        document.removeEventListener('wb:page:changed', updateActiveHighlight);
        element.classList.remove('wb-navbar', 'wb-navbar--smart');
        if (progressBar)
            progressBar.remove();
    };
}
export default smartNavbar;
//# sourceMappingURL=smart-navbar.js.map