// Site Engine Module
// Contains WBSite class and site logic
import WB from './wb.js';  // v3.0: Use main wb.js with schema support
import { preloadCssForHtml } from './style-loader.js';
import { VERSION } from './version.js';
import { versionNumber } from './version-number.js';
import { setRule } from './dynamic-style.js';
import { pageFromUrl, pageHref, isPageLink } from './routes.js';
// Sets window.WBTime for the classic <script>s in pages/*.html (#1553).
import './central-time.js';

/** Old page ids that now render another page (URL is rewritten to the new id). */
const PAGE_ALIASES = { 'whats-new': 'releases' };

// #390: new spec -- auto-hide-on-scroll is a mobile-landscape-only
// behavior. Landscape phones are short (~320-430px tall); that's where
// a fixed 64px header eating vertical space actually hurts. Landscape
// TABLETS/desktops are much taller, so max-height (not max-width) is
// the right discriminator between "phone, sideways" and "anything
// wider-screened, sideways." Outside this condition the bar just
// stays put, same as before this feature existed.
const isMobileLandscape = () => window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;

/**
 * Hide `bar` (add `hiddenClass`) while #siteBody scrolls down and show it on
 * scroll-up, in mobile landscape only. initStickyHeader() (#390) and
 * initStickyFooter() (#393) each carried this whole listener pair (#883).
 * `onResize` runs first on every resize.
 */
function hideOnLandscapeScroll(body, bar, hiddenClass, onResize) {
  let lastScrollY = body.scrollTop;
  const threshold = 50; // Min scroll to trigger

  body.addEventListener('scroll', () => {
    if (!isMobileLandscape()) return;
    const currentScrollY = body.scrollTop;

    // Don't hide if near top
    if (currentScrollY < threshold) {
      bar.classList.remove(hiddenClass);
      lastScrollY = currentScrollY;
      return;
    }

    // Scrolling Down -> Hide (maximizes screen area while reading)
    if (currentScrollY > lastScrollY + 10) {
      bar.classList.add(hiddenClass);
    }
    // Scrolling Up -> Show
    else if (currentScrollY < lastScrollY - 10) {
      bar.classList.remove(hiddenClass);
    }

    lastScrollY = currentScrollY;
  }, { passive: true });

  // Leaving mobile-landscape (rotate to portrait, resize a desktop
  // window, ...) must not leave the bar stuck hidden with no more
  // scroll events available to un-hide it.
  window.addEventListener('resize', () => {
    if (onResize) onResize();
    if (!isMobileLandscape()) {
      bar.classList.remove(hiddenClass);
    }
  });
}

export default class WBSite {
  constructor() {
    this.config = null;
    this.currentPage = 'home';
    this.navCollapsed = false;
    this.mobileNavOpen = false;
    // #1456: false until the boot navigation has run; see navigateTo().
    this._navigatedOnce = false;
  }

