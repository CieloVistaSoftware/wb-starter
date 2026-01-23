/**
 * Builder App - Main Entry Point
 * 
 * This file orchestrates the builder by importing modular components.
 * Each module handles a specific concern (panels, dnd, selection, etc.)
 * 
 * @module builder-app/index
 */

// === CORE IMPORTS ===
import WB from '../../core/wb-lazy.js';
import { Events } from '../../core/events.js';
import { THEMES } from '../themecontrol.js';
import { getComponentExclusions } from './builderExclusions.js';
import { BEHAVIOR_TYPES, getComponentType } from './behavior-types.js';

// === MODULE IMPORTS ===
import {
  toggleSidebar,
  togglePanel,
  switchPanelTab,
  toggleCategory,
  restoreCollapsedCategories,
  restorePanelTab,
  setupPanelKeyboardShortcuts
} from './builder-panels.js';

import {
  showDragFeedbackUI,
  removeDragFeedbackUI,
  findInsertionPoint,
  createDragStartHandler,
  createDragEndHandler,
  createDragOverHandler,
  createDragLeaveHandler,
  createDropHandler
} from './builder-dnd.js';

import {
  genId,
  mkEl,
  buildControls,
  add,
  addToGrid,
  addToContainer,
  del,
  dup,
  moveUp,
  moveDown,
  setSpan,
  setComponentIdCounter
} from './builder-components-core.js';

import {
  selComp,
  renderProps,
  updP,
  validateComponent,
  changeCardType,
  updateElementId,
  getSelection,
  setSelection
} from './builder-selection.js';

import { showContextMenu, viewSchema, createContextMenuHandler } from './builder-context-menu.js';
import { initCollaboration, updateCollabStatus, broadcastChange } from './builder-collab.js';
import { addTemplateHTML, addHTML, addTemplate, previewTemplate, setupTemplateMessageListener } from './builder-template-add.js';

// === FEATURE IMPORTS ===
import BuilderValidation from './builder-validation.js';
import { showWelcome, hideWelcome, shouldShowWelcome, openTemplates as openTemplatesChooser } from './builder-welcome.js';
import { initTemplateBrowser } from './builder-template-browser.js';
import { showTemplateChecklist, showIssuesPanel, updateBadges, analyzeComponent, analyzeCanvas } from './builder-incomplete.js';
import {
  initInlineEditing,
  isContainer,
  getContainerConfig,
  canDropInto,
  findContainerFromTarget,
  findDropZone,
  showDropZoneHighlight,
  hideDropZoneHighlight,
  injectEditingStyles,
  initResizeHandles,
  addResizeHandle,
  initSnapGrid,
  injectSnapGridStyles,
  getEditableKey
} from './builder-editing.js';
import {
  handleSmartDrop,
  applyModifier,
  removeModifier,
  getDragFeedback
} from './builder-drop-handler.js';
import {
  loadPropertyConfig,
  renderPropertiesPanel,
  renderDOMElementProperties,
  getDefaultValue
} from './builder-properties.js';
import { showDocs, closeDocsModal, switchDocsTab } from './builder-docs.js';
import { initOnboarding, showHint, updateFlowState } from './builder-onboarding.js';
import { initWorkflow, showWorkflowPicker } from './builder-workflow.js';
import { initCanvasSections, addElementToCanvas, getDropConfig } from './builder-canvas-sections.js';
import { renderTree, initTree } from './builder-tree.js';
import { renderDecorationsPanel } from './builder-decorations.js';
import { openQuickEdit, shouldShowQuickEdit } from './builder-quick-edit.js';
import '../../wb-viewmodels/wb-menu-bar.js';

// === EXPOSE GLOBALS ===
window.WB = WB;
window.Events = Events;
window.BEHAVIOR_TYPES = BEHAVIOR_TYPES;

// === STATE ===
let C = { All: [] };
let hist = [], hi = -1;
let prev = false;
let exclusions = [];
let currentVP = 'desktop';
let snapEnabled = false;
let favorites = JSON.parse(localStorage.getItem('wb-favorites') || '[]');

