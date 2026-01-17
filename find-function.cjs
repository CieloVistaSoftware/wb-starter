const fs = require('fs');
const content = fs.readFileSync('builder.html', 'utf8');
const lines = content.split('\n');

// Find addNewPage function
let startLine = -1;
let endLine = -1;
let braceCount = 0;
let inFunction = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('function addNewPage')) {
    startLine = i + 1;
    inFunction = true;
    braceCount = 0;
  }
  
  if (inFunction) {
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    
    if (braceCount === 0 && line.includes('}')) {
      endLine = i + 1;
      break;
    }
  }
}

console.log('addNewPage function: lines', startLine, 'to', endLine);
console.log('---');
if (startLine > 0 && endLine > 0) {
  for (let i = startLine - 1; i < endLine; i++) {
    console.log((i + 1) + ': ' + lines[i]);
  }
}
