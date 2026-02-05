const fs = require('fs');
const resolvePageFile = (slug) => {
  const f1 = `pages/${slug}.html`;
  const f2 = `pages/${slug}/${slug}.html`;
  const f3 = `pages/${slug}/index.html`;
  if (fs.existsSync(f1)) return f1;
  if (fs.existsSync(f2)) return f2;
  return f3;
};
let html = fs.readFileSync(resolvePageFile('components'), 'utf8');

const beforeCount = (html.match(/```/g) || []).length;
console.log('Backtick fences before:', beforeCount);

let fixCount = 0;

html = html.replace(/<wb-mdhtml>\s*<template>([\s\S]*?)<\/template>\s*<\/wb-mdhtml>/g, (match, content) => {
    // Find minimum indentation of non-empty lines
    const lines = content.split('\n');
    let minIndent = Infinity;
    for (const line of lines) {
        if (line.trim().length === 0) continue;
        const indent = line.match(/^(\s*)/)[1].length;
        if (indent < minIndent) minIndent = indent;
    }
    if (minIndent === Infinity || minIndent === 0) return match; // already good
    
    // Dedent all lines
    const dedented = lines.map(line => {
        if (line.trim().length === 0) return '';
        return line.substring(minIndent);
    }).join('\n');
    
    fixCount++;
    return '<wb-mdhtml><template>\n' + dedented.trim() + '\n</template></wb-mdhtml>';
});

const afterCount = (html.match(/```/g) || []).length;
console.log('Backtick fences after:', afterCount);
console.log('Blocks fixed:', fixCount);

fs.writeFileSync(resolvePageFile('components'), html, 'utf8');

// Verify
const fixed = fs.readFileSync(resolvePageFile('components'), 'utf8');
const firstIdx = fixed.indexOf('<wb-mdhtml><template>');
if (firstIdx > -1) {
    console.log('\nFirst block preview:');
    console.log(fixed.substring(firstIdx, firstIdx + 250));
}
