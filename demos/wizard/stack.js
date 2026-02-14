// @ts-nocheck
// wizard/stack.js -- Stack management, rendering, container mode

import { state, isContainerTag, saveState, clearState } from './state.js';
import { summarizeAttrs, showToast } from './utils.js';
import { renderFullPreview } from './preview.js';
import { findSchemaByTag } from './schemas.js';
import { buildEditors, buildPresets, restoreEditorValues } from './editors.js';

// --- Types ---

// StackItem, StackChild, and State interfaces removed for JS compatibility
// Ensure previewStack is always an array of objects
if (!Array.isArray(state.previewStack)) {
  state.previewStack = [];
}
var idCounter = 0;

// --- Add to stack ---

/**
 * @param {string} html
 * @param {string} tag
 * @param {object} attrs
 */
export function addToPreviewStack(html, tag, attrs) {
  const assignId = typeof tag === 'string' && tag.startsWith('wb-');
  if (state.containerIndex >= 0 && state.containerIndex < state.previewStack.length) {
    var container = state.previewStack[state.containerIndex] || {};
    if (!Array.isArray(container.children)) container.children = [];
    // Ensure childAttrs is always an object
    const childAttrs = (attrs && typeof attrs === 'object') ? { ...attrs } : {};
    // Auto-assign ID if container has ID and child is wb-*
    if (
      container.attrs &&
      typeof container.attrs === 'object' &&
      Object.prototype.hasOwnProperty.call(container.attrs, 'id') &&
      container.attrs.id &&
      assignId &&
      !(childAttrs && typeof childAttrs === 'object' && Object.prototype.hasOwnProperty.call(childAttrs, 'id') && childAttrs.id)
    ) {
      idCounter++;
      if (childAttrs && typeof childAttrs === 'object') {
        childAttrs['id'] = tag.replace('wb-', '') + '-' + idCounter;
      }
    } else if (assignId && !(childAttrs && typeof childAttrs === 'object' && Object.prototype.hasOwnProperty.call(childAttrs, 'id') && childAttrs.id)) {
      idCounter++;
      if (childAttrs && typeof childAttrs === 'object') {
        childAttrs['id'] = tag.replace('wb-', '') + '-' + idCounter;
      }
    }
    container.children.push({ html: html, tag: tag, attrs: childAttrs });
    state.selectedStackIdx = state.containerIndex;
    state.selectedChildIdx = container.children.length - 1;
  } else {
    const rootAttrs = (attrs && typeof attrs === 'object') ? { ...attrs } : {};
    if (assignId && !(typeof rootAttrs === 'object' && 'id' in rootAttrs && rootAttrs.id)) {
      idCounter++;
      rootAttrs.id = tag.replace('wb-', '') + '-' + idCounter;
    }
    state.previewStack.push({ html: html, tag: tag, attrs: rootAttrs, children: [] });
    state.selectedStackIdx = state.previewStack.length - 1;
    state.selectedChildIdx = -1;
    if (isContainerTag(tag)) {
      state.containerIndex = state.previewStack.length - 1;
      updateContainerModeUI();
    }
  }
  renderStackList();
  renderFullPreview();
  saveState();
}

// --- Container mode ---

export function exitContainerMode() {
  state.containerIndex = -1;
  updateContainerModeUI();
  showToast('Exited container mode');
}

export function enterContainer(stackIdx) {
  state.containerIndex = stackIdx;
  updateContainerModeUI();
  renderStackList();
  showToast('Entered ' + (state.previewStack[stackIdx] && state.previewStack[stackIdx].tag));
}