const VP_SIZES = {
  desktop: { w: 1200, h: 800 },
  tablet: { w: 768, h: 1024 },
  mobile: { w: 375, h: 667 }
};

// === ERROR HANDLING ===
window.onerror = function(msg, url, line, col, error) {
  console.error('Global Error:', msg, error);
  if (window.toast) window.toast('Error: ' + msg, 'error');
  return false;
};

// === UTILITY FUNCTIONS ===
export function toast(m, type = 'info') {
  const t = document.getElementById('toast');
  if (!t) return;
  
  if (t.dataset.timeoutId) {
    clearTimeout(parseInt(t.dataset.timeoutId));
    delete t.dataset.timeoutId;
  }

  t.style.backgroundColor = '';
  t.innerHTML = '';

  if (type === 'error') {
    t.style.backgroundColor = 'var(--danger-color, #ef4444)';
    t.style.display = 'flex';
    t.style.alignItems = 'center';
    t.style.gap = '12px';
    t.style.paddingRight = '8px';

    const textSpan = document.createElement('span');
    textSpan.textContent = m;
    textSpan.style.flex = '1';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy';
    copyBtn.style.cssText = 'background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:white;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;';
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(m).then(() => {
        copyBtn.textContent = '✔️ Copied';
      });
    };

    t.appendChild(textSpan);
    t.appendChild(copyBtn);
  } else {
    t.textContent = m;
    t.removeAttribute('style');
  }

  t.classList.add('show');
  const duration = type === 'error' ? 8000 : 2500;
  const timeoutId = setTimeout(() => t.classList.remove('show'), duration);
  t.dataset.timeoutId = timeoutId;
}

export function updCount() {
  const n = document.querySelectorAll('.dropped').length;
  const countEl = document.getElementById('count');
  if (countEl) countEl.textContent = n + ' component' + (n !== 1 ? 's' : '');
}

export function upd() {
  updCount();
  renderTree();
  autoExtendCanvas();
}

export function chkEmpty() {
  const cv = document.getElementById('canvas');
  if (!cv.querySelector('.dropped')) {
    cv.innerHTML = '<div class="empty" id="empty"><div class="empty-icon">+</div><h3>Drag components here</h3><p>Build your page visually</p></div>';
  }
}

export function autoExtendCanvas() {
  // Auto-extend canvas if needed
  const cv = document.getElementById('canvas');
  if (!cv) return;
  const lastDropped = cv.querySelector('.dropped:last-child');
  if (lastDropped) {
    const rect = lastDropped.getBoundingClientRect();
    const cvRect = cv.getBoundingClientRect();
    if (rect.bottom > cvRect.bottom - 100) {
      cv.style.minHeight = (cv.offsetHeight + 200) + 'px';
    }
  }
}

// === HISTORY ===
export function saveHist() {
  const cv = document.getElementById('canvas');
  hist = hist.slice(0, hi + 1);
  hist.push(cv.innerHTML);
  hi = hist.length - 1;
  if (hist.length > 50) { hist.shift(); hi--; }
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) undoBtn.disabled = hi <= 0;
  if (redoBtn) redoBtn.disabled = hi >= hist.length - 1;
}

window.undo = () => {
  if (hi > 0) {
    hi--;
    document.getElementById('canvas').innerHTML = hist[hi];
    WB.scan(document.getElementById('canvas'));
    updCount();
    renderTree();
    updateUndoRedoButtons();
    updateBadges();
    toast('Undo');
  }
};

window.redo = () => {
  if (hi < hist.length - 1) {
    hi++;
    document.getElementById('canvas').innerHTML = hist[hi];
    WB.scan(document.getElementById('canvas'));
    updCount();
    renderTree();
    updateUndoRedoButtons();
    updateBadges();
    toast('Redo');
  }
};

// === DEPENDENCIES OBJECT ===
const deps = {
  WB,
  Events,
  toast,
  saveHist,
  updCount,
  upd,
  chkEmpty,
  renderTree,
  autoExtendCanvas,
  selComp,
  renderProps,
  findContainerFromTarget,
  canDropInto,
  addBehaviorToComponent
};

