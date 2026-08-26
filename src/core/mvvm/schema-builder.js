/**
 * WB Schema Builder - MVVM Core
 * =============================
 * Builds DOM structure from JSON Schema definitions.
 * NO innerHTML in component classes. Schema IS the template.
 * 
 * @version 3.0.0 - $view format with $methods support
 * 
 * MVVM Structure:
 *   - Model:     properties (data inputs)
 *   - View:      $view (DOM structure)
 *   - ViewModel: $methods (callable functions)
 * 
 * v3.0 Syntax Strategy:
 * =====================
 * PRIMARY (use in new code):
 *   1. x-card title="Hello"> - Web component tags for components
 *   2. <button x-ripple> - x- prefix for adding behaviors
 * 
 * DEPRECATED (legacy fallback):
 *   3. x-card > - Still works but avoid in new code
 * 
 * Schema Format:
 *   {
 *     "behavior": "card",
 *     "baseClass": "x-card",
 *     "properties": {
 *       "title": { "type": "string" },
 *       "elevated": { "type": "boolean" }
 *     },
 *     "$view": [
 *       { "name": "header", "tag": "header", "createdWhen": "title OR subtitle" },
 *       { "name": "main",   "tag": "main",   "required": true }
 *     ],
 *     "$methods": {
 *       "show": { "description": "Shows the card" },
 *       "hide": { "description": "Hides the card" }
 *     }
 *   }
 * 
 * Classes are AUTO-GENERATED: baseClass + "__" + name → "x-card__header"
 * Tags are lowercase per HTML5: "header", "main", "footer"
 */

// The alias registry is ONE module by design (#879). Aliases used to be
// declared inline across nine separate schemas, which made "these two
// spellings mean the same option" a promise repeated nine times.
import { aliasesFor } from '../attribute-aliases.js';

// =============================================================================
// SCHEMA REGISTRY
// =============================================================================

// Debug logging — silent unless localStorage['x-debug'] === '1'.
const WB_DEBUG = (() => { try { return localStorage.getItem('x-debug') === '1'; } catch (e) { return false; } })();
const _wbClog = console.log.bind(console);
const dlog = (...args) => { if (WB_DEBUG) _wbClog(...args); };

/** @type {Map<string, Object>} Schema name → parsed schema */
const schemaRegistry = new Map();

/** @type {Map<string, string>} Tag name → schema name (x-card-profile → cardprofile) */
const tagToSchema = new Map();

/** @type {WeakSet<HTMLElement>} Track processed elements */
const processedElements = new WeakSet();

// =============================================================================
// SCHEMA LOADING
// =============================================================================

// Resolve the wb-models directory relative to THIS module's URL, so schema fetches
// work under any base path — domain root in local dev, or a project sub-path like
// /wb-starter/ on GitHub Pages. An absolute '/src/wb-models' 404s on sub-path hosts. (#225)
const DEFAULT_SCHEMA_BASE = new URL('../../wb-models', import.meta.url).href;

/**
 * Load all schemas from wb-models directory
 * @param {string} basePath - Path to wb-models folder
 */
export async function loadSchemas(basePath = DEFAULT_SCHEMA_BASE) {
  try {
    const indexResponse = await fetch(`${basePath}/index.json`);
    
    if (!indexResponse.ok) {
      console.warn('[Schema Builder] No index.json found, using fallback');
      return;
    }
    
    const index = await indexResponse.json();
    const schemaFiles = index.schemas || [];
    
    dlog(`[Schema Builder] Loading ${schemaFiles.length} schemas...`);
    
    // Load schemas in parallel for speed
    const loadPromises = schemaFiles.map(async (file) => {
      try {
        const response = await fetch(`${basePath}/${file}`);
        if (response.ok) {
          const schema = await response.json();
          registerSchema(schema, file);
          return true;
        }
      } catch (e) {
        console.warn(`[Schema Builder] Failed to load ${file}:`, e.message);
      }
      return false;
    });
    
    const results = await Promise.all(loadPromises);
    const loaded = results.filter(Boolean).length;
    
    dlog(`[Schema Builder] ✅ Loaded ${loaded}/${schemaFiles.length} schemas`);
    
  } catch (error) {
    console.error('[Schema Builder] Failed to load schemas:', error);
  }
}

/**
 * Register a single schema
 */
