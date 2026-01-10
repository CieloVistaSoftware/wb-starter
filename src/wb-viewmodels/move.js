/**
 * Move Behaviors
 * -----------------------------------------------------------------------------
 * Swap elements in grid/list containers.
 * Exports: moveup, movedown, moveleft, moveright
 * 
 * These behaviors attach click handlers to buttons that swap
 * their parent container with adjacent siblings.
 * 
 * Helper Attributes: [x-move-up], [x-move-down], [x-move-left], [x-move-right]
 * -----------------------------------------------------------------------------
 */

/**
 * Find the moveable parent (grid item or list item)
 */
function findMoveableParent(element) {
  let parent = element.parentElement;
  while (parent) {
    // Check for grid item markers
    if (parent.hasAttribute('data-grid-item') || 
        parent.hasAttribute('data-moveable') ||
        parent.classList.contains('grid-item') ||
        parent.classList.contains('moveable')) {
      return parent;
    }
    // Check if parent's parent is a grid/flex container
    const grandparent = parent.parentElement;
    if (grandparent) {
      const style = getComputedStyle(grandparent);
      if (style.display === 'grid' || style.display === 'flex') {
        return parent;
      }
    }
    parent = parent.parentElement;
  }
  return element.parentElement;
}

/**
 * Get grid dimensions
 */
function getGridInfo(container) {
  const style = getComputedStyle(container);
  const columns = style.gridTemplateColumns.split(' ').length;
  const items = Array.from(container.children).filter(el => 
    el.hasAttribute('data-grid-item') || !el.matches('style, script, template')
  );
  return { columns, items, total: items.length };
}

/**
 * Swap two elements with animation
 */
function swapElements(el1, el2, animate = true) {
  if (!el1 || !el2 || el1 === el2) return false;
  
  if (animate) {
    el1.style.transition = 'transform 0.2s ease';
    el2.style.transition = 'transform 0.2s ease';
  }
  
  const parent = el1.parentElement;
  const next1 = el1.nextElementSibling;
  const next2 = el2.nextElementSibling;
  
  if (next1 === el2) {
    parent.insertBefore(el2, el1);
  } else if (next2 === el1) {
    parent.insertBefore(el1, el2);
  } else {
    parent.insertBefore(el2, next1);
    parent.insertBefore(el1, next2);
  }
  
  // Dispatch event
  parent.dispatchEvent(new CustomEvent('wb:reorder', { 
    detail: { items: Array.from(parent.children) },
    bubbles: true 
  }));
  
  return true;
}

/**
 * Move Up - Swap with element above (in grid) or previous sibling (in list)
 * Helper Attribute: [x-move-up]
 */
export function moveup(button) {
  if (!button) return;
  
  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = findMoveableParent(button);
    if (!item) return;
    
    const container = item.parentElement;
    const { columns, items } = getGridInfo(container);
    const currentIndex = items.indexOf(item);
    
    // In a grid, move up means swap with item `columns` positions before
    // In a list (1 column), just swap with previous
    const targetIndex = columns > 1 ? currentIndex - columns : currentIndex - 1;
    
    if (targetIndex >= 0 && targetIndex < items.length) {
      swapElements(item, items[targetIndex]);
    }
  };
  
  button.addEventListener('click', handler);
  return () => button.removeEventListener('click', handler);
}

/**
 * Move Down - Swap with element below (in grid) or next sibling (in list)
 * Helper Attribute: [x-move-down]
 */
export function movedown(button) {
  if (!button) return;
  
  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = findMoveableParent(button);
    if (!item) return;
    
    const container = item.parentElement;
    const { columns, items } = getGridInfo(container);
    const currentIndex = items.indexOf(item);
    
    const targetIndex = columns > 1 ? currentIndex + columns : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < items.length) {
      swapElements(item, items[targetIndex]);
    }
  };
  
  button.addEventListener('click', handler);
  return () => button.removeEventListener('click', handler);
}

/**
 * Move Left - Swap with previous sibling
 * Helper Attribute: [x-move-left]
 */
export function moveleft(button) {
  if (!button) return;
  
  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = findMoveableParent(button);
    if (!item) return;
    
    const container = item.parentElement;
    const { items } = getGridInfo(container);
    const currentIndex = items.indexOf(item);
    
    if (currentIndex > 0) {
      swapElements(item, items[currentIndex - 1]);
    }
  };
  
  button.addEventListener('click', handler);
  return () => button.removeEventListener('click', handler);
}

/**
 * Helper Attribute: [x-move-right]
 * Move Right - Swap with next sibling
 */
export function moveright(button) {
  if (!button) return;
  
  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = findMoveableParent(button);
    if (!item) return;
    
    const container = item.parentElement;
    const { items } = getGridInfo(container);
    const currentIndex = items.indexOf(item);
    
    if (currentIndex < items.length - 1) {
      swapElements(item, items[currentIndex + 1]);
    }
  };
  
  button.addEventListener('click', handler);
  return () => button.removeEventListener('click', handler);
}

/**
 * Move All - Legacy pixel-based movement (kept for backwards compatibility)
 */
export function moveall(element, x = 0, y = 0) {
  if (!element) return;
  element.style.position = element.style.position || 'relative';
  const left = parseFloat(element.style.left || 0);
  const top = parseFloat(element.style.top || 0);
  element.style.left = (left + x) + 'px';
  element.style.top = (top + y) + 'px';
}

export default { moveup, movedown, moveleft, moveright, moveall };
