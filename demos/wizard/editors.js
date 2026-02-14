// wizard/editors.js -- Property editors, classification, defaults, presets

import { state } from './state.js';
import { camelToKebab, getTodayString, showToast } from './utils.js';
import { logError } from '../../src/core/error-logger.js';

// --- Classify property as primary or secondary ---

var PRIMARY_KEYS = [
  'variant', 'type', 'size', 'label', 'title', 'heading', 'text', 'content',
  'src', 'href', 'url', 'name', 'message', 'description', 'icon', 'status',
  'color', 'theme', 'mode', 'level', 'severity'
];

export function classifyProp(propName, propDef) {
  if (propDef.enum) return 'primary';
  var lower = propName.toLowerCase();
  for (var i = 0; i < PRIMARY_KEYS.length; i++) {
    if (lower === PRIMARY_KEYS[i] || lower.includes(PRIMARY_KEYS[i])) return 'primary';
  }
  return 'secondary';
}

// --- Properties panel header ---

export function updatePropsHeader() {
  var el = document.getElementById('propsHeader');
  if (!el) return;
  if (!state.currentSchema) {
    el.innerHTML = '<p class="props-header-empty">Select a component above</p>';
    return;
  }
  var propCount = Object.keys(state.currentSchema.properties || {}).length;
  // Get the schema name (use 'name' field or derive from tag)
  var schemaName = state.currentSchema.name || state.currentSchema.tag.replace('wb-', '');
  // Construct path to markdown documentation file
  var docPath = 'http://localhost:3000/docs/components/cards/' + schemaName + '.md';
  el.innerHTML =
    '<a class="props-header-title" href="' + docPath + '" target="_blank" title="Open documentation">' + state.currentSchema.title + '</a>'
    + '<div class="props-header-tag">&lt;' + state.currentSchema.tag + '&gt;'
    + '<span class="props-header-count">'
    + propCount + ' properties</span></div>';
}

// --- Smart defaults ---

export function getSmartDefault(propName, propDef) {
  if (propDef.default != null && propDef.default !== '') return propDef.default;
  var lower = propName.toLowerCase();
  if (lower.includes('date') || lower.includes('time') || lower.includes('timestamp')) return getTodayString();
  if (propDef.enum && propDef.enum.length > 0) return '';
  if (propDef.type === 'boolean') return false;
  if (propDef.type === 'number' || propDef.type === 'integer') return propDef.minimum || 0;
  if (lower.includes('title') || lower.includes('heading')) return 'Sample Title';
  if (lower.includes('name')) return 'Sample Name';
  if (lower.includes('description') || lower.includes('desc')) return 'Sample description text';
  if (lower.includes('label')) return 'Label';
  if (lower.includes('text') || lower.includes('content') || lower.includes('message')) return 'Sample text content';
  if (lower.includes('url') || lower.includes('href') || lower.includes('link')) return 'https://example.com';
  if (lower.includes('src') || lower.includes('image') || lower.includes('img')) return 'https://picsum.photos/300/200';

  if (lower.includes('email')) return 'user@example.com';
  if (lower.includes('color')) return '#6366f1';
  return '';
}

export function fillAllDefaults() {
  if (!state.currentSchema) return;
  var props = state.currentSchema.properties || {};
  Object.entries(props).forEach(function(entry) {
    var propName = entry[0], propDef = entry[1];
    var attrName = camelToKebab(propName);
    var val = getSmartDefault(propName, propDef);
    if (val === '' || val === false) return;
    state.currentAttrs[attrName] = val;
    var el = document.getElementById('prop-' + attrName);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!val; else el.value = val;
  });
  if (state.onRefresh) state.onRefresh();
  showToast('All fields filled');
}

// --- Build a single editor element ---

