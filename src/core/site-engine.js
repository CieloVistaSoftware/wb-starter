// Site Engine Module
// Contains WBSite class and site logic
import WB from './wb-lazy.js';

export default class WBSite {
  constructor() {
    this.config = null;
    this.currentPage = 'home';
    this.navCollapsed = false;
  }

  async init() {
    const app = document.getElementById('app');
    const loadingEl = app.querySelector('.site__loading');
    let loadingTimerId;
    if (loadingEl && window.WBLoadingManager) {
      loadingTimerId = window.WBLoadingManager.startMonitoring(loadingEl, 'Site initialization');
    }
    try {
      const res = await fetch('config/site.json');
      this.config = await res.json();
      document.documentElement.dataset.theme = this.config.site.theme;
      document.title = this.config.seo?.title || this.config.site.name;
      
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      if (pageParam && this.config.nav.find(n => n.id === pageParam)) {
        this.currentPage = pageParam;
      }

      this.render();
      this.initResizableNav();
      WB.init({ 
        debug: false,
        autoInject: this.config.site.autoInject || false
      });

      window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') || 'home';
        this.navigateTo(page);
      });

      // Intercept clicks for SPA navigation
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
          const href = link.getAttribute('href');
          if (href && href.startsWith('?page=')) {
            e.preventDefault();
            const page = new URLSearchParams(href).get('page');
            history.pushState(null, '', href);
            this.navigateTo(page);
          }
        }
      });

      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      console.log('✅ WB Site initialized:', this.config.site.name);
    } catch (error) {
      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      if (loadingEl && window.WBLoadingManager) {
        window.WBLoadingManager.showError(loadingEl, 'Site initialization failed');
      }
      throw error;
    }
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      ${this.renderHeader()}
      <div class="site__body" id="siteBody">
        ${this.renderNav()}
        <main class="site__main" id="main">
          ${this.renderPage(this.currentPage)}
        </main>
      </div>
      ${this.renderFooter()}
    `;
    const toggleBtn = app.querySelector('.nav__toggle');
    if (toggleBtn) {
      toggleBtn.onclick = () => this.toggleNav();
    }
    const notesToggleBtn = app.querySelector('#notesToggle');
    if (notesToggleBtn) {
      notesToggleBtn.onclick = () => {
        if (window.showNotesModal) {
          window.showNotesModal();
        } else {
          const notesEl = document.querySelector('[data-wb="notes"]');
          if (notesEl && notesEl.wbNotes) {
            notesEl.wbNotes.toggle();
          }
        }
      };
    }
    this.updateActiveNav();

    // === Runtime check for duplicate theme switchers ===
    const themeSwitchers = document.querySelectorAll('[data-wb="themecontrol"]');
    if (themeSwitchers.length > 1) {
      console.warn(`⚠️ Found ${themeSwitchers.length} theme switchers on the page!`);
      themeSwitchers.forEach((el, i) => {
        console.warn(`Theme switcher #${i+1}:`, el, 'Parent:', el.parentElement);
      });
    }
  }

  renderHeader() {
    const { site, header } = this.config;
    return `
      <header class="site__header ${header.sticky ? 'site__header--sticky' : ''}" id="siteHeader">
        <div class="header__left" id="headerLeft">
          <button class="nav__toggle" data-wb="ripple" title="Toggle Navigation" id="navToggle">☰</button>
          <a href="?page=home" class="header__logo" id="headerLogo">
            <span class="header__logo-icon" id="headerLogoIcon">${site.logo}</span>
            <span class="header__logo-text" id="headerLogoText">${site.name}</span>
          </a>
        </div>
        <div class="header__right" id="headerRight">
          <button class="header__notes-btn" id="notesToggle" data-wb="ripple" title="Toggle Notes">📝</button>
          ${header.showThemeSwitcher ? '<div data-wb="themecontrol" data-show-label="false" id="themeControl"></div>' : ''}
        </div>
      </header>
    `;
  }

  renderNav() {
    const { nav, layout } = this.config;
    const items = nav.map(item => `
      <a href="?page=${item.id}" class="nav__item" data-page="${item.id}" data-wb="ripple" id="navItem-${item.id}">
        <span class="nav__icon" id="navIcon-${item.id}">${item.icon || ''}</span>
        <span class="nav__label" id="navLabel-${item.id}">${item.label}</span>
      </a>
    `).join('');
    return `
      <nav class="site__nav ${this.navCollapsed ? 'site__nav--collapsed' : ''}" style="--nav-width: ${layout.navWidth}" id="siteNav">
        <div class="nav__items" id="navItems">
          ${items}
        </div>
        <div class="nav__resizer" id="navResizer"></div>
      </nav>
    `;
  }

  initResizableNav() {
    const nav = document.getElementById('siteNav');
    const resizer = document.getElementById('navResizer');
    if (!nav || !resizer) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.classList.add('resizing');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 600) { // Min and max width
        nav.style.setProperty('--nav-width', `${newWidth}px`);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.classList.remove('resizing');
      }
    });
  }

  renderFooter() {
    const { footer, site } = this.config;
    const socialLinks = footer.showSocial ? footer.social.map(s => 
      `<a href="${s.url}" class="footer__social-link" target="_blank" title="${s.name}" id="footerSocialLink-${s.name}">${s.icon}</a>`
    ).join('') : '';
    const footerLinks = footer.links?.map(l => 
      `<a href="?page=${l.page}" class="footer__link" id="footerLink-${l.page}">${l.label}</a>`
    ).join(' · ') || '';
    return `
      <footer class="site__footer" id="siteFooter">
        <div class="footer__content" id="footerContent">
          <div class="footer__left" id="footerLeft">
            <span id="footerCopyright">${footer.copyright}</span>
            ${footerLinks ? `<span class="footer__links" id="footerLinks">${footerLinks}</span>` : ''}
          </div>
          <div class="footer__right" id="footerRight">
            ${socialLinks ? `<div class="footer__social" id="footerSocial">${socialLinks}</div>` : ''}
          </div>
        </div>
      </footer>
    `;
  }

  renderPage(pageId) {
    return `<div class="page" data-page="${pageId}" id="page-${pageId}"><div class="page__loading" id="pageLoading-${pageId}">Loading ${pageId}...</div></div>`;
  }

  async navigateTo(pageId) {
    if (!this.config.nav.find(n => n.id === pageId)) {
      pageId = 'home';
    }
    if (pageId === 'builder') {
      window.open('builder.html', '_blank');
      return;
    }
    if (pageId === 'schema-viewer') {
      window.open('schema-viewer.html', '_blank');
      return;
    }
    if (pageId === 'schema-first-architecture') {
      window.open('pages/schema-first-architecture.html', '_blank');
      return;
    }
    this.currentPage = pageId;
    this.updateActiveNav();
    const main = document.getElementById('main');
    main.innerHTML = `<div class="page__loading" id="mainPageLoading"><div data-wb="spinner" id="mainSpinner"></div><p id="mainLoadingText">Loading...</p></div>`;
    await WB.scan(main);
    const loadingEl = main.querySelector('.page__loading');
    let loadingTimerId;
    if (loadingEl && window.WBLoadingManager) {
      loadingTimerId = window.WBLoadingManager.startMonitoring(loadingEl, `Page: ${pageId}`);
    }
    try {
      const res = await fetch(`pages/${pageId}.html`);
      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      if (res.ok) {
        const html = await res.text();
        main.innerHTML = `<div class="page page--${pageId}" data-page="${pageId}" id="mainPage-${pageId}">${html}</div>`;
        
        // Execute any scripts in the loaded page
        const scripts = main.querySelectorAll('script');
        scripts.forEach(oldScript => {
          const newScript = document.createElement('script');
          // Copy attributes
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          // Copy content
          newScript.textContent = oldScript.textContent;
          oldScript.parentNode.replaceChild(newScript, oldScript);
        });
      } else {
        main.innerHTML = this.render404(pageId);
      }
    } catch (e) {
      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      main.innerHTML = this.render404(pageId);
    }
    WB.scan(main);
    main.scrollTop = 0;
  }

  render404(pageId) {
    return `
      <div class="page page--404" id="page-404">
        <div data-wb="empty" data-icon="📄" data-message="Page not found" data-description="Create pages/${pageId}.html to add content" id="empty404"></div>
      </div>
    `;
  }

  updateActiveNav() {
    document.querySelectorAll('.nav__item').forEach(item => {
      item.classList.toggle('nav__item--active', item.dataset.page === this.currentPage);
    });
  }

  toggleNav() {
    this.navCollapsed = !this.navCollapsed;
    const nav = document.querySelector('.site__nav');
    nav?.classList.toggle('site__nav--collapsed', this.navCollapsed);
    document.body.classList.toggle('nav-collapsed', this.navCollapsed);
  }
}
