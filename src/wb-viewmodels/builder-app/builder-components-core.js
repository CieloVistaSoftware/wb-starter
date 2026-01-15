/**
 * Builder Components Module
 * Handles component creation, deletion, duplication, and movement
 * 
 * @module builder-components
 */

import { addElementToCanvas } from './builder-canvas-sections.js';
import { addResizeHandle } from './builder-editing.js';
import { updateBadges } from './builder-incomplete.js';

// Component ID counter
let componentIdCounter = 0;

/**
 * Set the component ID counter (for restoring state)
 * @param {number} value - New counter value
 */
export function setComponentIdCounter(value) {
  componentIdCounter = value;
}

/**
 * Get current component ID counter
 * @returns {number} Current counter value
 */
export function getComponentIdCounter() {
  return componentIdCounter;
}

/**
 * Generate unique ID based on component type
 * @param {Object} c - Component configuration
 * @returns {string} Generated ID
 */
export function genId(c) {
  const base = (c.b || c.t || 'el').toLowerCase().replace(/[^a-z0-9]/g, '');
  return base + '-' + (++componentIdCounter);
}

/**
 * Create a DOM element from component configuration
 * @param {Object} c - Component configuration
 * @param {string} id - Element ID
 * @returns {HTMLElement} Created element
 */
export function mkEl(c, id) {
  const t = c.t || 'div';
  const el = document.createElement(t);
  el.id = id + '-el';

  if (c.b) el.dataset.wb = c.b;
  if (c.d) {
    for (const [k, v] of Object.entries(c.d)) {
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'hoverText') el.setAttribute('title', v);
      else if (k === 'src' && ['IMG', 'AUDIO', 'VIDEO', 'SOURCE', 'IFRAME'].includes(el.tagName)) el.src = v;
      else if (k === 'placeholder') el.placeholder = v;
      else if (k === 'href') {
        el.href = v;
        // If href is an anchor (starts with #) and no element exists with that ID, create it
        if (typeof v === 'string' && v.startsWith('#')) {
          const targetId = v.slice(1);
          if (targetId && !document.getElementById(targetId)) {
            const anchorTarget = document.createElement('div');
            anchorTarget.id = targetId;
            anchorTarget.style.height = '1px';
            anchorTarget.style.width = '1px';
            anchorTarget.style.position = 'relative';
            anchorTarget.style.pointerEvents = 'none';
            anchorTarget.setAttribute('data-generated-anchor', 'true');
            const canvas = document.getElementById('canvas') || document.body;
            canvas.appendChild(anchorTarget);
          }
        }
      }
      else if (k === 'type' && t === 'input') el.type = v;
      else el.dataset[k] = v;
    }

    // Fallback: Use label as text if text is missing
    if (!c.d.text && c.d.label && ['BUTTON', 'A', 'LABEL', 'SPAN', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
      el.textContent = c.d.label;
    }
  }

  // Handle components with predefined children
  if (c.children && Array.isArray(c.children)) {
    const createChild = (childDef) => {
      const tagName = childDef.t || 'div';
      const childEl = document.createElement(tagName);

      if (childDef.d) {
        Object.entries(childDef.d).forEach(([k, v]) => {
          if (k === 'class') childEl.className = v;
          else childEl.setAttribute(k, v);
        });
      }

      if (childDef.title) childEl.dataset.title = childDef.title;
      if (childDef.tabTitle) childEl.dataset.tabTitle = childDef.tabTitle;
      if (childDef.value) childEl.value = childDef.value;
      if (childDef.content) childEl.innerHTML = childDef.content;
      if (childDef.text) childEl.textContent = childDef.text;

      if (childDef.children && Array.isArray(childDef.children)) {
        childDef.children.forEach(grandChild => {
          childEl.appendChild(createChild(grandChild));
        });
      }

      // Make semantic children contenteditable
      const semanticTags = [
        'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'BUTTON', 'A', 'LI', 'LABEL',
        'SUMMARY', 'DT', 'DD', 'SMALL', 'STRONG', 'EM', 'B', 'I', 'U', 'TH', 'TD'
      ];
      if (semanticTags.includes(tagName.toUpperCase()) || (childDef.d && childDef.d.text)) {
        childEl.setAttribute('contenteditable', 'true');
        childEl.classList.add('canvas-editable');
        childEl.dataset.editableKey = childDef.content ? 'content' : 'text';
      }

      return childEl;
    };

    c.children.forEach(child => {
      el.appendChild(createChild(child));
    });
  }

  // Clock variants
  if (c.b === 'clock' && c.d) {
    if (c.d.variant === 'digital') el.classList.add('clock-digital');
    if (c.d.variant === 'analog') el.classList.add('clock-analog');
    if (c.d.variant === 'led') el.classList.add('clock-led');
  }

  // Make all semantic elements contenteditable
  const semanticTags = [
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'BUTTON', 'A', 'LI', 'LABEL',
    'ARTICLE', 'SECTION', 'HEADER', 'FOOTER', 'NAV', 'ASIDE', 'MAIN', 'ADDRESS',
    'FIGURE', 'FIGCAPTION', 'TIME', 'MARK', 'CITE', 'SUMMARY', 'DETAILS', 'DT', 'DD',
    'DL', 'UL', 'OL', 'PRE', 'CODE', 'BLOCKQUOTE', 'SMALL', 'STRONG', 'EM', 'B', 'I',
    'U', 'SUP', 'SUB', 'LEGEND', 'CAPTION', 'TD', 'TH', 'TR', 'TABLE', 'THEAD', 'TBODY',
    'TFOOT', 'FORM', 'FIELDSET', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION'
  ];
  if (semanticTags.includes(el.tagName) || (c.d && c.d.text)) {
    el.setAttribute('contenteditable', 'true');
    el.classList.add('canvas-editable');
    el.dataset.editableKey = 'text';
  }

  // Audio EQ setup
  if (c.b === 'audio' && c.d) {
    if (c.d.showEq === true || c.d.showEq === 'true') {
      el.dataset.showEq = 'true';
    }
  }

  // Container layout styles
  if (c.b === 'container' && c.d) {
    el.style.display = 'flex';
    el.style.flexDirection = c.d.direction || 'column';

    if (c.d.wrap !== undefined) {
      el.style.flexWrap = (c.d.wrap === true || c.d.wrap === 'true') ? 'wrap' : 'nowrap';
    } else {
      el.style.flexWrap = 'wrap';
    }

    if (c.d.gap) {
      el.style.gap = c.d.gap;
      el.style.setProperty('--gap', c.d.gap);
    }

    const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
    const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };

    if (c.d.align) el.style.alignItems = alignMap[c.d.align] || c.d.align;
    if (c.d.justify) el.style.justifyContent = justifyMap[c.d.justify] || c.d.justify;
    if (c.d.padding) el.style.padding = c.d.padding;
  }

  return el;
}

