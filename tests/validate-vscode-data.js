const fs = require('fs');
const path = require('path');

const vscodeDataPath = path.join(__dirname, '../.vscode/html-custom-data.json');
const inventoryPath = path.join(__dirname, '../data/behavior-inventory.json');

console.log('Validating VS Code custom data against behavior inventory...');

if (!fs.existsSync(vscodeDataPath)) {
  console.error('❌ .vscode/html-custom-data.json not found');
  process.exit(1);
}

if (!fs.existsSync(inventoryPath)) {
  console.error('❌ data/behavior-inventory.json not found');
  process.exit(1);
}

const vscodeData = JSON.parse(fs.readFileSync(vscodeDataPath, 'utf8'));
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

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
