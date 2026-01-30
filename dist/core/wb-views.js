/**
 * WB Views - HTML Template System
 * ================================
 * Declarative HTML templates that leverage the WB behavior system.
 *
 * Usage:
 *   <wb-view card-tile icon="📝" label="Card"></wb-view>
 *
 * Template Definition:
 *   <template wb-view="card-tile">
 *     <div class="tile">
 *       <span>{{icon}}</span>
 *       <span>{{label}}</span>
 *     </div>
 *   </template>
 *
 * @version 1.5.0
 */
// =============================================================================
// VIEW REGISTRY
// =============================================================================
/** @type {Map<string, string>} View name → template HTML */
const viewRegistry = new Map();
/** @type {Map<string, Object>} View name → schema/meta */
const viewMeta = new Map();
/** @type {WeakMap<HTMLElement, Function>} Track processed elements and their cleanup */
const processedElements = new WeakMap();
/** @type {boolean} Has init been called? */
let initialized = false;
// =============================================================================
// TEMPLATE LOADING
// =============================================================================
/**
 * Register a view template
 * @param {string} name - View name (kebab-case)
 * @param {string} html - Template HTML with {{placeholders}}
 * @param {Object} meta - Optional metadata (attributes, description)
 */
export function registerView(name, html, meta = {}) {
    viewRegistry.set(name, html.trim());
    viewMeta.set(name, meta);
    console.log(`[WB Views] ✓ Registered: "${name}" (${html.length} chars)`);
}
/**
 * Load view templates from DOM <template wb-view="name"> elements
 * @param {HTMLElement} root - Root to search for templates
 */
export function loadViewsFromDOM(root = document) {
    const templates = root.querySelectorAll('template[wb-view]');
    console.log(`[WB Views] Scanning for templates... found ${templates.length}`);
    templates.forEach(template => {
        const name = template.getAttribute('wb-view');
        const html = template.innerHTML;
        if (!name) {
            console.warn('[WB Views] Template missing wb-view attribute value');
            return;
        }
        if (!html.trim()) {
            console.warn(`[WB Views] Template "${name}" is empty`);
            return;
        }
        // Extract meta from data attributes
        const meta = {
            description: template.dataset.description || '',
            attributes: template.dataset.attributes?.split(',').map(a => a.trim()) || []
        };
        registerView(name, html, meta);
        // Auto-register as custom element tag
        registerViewAsElement(name);
    });
}
/**
 * Register a view as a custom element tag
 * - Hyphenated names: use directly (nav-link → <nav-link>)
 * - Single words: prefix with wb- (btn → <wb-btn>)
 * @param {string} name - View name
 */
function registerViewAsElement(name) {
    // Determine tag name
    const tagName = name.includes('-') ? name : `wb-${name}`;
    // Skip if already defined
    if (customElements.get(tagName)) {
        return;
    }
    // Create custom element class
    class WBViewElement extends HTMLElement {
        connectedCallback() {
            // Process on next tick to ensure DOM is ready
            setTimeout(() => {
                if (!processedElements.has(this)) {
                    processWbViewElement(this, name);
                }
            }, 0);
        }
    }
    // Register the custom element
    customElements.define(tagName, WBViewElement);
    console.log(`[WB Views] ✓ Registered tag: <${tagName}>`);
}
/**
 * Process a custom element (not <wb-view>)
 */
