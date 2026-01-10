/**
 * Generate VS Code IntelliSense data for wb-part elements
 * 
 * Generates html-custom-data.json entries for:
 * - <wb-part> element with all part name attributes
 * - Part-specific attributes for each part
 * 
 * Usage:
 *   node scripts/generate-parts-intellisense.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// =============================================================================
// LOAD PARTS REGISTRY
// =============================================================================

function loadPartsRegistry() {
  const registryPath = join(ROOT, 'src/parts/parts-registry.json');
  
  if (!existsSync(registryPath)) {
    console.error('Parts registry not found:', registryPath);
    process.exit(1);
  }
  
  const content = readFileSync(registryPath, 'utf-8');
  return JSON.parse(content);
}

// =============================================================================
// GENERATE INTELLISENSE DATA
// =============================================================================

function generateIntelliSenseData(registry) {
  const parts = registry.parts;
  const partNames = Object.keys(parts);
  
  // Collect all unique attributes across all parts
  const allAttributes = new Map();
  
  // Add part names as boolean attributes
  partNames.forEach(name => {
    allAttributes.set(name, {
      name,
      description: `Use the "${name}" part template. ${parts[name].description || ''}`,
      valueSet: 'v' // Boolean attribute
    });
  });
  
  // Add src and refresh (common to all parts)
  allAttributes.set('src', {
    name: 'src',
    description: 'URL to fetch JSON data for the part'
  });
  
  allAttributes.set('refresh', {
    name: 'refresh',
    description: 'Auto-refresh interval in milliseconds (requires src)'
  });
  
  // Add all part-specific attributes
  partNames.forEach(partName => {
    const part = parts[partName];
    if (!part.attributes) return;
    
    Object.entries(part.attributes).forEach(([attrName, attrConfig]) => {
      // Convert camelCase to kebab-case for HTML
      const htmlAttrName = attrName.replace(/([A-Z])/g, '-$1').toLowerCase();
      
      // Skip if already added (from another part)
      if (allAttributes.has(htmlAttrName)) {
        // Merge description if different
        const existing = allAttributes.get(htmlAttrName);
        if (!existing.description.includes(partName)) {
          existing.description += ` | [${partName}]: ${attrConfig.description}`;
        }
        return;
      }
      
      const attr = {
        name: htmlAttrName,
        description: `[${partName}] ${attrConfig.description || ''}`
      };
      
      // Add enum values if present
      if (attrConfig.enum) {
        attr.values = attrConfig.enum.map(v => ({
          name: v,
          description: `${attrName}="${v}"`
        }));
      }
      
      // Add type hint to description
      if (attrConfig.type) {
        attr.description += ` (${attrConfig.type})`;
      }
      
      // Mark required
      if (attrConfig.required) {
        attr.description += ' [required]';
      }
      
      // Add default
      if (attrConfig.default !== undefined) {
        attr.description += ` [default: ${attrConfig.default}]`;
      }
      
      allAttributes.set(htmlAttrName, attr);
    });
  });
  
  // Build the wb-part element definition
  const wbPartElement = {
    name: 'wb-part',
    description: 'WB Part - Reusable HTML template. First boolean attribute specifies the part name.',
    attributes: Array.from(allAttributes.values()),
    references: [
      {
        name: 'WB Parts Documentation',
        url: 'https://github.com/user/wb-starter#parts'
      }
    ]
  };
  
  return {
    version: 1.1,
    tags: [wbPartElement],
    globalAttributes: [],
    valueSets: [
      {
        name: 'v',
        values: [{ name: '' }] // Boolean attribute
      }
    ]
  };
}

// =============================================================================
// MERGE WITH EXISTING CUSTOM DATA
// =============================================================================

function mergeWithExisting(newData) {
  const customDataPath = join(ROOT, '.vscode/html-custom-data.json');
  
  let existing = { version: 1.1, tags: [], globalAttributes: [], valueSets: [] };
  
  if (existsSync(customDataPath)) {
    try {
      existing = JSON.parse(readFileSync(customDataPath, 'utf-8'));
    } catch (e) {
      console.warn('Could not parse existing html-custom-data.json, starting fresh');
    }
  }
  
  // Remove existing wb-part entry if present
  existing.tags = existing.tags.filter(t => t.name !== 'wb-part');
  
  // Add new wb-part entry
  existing.tags.push(...newData.tags);
  
  // Merge value sets
  const existingValueSetNames = new Set(existing.valueSets?.map(v => v.name) || []);
  newData.valueSets?.forEach(vs => {
    if (!existingValueSetNames.has(vs.name)) {
      existing.valueSets = existing.valueSets || [];
      existing.valueSets.push(vs);
    }
  });
  
  return existing;
}

// =============================================================================
// GENERATE TYPESCRIPT TYPES (BONUS)
// =============================================================================

function generateTypeScriptTypes(registry) {
  const parts = registry.parts;
  let output = `/**
 * WB Parts TypeScript Definitions
 * Auto-generated from parts-registry.json
 */

declare namespace WBParts {
`;

  Object.entries(parts).forEach(([name, config]) => {
    const interfaceName = name
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');
    
    output += `\n  /** ${config.description || name} */\n`;
    output += `  interface ${interfaceName}Props {\n`;
    
    if (config.attributes) {
      Object.entries(config.attributes).forEach(([attrName, attrConfig]) => {
        const optional = attrConfig.required ? '' : '?';
        let type = 'string';
        
        if (attrConfig.type === 'boolean') type = 'boolean';
        else if (attrConfig.type === 'number') type = 'number';
        else if (attrConfig.enum) type = attrConfig.enum.map(v => `'${v}'`).join(' | ');
        
        output += `    /** ${attrConfig.description || ''} */\n`;
        output += `    ${attrName}${optional}: ${type};\n`;
      });
    }
    
    output += `  }\n`;
  });

  output += `
  /** All available part names */
  type PartName = ${Object.keys(parts).map(n => `'${n}'`).join(' | ')};
}

export = WBParts;
`;

  return output;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log('📦 Generating WB Parts IntelliSense data...\n');
  
  // Load registry
  const registry = loadPartsRegistry();
  const partCount = Object.keys(registry.parts).length;
  console.log(`Found ${partCount} parts in registry`);
  
  // Generate IntelliSense data
  const intelliSenseData = generateIntelliSenseData(registry);
  const attrCount = intelliSenseData.tags[0].attributes.length;
  console.log(`Generated ${attrCount} attributes for <wb-part>`);
  
  // Merge with existing
  const merged = mergeWithExisting(intelliSenseData);
  
  // Write html-custom-data.json
  const outputPath = join(ROOT, '.vscode/html-custom-data.json');
  writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  console.log(`✅ Wrote ${outputPath}`);
  
  // Generate TypeScript types
  const tsTypes = generateTypeScriptTypes(registry);
  const tsOutputPath = join(ROOT, 'src/parts/parts.d.ts');
  writeFileSync(tsOutputPath, tsTypes);
  console.log(`✅ Wrote ${tsOutputPath}`);
  
  // Summary
  console.log('\n📋 Parts registered:');
  Object.keys(registry.parts).forEach(name => {
    const part = registry.parts[name];
    const attrCount = Object.keys(part.attributes || {}).length;
    console.log(`   • ${name} (${attrCount} attributes)`);
  });
  
  console.log('\n✨ Done! Restart VS Code to enable IntelliSense.');
}

main();
