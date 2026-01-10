const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../docs');
const modelsDir = path.join(__dirname, '../src/wb-models');
const outputDir = path.join(__dirname, '../docs/audits');
const outputFile = path.join(outputDir, 'X-USAGE-AUDIT.md');

// 1. Get Valid Behaviors
const validBehaviors = new Set();
if (fs.existsSync(modelsDir)) {
    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.schema.json') && !f.startsWith('_'));
    files.forEach(f => {
        try {
            const schema = JSON.parse(fs.readFileSync(path.join(modelsDir, f), 'utf8'));
            const name = schema.behavior || f.replace('.schema.json', '');
            validBehaviors.add(name);
            validBehaviors.add(`x-${name}`); // x-card
            validBehaviors.add(`x-as-${name}`); // x-as-card
        } catch (e) {}
    });
}

// 2. Scan Docs
let detections = [];

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.md')) {
            checkFile(fullPath);
        }
    });
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    
    // Regex for x-something
    // Matches: x-foo, x-foo-bar, x-foo="bar", <element x-foo>
    const regex = /\b(x-[a-zA-Z0-9-]+)\b/g;
    
    lines.forEach((line, index) => {
        let match;
        while ((match = regex.exec(line)) !== null) {
            const usage = match[1];
            
            // Skip common math variable x-axis or x-coordinate if strictly "x-" followed by common words?
            // But let's keep all for audit.
            
            // Validation
            // Check against valid behaviors:
            // 1. Exact match (e.g. x-ripple)
            // 2. x-as-{behavior} (e.g. x-as-card)
            
            let status = '❓ Unknown';
            let behaviorName = '';
            
            if (validBehaviors.has(usage)) {
                status = '✅ Valid';
            } else if (usage.startsWith('x-as-')) {
                const bName = usage.replace('x-as-', '');
                if (validBehaviors.has(bName) || validBehaviors.has(`x-${bName}`)) {
                    status = '✅ Valid Morph';
                } else {
                     status = '⚠️ Invalid Morph Target';
                }
            } else if (usage === 'x-axis' || usage === 'x-height') {
                 status = 'ℹ️  False Positive (Text)';
            } else if (usage.startsWith('x-wb-')) {
                 status = '❌ Legacy Artifact';
            }
            
            detections.push({
                file: relativePath,
                line: index + 1,
                usage: usage,
                context: line.trim().substring(0, 100), // Limit context length
                status: status
            });
        }
    });
}

console.log('🔍 Scanning docs for x- attribute usage...');
scanDir(docsDir);

// 3. Generate Report
let report = `# X-Attribute Usage Audit

**Date:** ${new Date().toLocaleString()}
**Scan Target:** \`docs/**/*.md\`
**Total Detections:** ${detections.length}

| Status | File | Line | Usage | Context |
|--------|------|------|-------|---------|
`;

// Sort by File then Line
detections.sort((a, b) => {
    if (a.file === b.file) return a.line - b.line;
    return a.file.localeCompare(b.file);
});

detections.forEach(d => {
    // Escape pipes for markdown table
    const context = d.context.replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    report += `| ${d.status} | [${d.file}](${d.file}) | ${d.line} | \`${d.usage}\` | \`${context}\` |\n`;
});

// Group by Status Summary
const summary = detections.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
}, {});

report += `\n\n## Summary\n`;
Object.entries(summary).forEach(([key, count]) => {
    report += `- **${key}:** ${count}\n`;
});

fs.writeFileSync(outputFile, report);
console.log(`✅ Audit Complete. Report saved to: ${outputFile}`);
