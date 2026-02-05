/**
 * WB Schema Builder - MVVM Core
 * =============================
 * Builds DOM structure from JSON Schema definitions.
 * NO innerHTML in component classes. Schema IS the template.
 * 
 * @version 3.0.0 - $view format with $methods support
 * 
 * MVVM Structure:
 *   - Model: properties (data inputs)
 *   - View: $view (DOM structure)
 *   - ViewModel: $methods (callable functions)
 * 
 * v3.0 Syntax Strategy:
 * =====================
 * PRIMARY (use in new code):
 *   - 1. `<wb-card title="Hello">` - Web component tags for components
 *   - 2. `<button x-ripple>` - x- prefix for adding behaviors
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * EXAMPLE TRACE: Follow this card through the entire pipeline
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * INPUT HTML:
 *   `<wb-card title="Hello" elevated>Content here</wb-card>`
 * 
 * SCHEMA (card.schema.json):
 *   {
 *     "behavior": "card",
 *     "baseClass": "wb-card",
 *     "properties": {
 *       "title": { "type": "string" },
 *       "elevated": { "type": "boolean", "appliesClass": "wb-card--elevated" }
 *     },
 *     "$view": [
 *       { "name": "header", "tag": "header", "createdWhen": "title OR subtitle" },
 *       { "name": "title", "tag": "h3", "parent": "header", "content": "{{title}}" },
 *       { "name": "body", "tag": "main", "required": true, "content": "{{content}}" }
 *     ],
 *     "$methods": {
 *       "show": { "description": "Shows the card" },
 *       "hide": { "description": "Hides the card" }
 *     }
 *   }
 * 
 * PROCESSING STEPS:
 *   - 1. scan() → finds `<wb-card>` in DOM
 *   - 2. processElement() → runs steps 3-9 below
 *   - 3. detectSchema() → "wb-card" tag → returns "card"
 *   - 4. getSchema() → looks up card.schema.json from registry
 *   - 5. extractData() → { title: "Hello", elevated: true, content... }
 *   - 6. buildStructure() → applies classes, calls buildFromView()
 *   - 7. buildFromView() → creates header, h3, main from $view
 *   - 8. bindSchemaMethodsToElement() → attaches .show(), .hide()
 *   - 9. WB.inject() → adds behavior interactivity
 * 
 * OUTPUT HTML:
 *   - `<wb-card class="wb-card wb-card--elevated">`
 *   -   `<header class="wb-card__header">`
 *   -     `<h3 class="wb-card__title">Hello</h3>`
 *   -   `</header>`
 *   -   `<main class="wb-card__body">Content here</main>`
 *   - `</wb-card>`
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
 * @example
 * await loadSchemas('/src/wb-models')  // loads all *.schema.json files
 * await loadSchemas('/custom/path')    // custom schema location
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
    
    console.log(`[Schema Builder] Loading ${schemaFiles.length} schemas...`);
    
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
    
    console.log(`[Schema Builder] ✅ Loaded ${loaded}/${schemaFiles.length} schemas`);
    
  } catch (error) {
    console.error('[Schema Builder] Failed to load schemas:', error);
  }
}

/**
 * Register a single schema
 * 
 * PURPOSE:
 *   Adds a schema to the runtime registry so the system knows how to build
 *   components of that type. Creates mapping between tag name/schema.
 * 
 * WHAT IT DOES:
 *   - 1. Extracts schema name from "behavior" field (or filename)
 *   - 2. Stores schema object in schemaRegistry (name → schema)
 *   - 3. Creates tag-to-schema mapping (wb-card → card)
 * 
 * WHY IT EXISTS:
 *   - Called during loadSchemas() for each .schema.json file
 *   - Enables processElement() to look up how to build any `<wb-*>` tag
 *   - Allows getWBkeys() to return all registered component tag names
 * 
 * EXAMPLE TRACE:
 *   - Input:  schema = { behavior: "card"... }
 *   - Result: schemaRegistry.set("card", schema)
 *   - Result: tagToSchema.set("wb-card", "card")
 */
