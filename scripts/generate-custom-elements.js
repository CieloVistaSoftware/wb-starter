/**
 * Generate Custom Elements Manifest
 * ==================================
 * Creates a custom-elements.json file for VS Code Custom Elements Language Server
 * This enables "Go to Definition" and intellisense for wb-starter components.
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
  { selector: 'x-card', behavior: 'card' },
  { selector: 'x-cardimage', behavior: 'cardimage' },
  { selector: 'x-cardvideo', behavior: 'cardvideo' },
  { selector: 'x-cardprofile', behavior: 'cardprofile' },
  { selector: 'x-cardpricing', behavior: 'cardpricing' },
  { selector: 'x-cardproduct', behavior: 'cardproduct' },
  { selector: 'x-cardstats', behavior: 'cardstats' },
  { selector: 'x-cardtestimonial', behavior: 'cardtestimonial' },
  { selector: 'x-cardhero', behavior: 'cardhero' },
  { selector: 'x-cardfile', behavior: 'cardfile' },
  { selector: 'x-cardnotification', behavior: 'cardnotification' },
  { selector: 'x-cardportfolio', behavior: 'cardportfolio' },
  { selector: 'x-cardlink', behavior: 'cardlink' },
  { selector: 'x-cardhorizontal', behavior: 'cardhorizontal' },
  { selector: 'x-cardoverlay', behavior: 'cardoverlay' },
  { selector: 'x-cardbutton', behavior: 'cardbutton' },
  { selector: 'x-cardexpandable', behavior: 'cardexpandable' },
  { selector: 'x-cardminimizable', behavior: 'cardminimizable' },
  { selector: 'x-carddraggable', behavior: 'carddraggable' },
  
  // Feedback Components
  { selector: 'x-spinner', behavior: 'spinner' },
  { selector: 'x-avatar', behavior: 'avatar' },
  { selector: 'x-badge', behavior: 'badge' },
  { selector: 'x-alert', behavior: 'alert' },
  { selector: 'x-progress', behavior: 'progress' },
  { selector: 'x-rating', behavior: 'rating' },
  { selector: 'x-tabs', behavior: 'tabs' },
  { selector: 'x-switch', behavior: 'switch' },
  
  // Layout
  { selector: 'x-grid', behavior: 'grid' },
  { selector: 'x-flex', behavior: 'flex' },
  { selector: 'x-stack', behavior: 'stack' },
  { selector: 'x-cluster', behavior: 'cluster' },
  { selector: 'x-container', behavior: 'container' },
  { selector: 'x-sidebar', behavior: 'sidebarlayout' },
  { selector: 'x-center', behavior: 'center' },
  { selector: 'x-cover', behavior: 'cover' },
  { selector: 'x-masonry', behavior: 'masonry' },
  { selector: 'x-switcher', behavior: 'switcher' },
  { selector: 'x-reel', behavior: 'reel' },
  { selector: 'x-frame', behavior: 'frame' },
  { selector: 'x-sticky', behavior: 'sticky' },
  { selector: 'x-drawer', behavior: 'drawerLayout' },
  
  // Other
  { selector: 'x-icon', behavior: 'icon' },
  { selector: 'x-span', behavior: 'span' },
  { selector: 'x-control', behavior: 'control' },
  { selector: 'x-repeater', behavior: 'repeater' },
  { selector: 'x-mdhtml', behavior: 'mdhtml' },
  { selector: 'x-codecontrol', behavior: 'codecontrol' },
  { selector: 'x-collapse', behavior: 'collapse' },
  { selector: 'x-darkmode', behavior: 'darkmode' },
  { selector: 'x-dropdown', behavior: 'dropdown' },
  { selector: 'x-footer', behavior: 'footer' },
  { selector: 'x-header', behavior: 'header' },
  { selector: 'x-globe', behavior: 'globe' },
  { selector: 'x-stagelight', behavior: 'stagelight' }
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
      description: schema?.description || `wb-starter ${behavior} component`,
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
    readme: 'wb-starter Custom Elements',
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
