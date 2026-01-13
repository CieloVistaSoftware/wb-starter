#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BEHAVIORS_DIR = path.join(__dirname, '..', 'src', 'wb-viewmodels');

/**
 * Find all JS files recursively
 */
function getJsFiles(dir) {
  const files = [];
  function walk(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory() && !item.startsWith('.')) {
        walk(itemPath);
      } else if (item.endsWith('.js')) {
        files.push(itemPath);
      }
    }
  }
  walk(dir);
  return files;
}

/**
 * Analyze a file for duplicate variable declarations
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const duplicates = [];
  
  const functionMap = new Map();
  let currentFunction = 'global';
  let braceDepth = 0;
  const braceStack = []; // Track which function each brace belongs to
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    
    // Track function entry - match various patterns
    const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?(?:function|const|let)\s+(\w+)\s*[=(\{]/);
    if (funcMatch && trimmed.includes('function') || (trimmed.includes('=') && trimmed.includes('('))) {
      const possibleFunc = trimmed.match(/(?:function|const|let)\s+(\w+)\s*(?:=.*)?[\(\{]/);
      if (possibleFunc && trimmed.includes('{')) {
        currentFunction = possibleFunc[1];
        braceDepth = 0;
        braceStack.push(currentFunction);
      }
    }
    
    // Track braces
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceDepth += openBraces - closeBraces;
    
    // Check if function ended
    if (braceDepth <= 0 && braceStack.length > 0) {
      braceStack.pop();
      currentFunction = braceStack.length > 0 ? braceStack[braceStack.length - 1] : 'global';
    }
    
    // Find variable declarations: const/let/var NAME = ...
    const declMatch = trimmed.match(/^(?:const|let|var)\s+(\w+)\s*[=;]/);
    if (declMatch) {
      const varName = declMatch[1];
      const key = currentFunction;
      
      if (!functionMap.has(key)) {
        functionMap.set(key, new Map());
      }
      
      const funcVars = functionMap.get(key);
      if (!funcVars.has(varName)) {
        funcVars.set(varName, []);
      }
      
      funcVars.get(varName).push({ lineNum: lineNum + 1, code: trimmed });
    }
  }
  
  // Extract duplicates
  for (const [funcName, vars] of functionMap) {
    for (const [varName, occurrences] of vars) {
      if (occurrences.length > 1) {
        duplicates.push({
          file: path.basename(filePath),
          fullPath: filePath,
          relPath: path.relative('.', filePath),
          variable: varName,
          function: funcName,
          occurrences: occurrences.length,
          locations: occurrences,
          suggestion: generateSuggestion(varName, funcName, occurrences.length)
        });
      }
    }
  }
  
  return duplicates;
}

/**
 * Generate refactoring suggestions
 */
function generateSuggestion(varName, funcName, count) {
  // Common patterns with descriptive names
  const descriptiveMap = {
    'id': `${funcName}Id`,
    'text': `${funcName}Text`,
    'data': `${funcName}Data`,
    'result': `${funcName}Result`,
    'res': `${funcName}Response`,
    'el': `${funcName}Element`,
    'temp': `${funcName}Temp`,
    'collapsed': `${funcName}Collapsed`,
    'item': `${funcName}Item`,
    'value': `${funcName}Value`,
    'section': `${funcName}Section`,
    'html': `${funcName}Html`,
    'template': `${funcName}Template`,
    'cat': `${funcName}Category`
  };

  const suggestions = [];

  // Strategy 1: Use descriptive names
  if (descriptiveMap[varName]) {
    suggestions.push({
      strategy: 'descriptive',
      pattern: `const ${varName}`,
      replacement: `const ${descriptiveMap[varName]}`,
      description: `Rename to: ${descriptiveMap[varName]}`
    });
  }

  // Strategy 2: Use numbered suffix
  for (let i = 1; i <= count; i++) {
    suggestions.push({
      strategy: 'numbered',
      pattern: `const ${varName}`,
      replacement: `const ${varName}${i}`,
      description: `Use numbered suffix: ${varName}${i}`,
      occurrence: i
    });
  }

  return suggestions;
}

