import { setRule } from '../core/dynamic-style.js';
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
 * move() is the container-level entry point for <div x-move>/[x-move]
 * (tag-map.js). Issue #344: schema/behavior completeness audit found
 * `move.schema.json` had no matching exported `move` function at all, AND
 * `behaviorModules` (index.js) had no `move` key -- so <div x-move>/[x-move]
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
    // The item markers are the classes grid-item / moveable. #879: the
    // data-grid-item / data-moveable attribute spellings were read too, but no
    // schema could declare them (they sit on an item, not on any behavior's
    // host) and no page in the repo wrote them; the class does the same job.
    if (parent.classList.contains('grid-item') ||
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
  // Every child but a style/script/template is an item (the grid-item marker
  // could only ever have re-admitted one of those, which no page does).
  const items = Array.from(container.children).filter(el => !el.matches('style, script, template'));
  return { columns, items, total: items.length };
}

/**
 * Swap two elements with animation
 */
function swapElements(el1, el2, animate = true) {
  if (!el1 || !el2 || el1 === el2) return false;
  
  // The transition is .x-move__item--animated in move.css (#779: it was
  // written onto both elements' style attributes).
  if (animate) {
    el1.classList.add('x-move__item--animated');
    el2.classList.add('x-move__item--animated');
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
 * Wire a move button: on click, swap the button's moveable parent with the
 * item at the index pickTarget(currentIndex, columns) returns, when that index
 * is in range. The four direction behaviors differ only in that index; each
 * carried its own copy of the handler (#883).
 */
function bindMoveButton(button, pickTarget) {
  if (!button) return;

  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const item = findMoveableParent(button);
    if (!item) return;

    const container = item.parentElement;
    const { columns, items } = getGridInfo(container);
    const currentIndex = items.indexOf(item);
    const targetIndex = pickTarget(currentIndex, columns);

    if (targetIndex >= 0 && targetIndex < items.length) {
      swapElements(item, items[targetIndex]);
    }
  };

  button.addEventListener('click', handler);
  return () => button.removeEventListener('click', handler);
}

/**
 * Move Up - Swap with element above (in grid) or previous sibling (in list)
 * Helper Attribute: [x-moveup]
 */
export function moveup(button) {
  // In a grid, move up means swap with item `columns` positions before
  // In a list (1 column), just swap with previous
  return bindMoveButton(button, (i, columns) => (columns > 1 ? i - columns : i - 1));
}

/**
 * Move Down - Swap with element below (in grid) or next sibling (in list)
 * Helper Attribute: [x-movedown]
 */
export function movedown(button) {
  return bindMoveButton(button, (i, columns) => (columns > 1 ? i + columns : i + 1));
}

/**
 * Move Left - Swap with previous sibling
 * Helper Attribute: [x-moveleft]
 */
export function moveleft(button) {
  return bindMoveButton(button, (i) => i - 1);
}

/**
 * Helper Attribute: [x-moveright]
 * Move Right - Swap with next sibling
 */
export function moveright(button) {
  return bindMoveButton(button, (i) => i + 1);
}

/**
 * Move All - Legacy pixel-based movement (kept for backwards compatibility)
 */
// Accumulated offset per element. It used to be read back from the style
// attribute it was written to; since #779 it lives here and reaches the page
// through a generated rule.
const moveallOffsets = new WeakMap();

export function moveall(element, x = 0, y = 0) {
  if (!element) return;
  // position:relative only where nothing positions the element already --
  // the old `style.position || 'relative'` kept an authored position.
  if (getComputedStyle(element).position === 'static') element.classList.add('x-move--offset');
  const prev = moveallOffsets.get(element) || { left: 0, top: 0 };
  const next = { left: prev.left + x, top: prev.top + y };
  moveallOffsets.set(element, next);
  setRule(element, 'offset', { left: `${next.left}px`, top: `${next.top}px` });
}

/**
 * Move - Container entry point for <div x-move> / [x-move]
 * Marks the element with the schema baseClass and wires up any descendant
 * buttons carrying [x-moveup]/[x-movedown]/[x-moveleft]/[x-moveright].
 */
export function move(element) {
  if (!element) return;
  element.classList.add('x-move');

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
