import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inventoryPath = path.join(__dirname, '../data/behavior-inventory.json');
const schemaDir = path.join(__dirname, '../src/behaviors/schema');
const testDir = path.join(__dirname, '../tests/behaviors');

// Load inventory
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const allBehaviors = [
  ...inventory.byType.element,
  ...inventory.byType.container,
  ...inventory.byType.modifier,
  ...inventory.byType.action
];

// Load schemas
const schemas = fs.readdirSync(schemaDir)
  .filter(f => f.endsWith('.schema.json'))
  .map(f => {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(schemaDir, f), 'utf8'));
      return content.behavior || f.replace('.schema.json', '');
    } catch (e) {
      return null;
    }
  })
  .filter(Boolean);

// Find missing schemas
const missingSchemas = allBehaviors.filter(b => !schemas.includes(b));

console.log(`Total Behaviors: ${allBehaviors.length}`);
console.log(`Total Schemas: ${schemas.length}`);
console.log(`Missing Schemas: ${missingSchemas.length}`);
if (missingSchemas.length > 0) {
  console.log('Behaviors without schemas (not covered by permutation tests):');
  console.log(missingSchemas.join(', '));
}

// Check for page tests
const pagesDir = path.join(__dirname, '../pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
const testFiles = fs.readdirSync(testDir).concat(fs.readdirSync(path.join(testDir, 'ui')));

console.log('\nPage Test Coverage:');
pages.forEach(page => {
  const testName = page.replace('.html', '.spec.ts');
  const pageName = page.replace('.html', '');
  const hasTest = testFiles.some(f => 
    f === testName || 
    f === `${pageName}.spec.ts` || 
    f === `${pageName}-page.spec.ts` ||
    (page === 'components.html' && f === 'components-page.spec.ts') ||
    (page === 'hero-variants.html' && f === 'cardhero.spec.ts')
  );
  
  console.log(`${page}: ${hasTest ? 'Covered' : 'Missing explicit test file'}`);
});
