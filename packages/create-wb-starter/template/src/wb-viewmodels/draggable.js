/**
 * Draggable Behavior
 * Helper Attribute: [x-draggable]
 * Make an element draggable.
 */
export function draggable(element, options = {}) {
  // #390: was element.dataset.* (data-handle/data-axis/data-bounds/
  // data-grid) -- but every real usage (demos/site/interactive.html:
  // `<div x-draggable axis="x">`) authors plain attributes, and Tier-1 Law 11
  // forbids data-* on wb-*/x-* elements anyway. dataset.axis was always
  // undefined for these demos, so axis="x"/"y" silently did nothing --
  // every draggable behaved as axis="both" regardless of what was set.
  const config = {
    handle: options.handle || element.getAttribute('handle'),
    axis: options.axis || element.getAttribute('axis') || 'both', // x, y, both
    bounds: options.bounds || element.getAttribute('bounds'), // selector, 'parent', 'viewport'
    grid: parseInt(options.grid || element.getAttribute('grid') || '0', 10),
    ...options
  };

  // #448: no classList.add('x-draggable') -- no CSS selector anywhere
  // depends on the bare class.

  // Get handle element
  const handle = config.handle ? element.querySelector(config.handle) : element;
  if (!handle) {
    console.warn('[WB] Draggable: Handle not found');
    return () => {};
  }

  handle.classList.add('x-draggable__handle');
  handle.style.cursor = 'grab';

  // State
  let isDragging = false;
  let startX, startY;
  let initialLeft, initialTop;

  // Ensure element is positioned
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }

  // Get bounds
  const getBounds = () => {
    if (!config.bounds) return null;
    
    if (config.bounds === 'viewport') {
      return {
        left: 0,
        top: 0,
        right: window.innerWidth - element.offsetWidth,
        bottom: window.innerHeight - element.offsetHeight
      };
    }
    
    if (config.bounds === 'parent') {
      const parent = element.parentElement;
      return {
        left: 0,
        top: 0,
        right: parent.clientWidth - element.offsetWidth,
        bottom: parent.clientHeight - element.offsetHeight
      };
    }
    
    const boundsEl = document.querySelector(config.bounds);
    if (boundsEl) {
      const boundsRect = boundsEl.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      return {
        left: boundsRect.left - elementRect.left + element.offsetLeft,
        top: boundsRect.top - elementRect.top + element.offsetTop,
        right: boundsRect.right - elementRect.left - element.offsetWidth + element.offsetLeft,
        bottom: boundsRect.bottom - elementRect.top - element.offsetHeight + element.offsetTop
      };
    }
    
    return null;
  };

  // Constrain position to bounds
  const constrain = (x, y) => {
    const bounds = getBounds();
    if (!bounds) return { x, y };
    
    return {
      x: Math.max(bounds.left, Math.min(bounds.right, x)),
      y: Math.max(bounds.top, Math.min(bounds.bottom, y))
    };
  };

  // Snap to grid
  const snapToGrid = (value) => {
    if (!config.grid) return value;
    return Math.round(value / config.grid) * config.grid;
  };

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    
    e.preventDefault();
    isDragging = true;
    
    startX = e.clientX;
    startY = e.clientY;
    // #390: was element.offsetLeft/offsetTop (position within the
    // offsetParent, from normal document flow) -- but this element is
    // `position: relative` (forced below the constructor's computedStyle
    // check), where style.left/top are offsets FROM the normal flow
    // position, a different coordinate space entirely. Reading the
    // CURRENTLY APPLIED left/top (0 on the first drag, whatever was last
    // set on subsequent drags) keeps the baseline in the same coordinate
    // space the drag writes back into -- confirmed live: the old
    // offsetLeft-based version moved the element several multiples of
    // the actual mouse delta, worse on every subsequent drag.
    initialLeft = parseFloat(element.style.left) || 0;
    initialTop = parseFloat(element.style.top) || 0;
    
    element.classList.add('x-draggable--dragging');
    handle.style.cursor = 'grabbing';
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    element.dispatchEvent(new CustomEvent('wb:drag:start', {
      bubbles: true,
      detail: { x: initialLeft, y: initialTop }
    }));
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    let deltaX = e.clientX - startX;
    let deltaY = e.clientY - startY;
    
    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;
    
    // Apply axis constraint
    if (config.axis === 'x') {
      newTop = initialTop;
    } else if (config.axis === 'y') {
      newLeft = initialLeft;
    }
    
    // Snap to grid
    newLeft = snapToGrid(newLeft);
    newTop = snapToGrid(newTop);
    
    // Apply bounds
    const constrained = constrain(newLeft, newTop);
    
    element.style.left = `${constrained.x}px`;
    element.style.top = `${constrained.y}px`;
    
    element.dispatchEvent(new CustomEvent('wb:drag:move', {
      bubbles: true,
      detail: { x: constrained.x, y: constrained.y }
    }));
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    
    isDragging = false;
    element.classList.remove('x-draggable--dragging');
    handle.style.cursor = 'grab';
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    element.dispatchEvent(new CustomEvent('wb:drag:end', {
      bubbles: true,
      detail: { x: element.offsetLeft, y: element.offsetTop }
    }));
  };

  handle.addEventListener('mousedown', onMouseDown);

  // Touch support
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0, preventDefault: () => {} });
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touchPoint = e.touches[0];
    onMouseMove({ clientX: touchPoint.clientX, clientY: touchPoint.clientY, preventDefault: () => {} });
  };

  handle.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onMouseUp);

  // Expose methods
  element.wbDraggable = {
    setPosition: (x, y) => {
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    },
    getPosition: () => ({ x: element.offsetLeft, y: element.offsetTop })
  };

  // Mark as ready
  // Cleanup
  return () => {
    element.classList.remove('x-draggable', 'x-draggable--dragging');
    handle.classList.remove('x-draggable__handle');
    handle.style.cursor = '';
    handle.removeEventListener('mousedown', onMouseDown);
    handle.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onMouseUp);
    delete element.wbDraggable;
  };
}

export default draggable;
