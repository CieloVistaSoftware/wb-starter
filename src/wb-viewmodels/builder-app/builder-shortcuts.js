/**
 * Builder Shortcuts Module
 * Keyboard shortcuts, move/duplicate operations
 * @module builder-shortcuts
 */

import { renderTree } from './builder-tree.js';

/**
 * Show keyboard shortcuts modal
 */
export function showShortcuts() {
  document.getElementById('shortcutsModal')?.classList.add('open');
}

/**
 * Close keyboard shortcuts modal
 */
export function closeShortcuts() {
  document.getElementById('shortcutsModal')?.classList.remove('open');
}

/**
 * Duplicate a component
 */
export function duplicateComponent(id, options = {}) {
  const { WB, initInlineEditing, saveHist, upd, toast } = options;
  
  const original = document.getElementById(id);
  if (!original) return;

  const c = JSON.parse(original.dataset.c);

  // Create a new ID
  const newId = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
  const clone = original.cloneNode(true);
  clone.id = newId;

  // Update control buttons
  clone.querySelectorAll('.ctrl-btn').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick) {
      btn.setAttribute('onclick', onclick.replace(id, newId));
    }
  });

  // Insert after original
  original.after(clone);

  // Re-initialize
  if (WB) WB.scan(clone);
  if (initInlineEditing) initInlineEditing(clone, c, saveHist);

  if (saveHist) saveHist('Duplicate ' + c.n);
  if (upd) upd();
  if (toast) toast('Duplicated ' + c.n);
}

/**
 * Move component up in the DOM
 */
export function moveUp(id, options = {}) {
  const { saveHist } = options;
  
  const el = document.getElementById(id);
  if (!el) return;

  // Find previous dropped component
  let prev = el.previousElementSibling;
  while (prev && !prev.classList.contains('dropped')) {
    prev = prev.previousElementSibling;
  }

  if (!prev) return;

  // Don't move past the empty state
  if (prev.id === 'empty') return;

  prev.before(el);
  const c = JSON.parse(el.dataset.c);
  if (saveHist) saveHist('Move ' + c.n + ' up');
  renderTree();
}

/**
 * Move component down in the DOM
 */
export function moveDown(id, options = {}) {
  const { saveHist } = options;
  
  const el = document.getElementById(id);
  if (!el) return;

  // Find next dropped component
  let next = el.nextElementSibling;
  while (next && !next.classList.contains('dropped')) {
    next = next.nextElementSibling;
  }

  if (!next) return;

  next.after(el);
  const c = JSON.parse(el.dataset.c);
  if (saveHist) saveHist('Move ' + c.n + ' down');
  renderTree();
}

/**
 * Copy selected component as HTML
 */
export function copyAsHTML(options = {}) {
  const { toast } = options;
  
  const sel = window.sel;
  if (!sel) {
    if (toast) toast('No component selected');
    return;
  }

  const el = sel.querySelector('[data-wb]');
  if (!el) return;

  // Clone and clean up
  const clone = el.cloneNode(true);
  clone.classList.remove('wb-ready');
  clone.classList.remove('wb-mdhtml--loading', 'wb-mdhtml--loaded');

  // Remove contenteditable attributes
  clone.querySelectorAll('[contenteditable]').forEach(ce => {
    ce.removeAttribute('contenteditable');
  });

  const html = clone.outerHTML;

  navigator.clipboard.writeText(html).then(() => {
    if (toast) toast('HTML copied to clipboard');
  });
}

/**
 * Delete a component
 */
export function del(id, options = {}) {
  const { updCount, saveHist, chkEmpty, autoExtendCanvas, updateBadges } = options;
  
  const w = document.getElementById(id);
  if (w) {
    w.remove();
    if (updCount) updCount();
    if (saveHist) saveHist();
    if (chkEmpty) chkEmpty();
    renderTree();
    if (autoExtendCanvas) autoExtendCanvas();
    if (updateBadges) updateBadges();
  }
  if (window.sel?.id === id) {
    window.sel = null;
  }
}

/**
 * Duplicate shorthand (alias for duplicateComponent)
 */
export function dup(id, options = {}) {
  const w = document.getElementById(id);
  if (w && options.add) {
    options.add(JSON.parse(w.dataset.c), w.dataset.parent);
    renderTree();
    if (options.autoExtendCanvas) options.autoExtendCanvas();
  }
}

// Expose globally for backward compatibility
window.showShortcuts = showShortcuts;
window.closeShortcuts = closeShortcuts;
window.duplicateComponent = duplicateComponent;
window.moveUp = moveUp;
window.moveDown = moveDown;
window.copyAsHTML = copyAsHTML;
window.del = del;
window.dup = dup;