export function registerSchema(schema, filename) {
  // backwards-compat: accept new `schemaFor` while preserving `behavior` for existing code
  if (schema && !schema.behavior && schema.schemaFor) schema.behavior = schema.schemaFor;
  const name = schema.behavior || filename.replace('.schema.json', '');
  
  schemaRegistry.set(name, schema);
  
  // Map tag name: x-card-profile → cardprofile
  const tagName = `wb-${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  tagToSchema.set(tagName, name);
  
  dlog(`[Schema Builder] Registered: ${name} → <${tagName}>`);
}

/**
 * Load a single schema file and register it (fallback for runtime/hydration races)
 * Returns true if the schema was fetched & registered, false otherwise.
 */
// A page with several instances of the same component (e.g. multiple
// <article>-family tags on one page) each independently discover, on scan,
// that the shared schema isn't registered yet and race to fetch it — none
// of them see it as registered until their own fetch resolves. Observed
// live: card.schema.json fetched 6x, cardstats.schema.json 4x, on a single
// home-page load. Memoizing the in-flight promise per filename means every
// concurrent caller awaits the SAME fetch instead of starting their own.
const inFlightSchemaFetches = new Map();

export async function loadSchemaFile(filePath, basePath = DEFAULT_SCHEMA_BASE) {
  // Accept both bare filenames (cardhero.schema.json) and schema names (cardhero)
  const filename = filePath.endsWith('.schema.json') ? filePath : `${filePath}.schema.json`;

  const existing = inFlightSchemaFetches.get(filename);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const resp = await fetch(`${basePath}/${filename}`);
      if (!resp.ok) {
        console.warn(`[Schema Builder] loadSchemaFile: ${filename} not found (status ${resp.status})`);
        return false;
      }
      const schema = await resp.json();
      registerSchema(schema, filename);
      return true;
    } catch (err) {
      console.warn('[Schema Builder] loadSchemaFile failed:', err && err.message);
      return false;
    } finally {
      inFlightSchemaFetches.delete(filename);
    }
  })();

  inFlightSchemaFetches.set(filename, promise);
  return promise;
}

/**
 * Get schema by name or tag
 */
export function getSchema(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  
  if (schemaRegistry.has(identifier)) {
    return schemaRegistry.get(identifier);
  }
  
  const byTag = tagToSchema.get(identifier.toLowerCase());
  if (byTag) {
    return schemaRegistry.get(byTag);
  }
  
  return null;
}

// =============================================================================
// CLASS GENERATION
// =============================================================================

/**
 * Get base class from schema
 */
function getBaseClass(schema) {
  // See wb.js's `base` -- same computed-prefix trap.
  return schema.baseClass || schema.compliance?.baseClass || `x-${schema.behavior}`;
}

/**
 * Auto-generate BEM class: baseClass__partName
 */
function getPartClass(schema, partName) {
  return `${getBaseClass(schema)}__${partName}`;
}

/**
 * Auto-generate modifier class: baseClass--modifier
 */
function getModifierClass(schema, modifier) {
  return `${getBaseClass(schema)}--${modifier}`;
}

// =============================================================================
// DATA EXTRACTION
// =============================================================================

/**
 * Extract data from element attributes
 */
function extractData(element, schema) {
  const data = {};
  
  // Get all data-* attributes AND direct attributes
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-') && attr.name !== 'x-behavior') {
      const key = attr.name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      data[key] = parseValue(attr.value);
    } else if (!['class', 'style', 'id', 'x-behavior'].includes(attr.name)) {
      // Direct attributes (for web component style)
      const key = attr.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      data[key] = parseValue(attr.value);
    }
  }
  
  // Honor property aliases BEFORE defaults are applied, so an alias attribute
  // beats the default: <div x-alert type="success"> sets variant (#176).
  //
  // The list comes from src/core/attribute-aliases.js, never from the schema.
  // Only genuine SYNONYMS live there -- `data-` prefixes and camel/kebab pairs
  // are already resolved above by extractData(), so registering those would
  // document a duplicate instead of removing one.
  if (schema.properties) {
    const behavior = schema.schemaFor || schema.$id?.replace('.schema.json', '') || '';
    for (const propName of Object.keys(schema.properties)) {
      if (data[propName] !== undefined) continue;
      for (const alias of aliasesFor(behavior, propName)) {
        const aliasKey = alias.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        if (data[aliasKey] !== undefined) { data[propName] = data[aliasKey]; break; }
      }
    }
  }

  // Apply defaults from schema
  if (schema.properties) {
    applyDefaults(data, schema.properties);
  }
  
  // Store original content as 'slot'
  data.slot = element.innerHTML.trim();

  // Extract named slots from children (v3.0 feature)
  element.querySelectorAll('[slot]').forEach(child => {
    const slotName = child.getAttribute('slot');
    if (slotName) {
      data[slotName] = child.innerHTML.trim();
    }
  });

  // Alias slot to body if not defined (common in v3 schemas)
  if (data.body === undefined && data.slot) {
    data.body = data.slot;
  }
  
  return data;
}

/**
 * Parse attribute value to appropriate type
 */
function parseValue(value) {
  if (value === '' || value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  if (value.startsWith('{') || value.startsWith('[')) {
    try { return JSON.parse(value); } catch (e) { /* keep as string */ }
  }
  return value;
}

/**
 * Apply default values from schema properties
 */
function applyDefaults(data, properties) {
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === 'object' && prop.properties) {
      applyDefaults(data, prop.properties);
    } else if (prop.default !== undefined && data[key] === undefined) {
      data[key] = prop.default;
    }
  }
}

// =============================================================================
// DOM BUILDING - $view FORMAT (MVVM View Layer)
// =============================================================================

/**
 * Build DOM structure from schema
 */
function buildStructure(element, schema, data) {
  const baseClass = getBaseClass(schema);

  // Apply base class -- skip when the host tag already IS baseClass (e.g.
  // <div x-mdhtml> getting classList.add('x-mdhtml')); redundant, and flagged
  // by tests/compliance/no-redundant-tag-name-class.spec.ts (#478). Every
  // per-component behavior fn's OWN identical guard (card.js, checkbox.js,
  // mdhtml.js, ...) only covers ITS OWN classList.add call -- this generic
  // schema-driven path adds the same class independently and needs the same
  // guard, or a component's own correct guard gets silently bypassed here.
  if (element.tagName.toLowerCase() !== baseClass) element.classList.add(baseClass);
  
  // Apply additional classes (for variants like x-card--profile)
  if (schema.compliance?.additionalClasses) {
    element.classList.add(...schema.compliance.additionalClasses);
  }
  
  // Apply variant/modifier classes from data
  applyVariantClasses(element, schema, data);

  // Empty $view means the component's BEHAVIOR owns all DOM content, not
  // the schema (card #202, demo, alert, button). NEVER touch innerHTML in
  // that case. This used to always wipe element.innerHTML then restore it
  // from data.slot (element.innerHTML captured as a string BEFORE the
  // wipe) — a serialize/clear/reparse round-trip that silently destroys
  // any live state the behavior already attached (event listeners, etc.)
  // whenever this runs AFTER the behavior has built its real DOM. That
  // race is real: WB.observe()'s MutationObserver independently calls
  // processSchema() on reparented elements (e.g. demo.js moving existing
  // children into its grid), and when the schema isn't cached yet its
  // on-demand fetch can resolve well after the behavior already ran —
  // confirmed live as feedback.js's alert() dismiss button silently
  // losing its click listener (~90% of loads).
  if (schema.$view && schema.$view.length === 0) {
    return;
  }

  // Stash the pre-wipe original content as a plain JS property (not an
  // attribute -- Law 11) before clearing it below. A schema-built element
  // that's ALSO used as a self-triggering control (e.g. <div x-drawer
  // title="…">Left Drawer</div> in overlay.js's drawer()) needs its
  // own original label back after its behavior relocates the schema-built
  // structure elsewhere (document.body) -- without this, that text is gone
  // for good the moment $view replaces it, and the trigger renders empty
  // (#drawer root cause). Purely additive: nothing reads this unless a
  // behavior explicitly opts in.
  element._wbOriginalSlot = data.slot || '';
  // data.slot is TEXT only (extractData reads it for {{slot}} string
  // interpolation) -- it can't round-trip real markup like a <thead>/
  // <tbody> pair of table rows. table.js needs the actual pre-wipe HTML
  // to restore <table>'s original rows after $view rebuilds an empty
  // thead/tbody shell (table.schema.json has no row-building logic of its
  // own). Confirmed live: every <table> authored with real <thead>/
  // <tbody> markup rendered a genuinely empty table, 0 <tr> elements,
  // because nothing could get the real rows back after this wipe.
  element._wbOriginalHTML = element.innerHTML;

  // Clear existing content (we saved it as slot)
  element.innerHTML = '';

  // Build from $view (MVVM format)
  if (schema.$view) {
    buildFromView(element, schema, data);
    return;
  }
  
  // Fallback: $containment (legacy v2 format)
  if (schema.$containment) {
    buildFromView(element, { ...schema, $view: schema.$containment }, data);
    return;
  }
  
  // Fallback: compliance format (legacy v1)
  if (schema.compliance?.requiredChildren || schema.compliance?.optionalChildren) {
    buildFromComplianceFormat(element, schema, data);
    return;
  }
  
  // Fallback: just restore slot content
  if (data.slot) {
    element.innerHTML = data.slot;
  }
}

/**
 * Build DOM from $view format (MVVM View Layer)
 * 
 * Schema format:
 *   "$view": [
 *     { "name": "header", "tag": "header", "createdWhen": "title OR subtitle" },
 *     { "name": "title", "tag": "h3", "parent": "header", "content": "{{title}}" },
 *     { "name": "main", "tag": "main", "required": true, "content": "{{slot}}" }
 *   ]
 * 
 * Tags are lowercase per HTML5 standards.
 */
function buildFromView(element, schema, data) {
  const parts = schema.$view || [];
  const baseClass = getBaseClass(schema);
  
  // Map to track created elements by name
  const createdElements = new Map();
  createdElements.set('root', element);
  
  // Sort parts: root-level first, then nested (by parent depth)
  const sortedParts = [...parts].sort((a, b) => {
    const aDepth = a.parent ? 1 : 0;
    const bDepth = b.parent ? 1 : 0;
    return aDepth - bDepth;
  });
  
  // Further sort root-level by semantic order
  const semanticOrder = { nav: 0, header: 1, main: 2, aside: 3, footer: 4 };
  sortedParts.sort((a, b) => {
    if (a.parent || b.parent) return 0; // Don't re-sort nested
    const aOrder = semanticOrder[a.tag?.toLowerCase()] ?? 2;
    const bOrder = semanticOrder[b.tag?.toLowerCase()] ?? 2;
    return aOrder - bOrder;
  });
  
  // Build each part
  for (const part of sortedParts) {
    // Check createdWhen condition
    if (part.createdWhen && !evaluateCondition(part.createdWhen, data)) {
      continue;
    }
    
    // Check required - skip if required but no condition and no data
    if (!part.required && !part.createdWhen && part.content) {
      const dataKey = part.content.match(/\{\{(\w+)\}\}/)?.[1];
      if (dataKey && !data[dataKey]) continue;
    }
    
    // Create element - tag is lowercase per HTML5
    const tag = part.tag || 'div';
    const el = document.createElement(tag.toLowerCase());
    
    // Auto-generate class: baseClass__name
    el.className = getPartClass(schema, part.name);
    
    // Add any explicit classes
    if (part.class) {
      el.classList.add(...part.class.split(' '));
    }
    
    // Handle content
    if (part.content) {
      const content = interpolate(part.content, data);
      // Use innerHTML if it's the slot OR looks like HTML
      if (part.content === '{{slot}}' || /<[a-z][\s\S]*>/i.test(content)) {
        el.innerHTML = content;
      } else if (content) {
        el.textContent = content; // strict text for everything else
      }
    }
    
    // Handle attributes
    if (part.attributes) {
      for (const [attr, value] of Object.entries(part.attributes)) {
        el.setAttribute(attr, interpolate(String(value), data));
      }
    }
    
    // Handle special img src
    if (tag.toLowerCase() === 'img' && part.src) {
      el.src = interpolate(part.src, data);
      el.alt = part.alt ? interpolate(part.alt, data) : '';
    }
    
    // Find parent and append
    const parentName = part.parent || 'root';
    const parent = createdElements.get(parentName);
    
    if (parent) {
      parent.appendChild(el);
      createdElements.set(part.name, el);
    } else {
      console.warn(`[Schema Builder] Parent "${parentName}" not found for "${part.name}"`);
    }
  }
}

/**
 * Build from legacy compliance format (for backwards compatibility)
 */
function buildFromComplianceFormat(element, schema, data) {
  const required = schema.compliance?.requiredChildren || {};
  const optional = schema.compliance?.optionalChildren || {};
  
  const elements = [];
  
  // Build optional children
  for (const [selector, def] of Object.entries(optional)) {
    if (def.createdWhen) {
      const condition = def.createdWhen.replace('data-', '').replace(' is set', '');
      if (!evaluateCondition(condition, data)) continue;
    }
    const el = createFromComplianceDef(selector, def, data, schema);
    if (el) elements.push({ order: getSemanticOrder(selector), el });
  }
  
  // Build required children
  for (const [selector, def] of Object.entries(required)) {
    const el = createFromComplianceDef(selector, def, data, schema);
    if (el) elements.push({ order: getSemanticOrder(selector), el });
  }
  
  // Sort and append
  elements.sort((a, b) => a.order - b.order);
  for (const { el } of elements) {
    element.appendChild(el);
  }
  
  // Add slot to main
  const main = element.querySelector('main, [class*="__main"]');
  if (main && data.slot) {
    main.innerHTML = data.slot;
  }
}

/**
 * Create element from compliance definition
 */
function createFromComplianceDef(selector, def, data, schema) {
  const parts = selector.split('.');
  const tagName = def.tagName || parts[0] || 'div';
  const el = document.createElement(tagName);
  
  // Use class from selector or auto-generate
  if (parts.length > 1) {
    el.className = parts.slice(1).join(' ');
  }
  
  // Handle content
  if (def.content) {
    const content = interpolate(def.content, data);
    if (def.content === '{{slot}}') {
      el.innerHTML = content;
    } else if (content) {
      el.textContent = content;
    }
  }
  
  // Build children
  if (def.children) {
    for (const [childSel, childDef] of Object.entries(def.children)) {
      if (childDef.createdWhen) {
        const condition = childDef.createdWhen.replace('data-', '').replace(' is set', '');
        if (!evaluateCondition(condition, data)) continue;
      }
      const childEl = createFromComplianceDef(childSel, childDef, data, schema);
      if (childEl) el.appendChild(childEl);
    }
  }
  
  return el;
}

/**
 * Get semantic order for sorting
 */
function getSemanticOrder(selector) {
  const tag = selector.split('.')[0].toLowerCase();
  const orders = { nav: 0, header: 1, main: 2, aside: 3, footer: 4 };
  return orders[tag] ?? 2;
}

/**
 * Apply variant/modifier classes
 */
function applyVariantClasses(element, schema, data) {
  const props = schema.properties || {};
  const baseClass = getBaseClass(schema);
  
  for (const [key, prop] of Object.entries(props)) {
    const value = data[key];
    if (value === undefined || value === null || value === '') continue;
    
    // appliesClass: "x-card--elevated"
    if (prop.appliesClass && value === true) {
      element.classList.add(prop.appliesClass);
    }
    
    // appliesAttribute: "title"
    if (prop.appliesAttribute) {
      element.setAttribute(prop.appliesAttribute, value);
    }
    
    // Enum variants: variant="glass" → x-card--glass
    // Some enum-typed properties (e.g. button's `icon`) list known presets
    // for tooling/autocomplete but also accept arbitrary free text (emoji,
    // custom names) per their own schema description -- generating a class
    // from THAT would produce garbage like "x-button--💾" for an
    // emoji icon. Only emit the modifier class when the value is itself a
    // valid CSS identifier segment; free-text values that fall outside the
    // enum's known set are content, not a variant, and get no class.
    if (prop.enum && typeof value === 'string' && value !== 'default' && /^[a-zA-Z0-9_-]+$/.test(value)) {
      element.classList.add(`${baseClass}--${value}`);
    }
  }
}

/**
 * Evaluate condition: "title", "title OR subtitle", "title AND subtitle"
 */
function evaluateCondition(condition, data) {
  if (condition.includes(' OR ')) {
    return condition.split(' OR ').some(part => evaluateCondition(part.trim(), data));
  }
  if (condition.includes(' AND ')) {
    return condition.split(' AND ').every(part => evaluateCondition(part.trim(), data));
  }
  if (condition.startsWith('NOT ')) {
    return !evaluateCondition(condition.substring(4).trim(), data);
  }
  const value = data[condition];
  return value !== undefined && value !== null && value !== '' && value !== false;
}

/**
 * Interpolate {{placeholders}}
 */
function interpolate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined && value !== null ? value : '';
  });
}

// =============================================================================
// $methods BINDING (MVVM ViewModel Layer)
// =============================================================================

/**
 * Bind $methods from schema to element
 * @param {HTMLElement} element - Target element
 * @param {Object} schema - Component schema
 * @param {Object} viewModel - ViewModel instance with method implementations
 */
export function bindMethods(element, schema, viewModel) {
  const methods = schema.$methods || {};
  
  for (const [name, config] of Object.entries(methods)) {
    if (typeof viewModel[name] === 'function') {
      // Bind method to element so users can call element.show(), element.hide(), etc.
      element[name] = viewModel[name].bind(viewModel);
    } else {
      console.warn(`[Schema Builder] Method "${name}" defined in schema but not implemented in viewModel`);
    }
  }
}

/**
 * Get method definitions from schema
 * @param {string} schemaName - Name of schema
 * @returns {Object} Method definitions
 */
export function getMethods(schemaName) {
  const schema = getSchema(schemaName);
  return schema?.$methods || {};
}

// =============================================================================
// ELEMENT PROCESSING
// =============================================================================

/**
 * Process a single element through schema builder
 * 1. Builds DOM structure from $view
 * 2. Binds $methods to element
 * 3. Triggers behavior injection if WB is available
 * 
 * @param {HTMLElement} element - Element to process
 * @param {string} schemaName - Schema name (optional, auto-detected)
 * @returns {Object} Processing result with schema and data
 */
export function processElement(element, schemaName = null) {
  // Explicit opt-out, checked once here (the single entry point every
  // caller funnels through -- scan(), the MutationObserver, and wb.js's own
  // processSchema() all end up here, some passing an explicit schemaName
  // that bypasses detectSchema()). Mirrors wb.js's native-tag autoInject
  // skip (`x-ignore`, wb.js:204) -- previously never wired into this file
  // at all, so <article x-ignore> was fully built and injected despite the
  // attribute (found auditing #521). One opt-out covers both the native
  // and schema-driven paths; no separate attribute needed.
  if (element.hasAttribute('x-ignore')) {
    return { skipped: true, reason: 'x-ignore' };
  }

  if (processedElements.has(element)) {
    return { skipped: true, reason: 'already processed' };
  }

  const name = schemaName || detectSchema(element);
  dlog(`[Schema Builder] Processing element: ${element.tagName}, detected schema: ${name}`);
  if (!name) {
    dlog(`[Schema Builder] No schema detected for ${element.tagName}`);
    return { skipped: true, reason: 'no schema detected' };
  }
  
  const schema = getSchema(name);
  if (!schema) {
    console.warn(`[Schema Builder] Schema not found: ${name}`);
    return { skipped: true, reason: `schema "${name}" not found` };
  }
  
  dlog(`[Schema Builder] Processing ${element.tagName} with schema ${name}`);
  
  // Extract data from attributes
  const data = extractData(element, schema);
  dlog(`[Schema Builder] Extracted data:`, data);
  
  // Build DOM structure from $view
  buildStructure(element, schema, data);
  dlog(`[Schema Builder] After buildStructure, element.innerHTML:`, element.innerHTML);
  
  // Mark as processed
  processedElements.add(element);
  element.setAttribute('x-schema', name);

  // Bind $methods to element
  if (schema.$methods) {
    bindSchemaMethodsToElement(element, schema, data);
  }

  // Trigger behavior injection if WB is available
  // The behavior adds interactivity (click handlers, animations, etc.)
  if (window.WB?.inject && schema.behavior) {
    // Don't await - let it run async
    window.WB.inject(element, schema.behavior, { schemaProcessed: true });
  }
  
  return { success: true, schema: name, data };
}

/**
 * Bind $methods from schema to element instance
 * Creates callable methods like element.show(), element.hide(), etc.
 */
function bindSchemaMethodsToElement(element, schema, data) {
  const methods = schema.$methods || {};
  const baseClass = getBaseClass(schema);
  
  // Create a simple ViewModel with common methods
  const viewModel = {
    element,
    data,
    schema,
    
    // Common methods - behaviors can override these
    show() {
      element.hidden = false;
      element.style.display = '';
      element.dispatchEvent(new CustomEvent('wb:show', { bubbles: true }));
    },
    
    hide() {
      element.hidden = true;
      element.dispatchEvent(new CustomEvent('wb:hide', { bubbles: true }));
    },
    
    toggle() {
      if (element.hidden) {
        this.show();
      } else {
        this.hide();
      }
    },
    
    update(newData) {
      Object.assign(data, newData);
      // Rebuild structure with new data
      buildStructure(element, schema, data);
      element.dispatchEvent(new CustomEvent('wb:update', { 
        bubbles: true, 
        detail: newData 
      }));
    },
    
    getData() {
      return { ...data };
    },
    
    getSchema() {
      return schema;
    }
  };
  
  // Bind each method defined in schema to the element
  for (const [methodName, config] of Object.entries(methods)) {
    if (typeof viewModel[methodName] === 'function') {
      element[methodName] = viewModel[methodName].bind(viewModel);
    } else {
      // Create a stub that warns if method not implemented
      element[methodName] = (...args) => {
        console.warn(`[WB] Method "${methodName}" called but not implemented for ${schema.behavior}`);
        element.dispatchEvent(new CustomEvent(`wb:${methodName}`, {
          bubbles: true,
          detail: { args }
        }));
      };
    }
  }
  
  // Store viewModel reference for behavior access
  element._wbViewModel = viewModel;
}

/**
 * Detect schema from element
 * 
 * v3.0 Priority:
 *   1. x-card> - Web component tag (PRIMARY)
 *   2. - Data attribute (DEPRECATED - legacy fallback)
 * 
 * Note: Class detection was removed - classes are for CSS only
 */
// A tag either HAS a def or it doesn't -- schema and behavior must never
// both try to own the same element's DOM (#279). BUT: not every behavior is
// self-sufficient. Some (card.js's whole family, demo.js, details.js,
// stack/searchfield via layouts.js/search.js) build their ENTIRE DOM
// unconditionally from scratch and never need schema's pre-built $view --
// for those, letting schema ALSO run is a pure race (loadSchemaFile()'s
// fetch is async on a cold cache; whichever of schema/behavior finishes
// last wins via its own `element.innerHTML = ''`, silently wiping the
// other's work). Others (header.js confirmed live, and likely many more of
// the 74 tags with both a behavior AND a schema.json) are the OPPOSITE:
// they never build `.x-header__right`/etc. themselves at all -- they
// EXPECT schema to have already built that structure and only enhance it.
// Excluding those from schema entirely doesn't fix a race, it just deletes
// their DOM outright (confirmed live: excluding all 74 broke header.spec.ts
// site-wide, ~170 test failures on a single run -- reverted).
//
// So this is a per-tag fact, not a blanket rule keyed off "has a behavior."
// SCHEMA_EXCLUDED_TAGS lists tags CONFIRMED (by reading the actual behavior
// source, not assumed) to build their own complete DOM unconditionally:
// x-demo (#312 -- pre.js's "view source" toggle silently stopped
// responding whenever WB.scan()'s schema loop raced WBDemo.
// connectedCallback(), because buildStructure()'s empty-$view fallback
// re-parses element.innerHTML as a string, producing a listener-less
// look-alike); x-details (#305/#336 -- schema's "content" node type
// discarded the element's real children into an empty div, which
// details() then wrapped as if it were the real content); x-stack/
// x-search (found live via #279's audit); the entire x-card* family,
// most visibly cardimage/cardvideo -- confirmed live via [WB:card-media]
// tracing (card.js): PAINTED succeeds, then a stale check ~2s later shows
// the element wiped from the DOM entirely by a schema fetch that resolved
// late. Adding a new tag here requires reading its actual behavior source
// first to confirm it doesn't rely on schema-built children -- do not
// widen this to "every tag with a behavior" again.
// x-skeleton: skeleton.schema.json has a real, non-empty $view (builds
// line/circle/rect/card placeholder divs conditionally). skeleton()
// (feedback.js) unconditionally does `element.innerHTML = ''` and rebuilds
// when lines > 1, with no schemaProcessed-aware cooperation -- the exact
// same "always self-rebuild" pattern as the card family, so it's exposed to
// the same async-schema-race. This was a LATENT, previously-unreported bug
// (found auditing schemas while investigating #279, not from a live
// complaint) -- <div x-skeleton> was never in this list before tonight.
// x-article/x-articles: had a real $view but NO behavior implementation at
// all (confirmed: no article.js existed anywhere) -- <article> rendered
// as bare unstyled text on any page not running the schema-builder engine
// (e.g. wb-lazy.js-based demo pages, which have no MVVM layer whatsoever).
// article.js now builds the full structure itself, unconditionally, the same
// self-sufficient pattern as the card family -- so it's added here for the
// same reason, not left to race with schema's $view build.
// x-select: select.schema.json's $view built a fake dropdown out of
// <button>/<div>/<ul> -- no real <select> anywhere in it, so it had none of
// a native <select>'s keyboard nav/mobile picker/form submission/screen
// reader semantics. semantics/select.js now builds a REAL <select> for this
// tag itself (self-sufficient, same pattern), so schema must never build
// the old fake widget on top of/instead of it.
// x-dialog (#387 audit, docs/audits/HOST-CHILD-DISPATCH-AUDIT.md):
// dialog.js already builds a real native <dialog> + showModal() on
// trigger, appended fresh to document.body -- it never uses the
// <dialog> host's own children/innerHTML at all in the common path.
// dialog.schema.json's $view (div/header/h2/button/main/footer) is stale
// and would only ever sit as dead, mismatched chrome inside the host if
// schema ever processed it -- currently latent since only wb-lazy.js demo
// pages (no schema support) use <dialog> today. Excluding here is
// independent of the separate "should dialog.js eagerly deliver a real
// <dialog> tag on connect instead of lazily on click" question, which
// stays a tracked, maintainer-decision-pending known violation in
// tests/regression/semantic-element-fidelity.spec.ts.
// x-fix-card (#365): a WBCard subclass (fix-card.js) -- same
// self-sufficient, unconditional-DOM-rebuild pattern as the rest of the
// card family below (its schema's $view is empty anyway, but excluding it
// here documents the same "never race the class" intent explicitly rather
// than relying on the empty $view being a no-op forever).
// x-drawer-layout (#556): drawerLayout() (layouts.js) unconditionally
// builds its own complete toggle <button class="x-drawer-toggle"> --
// same self-sufficient pattern as the rest of this list, no
// options.schemaProcessed cooperation anywhere in that function. Left off
// this list, schema-builder ALSO ran drawerLayout.schema.json's own $view
// (a "toggle" part -- getPartClass() above turns baseClass "x-drawer-layout"
// + part name "toggle" into literally "x-drawer-layout__toggle"), building
// a SECOND, empty placeholder button on top of the first. Confirmed live via
// no-element-overlap.spec.ts on demos/site/layout.html: the two buttons sit
// at the exact same position, an empty "x-drawer-layout__toggle" painted
// over the real "x-drawer-toggle" arrow.
const SCHEMA_EXCLUDED_TAGS = new Set([
  'x-demo', 'x-details', 'x-stack', 'x-search', 'x-skeleton', 'x-select',
  'x-article', 'x-articles', 'x-dialog', 'x-drawer-layout',
  'x-card', 'x-cardimage', 'x-cardvideo', 'x-cardbutton', 'x-carddraggable',
  'x-cardexpandable', 'x-cardfile', 'x-cardhero', 'x-cardhorizontal',
  'x-cardlink', 'x-card-link', 'x-cardminimizable', 'x-cardnotification',
  'x-cardoverlay', 'x-cardportfolio', 'x-cardpricing', 'x-cardproduct',
  'x-cardprofile', 'x-cardstats', 'x-cardtestimonial', 'x-fix-card',
  // #654: x-ripple's schema $view is a single `<span name="effect">` whose own
  // description says "created on click" -- it documents a RUNTIME element, not
  // view content. Running it destroyed the author's children (processSchema
  // wipes before building) and replaced them with an empty, zero-size span, so
  // `<span x-ripple>text</span>` rendered nothing at all and had no box to
  // click. ripple() builds its own `span.x-ripple__wave` per click and never
  // reads `.x-ripple__effect`; it needs the host's content left alone.
  'x-ripple',
  // #655: confetti() substitutes its default "Fire Confetti!" label only when
  // the host is empty -- a correct guard that the schema wipe defeated, since
  // textContent was always empty by the time it ran. Authored content was
  // silently replaced on every <div x-confetti>.
  'x-confetti',
  // #656: stagelight.schema.json's $view builds source/beam/spot/housing/label
  // -- the SAME elements stagelight() builds unconditionally for every variant.
  // That is precisely the schema-vs-behavior race this list exists for
  // ("whichever finishes last wins via its own innerHTML = ''"), and it also
  // destroyed the host's authored text on every <div x-stagelight>.
  'x-stagelight'
]);

// x-{name} attribute matching a registered schema: <article x-card> resolves
// the same as <article>. Same dynamically-named boolean-attribute convention
// wb.js's native-tag autoInject already uses for behaviors (x-ripple,
// x-password, ... -- wb.js:229's `${prefix}-${candidate}` check). Dual-
// maintained alongside tag detection indefinitely, by design -- see
// docs/architecture/proposals/remove-wb-prefix-authoring-surface.md. Neither
// form is deprecated; both keep resolving to the same schema.
//
// x-behavior/x-ignore/x-schema are meta-attributes with their own separate
// meaning (generic dispatch, opt-out, and "already processed" marking
// respectively) and must never be misread as a schema-name attribute.
const META_X_ATTRIBUTES = new Set(['x-behavior', 'x-ignore', 'x-schema']);

function detectXAttributeSchema(element) {
  for (const attr of element.attributes) {
    if (!attr.name.startsWith('x-') || META_X_ATTRIBUTES.has(attr.name)) continue;
    const name = attr.name.slice(2);
    // #678: SCHEMA_EXCLUDED_TAGS was consulted ONLY by the wb-* tag branch of
    // detectSchema(), so every entry on it -- 34 behaviors confirmed to build
    // their own DOM and to be destroyed by the schema wipe -- was bypassed
    // entirely by the equivalent x-* attribute form. `<span x-ripple>text</span>`
    // was protected; `<div x-ripple>text</div>` was not, and the two forms are
    // documented as equivalent authoring surfaces.
    //
    // That asymmetry is why <div x-cardstats>text</div> still lost its content
    // after the card behaviors were fixed to preserve it: processSchema() wiped
    // the element before cardstats() ever ran, so there was nothing left to
      // preserve. The list is keyed by the x- form (#850): the set literals were
    // renamed by the 4.0.0 prefix pass, but this COMPUTED key was not -- a
    // pattern matching literal names cannot see 'wb-' + name. The lookup then
    // matched nothing and all 34 exclusions silently stopped applying.
    if (SCHEMA_EXCLUDED_TAGS.has('x-' + name)) continue;
    if (schemaRegistry.has(name)) return name;
  }
  return null;
}

function detectSchema(element) {
  const tagName = element.tagName.toLowerCase();

  // 1. Web component tag: x-card>
  if (tagName.startsWith('wb-')) {
    if (SCHEMA_EXCLUDED_TAGS.has(tagName)) return null;
    const mapped = tagToSchema.get(tagName);
    if (mapped) return mapped;
    // Only claim a derived name if a schema is actually registered for it.
    // wb-* tags with no behavior AND no registered schema are owned by
    // custom elements or CSS alone -- guessing a name and then warning
    // "Schema not found" was pure console spam (#174). Return null so
    // processElement skips silently and leaves the tag to its real owner.
    const derived = tagName.replace('wb-', '').replace(/-/g, '');
    return schemaRegistry.has(derived) ? derived : null;
  }

  // 2. x-{name} attribute on any other tag (see comment above).
  return detectXAttributeSchema(element);
}

// =============================================================================
// DOM SCANNING
// =============================================================================

/**
 * Scan DOM for elements to process
 */
export function scan(root = document.body) {
  for (const el of root.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();

    // Process wb-* tags (not x-view)
    if (tag.startsWith('wb-') && tag !== 'x-view') {
      processElement(el);
      continue;
    }

    // Process x-behavior elements
    if (el.hasAttribute('x-behavior')) {
      processElement(el);
      continue;
    }

    // Process x-{name} attribute elements (dual-maintained alongside wb-*
    // tags -- see detectXAttributeSchema()'s comment).
    if (detectXAttributeSchema(el)) {
      processElement(el);
    }
  }
}

// =============================================================================
// MUTATION OBSERVER
// =============================================================================

let observer = null;

export function startObserver() {
  if (observer) return;
  
  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const tag = node.tagName?.toLowerCase();

        if (tag?.startsWith('wb-') && tag !== 'x-view') {
          processElement(node);
        }

        if (node.hasAttribute?.('x-behavior')) {
          processElement(node);
        }

        if (node.attributes && detectXAttributeSchema(node)) {
          processElement(node);
        }

        if (node.querySelectorAll) {
          scan(node);
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  dlog('[Schema Builder] Observer started');
}

// =============================================================================
// INITIALIZATION
// =============================================================================

export async function init(options = {}) {
  dlog('[Schema Builder] ═══════════════════════════════════');
  dlog('[Schema Builder] MVVM Schema Builder v3.0');
  dlog('[Schema Builder] $view + $methods format');
  dlog('[Schema Builder] ═══════════════════════════════════');
  
  const basePath = options.schemaPath || DEFAULT_SCHEMA_BASE;
  await loadSchemas(basePath);
  
  scan(document.body);
  startObserver();
  
  dlog('[Schema Builder] Ready!');
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  init,
  loadSchemas,
  loadSchemaFile,
  registerSchema,
  getSchema,
  getMethods,
  bindMethods,
  processElement,
  scan,
  startObserver,
  registry: schemaRegistry
};
