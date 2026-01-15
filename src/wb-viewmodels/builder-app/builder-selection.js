/**
 * Builder Selection Module
 * Handles component selection, property rendering, and updates
 * 
 * @module builder-selection
 */

import { renderPropertiesPanel, renderDOMElementProperties } from './builder-properties.js';
import { showIssuesPanel, updateBadges } from './builder-incomplete.js';
import { renderDecorationsPanel } from './builder-decorations.js';
import BuilderValidation from './builder-validation.js';

// Currently selected component
let sel = null;

/**
 * Get the currently selected component
 * @returns {HTMLElement|null} Selected element
 */
export function getSelection() {
  return sel;
}

/**
 * Set the currently selected component
 * @param {HTMLElement|null} element - Element to select
 */
export function setSelection(element) {
  sel = element;
}

/**
 * Select a component and render its properties
 * @param {HTMLElement} w - Wrapper element to select
 * @param {string|null} scrollToProperty - Property key to scroll to
 * @param {boolean} switchTab - Whether to switch tabs (NOT USED - user controls tabs)
 */
export function selComp(w, scrollToProperty = null, switchTab = false) {
  // Remove selection from all
  document.querySelectorAll('.dropped').forEach(d => d.classList.remove('selected'));
  
  // Add selection (GREEN highlight via CSS)
  w.classList.add('selected');
  sel = w;
  window.sel = w; // Also expose globally
  
  // Render tree to update selection state
  if (window.renderTree) window.renderTree();
  
  // Scroll tree panel to show selected item
  setTimeout(() => {
    if (window.scrollTreeToSelected) window.scrollTreeToSelected(w.id);
  }, 50);

  // CRITICAL: NEVER auto-switch tabs. User controls tabs.
  // Only re-render current panel content
  const currentTab = localStorage.getItem('wb-active-panel-tab') || 'tree';

  if (currentTab === 'decorate') {
    const decoratePanel = document.getElementById('decoratePanel');
    if (decoratePanel && typeof renderDecorationsPanel === 'function') {
      renderDecorationsPanel(w, decoratePanel);
    }
  }

  // Render properties for selected component
  renderProps(w, scrollToProperty);
}

/**
 * Render properties panel for a component
 * @param {HTMLElement} w - Wrapper element
 * @param {string|null} scrollToProperty - Property key to scroll to
 */
export function renderProps(w, scrollToProperty = null) {
  const p = document.getElementById('propsPanel');
  if (!p) return;

  // Cleanup header subtitle when a component is selected
  const propsHeader = document.getElementById('propsHeader');
  if (propsHeader) {
    const subtitle = propsHeader.querySelector('span');
    if (subtitle) subtitle.style.display = 'none';
  }

  // Use the enhanced property panel system
  renderPropertiesPanel(w, p, (wid, key, value) => {
    updP(wid, key, value);
  }, scrollToProperty);

  // Show issues panel for this component
  showIssuesPanel(w);
}

/**
 * Update a property value on a component
 * @param {string} wid - Wrapper element ID
 * @param {string} k - Property key
 * @param {*} v - Property value
 */
export async function updP(wid, k, v) {
  const w = document.getElementById(wid);
  if (!w) return;
  
  const c = JSON.parse(w.dataset.c);
  const oldValue = c.d?.[k];
  if (!c.d) c.d = {};
  c.d[k] = v;

  // Track if icon changed (for tree refresh)
  let iconChanged = false;

  // Update icon when alert type changes
  if (c.b === 'alert' && k === 'type') {
    const alertIcons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    c.i = alertIcons[v] || 'ℹ️';
    iconChanged = true;
  }

  w.dataset.c = JSON.stringify(c);

  // Handle system properties that affect the wrapper directly
  if (k === '_posX') {
    w.style.left = v;
    if (w.style.position !== 'absolute' && w.style.position !== 'fixed') {
      w.style.position = 'absolute';
    }
  } else if (k === '_posY') {
    w.style.top = v;
    if (w.style.position !== 'absolute' && w.style.position !== 'fixed') {
      w.style.position = 'absolute';
    }
  } else if (k === '_zIndex') {
    w.style.zIndex = v;
  } else if (k === '_width') {
    w.style.width = v;
    w.style.maxWidth = v;
  } else if (k === '_height') {
    w.style.height = v;
  }

  const el = w.querySelector('[data-wb]') || w.firstElementChild;
  if (el) {
    // Update the data attribute
    if (k === 'text') {
      el.textContent = v;
    } else if (k === 'src') {
      el.src = v;
    } else if (k === 'hoverText') {
      el.setAttribute('title', v);
      if (v) w.setAttribute('title', v);
      else w.removeAttribute('title');
    } else {
      el.dataset[k] = v;
    }

    // Update container styles directly for immediate feedback
    if (c.b === 'container') {
      if (k === 'gap') {
        el.style.gap = v;
        el.style.setProperty('--gap', v);
      } else if (k === 'direction') {
        el.style.flexDirection = v;
      } else if (k === 'wrap') {
        el.style.flexWrap = (v === true || v === 'true') ? 'wrap' : 'nowrap';
      } else if (k === 'align') {
        const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
        el.style.alignItems = alignMap[v] || v;
      } else if (k === 'justify') {
        const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };
        el.style.justifyContent = justifyMap[v] || v;
      } else if (k === 'padding') {
        el.style.padding = v;
      } else if (k === 'backgroundColor') {
        el.style.backgroundColor = v;
      } else if (k === 'textColor') {
        el.style.color = v;
      } else if (k === 'background') {
        el.style.backgroundImage = v ? `url('${v}')` : '';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      }
    }

    // Force re-render: remove wbReady flag and re-scan
    delete el.dataset.wbReady;
    if (window.WB) {
      window.WB.remove(el);
      window.WB.scan(w);
    }

    // Run validation and compliance test
    if (c.b && BuilderValidation) {
      const testResult = await BuilderValidation.runComplianceTest(c.b, el, k, v);

      if (!testResult.schemaValid || !testResult.behaviorValid) {
        w.dataset.pendingFix = JSON.stringify({
          component: c.b,
          property: k,
          invalidValue: v,
          errors: testResult.errors
        });
      } else if (w.dataset.pendingFix) {
        const pendingFix = JSON.parse(w.dataset.pendingFix);
        await BuilderValidation.logFix({
          component: c.b,
          property: k,
          issue: pendingFix.errors.map(e => e.message).join('; '),
          action: `Changed ${k} from invalid value to valid value`,
          oldValue: pendingFix.invalidValue,
          newValue: v
        });
        delete w.dataset.pendingFix;
      }
    }

    // Auto-wrap logic for width changes
    if (k === 'width') {
      if (v !== '100%' && v !== '') {
        w.style.display = 'inline-block';
        w.style.verticalAlign = 'top';
        w.style.marginRight = '0.5rem';
      } else {
        w.style.display = '';
        w.style.verticalAlign = '';
        w.style.marginRight = '';
      }
    }
  }

  // Only re-render tree if icon changed
  if (iconChanged && window.renderTree) {
    window.renderTree();
  }

  // Update incomplete badges
  updateBadges();

  // Refresh issues panel if this component is selected
  if (w.classList.contains('selected')) {
    showIssuesPanel(w);
  }

  if (window.saveHist) window.saveHist();
}

