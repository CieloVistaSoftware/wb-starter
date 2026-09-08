import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ES modules only -- the project rule, and this file broke it: it opened with a
// CommonJS import of node:fs inside a package declaring "type": "module", so it
// threw ReferenceError on line 1 and validated nothing whatsoever. A checker that
// cannot start is indistinguishable from one that passes until someone runs it,
// and tests/ was outside the scope of the gate that forbids CommonJS.
const here = dirname(fileURLToPath(import.meta.url));

const vscodeDataPath = join(here, '../.vscode/html-custom-data.json');
const inventoryPath = join(here, '../data/behavior-inventory.json');

console.log('Validating VS Code custom data against behavior inventory...');

if (!existsSync(vscodeDataPath)) {
  console.error('❌ .vscode/html-custom-data.json not found');
  process.exit(1);
}

if (!existsSync(inventoryPath)) {
  console.error('❌ data/behavior-inventory.json not found');
  process.exit(1);
}

const vscodeData = JSON.parse(readFileSync(vscodeDataPath, 'utf8'));
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));

// Flatten inventory
const validBehaviors = new Set([
  ...inventory.byType.element,
  ...inventory.byType.container,
  ...inventory.byType.modifier,
  ...inventory.byType.action
]);

console.log(`Loaded ${validBehaviors.size} valid behaviors from inventory.`);

let hasErrors = false;
let invalidCount = 0;

// Helper to check attributes
function checkAttribute(attrName) {
    const attr = vscodeData.globalAttributes.find(a => a.name === attrName);
    if (!attr) {
        console.log(`ℹ️ Attribute ${attrName} not found (skipping)`);
        return;
    }

    console.log(`Checking ${attrName}...`);
    // An attribute declared with no `values` list offers the editor nothing to
    // complete, which is the whole point of it being in this file. Surfaced the
    // moment this script could run at all -- x-behavior is in that state today.
    if (!Array.isArray(attr.values)) {
      console.error(`❌ ${attrName} is declared with no values[] — IntelliSense can suggest nothing for it`);
      hasErrors = true;
      invalidCount++;
      return;
    }
    const seen = new Set();
    attr.values.forEach(val => {
        if (!validBehaviors.has(val.name)) {
            console.error(`❌ Invalid behavior in ${attrName}: "${val.name}"`);
            hasErrors = true;
            invalidCount++;
        }
        if (seen.has(val.name)) {
            console.error(`❌ Duplicate behavior in ${attrName}: "${val.name}"`);
            hasErrors = true;
            invalidCount++;
        }
        seen.add(val.name);
    });
}

checkAttribute('x-behavior');
checkAttribute('data-behavior');

if (hasErrors) {
  console.log(`\nValidation FAILED with ${invalidCount} errors.`);
  process.exit(1);
} else {
  console.log('\n✅ Validation PASSED: All behaviors in VS Code data are valid.');
}
