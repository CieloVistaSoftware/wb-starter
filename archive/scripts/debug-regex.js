import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const usageIndex = content.indexOf('## Usage Example');
    if (usageIndex !== -1) {
        console.log("Context around Usage Example:");
        console.log(JSON.stringify(content.substring(usageIndex, usageIndex + 50)));
    }
}
