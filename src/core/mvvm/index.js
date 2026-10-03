/**
 * WB MVVM System
 * ==============
 * Model-View-ViewModel architecture for WB Behaviors.
 * 
 * - Models: JSON Schemas define data structure (wb-models/)
 * - Views: DOM structure built from schema $view (no separate templates!)
 * - ViewModels: Behaviors add interactivity + $methods binding
 * 
 * @version 3.0.0
 * 
 * v3.0 Schema Format:
 *   {
 *     "behavior": "card",
 *     "baseClass": "x-card",
 *     "properties": { ... },      // Model - data inputs
 *     "$view": [ ... ],           // View - DOM structure
 *     "$methods": { ... },        // ViewModel - callable functions
 *     "$cssAPI": { ... }          // Theme API - CSS custom properties
 *   }
 * 
 * Usage:
 *   // Automatic via WB.init()
 *   WB.init({ useSchemas: true });
 *   
 *   // Or standalone
 *   import SchemaBuilder from '/src/core/mvvm/index.js';
 *   await SchemaBuilder.init();
 *   
 *   // Then just write HTML:
 *   <article title="Hello">Content</article>
 *   <article  data-title="Hello">Content</article>
 */

// Re-export schema-builder.js whole. Its named exports are exactly the API
// (init, loadSchemas, loadSchemaFile, registerSchema, getSchema, getMethods,
// bindMethods, processElement, scan, startObserver); listing them again here
// repeated its default-export list word for word (#883).
export * from './schema-builder.js';
export { default } from './schema-builder.js';
