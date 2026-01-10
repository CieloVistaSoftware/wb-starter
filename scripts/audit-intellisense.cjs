const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/wb-models');
const vscodeDataPath = path.join(__dirname, '../.vscode/html-custom-data.json');

// Helper to convert CamelCase/kebab-case to separate words
function toTitleCase(str) {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

async function audit() {
    console.log('🔍 Auditing Intellisense Coverage...\n');

    if (!fs.existsSync(vscodeDataPath)) {
        console.error('❌ .vscode/html-custom-data.json not found!');
        return;
    }

    const vscodeData = JSON.parse(fs.readFileSync(vscodeDataPath, 'utf8'));
    const definedTags = new Set(vscodeData.tags.map(t => t.name));
    const definedGlobalAttributes = new Set(vscodeData.globalAttributes.map(a => a.name));

    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.schema.json') && !f.startsWith('_'));

    const missingTags = [];
    const missingBehaviors = [];
    const coverage = { total: 0, tags: 0, behaviors: 0 };

    for (const file of files) {
        const schemaPath = path.join(modelsDir, file);
        try {
            const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
            const behaviorName = schema.behavior || file.replace('.schema.json', '');
            
            // Expected Tag Name: "wb-" + behaviorName (e.g., wb-card)
            // Handle camelCase behavior names for tags: cardProduct -> wb-card-product
            const tagName = `wb-${behaviorName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
            
            // Expected Behavior Attribute: "x-" + behaviorName (e.g., x-card) or "x-as-" + behaviorName
            const attrName = `x-${behaviorName}`;
            const asAttrName = `x-as-${behaviorName}`;

            coverage.total++;

            // Check Tag
            if (definedTags.has(tagName)) {
                coverage.tags++;
            } else {
                missingTags.push({ file, tagName, behaviorName });
            }

            // Check Behavior Attribute (either x-behavior or x-as-behavior)
            // Note: Some behaviors might only be "as" or only direct. Checking for either.
            if (definedGlobalAttributes.has(attrName) || definedGlobalAttributes.has(asAttrName)) {
                coverage.behaviors++;
            } else {
                missingBehaviors.push({ file, attrName });
            }

        } catch (e) {
            console.error(`Error parsing ${file}:`, e.message);
        }
    }

    console.log(`📊 Coverage Report:`);
    console.log(`   Total Schemas: ${coverage.total}`);
    console.log(`   Tags Covered: ${coverage.tags} (${Math.round(coverage.tags/coverage.total*100)}%)`);
    console.log(`   Behaviors Covered: ${coverage.behaviors} (${Math.round(coverage.behaviors/coverage.total*100)}%)\n`);

    if (missingTags.length > 0) {
        console.log(`❌ Missing Tags (${missingTags.length}):`);
        missingTags.forEach(m => console.log(`   - [ ] <${m.tagName}> (${m.file})`));
        console.log('');
    }

    // We focus on tags mostly as the user asked for "TAGS THAT HAVE NO INTELISNSE"
    // Behaviors are often covered by broad "x-*" rules or generated lists, but let's see.
    if (missingBehaviors.length > 0) {
        console.log(`⚠️  Missing Behavior Attributes (${missingBehaviors.length}):`);
        missingBehaviors.forEach(m => console.log(`   - [ ] ${m.attrName} (${m.file})`));
    }
}

audit();
