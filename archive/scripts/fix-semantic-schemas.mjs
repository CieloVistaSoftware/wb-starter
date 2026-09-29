/**
 * Fix semantic schemas:
 * 1. Add "schemaType": "base"
 * 2. Fix properties missing type/default
 */
import fs from 'fs';
import path from 'path';

const semanticDir = path.resolve('src/wb-models/semantic');
const files = fs.readdirSync(semanticDir).filter(f => f.endsWith('.schema.json'));

for (const file of files) {
  const filePath = path.join(semanticDir, file);
  const schema = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let changed = false;

  // 1. Add schemaType: "base" if missing
  if (!schema.schemaType) {
    schema.schemaType = 'base';
    changed = true;
    console.log(`  + ${file}: added schemaType: "base"`);
  }

  // 2. Fix properties missing type/default
  if (schema.properties) {
    for (const [name, prop] of Object.entries(schema.properties)) {
      if (name.startsWith('$') || name.startsWith('_')) continue;
      if (typeof prop !== 'object' || prop === null) continue;
      // Skip nested groups
      if (prop.type === 'object' && prop.properties) continue;

      if (!prop.type) {
        // Infer type from context
        if (prop.enum) prop.type = 'string';
        else if (typeof prop.default === 'boolean') prop.type = 'boolean';
        else if (typeof prop.default === 'number') prop.type = 'number';
        else if (Array.isArray(prop.default)) prop.type = 'array';
        else prop.type = 'string';
        changed = true;
        console.log(`  + ${file}: property "${name}" → type: "${prop.type}"`);
      }

      if (prop.default === undefined) {
        // Set sensible default based on type
        if (prop.type === 'string') prop.default = '';
        else if (prop.type === 'boolean') prop.default = false;
        else if (prop.type === 'number' || prop.type === 'integer') prop.default = 0;
        else if (prop.type === 'array') prop.default = [];
        else if (prop.type === 'object') prop.default = {};
        else prop.default = '';
        changed = true;
        console.log(`  + ${file}: property "${name}" → default: ${JSON.stringify(prop.default)}`);
      }
    }
  }

  if (changed) {
    // Rewrite with consistent formatting
    fs.writeFileSync(filePath, JSON.stringify(schema, null, 2) + '\n');
    console.log(`  ✅ ${file} saved\n`);
  } else {
    console.log(`  ⏭️  ${file} already compliant\n`);
  }
}

console.log('Done!');
