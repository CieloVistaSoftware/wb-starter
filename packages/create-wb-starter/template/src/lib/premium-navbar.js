/**
 * Premium Navbar - Scroll Effect Handler
 * Adds visual feedback when user scrolls (shadow + enhanced blur)
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
  };
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumNavbar);
  } else {
    initPremiumNavbar();
  }
})();
