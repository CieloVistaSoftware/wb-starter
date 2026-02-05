/**
 * Hero sections with dynamic background effects (particles, cosmic orbs).
 * - `<wb-hero>` component with variant-based effects.
 */
export function cc() {}

/**
 * Hero Component
 * 
 * Applies dynamic background effects to hero sections based on the
 * selected variant (particles, cosmic, etc.).
 * 
 * Custom Tag: `<wb-hero>`
 * 
 * @param {HTMLElement} element - The target element to enhance
 * @param {Object} [options] - Configuration options
 * @param {string} [options.variant] - Effect variant: default, particles, cosmic
 */
export function hero(element, options = {}) {
  // Merge options and data attributes
  const config = {
    variant: options.variant || element.dataset.variant || 'default',
    // Other config is handled by the template engine
  };

  // ---------------------------------------------------------
  // Inject Background Effects (Only if not already present)
  // ---------------------------------------------------------
  
  if (config.variant === 'particles') {
    let stars = element.querySelector('.wb-hero__stars');
    
    // Only proceed if the container exists (provided by template or user)
    if (stars) {
        // Check if stars are already generated (more than just the shooting star)
        // The template has 1 child (shooting star) or empty
        if (stars.children.length <= 1) {
            // Create 50 stars
            for (let i = 0; i < 50; i++) {
                const star = document.createElement('div');
                star.className = 'wb-hero__star';
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 3}s`;
                stars.appendChild(star);
            }
        }
    }
  }
  
  // Cosmic variant orbs are handled by template, but if we wanted random positions we could do it here.
  // For now, the template handles the static orbs.
}
