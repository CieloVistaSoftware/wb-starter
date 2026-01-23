/**
 * Generate Custom Elements Manifest (DYNAMIC)
 * ============================================
 * Creates a custom-elements.json file for VS Code Custom Elements Language Server.
 * 
 * FULLY DYNAMIC - No hardcoded mappings:
 * - Parses wb-lazy.js to extract customElementMappings
 * - Auto-discovers schemas from src/wb-models/
 * 
 * Run: node scripts/generate-custom-elements.js
 * Output: data/custom-elements.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/**
 * Parse wb-lazy.js to extract customElementMappings array
 * @returns {Array<{selector: string, behavior: string}>}
 */
function extractMappingsFromWbLazy() {
  const wbLazyPath = path.join(rootDir, 'src/core/wb-lazy.js');
  const content = fs.readFileSync(wbLazyPath, 'utf-8');
  
  // Extract customElementMappings array using regex
  // Matches: { selector: 'xxx', behavior: 'yyy' }
  const mappings = [];
  const regex = /\{\s*selector:\s*['"]([^'"]+)['"]\s*,\s*behavior:\s*['"]([^'"]+)['"]\s*\}/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    mappings.push({
      selector: match[1],
      behavior: match[2]
    });
  }
  
  console.log(`📖 Extracted ${mappings.length} mappings from wb-lazy.js`);
  return mappings;
}

/**
 * Auto-discover all schema files
 * @returns {Map<string, Object>} Map of behavior name -> schema
 */
function discoverSchemas() {
  const schemaDir = path.join(rootDir, 'src/wb-models');
  const schemaMap = new Map();
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip _base directory (contains base schemas, not components)
        if (entry.name !== '_base') {
          scanDir(fullPath);
        }
      } else if (entry.name.endsWith('.schema.json')) {
        const behaviorName = entry.name.replace('.schema.json', '');
        try {
          const schema = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          schemaMap.set(behaviorName, schema);
        } catch (err) {
          console.warn(`⚠️ Could not parse: ${entry.name} - ${err.message}`);
        }
      }
    }
  }
  
  scanDir(schemaDir);
  console.log(`📂 Discovered ${schemaMap.size} schemas`);
  return schemaMap;
}

/**
 * Convert schema properties to CEM attributes
 * @param {Object} schema 
 * @returns {Array}
 */
function schemaToAttributes(schema) {
  const attributes = [];
  
  if (!schema.properties) return attributes;
  
  for (const [name, prop] of Object.entries(schema.properties)) {
    // Skip internal properties
    if (name.startsWith('_')) continue;
    
    // Convert camelCase to kebab-case for data attributes
    const attrName = `data-${name.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    
    const attr = {
      name: attrName,
      description: prop.description || `${name} property`,
      type: { text: prop.type || 'string' }
    };
    
    // Add default value if present
    if (prop.default !== undefined) {
      attr.default = String(prop.default);
    }
    
    // Add enum values if present
    if (prop.enum) {
      attr.type.text = prop.enum.join(' | ');
    }
    
    attributes.push(attr);
  }
  
  return attributes;
}

/**
 * Generate the Custom Elements Manifest
 */
function generateManifest() {
  // 1. Extract mappings from wb-lazy.js (source of truth)
  const allMappings = extractMappingsFromWbLazy();
  
  // 2. Discover all schemas
  const schemaMap = discoverSchemas();
  
  // 3. Filter to only wb-* custom elements (not [x-*] attributes or card-* aliases)
  const customElements = allMappings.filter(m => 
    m.selector.startsWith('wb-') && 
    !m.selector.includes('[')
  );
  
  // Deduplicate by selector (keep first occurrence)
  const seen = new Set();
  const uniqueElements = customElements.filter(m => {
    if (seen.has(m.selector)) return false;
    seen.add(m.selector);
    return true;
  });
  
  console.log(`🏷️ Found ${uniqueElements.length} unique wb-* custom elements`);
  
  // 4. Generate CEM modules
  const modules = [];
  
  for (const { selector, behavior } of uniqueElements) {
    const schema = schemaMap.get(behavior);
    const attributes = schema ? schemaToAttributes(schema) : [];
    
    const vmPath = `src/wb-viewmodels/${behavior}.js`;
    
    const declaration = {
      kind: 'custom-element-definition',
      name: selector,
      tagName: selector,
      customElement: true,
      description: schema?.description || `WB Framework ${behavior} component`,
      attributes: attributes,
      slots: [
        {
          name: '',
          description: 'Default slot for content'
        }
      ],
      members: [],
      events: [],
      cssProperties: [],
      cssParts: []
    };
    
    modules.push({
      kind: 'javascript-module',
      path: vmPath,
      declarations: [declaration],
      exports: [
        {
          kind: 'custom-element-definition',
          name: selector,
          declaration: {
            name: selector,
            module: vmPath
          }
        }
      ]
    });
  }
  
  // 5. Create manifest
  const manifest = {
    schemaVersion: '1.0.0',
    readme: 'WB Framework Custom Elements - Auto-generated from wb-lazy.js and schemas',
    modules: modules
  };
  
  return manifest;
}

/**
 * Main
 */
function main() {
  console.log('📦 Generating Custom Elements Manifest (DYNAMIC)...\n');
  
  const manifest = generateManifest();
  
  // Write to data folder
  const outputPath = path.join(rootDir, 'data/custom-elements.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  
  console.log(`\n✅ Generated ${manifest.modules.length} component definitions`);
  console.log(`📄 Output: ${outputPath} (${sizeKB} KB)`);
  console.log(`\n💡 Restart VS Code to enable intellisense for WB components`);
}

main();
