/**
 * Builder Context Menu Module
 * Right-click context menu for components
 * 
 * @module builder-context-menu
 */

import { showDocs } from './builder-docs.js';

/**
 * Show context menu at position
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {HTMLElement} wrapper - Component wrapper
 */
export function showContextMenu(x, y, wrapper) {
  // Remove existing menu
  document.getElementById('builderContextMenu')?.remove();

  const c = JSON.parse(wrapper.dataset.c);
  const menu = document.createElement('div');
  menu.id = 'builderContextMenu';
  menu.className = 'context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: var(--bg-secondary, #1f2937);
    border: 1px solid var(--border-color, #374151);
    border-radius: 8px;
    padding: 0.5rem 0;
    min-width: 200px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: fadeIn 0.15s ease;
  `;

  menu.innerHTML = `
    <button class="ctx-item" onclick="viewSchema('${c.b}')">View Schema</button>
    <button class="ctx-item" onclick="inspectElement('${wrapper.id}')">Inspect</button>
    <hr class="ctx-divider">
    <button class="ctx-item" onclick="selComp(document.getElementById('${wrapper.id}'))">Edit Properties</button>
    <hr class="ctx-divider">
    <button class="ctx-item" onclick="dup('${wrapper.id}')">Duplicate</button>
    <button class="ctx-item" onclick="moveUp('${wrapper.id}')">Move Up</button>
    <button class="ctx-item" onclick="moveDown('${wrapper.id}')">Move Down</button>
    <hr class="ctx-divider">
    <button class="ctx-item ctx-item--danger" onclick="del('${wrapper.id}')">Delete</button>
  `;

  // Style the menu items
  const style = document.createElement('style');
  style.textContent = `
    .ctx-item {
      display: block;
      width: 100%;
      padding: 0.5rem 1rem;
      text-align: left;
      background: none;
      border: none;
      color: var(--text-primary, #fff);
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.15s;
    }
    .ctx-item:hover { background: var(--bg-tertiary, #374151); }
    .ctx-item--danger { color: #ef4444; }
    .ctx-item--danger:hover { background: rgba(239, 68, 68, 0.1); }
    .ctx-divider { border: none; border-top: 1px solid var(--border-color, #374151); margin: 0.25rem 0; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `;
  menu.appendChild(style);

  document.body.appendChild(menu);

  // Adjust position if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 10) + 'px';

  // Close on click outside
  setTimeout(() => {
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    document.addEventListener('click', closeMenu);
  }, 0);
}

/**
 * Inspect element in inspector panel
 * @param {string} elementId - ID of element to inspect
 */
export function inspectElement(elementId) {
  // Close context menu
  document.getElementById('builderContextMenu')?.remove();

  const element = document.getElementById(elementId);
  if (!element) return;

  // Trigger browser inspect if available
  if (window.inspect) {
    window.inspect(element);
  } else if (window.chrome && window.chrome.devtools) {
    // Chrome devtools
    window.chrome.devtools.inspectedWindow.eval(`inspect(document.getElementById('${elementId}'))`);
  } else {
    // Fallback: log to console
    console.log('Inspecting element:', element);
    console.log('Element details:', {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      dataset: element.dataset,
      attributes: Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`),
      computedStyle: window.getComputedStyle(element),
      boundingRect: element.getBoundingClientRect()
    });
  }
}

/**
 * Create context menu handler
 * @returns {Function} Event handler
 */
export function createContextMenuHandler() {
  return (e) => {
    if (!e.shiftKey) return;
    const wrapper = e.target.closest('.dropped');
    if (!wrapper) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, wrapper);
  };
}

// Expose to window
window.showContextMenu = showContextMenu;
window.viewSchema = viewSchema;
window.inspectElement = inspectElement;