function buildEditorElement(propName, propDef, attrName) {
  var frag = document.createDocumentFragment();
  var refresh = function() { if (state.onPropertyChange) state.onPropertyChange(); else if (state.onRefresh) state.onRefresh(); };

  if (propDef.type === 'boolean') {
    var wrap = document.createElement('div'); wrap.className = 'prop-bool';
    var cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = 'prop-' + attrName;
    cb.checked = propDef.default === true;
    if (propDef.default === true) state.currentAttrs[attrName] = true;
    cb.addEventListener('change', function() { state.currentAttrs[attrName] = cb.checked; refresh(); });
    var lbl = document.createElement('label');
    lbl.htmlFor = cb.id; lbl.textContent = propName;
    wrap.appendChild(cb); wrap.appendChild(lbl); frag.appendChild(wrap);
    if (propDef.description) {
      var h = document.createElement('div'); h.className = 'prop-hint'; h.textContent = propDef.description; frag.appendChild(h);
    }
  } else if (propDef.enum) {
    var row = document.createElement('div'); row.className = 'prop-row';
    var lbl2 = document.createElement('label'); lbl2.htmlFor = 'prop-' + attrName; lbl2.textContent = propName; row.appendChild(lbl2);
    var sel = document.createElement('select'); sel.id = 'prop-' + attrName;
    var empty = document.createElement('option'); empty.value = ''; empty.textContent = '-- ' + propName + ' --'; sel.appendChild(empty);
    propDef.enum.forEach(function(val) {
      var opt = document.createElement('option'); opt.value = val; opt.textContent = val;
      if (val === propDef.default) opt.selected = true;
      sel.appendChild(opt);
    });
    if (propDef.default) state.currentAttrs[attrName] = propDef.default;
    sel.addEventListener('change', function() {
      if (sel.value) state.currentAttrs[attrName] = sel.value; else delete state.currentAttrs[attrName];
      refresh();
    });
    row.appendChild(sel); frag.appendChild(row);
    if (propDef.description) {
      var h2 = document.createElement('div'); h2.className = 'prop-hint'; h2.textContent = propDef.description; frag.appendChild(h2);
    }
  } else if (propDef.type === 'number' || propDef.type === 'integer') {
    var row2 = document.createElement('div'); row2.className = 'prop-row';
    var lbl3 = document.createElement('label'); lbl3.htmlFor = 'prop-' + attrName; lbl3.textContent = propName; row2.appendChild(lbl3);
    var inp = document.createElement('input'); inp.type = 'number'; inp.id = 'prop-' + attrName;
    if (propDef.default != null) { inp.value = propDef.default; state.currentAttrs[attrName] = propDef.default; }
    if (propDef.minimum != null) inp.min = propDef.minimum;
    if (propDef.maximum != null) inp.max = propDef.maximum;
    inp.addEventListener('input', function() {
      if (inp.value !== '') state.currentAttrs[attrName] = Number(inp.value); else delete state.currentAttrs[attrName];
      refresh();
    });
    row2.appendChild(inp); frag.appendChild(row2);
  } else {
    var row3 = document.createElement('div'); row3.className = 'prop-row';
    var lbl4 = document.createElement('label'); lbl4.htmlFor = 'prop-' + attrName; lbl4.textContent = propName; row3.appendChild(lbl4);
    if (attrName === 'src') {
      var inp2 = document.createElement('input'); inp2.type = 'text'; inp2.id = 'prop-' + attrName;
      inp2.placeholder = 'Browse docs';
      inp2.readOnly = true;
      inp2.style.cursor = 'pointer';
      inp2.addEventListener('click', function(e) {
        e.preventDefault();
        openMarkdownFileBrowser(inp2, refresh);
      });
      inp2.addEventListener('input', function() {
        if (inp2.value) state.currentAttrs[attrName] = inp2.value; else delete state.currentAttrs[attrName];
        refresh();
      });
      row3.appendChild(inp2);
    } else {
      var inp2 = document.createElement('input'); inp2.type = 'text'; inp2.id = 'prop-' + attrName;
      var txtDefault = propDef.default || '';
      var lower2 = propName.toLowerCase();
      if (!txtDefault && (lower2.includes('date') || lower2.includes('time') || lower2.includes('timestamp'))) txtDefault = getTodayString();
      inp2.placeholder = txtDefault || 'Enter ' + propName + '...';
      if (txtDefault) { inp2.value = txtDefault; state.currentAttrs[attrName] = txtDefault; }
      inp2.addEventListener('input', function() {
        if (inp2.value) state.currentAttrs[attrName] = inp2.value; else delete state.currentAttrs[attrName];
        refresh();
      });
      row3.appendChild(inp2);
    }
    frag.appendChild(row3);
    if (propDef.description) {
      var h3 = document.createElement('div'); h3.className = 'prop-hint'; h3.textContent = propDef.description; frag.appendChild(h3);
    }
  }
  return frag;
}

// --- Build all editors (primary/secondary split) ---

