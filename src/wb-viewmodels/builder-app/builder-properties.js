/**
 * WB Builder Properties System
 * Enhanced property panel rendering with proper UI controls
 * Uses: data/propertyconfig.json
 */

import { CARD_TYPES } from '../card.js';

let propertyConfig = null;
let configLoaded = false;

export async function loadPropertyConfig() {
  if (configLoaded) return propertyConfig;
  try {
    const response = await fetch('/data/propertyconfig.json?caller=builder-properties');
    propertyConfig = await response.json();
    configLoaded = true;
    console.log('[Properties] Config loaded:', Object.keys(propertyConfig.properties).length, 'properties');
    return propertyConfig;
  } catch (err) {
    console.error('[Properties] Failed to load config:', err);
    return null;
  }
}

export function getPropertyDef(propName, componentBehavior) {
  if (!propertyConfig) return null;
  
  // 1. Check global definition first to get base config
  let def = propertyConfig.properties[propName];
  
  // 2. Check for componentOverrides inside the property definition
  if (def && def.componentOverrides && componentBehavior && def.componentOverrides[componentBehavior]) {
    // Merge base definition with override
    def = { ...def, ...def.componentOverrides[componentBehavior] };
  }

  // 3. Check legacy behaviors block (if it exists)
  if (componentBehavior && propertyConfig.behaviors && propertyConfig.behaviors[componentBehavior]) {
    const behaviorProps = propertyConfig.behaviors[componentBehavior];
    if (behaviorProps[propName]) {
      def = behaviorProps[propName];
    }
  }
  
  return def;
}

export function getDefaultValue(propName, componentBehavior) {
  const def = getPropertyDef(propName, componentBehavior);
  return def ? def.default : null;
}

export function getCategory(categoryName) {
  if (!propertyConfig || !propertyConfig.categories) return { label: categoryName, order: 99 };
  return propertyConfig.categories[categoryName] || { label: categoryName, order: 99 };
}

export function isCanvasEditable(propName, componentBehavior) {
  const def = getPropertyDef(propName, componentBehavior);
  return def && def.ui === 'canvasEditable';
}

export function renderPropertyControl(wrapperId, propName, currentValue, componentBehavior) {
  const def = getPropertyDef(propName, componentBehavior);
  if (!def) {
    return `<input class="prop-input" value="${escapeHtml(currentValue || '')}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
  }

  const uiType = def.ui || 'text';
  const defaultValue = def.default;
  let value = currentValue ?? defaultValue ?? '';
  const id = `prop-${wrapperId}-${propName}`;

  const isTextLike = ['text', 'number', 'email', 'url', 'tel', 'cssValue', 'textarea'].includes(uiType) || !['checkbox', 'boolean', 'select', 'color', 'date', 'time', 'datetime', 'file', 'image', 'audio', 'video', 'canvasEditable'].includes(uiType);
  
  let placeholder = def.placeholder || (defaultValue !== undefined && defaultValue !== null ? String(defaultValue) : '');
  
  if (isTextLike && String(value) === String(defaultValue)) {
    value = '';
  }

  switch (uiType) {
    case 'canvasEditable':
      return `<textarea class="prop-input" id="${id}" rows="3" placeholder="${escapeHtml(placeholder)}" oninput="updP('${wrapperId}','${propName}',this.value)">${escapeHtml(value)}</textarea>`;
    case 'checkbox': {
      const isChecked = value === 'true' || value === true;
      return `<label class="prop-toggle"><input type="checkbox" id="${id}" ${isChecked ? 'checked' : ''} onchange="updP('${wrapperId}','${propName}',this.checked)"><span class="prop-toggle-slider"></span><span class="prop-toggle-label">${isChecked ? 'On' : 'Off'}</span></label>`;
    }
    case 'text':
      return `<input type="text" class="prop-input" id="${id}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
    case 'number':
      return `<input type="number" class="prop-input" id="${id}" value="${value}" placeholder="${escapeHtml(placeholder)}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
    case 'boolean': {
      const boolChecked = value === 'true' || value === true;
      return `<label class="prop-toggle"><input type="checkbox" id="${id}" ${boolChecked ? 'checked' : ''} onchange="updP('${wrapperId}','${propName}',this.checked)"><span class="prop-toggle-slider"></span><span class="prop-toggle-label">${boolChecked ? 'On' : 'Off'}</span></label>`;
    }
    case 'select':
      return `<select class="prop-input" id="${id}" onchange="updP('${wrapperId}','${propName}',this.value)">${(def.options || []).map(opt => {
        const optValue = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
        const optLabel = (typeof opt === 'object' && opt !== null) ? (opt.label || opt.value) : opt;
        const isSelected = String(optValue) === String(value);
        return `<option value="${escapeHtml(String(optValue))}"${isSelected ? ' selected' : ''}>${escapeHtml(String(optLabel))}</option>`;
      }).join('')}</select>`;
    case 'color':
      return `<input type="color" class="prop-input" id="${id}" value="${value}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
    case 'date':
      return `<input type="date" class="prop-input" id="${id}" value="${value}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
    case 'time':
      return `<input type="time" class="prop-input" id="${id}" value="${value}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
    case 'datetime':
      return `<input type="datetime-local" class="prop-input" id="${id}" value="${value}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
    case 'file':
    case 'image':
    case 'audio':
    case 'video':
      return renderFileControl(wrapperId, propName, value, uiType, def);
    case 'cssValue':
      return `<input type="text" class="prop-input prop-css" id="${id}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
    default:
      return `<input type="text" class="prop-input" id="${id}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" oninput="updP('${wrapperId}','${propName}',this.value)">`;
  }
}