export function updateContainerModeUI() {
  var banner = document.getElementById('containerBanner');
  if (!banner) return;
  if (state.containerIndex >= 0 && state.containerIndex < state.previewStack.length) {
    var item = state.previewStack[state.containerIndex] || {};
    var count = Array.isArray(item.children) ? item.children.length : 0;
    banner.innerHTML = '<span>&#x1F4E6; Adding into <strong>' + (item.tag || '') + '</strong> (' + count + ' children)</span>'
      + '<button class="btn btn--danger btn--sm" onclick="exitContainerMode()">Exit Container</button>';
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

// --- Clear stack ---

export function clearPreviewStack() {
  state.previewStack = [];
  state.containerIndex = -1;
  state.selectedStackIdx = -1;
  state.selectedChildIdx = -1;
  clearState();
  updateContainerModeUI();
  renderStackList();
  if (typeof state.onRefresh === 'function') state.onRefresh();
}

// --- Duplicate item ---

export function duplicateStackItem(stackIdx, childIdx) {
  if (childIdx >= 0) {
    var container = state.previewStack[stackIdx] || {};
    if (!container || !Array.isArray(container.children) || !container.children[childIdx]) return;
    var original = container.children[childIdx];
    var cloneAttrs = Object.assign({}, original.attrs);
    // Give clone a unique ID if original had one
    if (cloneAttrs.id) {
      idCounter++;
      cloneAttrs.id = original.tag.replace('wb-', '') + '-' + idCounter;
    }
    var clone = { tag: original.tag, attrs: cloneAttrs, children: [] };
    container.children.splice(childIdx + 1, 0, clone);
    state.selectedStackIdx = stackIdx;
    state.selectedChildIdx = childIdx + 1;
  } else {
    var original = state.previewStack[stackIdx] || {};
    if (!original) return;
    var clone = {
      tag: original.tag,
      attrs: Object.assign({}, original.attrs),
      children: Array.isArray(original.children)
        ? original.children.map(function(c) {
            return { tag: c.tag, attrs: Object.assign({}, c.attrs), children: [] };
          })
        : []
    };
    state.previewStack.splice(stackIdx + 1, 0, clone);
    state.selectedStackIdx = stackIdx + 1;
    state.selectedChildIdx = -1;
    if (state.containerIndex > stackIdx) state.containerIndex++;
  }
  updateContainerModeUI();
  renderStackList();
  if (typeof state.onRefresh === 'function') state.onRefresh();
  saveState();
  showToast('Duplicated ' + (childIdx >= 0 ? 'child' : 'item'));
}

// --- Remove item ---

export function removeStackItem(stackIdx, childIdx) {
  if (childIdx >= 0) {
    var container = state.previewStack[stackIdx] || {};
    if (container && Array.isArray(container.children)) container.children.splice(childIdx, 1);
    if (state.selectedStackIdx === stackIdx && state.selectedChildIdx === childIdx) {
      state.selectedChildIdx = -1; state.selectedStackIdx = -1;
      // Reset picker so re-selecting the same component fires change
      var pickerEl = document.getElementById('componentPicker');
      if (pickerEl && 'value' in pickerEl) pickerEl.value = '';
    } else if (state.selectedStackIdx === stackIdx && state.selectedChildIdx > childIdx) {
      state.selectedChildIdx--;
    }
  } else {
    state.previewStack.splice(stackIdx, 1);
    if (state.containerIndex === stackIdx) state.containerIndex = -1;
    else if (state.containerIndex > stackIdx) state.containerIndex--;
    if (state.selectedStackIdx === stackIdx) {
      state.selectedStackIdx = -1; state.selectedChildIdx = -1;
      var pickerEl = document.getElementById('componentPicker');
      if (pickerEl && 'value' in pickerEl) pickerEl.value = '';
    }
    else if (state.selectedStackIdx > stackIdx) state.selectedStackIdx--;
  }
  updateContainerModeUI();
  renderStackList();
  if (typeof state.onRefresh === 'function') state.onRefresh();
  saveState();
}

// --- Select item (loads schema into editors) ---

export function selectStackItem(stackIdx, childIdx) {
  state.selectedStackIdx = stackIdx;
  state.selectedChildIdx = childIdx;
  var item = childIdx >= 0
    ? (state.previewStack[stackIdx] && Array.isArray(state.previewStack[stackIdx].children) ? state.previewStack[stackIdx].children[childIdx] : undefined)
    : state.previewStack[stackIdx];
  if (!item) return;

  var schema = item && item.tag ? findSchemaByTag(item.tag) : null;
  if (schema) {
    var picker = document.getElementById('componentPicker');
    var compDesc = document.getElementById('compDesc');
    state.currentSchema = schema;
    if (picker && 'value' in picker) picker.value = (schema && schema.name) || '';
    if (compDesc) compDesc.textContent = (schema && schema.description) || '';
    state.currentAttrs = Object.assign({}, item.attrs || {});
    buildEditors(schema);
    restoreEditorValues(state.currentAttrs);
    buildPresets(schema);
  }

  renderStackList();
  showToast('Editing #' + (stackIdx + 1) + (childIdx >= 0 ? '.' + (childIdx + 1) : ''));
}

// --- Toggle ID on item ---

export function toggleItemId(stackIdx, childIdx, checked) {
  var item = childIdx >= 0
    ? (state.previewStack[stackIdx] && Array.isArray(state.previewStack[stackIdx].children) ? state.previewStack[stackIdx].children[childIdx] : undefined)
    : state.previewStack[stackIdx];
  if (!item) return;

  if (checked) {
    var base = item.tag.replace('wb-', '');
    idCounter++;
    item.attrs.id = base + '-' + idCounter;

    // If top-level item, cascade to all wb-* children
    if (childIdx < 0 && Array.isArray(item.children) && item.children.length > 0) {
      item.children.forEach(function(child) {
        if (child.tag && typeof child.tag === 'string' && child.tag.startsWith('wb-') && !child.attrs.id) {
          var childBase = child.tag.replace('wb-', '');
          idCounter++;
          child.attrs.id = childBase + '-' + idCounter;
        }
      });
    }
  } else {
    delete item.attrs.id;

    // If top-level item, remove IDs from all children
    if (childIdx < 0 && Array.isArray(item.children) && item.children.length > 0) {
      item.children.forEach(function(child) {
        delete child.attrs.id;
      });
    }
  }

  // Sync currentAttrs so refreshPreviews doesn't clobber the new IDs
  if (state.selectedStackIdx >= 0) {
    var selItem = state.selectedChildIdx >= 0
      ? (state.previewStack[state.selectedStackIdx] && Array.isArray(state.previewStack[state.selectedStackIdx].children)
          ? state.previewStack[state.selectedStackIdx].children[state.selectedChildIdx]
          : undefined)
      : state.previewStack[state.selectedStackIdx];
    if (selItem) state.currentAttrs = Object.assign({}, selItem.attrs);
  }

  renderStackList();
  if (typeof state.onRefresh === 'function') state.onRefresh();
  saveState();
}

// --- Render stack list ---

export function renderStackList() {
  var el = document.getElementById('stackList');
  if (!el) return;
  if (!Array.isArray(state.previewStack) || state.previewStack.length === 0) { el.innerHTML = ''; return; }

  var num = 1, html = '';
  state.previewStack.forEach(function(item, si) {
    var isCont = item && item.tag ? isContainerTag(item.tag) : false;
    var isActive = (si === state.containerIndex);
    var isSel = (si === state.selectedStackIdx && state.selectedChildIdx === -1);
    var cls = 'stack-row' + (isCont ? ' is-container' : '') + (isSel ? ' is-selected' : '');
    var attrStr = item && item.attrs ? summarizeAttrs(item.attrs) : '';

    var hasId = !!(item && item.attrs && item.attrs.id);
    html += '<div class="' + cls + '" onclick="selectStackItem(' + si + ',-1)">'
      + '<span class="stack-num">' + num + '</span>'
      + '<span class="stack-tag">&lt;' + (item && item.tag ? item.tag : '') + '&gt;</span>'
      + '<span class="stack-attrs">' + attrStr + '</span>'
      + (isCont && Array.isArray(item.children) && item.children.length > 0
        ? '<span class="stack-children-count">' + item.children.length + ' children</span>'
        : '');

    if (isCont && !isActive) {
      html += '<button class="btn btn--sm" onclick="event.stopPropagation();enterContainer(' + si + ')">Enter</button>';
    }
    html += '<label class="stack-id" onclick="event.stopPropagation()" title="Generate ID"><input type="checkbox"' + (hasId ? ' checked' : '') + ' onchange="toggleItemId(' + si + ',-1,this.checked)">ID</label>'
      + '<button class="stack-dup" onclick="event.stopPropagation();duplicateStackItem(' + si + ',-1)" title="Duplicate">&#x2398;</button>'
      + '<button class="stack-del" onclick="event.stopPropagation();removeStackItem(' + si + ',-1)" title="Remove">&#x2715;</button></div>';
    num++;

    if (Array.isArray(item.children)) {
      item.children.forEach(function(child, ci) {
        var childSel = (si === state.selectedStackIdx && ci === state.selectedChildIdx);
        var childHasId = !!(child && child.attrs && child.attrs.id);
        html += '<div class="stack-row is-child' + (childSel ? ' is-selected' : '') + '" onclick="selectStackItem(' + si + ',' + ci + ')">'
          + '<span class="stack-num">' + num + '</span>'
          + '<span class="stack-tag">&lt;' + (child && child.tag ? child.tag : '') + '&gt;</span>'
          + '<span class="stack-attrs">' + (child && child.attrs ? summarizeAttrs(child.attrs) : '') + '</span>'
          + '<label class="stack-id" onclick="event.stopPropagation()" title="Generate ID"><input type="checkbox"' + (childHasId ? ' checked' : '') + ' onchange="toggleItemId(' + si + ',' + ci + ',this.checked)">ID</label>'
          + '<button class="stack-dup" onclick="event.stopPropagation();duplicateStackItem(' + si + ',' + ci + ')" title="Duplicate">&#x2398;</button>'
          + '<button class="stack-del" onclick="event.stopPropagation();removeStackItem(' + si + ',' + ci + ')" title="Remove">&#x2715;</button></div>';
        num++;
      });
    }
  });

  el.innerHTML = html;
}

// --- Expose to window for inline onclick handlers ---

window.exitContainerMode = exitContainerMode;
window.enterContainer = enterContainer;
window.removeStackItem = removeStackItem;
window.duplicateStackItem = duplicateStackItem;
window.toggleItemId = toggleItemId;
window.selectStackItem = selectStackItem;
