/**
 * Move Behaviors
 * -----------------------------------------------------------------------------
 * Swap elements in grid/list containers.
 * Exports: move, moveup, movedown, moveleft, moveright, moveall
 *
 * moveup/movedown/moveleft/moveright attach click handlers to buttons that
 * swap their parent container with adjacent siblings. Helper attributes:
 * [x-moveup], [x-movedown], [x-moveleft], [x-moveright] (matches the
 * hyphen-free keys registered in wb-viewmodels/index.js's behaviorModules --
 * NOT the hyphenated [x-move-up] etc this comment used to (incorrectly)
 * document).
 *
 * move() is the container-level entry point for <wb-move>/[x-move]
 * (tag-map.js). Issue #344: schema/behavior completeness audit found
 * `move.schema.json` had no matching exported `move` function at all, AND
 * `behaviorModules` (index.js) had no `move` key -- so <wb-move>/[x-move]
 * threw "Unknown behavior: move" the moment anything tried to use it. This
 * adds the missing entry point: it marks the container with the schema's
 * baseClass and wires any descendant buttons carrying the per-direction
 * attributes above, the same self-sufficient pattern as control()/fixCard().
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
 * Helper Attribute: [x-moveup]
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
 * Helper Attribute: [x-movedown]
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
 * Helper Attribute: [x-moveleft]
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
 * Helper Attribute: [x-moveright]
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

/**
 * Move - Container entry point for <wb-move> / [x-move]
 * Marks the element with the schema baseClass and wires up any descendant
 * buttons carrying [x-moveup]/[x-movedown]/[x-moveleft]/[x-moveright].
 */
export function move(element) {
  if (!element) return;
  element.classList.add('wb-move');

  const cleanups = [];
  const wire = (attr, fn) => {
    element.querySelectorAll(`[${attr}]`).forEach(btn => {
      const cleanup = fn(btn);
      if (cleanup) cleanups.push(cleanup);
    });
  };
  wire('x-moveup', moveup);
  wire('x-movedown', movedown);
  wire('x-moveleft', moveleft);
  wire('x-moveright', moveright);

  return () => cleanups.forEach(fn => fn());
}

export default { move, moveup, movedown, moveleft, moveright, moveall };
