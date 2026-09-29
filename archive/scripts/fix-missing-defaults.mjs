/**
 * fix-missing-defaults.mjs
 * Adds missing 'default' values to all component schema properties.
 * 
 * Rules:
 *   string  → ""
 *   boolean → false
 *   number  → 0
 *   integer → 0
 *   array   → []
 *   object  → {}
 * 
 * Does NOT touch properties that already have a default.
 * Output: data/fix-defaults-report.json
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const modelsDir = join(process.cwd(), 'src', 'wb-models');
const outputPath = join(process.cwd(), 'data', 'fix-defaults-report.json');

const defaultsByType = {
  string: "",
  boolean: false,
  number: 0,
  integer: 0,
  array: [],
  object: {}
};

const files = readdirSync(modelsDir)
  .filter(f => f.endsWith('.schema.json') && f !== 'schema.schema.json');

const report = {
  timestamp: new Date().toISOString(),
  totalFiles: files.length,
  filesModified: 0,
  filesSkipped: 0,
  totalPropsFixed: 0,
  details: []
};

for (const file of files) {
  const filePath = join(modelsDir, file);
  let schema;
  try {
    schema = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    report.details.push({ file, status: 'PARSE_ERROR', error: e.message, fixes: [] });
    report.filesSkipped++;
    continue;
  }

  if (!schema.properties || typeof schema.properties !== 'object') {
    report.details.push({ file, status: 'NO_PROPERTIES', fixes: [] });
    report.filesSkipped++;
    continue;
  }

  const fixes = [];

  for (const [propName, prop] of Object.entries(schema.properties)) {
    if (typeof prop !== 'object' || prop === null) continue;
    if ('default' in prop) continue; // already has one

    const type = prop.type;
    if (!type || !(type in defaultsByType)) {
      fixes.push({ property: propName, action: 'SKIPPED', reason: `unknown or missing type: "${type}"` });
      continue;
    }

    const defaultVal = defaultsByType[type];
    prop.default = defaultVal;
    fixes.push({ property: propName, action: 'ADDED', type, default: defaultVal });
  }

  if (fixes.filter(f => f.action === 'ADDED').length > 0) {
    writeFileSync(filePath, JSON.stringify(schema, null, 2) + '\n');
    report.filesModified++;
    report.totalPropsFixed += fixes.filter(f => f.action === 'ADDED').length;
    report.details.push({ file, status: 'FIXED', fixes });
  } else {
    report.filesSkipped++;
    report.details.push({ file, status: 'OK', fixes });
  }
}

writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log(`\n=== Fix Missing Defaults Report ===`);
console.log(`Total files: ${report.totalFiles}`);
console.log(`Modified:    ${report.filesModified}`);
console.log(`Skipped:     ${report.filesSkipped}`);
console.log(`Props fixed: ${report.totalPropsFixed}`);

if (report.filesModified > 0) {
  console.log(`\n--- Modified Files ---`);
  for (const d of report.details.filter(d => d.status === 'FIXED')) {
    const added = d.fixes.filter(f => f.action === 'ADDED');
    console.log(`  ${d.file}: ${added.length} defaults added (${added.map(f => f.property).join(', ')})`);
  }
}

const skippedProps = report.details.flatMap(d => d.fixes.filter(f => f.action === 'SKIPPED'));
if (skippedProps.length > 0) {
  console.log(`\n--- Skipped (need manual review) ---`);
  for (const s of skippedProps) {
    console.log(`  ${s.property}: ${s.reason}`);
  }
}

console.log(`\nFull report: ${outputPath}`);
