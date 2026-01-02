const fs = require('fs');
const path = require('path');

const cardsDir = path.join(__dirname, '../docs/components/cards');
const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('.md') && f.startsWith('card'));

console.log(`Scanning ${files.length} files in ${cardsDir}...`);

files.forEach(file => {
  const filePath = path.join(cardsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to find code blocks under headers (## or ###)
  // Handles both LF and CRLF line endings
  const regex = /(#{2,3} [^\r\n]+)(\r?\n\s*)\`\`\`html\r?\n([\s\S]+?)\r?\n\`\`\`/g;
  
  let updated = false;
  const newContent = content.replace(regex, (match, header, spacing, code) => {
    const trimmed = code.trim();
    
    // Only process if code looks like an HTML element (starts with <)
    if (!trimmed.startsWith('<')) return match;
    
    // Skip if it's just a comment
    if (trimmed.startsWith('<!--')) return match;
    
    // Skip if it's just a script tag or style tag
    if (trimmed.startsWith('<script') || trimmed.startsWith('<style')) return match;

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
