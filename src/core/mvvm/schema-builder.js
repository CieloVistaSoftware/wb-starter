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
 *   1. wb-card title="Hello"> - Web component tags for components
 *   2. <button x-ripple> - x- prefix for adding behaviors
 * 
 * DEPRECATED (legacy fallback):
 *   3. wb-card > - Still works but avoid in new code
 * 
 * Schema Format:
 *   {
 *     "behavior": "card",
 *     "baseClass": "wb-card",
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
 * Classes are AUTO-GENERATED: baseClass + "__" + name → "wb-card__header"
 * Tags are lowercase per HTML5: "header", "main", "footer"
 */

// =============================================================================
// SCHEMA REGISTRY
// =============================================================================

// Debug logging — silent unless localStorage['wb-debug'] === '1'.
const WB_DEBUG = (() => { try { return localStorage.getItem('wb-debug') === '1'; } catch (e) { return false; } })();
const _wbClog = console.log.bind(console);
const dlog = (...args) => { if (WB_DEBUG) _wbClog(...args); };

/** @type {Map<string, Object>} Schema name → parsed schema */
const schemaRegistry = new Map();

/** @type {Map<string, string>} Tag name → schema name (wb-card-profile → cardprofile) */
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
  
  // Map tag name: wb-card-profile → cardprofile
  const tagName = `wb-${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  tagToSchema.set(tagName, name);
  
  dlog(`[Schema Builder] Registered: ${name} → <${tagName}>`);
}

/**
 * Load a single schema file and register it (fallback for runtime/hydration races)
 * Returns true if the schema was fetched & registered, false otherwise.
 */
// A page with several instances of the same component (e.g. multiple
// <wb-card>-family tags on one page) each independently discover, on scan,
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
  return schema.baseClass || schema.compliance?.baseClass || `wb-${schema.behavior}`;
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
  
  // Honor property aliases declared in the schema BEFORE defaults are applied,
  // so an alias attribute beats the default. e.g. the alert schema declares
  // `variant` with aliases ["type"] so <wb-alert type="success"> works (#176).
  if (schema.properties) {
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      const aliases = propDef && propDef.aliases;
      if (Array.isArray(aliases) && data[propName] === undefined) {
        for (const alias of aliases) {
          const aliasKey = alias.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          if (data[aliasKey] !== undefined) { data[propName] = data[aliasKey]; break; }
        }
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
  
  // Apply base class
  element.classList.add(baseClass);
  
  // Apply additional classes (for variants like wb-card--profile)
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
    
    // appliesClass: "wb-card--elevated"
    if (prop.appliesClass && value === true) {
      element.classList.add(prop.appliesClass);
    }
    
    // appliesAttribute: "title"
    if (prop.appliesAttribute) {
      element.setAttribute(prop.appliesAttribute, value);
    }
    
    // Enum variants: variant="glass" → wb-card--glass
    if (prop.enum && typeof value === 'string' && value !== 'default') {
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
 *   1. wb-card> - Web component tag (PRIMARY)
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
// they never build `.wb-header__right`/etc. themselves at all -- they
// EXPECT schema to have already built that structure and only enhance it.
// Excluding those from schema entirely doesn't fix a race, it just deletes
// their DOM outright (confirmed live: excluding all 74 broke header.spec.ts
// site-wide, ~170 test failures on a single run -- reverted).
//
// So this is a per-tag fact, not a blanket rule keyed off "has a behavior."
// SCHEMA_EXCLUDED_TAGS lists tags CONFIRMED (by reading the actual behavior
// source, not assumed) to build their own complete DOM unconditionally:
// wb-demo (#312 -- pre.js's "view source" toggle silently stopped
// responding whenever WB.scan()'s schema loop raced WBDemo.
// connectedCallback(), because buildStructure()'s empty-$view fallback
// re-parses element.innerHTML as a string, producing a listener-less
// look-alike); wb-details (#305/#336 -- schema's "content" node type
// discarded the element's real children into an empty div, which
// details() then wrapped as if it were the real content); wb-stack/
// wb-search (found live via #279's audit); the entire wb-card* family,
// most visibly cardimage/cardvideo -- confirmed live via [WB:card-media]
// tracing (card.js): PAINTED succeeds, then a stale check ~2s later shows
// the element wiped from the DOM entirely by a schema fetch that resolved
// late. Adding a new tag here requires reading its actual behavior source
// first to confirm it doesn't rely on schema-built children -- do not
// widen this to "every tag with a behavior" again.
// wb-skeleton: skeleton.schema.json has a real, non-empty $view (builds
// line/circle/rect/card placeholder divs conditionally). skeleton()
// (feedback.js) unconditionally does `element.innerHTML = ''` and rebuilds
// when lines > 1, with no schemaProcessed-aware cooperation -- the exact
// same "always self-rebuild" pattern as the card family, so it's exposed to
// the same async-schema-race. This was a LATENT, previously-unreported bug
// (found auditing schemas while investigating #279, not from a live
// complaint) -- <wb-skeleton> was never in this list before tonight.
// wb-article/wb-articles: had a real $view but NO behavior implementation at
// all (confirmed: no article.js existed anywhere) -- <wb-article> rendered
// as bare unstyled text on any page not running the schema-builder engine
// (e.g. wb-lazy.js-based demo pages, which have no MVVM layer whatsoever).
// article.js now builds the full structure itself, unconditionally, the same
// self-sufficient pattern as the card family -- so it's added here for the
// same reason, not left to race with schema's $view build.
// wb-select: select.schema.json's $view built a fake dropdown out of
// <button>/<div>/<ul> -- no real <select> anywhere in it, so it had none of
// a native <select>'s keyboard nav/mobile picker/form submission/screen
// reader semantics. semantics/select.js now builds a REAL <select> for this
// tag itself (self-sufficient, same pattern), so schema must never build
// the old fake widget on top of/instead of it.
const SCHEMA_EXCLUDED_TAGS = new Set([
  'wb-demo', 'wb-details', 'wb-stack', 'wb-search', 'wb-skeleton', 'wb-select',
  'wb-article', 'wb-articles',
  'wb-card', 'wb-cardimage', 'wb-cardvideo', 'wb-cardbutton', 'wb-carddraggable',
  'wb-cardexpandable', 'wb-cardfile', 'wb-cardhero', 'wb-cardhorizontal',
  'wb-cardlink', 'wb-card-link', 'wb-cardminimizable', 'wb-cardnotification',
  'wb-cardoverlay', 'wb-cardportfolio', 'wb-cardpricing', 'wb-cardproduct',
  'wb-cardprofile', 'wb-cardstats', 'wb-cardtestimonial'
]);

function detectSchema(element) {
  const tagName = element.tagName.toLowerCase();

  // 1. Web component tag: wb-card>
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

  // 2. Data attribute:
  const dataWb = element.tagName.toLowerCase().startsWith('wb-');
  if (dataWb) {
    const behaviors = dataWb.split(/\s+/);
    for (const b of behaviors) {
      if (schemaRegistry.has(b)) return b;
    }
  }

  // NO class detection - classes are for CSS only
  return null;
}

// =============================================================================
// DOM SCANNING
// =============================================================================

/**
 * Scan DOM for elements to process
 */
export function scan(root = document.body) {
  // Find wb-* tags
  const wbTags = root.querySelectorAll('[class^="wb-"], [class*=" wb-"]');
  
  for (const el of root.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    
    // Process wb-* tags (not wb-view)
    if (tag.startsWith('wb-') && tag !== 'wb-view') {
      processElement(el);
      continue;
    }
    
    // Process x-behavior elements
    if (el.hasAttribute('x-behavior')) {
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
        
        if (tag?.startsWith('wb-') && tag !== 'wb-view') {
          processElement(node);
        }
        
        if (node.hasAttribute?.('x-behavior')) {
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