// Store deps globally for module access
window._builderDeps = deps;

// === BEHAVIOR MANAGEMENT ===
function addBehaviorToComponent(wrapper, behaviorName) {
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return;

  const currentBehaviors = el.dataset.wb.split(/\s+/).filter(Boolean);
  if (currentBehaviors.includes(behaviorName)) {
    toast(`Already has ${behaviorName}`);
    return;
  }

  currentBehaviors.push(behaviorName);
  el.dataset.wb = currentBehaviors.join(' ');

  const c = JSON.parse(wrapper.dataset.c);
  c.behaviors = currentBehaviors;
  wrapper.dataset.c = JSON.stringify(c);

  WB.scan(wrapper);

  if (wrapper.classList.contains('selected')) {
    renderProps(wrapper);
  }

  saveHist();
  toast(`Added ${behaviorName}`);
}

function removeBehaviorFromComponent(wrapper, behaviorName) {
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return;

  const c = JSON.parse(wrapper.dataset.c);
  if (behaviorName === c.b) {
    toast(`Can't remove primary behavior`);
    return;
  }

  const currentBehaviors = el.dataset.wb.split(/\s+/).filter(b => b && b !== behaviorName);
  el.dataset.wb = currentBehaviors.join(' ');

  c.behaviors = currentBehaviors;
  wrapper.dataset.c = JSON.stringify(c);

  WB.remove(el, behaviorName);
  WB.scan(wrapper);

  if (wrapper.classList.contains('selected')) {
    renderProps(wrapper);
  }

  saveHist();
  toast(`Removed ${behaviorName}`);
}

function getComponentBehaviors(wrapper) {
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return [];
  return el.dataset.wb.split(/\s+/).filter(Boolean);
}

window.toggleBehavior = (wrapperId, behaviorName, enabled) => {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;
  if (enabled) addBehaviorToComponent(wrapper, behaviorName);
  else removeBehaviorFromComponent(wrapper, behaviorName);
};

window.getComponentBehaviors = getComponentBehaviors;
window.addBehaviorToComponent = addBehaviorToComponent;
window.removeBehaviorFromComponent = removeBehaviorFromComponent;

// === BUILDER INTERACTIONS ===
let builderCleanup = [];

