/**
 * Register a view template
 * @param {string} name - View name (kebab-case)
 * @param {string} html - Template HTML with {{placeholders}}
 * @param {Object} meta - Optional metadata (attributes, description)
 */
export function registerView(name: string, html: string, meta?: any): void;
/**
 * Load view templates from DOM <template wb-view="name"> elements
 * @param {HTMLElement} root - Root to search for templates
 */
export function loadViewsFromDOM(root?: HTMLElement): void;
/**
 * Load views from external JSON registry
 * @param {string|string[]} urls - URL(s) to views registry JSON
 */
export function loadViewsFromURL(urls: string | string[]): Promise<void>;
/**
 * Render a view into an element
 */
export function renderView(viewName: any, data: any, target: any, body?: string): () => void;
/**
 * Scan DOM for <wb-view> elements and process them
 */
export function scanViews(root?: HTMLElement): void;
/**
 * Initialize WB Views system
 */
export function initViews(options?: {}): Promise<void>;
declare namespace _default {
    export { registerView };
    export { loadViewsFromDOM };
    export { loadViewsFromURL };
    export { renderView };
    export { scanViews };
    export { initViews };
    export { viewRegistry as registry };
    export { viewMeta as meta };
}
export default _default;
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
/** @type {Map<string, string>} View name → template HTML */
declare const viewRegistry: Map<string, string>;
/** @type {Map<string, Object>} View name → schema/meta */
declare const viewMeta: Map<string, any>;
//# sourceMappingURL=wb-views.d.ts.map