/**
 * Generate Custom Elements Manifest
 * ==================================
 * Creates a custom-elements.json file for VS Code Custom Elements Language Server
 * This enables "Go to Definition" and intellisense for WB Framework components.
 * 
 * Run: node scripts/generate-custom-elements.js
 * Output: data/custom-elements.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Custom element mappings (from wb-lazy.js)
const customElementMappings = [
  // Cards
  { selector: 'wb-card', behavior: 'card' },
  { selector: 'wb-cardimage', behavior: 'cardimage' },
  { selector: 'wb-cardvideo', behavior: 'cardvideo' },
  { selector: 'wb-cardprofile', behavior: 'cardprofile' },
  { selector: 'wb-cardpricing', behavior: 'cardpricing' },
  { selector: 'wb-cardproduct', behavior: 'cardproduct' },
  { selector: 'wb-cardstats', behavior: 'cardstats' },
  { selector: 'wb-cardtestimonial', behavior: 'cardtestimonial' },
  { selector: 'wb-cardhero', behavior: 'cardhero' },
  { selector: 'wb-cardfile', behavior: 'cardfile' },
  { selector: 'wb-cardnotification', behavior: 'cardnotification' },
  { selector: 'wb-cardportfolio', behavior: 'cardportfolio' },
  { selector: 'wb-cardlink', behavior: 'cardlink' },
  { selector: 'wb-cardhorizontal', behavior: 'cardhorizontal' },
  { selector: 'wb-cardoverlay', behavior: 'cardoverlay' },
  { selector: 'wb-cardbutton', behavior: 'cardbutton' },
  { selector: 'wb-cardexpandable', behavior: 'cardexpandable' },
  { selector: 'wb-cardminimizable', behavior: 'cardminimizable' },
  { selector: 'wb-carddraggable', behavior: 'carddraggable' },
  
  // Feedback Components
  { selector: 'wb-spinner', behavior: 'spinner' },
  { selector: 'wb-avatar', behavior: 'avatar' },
  { selector: 'wb-badge', behavior: 'badge' },
  { selector: 'wb-alert', behavior: 'alert' },
  { selector: 'wb-progress', behavior: 'progress' },
  { selector: 'wb-rating', behavior: 'rating' },
  { selector: 'wb-tabs', behavior: 'tabs' },
  { selector: 'wb-switch', behavior: 'switch' },
  
  // Layout
  { selector: 'wb-grid', behavior: 'grid' },
  { selector: 'wb-flex', behavior: 'flex' },
  { selector: 'wb-stack', behavior: 'stack' },
  { selector: 'wb-cluster', behavior: 'cluster' },
  { selector: 'wb-container', behavior: 'container' },
  { selector: 'wb-sidebar', behavior: 'sidebarlayout' },
  { selector: 'wb-center', behavior: 'center' },
  { selector: 'wb-cover', behavior: 'cover' },
  { selector: 'wb-masonry', behavior: 'masonry' },
  { selector: 'wb-switcher', behavior: 'switcher' },
  { selector: 'wb-reel', behavior: 'reel' },
  { selector: 'wb-frame', behavior: 'frame' },
  { selector: 'wb-sticky', behavior: 'sticky' },
  { selector: 'wb-drawer', behavior: 'drawerLayout' },
  
  // Other
  { selector: 'wb-icon', behavior: 'icon' },
  { selector: 'wb-span', behavior: 'span' },
  { selector: 'wb-control', behavior: 'control' },
  { selector: 'wb-repeater', behavior: 'repeater' },
  { selector: 'wb-mdhtml', behavior: 'mdhtml' },
  { selector: 'wb-codecontrol', behavior: 'codecontrol' },
  { selector: 'wb-collapse', behavior: 'collapse' },
  { selector: 'wb-darkmode', behavior: 'darkmode' },
  { selector: 'wb-dropdown', behavior: 'dropdown' },
  { selector: 'wb-footer', behavior: 'footer' },
  { selector: 'wb-header', behavior: 'header' },
  { selector: 'wb-globe', behavior: 'globe' },
  { selector: 'wb-stagelight', behavior: 'stagelight' }
];

// Read schema file and convert to CEM attributes
function schemaToAttributes(schema) {
  const attributes = [];
  
  if (schema.properties) {
    for (const [name, prop] of Object.entries(schema.properties)) {
      // Skip internal properties
      if (name.startsWith('_')) continue;
      
      const attr = {
        name: `data-${name.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
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
  }
  
  return attributes;
}

// Generate the manifest
async function generateManifest() {
  const schemaDir = path.join(rootDir, 'src/wb-models');
  const modules = [];
  
  // Build a map of behavior -> schema
  const schemaMap = new Map();
  
  // Read all schema files
  const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.schema.json'));
  
  for (const file of schemaFiles) {
    const behaviorName = file.replace('.schema.json', '');
    try {
      const schemaPath = path.join(schemaDir, file);
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
      schemaMap.set(behaviorName, schema);
    } catch (err) {
      console.warn(`⚠️ Could not read schema: ${file}`, err.message);
    }
  }
  
  // Generate declarations for each custom element
  for (const { selector, behavior } of customElementMappings) {
    // Only process wb-* elements
    if (!selector.startsWith('wb-')) continue;
    
    const schema = schemaMap.get(behavior);
    const attributes = schema ? schemaToAttributes(schema) : [];
    
    // Find the viewmodel path
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
    
    // Add to a module
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
  
  // Create the manifest
  const manifest = {
    schemaVersion: '1.0.0',
    readme: 'WB Framework Custom Elements',
    modules: modules
  };
  
  return manifest;
}

// Main
async function main() {
  console.log('📦 Generating Custom Elements Manifest...\n');
  
  const manifest = await generateManifest();
  
  // Write to data folder
  const outputPath = path.join(rootDir, 'data/custom-elements.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ Generated ${manifest.modules.length} component definitions`);
  console.log(`📄 Output: ${outputPath}`);
  console.log(`\n💡 Restart VS Code to enable "Go to Definition" for WB components`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
