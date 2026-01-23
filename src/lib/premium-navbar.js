/**
 * Premium Navbar - Scroll Effect + Active Page Handler
 * - Adds visual feedback when user scrolls (shadow + enhanced blur)
 * - Highlights current/active page link based on URL or page name
 */

(() => {
  const initPremiumNavbar = () => {
    const navbar = document.querySelector('wb-navbar');
    
    if (!navbar) return;
    
    // Track scroll and add/remove scrolled class
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
    
    // Apply active style class from attribute
    applyActiveStyle(navbar);
    
    // Apply active color from attribute
    applyActiveColor(navbar);
    
    // Detect and highlight active page
    highlightActivePage(navbar);
    
    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'active-style') {
            applyActiveStyle(navbar);
          }
          if (mutation.attributeName === 'active-color') {
            applyActiveColor(navbar);
          }
        }
      });
    });
    
    observer.observe(navbar, { attributes: true });
  };
  
  /**
   * Apply active style class based on attribute
   */
  function applyActiveStyle(navbar) {
    // Remove existing active style classes
    const styleClasses = ['none', 'color', 'underline', 'pill', 'arrow', 'dot', 'glow'];
    styleClasses.forEach(style => {
      navbar.classList.remove(`wb-navbar--active-${style}`);
    });
    
    // Get active style from attribute (default: underline)
    const activeStyle = navbar.getAttribute('active-style') || 'underline';
    navbar.classList.add(`wb-navbar--active-${activeStyle}`);
  }
  
  /**
   * Apply active color CSS variable from attribute
   */
  function applyActiveColor(navbar) {
    const activeColor = navbar.getAttribute('active-color') || '#6366f1';
    navbar.style.setProperty('--wb-navbar-active-color', activeColor);
  }
  
  /**
   * Highlight the active page link
   * Checks URL path, hash, and page name
   */
  function highlightActivePage(navbar) {
    const links = navbar.querySelectorAll('a:not(:first-of-type)');
    const currentPath = window.location.pathname.toLowerCase();
    const currentHash = window.location.hash.toLowerCase();
    const currentPage = getCurrentPageName();
    
    links.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      
      const href = link.getAttribute('href') || '';
      const linkText = link.textContent.trim().toLowerCase();
      
      // Check for match
      let isActive = false;
      
      // 1. Exact path match
      if (href && currentPath && href.toLowerCase() === currentPath) {
        isActive = true;
      }
      
      // 2. Hash match (for single-page apps)
      if (href && currentHash && href.toLowerCase() === currentHash) {
        isActive = true;
      }
      
      // 3. Page name match (for builder)
      if (currentPage && linkText === currentPage.toLowerCase()) {
        isActive = true;
      }
      
      // 4. Check if link href ends with current page
      if (currentPath !== '/' && href && href.toLowerCase().endsWith(currentPath)) {
        isActive = true;
      }
      
      // 5. Home page special case
      if ((currentPath === '/' || currentPath === '/index.html') && 
          (href === '/' || href === '#home' || href === 'index.html' || linkText === 'home')) {
        isActive = true;
      }
      
      if (isActive) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }
  
  /**
   * Get current page name from builder or URL
   */
  function getCurrentPageName() {
    // Check builder state
    if (window.getPages) {
      const pages = window.getPages();
      const currentPageId = localStorage.getItem('wb-current-page');
      const page = pages.find(p => p.id === currentPageId);
      if (page) return page.name;
    }
    
    // Fallback to URL
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename.replace('.html', '').replace('-', ' ');
  }
  
  // Expose function to manually set active page
  window.setNavbarActivePage = (pageName) => {
    const navbar = document.querySelector('wb-navbar');
    if (!navbar) return;
    
    const links = navbar.querySelectorAll('a:not(:first-of-type)');
    links.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      
      const linkText = link.textContent.trim().toLowerCase();
      if (linkText === pageName.toLowerCase()) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  };
  
  // Expose initializer so late-inserted navbars can be picked up
  window.initPremiumNavbar = initPremiumNavbar;

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumNavbar);
  } else {
    initPremiumNavbar();
  }
  
  // Also listen for page changes in builder
  document.addEventListener('wb:page:switched', (e) => {
    const navbar = document.querySelector('wb-navbar');
    if (navbar && e.detail?.pageName) {
      window.setNavbarActivePage(e.detail.pageName);
    }
  });
})();
