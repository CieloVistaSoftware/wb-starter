/**
 * Load all component definitions from schemas
 * @returns {Promise<Object>} Categories with components
 */
export function loadComponentsFromSchemas(): Promise<any>;
/**
 * Generate schema manifest file
 * Run this server-side to create the manifest
 */
export function generateSchemaManifest(): Promise<{
    generated: string;
    count: any;
    schemas: any;
}>;
declare namespace _default {
    export { loadComponentsFromSchemas };
    export { generateSchemaManifest };
}
export default _default;
//# sourceMappingURL=builder-component-loader.d.ts.map