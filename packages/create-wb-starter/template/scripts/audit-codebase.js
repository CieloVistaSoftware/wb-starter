import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '../src/wb-models');
const viewmodelsDir = path.join(__dirname, '../src/wb-viewmodels');
const vscodeDataPath = path.join(__dirname, '../.vscode/html-custom-data.json');

async function auditCodebase() {
    console.log('🔍 Auditing Codebase vs Intellisense...\n');

    if (!fs.existsSync(vscodeDataPath)) {
        console.error('❌ .vscode/html-custom-data.json not found!');
        process.exit(1);
    }
    
    // Load VS Code Data
    const vscodeData = JSON.parse(fs.readFileSync(vscodeDataPath, 'utf8'));
    const definedTags = new Set(vscodeData.tags.map(t => t.name));

    // Load Existing Schemas
    const schemaFiles = new Set(fs.readdirSync(modelsDir).filter(f => f.endsWith('.schema.json')));

    // Scan ViewModels (The "Truth" of what code exists)
    const viewFiles = fs.readdirSync(viewmodelsDir).filter(f => f.endsWith('.js'));
    
    const violations = [];
    const unknownFiles = [];

    // Helper to map filename to likely schema/tag name
    // e.g. x-row.js -> x-row -> row.schema.json
    // e.g. span.js -> x-span -> span.schema.json
    for (const file of viewFiles) {
        // Skip known library files
        if (['layouts.js', 'helpers.js', 'effects.js', 'validator.js'].includes(file)) continue;

        let componentName = file.replace('.js', '');
        let tagName = '';
        let expectedSchema = '';

        if (componentName.startsWith('wb-')) {
            tagName = componentName; // x-row
            expectedSchema = componentName.replace('wb-', '') + '.schema.json'; // row.schema.json
        } else {
            tagName = `wb-${componentName}`; // x-span
            expectedSchema = componentName + '.schema.json'; // span.schema.json
        }

        // Check 1: Does it have a schema?
        const hasSchema = schemaFiles.has(expectedSchema);

        // Check 2: Is it in VS Code Data?
        const hasIntellisense = definedTags.has(tagName);

        if (!hasIntellisense) {
            // Check if file actually defines a custom element or behavior
            const content = fs.readFileSync(path.join(viewmodelsDir, file), 'utf8');
            if (content.includes('customElements.define') || content.includes('export function ' + componentName)) {
                 violations.push({
                    file,
                    tagName,
                    expectedSchema,
                    hasSchema,
                    hasIntellisense
                 });
            } else {
                unknownFiles.push(file);
            }
        }
    }

    console.log(`📊 Codebase Audit Report:`);
    console.log(`   Scanned ${viewFiles.length} JS files in src/wb-viewmodels\n`);

    if (violations.length > 0) {
        console.log(`❌ Violations Found (${violations.length} components missing Intellisense):`);
        violations.forEach(v => {
            console.log(`   - [ ] ${v.tagName} (from ${v.file})`);
            console.log(`         Missing: ${!v.hasSchema ? 'Schema file' : ''} ${!v.hasIntellisense ? 'VS Code Definition' : ''}`);
        });
        console.log('\nSuggested Fix: Create schema files for these components and run update-intellisense.cjs');
    } else {
        console.log(`✅ No violations found. All detected components have Intellisense/Schema.`);
    }

    if (unknownFiles.length > 0) {
        console.log(`\nℹ️  Skipped ${unknownFiles.length} helper/logic files (no component definition detected).`);
    }
}

auditCodebase();