/**
 * Main analysis and reporting
 */
function analyzeAllFiles() {
  const jsFiles = getJsFiles(BEHAVIORS_DIR);
  const allDuplicates = [];
  
  console.log(`\n📂 Scanning ${jsFiles.length} files in ${BEHAVIORS_DIR}...\n`);
  
  for (const file of jsFiles) {
    const dups = analyzeFile(file);
    allDuplicates.push(...dups);
  }

  // Sort by file, then by variable
  allDuplicates.sort((a, b) => {
    if (a.relPath !== b.relPath) return a.relPath.localeCompare(b.relPath);
    return a.variable.localeCompare(b.variable);
  });

  // Group by file
  const byFile = {};
  for (const dup of allDuplicates) {
    if (!byFile[dup.relPath]) byFile[dup.relPath] = [];
    byFile[dup.relPath].push(dup);
  }

  // Print report
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           COMPREHENSIVE DUPLICATE VARIABLE ANALYSIS               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 Summary:`);
  console.log(`   Total Duplicate Events: ${allDuplicates.length}`);
  console.log(`   Files Affected: ${Object.keys(byFile).length}`);
  console.log(`   Target: < 10 duplicates`);
  console.log(`   Status: ${allDuplicates.length < 10 ? '✅ PASSING' : '🔴 FAILING'}\n`);

  // Show top files
  console.log('📄 TOP FILES BY DUPLICATE COUNT:\n');
  const fileList = Object.entries(byFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 15);

  for (const [file, dups] of fileList) {
    const uniqueVars = new Set(dups.map(d => d.variable)).size;
    console.log(`   ${file}`);
    console.log(`   └─ ${dups.length} duplicate events (${uniqueVars} unique variables)\n`);

    // Show variables in this file
    const varMap = {};
    for (const dup of dups) {
      if (!varMap[dup.variable]) varMap[dup.variable] = [];
      varMap[dup.variable].push(dup);
    }

    for (const [varName, varDups] of Object.entries(varMap)) {
      const totalOccurrences = varDups.reduce((sum, d) => sum + d.occurrences, 0);
      console.log(`      "${varName}" → ${totalOccurrences} times in ${varDups[0].function}`);
      if (varDups[0].suggestion && varDups[0].suggestion.length > 0) {
        const best = varDups[0].suggestion[0];
        console.log(`         💡 ${best.description}`);
      }
      console.log(`         📍 Lines: ${varDups[0].locations.map(l => l.lineNum).join(', ')}`);
      console.log('');
    }
  }

  // Save detailed JSON report
  const report = {
    summary: {
      totalDuplicates: allDuplicates.length,
      filesAffected: Object.keys(byFile).length,
      target: 10,
      status: allDuplicates.length < 10 ? 'PASSING' : 'FAILING'
    },
    topFiles: Object.entries(byFile)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .map(([file, dups]) => ({
        file,
        duplicateCount: dups.length,
        uniqueVariables: new Set(dups.map(d => d.variable)).size,
        variables: [...new Set(dups.map(d => d.variable))]
      })),
    allDuplicates: allDuplicates.map(d => ({
      file: d.relPath,
      variable: d.variable,
      function: d.function,
      occurrences: d.occurrences,
      lines: d.locations.map(l => l.lineNum),
      suggestion: d.suggestion[0]?.description || 'Manual review needed'
    }))
  };

  fs.writeFileSync('./data/duplicate-refactor-report.json', JSON.stringify(report, null, 2));
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Report saved to: data/duplicate-refactor-report.json`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  return allDuplicates;
}

// Run analysis
const duplicates = analyzeAllFiles();
process.exit(duplicates.length < 10 ? 0 : 1);
