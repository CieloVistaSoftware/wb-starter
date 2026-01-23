/**
 * Find all duplicate const/let declarations in JS files
 * Outputs to data/duplicate-vars.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BEHAVIORS_JS = path.join(ROOT, 'src', 'behaviors', 'js');

function getJsFiles(dir) {
  const files = [];
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.js')) files.push(path.relative(dir, full));
    }
  }
  walk(dir);
  return files;
}

const issues = [];

for (const jsFile of getJsFiles(BEHAVIORS_JS)) {
  const filePath = path.join(BEHAVIORS_JS, jsFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const functionScopes = new Map();
  let currentFunction = 'global';
  let braceDepth = 0;
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    
    const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch) {
      currentFunction = funcMatch[1];
      braceDepth = 0;
    }
    
    braceDepth += (line.match(/{/g) || []).length;
    braceDepth -= (line.match(/}/g) || []).length;
    
    if (braceDepth <= 0 && currentFunction !== 'global') {
      currentFunction = 'global';
    }
    
    const declMatch = trimmed.match(/^(?:const|let)\s+(\w+)/);
    if (declMatch) {
      const varName = declMatch[1];
      const scopeKey = `${jsFile}:${currentFunction}`;
      
      if (!functionScopes.has(scopeKey)) functionScopes.set(scopeKey, new Map());
      
      const scope = functionScopes.get(scopeKey);
      if (scope.has(varName)) {
        const firstLine = scope.get(varName);
        issues.push({
          file: jsFile,
          line: lineNum + 1,
          firstLine: firstLine + 1,
          variable: varName,
          function: currentFunction,
          message: `DUPLICATE: "${varName}" in ${currentFunction}() (first at line ${firstLine + 1})`
        });
      } else {
        scope.set(varName, lineNum);
      }
    }
  }
}

// Group by file
const byFile = {};
for (const issue of issues) {
  if (!byFile[issue.file]) byFile[issue.file] = [];
  byFile[issue.file].push(issue);
}

const output = {
  total: issues.length,
  byFile,
  all: issues
};

fs.writeFileSync(
  path.join(ROOT, 'data', 'duplicate-vars.json'),
  JSON.stringify(output, null, 2)
);

console.log(`Found ${issues.length} duplicate declarations`);
console.log(`Results saved to data/duplicate-vars.json`);