function processWbViewElement(element, viewName) {
    if (processedElements.has(element)) {
        return processedElements.get(element);
    }
    const data = getViewData(element, viewName);
    const body = element.innerHTML.trim();
    const src = element.getAttribute('src');
    const use = element.getAttribute('use');
    const refreshInterval = parseInt(element.getAttribute('refresh')) || 0;
    let cleanup = null;
    let intervalId = null;
    async function render() {
        if (cleanup)
            cleanup();
        let renderData = data;
        // Handle 'use' attribute
        if (use) {
            let refData;
            // Reference by #id
            if (use.startsWith('#')) {
                const sourceEl = document.getElementById(use.slice(1));
                if (!sourceEl) {
                    console.error(`[WB Views] use="${use}" - element not found`);
                    element.innerHTML = `<span style="color:red;font-size:11px;">use: ${use} not found</span>`;
                    return;
                }
                refData = getViewData(sourceEl, getViewName(sourceEl) || viewName);
                renderData = { ...refData, ...data };
                cleanup = renderView(viewName, renderData, element, body);
                return;
            }
            // Reference by window path
            refData = getNestedValue(window, use);
            if (refData === undefined) {
                console.error(`[WB Views] use="${use}" - path not found on window`);
                element.innerHTML = `<span style="color:red;font-size:11px;">use: ${use} not found</span>`;
                return;
            }
            // Array → render multiple views
            if (Array.isArray(refData)) {
                element.innerHTML = '';
                const fragment = document.createDocumentFragment();
                refData.forEach(item => {
                    const wrapper = document.createElement('div');
                    wrapper.style.display = 'contents';
                    renderView(viewName, { ...data, ...item }, wrapper, body);
                    fragment.appendChild(wrapper);
                });
                element.appendChild(fragment);
                cleanup = () => {
                    element.querySelectorAll('*').forEach(el => window.WB?.remove?.(el));
                    element.innerHTML = '';
                };
                return;
            }
            // Object → spread as props
            if (typeof refData === 'object' && refData !== null) {
                renderData = { ...data, ...refData };
            }
        }
        // Handle 'src' attribute
        if (src) {
            try {
                const response = await fetch(src);
                const fetchedData = await response.json();
                if (Array.isArray(fetchedData)) {
                    element.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    fetchedData.forEach(item => {
                        const wrapper = document.createElement('div');
                        wrapper.style.display = 'contents';
                        renderView(viewName, { ...data, ...item }, wrapper, body);
                        fragment.appendChild(wrapper);
                    });
                    element.appendChild(fragment);
                    cleanup = () => {
                        element.querySelectorAll('*').forEach(el => window.WB?.remove?.(el));
                        element.innerHTML = '';
                    };
                    return;
                }
                renderData = { ...data, ...fetchedData };
            }
            catch (error) {
                console.error(`[WB Views] Fetch failed: ${src}`, error);
                element.innerHTML = `<span style="color:red;font-size:11px;">Load failed: ${src}</span>`;
                return;
            }
        }
        cleanup = renderView(viewName, renderData, element, body);
    }
    // Initial render
    render();
    // Set up refresh
    if (refreshInterval > 0 && src) {
        intervalId = setInterval(render, refreshInterval);
    }
    // Store cleanup
    const fullCleanup = () => {
        if (intervalId)
            clearInterval(intervalId);
        if (cleanup)
            cleanup();
    };
    processedElements.set(element, fullCleanup);
    return fullCleanup;
}
/**
 * Load views from external JSON registry
 * @param {string|string[]} urls - URL(s) to views registry JSON
 */
export async function loadViewsFromURL(urls) {
    const urlList = Array.isArray(urls) ? urls : [urls];
    for (const url of urlList) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const views = data.views || data.parts || data; // Support legacy 'parts' key
            for (const [name, config] of Object.entries(views)) {
                if (typeof config === 'string') {
                    registerView(name, config);
                }
                else if (config.url) {
                    // Fetch template from URL
                    try {
                        const tplRes = await fetch(config.url);
                        if (tplRes.ok) {
                            const html = await tplRes.text();
                            registerView(name, html, config);
                        }
                        else {
                            console.warn(`[WB Views] Failed to fetch template for "${name}" from ${config.url}`);
                        }
                    }
                    catch (e) {
                        console.warn(`[WB Views] Error fetching template for "${name}":`, e);
                    }
                }
                else {
                    registerView(name, config.template, config);
                }
                // Auto-register as custom element tag
                registerViewAsElement(name);
            }
            console.log(`[WB Views] Loaded views from ${url}`);
        }
        catch (error) {
            console.error(`[WB Views] Failed to load views from ${url}:`, error);
        }
    }
}
// =============================================================================
// TEMPLATE INTERPOLATION
// =============================================================================
/**
 * Interpolate template with data
 * @param {string} template - Template HTML
 * @param {Object} data - Data to interpolate
 * @returns {string} Rendered HTML
 */
