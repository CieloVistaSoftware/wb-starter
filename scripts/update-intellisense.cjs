const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/wb-models');
const vscodeDataPath = path.join(__dirname, '../.vscode/html-custom-data.json');

// Helper to convert CamelCase to hyphenated (cardProduct -> card-product)
function toHyphenated(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function updateIntellisense() {
    console.log('🔄 Updating Intellisense Models...\n');

    if (!fs.existsSync(vscodeDataPath)) {
        console.error('❌ .vscode/html-custom-data.json not found!');
        return;
    }

    let vscodeData = JSON.parse(fs.readFileSync(vscodeDataPath, 'utf8'));
    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.schema.json') && !f.startsWith('_'));

    let addedTags = 0;
    let updatedAttributes = 0;

    for (const file of files) {
        try {
            const schema = JSON.parse(fs.readFileSync(path.join(modelsDir, file), 'utf8'));
            const behaviorName = schema.behavior || file.replace('.schema.json', '');
            
            // Determine Tag Name: prefers wb-card-product if CamelCase, wb-card for single word
            const hyphenatedName = toHyphenated(behaviorName);
            const tagName = `wb-${hyphenatedName}`;
            
            // Check for metadata to skip generation
            const skipAttribute = schema._metadata && schema._metadata.generateAttribute === false;

            // Determine Attribute Name
            const attrName = `x-${hyphenatedName}`;

            // --- 1. EXTRACT VARIANTS & CSS ---
            let variantInfo = '';
            let cssInfo = '';
            
            if (schema.properties && schema.properties.variant) {
                const v = schema.properties.variant;
                if (v.enum && v.enum.length > 0) {
                    variantInfo = `\n\nVariants:\n- ${v.enum.join('\n- ')}`;
                }
                if (v.appliesClass) {
                    const baseClass = v.appliesClass.replace('{{value}}', '*');
                    cssInfo = `\n\nCSS Rules:\n- ${baseClass}`;
                }
            }

            // Semantic Element Hint
            const semanticTag = schema.semanticElement ? schema.semanticElement.tagName : 'div';
            const usageHint = `\n\nUsage: [<${semanticTag} ${attrName}>]`;

            // --- 2. UPDATE/ADD SCEMANTIC ATTRIBUTE (x-*) ---
            if (!skipAttribute) {
                const existingAttrIndex = vscodeData.globalAttributes.findIndex(a => a.name === attrName);
                
                const attrDescription = (schema.description || `Applies the "${behaviorName}" behavior.`) 
                                        + usageHint 
                                        + variantInfo 
                                        + cssInfo;

                if (existingAttrIndex > -1) {
                    // Update existing
                    vscodeData.globalAttributes[existingAttrIndex].description = attrDescription;
                } else {
                    // Add new
                    vscodeData.globalAttributes.push({
                        name: attrName,
                        description: attrDescription
                    });
                    updatedAttributes++;
                }
            } else {
                 // Remove if it exists and we want to skip it
                 const existingAttrIndex = vscodeData.globalAttributes.findIndex(a => a.name === attrName);
                 if (existingAttrIndex > -1) {
                     vscodeData.globalAttributes.splice(existingAttrIndex, 1);
                 }
            }

            // --- 3. ADD MISSING TAG (wb-*) ---
            const existingTagIndex = vscodeData.tags.findIndex(t => t.name === tagName);
            
            if (existingTagIndex === -1) {
                // Construct attributes list for the tag
                const tagAttributes = [];
                if (schema.properties) {
                    for (const [propKey, propDef] of Object.entries(schema.properties)) {
                        const attrDef = {
                            name: propKey,
                            description: propDef.description || propKey
                        };
                        
                        if (propDef.enum) {
                            attrDef.values = propDef.enum.map(e => ({ name: e }));
                        }
                        
                        if (propDef.type === 'boolean') {
                            attrDef.valueSet = 'v';
                        }
                        
                        tagAttributes.push(attrDef);
                    }
                }

                vscodeData.tags.push({
                    name: tagName,
                    description: (schema.title ? `${schema.title}\n\n` : '') + (schema.description || '') + variantInfo + cssInfo,
                    attributes: tagAttributes
                });
                addedTags++;
            }

        } catch (e) {
            console.error(`Error processing ${file}:`, e.message);
        }
    }

    // Sort valid tags alphabetically for neatness
    vscodeData.tags.sort((a, b) => a.name.localeCompare(b.name));
    vscodeData.globalAttributes.sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(vscodeDataPath, JSON.stringify(vscodeData, null, 2), 'utf8');
    
    console.log(`✅ Update Complete!`);
    console.log(`   - Added ${addedTags} missing tags`);
    console.log(`   - Updated/Added ${updatedAttributes} semantic attributes`);
}

updateIntellisense();