/**
 * Build controls HTML for a component wrapper
 * @param {string} id - Component ID
 * @param {string|null} parentId - Parent component ID (if any)
 * @param {boolean} isGrid - Whether parent is a grid
 * @returns {string} Controls HTML
 */
export function buildControls(id, parentId = null, isGrid = false) {
  let controls = '<div class="controls">';
  controls += `<button class="ctrl-btn" onclick="moveUp('${id}')" title="Move up">Up</button>`;
  controls += `<button class="ctrl-btn" onclick="moveDown('${id}')" title="Move down">Dn</button>`;
  
  if (isGrid) {
    controls += '<div class="span-btns">';
    controls += `<button class="span-btn" onclick="setSpan('${id}',1)" title="Span 1 column">1</button>`;
    controls += `<button class="span-btn" onclick="setSpan('${id}',2)" title="Span 2 columns">2</button>`;
    controls += `<button class="span-btn" onclick="setSpan('${id}',3)" title="Span 3 columns">3</button>`;
    controls += '</div>';
  }
  
  controls += `<button class="ctrl-btn" onclick="dup('${id}')" title="Duplicate">Dup</button>`;
  controls += `<button class="ctrl-btn del" onclick="del('${id}')" title="Delete">Del</button>`;
  controls += '</div>';
  
  return controls;
}

/**
 * Add a component to the canvas
 * @param {Object} c - Component configuration
 * @param {string|null} parentId - Parent component ID
 * @param {Object} deps - Dependencies { WB, selComp, Events, renderTree, toast, saveHist }
 * @returns {HTMLElement} Created wrapper element
 */