export function buildEditors(schema) {
  var primaryEl = document.getElementById('primaryEditors');
  var secondaryEl = document.getElementById('secondaryEditors');
  var toggleBtn = document.getElementById('toggleMoreProps');
  if (!primaryEl || !secondaryEl || !toggleBtn) return;

  primaryEl.innerHTML = '';
  secondaryEl.innerHTML = '';
  state.currentAttrs = {};

  var props = schema.properties || {};
  var sorted = Object.entries(props).sort(function(a, b) {
    function order(p) { if (p.enum) return 0; if (p.type === 'string') return 1; if (p.type === 'boolean') return 2; return 3; }
    return order(a[1]) - order(b[1]);
  });

  var hasPrimary = false, hasSecondary = false;
  sorted.forEach(function(entry) {
    var propName = entry[0], propDef = entry[1];
    var attrName = camelToKebab(propName);
    var cls = classifyProp(propName, propDef);
    var el = buildEditorElement(propName, propDef, attrName);
    if (cls === 'primary') { primaryEl.appendChild(el); hasPrimary = true; }
    else { secondaryEl.appendChild(el); hasSecondary = true; }
  });

  if (hasSecondary) {
    toggleBtn.style.display = 'flex';
    var secCount = sorted.filter(function(e) { return classifyProp(e[0], e[1]) === 'secondary'; }).length;
    toggleBtn.innerHTML = '<span class="arrow">&#9654;</span> More Properties (' + secCount + ')';
    secondaryEl.classList.remove('visible');
    toggleBtn.classList.remove('expanded');
  } else {
    toggleBtn.style.display = 'none';
  }

  if (!hasPrimary && !hasSecondary) {
    primaryEl.innerHTML = '<p class="preview-empty">No configurable properties</p>';
  }

  updatePropsHeader();
}

// --- Presets ---

export function buildPresets(schema) {
  var presetsCard = document.getElementById('presetsCard');
  var presetPills = document.getElementById('presetPills');
  if (!presetsCard || !presetPills) return;

  presetPills.innerHTML = '';
  presetsCard.style.display = 'block';  // runtime toggle

  var fillBtn = document.createElement('button');
  fillBtn.className = 'preset-pill preset-pill--fill';
  fillBtn.textContent = 'Fill All Defaults';
  fillBtn.addEventListener('click', fillAllDefaults);
  presetPills.appendChild(fillBtn);

  if (schema.matrix && schema.matrix.length > 0) {
    schema.matrix.forEach(function(combo) {
      var btn = document.createElement('button');
      btn.className = 'preset-pill';
      btn.textContent = Object.values(combo).join(', ');
      btn.title = JSON.stringify(combo);
      btn.addEventListener('click', function() { applyPreset(combo); });
      presetPills.appendChild(btn);
    });
  }
}

export function applyPreset(combo) {
  state.currentAttrs = {};
  var props = state.currentSchema ? (state.currentSchema.properties || {}) : {};

  Object.entries(props).forEach(function(entry) {
    var propName = entry[0], propDef = entry[1];
    var attrName = camelToKebab(propName);
    var val = getSmartDefault(propName, propDef);
    if (val !== '' && val !== false) {
      state.currentAttrs[attrName] = val;
      var el = document.getElementById('prop-' + attrName);
      if (el) { if (el.type === 'checkbox') el.checked = !!val; else el.value = val; }
    }
  });

  Object.entries(combo).forEach(function(entry) {
    var attrName = camelToKebab(entry[0]);
    state.currentAttrs[attrName] = entry[1];
    var el = document.getElementById('prop-' + attrName);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!entry[1]; else el.value = entry[1];
  });

  if (state.onRefresh) state.onRefresh();
}

// --- Restore attrs into editor DOM ---

export function restoreEditorValues(attrs) {
  Object.entries(attrs).forEach(function(entry) {
    var el = document.getElementById('prop-' + entry[0]);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!entry[1]; else el.value = entry[1];
  });
}

// --- Markdown File Browser ---

async function checkServerHealth() {
  try {
    var response = await fetch('http://localhost:3000/health', { method: 'GET' });
    if (response.ok) return { ok: true };
    return { ok: false, response: response.status + ' ' + response.statusText };
  } catch (err) {
    return { ok: false, response: err.message };
  }
}

