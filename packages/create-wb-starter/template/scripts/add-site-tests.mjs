/**
 * add-site-tests.mjs
 * ==================
 * Adds test.site validation rules to every schema referenced in the site config.
 * These rules define what the Playwright site tests should verify:
 *   - renders: component should be visible
 *   - baseClass: expected CSS class on the element
 *   - checkText: text strings that should appear in at least one instance
 *   - checkAttributes: attributes that should exist on rendered instances
 *   - minInstances: minimum number of component instances expected
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

const MODELS = resolve('src/wb-models');
const site = JSON.parse(readFileSync(resolve('src/wb-models/pages/wb-component-library.site.json'), 'utf-8'));

// Build page→component map
const pageMap = {};
for (const page of site.pages) {
  if (!page.components) continue;
  for (const comp of page.components) {
    pageMap[comp] = page.id;
  }
}

let updated = 0;
let skipped = 0;

for (const [compName, pageSlug] of Object.entries(pageMap)) {
  const filePath = join(MODELS, `${compName}.schema.json`);
  let schema;
  try {
    schema = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    console.log(`  ⚠️  ${compName} — schema not found`);
    continue;
  }

  // Build site test rules from schema data
  const baseClass = schema.compliance?.baseClass || schema.baseClass || `wb-${compName}`;
  const tag = `wb-${compName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  const combos = schema.test?.matrix?.combinations || [];
  const props = schema.properties || {};

  // Extract visible text attributes from first few combos
  const textAttrs = ['title', 'subtitle', 'label', 'message', 'name', 'placeholder', 'text', 'bio', 'footer', 'helper', 'items'];
  const checkText = [];
  for (const combo of combos.slice(0, 4)) {
    for (const attr of textAttrs) {
      if (combo[attr] && typeof combo[attr] === 'string' && combo[attr].length < 60) {
        checkText.push(combo[attr]);
      }
    }
  }

  // Extract expected classes from enum values with appliesClass
  const checkClasses = [];
  for (const [propName, propDef] of Object.entries(props)) {
    if (propDef.appliesClass && propDef.enum) {
      // Just check the first non-default enum value
      const nonDefault = propDef.enum.find(v => v !== propDef.default);
      if (nonDefault) {
        const cls = propDef.appliesClass
          .replace('{{value}}', nonDefault)
          .replace('{value}', nonDefault);
        checkClasses.push(cls);
      }
    }
  }

  // Extract attributes to check from first combo
  const checkAttributes = [];
  if (combos.length > 0) {
    const first = combos[0];
    for (const [key, val] of Object.entries(first)) {
      if (typeof val === 'string' && val.length < 40) {
        checkAttributes.push(key);
      }
    }
  }

  // Build the site test object
  const siteTest = {
    page: pageSlug,
    tag,
    renders: true,
    baseClass,
    minInstances: Math.max(1, combos.length),
    checkText: [...new Set(checkText)].slice(0, 6),
    checkClasses: [...new Set(checkClasses)].slice(0, 4),
    checkAttributes: [...new Set(checkAttributes)].slice(0, 5)
  };

  // Only update if site test is missing or incomplete
  if (schema.test?.site?.page === pageSlug && schema.test?.site?.checkText?.length > 0) {
    skipped++;
    continue;
  }

  if (!schema.test) schema.test = {};
  schema.test.site = siteTest;

  writeFileSync(filePath, JSON.stringify(schema, null, 2) + '\n');
  console.log(`  ✅ ${compName} → ${pageSlug}.html (${checkText.length} text checks, ${checkClasses.length} class checks)`);
  updated++;
}

console.log(`\n══════════════════════════════`);
console.log(`  Updated: ${updated}`);
console.log(`  Skipped: ${skipped}`);
console.log(`══════════════════════════════`);
