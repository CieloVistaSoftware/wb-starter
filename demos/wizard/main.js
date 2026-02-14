// wizard/main.js -- Entry point: WB init, tabs, resize, events, refreshPreviews

import { state, isContainerTag, saveState, loadState, clearState } from './state.js';

// Extend Window interface to include WB
/**
 * @typedef {object} WBType
 * @property {Function} init
 */
/**
 * @type {Window & { WB?: any }}
 */
const _window = window;
import { buildHtmlString, buildStackItemHtml, showToast, copyText } from './utils.js';
import { highlightHtml } from './highlight.js';
import { loadSchemas, findSchema } from './schemas.js';
import { buildEditors, buildPresets, updatePropsHeader, restoreEditorValues, fillAllDefaults, getSmartDefault } from './editors.js';
import { renderFullPreview } from './preview.js';
import { addToPreviewStack, clearPreviewStack, renderStackList, updateContainerModeUI } from './stack.js';

// --- WB Init ---

// Only initialize WB if not already present (prevents duplicate inits)
if (!_window.WB) {
  try {
    var mod = await import('../../src/core/wb-lazy.js');
    var WB = mod.default;
    _window.WB = WB;
    await WB.init({ autoInject: true });
  } catch (e) {
    let msg = (e && typeof e === 'object' && 'message' in e) ? e.message : String(e);
    console.warn('WB init skipped:', msg);
  }
}

// --- Find current target item in the stack ---

// --- Types ---

/**
 * @typedef {Object} StackItem
 * @property {string} html
 * @property {string} tag
 * @property {Record<string, any>} attrs
 * @property {StackItem[]} [children]
 */

/**
 * @typedef {Object} Schema
 * @property {string} tag
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Object} StateType
 * @property {Schema[]} schemas
 * @property {StackItem[]} previewStack
 * @property {number} selectedStackIdx
 * @property {number} selectedChildIdx
 * @property {number} containerIndex
 * @property {Schema|null} currentSchema
 * @property {Record<string, any>} currentAttrs
 * @property {(function():void)|null} onRefresh
 * @property {(function():void)|null} onPropertyChange
 */

/**
 * @returns {StackItem|null}
 */
function findCurrentTarget() {
  if (!state.currentSchema) return null;
  /** @type {StackItem|null} */
  var target = null;
  if (state.selectedStackIdx >= 0 && state.selectedStackIdx < state.previewStack.length) {
    if (state.selectedChildIdx >= 0) {
      /** @type {StackItem} */
      var cont = state.previewStack[state.selectedStackIdx];
      if (cont.children && cont.children[state.selectedChildIdx]) target = cont.children[state.selectedChildIdx];
    } else {
      target = state.previewStack[state.selectedStackIdx];
    }
  }
  if (!target) {
    if (state.containerIndex >= 0 && state.containerIndex < state.previewStack.length) {
      /** @type {StackItem} */
      var container = state.previewStack[state.containerIndex];
      if (container.children && container.children.length > 0) target = container.children[container.children.length - 1];
    } else if (state.previewStack.length > 0) {
      target = state.previewStack[state.previewStack.length - 1];
    }
  }
  /** @type {StackItem|null} */
  return (target && typeof target === 'object' && 'tag' in target && target.tag === state.currentSchema.tag) ? target : null;
}

// --- Update code sample only ---

function updateCodeSample() {
  var rawHtml = state.previewStack.map(function(item) {
    return buildStackItemHtml(item);
  }).join('\n');
  var htmlOutputEl = document.getElementById('htmlOutput');
  if (htmlOutputEl) htmlOutputEl.innerHTML = highlightHtml(rawHtml);
}

// --- Lightweight refresh: property change on current element only ---

function refreshProperty() {
  var target = findCurrentTarget();
  if (target) {
    target.html = buildHtmlString(state.currentSchema.tag, state.currentAttrs);
    target.attrs = Object.assign({}, state.currentAttrs);
  }
  updateCodeSample();
  saveState();
}

// --- Full refresh: structure changes (add/remove/reorder/tab switch) ---

function refreshPreviews() {
  var target = findCurrentTarget();
  if (target) {
    target.html = buildHtmlString(state.currentSchema.tag, state.currentAttrs);
    target.attrs = Object.assign({}, state.currentAttrs);
  }

  renderFullPreview();
  updateContainerModeUI();
  renderStackList();
  updateCodeSample();
  saveState();
}

// Register callbacks so editors/presets can trigger refresh without circular import
state.onRefresh = refreshPreviews;
state.onPropertyChange = refreshProperty;

// --- Tabs ---

document.querySelectorAll('.wiz-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.wiz-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.wiz-panel').forEach(function(p) { p.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'build') refreshPreviews();
    if (tab.dataset.tab === 'preview') renderFullPreview();
  });
});

// --- Resizable right panel ---

(function() {
  var handle = document.getElementById('resizeHandle');
  var panel = document.getElementById('propsPanel');
  var dragging = false;

  handle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    dragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var containerRight = document.querySelector('.build-layout').getBoundingClientRect().right;
    var newWidth = containerRight - e.clientX;
    if (newWidth < 240) newWidth = 240;
    if (newWidth > 600) newWidth = 600;
    panel.style.width = newWidth + 'px';
  });
  document.addEventListener('mouseup', function() {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
})();

// --- Toggle more properties ---

