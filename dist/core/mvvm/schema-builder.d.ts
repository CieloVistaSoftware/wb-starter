/**
 * Load all schemas from wb-models directory
 * @param {string} basePath - Path to wb-models folder
 */
export function loadSchemas(basePath?: string): Promise<void>;
/**
 * Register a single schema
 */
export function registerSchema(schema: any, filename: any): void;
/**
 * Get schema by name or tag
 */
export function getSchema(identifier: any): any;
/**
 * Bind $methods from schema to element
 * @param {HTMLElement} element - Target element
 * @param {Object} schema - Component schema
 * @param {Object} viewModel - ViewModel instance with method implementations
 */
export function bindMethods(element: HTMLElement, schema: any, viewModel: any): void;
/**
 * Get method definitions from schema
 * @param {string} schemaName - Name of schema
 * @returns {Object} Method definitions
 */
export function getMethods(schemaName: string): any;
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
export function processElement(element: HTMLElement, schemaName?: string): any;
/**
 * Scan DOM for elements to process
 */
export function scan(root?: HTMLElement): void;
export function startObserver(): void;
export function init(options?: {}): Promise<void>;
declare namespace _default {
    export { init };
    export { loadSchemas };
    export { registerSchema };
    export { getSchema };
    export { getMethods };
    export { bindMethods };
    export { processElement };
    export { scan };
    export { startObserver };
    export { schemaRegistry as registry };
}
export default _default;
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
/** @type {Map<string, Object>} Schema name → parsed schema */
declare const schemaRegistry: Map<string, any>;
//# sourceMappingURL=schema-builder.d.ts.map