function enableBuilderInteractions() {
  if (builderCleanup.length > 0) return;

  const cv = document.getElementById('canvas');
  
  // Drag handlers
  const handleDragStart = createDragStartHandler();
  const handleDragEnd = createDragEndHandler();
  const handleDragOver = createDragOverHandler(cv);
  const handleDragLeave = createDragLeaveHandler(cv);
  const handleDrop = createDropHandler(cv, {
    add: (c, parentId) => add(c, parentId, deps),
    addToGrid: (c, gridWrapper) => addToGrid(c, gridWrapper, deps),
    addToContainer: (comp, wrapper, dropZone, ref) => addToContainer(comp, wrapper, dropZone, ref, deps),
    addBehaviorToComponent,
    toast,
    saveHist,
    WB,
    findContainerFromTarget,
    canDropInto,
    renderProps
  });

  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('dragend', handleDragEnd);
  cv.addEventListener('dragover', handleDragOver);
  cv.addEventListener('dragleave', handleDragLeave);
  cv.addEventListener('drop', handleDrop);

  // Click selection
  const handleClick = (e) => {
    const clickedWrapper = e.target.closest('.dropped');
    if (clickedWrapper && !e.target.closest('.controls')) {
      let propKey = null;
      let el = e.target;
      while (el && el !== clickedWrapper && clickedWrapper.contains(el)) {
        const key = getEditableKey(el);
        if (key) {
          if (key !== 'text') { propKey = key; break; }
          else if (!propKey) { propKey = key; }
        }
        el = el.parentElement;
      }
      selComp(clickedWrapper, propKey);
    }
    if (!e.target.closest('.save-dropdown')) {
      document.getElementById('saveMenu')?.classList.remove('show');
    }
  };
  document.addEventListener('click', handleClick);

  // Keyboard shortcuts
  const handleKeydown = (e) => {
    const target = e.target;
    const isEditing = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    if (e.key === 'Escape') {
      closeShortcuts();
      closeTemplates();
      closeDocsModal();
      const currentSel = getSelection();
      if (currentSel) {
        currentSel.classList.remove('selected');
        setSelection(null);
        renderTree();
        const propsPanel = document.getElementById('propsPanel');
        if (propsPanel) propsPanel.innerHTML = '';
      }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      const sel = getSelection();
      switch (e.key.toLowerCase()) {
        case 'z': if (!e.shiftKey) { e.preventDefault(); window.undo(); } break;
        case 'y': e.preventDefault(); window.redo(); break;
        case 's': e.preventDefault(); savePage(); break;
        case 'e': e.preventDefault(); exportJSON(); break;
        case 'i': if (!isEditing) { e.preventDefault(); importJSON(); } break;
        case 'p': e.preventDefault(); togglePreview(); break;
        case 'd': if (!isEditing && sel) { e.preventDefault(); duplicateComponent(sel.id); } break;
        case 'c': if (!isEditing && sel) { e.preventDefault(); copyAsHTML(); } break;
      }
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        toggleNotesDrawer();
      }
      return;
    }

    if (isEditing) return;

    const sel = getSelection();
    switch (e.key) {
      case 'Delete':
      case 'Backspace': if (sel) { e.preventDefault(); del(sel.id, deps); } break;
      case 'ArrowUp': if (sel && !snapEnabled) { e.preventDefault(); moveUp(sel.id, deps); } break;
      case 'ArrowDown': if (sel && !snapEnabled) { e.preventDefault(); moveDown(sel.id, deps); } break;
      case 't': case 'T': openTemplates(); break;
      case 'g': case 'G': toggleSnapGrid(!snapEnabled); break;
      case 'f': case 'F': if (sel) { const c = JSON.parse(sel.dataset.c); toggleFavorite(c.b); } break;
      case '?': showShortcuts(); break;
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // Context menu
  const handleContextMenu = createContextMenuHandler();
  document.addEventListener('contextmenu', handleContextMenu);

  // Live editing
  const handleInput = (e) => {
    const target = e.target;
    const isEditable = target.classList.contains('canvas-editable') || target.isContentEditable;
    if (!isEditable) return;
    const wrapper = target.closest('.dropped');
    if (!wrapper) return;

    let key = target.dataset.editableKey || getEditableKey(target) || 'text';
    const newValue = target.textContent;
    const c = JSON.parse(wrapper.dataset.c);
    if (c.d) {
      c.d[key] = newValue;
      wrapper.dataset.c = JSON.stringify(c);
    }
    
    clearTimeout(window.editDebounce);
    window.editDebounce = setTimeout(() => saveHist(), 500);
  };
  cv?.addEventListener('input', handleInput);

  // Inline editing
  const cleanupInline = initInlineEditing(cv, { WB });

  // Cleanup function
  builderCleanup.push(() => {
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragend', handleDragEnd);
    cv.removeEventListener('dragover', handleDragOver);
    cv.removeEventListener('dragleave', handleDragLeave);
    cv.removeEventListener('drop', handleDrop);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('contextmenu', handleContextMenu);
    cv?.removeEventListener('input', handleInput);
    if (cleanupInline) cleanupInline();
  });
}

function disableBuilderInteractions() {
  builderCleanup.forEach(fn => fn());
  builderCleanup = [];
}

// === THEME ===
function populateThemeSelect() {
  const select = document.getElementById('pageTheme');
  if (!select) return;
  select.innerHTML = THEMES.map(t => `<option value="${t.id}" title="${t.description}">${t.name}</option>`).join('');
  select.addEventListener('change', (e) => {
    const theme = e.target.value;
    document.documentElement.dataset.theme = theme;
    document.getElementById('canvas').dataset.theme = theme;
    toast(`Theme: ${theme}`);
  });
}

// === SAVE/LOAD ===
window.savePage = async () => {
  const cv = document.getElementById('canvas');
  const allWrappers = cv.querySelectorAll('.dropped');
  let issueCount = 0;
  allWrappers.forEach(w => {
    const analysis = analyzeComponent(w);
    issueCount += analysis.issues.length;
  });

  if (issueCount > 0) {
    const proceed = confirm(`⚠️ ${issueCount} required field${issueCount > 1 ? 's are' : ' is'} missing.\n\nSave anyway?`);
    if (!proceed) {
      toast('Save cancelled - fix issues first');
      updateBadges();
      return;
    }
  }

  const components = Array.from(cv.querySelectorAll('.dropped')).map(w => JSON.parse(w.dataset.c));
  const pageData = { version: '1.0', created: new Date().toISOString(), components };

  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: 'data/builder-page.json', data: pageData })
    });
    if (response.ok) toast('Page saved!');
    else toast('Save failed');
  } catch (e) {
    toast('Save error: ' + e.message);
  }
};