function openMarkdownFileBrowser(inputElement, refresh) {
  var callerStack = new Error('MarkdownFileBrowser opened').stack;
  var modal = document.createElement('div');
  modal.className = 'md-file-browser-modal';
  modal.innerHTML = '<div class="md-browser-backdrop"></div><div class="md-browser-dialog" id="mdBrowserDialog"><div class="md-browser-header"><h3>Select Markdown File</h3><button class="md-browser-close" title="Close">&times;</button></div><div class="md-browser-path" id="mdPath">📁 docs/</div><div class="md-browser-list" id="mdList"><p style="color:var(--text-secondary);padding:1rem;text-align:center;">Loading...</p></div><div class="md-browser-footer"><button class="md-browser-cancel">Cancel</button></div></div>';
  document.body.appendChild(modal);
  var listEl = modal.querySelector('#mdList');
  var pathEl = modal.querySelector('#mdPath');
  var currentPath = 'docs';
  var fileStructure = {
    'docs': { folders: ['components', 'architecture', 'guides', '_today', 'standards'], files: ['index.md', 'wizard.md', 'schema.md', 'builder.md'] },
    'docs/components': { folders: ['cards', 'semantic', 'feedback', 'forms', 'layout', 'effects', 'navigation'], files: ['README.md', 'components.md'] },
    'docs/components/cards': { folders: [], files: ['cardhero.md', 'card.md', 'cardprofile.md', 'cardimage.md', 'cardoverlay.md', 'cardlink.md'] },
    'docs/components/semantic': { folders: [], files: ['article.md', 'figure.md', 'details.md'] },
    'docs/components/feedback': { folders: [], files: ['alert.md', 'badge.md', 'progress.md', 'toast.md'] },
    'docs/components/forms': { folders: [], files: ['input.md', 'button.md', 'checkbox.md', 'select.md'] },
    'docs/components/layout': { folders: [], files: ['grid.md', 'flex.md', 'container.md'] },
    'docs/architecture': { folders: [], files: ['schema-first-architecture.md', 'SCHEMA-SPECIFICATION.md'] }
  };
  
  // Check server health first
  checkServerHealth().then(function(result) {
    console.log('[wizard] Health check result:', JSON.stringify(result));
    if (!result.ok) {
      console.warn('[wizard] Server not responding on /health endpoint');
      var errorDetails = {
        file: 'demos/wizard/editors.js',
        to: 'MarkdownFileBrowser',
        reason: 'The development server is not responding. Ensure npm start is running on port 3000.',
        response: result.response,
        src: inputElement.value || currentPath + '/',
        stack: callerStack
      };
      logError('Server Not Running', errorDetails);
      listEl.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;text-align:center;">Server not available. See error log below for details.</p>';
      return;
    }
    loadFiles(currentPath);
  });
  
  function loadFiles(path) {
    var fileList = fileStructure[path] || { folders: [], files: [] };
    listEl.innerHTML = '';
    if (path !== 'docs') {
      var parentBtn = document.createElement('button');
      parentBtn.className = 'md-browser-item md-browser-parent';
      parentBtn.textContent = '📂 ..';
      parentBtn.addEventListener('click', function() {
        currentPath = path.substring(0, path.lastIndexOf('/'));
        pathEl.textContent = '📁 ' + currentPath + '/';
        loadFiles(currentPath);
      });
      listEl.appendChild(parentBtn);
    }
    if (fileList.folders && fileList.folders.length > 0) {
      fileList.folders.forEach(function(folder) {
        var btn = document.createElement('button');
        btn.className = 'md-browser-item md-browser-folder';
        btn.textContent = '📂 ' + folder;
        btn.addEventListener('click', function() {
          currentPath = path + '/' + folder;
          pathEl.textContent = '📁 ' + currentPath + '/';
          loadFiles(currentPath);
        });
        listEl.appendChild(btn);
      });
    }
    if (fileList.files && fileList.files.length > 0) {
      fileList.files.forEach(function(file) {
        var btn = document.createElement('button');
        btn.className = 'md-browser-item md-browser-file';
        btn.textContent = '📄 ' + file;
        btn.addEventListener('click', function() {
          var filePath = '/' + path + '/' + file;
          inputElement.value = filePath;
          inputElement.dispatchEvent(new Event('input'));
          modal.remove();
          refresh();
        });
        listEl.appendChild(btn);
      });
    }
  }
  
  modal.querySelector('.md-browser-close').addEventListener('click', function() { modal.remove(); });
  modal.querySelector('.md-browser-cancel').addEventListener('click', function() { modal.remove(); });
  modal.querySelector('.md-browser-backdrop').addEventListener('click', function() { modal.remove(); });
}
