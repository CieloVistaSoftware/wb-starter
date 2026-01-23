/**
 * Find CSS OOP Compliance Issues
 * Scans for hardcoded colors and !important usage
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', 'test-results', '.playwright-artifacts'];

// Files allowed to have hardcoded colors
const COLOR_EXCEPTION_FILES = ['themes.css', 'wb-signature.css', 'variables.css', 'demo.css', 'components.css', 'site.css', 'transitions.css', 'wb-grayscale.css', 'wb-grayscale-dark.css', 'builder.css', 'audio.css'];

function getCssFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        getCssFiles(fullPath, files);
      }
    } else if (entry.name.endsWith('.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

function isInVarFallback(content, match, matchIndex) {
  const before = content.substring(0, matchIndex);
  const lastSemicolon = before.lastIndexOf(';');
  const lastBrace = before.lastIndexOf('{');
  const propStart = Math.max(lastSemicolon, lastBrace) + 1;
  const currentProp = before.substring(propStart);
  
  let depth = 0;
  let i = 0;
  while (i < currentProp.length) {
    if (currentProp.substring(i, i + 4) === 'var(') {
      depth++;
      i += 4;
    } else if (currentProp[i] === ')') {
      depth--;
      i++;
    } else {
      i++;
    }
  }
  return depth > 0;
}

function isInShadow(content, matchIndex) {
  const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
  const lineEnd = content.indexOf('\n', matchIndex);
  const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return /box-shadow|text-shadow|--shadow/i.test(line);
}

function isBlackWhiteTransparency(match, content, matchIndex) {
  if (!match.startsWith('rgba(')) return false;
  const after = content.substring(matchIndex, matchIndex + 50);
  return /rgba\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)/.test(after);
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

// Find hardcoded colors
console.log('\n=== HARDCODED COLORS ===\n');
const cssFiles = getCssFiles(ROOT);
const colorViolations = [];

for (const file of cssFiles) {
  const filename = path.basename(file);
  if (COLOR_EXCEPTION_FILES.includes(filename)) continue;
  
  const relPath = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf-8');
  const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/gi;
  let match;
  
  while ((match = colorRegex.exec(content)) !== null) {
    const matchStr = match[0];
    const matchIdx = match.index;
    
    if (isInVarFallback(content, matchStr, matchIdx)) continue;
    if (isBlackWhiteTransparency(matchStr, content, matchIdx)) continue;
    if (isInShadow(content, matchIdx)) continue;
    
    const lineStart = content.lastIndexOf('\n', matchIdx) + 1;
    const lineEnd = content.indexOf('\n', matchIdx);
    const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
    
    const lineNum = getLineNumber(content, matchIdx);
    colorViolations.push({
      file: relPath,
      line: lineNum,
      color: matchStr,
      context: line.trim().substring(0, 60)
    });
  }
}

console.log(`Found ${colorViolations.length} hardcoded colors:\n`);
colorViolations.forEach(v => {
  console.log(`${v.file}:${v.line} - ${v.color}`);
  console.log(`  ${v.context}`);
});

// Find !important usage
console.log('\n\n=== !IMPORTANT USAGE ===\n');
let totalImportant = 0;
const importantByFile = [];

for (const file of cssFiles) {
  const relPath = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.match(/!important/g);
  if (matches) {
    totalImportant += matches.length;
    importantByFile.push({ file: relPath, count: matches.length });
  }
}

console.log(`Total !important usage: ${totalImportant} (threshold: < 50)\n`);
importantByFile.sort((a, b) => b.count - a.count);
importantByFile.forEach(f => {
  console.log(`${f.file}: ${f.count}`);
});

// Write results to JSON
const results = {
  hardcodedColors: colorViolations,
  importantUsage: {
    total: totalImportant,
    byFile: importantByFile
  },
  timestamp: new Date().toISOString()
};

fs.writeFileSync(
  path.join(ROOT, 'data', 'css-issues.json'),
  JSON.stringify(results, null, 2)
);

console.log('\n\nResults written to data/css-issues.json');
