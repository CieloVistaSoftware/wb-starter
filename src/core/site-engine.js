// Site Engine Module
// Contains WBSite class and site logic
import WB from './wb.js';  // v3.0: Use main wb.js with schema support
import { initViews } from './wb-views.js';
import { VERSION } from './version.js';
import { preloadCssForHtml } from './style-loader.js';

// VERSION.builtAt is stamped in UTC (scripts/stamp-version.js: `new
// Date().toISOString()`) — displayed here in Central time (John's local
// zone) instead of raw Zulu time. Intl handles the CST/CDT seasonal switch
// automatically.
function formatBuiltAtCentral(isoString) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(isoString));
  } catch (e) {
    return isoString; // never break the header over a formatting failure
  }
}

export default class WBSite {
  constructor() {
    this.config = null;
    this.currentPage = 'home';
    this.navCollapsed = false;
    this.mobileNavOpen = false;
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
      document.documentElement.dataset.theme = this.config.branding.colorTheme;
      document.title = this.config.searchEngineOptimization?.pageTitle || this.config.branding.companyName;
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

      await WB.init({
        debug: false,
        autoInject: this.config.branding.autoInjectComponents || false,
        useSchemas: true,  // v3.0: Enable schema-based DOM building
        preload: ['ripple', 'themecontrol', 'tooltip']
      });

      window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') || 'home';
        this.navigateTo(page);
      });

      // Clear-cache-and-reload link (the version number, in the shell header).
      document.addEventListener('click', async (e) => {
        const reloadBtn = e.target.closest('#headerVersion');
        if (!reloadBtn) return;
        e.preventDefault();
        reloadBtn.textContent = '⏳';
        try {
          if (window.caches) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          if (navigator.serviceWorker) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
        } catch (err) {
          console.warn('[clear-cache] partial failure:', err && err.message);
        }
        // A plain location.reload() only bypasses Cache Storage/the service
        // worker (both cleared above) — it does NOT bypass the browser's own
        // ordinary HTTP disk cache. GitHub Pages serves every response with
        // Cache-Control: max-age=600, so within that 10-minute window a
        // reload can still be served entirely from local disk cache without
        // ever reaching the network, regardless of what was just cleared.
        // Force a genuinely new URL so there is nothing to serve from cache.
        location.href = location.pathname + location.search
          + (location.search ? '&' : '?') + '_cb=' + Date.now()
          + location.hash;
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
          } else if (href && href.length > 1 && href.startsWith('#')) {
            // In-page anchor (e.g. the behaviors-page section nav). Native anchor
            // scrolling was unreliable in the SPA — lazy-injected components reflow
            // the page after the jump, leaving the link looking dead (#181). Drive
            // the scroll explicitly; scroll-margin-top on the target clears the
            // sticky header.
            const target = document.querySelector(href);
            if (target) {
              e.preventDefault();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              history.replaceState(null, '', href);
            }
          }
        }
      });

      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      console.log('✅ WB Site initialized:', this.config.branding.companyName);
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
    if (!this.config.branding.browserTabIcon) return;
    
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = this.config.branding.browserTabIcon;
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
      <div x-eager id="siteNotes"></div>
    `;
    const toggleBtn = app.querySelector('.nav__toggle');
    if (toggleBtn) {
      toggleBtn.onclick = () => this.toggleNav();
    }

    // Backdrop click closes mobile nav
    const backdrop = app.querySelector('.site__nav-backdrop');
    if (backdrop) {
      backdrop.onclick = () => this.closeMobileNav();
    }

    const notesToggleBtn = app.querySelector('#notesToggle');
    if (notesToggleBtn) {
      notesToggleBtn.onclick = () => {
        if (window.showNotesModal) {
          window.showNotesModal();
        } else {
          const notesEl = document.querySelector('[]');
          if (notesEl && notesEl.wbNotes) {
            notesEl.wbNotes.toggle();
          }
        }
      };
    }
    this.updateActiveNav();

    // === Runtime check for duplicate theme switchers ===
    const themeSwitchers = document.querySelectorAll('wb-themecontrol');
    if (themeSwitchers.length > 1) {
      console.warn(`⚠️ Found ${themeSwitchers.length} theme switchers on the page!`);
      themeSwitchers.forEach((el, i) => {
        console.warn(`Theme switcher #${i+1}:`, el, 'Parent:', el.parentElement);
      });
    }
  }

  renderHeader() {
    const { branding, headerSettings } = this.config;
    // Clean header layout with proper semantics and spacing
    return `
      <header class="site__header ${headerSettings.keepHeaderAtTop ? 'site__header--sticky' : ''}" id="siteHeader">
        <div class="header__left" id="headerLeft">
          <button class="nav__toggle" x-ripple title="Toggle Navigation" id="navToggle" aria-label="Toggle Navigation">☰</button>
          <a href="?page=home" class="header__logo" id="headerLogo" style="gap: 0.75rem;">
            ${branding.headerLogoImage ? `<span class="header__logo-icon" id="headerLogoIcon">${branding.headerLogoImage}</span>` : ''}
            <span class="header__logo-text" id="headerLogoText">${branding.companyName}</span>
          </a>
          <a href="#" class="header__version" id="headerVersion" x-ripple title="Build ${VERSION.commit} · ${formatBuiltAtCentral(VERSION.builtAt)} — tap to clear cache and reload">v${VERSION.version}</a>
        </div>
        <div class="header__right" id="headerRight" style="gap: 1rem;">
          ${headerSettings.displaySearchBar ? `
            <div class="header__search" id="headerSearch">
              <input type="search" placeholder="Search..." aria-label="Search" class="wb-input-glass" style="padding: 0.4rem 0.8rem; width: 200px;">
            </div>
          ` : ''}
          <a class="header__playground-btn" id="playgroundLink" href="demos/playground.html" target="_blank" rel="noopener" x-ripple title="Playground — paste HTML, see it render live" aria-label="Open the Playground">🧪</a>
          <button class="header__notes-btn" id="notesToggle" x-ripple title="Toggle Notes" aria-label="Toggle Notes">📝</button>
        </div>
      </header>
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
         ${target ? `target="${target}"` : ''}
         x-ripple>
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
    const { footerSettings, socialMediaLinks, additionalFooterLinks } = this.config;
    const socialLinks = footerSettings.displaySocialMediaLinks ? socialMediaLinks.map(s =>
      `<a href="${s.profileUrl}" class="footer__social-link" target="_blank" title="${s.platform}" id="footerSocialLink-${s.platform}">${s.icon}</a>`
    ).join('') : '';
    const footerLinks = additionalFooterLinks?.map(l =>
      `<a href="?page=${l.pageToLoad}" class="footer__link" id="footerLink-${l.pageToLoad}">${l.linkText}</a>`
    ).join(' · ') || '';
    return `
      <footer class="site__footer" id="siteFooter">
        <div class="footer__content" id="footerContent">
          <div class="footer__left" id="footerLeft">
            <span id="footerCopyright">${footerSettings.footerCopyrightText}</span>
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
    // Remember the scroll position of the page we're leaving so returning to it
    // restores where the user was. The window is the scroll container.
    if (this.currentPage) {
      this._scrollMemory = this._scrollMemory || {};
      this._scrollMemory[this.currentPage] = window.scrollY;
    }

    // Close mobile nav when navigating
    if (window.innerWidth <= 768) {
      this.closeMobileNav();
    }
    
    if (!this.config.navigationMenu.find(n => n.menuItemId === pageId)) {
      pageId = 'home';
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
    main.innerHTML = `<div class="page__loading" id="mainPageLoading"><wb-spinner  id="mainSpinner"></div><p id="mainLoadingText">Loading...</p></div>`;
    // Optimization: Don't await scan here to start fetch immediately. MutationObserver handles injection.
    // WB.scan(main); 
    
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
        // Preload this page's behavior CSS BEFORE the content becomes
        // visible — otherwise it paints unstyled for a moment and then
        // reflows as each behavior's CSS trickles in async, a real CLS
        // regression the old render-blocking @import chain never had
        // (#342 follow-up; see style-loader.js's preloadCssForHtml doc).
        await preloadCssForHtml(html);
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
        
        // Process wb-* elements that were just added
        if (window.WB) {
          // Small delay to ensure DOM is fully updated
          setTimeout(() => window.WB.scan(main), 10);
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

    // Restore scroll: returning to a previously-visited page lands the user where
    // they left off; a first visit goes to the top. The "1rem down from the top"
    // gap below the sticky header is layout (.site__main padding-top: 1rem), not a
    // scroll offset — scrolling down 1rem would tuck content under the sticky
    // header. Done on the next frame so the page has its height before we scroll.
    const rememberedY = (this._scrollMemory || {})[pageId];
    const targetY = rememberedY != null ? rememberedY : 0;
    requestAnimationFrame(() => {
      window.scrollTo(0, targetY);
      // Re-apply once more after lazy content settles so a tall restore isn't clamped.
      setTimeout(() => window.scrollTo(0, targetY), 60);
    });
  }

  render404(pageId) {
    return `
      <div class="page page--404" id="page-404">
        <div x-empty data-icon="📄" data-message="Page not found" data-description="Create pages/${pageId}.html to add content" id="empty404"></div>
      </div>
    `;
  }

  updateActiveNav() {
    document.querySelectorAll('.nav__item').forEach(item => {
      const href = item.getAttribute('href') || '';
      const page = href.startsWith('?page=') ? new URLSearchParams(href).get('page') : null;
      item.classList.toggle('nav__item--active', page === this.currentPage);
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
      // Opening while scrolled down the page would expand the in-flow fluent
      // nav (#293) above the current viewport, out of sight — bring it into
      // view so the menu is actually visible the moment it opens.
      if (this.mobileNavOpen && nav) {
        nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