function interpolate(template, data) {
    return template.replace(/\{\{(.+?)\}\}/g, (match, expr) => {
        expr = expr.trim();
        // Handle default value: {{prop || default}}
        if (expr.includes('||')) {
            const [prop, defaultVal] = expr.split('||').map(s => s.trim());
            const value = getNestedValue(data, prop);
            if (value !== undefined && value !== null && value !== '') {
                return escapeHtml(String(value));
            }
            return defaultVal.replace(/^['"]|['"]$/g, '');
        }
        // Handle ternary: {{condition ? 'yes' : 'no'}}
        if (expr.includes('?') && expr.includes(':')) {
            const ternaryMatch = expr.match(/(.+?)\s*\?\s*['"]?(.+?)['"]?\s*:\s*['"]?(.+?)['"]?$/);
            if (ternaryMatch) {
                const [, condition, trueVal, falseVal] = ternaryMatch;
                const conditionValue = getNestedValue(data, condition.trim());
                return conditionValue ? trueVal : falseVal;
            }
        }
        // Handle nested: {{prop.nested}}
        const value = getNestedValue(data, expr);
        if (value !== undefined && value !== null) {
            if (typeof value === 'string' && value.includes('<')) {
                return value; // Don't escape HTML
            }
            return escapeHtml(String(value));
        }
        return ''; // Missing values render as empty
    });
}
/**
 * Get nested object value by dot path
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((o, key) => o?.[key], obj);
}
/**
 * Escape HTML entities
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
// =============================================================================
// CONDITIONAL RENDERING
// =============================================================================
/**
 * Process conditional attributes: wb-if, wb-unless
 * Supports simple property checks: wb-if="prop"
 * Supports equality checks: wb-if="prop == 'value'"
 */
function processConditionals(element, data) {
    // Helper to evaluate condition
    const evaluate = (condition) => {
        // Check for equality: prop == 'value'
        const eqMatch = condition.match(/([\w\.]+)\s*==\s*['"]?([^'"]+)['"]?/);
        if (eqMatch) {
            const [, prop, val] = eqMatch;
            const dataVal = getNestedValue(data, prop);
            return String(dataVal) === val;
        }
        // Check for inequality: prop != 'value'
        const neqMatch = condition.match(/([\w\.]+)\s*!=\s*['"]?([^'"]+)['"]?/);
        if (neqMatch) {
            const [, prop, val] = neqMatch;
            const dataVal = getNestedValue(data, prop);
            return String(dataVal) !== val;
        }
        // Default: check truthiness of property
        return !!getNestedValue(data, condition);
    };
    // wb-if: show if truthy
    element.querySelectorAll('[wb-if]').forEach(el => {
        const condition = el.getAttribute('wb-if');
        if (!evaluate(condition)) {
            el.remove();
        }
        else {
            el.removeAttribute('wb-if');
        }
    });
    // wb-unless: show if falsy
    element.querySelectorAll('[wb-unless]').forEach(el => {
        const condition = el.getAttribute('wb-unless');
        if (evaluate(condition)) {
            el.remove();
        }
        else {
            el.removeAttribute('wb-unless');
        }
    });
}
// =============================================================================
// LOOP RENDERING
// =============================================================================
/**
 * Process loop attributes: wb-for="item in items"
 */
function processLoops(element, data) {
    element.querySelectorAll('[wb-for]').forEach(el => {
        const expr = el.getAttribute('wb-for');
        const match = expr.match(/(\w+)\s+in\s+(\w+(?:\.\w+)*)/);
        if (!match) {
            console.warn(`[WB Views] Invalid wb-for: ${expr}`);
            return;
        }
        const [, itemName, collectionPath] = match;
        const collection = getNestedValue(data, collectionPath);
        if (!Array.isArray(collection)) {
            el.remove();
            return;
        }
        // Use clone to safely get template without wb-for attribute
        const clone = el.cloneNode(true);
        clone.removeAttribute('wb-for');
        const template = clone.outerHTML;
        const fragment = document.createDocumentFragment();
        collection.forEach((item, index) => {
            const itemData = {
                ...data,
                [itemName]: item,
                [`${itemName}Index`]: index,
                [`${itemName}First`]: index === 0,
                [`${itemName}Last`]: index === collection.length - 1
            };
            const itemHtml = interpolate(template, itemData);
            const temp = document.createElement('div');
            temp.innerHTML = itemHtml;
            while (temp.firstChild) {
                fragment.appendChild(temp.firstChild);
            }
        });
        el.replaceWith(fragment);
    });
}
// =============================================================================
// VIEW RENDERING
// =============================================================================
/**
 * Render a view into an element
 */
export function renderView(viewName, data, target, body = '') {
    const template = viewRegistry.get(viewName);
    if (!template) {
        const available = [...viewRegistry.keys()].join(', ') || '(none)';
        console.error(`[WB Views] Unknown view: "${viewName}". Available: ${available}`);
        target.innerHTML = `<span style="color:red;font-size:11px;background:#300;padding:2px 6px;border-radius:3px;">Unknown view: ${viewName}</span>`;
        return () => { };
    }
    // Add body to data
    const fullData = { ...data, body };
    // Create temporary container to process conditionals and loops
    const temp = document.createElement('div');
    temp.innerHTML = template;
    processConditionals(temp, fullData);
    processLoops(temp, fullData);
    // Process Slots (Emulation)
    // 1. Named Slots: <slot name="foo"> -> content with slot="foo"
    const slots = temp.querySelectorAll('slot');
    if (slots.length > 0) {
        const bodyContainer = document.createElement('div');
        bodyContainer.innerHTML = body;
        slots.forEach(slot => {
            const slotName = slot.getAttribute('name');
            if (slotName) {
                // Find matching content: [slot="name"]
                const filler = bodyContainer.querySelectorAll(`[slot="${slotName}"]`);
                if (filler.length > 0) {
                    const frag = document.createDocumentFragment();
                    filler.forEach(el => frag.appendChild(el));
                    slot.replaceWith(frag);
                }
                else {
                    // Keep default content (children of slot)
                    const frag = document.createDocumentFragment();
                    while (slot.firstChild)
                        frag.appendChild(slot.firstChild);
                    slot.replaceWith(frag);
                }
            }
            else {
                // Default Slot: Everything else not marked with slot=""
                // Remove named slots from the body container first so we don't duplicate
                bodyContainer.querySelectorAll('[slot]').forEach(el => el.remove());
                if (bodyContainer.childNodes.length > 0) {
                    const frag = document.createDocumentFragment();
                    while (bodyContainer.firstChild)
                        frag.appendChild(bodyContainer.firstChild);
                    slot.replaceWith(frag);
                }
                else {
                    // Keep default content
                    const frag = document.createDocumentFragment();
                    while (slot.firstChild)
                        frag.appendChild(slot.firstChild);
                    slot.replaceWith(frag);
                }
            }
        });
    }
    // Interpolate remaining placeholders
    let html = interpolate(temp.innerHTML, fullData);
    // Insert into target
    target.innerHTML = html;
    // Apply WB behaviors to rendered content
    if (window.WB?.scan) {
        window.WB.scan(target);
    }
    // Return cleanup function
    return () => {
        if (window.WB?.remove) {
            target.querySelectorAll('*').forEach(el => window.WB.remove(el));
        }
        target.innerHTML = '';
    };
}
// =============================================================================
// WB-VIEW ELEMENT PROCESSING
// =============================================================================
/**
 * Get view name from element
 * Looks for first attribute that matches a registered view name,
 * or first boolean attribute (empty value)
 */
function getViewName(element) {
    // 0. Explicit 'view' attribute (Standard usage)
    if (element.hasAttribute('view')) {
        return element.getAttribute('view');
    }
    const attrs = Array.from(element.attributes);
    // First, check if any attribute name matches a registered view
    for (const attr of attrs) {
        if (viewRegistry.has(attr.name)) {
            return attr.name;
        }
    }
    // Fallback: first boolean attribute (empty value or same as name)
    for (const attr of attrs) {
        const name = attr.name;
        const value = attr.value;
        // Skip special attributes
        if (name === 'src' || name === 'refresh' || name === 'class' || name === 'style' || name === 'id') {
            continue;
        }
        // Boolean attribute: no value, or value equals name
        if (value === '' || value === name) {
            return name;
        }
    }
    return null;
}
/**
 * Get all data attributes from element
 */
function getViewData(element, viewName) {
    const data = {};
    for (const attr of element.attributes) {
        const name = attr.name;
        // Skip the view name and special attributes
        if (name === viewName || name === 'src' || name === 'refresh' || name === 'use' || name === 'class' || name === 'style' || name === 'id') {
            continue;
        }
        // Convert kebab-case to camelCase
        const key = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        let value = attr.value;
        // Boolean (no value or value equals name)
        if (value === '' || value === name) {
            value = true;
        }
        // JSON
        else if (value.startsWith('{') || value.startsWith('[')) {
            try {
                value = JSON.parse(value);
            }
            catch (e) {
                // Keep as string
            }
        }
        // Number
        else if (/^-?\d+\.?\d*$/.test(value)) {
            value = parseFloat(value);
        }
        data[key] = value;
    }
    return data;
}
/**
 * Process a single <wb-view> element
 */
function processWbView(element) {
    // Skip if already processed
    if (processedElements.has(element)) {
        return processedElements.get(element);
    }
    const viewName = getViewName(element);
    console.log(`[WB Views] Processing <wb-view>:`, {
        viewName,
        attributes: Array.from(element.attributes).map(a => `${a.name}="${a.value}"`).join(' ')
    });
    if (!viewName) {
        console.error('[WB Views] No view name found. Attributes:', Array.from(element.attributes).map(a => a.name));
        element.innerHTML = '<span style="color:orange;font-size:11px;background:#330;padding:2px 6px;border-radius:3px;">No view name</span>';
        const cleanup = () => { };
        processedElements.set(element, cleanup);
        return cleanup;
    }
    const data = getViewData(element, viewName);
    const body = element.innerHTML.trim();
    const src = element.getAttribute('src');
    const use = element.getAttribute('use');
    const refreshInterval = parseInt(element.getAttribute('refresh')) || 0;
    let cleanup = null;
    let intervalId = null;
    async function render() {
        if (cleanup)
            cleanup();
        let renderData = data;
        // Handle 'use' attribute - reference global/window object OR element by #id
        if (use) {
            let refData;
            let refViewName = viewName;
            // Reference by #id
            if (use.startsWith('#')) {
                const sourceEl = document.getElementById(use.slice(1));
                if (!sourceEl) {
                    console.error(`[WB Views] use="${use}" - element not found`);
                    element.innerHTML = `<span style="color:red;font-size:11px;">use: ${use} not found</span>`;
                    return;
                }
                // Get view name and data from source element
                refViewName = getViewName(sourceEl) || viewName;
                refData = getViewData(sourceEl, refViewName);
                // Merge: source data + local overrides (local wins)
                renderData = { ...refData, ...data };
                // Render with merged data
                cleanup = renderView(refViewName, renderData, element, body);
                return;
            }
            // Reference by window path
            refData = getNestedValue(window, use);
            if (refData === undefined) {
                console.error(`[WB Views] use="${use}" - path not found on window`);
                element.innerHTML = `<span style="color:red;font-size:11px;">use: ${use} not found</span>`;
                return;
            }
            // Array → render multiple views
            if (Array.isArray(refData)) {
                element.innerHTML = '';
                const fragment = document.createDocumentFragment();
                refData.forEach(item => {
                    const wrapper = document.createElement('div');
                    wrapper.style.display = 'contents';
                    renderView(viewName, { ...data, ...item }, wrapper, body);
                    fragment.appendChild(wrapper);
                });
                element.appendChild(fragment);
                cleanup = () => {
                    element.querySelectorAll('*').forEach(el => window.WB?.remove?.(el));
                    element.innerHTML = '';
                };
                return;
            }
            // Object → spread as props
            if (typeof refData === 'object' && refData !== null) {
                renderData = { ...data, ...refData };
            }
        }
        // Handle 'src' attribute - fetch from URL
        if (src) {
            try {
                const response = await fetch(src);
                const fetchedData = await response.json();
                if (Array.isArray(fetchedData)) {
                    element.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    fetchedData.forEach(item => {
                        const wrapper = document.createElement('div');
                        wrapper.style.display = 'contents';
                        renderView(viewName, { ...data, ...item }, wrapper, body);
                        fragment.appendChild(wrapper);
                    });
                    element.appendChild(fragment);
                    cleanup = () => {
                        element.querySelectorAll('*').forEach(el => window.WB?.remove?.(el));
                        element.innerHTML = '';
                    };
                    return;
                }
                renderData = { ...data, ...fetchedData };
            }
            catch (error) {
                console.error(`[WB Views] Fetch failed: ${src}`, error);
                element.innerHTML = `<span style="color:red;font-size:11px;">Load failed: ${src}</span>`;
                return;
            }
        }
        cleanup = renderView(viewName, renderData, element, body);
    }
    // Initial render
    render();
    // Set up refresh
    if (refreshInterval > 0 && src) {
        intervalId = setInterval(render, refreshInterval);
    }
    // Store cleanup
    const fullCleanup = () => {
        if (intervalId)
            clearInterval(intervalId);
        if (cleanup)
            cleanup();
    };
    processedElements.set(element, fullCleanup);
    return fullCleanup;
}
// =============================================================================
// DOM SCANNING
// =============================================================================
/**
 * Scan DOM for <wb-view> elements and process them
 */
export function scanViews(root = document.body) {
    const elements = root.querySelectorAll('wb-view');
    console.log(`[WB Views] Scanning for <wb-view> elements... found ${elements.length}`);
    elements.forEach((el, i) => {
        console.log(`[WB Views] Processing element ${i + 1}/${elements.length}`);
        processWbView(el);
    });
}
// =============================================================================
// MUTATION OBSERVER
// =============================================================================
let observer = null;
function startObserver() {
    if (observer)
        return;
    observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'WB-VIEW') {
                        processWbView(node);
                    }
                    node.querySelectorAll?.('wb-view').forEach(el => processWbView(el));
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[WB Views] MutationObserver started');
}
// =============================================================================
// INITIALIZATION
// =============================================================================
/**
 * Initialize WB Views system
 */
export async function initViews(options = {}) {
    if (initialized) {
        console.log('[WB Views] Already initialized, rescanning...');
        scanViews(document.body);
        return;
    }
    console.log('[WB Views] ═══════════════════════════════════');
    console.log('[WB Views] Initializing WB Views System v1.5.0');
    console.log('[WB Views] ═══════════════════════════════════');
    // Load views from DOM templates
    loadViewsFromDOM(document);
    // Load views from registry URL if specified
    if (options.registry) {
        await loadViewsFromURL(options.registry);
    }
    console.log(`[WB Views] Registry contains ${viewRegistry.size} views:`, [...viewRegistry.keys()]);
    // Scan for existing <wb-view> elements
    scanViews(document.body);
    // Watch for new <wb-view> elements
    startObserver();
    initialized = true;
    console.log('[WB Views] ═══════════════════════════════════');
    console.log('[WB Views] Ready!');
    console.log('[WB Views] ═══════════════════════════════════');
}
// =============================================================================
// GLOBAL EXPORT
// =============================================================================
if (typeof window !== 'undefined') {
    window.WB = window.WB || {};
    window.WB.views = {
        registerView,
        loadViewsFromDOM,
        loadViewsFromURL,
        renderView,
        scanViews,
        initViews,
        registry: viewRegistry,
        meta: viewMeta
    };
}
// =============================================================================
// EXPORTS
// =============================================================================
export default {
    registerView,
    loadViewsFromDOM,
    loadViewsFromURL,
    renderView,
    scanViews,
    initViews,
    registry: viewRegistry,
    meta: viewMeta
};
//# sourceMappingURL=wb-views.js.map