  /**
   * Boot the site shell: load config/site.json, render header/nav/footer and
   * wire SPA navigation.
   *
   * @returns {Promise<boolean>} `true` when the shell was initialized and the
   *   instance is usable (config loaded, chrome rendered, #main present).
   *   `false` when this page is not a site-shell page and initialization was
   *   deliberately skipped — callers MUST NOT call navigateTo() in that case,
   *   because there is neither a config nor a #main container to navigate.
   *   (#511: skipping init but navigating anyway threw "Cannot read
   *   properties of null (reading 'navigationMenu')" on every load of
   *   demos/intellisense-check.html.)
   */
  async init() {
    const app = document.getElementById('app');

    // Skip site-engine initialization for standalone demo pages (no app container)
    if (!app) return false;

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
      
      // #1001: the page is the path (/behaviors); ?page=behaviors still works
      // and is rewritten to the path below.
      const route = pageFromUrl(window.location.href);
      const pageParam = route.page;
      if (route.legacy && route.page) {
        history.replaceState(history.state, '', pageHref(route.page, window.location.search) + window.location.hash);
      }
      // #725 -- the SECOND copy of the same wrong rule. This one dropped the
      // ?page= parameter on the floor whenever it was not a nav menu item, so
      // currentPage stayed 'home' and navigateTo() never even saw the request.
      // Fixing only the gate inside navigateTo() changed nothing: ?page=privacy
      // still rendered home, because it never got that far. Same test as there:
      // a plausible page id is accepted, and whether the page EXISTS is decided
      // by the fetch, which already has a 404 path.
      if (pageParam && /^[a-z0-9][a-z0-9-]*$/i.test(pageParam)) {
        this.currentPage = pageParam;
      }
      // #957: a path that names no page (/foo/bar) shows the not-found page,
      // never home with the wrong address still in the bar.
      if (route.page === null) this.currentPage = route.path;

      this.render();
      this.initResizableNav();
      this.initStickyHeader();
      this.initStickyFooter();
      this.initWheelScrollFallback();

      // The wb-views system was removed with the component tags: <div>
      // was one. It ran here on every page load, fetching two registries and
      // 47 partials, and no page in pages/ ever used it — only two demos did.

      await WB.init({
        debug: false,
        autoInject: this.config.branding.autoInjectComponents || false,
        useSchemas: true,  // v3.0: Enable schema-based DOM building
        preload: ['ripple', 'themecontrol', 'tooltip']
      });

      window.addEventListener('popstate', () => {
        const { page, path } = pageFromUrl(window.location.href);
        this.navigateTo(page ?? path);
      });

      // Clear-cache-and-reload for the header's version link is handled by
      // the x-release behavior itself now (src/wb-viewmodels/release.js) --
      // this used to be a second, hand-rolled copy of that exact logic
      // wired to #headerVersion specifically.

      // Intercept clicks for SPA navigation
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
          const href = link.getAttribute('href');
          // #1001: a link to one of the site's pages -- /behaviors or the old
          // ?page=behaviors -- navigates in place and leaves the path in the
          // address bar. A modified click, a new tab or a download is the
          // browser's.
          const ownPage = href && !href.startsWith('#') && !link.target && !link.hasAttribute('download')
            && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && e.button === 0
            && isPageLink(link.href);
          if (ownPage) {
            const { page, path } = pageFromUrl(link.href);
            e.preventDefault();
            history.pushState(null, '', page ? pageHref(page, new URL(link.href).search) + new URL(link.href).hash : link.href);
            this.navigateTo(page ?? path);
          } else if (href && href.length > 1 && href.startsWith('#')) {
            // In-page anchor (e.g. the behaviors-page section nav). Native anchor
            // scrolling was unreliable in the SPA — lazy-injected components reflow
            // the page after the jump, leaving the link looking dead (#181). Drive
            // the scroll explicitly; scroll-margin-top on the target clears the
            // sticky header.
            const target = document.querySelector(href);
            if (target) {
              e.preventDefault();
              // #181's own fix (scrollIntoView instead of native anchor
              // jump) still isn't enough on a page as long/image-heavy as
              // components.html's: dozens of <div x-cardimage>/<div x-cardhero>
              // external images ABOVE a lower target keep loading and
              // growing the page's total height for SECONDS after this
              // fires (confirmed live on a 47,500px-tall render: a fixed
              // handful of re-scroll retries within ~2.5s still landed
              // ~3,500px short of #audioDemo, because images were still
              // loading well past that window). A fixed retry schedule
              // can't know how long is enough on a page this variable, so
              // poll instead: keep re-scrolling until the target's
              // position stops moving between checks (layout has settled),
              // capped at 8s so a genuinely-broken target can't loop
              // forever.
              let lastTop = null;
              let stableCount = 0;
              const POLL_MS = 250;
              const MAX_MS = 8000;
              const startedAt = Date.now();
              const poll = () => {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const top = Math.round(target.getBoundingClientRect().top);
                if (top === lastTop) {
                  stableCount++;
                } else {
                  stableCount = 0;
                  lastTop = top;
                }
                // Two consecutive stable reads (500ms of no movement) means
                // the layout above the target has settled.
                if (stableCount >= 2 || Date.now() - startedAt > MAX_MS) return;
                setTimeout(poll, POLL_MS);
              };
              poll();
              // pushState (not replaceState): a link like the component
              // index's "View demo" jumps from a scroll position way up the
              // page down to a specific component -- that jump must be a
              // real, back-navigable step. replaceState overwrote the
              // CURRENT history entry instead of adding one, so Back skipped
              // straight past the click's origin to whatever page loaded
              // before this one entirely, not back to the pre-click scroll
              // position. Confirmed live report: the components page's own
              // table of "View demo" links did exactly this.
              history.pushState(null, '', href);
            }
          }
        }
      });

      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      console.log('✅ WB Site initialized:', this.config.branding.companyName);
      return true;
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
      ${this.config.headerSettings?.displayNotesButton !== false ? '<div x-notes id="siteNotes" x-eager position="right"></div>' : ''}
    `;
    // The nav's configured width reaches site.css's var(--nav-width) through a
    // generated rule -- it used to be a style="" attribute in renderNav()'s
    // markup (#779).
    const navEl = app.querySelector('#siteNav');
    if (navEl && this.navWidth) setRule(navEl, 'width', { '--nav-width': this.navWidth });
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
          const notesEl = document.getElementById('siteNotes');
          if (notesEl && notesEl.wbNotes) {
            notesEl.wbNotes.toggle();
          }
        }
      };
    }
    this.updateActiveNav();

    // === Runtime check for duplicate theme switchers ===
    const themeSwitchers = document.querySelectorAll('[x-themecontrol]');
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
          <a href="${pageHref('home')}" class="header__logo" id="headerLogo">
            ${branding.headerLogoImage ? `<span class="header__logo-icon" id="headerLogoIcon">${branding.headerLogoImage}</span>` : ''}
            <span class="header__logo-text" id="headerLogoText">${branding.companyName}</span>
          </a>
          <!-- The version badge, Playground and Notes are wb-starter's own
               developer tools. A site built ON wb-starter (npm create
               wb-starter, #813) turns them off in headerSettings; each
               defaults to shown, so this site is unchanged. -->
          <!-- #821: a button, not a link. x-release clears caches and reloads;
               it navigates nowhere, so href="#" was only there to make an
               anchor clickable. An <a> announces as a link and promises
               navigation, and Enter/Space differ between the two. -->
          ${headerSettings.displayVersionBadge !== false ? `<button type="button" class="header__version" id="headerVersion" x-ripple x-release></button>` : ''}
        </div>
        <div class="header__right" id="headerRight">
          ${headerSettings.displaySearchBar ? `
            <div class="header__search" id="headerSearch">
              <input type="search" placeholder="Search..." aria-label="Search" class="x-input-glass header__search-input">
            </div>
          ` : ''}
          <div x-themecontrol id="headerThemeControl"></div>
          ${headerSettings.displayPlaygroundLink !== false ? `<a class="header__playground-btn" id="playgroundLink" href="demos/playground.html" target="_blank" rel="noopener" x-ripple title="Playground — paste HTML, see it render live" aria-label="Open the Playground">🧪</a>` : ''}
          ${headerSettings.displayNotesButton !== false ? `<button class="header__notes-btn" id="notesToggle" x-ripple title="Toggle Notes" aria-label="Toggle Notes">📝</button>` : ''}
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
      let href = pageHref('home');
      let isExternal = false;
      
      if (item.href) {
        href = item.href;
        isExternal = true;
      } else if (item.pageToLoad) {
        href = pageHref(item.pageToLoad);
      } else if (item.menuItemId) {
        href = pageHref(item.menuItemId);
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

    // Applied by render() once the nav exists (#779: no style="" here).
    this.navWidth = navigationLayout && navigationLayout.navigationWidth ? navigationLayout.navigationWidth : 'fit-content';

    return `
      <nav class="site__nav ${this.navCollapsed ? 'site__nav--collapsed' : ''}" id="siteNav">
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
      // The col-resize cursor is site.css's body.resizing rule (#779).
      document.body.classList.add('resizing');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 60 && newWidth < 600) { // Min and max width
        setRule(nav, 'width', { '--nav-width': `${newWidth}px` });
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.classList.remove('resizing');
      }
    });
  }

  initStickyHeader() {
    // #390: was `document.getElementById('main')` (.site__main) -- confirmed
    // live that element never scrolls itself (its own CSS comment: "Removed
    // overflow-y: auto - body scrolls now so nav can stick"). #siteBody
    // (.site__body) is the actual single scroll container -- listening on
    // .site__main meant this whole feature never fired, on any viewport.
    const body = document.getElementById('siteBody');
    const header = document.getElementById('siteHeader');
    if (!body || !header) return;

    hideOnLandscapeScroll(body, header, 'site__header--hidden');
  }

  // #393: same collapse-on-mobile-landscape-scroll treatment as
  // initStickyHeader() (#390), applied to the footer. Hide on scroll-down
  // (maximize reading area), show on scroll-up, gated to mobile-landscape
  // only -- same isMobileLandscape() check, same threshold/debounce.
  initStickyFooter() {
    const body = document.getElementById('siteBody');
    const footer = document.getElementById('siteFooter');
    if (!body || !footer) return;

// Unlike the header's fixed 64px (site.css `.site__header { height: 64px }`),
    // the footer's height is NOT a constant -- renderFooter() makes the social
    // links and additional footer links optional per-site config, so its real
    // height varies. Measure it and hand the value to CSS as a custom property
    // so `.site__footer--hidden`'s margin-top cancels exactly that much height --
    // the same "real reclaim, not just a transform" fix #390 applied to the
    // header, just measured at runtime instead of hardcoded.
    const syncFooterHeight = () => {
      // A measured value: a generated rule, not the style attribute (#779).
      setRule(footer, 'collapse', { '--site-footer-collapse-height': `${footer.offsetHeight}px` });
    };
    syncFooterHeight();

    // Re-measure on resize -- rotating or resizing can change which optional
    // footer content wraps, changing its height.
    hideOnLandscapeScroll(body, footer, 'site__footer--hidden', syncFooterHeight);
  }

  // #636: John, screenshot -- filtering pages/behaviors.html's search box
  // correctly narrowed the result count ("Showing 69 of 88") but the matched
  // <div x-demo> elements never appeared. Root cause: #siteBody IS the correct,
  // genuinely-scrollable container (overflow-y:auto, scrollHeight >>
  // clientHeight, confirmed live) and setting `.scrollTop` directly always
  // worked -- but real/trusted wheel input landing on it did not advance
  // scrollTop at all, on both the live .io site and this repo's own
  // automation. No JS anywhere registers a `wheel` listener that could be
  // preventing it (grepped the whole src/ tree), so this isn't application
  // logic swallowing the event -- something in the browser's native
  // wheel-to-scroll pipeline for this specific `height:100dvh; overflow:
  // hidden` shell + `flex:1; overflow-y:auto` child layout just isn't
  // reliably kicking in. Rather than keep chasing that platform-level cause,
  // this makes wheel scrolling self-healing: after any wheel event, if
  // scrollTop hasn't moved by the next frame (native handling silently did
  // nothing), apply the delta manually. When native scrolling DOES work
  // (the common case), this is a no-op every time -- scrollTop has already
  // moved by the time the rAF fires, so the fallback branch never runs.
  initWheelScrollFallback() {
    const body = document.getElementById('siteBody');
    if (!body) return;

    body.addEventListener('wheel', (e) => {
      // #1037: over an inner scroller that can still move this way (an
      // expanded issue, a code panel), the browser scrolls THAT, and #siteBody
      // staying put is the correct outcome -- not native scrolling failing.
      // The fallback used to read it as failure and push the page too, so the
      // reader lost their place mid-issue. At the inner scroller's end it can
      // no longer move, and the wheel chains to the page as normal.
      if (innerScrollerTakesWheel(e.target, body, e.deltaY)) return;

      const beforeTop = body.scrollTop;
      const maxTop = body.scrollHeight - body.clientHeight;
      if (maxTop <= 0) return; // nothing to scroll

      // setTimeout, not requestAnimationFrame -- rAF is suspended on
      // backgrounded/non-compositing tabs (confirmed while diagnosing this:
      // a double-rAF await hung indefinitely in that state), which would
      // silently disable this exact fallback in the situation it exists to
      // cover. A short timeout still fires there.
      setTimeout(() => {
        if (body.scrollTop !== beforeTop) return; // native scroll handled it

        const nextTop = beforeTop + e.deltaY;
        body.scrollTop = Math.min(Math.max(nextTop, 0), maxTop);
      }, 16);
    }, { passive: true });
  }

  renderFooter() {
    const { footerSettings, socialMediaLinks, additionalFooterLinks } = this.config;
    const socialLinks = footerSettings.displaySocialMediaLinks ? socialMediaLinks.map(s =>
      `<a href="${s.profileUrl}" class="footer__social-link" target="_blank" title="${s.platform}" id="footerSocialLink-${s.platform}">${s.icon}</a>`
    ).join('') : '';
    const footerLinks = additionalFooterLinks?.map(l =>
      `<a href="${pageHref(l.pageToLoad)}" class="footer__link" id="footerLink-${l.pageToLoad}">${l.linkText}</a>`
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
    // Renamed pages keep their old URLs working: What's New became Releases
    // for 1.0, and ?page=whats-new is in bookmarks and old issue links.
    if (PAGE_ALIASES[pageId]) {
      pageId = PAGE_ALIASES[pageId];
      try {
        // #1001: the renamed page's own path, not ?page=.
        history.replaceState(history.state, '', pageHref(pageId, window.location.search) + window.location.hash);
      } catch { /* no URL API: the page still renders */ }
    }
    // Defense in depth (#511). The real fix is in the callers: init() now
    // reports whether it actually initialized, and src/index.js / src/main.js
    // only navigate when it did. But navigateTo() is public API — it hangs off
    // window.WBSite and is reachable from the console, from demos and from any
    // future caller — and on a page without the site shell there is neither a
    // config to resolve pageId against nor a #main container to render into.
    // Bail visibly rather than throwing a null property read.
    if (!this.config) {
      console.warn('[WBSite] navigateTo() ignored — site config is not loaded (this page has no site shell).');
      return;
    }

    // Remember the scroll position of the page we're leaving so returning to it
    // restores where the user was. #siteBody is the scroll container, not the
    // window: .site is 100dvh with overflow hidden (site.css), so window.scrollY
    // is always 0 here (#1186, the same trap #390 found in initStickyHeader).
    const siteBody = document.getElementById('siteBody');
    if (this.currentPage && siteBody) {
      this._scrollMemory = this._scrollMemory || {};
      this._scrollMemory[this.currentPage] = siteBody.scrollTop;
    }

    // Close mobile nav when navigating -- a reader who tapped a link in the
    // open menu wants it out of the way. #1456: not on the FIRST navigation,
    // which main.js runs at boot and no tap caused. It used to close a menu the
    // reader had opened while the site was still starting (traced: toggle at
    // 1450ms, this close at 1552ms, the tap simply lost).
    if (this._navigatedOnce && window.innerWidth <= 768) {
      this.closeMobileNav();
    }
    this._navigatedOnce = true;

    let main_notFound = false;
    
    // #725 -- John's own footer links were broken by this. The gate used to be
    //   if (!navigationMenu.find(n => n.menuItemId === pageId)) pageId = 'home';
    // so ANY page that is not a nav menu item silently became home: 10 of the
    // 20 files in pages/ were unreachable by URL, including ?page=privacy and
    // ?page=terms, which the footer links to on every page of the site. No
    // error, no 404, the URL still saying privacy while home rendered.
    //
    // The fetch below already handles a missing page properly -- render404() --
    // so the nav list is the wrong authority for "does this page exist". What
    // the gate WAS doing accidentally was keeping junk out of the fetch path,
    // since pageId is interpolated straight into `pages/${pageId}.html`. That
    // job is now done deliberately, and only that job.
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(pageId)) {
      console.warn(`[WBSite] refusing to navigate to an invalid page id: ${JSON.stringify(pageId)}`);
      main_notFound = true;
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
    // #1519: only the newest navigation may write #main or the scroll. Each
    // await below can resolve after a newer navigation has started (a slow
    // fragment, its CSS, the scan); the last to FINISH used to win the screen,
    // painting a page the reader had already moved on from.
    const navSeq = this._navSeq = (this._navSeq || 0) + 1;
    const superseded = () => navSeq !== this._navSeq;
    const main = document.getElementById('main');
    if (main_notFound) {
      main.innerHTML = this.render404(pageId);
      this._placeScroll(pageId);
      return;
    }
    main.innerHTML = `<div class="page__loading" id="mainPageLoading"><span x-spinner id="mainSpinner" label="Loading page"></span><p id="mainLoadingText">Loading...</p></div>`;
    // Optimization: Don't await scan here to start fetch immediately. MutationObserver handles injection.
    // WB.scan(main); 
    
    const loadingEl = main.querySelector('.page__loading');
    let loadingTimerId;
    if (loadingEl && window.WBLoadingManager) {
      loadingTimerId = window.WBLoadingManager.startMonitoring(loadingEl, `Page: ${pageId}`);
    }
    try {
      // Cache-bust the fragment on the release version. Without this the SPA
      // re-served whatever copy the browser had, so a page edit stayed
      // invisible after deploy while the raw URL served the new file — the
      // reason What's New kept looking unchanged after a release. See #743.
      // The key is the badge's number (1.0.N), which moves on every push to
      // main. package.json's version stays 1.0.0 between tags, so keying on it
      // let the browser keep serving old page content for every 1.0.N.
      const res = await fetch(`pages/${pageId}.html?v=${versionNumber(VERSION).number}`);
      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      if (superseded()) return;
      if (res.ok) {
        // A page fragment that needs to show the release number uses
        // <span x-release> (or <div x-release>) -- src/wb-viewmodels/release.js
        // reads the single canonical VERSION import itself, the same one
        // every other consumer (including this shell's own header) reads.
        // A hardcoded "v3.0" litters across several pages/*.html went stale
        // the moment the real version ticked past 3.0.0; a placeholder-
        // token substitution step used to live here for exactly that
        // reason -- x-release replaced it with a real, self-sufficient
        // behavior instead of a second bespoke mechanism.
        const html = await res.text();
        // Preload this page's behavior CSS BEFORE the content becomes
        // visible — otherwise it paints unstyled for a moment and then
        // reflows as each behavior's CSS trickles in async, a real CLS
        // regression the old render-blocking @import chain never had
        // (#342 follow-up; see style-loader.js's preloadCssForHtml doc).
        await preloadCssForHtml(html);
        if (superseded()) return;
        main.innerHTML = `<div class="page page--${pageId}" data-page="${pageId}" id="mainPage-${pageId}">${html}</div>`;
        // #1462: place the scroll the moment the page is on screen. This ran
        // after the awaited scan below, so a reader who scrolled the visible
        // page during the scan was snapped back to the top when it finished,
        // and that 0 became the offset remembered for the page.
        this._placeScroll(pageId);
        
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
        
        // Build the page's behaviors, and AWAIT it (#962). This was
        // setTimeout(scan, 10): navigateTo's promise resolved with the page
        // inserted but unbuilt, so every caller had to guess how much longer
        // to wait. scan() resolves once every in-view element is built and
        // every out-of-view one is deferred -- a callback, not a clock. The
        // DOM is complete the moment innerHTML returns; the 10ms bought
        // nothing.
        if (window.WB) {
          try { await window.WB.scan(main); } catch { /* a broken behavior must not stop navigation */ }
        }
        if (superseded()) return;

        // #730 -- John: "if all elements on the page have an id then duplicate
        // work would have a run time error." Checked AFTER the old page has been
        // replaced and the new one scanned, so a normal navigation never trips
        // it -- only genuine duplication does. It used to run on a 400ms timer
        // that guessed when the scan was over; it now runs when it IS over.
        // Dynamic import, never awaited, so a render never waits on the
        // detector and never fails because of it.
        import('./duplicate-ids.js')
          .then((m) => m.reportDuplicateIds(`after navigating to ${pageId}`))
          .catch(() => { /* the detector is never allowed to break a render */ });
      } else {
        main.innerHTML = this.render404(pageId);
        this._placeScroll(pageId);
      }
    } catch (e) {
      if (loadingTimerId && window.WBLoadingManager) {
        window.WBLoadingManager.stopMonitoring(loadingTimerId);
      }
      if (superseded()) return;
      main.innerHTML = this.render404(pageId);
      this._placeScroll(pageId);
    }
  }

  /**
   * Put #siteBody where this page was left (or at the top on a first visit).
   * Called as the page's content is written to #main (#1462).
   */
  _placeScroll(pageId) {
    // Restore scroll: returning to a previously-visited page lands the user where
    // they left off; a first visit goes to the top. The "1rem down from the top"
    // gap below the sticky header is layout (.site__main padding-top: 1rem), not a
    // scroll offset — scrolling down 1rem would tuck content under the sticky
    // header. Done on the next frame so the page has its height before we scroll.
    const rememberedY = (this._scrollMemory || {})[pageId];
    const targetY = rememberedY != null ? rememberedY : 0;
    const scroller = document.getElementById('siteBody');
    if (scroller) {
      // Reset now so the new page never opens at the old page's offset, then
      // restore once it has its height.
      scroller.scrollTop = 0;
      this._restoreScroll(scroller, targetY);
    }
  }

  /**
   * Put #siteBody back at targetY once the page is tall enough to hold it.
   *
   * #1432: this used to re-apply once 60ms after the next frame. A page that
   * builds asynchronously (the Behaviors page loads its catalogue first) was
   * still too short then, so the restore clamped to 0 and the position was
   * lost. Now it re-applies each time the content resizes, and lets go when
   * the reader scrolls themselves or another navigation starts.
   */
  _restoreScroll(scroller, targetY) {
    this._stopScrollRestore?.();
    if (!targetY) return;
    // #main grows as the page builds; #siteBody's first child is the nav backdrop.
    const content = document.getElementById('main') || scroller;
    let observer = null;
    const userEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const stop = () => {
      observer?.disconnect();
      userEvents.forEach((type) => scroller.removeEventListener(type, stop));
      if (this._stopScrollRestore === stop) this._stopScrollRestore = null;
    };
    // Not released when the target is first reached: content that keeps
    // arriving above it makes the browser's scroll anchoring move the page on
    // (measured: restored to 400, then carried to 1767 with no script writing
    // scrollTop). Every resize re-applies, until the reader scrolls themselves
    // or another navigation starts.
    const apply = () => { scroller.scrollTop = targetY; };
    this._stopScrollRestore = stop;
    userEvents.forEach((type) => scroller.addEventListener(type, stop, { passive: true }));
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(apply);
      observer.observe(content);
    }
    requestAnimationFrame(apply);
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
      const page = item.href && isPageLink(item.href) ? pageFromUrl(item.href).page : null;
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
      document.body.classList.toggle('x-scroll-lock', this.mobileNavOpen);
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
    document.body.classList.remove('x-scroll-lock');
  }
}

/**
 * Is there a scroll container between `target` and `page` that can still
 * scroll in the wheel's direction? Then the browser is scrolling it (#1037).
 * @param {EventTarget|null} target
 * @param {HTMLElement} page
 * @param {number} deltaY
 * @returns {boolean}
 */
function innerScrollerTakesWheel(target, page, deltaY) {
  for (let el = target instanceof Element ? target : null; el && el !== page; el = el.parentElement) {
    if (el.scrollHeight <= el.clientHeight + 1) continue;
    const overflowY = getComputedStyle(el).overflowY;
    if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
    const canMove = deltaY > 0
      ? el.scrollTop < el.scrollHeight - el.clientHeight - 1
      : el.scrollTop > 0;
    if (canMove) return true;
  }
  return false;
}