export function registerSchema(schema, filename) {
  const name = schema.behavior || filename.replace('.schema.json', '');
  
  schemaRegistry.set(name, schema);
  
  // Map tag name: wb-card-profile → cardprofile
  const tagName = `wb-${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  tagToSchema.set(tagName, name);
  
  console.log(`[Schema Builder] Registered: ${name} → <${tagName}>`);
}

/**
 * Returns array of all registered `<wb-*>` tag names from the schema registry.
 * Useful for querying all WB components in the DOM at once.
 * @returns {string[]} ["wb-card", "wb-button", ...]
 * @example
 * getWBkeys()  // → ["wb-card", "wb-button", "wb-drawer", ...]
 * document.querySelectorAll(getWBkeys().join(', '))  // select all WB
 */
export function getWBkeys() {
  return [...tagToSchema.keys()];
}

/**
 * Looks up a schema by its behavior name or tag name.
 * Accepts either format and resolves to the schema object.
 * @param {string} identifier - Schema name ("card") or tag ("wb-card")
 * @returns {Object|null} Schema object or null if not found
 * @example
 * getSchema("card")      // → { behavior: "card", $view: [...], ... }
 * getSchema("wb-card")   // → same result (resolved via tagToSchema)
 * getSchema("unknown")   // → null
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
 * Extracts the base CSS class from a schema definition.
 * Checks baseClass, compliance.baseClass, or generates from behavior name.
 * @param {Object} schema - Component schema
 * @returns {string} Base CSS class name
 * @example
 * getBaseClass({ baseClass: "wb-card" })           // → "wb-card"
 * getBaseClass({ compliance: { baseClass: "wb-button" } }) // → "wb-button"
 * getBaseClass({ behavior: "drawer" })             // → "wb-drawer" (fallback)
 */
function getBaseClass(schema) {
  return schema.baseClass || schema.compliance?.baseClass || `wb-${schema.behavior}`;
}

/**
 * Generates a BEM element class by combining baseClass with part name.
 * Used to create consistent class naming for component parts.
 * @param {Object} schema - Component schema
 * @param {string} partName - Part name (e.g., "header", "title")
 * @returns {string} BEM element class
 * @example
 * getPartClass({ baseClass: "wb-card" }, "header")  // → "wb-card__header"
 * getPartClass({ baseClass: "wb-card" }, "title")   // → "wb-card__title"
 */
function getPartClass(schema, partName) {
  return `${getBaseClass(schema)}__${partName}`;
}

/**
 * Generates a BEM modifier class by combining baseClass with modifier.
 * Used for variant styling (elevated, glass, etc.).
 * @param {Object} schema - Component schema
 * @param {string} modifier - Modifier name (e.g., "elevated", "glass")
 * @returns {string} BEM modifier class
 * @example
 * getModifierClass({ baseClass: "wb-card" }, "elevated")  // → "wb-card--elevated"
 * getModifierClass({ baseClass: "wb-card" }, "glass")     // → "wb-card--glass"
 */
function getModifierClass(schema, modifier) {
  return `${getBaseClass(schema)}--${modifier}`;
}

// =============================================================================
// DATA EXTRACTION
// =============================================================================

/**
 * Extracts data from element attributes and innerHTML into an object.
 * Converts data-* and direct attributes, applies schema defaults.
 * @param {HTMLElement} element - Element to extract data from
 * @param {Object} schema - Component schema with properties
 * @returns {Object} Extracted data object
 * @example
 * // Input:  `<wb-card title="Hello" elevated>Content here</wb-card>`
 * extractData(cardEl, cardSchema)
 * // → { title: "Hello", elevated: true, content: "Content here"... }
 *
 * // Processing:
 * // - attr "title" → data.title = "Hello"
 * // - attr "elevated" (empty) → data.elevated = true
 * // - innerHTML → data.content, data.body (aliases)
 */
function extractData(element, schema) {
  const data = {};
  
  // Get all data-* attributes AND direct attributes
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-')) {
      const key = attr.name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      data[key] = parseValue(attr.value);
    } else if (!['class', 'style', 'id'].includes(attr.name) && !attr.name.startsWith('x-')) {
      // Direct attributes (for web component style)
      const key = attr.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      data[key] = parseValue(attr.value);
    }
  }
  
  // Apply defaults from schema
  if (schema.properties) {
    applyDefaults(data, schema.properties);
  }
  
  // Store original inner content as 'content' (format-agnostic)
  // IMPORTANT: <template> elements store content in .content (DocumentFragment),
  // not in innerHTML. We must serialize the DocumentFragment content properly
  // so behaviors like mdhtml can access template.innerHTML after restoration.
  const templateChild = element.querySelector('template');
  if (templateChild && templateChild.content) {
    // Serialize the DocumentFragment content to a string
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(templateChild.content.cloneNode(true));
    const templateContent = tempDiv.innerHTML;
    
    // Reconstruct the template tag with serialized content
    data.content = `<template>${templateContent}</template>`;  
  } else {
    data.content = element.innerHTML.trim();
  }

  // Alias for backwards compatibility
  data.body = data.content;
  
  return data;
}

/**
 * Parses a raw attribute string into its appropriate JS type.
 * Handles booleans, numbers, JSON objects, and strings.
 * @param {string} value - Raw attribute value
 * @returns {boolean|number|Object|string} Parsed value
 * @example
 * parseValue("")         // → true (boolean attribute)
 * parseValue("true")     // → true
 * parseValue("false")    // → false
 * parseValue("42")       // → 42 (number)
 * parseValue("3.14")     // → 3.14 (float)
 * parseValue('{"a":1}')  // → { a: 1 } (JSON)
 * parseValue("hello")    // → "hello" (string)
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
 * Fills missing data values with defaults defined in schema properties.
 * Recursively handles nested object properties.
 * @param {Object} data - Data object to fill with defaults
 * @param {Object} properties - Schema properties with defaults
 * @example
 * const data = { title: "Hello" };
 * applyDefaults(data, { title: {}, size: { default: "md" } });
 * // data is now { title: "Hello", size: "md" }
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
 * Builds the complete DOM structure for an element based on its schema.
 * Applies classes, clears content, and delegates to format-specific builders.
 * 
 * EXAMPLE TRACE:
 *   - Input:  element = `<wb-card>`, data = { title, elevated... }
 *   - Step 1: element.classList.add("wb-card")
 *   - Step 2: applyVariantClasses() → adds "wb-card--elevated"
 *   - Step 3: element.innerHTML = '' (content saved)
 *   - Step 4: buildFromView() creates children
 *   - Result: `<wb-card class="wb-card wb-card--elevated">...</wb-card>`
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
  
  // Clear existing content (saved in data.content)
  element.innerHTML = '';
  
  // Build from $view (MVVM format)
  if (schema.$view) {
    buildFromView(element, schema, data);
    // If $view is empty, restore original content
    // This is common for components that process their content (like mdhtml)
    if (schema.$view.length === 0 && data.content) {
      element.innerHTML = data.content;
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
  
  // Fallback: just restore original content
  if (data.content) {
    element.innerHTML = data.content;
  }
}

/**
 * Build DOM from $view format (MVVM View Layer)
 * 
 * Schema format:
 *   "$view": [
 *     { "name": "header", "tag": "header", "createdWhen": "title OR subtitle" },
 *     { "name": "title", "tag": "h3", "parent": "header", "content": "{{title}}" },
 *     { "name": "body", "tag": "main", "required": true, "content": "{{content}}" }
 *   ]
 * 
 * EXAMPLE TRACE (data = { title: "Hello", content: "..." }):
 *
 *   - PASS 1: Sort parts by depth then semantic order
 *   - Root-level: header, body (depth 0)
 *   - Nested: title (depth 1, parent: header)
 *   - Sorted: [header, body, title]
 *
 *   - PASS 2: Build each part
 *   - Part "header": createdWhen met → CREATE
 *   - Part "body": required=true → CREATE
 *   - Part "title": parent="header" → CREATE, append to header
 *
 *   - RESULT:
 *   -   `<wb-card>`
 *   -     `<header class="wb-card__header">`
 *   -       `<h3 class="wb-card__title">Hello</h3>`
 *   -     `</header>`
 *   -     `<main class="wb-card__body">...</main>`
 *   -   `</wb-card>`
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
      // Use innerHTML if it's content/body OR looks like HTML
      if (part.content === '{{content}}' || part.content === '{{body}}' || /<[a-z][\s\S]*>/i.test(content)) {
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
 * Builds DOM from legacy v1 compliance format schemas.
 * Provided for backwards compatibility with older schema definitions.
 * @param {HTMLElement} element - Target element
 * @param {Object} schema - Schema with compliance.requiredChildren/optionalChildren
 * @param {Object} data - Extracted data
 * @example
 * // Schema with compliance format:
 * // { compliance: { requiredChildren: { "main.wb-card__body": { content: "{{content}}" } } } }
 * buildFromComplianceFormat(cardEl, schema, { content: "Content" });
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
  
  // Add content to main
  const main = element.querySelector('main, [class*="__main"]');
  if (main && data.content) {
    main.innerHTML = data.content;
  }
}

/**
 * Creates a single DOM element from a legacy compliance definition.
 * Parses selector for tag/class, applies content, and builds children.
 * @param {string} selector - CSS selector like "main.wb-card__body"
 * @param {Object} def - Definition with tagName, content, children
 * @param {Object} data - Data for interpolation
 * @param {Object} schema - Parent schema
 * @returns {HTMLElement} Created element
 * @example
 * createFromComplianceDef("header.wb-card__header", { content: "{{title}}" }, { title: "Hi" }, schema)
 * // → `<header class="wb-card__header">Hi</header>`
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
    if (def.content === '{{content}}' || def.content === '{{body}}') {
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
 * Returns sort order based on semantic HTML5 landmark order.
 * Ensures header comes before main, main before footer, etc.
 * @param {string} selector - CSS selector starting with tag name
 * @returns {number} Order value (0=nav, 1=header, 2=main, 3=aside, 4=footer)
 * @example
 * getSemanticOrder("header.wb-card__header")  // → 1
 * getSemanticOrder("main.wb-card__body")      // → 2
 * getSemanticOrder("footer.wb-card__footer")  // → 4
 * getSemanticOrder("div.custom")              // → 2 (default)
 */
function getSemanticOrder(selector) {
  const tag = selector.split('.')[0].toLowerCase();
  const orders = { nav: 0, header: 1, main: 2, aside: 3, footer: 4 };
  return orders[tag] ?? 2;
}

/**
 * Applies BEM modifier classes and attributes based on data values.
 * Handles appliesClass, appliesAttribute, and enum variants.
 * @param {HTMLElement} element - Target element
 * @param {Object} schema - Component schema with properties
 * @param {Object} data - Data with property values
 * @example
 * // schema.properties: { elevated: { appliesClass: "wb-card--elevated" } }
 * // data: { elevated: true }
 * applyVariantClasses(cardEl, schema, data);
 * // cardEl now has class "wb-card--elevated"
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
 * Evaluates a createdWhen condition against data values.
 * Supports simple checks, OR, AND, and NOT operators.
 * @param {string} condition - Condition string to evaluate
 * @param {Object} data - Data object with property values
 * @returns {boolean} Whether condition is met
 * @example
 * // Simple property check
 * evaluateCondition("title", { title: "Hello" })        // → true
 * evaluateCondition("title", { title: "" })             // → false
 * evaluateCondition("title", {})                        // → false
 *
 * // OR conditions (any match)
 * evaluateCondition("title OR subtitle", { title: "X" })           // → true
 * evaluateCondition("title OR subtitle", { subtitle: "Y" })        // → true
 * evaluateCondition("title OR subtitle", {})                       // → false
 *
 * // AND conditions (all must match)
 * evaluateCondition("title AND subtitle", { title: "X", subtitle: "Y" }) // → true
 * evaluateCondition("title AND subtitle", { title: "X" })                // → false
 *
 * // NOT conditions
 * evaluateCondition("NOT disabled", { disabled: false }) // → true
 * evaluateCondition("NOT disabled", { disabled: true })  // → false
 *
 * // Boolean values
 * evaluateCondition("elevated", { elevated: true })  // → true
 * evaluateCondition("elevated", { elevated: false }) // → false
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
 * Replace `{{placeholder}}` tokens in a template with data values.
 * Used by $view content fields to inject dynamic text into DOM elements.
 * Missing keys are replaced with empty string (no error thrown).
 * @param {string} template - Template string with `{{key}}` placeholders
 * @param {Object} data - Data object with key-value pairs
 * @returns {string} Template with placeholders replaced by values
 * @example
 * interpolate("{{title}}", { title: "Hello" })           // → "Hello"
 * interpolate("Hello, {{name}}!", { name: "John" })      // → "Hello, John!"
 * interpolate("{{a}} and {{b}}", { a: "X", b: "Y" })     // → "X and Y"
 * interpolate("Missing: {{foo}}", {})                    // → "Missing: "
 * interpolate("No placeholders", { title: "Hi" })        // → "No placeholders"
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
 * Binds schema-defined methods to an element using a viewModel.
 * Makes methods callable directly on the element instance.
 * @param {HTMLElement} element - Target element
 * @param {Object} schema - Component schema
 * @param {Object} viewModel - ViewModel instance with method implementations
 * @example
 * const viewModel = { show() { this.element.hidden = false; } };
 * bindMethods(cardEl, { $methods: { show: {} } }, viewModel);
 * cardEl.show();  // calls viewModel.show()
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
 * Returns the $methods definitions from a schema by name.
 * Used to inspect available methods without processing an element.
 * @param {string} schemaName - Name of schema
 * @returns {Object} Method definitions
 * @example
 * getMethods("card")  // → { show: { description: "Shows..." }, hide... }
 * getMethods("unknown")  // → {}
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
 * EXAMPLE TRACE:
 *   Input: `<wb-card title="Hello" elevated>Content here</wb-card>`
 *
 *   - 3. detectSchema() → "card"
 *   - 4. getSchema("card") → { behavior: "card", $view: [...], ... }
 *   - 5. extractData() → { title: "Hello", elevated: true, content... }
 *   - 6. buildStructure() → creates DOM children, applies classes
 *   - 7. buildFromView() → creates header, h3, main from $view
 *   - 8. bindSchemaMethodsToElement() → element.show(), element.hide()
 *   - 9. WB.inject(element, "card") → adds interactivity
 *
 * To query all WB: document.querySelectorAll(getWBkeys().join(', '))
 * 
 *   Output: { success: true, schema: "card", data: {...} }
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
 * @param {HTMLElement} element - Target element
 * @param {Object} schema - Component schema with $methods
 * @param {Object} data - Element data
 * @example
 * bindSchemaMethodsToElement(cardEl, cardSchema, { title: "Hello" });
 * cardEl.show();    // shows element, dispatches wb:show event
 * cardEl.hide();    // hides element, dispatches wb:hide event
 * cardEl.toggle();  // toggles visibility
 * cardEl.update({ title: "New" });  // updates and rebuilds
 * cardEl.getData(); // → { title: "New", ... }
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
 *   1. `<wb-card>` - Web component tag (PRIMARY)
 *   2. x-behavior attribute - For adding behaviors to existing elements
 * 
 * EXAMPLE TRACE:
 *   - Input: `<wb-card title="Hello">...</wb-card>`
 *   - tagName = "wb-card"
 *   - tagName.startsWith("wb-") → true
 *   - tagToSchema.get("wb-card") → "card"
 *   - returns "card"
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
 * Scans a DOM subtree for `<wb-*>` elements and elements with `x-*` attributes.
 * Processes each matching element through the schema builder.
 * @param {HTMLElement} root - Root element to scan (default: document.body)
 * @example
 * scan();                    // scan entire document
 * scan(containerEl);         // scan specific container
 * scan(document.body);       // explicit full scan
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
    
    // Process elements with x-* behavior attributes (x-ripple, x-click, etc.)
    const hasXBehavior = [...el.attributes].some(a => a.name.startsWith('x-'));
    if (hasXBehavior) {
      processElement(el);
    }
  }
}

// =============================================================================
// MUTATION OBSERVER
// =============================================================================

let observer = null;

/**
 * Start MutationObserver to auto-process dynamically added elements.
 * Watches document.body for new `<wb-*>` elements and processes them.
 * @example
 * startObserver();  // begins watching for new `<wb-*>` elements
 * // Now any dynamically added `<wb-card>` will auto-process
 * container.innerHTML = '<wb-card title="Dynamic">Content</wb-card>';
 */
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
        
        // Check for x-* behavior attributes
        const hasXBehavior = [...(node.attributes || [])].some(a => a.name.startsWith('x-'));
        if (hasXBehavior) {
          processElement(node);
        }
        
        if (node.querySelectorAll) {
          scan(node);
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('[Schema Builder] Observer started');
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the Schema Builder system.
 * Loads all schemas from `/src/wb-models`, scans existing DOM for `<wb-*>`
 * elements, and starts the mutation observer for dynamic content.
 * @param {Object} [options] - Configuration options
 * @param {string} [options.schemaPath] - Path to schemas (default: '/src/wb-models')
 * @returns {Promise<void>} Resolves when initialization is complete
 * @example
 * await init();                                   // use defaults
 * await init({ schemaPath: '/custom/schemas' });  // custom path
 */
export async function init(options = {}) {
  console.log('[Schema Builder] ═══════════════════════════════════');
  console.log('[Schema Builder] MVVM Schema Builder v3.0');
  console.log('[Schema Builder] $view + $methods format');
  console.log('[Schema Builder] ═══════════════════════════════════');
  
  const basePath = options.schemaPath || '/src/wb-models';
  await loadSchemas(basePath);
  
  scan(document.body);
  startObserver();
  
  console.log('[Schema Builder] Ready!');
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  init,
  loadSchemas,
  registerSchema,
  getSchema,
  getWBkeys,
  getMethods,
  bindMethods,
  processElement,
  scan,
  startObserver,
  registry: schemaRegistry
};