/**
 * Validate a component for required fields
 * @param {HTMLElement} wrapper - Component wrapper
 * @returns {Object} Validation result { valid, missing }
 */
export function validateComponent(wrapper) {
  const c = JSON.parse(wrapper.dataset.c || '{}');
  const el = wrapper.querySelector('[data-wb]');
  if (!el || !c.d) return { valid: true, missing: [] };

  const missing = [];

  // Check required fields based on component type
  const requiredFields = {
    'link': ['href'],
    'cardbutton': ['primary'],
    'cardimage': ['imageSrc'],
    'cardprofile': ['name'],
    'audio': ['src'],
    'video': ['src'],
    'cardpricing': ['plan', 'price']
  };

  const required = requiredFields[c.b] || [];

  for (const field of required) {
    const value = c.d[field] || el.dataset[field];
    if (!value || value.trim() === '') {
      missing.push(field);
    }
  }

  return { valid: missing.length === 0, missing };
}

/**
 * Change card type (morph between card variants)
 * @param {string} wrapperId - Wrapper element ID
 * @param {string} newType - New card type
 */
export function changeCardType(wrapperId, newType) {
  const w = document.getElementById(wrapperId);
  if (!w) return;

  const c = JSON.parse(w.dataset.c);
  const oldType = c.b;

  if (oldType === newType) return;

  // Update behavior
  c.b = newType;

  // Update name if it was the default name
  if (c.n.startsWith('Card')) {
    const typeName = newType.replace('card', '');
    c.n = 'Card ' + typeName.charAt(0).toUpperCase() + typeName.slice(1);
    if (newType === 'card') c.n = 'Card';
  }

  w.dataset.c = JSON.stringify(c);

  const el = w.querySelector('[data-wb]');
  if (el) {
    // Remove old behavior
    if (window.WB) window.WB.remove(el, oldType);

    // Update data-wb attribute
    const behaviors = el.dataset.wb.split(/\s+/);
    const newBehaviors = behaviors.map(b => b === oldType ? newType : b);
    el.dataset.wb = newBehaviors.join(' ');

    // Re-scan
    if (window.WB) window.WB.scan(w);

    // Refresh properties panel
    renderProps(w);

    // Refresh tree
    if (window.renderTree) window.renderTree();

    if (window.saveHist) window.saveHist();
    if (window.toast) window.toast(`Morphed to ${c.n}`);
  }
}

/**
 * Update element ID
 * @param {string} oldId - Current ID
 * @param {string} newId - New ID
 */
export function updateElementId(oldId, newId) {
  const w = document.getElementById(oldId);
  if (!w) return;
  
  newId = newId.trim();
  if (!newId) {
    if (window.toast) window.toast('ID cannot be empty');
    return;
  }
  
  if (document.getElementById(newId) && newId !== oldId) {
    if (window.toast) window.toast('ID already exists: ' + newId);
    return;
  }
  
  const sanitized = newId.replace(/[^a-zA-Z0-9_-]/g, '-');
  if (sanitized !== newId) {
    if (window.toast) window.toast('ID sanitized to: ' + sanitized);
    newId = sanitized;
  }
  
  w.id = newId;
  
  const innerEl = w.querySelector('[data-wb]');
  if (innerEl) {
    innerEl.id = newId + '-el';
  }
  
  if (sel && sel.id === oldId) {
    sel = w;
    window.sel = w;
  }
  
  if (window.renderTree) window.renderTree();
  if (window.saveHist) window.saveHist();
  if (window.toast) window.toast('ID updated to: ' + newId);
}

// Expose to window
window.selComp = selComp;
window.renderProps = renderProps;
window.updP = updP;
window.validateComponent = validateComponent;
window.changeCardType = changeCardType;
window.updateElementId = updateElementId;

// Expose sel as property
Object.defineProperty(window, 'sel', {
  get: () => sel,
  set: (v) => { sel = v; }
});