function renderFileControl(wrapperId, propName, value, uiType, def) {
  const accept = {
    'file': '*/*',
    'image': 'image/*',
    'audio': 'audio/*',
    'video': 'video/*'
  }[uiType] || '*/*';
  
  const id = `prop-${wrapperId}-${propName}`;
  const hasValue = value && value.trim();
  
  let preview = '';
  if (hasValue) {
    if (uiType === 'image') {
      preview = `<img src="${value}" class="prop-file-preview-img" alt="Preview">`;
    } else if (uiType === 'audio') {
      preview = `<audio src="${value}" controls class="prop-file-preview-audio"></audio>`;
    } else if (uiType === 'video') {
      preview = `<video src="${value}" controls class="prop-file-preview-video"></video>`;
    } else {
      preview = `<span class="prop-file-name">📄 ${value.split('/').pop()}</span>`;
    }
  }
  
  return `
    <div class="prop-file-group" data-wrapper="${wrapperId}" data-prop="${propName}">
      ${preview ? `<div class="prop-file-preview">${preview}</div>` : ''}
      <div class="prop-file-controls">
        <input type="file" id="${id}" accept="${accept}" 
               class="prop-file-input" 
               onchange="handleFileUpload(this, '${wrapperId}', '${propName}', '${uiType}')">
        <label for="${id}" class="prop-file-btn">📁 Choose File</label>
        <input type="text" class="prop-input prop-file-url" value="${escapeHtml(value)}"
               placeholder="Or enter URL..."
               oninput="updP('${wrapperId}','${propName}',this.value)">
        ${hasValue ? `<button class="prop-file-clear" onclick="clearFileValue('${wrapperId}','${propName}')" title="Clear">✕</button>` : ''}
      </div>
    </div>`;
}

