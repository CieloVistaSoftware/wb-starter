/**
 * Find all duplicate const/let declarations in JS files
 * Outputs to data/duplicate-declarations.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const JS_DIRS = [
  'src/wb-viewmodels',
  'src/builder-app'
];

function getJsFiles(dir) {
  const fullPath = path.join(ROOT, dir);
  if (!fs.existsSync(fullPath)) return [];
  return fs.readdirSync(fullPath)
    .filter(f => f.endsWith('.js'))
    .map(f => ({ file: f, dir }));
}

function findDuplicates() {
  const issues = [];
  
  for (const jsDir of JS_DIRS) {
    for (const { file, dir } of getJsFiles(jsDir)) {
      const filePath = path.join(ROOT, dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
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
          const scopeKey = `${dir}/${file}:${currentFunction}`;
          
          if (!functionScopes.has(scopeKey)) functionScopes.set(scopeKey, new Map());
          
          const scope = functionScopes.get(scopeKey);
          if (scope.has(varName)) {
            const firstLine = scope.get(varName);
            issues.push({
              file: `${dir}/${file}`,
              line: lineNum + 1,
              variable: varName,
              function: currentFunction,
              firstDeclaredAt: firstLine + 1
            });
          } else {
            scope.set(varName, lineNum);
          }
        }
      }
    }
  }
  
  // Group by file for easier fixing
  const grouped = {};
  for (const issue of issues) {
    if (!grouped[issue.file]) grouped[issue.file] = [];
    grouped[issue.file].push(issue);
  }
  
  const output = {
    total: issues.length,
    byFile: grouped,
    all: issues
  };
  
  const outputPath = path.join(ROOT, 'data', 'duplicate-declarations.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Found ${issues.length} duplicates. Written to data/duplicate-declarations.json`);
  
  // Summary
  console.log('\nBy file:');
  for (const [file, fileIssues] of Object.entries(grouped)) {
    console.log(`  ${file}: ${fileIssues.length} duplicates`);
  }
}

findDuplicates();
