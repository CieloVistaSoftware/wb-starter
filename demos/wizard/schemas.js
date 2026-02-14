// wizard/schemas.js -- Schema loading and lookup with tag-map integration

import { state } from './state.js';
import { getElementBehavior, getExtensionBehavior } from '../../src/core/tag-map.js';
import { logError } from '../../src/core/error-logger.js';

export async function loadSchemas() {
  var picker = document.getElementById('componentPicker');
  var compDesc = document.getElementById('compDesc');

  try {
    var res = await fetch('/data/schema-index.json');
    if (!res.ok) res = await fetch('../data/schema-index.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    state.schemas = data.schemas;
    console.log('[Wizard] Loaded ' + state.schemas.length + ' schemas from schema-index.json');

    // Categorize schemas using tag-map.js + schema metadata
    var categories = {};
    
    for (var i = 0; i < state.schemas.length; i++) {
      var s = state.schemas[i];
      
      // Determine category from schema metadata or type
      var category = 'Components';
      if (s._metadata && s._metadata.category) {
        category = s._metadata.category.charAt(0).toUpperCase() + s._metadata.category.slice(1);
      } else if (getExtensionBehavior('x-' + s.name)) {
        category = 'Extensions';
      }
      
      if (!categories[category]) categories[category] = [];
      categories[category].push(s);
    }

    // Populate picker with grouped optgroups (sorted by category name)
    var catNames = Object.keys(categories).sort();
    for (var c = 0; c < catNames.length; c++) {
      var catName = catNames[c];
      var optgroup = document.createElement('optgroup');
      optgroup.label = catName + ' (' + categories[catName].length + ')';
      
      // Sort schemas by title
      categories[catName].sort(function(a, b) {
        return (a.title || '').localeCompare(b.title || '');
      });
      
      for (var j = 0; j < categories[catName].length; j++) {
        var schema = categories[catName][j];
        var opt = document.createElement('option');
        opt.value = schema.name;
        opt.textContent = schema.title + ' (' + schema.tag + ')';
        opt.dataset.tag = schema.tag;
        opt.dataset.behavior = schema.name;
        optgroup.appendChild(opt);
      }
      
      picker.appendChild(optgroup);
    }
    
    console.log('[Wizard] Organized ' + state.schemas.length + ' components into ' + catNames.length + ' categories');
  } catch (e) {
    const errorObj = {
      message: e.message || 'Schema load failed',
      to: 'WizardUI',
      file: 'demos/wizard/schemas.js',
      stack: e.stack,
      reason: 'Error loading schemas or components',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    logError(errorObj.message, errorObj);
    if (compDesc) {
      compDesc.innerHTML =
        '<div style="padding:1rem;background:rgba(239,68,68,0.1);border:1px solid #ef4444;border-radius:6px;">'
        + '<div style="font-weight:600;color:#dc2626;margin-bottom:0.5rem;">❌ Error Loading Components</div>'
        + '<pre style="font-size:12px;color:#b91c1c;background:transparent;white-space:pre-wrap;">'
        + escapeHtml(JSON.stringify(errorObj, null, 2))
        + '</pre></div>';
    }
  }
}

export function findSchema(name) {
  return state.schemas.find(function(s) { return s.name === name; });
}

export function findSchemaByTag(tag) {
  return state.schemas.find(function(s) { return s.tag === tag; });
}

/**
 * Check if a schema is an extension (x-* behavior)
 * Uses tag-map.js for authoritative check
 * @param {string} name - Behavior name
 * @returns {boolean}
 */
export function isExtension(name) {
  return !!getExtensionBehavior('x-' + name);
}

/**
 * Get all element components (non-extensions)
 * @returns {Array} Component schemas
 */
export function getComponents() {
  return state.schemas.filter(function(s) {
    return !isExtension(s.name);
  });
}

/**
 * Get all extension behaviors
 * @returns {Array} Extension schemas
 */
export function getExtensions() {
  return state.schemas.filter(function(s) {
    return isExtension(s.name);
  });
}
