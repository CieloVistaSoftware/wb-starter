/**
 * Dynamic Component Loader for Builder
 * =====================================
 * Loads component definitions from schema files instead of hardcoding them.
 * Each schema with a "builder" section becomes a palette item.
 */
const SCHEMA_PATH = 'src/wb-models';
// Default component data to use when schema lacks complete builder info
const FALLBACK_DEFAULTS = {
    card: { title: 'Card Title', subtitle: 'Card subtitle', footer: 'Card footer' },
    alert: { type: 'info', title: 'Alert', message: 'Message' },
    badge: { text: 'Badge', variant: 'default' },
    input: { placeholder: 'Enter text...' },
    button: { text: 'Click me' }
};
/**
 * Load all component definitions from schemas
 * @returns {Promise<Object>} Categories with components
 */
export async function loadComponentsFromSchemas() {
    const categories = {};
    try {
        // Fetch the list of schema files
        const schemaIndex = await fetchSchemaIndex();
        for (const filename of schemaIndex) {
            // Skip base schemas and non-component schemas
            if (filename.includes('.base.') || filename.startsWith('_'))
                continue;
            try {
                const schema = await fetchSchema(filename);
                // Skip schemas without behavior (not components)
                if (!schema.behavior)
                    continue;
                // Skip schemas without builder section
                if (!schema.builder)
                    continue;
                const component = schemaToComponent(schema);
                // Add to category
                const category = schema.builder.category || 'Other';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(component);
            }
            catch (e) {
                console.warn(`Failed to load schema ${filename}:`, e);
            }
        }
    }
    catch (e) {
        console.error('Failed to load schemas:', e);
    }
    return categories;
}
/**
 * Fetch the index of schema files
 */
async function fetchSchemaIndex() {
    // Try to fetch from a manifest file first
    try {
        const response = await fetch('data/schema-manifest.json?caller=builder-component-loader');
        if (response.ok) {
            const manifest = await response.json();
            return manifest.schemas || [];
        }
    }
    catch (e) {
        // Fallback: try directory listing (won't work in browser without server)
    }
    // Fallback: use known schema list
    return getKnownSchemas();
}
/**
 * Fallback list of known schemas
 */
function getKnownSchemas() {
    return [
        'alert.schema.json',
        'audio.schema.json',
        'avatar.schema.json',
        'badge.schema.json',
        'card.schema.json',
        'cardbutton.schema.json',
        'carddraggable.schema.json',
        'cardexpandable.schema.json',
        'cardfile.schema.json',
        'cardhero.schema.json',
        'cardhorizontal.schema.json',
        'cardimage.schema.json',
        'cardlink.schema.json',
        'cardminimizable.schema.json',
        'cardnotification.schema.json',
        'cardoverlay.schema.json',
        'cardportfolio.schema.json',
        'cardpricing.schema.json',
        'cardproduct.schema.json',
        'cardprofile.schema.json',
        'cardstats.schema.json',
        'cardtestimonial.schema.json',
        'cardvideo.schema.json',
        'checkbox.schema.json',
        'chip.schema.json',
        'input.schema.json',
        'dialog.schema.json',
        'notes.schema.json',
        'progress.schema.json',
        'progressbar.schema.json',
        'rating.schema.json',
        'select.schema.json',
        'skeleton.schema.json',
        'spinner.schema.json',
        'switch.schema.json',
        'table.schema.json',
        'tabs.schema.json',
        'textarea.schema.json',
        'toast.schema.json',
        'tooltip.schema.json'
    ];
}
/**
 * Fetch a single schema file
 */
async function fetchSchema(filename) {
    const response = await fetch(`${SCHEMA_PATH}/${filename}?caller=builder-component-loader`);
    if (!response.ok)
        throw new Error(`HTTP ${response.status}`);
    return response.json();
}
/**
 * Convert schema to component palette item
 */
function schemaToComponent(schema) {
    const builder = schema.builder || {};
    const behavior = schema.behavior;
    // Build defaults from schema properties
    const defaults = {};
    if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
            // Skip meta properties
            if (key.startsWith('$'))
                continue;
            // Use default from schema or builder.defaults
            if (builder.defaults && builder.defaults[key] !== undefined) {
                defaults[key] = builder.defaults[key];
            }
            else if (prop.default !== undefined) {
                defaults[key] = prop.default;
            }
        }
    }
    // Merge with builder-specific defaults
    if (builder.defaults) {
        Object.assign(defaults, builder.defaults);
    }
    const component = {
        n: builder.name || schema.title || behavior,
        i: builder.icon || '📦',
        b: behavior,
        d: defaults
    };
    // Add tag if specified
    if (builder.tag) {
        component.t = builder.tag;
    }
    // Add container info
    if (builder.container || schema.compliance?.containerTag) {
        component.container = true;
    }
    // Add child template for container components
    if (builder.childTemplate) {
        component.childTemplate = builder.childTemplate;
    }
    // Add default children
    if (builder.children) {
        component.children = builder.children;
    }
    return component;
}
/**
 * Generate schema manifest file
 * Run this server-side to create the manifest
 */
export async function generateSchemaManifest() {
    // This would be run by a Node.js script to scan the schema directory
    // and create data/schema-manifest.json
    const fs = await import('fs');
    const path = await import('path');
    const schemaDir = path.join(process.cwd(), SCHEMA_PATH);
    const files = fs.readdirSync(schemaDir)
        .filter(f => f.endsWith('.schema.json') && !f.includes('.base.'));
    const manifest = {
        generated: new Date().toISOString(),
        count: files.length,
        schemas: files
    };
    fs.writeFileSync(path.join(process.cwd(), 'data/schema-manifest.json'), JSON.stringify(manifest, null, 2));
    return manifest;
}
// Export for use in builder
export default {
    loadComponentsFromSchemas,
    generateSchemaManifest
};
//# sourceMappingURL=builder-component-loader.js.map