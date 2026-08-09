import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cardsDir = path.join(__dirname, '../docs/components/cards');
const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('.md') && f.startsWith('card'));

console.log(`Scanning ${files.length} files in ${cardsDir}...`);

files.forEach(file => {
  const filePath = path.join(cardsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const regex = /(### [^\n]+)\n\n```html\n([\s\S]+?)\n```/g;
  
  let updated = false;
  const newContent = content.replace(regex, (match, header, code) => {
    if (!code.trim().startsWith('<')) return match;
    if (code.trim().startsWith('<script') || code.trim().startsWith('<style')) return match;

    updated = true;
    return `${header}\n\n${code}\n\n\`\`\`html\n${code}\n\`\`\``;
  });
  
  if (updated) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Skipped ${file} (no changes needed)`);
  }
});
