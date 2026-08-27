import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const dataPath = path.join(__dirname, '../.vscode/html-custom-data.json');
const outputPath = path.join(__dirname, '../docs/INTELLISENSE-TOOLTIPS.md');

// Run Test
console.log("🧪 Starting Intellisense Tooltip Audit...");

if (!fs.existsSync(dataPath)) {
    console.error('❌ Error: .vscode/html-custom-data.json not found.');
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    // Sort tags for consistent reporting
    const tags = data.tags.sort((a, b) => a.name.localeCompare(b.name));
    
    let report = `# Intellisense Tooltip Audit Report\n\n`;
    report += `**Date:** ${new Date().toLocaleString()}\n`;
    report += `**Total Behaviors:** ${tags.length}\n\n`;
    report += `This report records exactly what is displayed in the VS Code hover tooltip for each behavior.\n\n`;
    report += `--- \n\n`;

    let missingDescriptions = 0;

    tags.forEach(tag => {
        const hasDescription = tag.description && tag.description.trim().length > 0;
        if (!hasDescription) missingDescriptions++;

        report += `## \`<${tag.name}>\`\n\n`;
        
        report += `**Tooltip Output:**\n`;
        report += "```text\n";
        report += tag.description || "❌ (NO TOOLTIP CONTENT)";
        report += "\n```\n\n";

        // Also record attribute tooltips if they exist
        if (tag.attributes && tag.attributes.length > 0) {
            report += `<details><summary>View ${tag.attributes.length} Attribute Tooltips</summary>\n\n`;
            report += `| Attribute | Tooltip |\n`;
            report += `|-----------|---------|\n`;
            tag.attributes.forEach(attr => {
                const desc = (attr.description || "").replace(/\n/g, "<br>");
                report += `| \`${attr.name}\` | ${desc} |\n`;
            });
            report += `\n</details>\n\n`;
        }
        report += `---\n\n`;
    });

    // Write Report
    fs.writeFileSync(outputPath, report);

    console.log(`\n✅ **SUCCESS**: Verified ${tags.length} behaviors.`);
    if (missingDescriptions > 0) {
        console.warn(`⚠️  **WARNING**: ${missingDescriptions} behaviors have empty tooltips.`);
    } else {
        console.log(`✨  **PERFECT**: All behaviors have tooltip content.`);
    }
    console.log(`📄 Tooltip report recorded at: ${outputPath}`);

} catch (err) {
    console.error('❌ Failed to verify tooltips:', err);
    process.exit(1);
}
