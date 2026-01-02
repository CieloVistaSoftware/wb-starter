const fs = require('fs');
const path = require('path');

const cardsDir = path.join(__dirname, '../docs/components/cards');
const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('.md') && f.startsWith('card'));

console.log(`Scanning ${files.length} files in ${cardsDir}...`);

files.forEach(file => {
  const filePath = path.join(cardsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to find code blocks under headers
  // Matches:
  // 1. Header (### Title)
  // 2. Newlines
  // 3. HTML Code block
  const regex = /(### [^\n]+)\n\n```html\n([\s\S]+?)\n```/g;
  
  let updated = false;
  const newContent = content.replace(regex, (match, header, code) => {
    // Only process if code looks like an HTML element (starts with <)
    if (!code.trim().startsWith('<')) return match;
    
    // Skip if it's just a script tag or style tag
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