export function add(c, parentId = null, deps = {}) {
  const { WB, selComp, Events, renderTree, toast, saveHist, autoExtendCanvas, updCount } = deps;
  
  const cv = document.getElementById('canvas');
  document.getElementById('empty')?.remove();
  
  const id = genId(c);
  const w = document.createElement('div');
  w.className = 'dropped';
  if (c.container || c.b === 'container' || c.b === 'grid') w.classList.add('is-container');
  w.id = id;
  w.dataset.c = JSON.stringify(c);
  if (parentId) w.dataset.parent = parentId;
  
  const isGrid = c.b === 'grid';
  if (isGrid) w.dataset.grid = 'true';
  
  // Check if parent is a grid
  let parentIsGrid = false;
  if (parentId) {
    const parent = document.getElementById(parentId);
    parentIsGrid = parent?.dataset.grid === 'true';
  }
  
  w.innerHTML = buildControls(id, parentId, parentIsGrid);
  
  const builderEl = mkEl(c, id);
  
  // Apply data-* attributes
  if (c.d && typeof c.d === 'object') {
    Object.entries(c.d).forEach(([key, value]) => {
      builderEl.setAttribute('data-' + key, value);
    });
    if (c.d.hoverText) {
      w.setAttribute('title', c.d.hoverText);
    }
    if (c.d._width) {
      w.style.width = c.d._width;
      w.style.maxWidth = c.d._width;
    }
  }
  
  w.appendChild(builderEl);
  
  if (parentId) {
    const parentEl = document.getElementById(parentId);
    if (parentEl) {
      parentEl.appendChild(w);
    } else {
      addElementToCanvas(w);
    }
  } else {
    addElementToCanvas(w);
  }

  if (WB) WB.scan(w);
  addResizeHandle(w);
  
  try {
    if (selComp) selComp(w);
    setTimeout(() => {
      w.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  } catch (e) {
    if (Events) Events.error('Builder', 'selComp failed in add()', { stack: e.stack, component: c.n });
  }
  
  if (updCount) updCount();
  if (renderTree) renderTree();
  if (autoExtendCanvas) autoExtendCanvas();
  if (saveHist) saveHist();
  updateBadges();
  
  return w;
}

/**
 * Add component to a grid
 * @param {Object} c - Component configuration
 * @param {HTMLElement} gridWrapper - Grid wrapper element
 * @param {Object} deps - Dependencies
 */
export function addToGrid(c, gridWrapper, deps = {}) {
  const { WB, selComp, Events, renderTree, saveHist, autoExtendCanvas, updCount } = deps;
  
  const id = genId(c);
  const gridId = gridWrapper.id;
  const gridEl = gridWrapper.querySelector('wb-grid');

  const w = document.createElement('div');
  w.className = 'dropped grid-child';
  if (c.container || c.b === 'container' || c.b === 'grid') w.classList.add('is-container');
  w.id = id;
  w.dataset.c = JSON.stringify(c);
  w.dataset.parent = gridId;
  w.dataset.span = '1';

  w.innerHTML = buildControls(id, gridId, true);
  w.appendChild(mkEl(c, id));

  gridEl.appendChild(w);
  if (WB) WB.scan(w);

  try {
    if (selComp) selComp(w);
    setTimeout(() => {
      w.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  } catch (e) {
    if (Events) Events.error('Builder', 'selComp failed in addToGrid()', { stack: e.stack, component: c.n });
  }

  if (updCount) updCount();
  if (renderTree) renderTree();
  if (autoExtendCanvas) autoExtendCanvas();
  if (saveHist) saveHist();
}

/**
 * Add component to a container's drop zone
 * @param {Object} c - Component configuration
 * @param {HTMLElement} containerWrapper - Container wrapper element
 * @param {HTMLElement} dropZone - Drop zone element
 * @param {HTMLElement|null} referenceNode - Reference node for insertion
 * @param {Object} deps - Dependencies
 */
export function addToContainer(c, containerWrapper, dropZone, referenceNode = null, deps = {}) {
  const { WB, selComp, Events, renderTree, saveHist, autoExtendCanvas, updCount } = deps;
  
  const id = genId(c);
  const containerId = containerWrapper.id;

  const containerConfig = JSON.parse(containerWrapper.dataset.c || '{}');
  const isNavbar = containerConfig.b === 'navbar';

  // Remove placeholder if present
  if (dropZone.children.length > 0) {
    const firstChild = dropZone.firstElementChild;
    if (firstChild && !firstChild.classList.contains('dropped') && firstChild.innerText?.includes('Drop components here')) {
      dropZone.innerHTML = '';
    }
  }

  const w = document.createElement('div');
  w.className = 'dropped container-child';
  if (c.container || c.b === 'container' || c.b === 'grid') w.classList.add('is-container');
  w.id = id;
  w.dataset.c = JSON.stringify(c);
  w.dataset.parent = containerId;

  w.innerHTML = buildControls(id, containerId, false);
  
  const el = mkEl(c, id);
  
  // Style links in navbar
  if (isNavbar && (c.b === 'link' || el.tagName === 'A')) {
    el.classList.add('wb-navbar__item');
    el.style.opacity = '0.8';
    el.style.textDecoration = 'none';
    el.style.color = 'inherit';
    el.style.transition = 'opacity 0.15s ease';
    el.style.whiteSpace = 'nowrap';
    
    el.addEventListener('mouseenter', () => el.style.opacity = '1');
    el.addEventListener('mouseleave', () => el.style.opacity = '0.8');
  }
  
  w.appendChild(el);

  // Restore width if present
  if (c.d && c.d._width) {
    w.style.width = c.d._width;
    w.style.maxWidth = c.d._width;
  }

  if (referenceNode) {
    dropZone.insertBefore(w, referenceNode);
  } else {
    dropZone.appendChild(w);
  }

  if (WB) WB.scan(w);

  try {
    if (selComp) selComp(w);
    setTimeout(() => {
      w.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  } catch (e) {
    if (Events) Events.error('Builder', 'selComp failed in addToContainer()', { stack: e.stack, component: c.n });
  }

  if (updCount) updCount();
  if (renderTree) renderTree();
  if (autoExtendCanvas) autoExtendCanvas();
  if (saveHist) saveHist();
}

/**
 * Delete a component
 * @param {string} id - Component ID
 * @param {Object} deps - Dependencies
 */
export function del(id, deps = {}) {
  const { updCount, saveHist, chkEmpty, renderTree, autoExtendCanvas } = deps;
  
  const w = document.getElementById(id);
  if (w) {
    w.remove();
    if (updCount) updCount();
    if (saveHist) saveHist();
    if (chkEmpty) chkEmpty();
    if (renderTree) renderTree();
    if (autoExtendCanvas) autoExtendCanvas();
    updateBadges();
  }
  
  if (window.sel?.id === id) {
    window.sel = null;
  }
}

/**
 * Duplicate a component
 * @param {string} id - Component ID
 * @param {Function} addFn - Add function
 * @param {Object} deps - Dependencies
 */
export function dup(id, addFn, deps = {}) {
  const { renderTree, autoExtendCanvas } = deps;
  
  const w = document.getElementById(id);
  if (w) {
    addFn(JSON.parse(w.dataset.c), w.dataset.parent);
    if (renderTree) renderTree();
    if (autoExtendCanvas) autoExtendCanvas();
  }
}

/**
 * Move component up
 * @param {string} id - Component ID
 * @param {Object} deps - Dependencies
 */
export function moveUp(id, deps = {}) {
  const { saveHist, renderTree } = deps;
  
  const el = document.getElementById(id);
  if (!el) return;

  let prev = el.previousElementSibling;
  while (prev && !prev.classList.contains('dropped')) {
    prev = prev.previousElementSibling;
  }

  if (!prev || prev.id === 'empty') return;

  prev.before(el);
  if (saveHist) saveHist();
  if (renderTree) renderTree();
}

/**
 * Move component down
 * @param {string} id - Component ID
 * @param {Object} deps - Dependencies
 */
export function moveDown(id, deps = {}) {
  const { saveHist, renderTree } = deps;
  
  const el = document.getElementById(id);
  if (!el) return;

  let next = el.nextElementSibling;
  while (next && !next.classList.contains('dropped')) {
    next = next.nextElementSibling;
  }

  if (!next) return;

  next.after(el);
  if (saveHist) saveHist();
  if (renderTree) renderTree();
}

/**
 * Set grid span for a component
 * @param {string} id - Component ID
 * @param {number} span - Span value (1-3)
 * @param {Function} saveHist - Save history function
 */
export function setSpan(id, span, saveHist) {
  const w = document.getElementById(id);
  if (!w) return;

  w.dataset.span = span;
  w.style.gridColumn = 'span ' + span;

  w.querySelectorAll('.span-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i + 1) === span);
  });

  if (saveHist) saveHist();
}

// Expose to window for HTML onclick handlers
window.del = (id) => del(id, window._builderDeps || {});
window.dup = (id) => dup(id, window.add, window._builderDeps || {});
window.moveUp = (id) => moveUp(id, window._builderDeps || {});
window.moveDown = (id) => moveDown(id, window._builderDeps || {});
window.setSpan = (id, span) => setSpan(id, span, window.saveHist);
