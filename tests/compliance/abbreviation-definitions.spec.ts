/**
 * ABBREVIATION DEFINITION COMPLIANCE
 * ===================================
 * Ensures all abbreviations are properly defined on first use.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readFile, fileExists } from '../base';

const DOCS_DIR = path.join(ROOT, 'docs');
const README_FILE = path.join(ROOT, 'README.md');

const KNOWN_ABBREVIATIONS: Record<string, string> = {
  'WB': 'Web Behaviors', 'HCS': 'Harmonic Color System', 'CSS': 'Cascading Style Sheets',
  'HTML': 'HyperText Markup Language', 'JS': 'JavaScript', 'API': 'Application Programming Interface',
  'DOM': 'Document Object Model', 'UI': 'User Interface', 'UX': 'User Experience',
  'ARIA': 'Accessible Rich Internet Applications', 'CDN': 'Content Delivery Network',
  'NPM': 'Node Package Manager', 'CLI': 'Command Line Interface', 'IDE': 'Integrated Development Environment',
  'JSON': 'JavaScript Object Notation', 'CRUD': 'Create, Read, Update, Delete',
  'SPA': 'Single Page Application', 'PWA': 'Progressive Web App', 'SSR': 'Server-Side Rendering',
  'SSG': 'Static Site Generation', 'ESM': 'ECMAScript Modules', 'CJS': 'CommonJS',
  'RTL': 'Right-to-Left', 'LTR': 'Left-to-Right', 'OOP': 'Object-Oriented Programming',
};

const COMMON_ABBREVIATIONS = new Set([
  'CSS', 'HTML', 'JS', 'API', 'URL', 'HTTP', 'HTTPS', 'JSON', 'ID', 'XML',
  'RGB', 'HSL', 'SVG', 'PNG', 'JPG', 'GIF', 'PDF', 'FAQ', 'TODO', 'FIXME',
  'OK', 'VS', 'E.G', 'I.E', 'ETC', 'AM', 'PM', 'UTC', 'GMT',
]);

const PROJECT_ABBREVIATIONS = new Set(['WB', 'HCS']);

const EXCLUDE_PATTERNS = ['node_modules', '.git', 'dist', 'build', 'coverage', 'test-results', 'CHANGELOG.md', 'LICENSE'];

interface Violation { file: string; line: number; abbreviation: string; context: string; expectedFormat: string; }

function getMarkdownFiles(dir: string): string[] {
  if (!fileExists(dir)) return [];
  const files: string[] = [];
  
  function scan(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (EXCLUDE_PATTERNS.some(p => entry.name === p || fullPath.includes(p))) continue;
      if (entry.isDirectory()) scan(fullPath);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(fullPath);
    }
  }
  
  scan(dir);
  return files;
}

function checkAbbreviationDefinitions(content: string, filePath: string): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');
  const definedInFile = new Set<string>();
  
  const definitionPattern = /([A-Z][a-zA-Z\s]+)\s*\(([A-Z]{2,})\)/g;
  const abbreviationPattern = /\b([A-Z]{2,})\b/g;
  
  // First pass: find definitions
  for (const line of lines) {
    let match;
    while ((match = definitionPattern.exec(line)) !== null) {
      definedInFile.add(match[2]);
    }
  }
  
  // Second pass: find violations
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    if (line.trim().startsWith('```') || line.trim().startsWith('`')) continue;
    if (/^\s*[-*]\s*`/.test(line) || line.includes('```')) continue;
    
    const lineWithoutCode = line.replace(/`[^`]+`/g, '');
    let match;
    abbreviationPattern.lastIndex = 0;
    
    while ((match = abbreviationPattern.exec(lineWithoutCode)) !== null) {
      const abbr = match[1];
      if (COMMON_ABBREVIATIONS.has(abbr) || definedInFile.has(abbr)) continue;
      if (!PROJECT_ABBREVIATIONS.has(abbr)) continue;
      
      const hasDefinitionOnThisLine = new RegExp(`[A-Z][a-zA-Z\\s]+\\s*\\(${abbr}\\)`, 'g').test(line);
      
      if (!hasDefinitionOnThisLine) {
        const contentBefore = lines.slice(0, lineNum).join('\n') + '\n' + line.substring(0, match.index);
        const wasDefinedBefore = new RegExp(`[A-Z][a-zA-Z\\s]+\\s*\\(${abbr}\\)`, 'g').test(contentBefore);
        
        if (!wasDefinedBefore) {
          violations.push({
            file: filePath, line: lineNum + 1, abbreviation: abbr,
            context: line.trim().substring(0, 80) + (line.length > 80 ? '...' : ''),
            expectedFormat: `${KNOWN_ABBREVIATIONS[abbr] || 'Full Name'} (${abbr})`
          });
          definedInFile.add(abbr);
        }
      } else {
        definedInFile.add(abbr);
      }
    }
  }
  
  return violations;
}

test.describe('Abbreviation Definition Compliance', () => {
  
  test('all project abbreviations must be defined on first use in docs', () => {
    const mdFiles = [...getMarkdownFiles(DOCS_DIR), ...(fileExists(README_FILE) ? [README_FILE] : [])];
    const allViolations: Violation[] = [];
    
    for (const filePath of mdFiles) {
      const content = readFile(filePath);
      const violations = checkAbbreviationDefinitions(content, path.relative(ROOT, filePath));
      allViolations.push(...violations);
    }
    
    if (allViolations.length > 0) {
      const report = allViolations.map(v => 
        `  ${v.file}:${v.line}\n    Found: "${v.abbreviation}"\n    Expected: "${v.expectedFormat}"`
      ).join('\n\n');
      expect(allViolations, `\nAbbreviation Violations:\n${report}`).toEqual([]);
    }
  });
  
  test('known abbreviations list is complete', () => {
    const missingDefinitions = [...PROJECT_ABBREVIATIONS].filter(abbr => !KNOWN_ABBREVIATIONS[abbr]);
    expect(missingDefinitions, `Missing definitions: ${missingDefinitions.join(', ')}`).toEqual([]);
  });
});
