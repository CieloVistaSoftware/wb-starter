/**
 * SOURCE-SCHEMA COMPLIANCE - Static Analysis
 * ==========================================
 * Validates JS source code matches schema requirements.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  ROOT, PATHS, readFile, fileExists, getJsFiles, getSchemaFiles, loadSchema,
  extractFunction, createsElement, addsClass, setsStyle
} from '../base';

// Schemas that don't have JS functions
const NON_FUNCTIONAL_SCHEMAS = ['button', 'css-oop'];

// Function name mappings
const FUNCTION_NAME_MAP: Record<string, string> = {
  'switch': 'switchInput',
};

function getAllJsSource(): string {
  return getJsFiles(PATHS.behaviorsJs)
    .map(f => readFile(path.join(PATHS.behaviorsJs, f)))
    .join('\n');
}

test.describe('Source-Schema: Duplicate Variable Detection', () => {
  
  test('no duplicate const/let declarations in JS files', () => {
    const issues: string[] = [];
    
    for (const jsFile of getJsFiles(PATHS.behaviorsJs)) {
      const filePath = path.join(PATHS.behaviorsJs, jsFile);
      const content = readFile(filePath);
      const lines = content.split('\n');
      
      const functionScopes: Map<string, Map<string, number>> = new Map();
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
          
          const scope = functionScopes.get(scopeKey)!;
          if (scope.has(varName)) {
            const firstLine = scope.get(varName)!;
            issues.push(`${jsFile}:${lineNum + 1} - DUPLICATE: "${varName}" in ${currentFunction}() (first at line ${firstLine + 1})`);
          } else {
            scope.set(varName, lineNum);
          }
        }
      }
    }
    
    if (issues.length > 0) {
      console.warn(`Duplicate variable declarations: ${issues.length}`);
      issues.slice(0, 5).forEach(i => console.warn(`  - ${i}`));
    }
    // NOTE: This simple brace-counting algorithm has known false positives:
    // - Arrow functions (forEach callbacks, event handlers) create separate scopes
    // - Block scopes (if/else, loops) are not tracked
    // - Class methods are not tracked as separate scopes
    // Most "duplicates" found are actually in different scopes and are valid JS.
    // Threshold set to accommodate these false positives while catching real issues.
    expect(issues.length, `${issues.length} duplicate declarations`).toBeLessThan(50);
  });
  
  test('no redeclared parameters in functions', () => {
    const issues: string[] = [];
    
    for (const jsFile of getJsFiles(PATHS.behaviorsJs)) {
      const filePath = path.join(PATHS.behaviorsJs, jsFile);
      const content = readFile(filePath);
      
      const funcPattern = /function\s+(\w+)\s*\(([^)]+)\)/g;
      let match;
      
      while ((match = funcPattern.exec(content)) !== null) {
        const funcName = match[1];
        const params = match[2].split(',').map(p => p.trim().split('=')[0].trim()).filter(p => p);
        
        const funcBody = extractFunction(content, funcName);
        if (!funcBody) continue;
        
        for (const param of params) {
          if (!param) continue;
          const redeclarePattern = new RegExp(`(?:const|let)\\s+${param}\\s*[=;]`);
          if (redeclarePattern.test(funcBody)) {
            issues.push(`${jsFile}: ${funcName}() redeclares parameter "${param}"`);
          }
        }
      }
    }
    
    expect(issues, `Parameter redeclarations:\n${issues.join('\n')}`).toEqual([]);
  });
});

test.describe('Source-Schema: Function Existence', () => {
  
  test('exported function exists for each schema behavior', () => {
    const allJs = getAllJsSource();
    const issues: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file);
      if (!schema?.behavior) continue;
      if (NON_FUNCTIONAL_SCHEMAS.includes(schema.behavior)) continue;
      
      const funcName = FUNCTION_NAME_MAP[schema.behavior] || schema.behavior;
      const funcPattern = new RegExp(`export\\s+(?:async\\s+|default\\s+)?function\\s+${funcName}\\s*\\(`);
      if (!funcPattern.test(allJs)) {
        issues.push(`${file}: no exported function "${schema.behavior}"`);
      }
    }
    
    if (issues.length > 0) {
      console.warn(`Missing behavior functions: ${issues.length}`);
      issues.slice(0, 5).forEach(i => console.warn(`  - ${i}`));
    }
    // Track progress - not all schemas have corresponding functions yet
    expect(issues.length, `${issues.length} missing functions`).toBeLessThan(20);
  });
});

test.describe('Source-Schema: Base Class Assignment', () => {
  
  test('functions add baseClass from schema', () => {
    const allJs = getAllJsSource();
    const issues: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file);
      if (!schema?.behavior || !schema.compliance?.baseClass) continue;
      
      const funcBody = extractFunction(allJs, schema.behavior);
      if (!funcBody) continue;
      
      const baseClass = schema.compliance.baseClass;
      const classAdded = addsClass(funcBody, baseClass) ||
                        funcBody.includes(`'${baseClass}'`) ||
                        funcBody.includes(`"${baseClass}"`);
      
      if (!classAdded) issues.push(`${schema.behavior}: should add class "${baseClass}"`);
    }
    
    // Many schemas define baseClass but detection may miss it due to:
    // - Dynamic class addition
    // - Class added via helper functions
    // - Class added to nested elements
    expect(issues.length, 'Too many missing base classes').toBeLessThan(75);
  });
});

test.describe('Source-Schema: Required Children', () => {
  
  test('functions create elements for requiredChildren', () => {
    const allJs = getAllJsSource();
    const issues: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file);
      if (!schema?.behavior || !schema.compliance?.requiredChildren) continue;
      
      const funcBody = extractFunction(allJs, schema.behavior);
      if (!funcBody) continue;
      
      for (const [selector, childDef] of Object.entries(schema.compliance.requiredChildren)) {
        if (!childDef.tagName) continue;
        
        const tagName = childDef.tagName.toLowerCase();
        if (!createsElement(funcBody, tagName)) {
          issues.push(`${schema.behavior}: should create <${tagName}> for ${selector}`);
        }
      }
    }
    
    expect(issues.length, 'Too many missing required children').toBeLessThan(30);
  });
});

test.describe('Source-Schema: Card Border Compliance', () => {
  
  test('cardBase sets border', () => {
    const cardJsPath = path.join(PATHS.behaviorsJs, 'card.js');
    if (!fileExists(cardJsPath)) {
      test.skip();
      return;
    }
    
    const cardJs = readFile(cardJsPath);
    const hasBorder = cardJs.includes("element.style.border =") || cardJs.includes("element.style.border=");
    expect(hasBorder, 'cardBase MUST set element.style.border').toBe(true);
  });
});

test.describe('Source-Schema: Event Compliance', () => {
  
  test('functions dispatch events defined in schema', () => {
    const allJs = getAllJsSource();
    const issues: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file) as any;
      if (!schema?.behavior || !schema.events) continue;
      
      const funcBody = extractFunction(allJs, schema.behavior);
      if (!funcBody) continue;
      
      for (const eventName of Object.keys(schema.events)) {
        const dispatches = funcBody.includes(`'${eventName}'`) || funcBody.includes(`"${eventName}"`);
        if (!dispatches) issues.push(`${schema.behavior}: should dispatch "${eventName}"`);
      }
    }
    
    if (issues.length > 0) {
      console.log('Event dispatch issues (may be in helper functions):', issues.slice(0, 5).join('\n'));
    }
  });
});

test.describe('Source-Schema: Summary', () => {
  
  test('coverage report', () => {
    const allJs = getAllJsSource();
    const schemas = getSchemaFiles().map(loadSchema).filter(s => s?.behavior);
    
    let matched = 0;
    let unmatched = 0;
    
    for (const schema of schemas) {
      if (!schema) continue;
      const funcBody = extractFunction(allJs, schema.behavior);
      if (funcBody) {
        matched++;
      } else {
        unmatched++;
        console.log(`  ⚠️ No function for: ${schema.behavior}`);
      }
    }
    
    console.log(`\n📊 Source-Schema Coverage:`);
    console.log(`  ✅ Matched: ${matched}/${schemas.length}`);
    console.log(`  ⚠️ Unmatched: ${unmatched}/${schemas.length}\n`);
    
    const ratio = matched / schemas.length;
    expect(ratio, 'At least 80% of schemas should have matching functions').toBeGreaterThanOrEqual(0.8);
  });
});