function load() {
  const data = localStorage.getItem('wb-builder-page');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach(c => add(c, null, deps));
      } else {
        if (parsed.theme) {
          document.getElementById('pageTheme').value = parsed.theme;
          document.documentElement.dataset.theme = parsed.theme;
          document.getElementById('canvas').dataset.theme = parsed.theme;
        }
        if (parsed.templateName) document.body.dataset.templateName = parsed.templateName;
        if (parsed.components) {
          parsed.components.forEach(c => {
            add(c, null, deps);
            if (c.children) {
              const gridWrapper = document.getElementById(c.id);
              c.children.forEach(gc => {
                addToGrid(gc, gridWrapper, deps);
                if (gc.span) setSpan(gc.id, parseInt(gc.span), saveHist);
              });
            }
          });
        }
      }
      setTimeout(() => updateBadges(), 100);
    } catch (e) { console.error(e); }
  }
}

// === MAIN START ===
async function start() {
    // Ensure builder-layout is never collapsed
    document.querySelector('.builder-layout')?.classList.remove('collapsed');
  Events.setupGlobalHandlers();
  await loadPropertyConfig();

  try {
    const compRes = await fetch('src/builder/components.json?caller=builder-index');
    if (compRes.ok) C.All = await compRes.json();
  } catch (e) {
    console.error('Failed to load builder config:', e);
  }

  populateThemeSelect();
  exclusions = await getComponentExclusions();

  await WB.init({ scan: true, observe: true });
  await initTemplateBrowser();

  enableBuilderInteractions();
  load();
  // --- Auto-expand canvas sections if empty ---
  setTimeout(() => {
    const hasComponents = document.querySelector('.dropped');
    if (!hasComponents) {
      // Remove 'collapsed' from main, header, and footer (use class selectors)
      document.querySelector('.canvas-section.main')?.classList.remove('collapsed');
      document.querySelector('.canvas-section.header')?.classList.remove('collapsed');
      document.querySelector('.canvas-section.footer')?.classList.remove('collapsed');
    }
  }, 0);
  initNotes(); // Only sets up textarea, does NOT open notes drawer
  updateVPInfo();
  initCanvasEditing();
  restorePanelTab();
  setupPanelKeyboardShortcuts();
  setupTemplateMessageListener();

  setTimeout(() => {
    initWorkflow();
  }, 200);
}

function initCanvasEditing() {
  const cv = document.getElementById('canvas');
  if (!cv) return;
  injectEditingStyles();
  initInlineEditing(cv, { onSave: (wid, key, value) => { renderProps(document.getElementById(wid)); saveHist(); }, WB });
  initResizeHandles(cv);
  initSnapGrid(cv);
}

function updateVPInfo() {
  const vpInfo = document.getElementById('vpInfo');
  if (!vpInfo) return;
  const size = VP_SIZES[currentVP];
  vpInfo.textContent = size.w + ' × ' + size.h + 'px';
}

// === NOTES (Minimal) ===
function initNotes() {
  const textarea = document.getElementById('notesArea');
  if (textarea) {
    textarea.value = localStorage.getItem('wb-builder-notes') || '';
    textarea.addEventListener('input', () => localStorage.setItem('wb-builder-notes', textarea.value));
  }
}

