/**
 * Schema Compliance Audit v2 — Tier-Aware
 * Checks every .schema.json against schema.schema.json requirements
 * respecting schemaType: "component" | "base" | "definition"
 */
import fs from 'fs';
import path from 'path';

const modelsDir = path.resolve('src/wb-models');
const results = { pass: [], fail: [] };

function auditFile(filePath, relativePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const issues = [];
    const tier = content.schemaType || 'component';

    // ALL tiers require title + description
    if (!content.title) issues.push('missing title');
    if (!content.description) issues.push('missing description');

    // Component tier: full rules
    if (tier === 'component') {
      if (!content.properties) issues.push('missing properties');
      if (content.$view === undefined) issues.push('missing $view');
      if (content.$methods === undefined) issues.push('missing $methods');
      if (!content.behavior && !content.schemaFor) issues.push('missing behavior AND schemaFor');
    }

    // Base tier: properties required
    if (tier === 'base') {
      if (!content.properties) issues.push('missing properties');
    }

    // Component + Base: check property type + default
    if (tier !== 'definition' && content.properties && typeof content.properties === 'object') {
      for (const [propName, propDef] of Object.entries(content.properties)) {
        if (propName.startsWith('$') || propName.startsWith('_')) continue;
        if (typeof propDef !== 'object' || propDef === null) continue;
        if (propDef.type === 'object' && propDef.properties) continue;
        if (!propDef.type) issues.push(`property "${propName}" missing type`);
        if (propDef.default === undefined) issues.push(`property "${propName}" missing default`);
      }
    }

    if (issues.length === 0) {
      results.pass.push({ file: relativePath, tier });
    } else {
      results.fail.push({ file: relativePath, tier, issues });
    }
  } catch (e) {
    results.fail.push({ file: relativePath, tier: '?', issues: [`JSON parse error: ${e.message}`] });
  }
}

function walkDir(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);
    if (entry.isDirectory()) {
      walkDir(fullPath, base);
    } else if (entry.name.endsWith('.schema.json') && entry.name !== 'schema.schema.json') {
      auditFile(fullPath, relPath);
    }
  }
}

walkDir(modelsDir, modelsDir);

// Tier counts
const tierCounts = { component: 0, base: 0, definition: 0 };
for (const p of results.pass) tierCounts[p.tier]++;
for (const f of results.fail) if (tierCounts[f.tier] !== undefined) tierCounts[f.tier]++;

console.log(`\n=== SCHEMA COMPLIANCE AUDIT v2 (Tier-Aware) ===`);
console.log(`Total: ${results.pass.length + results.fail.length}`);
console.log(`Pass:  ${results.pass.length}`);
console.log(`Fail:  ${results.fail.length}`);
console.log(`\nBy Tier:`);
console.log(`  Component:  ${tierCounts.component}`);
console.log(`  Base:       ${tierCounts.base}`);
console.log(`  Definition: ${tierCounts.definition}`);

if (results.fail.length > 0) {
  console.log('\n=== FAILURES ===\n');
  for (const f of results.fail) {
    console.log(`❌ ${f.file} [${f.tier}]`);
    for (const issue of f.issues) {
      console.log(`   - ${issue}`);
    }
    console.log('');
  }
} else {
  console.log('\n✅ ALL SCHEMAS PASS\n');
}

fs.writeFileSync('data/schema-audit.json', JSON.stringify(results, null, 2));
console.log('Results written to data/schema-audit.json');
