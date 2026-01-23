// Site Engine Module
// Contains WBSite class and site logic
import WB from './wb-lazy.js';  // v3.0: Use lazy loading version
import { initViews } from './wb-views.js';

export default class WBSite {
  constructor() {
    this.config = null;
    this.currentPage = 'home';
    this.navCollapsed = false;
    this.mobileNavOpen = false;
  }

  async init() {
    console.log('[WBSite] init() starting');
    const app = document.getElementById('app');
    const loadingEl = app.querySelector('.site__loading');
    let loadingTimerId;
    if (loadingEl && window.WBLoadingManager) {
      loadingTimerId = window.WBLoadingManager.startMonitoring(loadingEl, 'Site initialization');
    }
    try {
      console.log('[WBSite] fetching config/site.json');
      const res = await fetch('config/site.json');
      console.log('[WBSite] fetched config, status:', res.status);
      this.config = await res.json();
      console.log('[WBSite] config parsed');
      document.documentElement.dataset.theme = this.config.site.colorTheme;
      document.title = this.config.seo?.pageTitle || this.config.header.companyName;
      this.updateFavicon();

      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      if (pageParam && this.config.navigationMenu.find(n => n.menuItemId === pageParam)) {
        this.currentPage = pageParam;
      }

      this.render();
      this.initResizableNav();
      this.initStickyHeader();

      // Initialize Views System
      await initViews({
        registry: [
          'src/wb-views/views-registry.json',
          'src/wb-views/partials-registry.json'
        ]
      });

      console.log('[WBSite] initializing WB core');
      // Ensure WB initialization completes before proceeding so that
      // MutationObservers and scanning are ready to handle subsequent
      // page insertion. Previously this was fire-and-forget which could
      // miss the initial page content.
      await WB.init({
        debug: false,
        autoInject: this.config.site.autoInjectComponents || false,
        useSchemas: true,  // v3.0: Enable schema-based DOM building
        preload: ['ripple', 'themecontrol', 'tooltip']
      });
      console.log('[WBSite] WB.init() complete');

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
      if (window.WB_DEBUG) console.log('✅ WB Site initialized:', this.config.header.companyName);
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

  updateFavicon() {
    if (!this.config.site.browserTabIcon) return;

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = this.config.site.browserTabIcon;
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      ${this.renderHeader()}
      <div class="site__body" id="siteBody">
        <div class="site__nav-backdrop" id="navBackdrop"></div>
        ${this.renderNav()}
        <main class="site__main" id="main">
          ${this.renderPage(this.currentPage)}
        </main>
      </div>
      ${this.renderFooter()}
      <wb-statusbar show-time show-theme></wb-statusbar>
      
    `;
    const toggleBtn = app.querySelector('.nav__toggle');

    // Issues button: always visible in header; use centralized helper to open the site Issues drawer
    const issuesToggleBtn = app.querySelector('#issuesToggle');
    if (issuesToggleBtn) {
      issuesToggleBtn.style.display = '';
      issuesToggleBtn.onclick = () => {
        import('../lib/issues-helper.js')
          .then(mod => (mod.openSiteIssues ? mod.openSiteIssues() : (mod.default ? mod.default() : null)))
          .catch(e => console.warn('[Issues] open helper failed', e));
      };
    }

    if (toggleBtn) {
      toggleBtn.onclick = () => this.toggleNav();
    }

    // Backdrop click closes mobile nav
    const backdrop = app.querySelector('.site__nav-backdrop');
    if (backdrop) {
      backdrop.onclick = () => this.closeMobileNav();
    }

    // Issues drawer toggle (attach additional safe handler)
    const issuesToggleBtn2 = issuesToggleBtn || app.querySelector('#issuesToggle');
    if (issuesToggleBtn2) {
      issuesToggleBtn2.addEventListener('click', () => {
        const issuesEl = document.getElementById('siteIssuesDrawer');
        if (issuesEl && typeof issuesEl.open === 'function') {
          try { issuesEl.open(); } catch (e) { console.warn('Issues open() failed', e); }
        } else if (issuesEl) {
          const trigger = issuesEl.querySelector('.wb-issues__trigger');
          if (trigger) trigger.click();
        }
      });
    }

    // Refresh button
    const refreshBtn = app.querySelector('#refreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = () => location.reload();
    }

    this.updateActiveNav();

    // Initialize wb-navbar and premium navbar support if present
    const appScope = document.getElementById('app');
    const navbarEl = appScope?.querySelector('wb-navbar');
    if (navbarEl && window.WB && typeof window.WB.scan === 'function') {
      try { window.WB.scan(navbarEl); } catch (e) { console.warn('[WB] Failed to scan navbar', e); }
    }
    if (typeof window.initPremiumNavbar === 'function') {
      try { window.initPremiumNavbar(); } catch (e) { console.warn('[premium-navbar] init failed', e); }
    }

    // === Runtime check for duplicate theme switchers ===
    const themeSwitchers = document.querySelectorAll('wb-themecontrol');
    if (themeSwitchers.length > 1) {
      console.warn(`⚠️ Found ${themeSwitchers.length} theme switchers on the page!`);
      themeSwitchers.forEach((el, i) => {
        console.warn(`Theme switcher #${i + 1}:`, el, 'Parent:', el.parentElement);
      });
    }
  }

  renderHeader() {
    const { header } = this.config;

    // Build nav links from config
    const links = (this.config.navigationMenu || []).map(item => {
      const href = item.href ? item.href : (item.pageToLoad ? `?page=${item.pageToLoad}` : (item.menuItemId ? `?page=${item.menuItemId}` : '#'));
      const label = `${item.menuItemEmoji || ''} ${item.menuItemText || item.menuItemId || ''}`.trim();
      return `<a href="${href}">${label}</a>`;
    }).join('');

    // Render a wb-navbar as the site header so premium-navbar behavior applies site-wide
    return `
      <div class="site__header ${header.sticky ? 'site__header--sticky' : ''}" id="siteHeader" style="display:flex;align-items:center;gap:1rem;padding:0.5rem 1rem;">
        <button class="nav__toggle" x-ripple title="Toggle Navigation" id="navToggle" aria-label="Toggle Navigation">☰</button>
        <wb-navbar brand="${header.companyName.replace(/"/g, '&quot;')}" brand-href="?page=home" ${header.sticky ? 'sticky="true"' : ''}>
          ${links}
          <div class="wb-navbar__extras" style="display:flex;gap:0.5rem;align-items:center;margin-left:1rem;">
            ${header.showThemeSwitcher ? '<wb-themecontrol show-label="false" id="themeControl" style="width:110px;flex-shrink:0;"></wb-themecontrol>' : ''}
            <button class="header__issues-btn" id="issuesToggle" x-ripple title="Issues" aria-label="Issues">🐛</button>
            <button class="header__refresh-btn" id="refreshBtn" x-ripple title="Refresh" aria-label="Refresh">↻</button>
          </div>
        </wb-navbar>
      </div>
    `;
  }

  renderNav() {
    const { navigationMenu, navigationLayout } = this.config;

    // Safety check for nav config
    if (!navigationMenu || !Array.isArray(navigationMenu)) {
      console.error('❌ Site configuration error: "navigationMenu" is missing or not an array.', navigationMenu);
      return '<nav class="site__nav" id="siteNav"><div class="nav__items">No navigation items found</div></nav>';
    }

    const items = navigationMenu.map(item => {
      // Robust href handling
      let href = '?page=home';
      let isExternal = false;

      if (item.href) {
        href = item.href;
        isExternal = true;
      } else if (item.pageToLoad) {
        href = `?page=${item.pageToLoad}`;
      } else if (item.menuItemId) {
        href = `?page=${item.menuItemId}`;
      }

      // Safe check for target
      let target = item.target || '';
      if (!target && isExternal && typeof href === 'string' && href.startsWith('http')) {
        target = '_blank';
      }

      return `
      <a href="${href}" 
         class="nav__item" 
         ${!isExternal && item.menuItemId ? `page="${item.menuItemId}"` : ''} 
         ${target ? `target="${target}"` : ''} 
         x-ripple 
         id="navItem-${item.menuItemId || item.menuItemText || Math.random().toString(36).substr(2, 9)}">
        <span class="nav__icon">${item.menuItemEmoji || ''}</span>
        <span class="nav__label">${item.menuItemText || item.menuItemId}</span>
      </a>
    `}).join('');

    const navWidthVar = navigationLayout && navigationLayout.navigationWidth ? navigationLayout.navigationWidth : 'fit-content';

    return `
      <nav class="site__nav ${this.navCollapsed ? 'site__nav--collapsed' : ''}" style="--nav-width: ${navWidthVar}" id="siteNav">
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
      if (newWidth > 60 && newWidth < 600) { // Min and max width
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

  initStickyHeader() {
    const main = document.getElementById('main');
    const header = document.getElementById('siteHeader');
    if (!main || !header) return;

    let lastScrollY = main.scrollTop;
    const threshold = 50; // Min scroll to trigger

    main.addEventListener('scroll', () => {
      const currentScrollY = main.scrollTop;

      // Don't hide if near top
      if (currentScrollY < threshold) {
        header.classList.remove('site__header--hidden');
        lastScrollY = currentScrollY;
        return;
      }

      // Scrolling Down -> Hide
      if (currentScrollY > lastScrollY + 10) {
        header.classList.add('site__header--hidden');
      }
      // Scrolling Up -> Show
      else if (currentScrollY < lastScrollY - 10) {
        header.classList.remove('site__header--hidden');
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  renderFooter() {
    const { footer, socialMediaLinks, footerLinks } = this.config;
    const socialLinksHtml = footer.showSocialLinks ? socialMediaLinks.map(s =>
      `<a href="${s.profileUrl}" class="footer__social-link" target="_blank" title="${s.platform}" id="footerSocialLink-${s.platform}">${s.icon}</a>`
    ).join('') : '';
    const footerLinksHtml = footerLinks?.map(l =>
      `<a href="?page=${l.pageToLoad}" class="footer__link" id="footerLink-${l.pageToLoad}">${l.linkText}</a>`
    ).join(' · ') || '';
    return `
      <footer class="site__footer" id="siteFooter">
        <div class="footer__content" id="footerContent">
          <div class="footer__left" id="footerLeft">
            <span id="footerCopyright">${footer.copyrightText}</span>
            ${footerLinksHtml ? `<span class="footer__links" id="footerLinks">${footerLinksHtml}</span>` : ''}
          </div>
          <div class="footer__right" id="footerRight">
            ${socialLinksHtml ? `<div class="footer__social" id="footerSocial">${socialLinksHtml}</div>` : ''}
          </div>
        </div>
      </footer>
    `;
  }

  renderPage(pageId) {
    return `<div class="page" page="${pageId}" id="page-${pageId}"><div class="page__loading" id="pageLoading-${pageId}">Loading ${pageId}...</div></div>`;
  }

  async navigateTo(pageId) {
    // Close mobile nav when navigating
    if (window.innerWidth <= 768) {
      this.closeMobileNav();
    }

    if (!this.config.navigationMenu.find(n => n.menuItemId === pageId)) {
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
    main.innerHTML = `<div class="page__loading" id="mainPageLoading"><wb-spinner id="mainSpinner"></wb-spinner><p id="mainLoadingText">Loading...</p></div>`;
    // Optimization: Don't await scan here to start fetch immediately. MutationObserver handles injection.
    // WB.scan(main); 

    const loadingEl = main.querySelector('.page__loading');
    let loadingTimerId;
    if (loadingEl && window.WBLoadingManager) {
      loadingTimerId = window.WBLoadingManager.startMonitoring(loadingEl, `Page: ${pageId}`);
    }
    try {
      console.log('[WBSite] fetching page:', pageId);
      const res = await fetch(`pages/${pageId}.html`);
      console.log('[WBSite] page fetch status:', res.status);
      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      if (res.ok) {
        const html = await res.text();
        main.innerHTML = `<div class="page page--${pageId}" page="${pageId}" id="mainPage-${pageId}">${html}</div>`;

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

        // Ensure WB scans newly-inserted page content immediately so
        // essential components (e.g., <wb-cardhero>) are attached and hydrated.
        // Rationale: MutationObserver may miss the initial insertion if WB
        // initialization hasn't completed yet during site startup.
        if (window.WB && typeof window.WB.scan === 'function') {
          try {
            // Try a few times with small delay to account for late initialization
            let found = false;
            for (let i = 0; i < 3; i++) {
              try {
                await window.WB.scan(main);
              } catch (scanErr) {
                console.warn('[WB] Page scan attempt failed:', scanErr);
              }

              if (main.querySelector('wb-cardhero')) {
                found = true;
                break;
              }

              // Wait briefly before retrying
              await new Promise(r => setTimeout(r, 200));
            }

            if (!found) {
              console.warn('[WBSite] <wb-cardhero> not found after page scan attempts');
            }
          } catch (scanErr) {
            console.warn('[WB] Page scan failed:', scanErr);
          }
        }
      } else {
        main.innerHTML = this.render404(pageId);
      }
    } catch (e) {
      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      main.innerHTML = this.render404(pageId);
    }
    // Optimization: MutationObserver handles injection automatically
    // WB.scan(main);
    main.scrollTop = 0;
  }



  render404(pageId) {
    return `
      <div class="page page--404" id="page-404">
        <div x-empty icon="📄" message="Page not found" description="Create pages/${pageId}.html to add content" id="empty404"></div>
      </div>
    `;
  }

  updateActiveNav() {
    document.querySelectorAll('.nav__item').forEach(item => {
      item.classList.toggle('nav__item--active', item.dataset.page === this.currentPage);
    });
  }

  toggleNav() {
    const nav = document.querySelector('.site__nav');
    const backdrop = document.querySelector('.site__nav-backdrop');
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Mobile: toggle slide-in menu
      this.mobileNavOpen = !this.mobileNavOpen;
      nav?.classList.toggle('site__nav--mobile-open', this.mobileNavOpen);
      backdrop?.classList.toggle('visible', this.mobileNavOpen);
      document.body.classList.toggle('wb-scroll-lock', this.mobileNavOpen);
    } else {
      // Desktop: toggle collapsed (icon-only) mode
      this.navCollapsed = !this.navCollapsed;
      nav?.classList.toggle('site__nav--collapsed', this.navCollapsed);
      document.body.classList.toggle('nav-collapsed', this.navCollapsed);
    }
  }

  closeMobileNav() {
    const nav = document.querySelector('.site__nav');
    const backdrop = document.querySelector('.site__nav-backdrop');
    this.mobileNavOpen = false;
    nav?.classList.remove('site__nav--mobile-open');
    backdrop?.classList.remove('visible');
    document.body.classList.remove('wb-scroll-lock');
  }
}