window.toggleNotesDrawer = () => {
  // Prefer opening the builder's Issues component to avoid duplicate UIs
  const builderIssues = document.getElementById('builderIssuesDrawer') || document.querySelector('wb-issues#builderIssuesDrawer') || document.querySelector('wb-issues');
  if (builderIssues) {
    if (typeof builderIssues.open === 'function') { builderIssues.open(); return; }
    const trigger = builderIssues.querySelector('.wb-issues__trigger');
    if (trigger) { trigger.click(); return; }
  }

  // Fallback to legacy notes modal if present
  const notesModal = document.getElementById('notesModal');
  const backdrop = document.getElementById('notesBackdrop');
  if (!notesModal) return;
  const isOpen = notesModal.classList.toggle('open');
  backdrop?.classList.toggle('open', isOpen);
};

// === FAVORITES ===
window.toggleFavorite = (behavior) => {
  const idx = favorites.indexOf(behavior);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    toast('Removed from favorites');
  } else {
    favorites.push(behavior);
    toast('Added to favorites');
  }
  localStorage.setItem('wb-favorites', JSON.stringify(favorites));
};

window.clearFavorites = () => {
  if (confirm('Clear all favorites?')) {
    favorites = [];
    localStorage.setItem('wb-favorites', JSON.stringify(favorites));
    toast('Favorites cleared');
  }
};

// === SHORTCUTS ===
window.showShortcuts = () => document.getElementById('shortcutsModal')?.classList.add('open');
window.closeShortcuts = () => document.getElementById('shortcutsModal')?.classList.remove('open');
window.openTemplates = openTemplatesChooser;
window.closeTemplates = hideWelcome;

// === PREVIEW ===
import { togglePreview } from './builder-preview.js';
window.togglePreview = togglePreview;

// === SNAP GRID ===
window.toggleSnapGrid = (enabled) => {
  snapEnabled = enabled;
  const cv = document.getElementById('canvas');
  cv?.classList.toggle('snap-enabled', enabled);
  const checkbox = document.getElementById('snapGrid');
  if (checkbox) checkbox.checked = enabled;
  localStorage.setItem('wb-snap-grid', enabled);
  toast(enabled ? 'Snap grid enabled' : 'Snap grid disabled');
};