var toggleMoreBtn = document.getElementById('toggleMoreProps');
var secondaryEditorsEl = document.getElementById('secondaryEditors');
if (toggleMoreBtn && secondaryEditorsEl) {
  toggleMoreBtn.addEventListener('click', function() {
    var expanded = secondaryEditorsEl.classList.toggle('visible');
    toggleMoreBtn.classList.toggle('expanded', expanded);
    toggleMoreBtn.querySelector('.arrow').innerHTML = expanded ? '&#9660;' : '&#9654;';
  });
}

// --- Component picker change ---

var picker = document.getElementById('componentPicker');
var compDesc = document.getElementById('compDesc');
var htmlOutputEl = document.getElementById('htmlOutput');
var presetsCard = document.getElementById('presetsCard');

picker.addEventListener('change', function() {
  var name = picker.value;
  if (!name) {
    state.currentSchema = null;
    document.getElementById('primaryEditors').innerHTML = '<p class="preview-empty">Select a component above</p>';
    document.getElementById('secondaryEditors').innerHTML = '';
    document.getElementById('toggleMoreProps').style.display = 'none';
    htmlOutputEl.innerHTML = '';
    compDesc.textContent = '';
    presetsCard.style.display = 'none';
    updatePropsHeader();
    return;
  }

  state.currentSchema = findSchema(name);
  if (!state.currentSchema) return;
  compDesc.textContent = state.currentSchema.description;
  buildEditors(state.currentSchema);

  var html = buildHtmlString(state.currentSchema.tag, state.currentAttrs);
  if (state.previewStack.length === 0 || state.containerIndex >= 0) {
    addToPreviewStack(html, state.currentSchema.tag, Object.assign({}, state.currentAttrs));
  } else {
    state.containerIndex = -1;
    state.previewStack = [{
      html: html,
      tag: state.currentSchema.tag,
      attrs: Object.assign({}, state.currentAttrs),
      children: []
    }];
    state.selectedStackIdx = 0;
    state.selectedChildIdx = -1;
    if (isContainerTag(state.currentSchema.tag)) state.containerIndex = 0;
  }

  updateContainerModeUI();
  renderStackList();
  buildPresets(state.currentSchema);
  refreshPreviews();
  saveState();
});

// --- Copy / Clear buttons ---

document.getElementById('copyHtmlBtn').addEventListener('click', function() {
  copyText(htmlOutputEl.textContent);
});

document.getElementById('resetWizardBtn').addEventListener('click', function() {
  clearState();
  state.currentSchema = null;
  state.currentAttrs = {};
  state.previewStack = [];
  state.containerIndex = -1;
  state.selectedStackIdx = -1;
  state.selectedChildIdx = -1;
  picker.value = '';
  compDesc.textContent = '';
  htmlOutputEl.innerHTML = '';
  document.getElementById('primaryEditors').innerHTML = '<p class="preview-empty">Select a component above</p>';
  document.getElementById('secondaryEditors').innerHTML = '';
  document.getElementById('toggleMoreProps').style.display = 'none';
  presetsCard.style.display = 'none';
  updatePropsHeader();
  clearPreviewStack();
  showToast('Wizard reset');
});

// --- Init: load schemas + restore state ---

await loadSchemas();

if (loadState()) {
  renderStackList();
  renderFullPreview();
  updateContainerModeUI();
  htmlOutputEl.innerHTML = highlightHtml(state.previewStack.map(function(item) {
    return buildStackItemHtml(item);
  }).join('\n'));

  // Restore editor for selected or first item
  if (state.previewStack.length > 0) {
    var firstItem = (state.selectedStackIdx >= 0 && state.selectedStackIdx < state.previewStack.length)
      ? (state.selectedChildIdx >= 0
        ? state.previewStack[state.selectedStackIdx].children[state.selectedChildIdx]
        : state.previewStack[state.selectedStackIdx])
      : state.previewStack[0];

    if (firstItem) {
      var schema = state.schemas.find(function(s) { return s.tag === firstItem.tag; });
      if (schema) {
        state.currentSchema = schema;
        picker.value = schema.name;
        compDesc.textContent = schema.description;
        state.currentAttrs = Object.assign({}, firstItem.attrs || {});
        buildEditors(schema);
        restoreEditorValues(state.currentAttrs);
        buildPresets(schema);
      }
    }
  }
  showToast('Restored ' + state.previewStack.length + ' component' + (state.previewStack.length > 1 ? 's' : ''));
}

// --- Expose for testing ---

Object.defineProperty(window, 'previewStack', { get: function() { return state.previewStack; } });
Object.defineProperty(window, 'selectedStackIdx', { get: function() { return state.selectedStackIdx; } });
Object.defineProperty(window, 'selectedChildIdx', { get: function() { return state.selectedChildIdx; } });
Object.defineProperty(window, 'containerIndex', { get: function() { return state.containerIndex; } });
Object.defineProperty(window, 'currentAttrs', { get: function() { return state.currentAttrs; } });

window.isContainerTag = isContainerTag;
window.summarizeAttrs = (await import('./utils.js')).summarizeAttrs;
window.camelToKebab = (await import('./utils.js')).camelToKebab;
window.buildHtmlString = buildHtmlString;
window.getTodayString = (await import('./utils.js')).getTodayString;
window.getSmartDefault = getSmartDefault;
window.fillAllDefaults = fillAllDefaults;

console.log('[Wizard] Component Wizard ready (modular)');
