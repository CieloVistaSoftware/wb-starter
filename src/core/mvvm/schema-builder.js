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

/** @type {Map<string, Object>} Schema name → parsed schema */
const schemaRegistry = new Map();

/** @type {Map<string, string>} Tag name → schema name (wb-card-profile → cardprofile) */
const tagToSchema = new Map();

/** @type {WeakSet<HTMLElement>} Track processed elements */
const processedElements = new WeakSet();

// =============================================================================
// SCHEMA LOADING
// =============================================================================

/**
 * Load all schemas from wb-models directory
 * @param {string} basePath - Path to wb-models folder
 */
export async function loadSchemas(basePath = '/src/wb-models') {
  try {
    const indexResponse = await fetch(`${basePath}/index.json`);
    
    if (!indexResponse.ok) {
      console.warn('[Schema Builder] No index.json found, using fallback');
      return;
    }
    
    const index = await indexResponse.json();
    const schemaFiles = index.schemas || [];
    
    if (window.WB_DEBUG) console.log(`[Schema Builder] Loading ${schemaFiles.length} schemas...`);
    
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
    
    if (window.WB_DEBUG) console.log(`[Schema Builder] ✅ Loaded ${loaded}/${schemaFiles.length} schemas`);
    
  } catch (error) {
    console.error('[Schema Builder] Failed to load schemas:', error);
  }
}

/**
 * Register a single schema
 */
export function registerSchema(schema, filename) {
  const name = schema.behavior || filename.replace('.schema.json', '');
  
  schemaRegistry.set(name, schema);
  
  // Map tag name: wb-card-profile → cardprofile
  const tagName = `wb-${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  tagToSchema.set(tagName, name);
  
  if (window.WB_DEBUG) console.log(`[Schema Builder] Registered: ${name} → <${tagName}>`);
}

/**
 * Get schema by name or tag
 */
export function getSchema(identifier) {
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
  // Empty string stays empty (don't convert to true!)
  if (value === '') return '';
  if (value === 'true') return true;
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
  
  // Clear existing content (we saved it as slot)
  element.innerHTML = '';
  
  // Build from $view (MVVM format)
  if (schema.$view) {
    buildFromView(element, schema, data);
    // If $view is empty, restore original slot content
    // This is common for components that process their content (like mdhtml)
    if (schema.$view.length === 0 && data.slot) {
      element.innerHTML = data.slot;
    }
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
  if (!name) {
    return { skipped: true, reason: 'no schema detected' };
  }
  
  const schema = getSchema(name);
  if (!schema) {
    console.warn(`[Schema Builder] Schema not found: ${name}`);
    return { skipped: true, reason: `schema "${name}" not found` };
  }
  
  // Extract data from attributes
  const data = extractData(element, schema);
  
  // Build DOM structure from $view
  buildStructure(element, schema, data);
  
  // Mark as processed
  processedElements.add(element);
  element.dataset.wbSchema = name;
  
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
function detectSchema(element) {
  const tagName = element.tagName.toLowerCase();
  
  // 1. Web component tag: wb-card>
  if (tagName.startsWith('wb-')) {
    const mapped = tagToSchema.get(tagName);
    if (mapped) return mapped;
    return tagName.replace('wb-', '').replace(/-/g, '');
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
    
    // Process wb elements
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
  if (window.WB_DEBUG) console.log('[Schema Builder] Observer started');
}

// =============================================================================
// INITIALIZATION
// =============================================================================

export async function init(options = {}) {
  if (window.WB_DEBUG) {
    console.log('[Schema Builder] ═══════════════════════════════════');
    console.log('[Schema Builder] MVVM Schema Builder v3.0');
    console.log('[Schema Builder] $view + $methods format');
    console.log('[Schema Builder] ═══════════════════════════════════');
  }
  
  const basePath = options.schemaPath || '/src/wb-models';
  await loadSchemas(basePath);
  
  scan(document.body);
  startObserver();
  
  if (window.WB_DEBUG) console.log('[Schema Builder] Ready!');
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  init,
  loadSchemas,
  registerSchema,
  getSchema,
  getMethods,
  bindMethods,
  processElement,
  scan,
  startObserver,
  registry: schemaRegistry
};