// === VIEWPORT ===
window.setVP = (s) => {
  currentVP = s;
  const f = document.querySelector('.frame');
  document.querySelectorAll('.tool-btn[data-vp]').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tool-btn[vp="${s}"]`)?.classList.add('active');
  f.style.maxWidth = VP_SIZES[s].w + 'px';
  updateVPInfo();
};

// === SAVE MENU ===
window.toggleSaveMenu = () => document.getElementById('saveMenu')?.classList.toggle('show');
window.saveAsHTML = () => { /* See builder-io.js */ };
window.exportJSON = () => { /* See builder-io.js */ };
window.importJSON = () => { /* See builder-io.js */ };
window.resetCanvas = () => {
  if (confirm('Reset canvas?')) {
    document.getElementById('canvas').innerHTML = '<div class="empty" id="empty"><div class="empty-icon">+</div><h3>Drag components here</h3><p>Build your page visually</p></div>';
    localStorage.removeItem('wb-builder-page');
    setSelection(null);
    hist = [];
    hi = -1;
    setComponentIdCounter(0);
    updCount();
    renderTree();
  }
};

// === EXPOSE CORE FUNCTIONS ===
window.add = (c, parentId) => add(c, parentId, deps);
window.addToGrid = (c, gridWrapper) => addToGrid(c, gridWrapper, deps);
window.addToContainer = (comp, wrapper, dropZone, ref) => addToContainer(comp, wrapper, dropZone, ref, deps);
window.toast = toast;
window.saveHist = saveHist;
window.upd = upd;
window.updCount = updCount;
window.renderPropertiesPanel = renderPropertiesPanel;
window.renderDOMElementProperties = renderDOMElementProperties;
window.loadPropertyConfig = loadPropertyConfig;
window.showDocs = showDocs;
window.closeDocsModal = closeDocsModal;
window.switchDocsTab = switchDocsTab;
window.findDropZone = findDropZone;
window.autoExtendCanvas = autoExtendCanvas;
window.renderTree = renderTree;
window.renderDecorationsPanel = renderDecorationsPanel;

// === INIT NEW FEATURES ===
function initNewFeatures() {
  bindToggleButtons();
  initCanvasSections();
  initTree();
  
  if (localStorage.getItem('wb-collab-enabled') === 'true') {
    initCollaboration();
  } else {
    updateCollabStatus('offline');
  }
  
  if (localStorage.getItem('wb-snap-grid') === 'true') {
    setTimeout(() => window.toggleSnapGrid(true), 100);
  }
}

function bindToggleButtons() {
  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.onclick = () => window.togglePreview();
    // Initial state
    updatePreviewBtnState();
  }
  // Other buttons
  const bindings = [
    { id: 'templatesBtn', fn: window.openTemplates },
    { id: 'shortcutsBtn', fn: window.showShortcuts },
    { id: 'undoBtn', fn: window.undo },
    { id: 'redoBtn', fn: window.redo },
    { id: 'saveHtmlBtn', fn: window.saveAsHTML },
    { id: 'exportBtn', fn: window.exportJSON },
    { id: 'importBtn', fn: window.importJSON },
    { id: 'clearCanvasBtn', fn: window.resetCanvas },
    { id: 'shortcutsCloseBtn', fn: window.closeShortcuts },
    { id: 'templatesCloseBtn', fn: window.closeTemplates },
    { id: 'docsCloseBtn', fn: closeDocsModal },
    { id: 'favoritesClearBtn', fn: window.clearFavorites }
  ];
  bindings.forEach(({ id, fn }) => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = fn;
  });
}

function updatePreviewBtnState() {
  const previewBtn = document.getElementById('previewBtn');
  if (!previewBtn) return;
  const canvas = document.getElementById('canvas');
  const hasComponents = canvas && canvas.querySelector('.dropped');
  previewBtn.disabled = !hasComponents;
  previewBtn.classList.toggle('disabled', !hasComponents);
}

// Observe canvas for changes to enable/disable preview button
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  if (canvas) {
    const observer = new MutationObserver(updatePreviewBtnState);
    observer.observe(canvas, { childList: true, subtree: true });
    updatePreviewBtnState();
  }
});
  
  document.getElementById('docsTabBtn')?.addEventListener('click', () => switchDocsTab('docs'));
  document.getElementById('schemaTabBtn')?.addEventListener('click', () => switchDocsTab('schema'));
  document.getElementById('snapGrid')?.addEventListener('change', (e) => window.toggleSnapGrid(e.target.checked));
  document.getElementById('search')?.addEventListener('input', filter);
  
  document.querySelectorAll('.category-expander-btn[data-category]').forEach(btn => {
    btn.addEventListener('click', () => toggleCategory(btn.dataset.category));
  });
}

window.filter = () => {
  const s = document.getElementById('search')?.value.toLowerCase() || '';
  document.querySelectorAll('.comp-item').forEach(i => {
    i.style.display = i.textContent.toLowerCase().includes(s) ? '' : 'none';
  });
};

// === BUILDER API ===
window.builderAPI = {
  add: (c, parentId) => add(c, parentId, deps),
  remove: (id) => del(id, deps),
  update: (id, props) => {
    const el = document.getElementById(id);
    if (el && el.classList.contains('dropped')) {
      Object.entries(props).forEach(([key, value]) => {
        if (key.startsWith('data-')) el.setAttribute(key, value);
        else el[key] = value;
      });
      WB.scan(el);
      saveHist();
      return el;
    }
    return null;
  },
  reset: () => {
    const cv = document.getElementById('canvas');
    if (cv) {
      cv.innerHTML = '';
      updCount();
      renderTree();
      autoExtendCanvas();
      saveHist();
      return true;
    }
    return false;
  },
  get: (id) => document.getElementById(id)
};

// Start on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { start(); initNewFeatures(); });
} else {
  start();
  initNewFeatures();
}
