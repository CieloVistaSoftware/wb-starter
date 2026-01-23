/**
 * Draggable Behavior
 * Helper Attribute: [x-draggable]
 * Make an element draggable.
 * 
 * Options:
 *   - handle: CSS selector for drag handle (default: element itself)
 *   - axis: 'x' | 'y' | 'both' (default: 'both')
 *   - bounds: 'viewport' | 'parent' | CSS selector
 *   - grid: snap to grid size in pixels
 *   - persist: localStorage key to save/restore position
 */
export function draggable(element, options = {}) {
  const axisAttr = options.axis || element.dataset.axis;
  const lockY = options.lockY === true || element.dataset.lockY === 'true';
  const config = {
    handle: options.handle || element.dataset.handle,
    // Default to free movement on both axes unless specified. If axis is
    // provided (x|y|both) we use it; otherwise honor lockY flag (for easy opt-in).
    axis: axisAttr || (lockY ? 'x' : 'both'),
    bounds: options.bounds || element.dataset.bounds, // selector, 'parent', 'viewport'
    grid: parseInt(options.grid || element.dataset.grid || '0', 10),
    persist: options.persist || element.dataset.persist || null,
    ...options
  };

  // Persistence helpers
  const storageKey = config.persist ? `wb-draggable-${config.persist}` : null;
  
  const loadPosition = () => {
    if (!storageKey) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && saved.x !== undefined && saved.y !== undefined) {
        return saved;
      }
    } catch {}
    return null;
  };
  
  const savePosition = (x, y) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ x, y }));
    } catch {}
  };

  element.classList.add('wb-draggable');

  // Get handle element
  const handle = config.handle ? element.querySelector(config.handle) : element;
  if (!handle) {
    console.warn('[WB] Draggable: Handle not found');
    return () => {};
  }

  handle.classList.add('wb-draggable__handle');
  handle.style.cursor = 'grab';

  // State
  let isDragging = false;
  let startX, startY;
  let initialLeft, initialTop;
  // Track last computed effective axis for diagnostics
  let lastEffectiveAxis = null;

  // Ensure element is positioned
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }
  
  // Restore persisted position if available
  const savedPos = loadPosition();
  if (savedPos) {
    element.style.left = `${savedPos.x}px`;
    element.style.top = `${savedPos.y}px`;
  } else {
    // Only set left/top if not already present. Use current offsets so the
    // element keeps its exact position on first interaction (prevents jumps).
    if (!element.style.left) {
      element.style.left = `${element.offsetLeft}px`;
    }
    if (!element.style.top) {
      element.style.top = `${element.offsetTop}px`;
    }
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

  // Pointer lifecycle: wait for threshold before starting an actual drag so
  // a simple click (mousedown + mouseup) does not move the element.
  let pointerDown = false;
  let dragStarted = false;
  // Increase threshold to avoid accidental automated click movements being
  // interpreted as a drag. Real user drags will typically move more than this.
  const DRAG_THRESHOLD = 36; // pixels
  // primaryAxis records the user's initial intended direction when drag starts
  let primaryAxis = null; // 'x' | 'y'

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only

    e.preventDefault();
    pointerDown = true;
    dragStarted = false;
    primaryAxis = null;

    startX = e.clientX;
    startY = e.clientY;
    // initialLeft/Top are the numeric style values (not offsetLeft). We use
    // style.left/top so starting a drag doesn't double-position the element.
    initialLeft = parseInt(element.style.left, 10) || 0;
    initialTop = parseInt(element.style.top, 10) || 0;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!pointerDown) return;

    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Always record deltas for diagnostics (visible in failure snapshots)
    try {
      element.setAttribute('data-wb-deltas', JSON.stringify({ deltaX, deltaY }));
    } catch (err) {}

    // Don't start dragging until movement exceeds threshold (avoids click jitter)
    if (!dragStarted) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) {
        return;
      }
      // Determine user's primary drag axis at the moment dragging starts
      primaryAxis = Math.abs(deltaY) > Math.abs(deltaX) ? 'y' : 'x';

      dragStarted = true;
      isDragging = true;
      element.classList.add('wb-draggable--dragging');
      handle.style.cursor = 'grabbing';
      // Debug: record starting axis decision and config for troubleshooting
      try {
        console.log('[WB] draggable:start', { id: element.id, configAxis: config.axis, primaryAxis, startX, startY });
      } catch (err) {}
      try {
        element.dataset.wbLastDrag = JSON.stringify({ startX, startY, configAxis: config.axis, primaryAxis });
      } catch (err) {}
      element.dispatchEvent(new CustomEvent('wb:drag:start', {
        bubbles: true,
        detail: { x: initialLeft, y: initialTop }
      }));
    }

    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;

    // Decide effective axis behavior: if configured axis is a strict axis
    // but the user is dragging primarily in the other direction, allow both.
    let effectiveAxis = config.axis;
    if (config.axis !== 'both' && primaryAxis && primaryAxis !== config.axis) {
      effectiveAxis = 'both';
    }
    // Save for diagnostics on drag end
    lastEffectiveAxis = effectiveAxis;

    // Apply axis constraint
    if (effectiveAxis === 'x') {
      newTop = initialTop;
    } else if (effectiveAxis === 'y') {
      newLeft = initialLeft;
    }

    // Snap to grid
    newLeft = snapToGrid(newLeft);
    newTop = snapToGrid(newTop);

    // Apply bounds
    const constrained = constrain(newLeft, newTop);

    // Debug: log movement values for troubleshooting
    try {
      console.log('[WB] draggable:move', { id: element.id, deltaX, deltaY, effectiveAxis, x: constrained.x, y: constrained.y });
    } catch (err) {}
    try {
      element.dataset.wbLastDrag = JSON.stringify({ deltaX, deltaY, effectiveAxis, x: constrained.x, y: constrained.y });
    } catch (err) {}

    element.style.left = `${constrained.x}px`;
    element.style.top = `${constrained.y}px`;

    element.dispatchEvent(new CustomEvent('wb:drag:move', {
      bubbles: true,
      detail: { x: constrained.x, y: constrained.y }
    }));
  };

  const onMouseUp = () => {
    if (!pointerDown) return;

    pointerDown = false;

    // If user never moved past threshold, treat as click — don't change state
    if (!dragStarted) {
      // Restore original position to guard against accidental shifts during click
      element.style.left = `${initialLeft}px`;
      element.style.top = `${initialTop}px`;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      return;
    }

    isDragging = false;
    dragStarted = false;
    element.classList.remove('wb-draggable--dragging');
    handle.style.cursor = 'grab';

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    try {
      const finalX = parseInt(element.style.left, 10) || 0;
      const finalY = parseInt(element.style.top, 10) || 0;
      // Make final diagnostics visible in the DOM snapshot and console
      element.setAttribute('data-wb-last-drag', JSON.stringify({ finalX, finalY, primaryAxis, effectiveAxis: lastEffectiveAxis }));
      try { console.log('[WB] draggable:end', { id: element.id, finalX, finalY, primaryAxis, effectiveAxis: lastEffectiveAxis }); } catch (err) {}
    } catch (err) {}

    const finalX = parseInt(element.style.left, 10) || 0;
    const finalY = parseInt(element.style.top, 10) || 0;
    
    // Save position if persist enabled
    savePosition(finalX, finalY);
    
    element.dispatchEvent(new CustomEvent('wb:drag:end', {
      bubbles: true,
      detail: { x: finalX, y: finalY }
    }));
  };

  handle.addEventListener('mousedown', onMouseDown);

  // Touch support
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0, preventDefault: () => {} });
  };

  const onTouchMove = (e) => {
    if (!pointerDown) return;
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
  element.dataset.wbReady = (element.dataset.wbReady || '') + ' draggable';

  // Cleanup
  return () => {
    element.classList.remove('wb-draggable', 'wb-draggable--dragging');
    handle.classList.remove('wb-draggable__handle');
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
