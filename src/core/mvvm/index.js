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
 *     "baseClass": "wb-card",
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
 *   <wb-card title="Hello">Content</wb-card>
 *   <wb-card  heading="Hello">Content</article>
 */

export { 
  init, 
  loadSchemas, 
  registerSchema, 
  getSchema,
  getMethods,
  bindMethods,
  processElement, 
  scan,
  startObserver
} from './schema-builder.js';

import SchemaBuilder from './schema-builder.js';

export default SchemaBuilder;
