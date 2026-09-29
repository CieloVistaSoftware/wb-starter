/**
 * Quick duplicate detector - run with node
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JS_DIR = path.join(__dirname, 'src', 'behaviors', 'js');

const jsFiles = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));
const issues = [];

for (const jsFile of jsFiles) {
  const filePath = path.join(JS_DIR, jsFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const functionScopes = new Map();
  let currentFunction = 'global';
  let braceDepth = 0;
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    
    // Track function scope changes
    const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch) {
      currentFunction = funcMatch[1];
      braceDepth = 0;
    }
    
    // Count braces for scope tracking
    braceDepth += (line.match(/{/g) || []).length;
    braceDepth -= (line.match(/}/g) || []).length;
    
    if (braceDepth <= 0 && currentFunction !== 'global') {
      currentFunction = 'global';
    }
    
    // Find const/let declarations
    const declMatch = trimmed.match(/^(?:const|let)\s+(\w+)/);
    if (declMatch) {
      const varName = declMatch[1];
      const scopeKey = `${jsFile}:${currentFunction}`;
      
      if (!functionScopes.has(scopeKey)) {
        functionScopes.set(scopeKey, new Map());
      }
      
      const scope = functionScopes.get(scopeKey);
      if (scope.has(varName)) {
        const firstLine = scope.get(varName);
        issues.push(
          `${jsFile}:${lineNum + 1} - DUPLICATE: "${varName}" in ${currentFunction}() (first at line ${firstLine + 1})`
        );
      } else {
        scope.set(varName, lineNum);
      }
    }
  }
}

if (issues.length === 0) {
  console.log('✓ No duplicate variable declarations found!');
} else {
  console.log('DUPLICATE VARIABLES FOUND:');
  issues.forEach(i => console.log(i));
}

// Write to JSON
fs.writeFileSync(
  path.join(__dirname, 'data', 'duplicate-check.json'),
  JSON.stringify({ timestamp: new Date().toISOString(), issues }, null, 2)
);