// Stub - Properties panel feature removed
export function renderPropertiesPanel(wrapper, panelElement, onChange = null, scrollToProperty = null) {
  // Feature removed
  return;
  /*
  try {
  if (!propertyConfig) {
    panelElement.innerHTML = '<div class="prop-loading">Loading properties...</div>';
    return;
  }
  
  const componentData = JSON.parse(wrapper.dataset.c || '{}');
  const wrapperId = wrapper.id;
  const behavior = componentData.b || '';
  const currentProps = componentData.d || {};
  
  const section = wrapper.closest('.canvas-section');
  const sectionId = section?.dataset?.section || 'main';
  
  const defaultProps = (propertyConfig.componentDefaults && propertyConfig.componentDefaults[behavior]) || {};
  const allPropNames = new Set([...Object.keys(currentProps), ...Object.keys(defaultProps)]);
  
  const universalProps = ['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'padding', 'gap', 'margin', 'position', 'align', 'justify'];
  universalProps.forEach(p => {
    if (getPropertyDef(p, behavior)) {
      allPropNames.add(p);
    }
  });

  if (onChange) {
    window._propOnChange = onChange;
  }
  
  const grouped = {};
  
  for (const propName of allPropNames) {
    const def = getPropertyDef(propName, behavior);
    const propValue = currentProps.hasOwnProperty(propName) ? currentProps[propName] : (defaultProps[propName] ?? def?.default);
    
    const category = def?.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push({
      name: propName,
      value: propValue,
      def: def || { label: propName, ui: 'text' }
    });
  }
  
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const orderA = getCategory(a).order || 99;
    const orderB = getCategory(b).order || 99;
    return orderA - orderB;
  });
  
  let html = '<div class="prop-panel-flexcol">';
  
  html += `<div class="prop-header">
    <div class="prop-header-left">
      <span class="prop-header-title">${behavior || componentData.n || 'Component'}</span>
    </div>
    <button class="prop-header-btn" onclick="copyComponentDebugInfo('${wrapperId}')" title="Copy All (Debug Info)">📋</button>
    <button class="prop-header-help" onclick="showDocs('${behavior}')" title="View Documentation">❓</button>
  </div>`;
  
  html += `<div class="prop-category">
    <div class="prop-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="prop-category-label">🆔 Element ID</span>
      <span class="prop-category-toggle">▼</span>
    </div>
    <div class="prop-category-body">
      <div class="prop-row">
        <div class="prop-row-header">
          <label class="prop-label" style="font-family:monospace">id</label>
        </div>
        <div class="prop-control">
          <input type="text" class="prop-input" value="${wrapperId}" 
                 placeholder="Auto-generated ID"
                 onchange="window.updateElementId('${wrapperId}', this.value)">
          <small style="color:var(--text-muted);font-size:10px;margin-top:2px;display:block">Auto-assigned. Change to custom ID if needed.</small>
        </div>
      </div>
    </div>
  </div>`;

  if (behavior.startsWith('card')) {
    const cardTypes = CARD_TYPES;
    
    html += `<div class="prop-category">
      <div class="prop-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
        <span class="prop-category-label">Variant</span>
        <span class="prop-category-toggle">▼</span>
      </div>
      <div class="prop-category-body">
        <div class="prop-row">
          <div class="prop-row-header">
            <label class="prop-label">Card Type</label>
          </div>
          <div class="prop-control">
            <select class="prop-input" onchange="changeCardType('${wrapperId}', this.value)">
              ${cardTypes.map(type => `<option value="${type}"${type === behavior ? ' selected' : ''}>${type}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </div>`;
  }

  for (const cat of sortedCategories) {
    const catDef = getCategory(cat);
    html += `<div class="prop-category${catDef.collapsed ? ' collapsed' : ''}">
      <div class="prop-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
        <span class="prop-category-label">${catDef.label}</span>
        <span class="prop-category-toggle">▼</span>
      </div>
      <div class="prop-category-body">`;
      
    for (const prop of grouped[cat]) {
      const label = prop.name;
      
      html += `<div class="prop-row">
        <div class="prop-row-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <label class="prop-label" title="${prop.name}" style="margin-bottom:0;font-family:monospace;font-size:0.8rem;">${label}</label>
        </div>
        <div class="prop-control">
          ${renderPropertyControl(wrapperId, prop.name, prop.value, behavior)}
        </div>
      </div>`;
    }
    
    html += `</div></div>`;
  }
  
  html += '</div>';
  panelElement.innerHTML = html;

  if (scrollToProperty) {
    setTimeout(() => {
      const propId = `prop-${wrapperId}-${scrollToProperty}`;
      const propEl = document.getElementById(propId);
      if (propEl) {
        const row = propEl.closest('.prop-row');
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.transition = 'background 0.3s';
          row.style.background = 'rgba(59, 130, 246, 0.2)';
          setTimeout(() => {
            row.style.background = '';
          }, 1500);
        }
      }
    }, 50);
  }
  } catch (err) {
    console.error('Error rendering properties:', err);
    panelElement.innerHTML = `<div class="prop-error">Error: ${err.message}</div>`;
  }
  */
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Stub - DOM element properties feature removed
export function renderDOMElementProperties(el, elKey, panelElement) {
  // Feature removed - clicking DOM elements just highlights them
}

export default {
  loadPropertyConfig,
  getPropertyDef,
  getDefaultValue,
  getCategory,
  isCanvasEditable,
  renderPropertyControl,
  renderPropertiesPanel,
  renderDOMElementProperties
};
