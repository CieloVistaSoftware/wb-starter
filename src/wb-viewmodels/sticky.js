/**
 * Sticky Behavior
 * -----------------------------------------------------------------------------
 * Makes an element stick to the top of the viewport when scrolling past it
 * 
 * Helper Attribute: [x-sticky]
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <nav x-sticky>...</nav>
 *   <header x-sticky offset="60" z-index="1000">...</header>
 * 
 * Options:
 *   offset    - Pixels from top when stuck (default: 0)
 *   z-index   - Z-index when stuck (default: 100)
 *   threshold - Scroll position to trigger (default: element's top)
 *   class     - Class to add when stuck (default: "is-stuck")
 *   animate   - Add smooth transition (default: true)
 */

export function sticky(element, options = {}) {
  // Add base class for compliance
  element.classList.add('wb-sticky');

  // Config from options and data attributes
  const config = {
    offset: parseInt(options.offset || element.dataset.offset || '0', 10),
    zIndex: parseInt(options.zIndex || element.dataset.zIndex || '100', 10),
    threshold: options.threshold || element.dataset.threshold || null,
    stuckClass: options.class || element.dataset.class || 'is-stuck',
    animate: options.animate !== false && element.dataset.animate !== 'false'
  };

  // Store original styles
  const originalStyles = {
    position: element.style.position,
    top: element.style.top,
    left: element.style.left,
    right: element.style.right,
    width: element.style.width,
    zIndex: element.style.zIndex,
    transition: element.style.transition
  };

  // Get initial position
  let triggerPoint = config.threshold ? parseInt(config.threshold, 10) : null;
  let elementRect = null;
  let placeholder = null;
  let isStuck = false;

  // Calculate trigger point
  function updateTriggerPoint() {
    if (isStuck && placeholder) {
      elementRect = placeholder.getBoundingClientRect();
      triggerPoint = config.threshold ? parseInt(config.threshold, 10) : (window.scrollY + elementRect.top);
    } else {
      elementRect = element.getBoundingClientRect();
      triggerPoint = config.threshold ? parseInt(config.threshold, 10) : (window.scrollY + elementRect.top);
    }
  }

  // Create placeholder to prevent layout shift
  function createPlaceholder() {
    if (placeholder) return;
    
    placeholder = document.createElement('div');
    placeholder.className = 'sticky-placeholder';
    placeholder.style.cssText = `
      width: ${elementRect.width}px;
      height: ${elementRect.height}px;
      visibility: hidden;
      pointer-events: none;
    `;
    element.parentNode.insertBefore(placeholder, element);
  }

  // Remove placeholder
  function removePlaceholder() {
    if (placeholder) {
      placeholder.remove();
      placeholder = null;
    }
  }

  // Stick the element
  function stick() {
    if (isStuck) return;
    
    // Update rect before creating placeholder
    elementRect = element.getBoundingClientRect();
    createPlaceholder();
    
    element.style.position = 'fixed';
    element.style.top = `${config.offset}px`;
    element.style.left = `${elementRect.left}px`;
    element.style.width = `${elementRect.width}px`;
    element.style.zIndex = config.zIndex;
    
    if (config.animate) {
      element.style.transition = 'box-shadow 0.2s ease';
    }
    
    element.classList.add(config.stuckClass);
    isStuck = true;
    
    // Dispatch event
    element.dispatchEvent(new CustomEvent('wb:sticky:stuck', {
      bubbles: true,
      detail: { offset: config.offset }
    }));
  }

  // Unstick the element
  function unstick() {
    if (!isStuck) return;
    
    // Restore original styles
    element.style.position = originalStyles.position;
    element.style.top = originalStyles.top;
    element.style.left = originalStyles.left;
    element.style.width = originalStyles.width;
    element.style.zIndex = originalStyles.zIndex;
    element.style.transition = originalStyles.transition;
    
    element.classList.remove(config.stuckClass);
    removePlaceholder();
    isStuck = false;
    
    // Dispatch event
    element.dispatchEvent(new CustomEvent('wb:sticky:unstuck', {
      bubbles: true
    }));
  }

  // Scroll handler
  function handleScroll() {
    const scrollY = window.scrollY;
    
    if (scrollY >= triggerPoint - config.offset) {
      stick();
    } else {
      unstick();
    }
  }

  // Resize handler - recalculate dimensions
  function handleResize() {
    if (isStuck) {
      // Temporarily unstick to get correct dimensions
      const wasStuck = isStuck;
      unstick();
      updateTriggerPoint();
      if (wasStuck && window.scrollY >= triggerPoint - config.offset) {
        stick();
      }
    } else {
      updateTriggerPoint();
    }
  }

  // Initialize
  updateTriggerPoint();
  
  // Check initial state
  if (window.scrollY >= triggerPoint - config.offset) {
    stick();
  }

  // Add listeners
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });

  // Add CSS for stuck state
  if (!document.getElementById('wb-sticky-styles')) {
    const style = document.createElement('style');
    style.id = 'wb-sticky-styles';
    style.textContent = `
      .is-stuck {
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      }
      
      .sticky-placeholder {
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);
  }

  // Mark as ready
  element.dataset.wbReady = 'sticky';

  // API
  element.wbSticky = {
    isStuck: () => isStuck,
    stick,
    unstick,
    refresh: () => {
      updateTriggerPoint();
      handleScroll();
    }
  };

  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleResize);
    unstick();
    element.classList.remove(config.stuckClass);
    delete element.wbSticky;
  };
}

export default { sticky };
