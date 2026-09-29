/**
 * Manual duplicate variable check
 * Mimics the test logic exactly
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JS_DIR = path.join(__dirname, 'src', 'behaviors', 'js');
const OUTPUT_FILE = path.join(__dirname, 'data', 'duplicate-vars-detailed.json');

function getJsFiles() {
  if (!fs.existsSync(JS_DIR)) return [];
  return fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

const issues = [];
const debugInfo = [];

for (const jsFile of getJsFiles()) {
  const filePath = path.join(JS_DIR, jsFile);
  const content = readFile(filePath);
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
      
      // Debug: log each declaration
      debugInfo.push({
        file: jsFile,
        line: lineNum + 1,
        varName,
        scopeKey,
        alreadyExists: scope.has(varName),
        existingLine: scope.get(varName) ? scope.get(varName) + 1 : null,
        trimmedLine: trimmed.substring(0, 80)
      });
      
      if (scope.has(varName)) {
        const firstLine = scope.get(varName);
        issues.push({
          file: jsFile,
          line: lineNum + 1,
          varName,
          function: currentFunction,
          firstDeclaredLine: firstLine + 1,
          message: `${jsFile}:${lineNum + 1} - DUPLICATE: "${varName}" in ${currentFunction}() (first declared at line ${firstLine + 1})`
        });
      } else {
        scope.set(varName, lineNum);
      }
    }
  }
}

const result = {
  timestamp: new Date().toISOString(),
  totalFiles: getJsFiles().length,
  totalDuplicates: issues.length,
  issues: issues,
  allDeclarations: debugInfo.filter(d => d.alreadyExists)
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
console.log(`Results written to: ${OUTPUT_FILE}`);
console.log(`Found ${issues.length} duplicate(s)`);
if (issues.length > 0) {
  console.log('\nDuplicates:');
  issues.forEach(i => console.log(`  ${i.message}`));
}
