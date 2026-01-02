const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../docs/components/cards/carddraggable.md');
const content = fs.readFileSync(filePath, 'utf-8');

const regex = /(#{2,3} [^\n]+)\n\n```html\n([\s\S]+?)\n```/g;

let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Matched header: ${match[1]}`);
  console.log(`Code start: ${match[2].substring(0, 20)}...`);
}

if (!regex.test(content)) {
    console.log("No matches found.");
    // Try to see what the spacing is
    const usageIndex = content.indexOf('## Usage Example');
    if (usageIndex !== -1) {
        console.log("Context around Usage Example:");
        console.log(JSON.stringify(content.substring(usageIndex, usageIndex + 50)));
    }
}
