/**
 * Ripple Behavior
 * -----------------------------------------------------------------------------
 * Material-style ripple effect on click.
 * 
 * Helper Attribute: [x-ripple]
 * -----------------------------------------------------------------------------
 */
export function ripple(element, options = {}) {
  const config = {
    color: options.color || element.getAttribute('ripple-color') || element.getAttribute('ripple-color') || 'rgba(255, 255, 255, 0.4)',
    duration: parseInt(options.duration || element.getAttribute('ripple-duration') || element.getAttribute('ripple-duration') || '600', 10),
    centered: options.centered ?? (element.hasAttribute('data-ripple-centered') || element.hasAttribute('ripple-centered')),
    ...options
  };

  // .wb-ripple in effects.css supplies position:relative + overflow:hidden —
  // no need to set them inline here.
  element.classList.add('wb-ripple');

  const createRipple = (e) => {
    const rect = element.getBoundingClientRect();
    
    // Calculate ripple size (should cover entire element)
    const size = Math.max(rect.width, rect.height) * 2;
    
    // Calculate position
    let x, y;
    if (config.centered) {
      x = rect.width / 2;
      y = rect.height / 2;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    // Create ripple element
    const rippleEl = document.createElement('span');
    rippleEl.className = 'wb-ripple__wave';
    rippleEl.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: ${config.color};
      pointer-events: none;
      transform: scale(0);
      animation: wb-ripple-animation ${config.duration}ms ease-out forwards;
      width: ${size}px;
      height: ${size}px;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
    `;

    element.appendChild(rippleEl);

    // Remove after animation
    setTimeout(() => {
      rippleEl.remove();
    }, config.duration);
  };

  // Add keyframes if not already present
  if (!document.getElementById('wb-ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'wb-ripple-styles';
    style.textContent = `
      @keyframes wb-ripple-animation {
        to {
          transform: scale(1);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // mousedown, not click -- ripple should start the instant the button is
  // pressed, not wait for the full click (press+release) to complete.
  // Both listeners used to be attached here, firing createRipple TWICE per
  // click and stacking two overlapping ripple spans (confirmed live and via
  // Playwright strict-mode locator violation: ".wb-ripple__wave resolved to
  // 2 elements" after a single click) (#354).
  element.addEventListener('mousedown', createRipple);

  // Mark as ready
  // Cleanup
  return () => {
    element.classList.remove('wb-ripple');
    element.removeEventListener('mousedown', createRipple);
    // Remove any existing ripples
    element.querySelectorAll('.wb-ripple__wave').forEach(r => r.remove());
  };
}

export default ripple;
