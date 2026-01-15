#!/usr/bin/env node
/**
 * WB Framework - Scope-Aware Duplicate Detection
 * Runs as: npm run test:duplicates
 * Part of: npm test (compliance checks)
 * 
 * Uses acorn parser for accurate JavaScript scope analysis.
 * Only flags TRUE duplicates in the same scope.
 * 
 * FAST-FAIL: Exits with code 1 if real duplicates found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');

class ScopeAwareDuplicateDetector {
  constructor() {
    this.issues = [];
    this.files = [];
    this.totalScanned = 0;
    this.parseErrors = [];
  }

  async run() {
    console.log('\n🔍 WB Framework - Scope-Aware Duplicate Detection\n');
    
    const viewmodelsDir = path.join(PROJECT_DIR, 'src/wb-viewmodels');
    
    if (!fs.existsSync(viewmodelsDir)) {
      console.log('✅ No src/wb-viewmodels directory - skipping');
      return { passed: true, duplicatesFound: 0 };
    }

    this.files = this.getAllJSFiles(viewmodelsDir);
    console.log(`📊 Scanning ${this.files.length} JavaScript files...\n`);

    for (const file of this.files) {
      this.scanFile(file);
    }

    const passed = this.issues.length === 0;
    
    if (this.parseErrors.length > 0) {
      console.log(`⚠️  ${this.parseErrors.length} files had parse errors (skipped):\n`);
      this.parseErrors.forEach(err => {
        console.log(`   - ${err.file}: ${err.message}`);
      });
      console.log('');
    }

    if (!passed) {
      this.reportIssues();
    } else {
      console.log(`✅ No same-scope duplicate declarations found!`);
      console.log(`   Scanned ${this.totalScanned} variable declarations across ${this.files.length} files\n`);
    }

    return { passed, duplicatesFound: this.issues.length };
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(PROJECT_DIR, filePath);
    
    let ast;
    try {
      ast = acorn.parse(content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
        allowHashBang: true
      });
    } catch (err) {
      this.parseErrors.push({
        file: relativePath,
        message: err.message.split('\n')[0]
      });
      return;
    }

    // Track declarations per scope
    // Key: scope identifier, Value: Map of varName -> [locations]
    const scopeDeclarations = new Map();
    let scopeId = 0;
    const scopeStack = [scopeId]; // Start with module scope
    scopeDeclarations.set(scopeId, new Map());

    const enterScope = () => {
      scopeId++;
      scopeStack.push(scopeId);
      scopeDeclarations.set(scopeId, new Map());
    };

    const exitScope = () => {
      scopeStack.pop();
    };

    const currentScope = () => scopeStack[scopeStack.length - 1];

    const recordDeclaration = (name, loc) => {
      const scope = currentScope();
      const declarations = scopeDeclarations.get(scope);
      if (!declarations.has(name)) {
        declarations.set(name, []);
      }
      declarations.get(name).push(loc.start.line);
      this.totalScanned++;
    };

    // Custom walker to handle scopes properly
    const walkNode = (node) => {
      if (!node || typeof node !== 'object') return;

      // Handle scope-creating nodes
      const scopeCreators = [
        'FunctionDeclaration',
        'FunctionExpression', 
        'ArrowFunctionExpression',
        'BlockStatement',
        'ForStatement',
        'ForInStatement',
        'ForOfStatement',
        'WhileStatement',
        'DoWhileStatement',
        'SwitchStatement',
        'CatchClause'
      ];

      const isNewScope = scopeCreators.includes(node.type);
      
      // Special handling for function parameters
      if (node.type === 'FunctionDeclaration' || 
          node.type === 'FunctionExpression' || 
          node.type === 'ArrowFunctionExpression') {
        
        // Function name is in outer scope (for FunctionDeclaration)
        if (node.type === 'FunctionDeclaration' && node.id) {
          recordDeclaration(node.id.name, node.id.loc);
        }
        
        // Enter function scope for params and body
        enterScope();
        
        // Record parameters in function scope
        if (node.params) {
          for (const param of node.params) {
            this.extractBindingNames(param, recordDeclaration);
          }
        }
        
        // Walk body
        if (node.body) {
          if (node.body.type === 'BlockStatement') {
            // Don't create another scope for the block - we already did
            for (const stmt of node.body.body || []) {
              walkNode(stmt);
            }
          } else {
            // Arrow function with expression body
            walkNode(node.body);
          }
        }
        
        exitScope();
        return;
      }

      // Handle variable declarations
      if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          this.extractBindingNames(decl.id, recordDeclaration);
          if (decl.init) {
            walkNode(decl.init);
          }
        }
        return;
      }

      // Handle catch clause (has its own scope for the error param)
      if (node.type === 'CatchClause') {
        enterScope();
        if (node.param) {
          this.extractBindingNames(node.param, recordDeclaration);
        }
        if (node.body) {
          for (const stmt of node.body.body || []) {
            walkNode(stmt);
          }
        }
        exitScope();
        return;
      }

      // Handle block statements (create scope for let/const)
      if (node.type === 'BlockStatement') {
        enterScope();
        for (const stmt of node.body || []) {
          walkNode(stmt);
        }
        exitScope();
        return;
      }

      // Handle for loops (loop variable scope)
      if (node.type === 'ForStatement') {
        enterScope();
        if (node.init) walkNode(node.init);
        if (node.test) walkNode(node.test);
        if (node.update) walkNode(node.update);
        if (node.body) {
          if (node.body.type === 'BlockStatement') {
            for (const stmt of node.body.body || []) {
              walkNode(stmt);
            }
          } else {
            walkNode(node.body);
          }
        }
        exitScope();
        return;
      }

      // Handle for-in/for-of
      if (node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
        enterScope();
        if (node.left) walkNode(node.left);
        if (node.right) walkNode(node.right);
        if (node.body) {
          if (node.body.type === 'BlockStatement') {
            for (const stmt of node.body.body || []) {
              walkNode(stmt);
            }
          } else {
            walkNode(node.body);
          }
        }
        exitScope();
        return;
      }

      // Walk all child nodes
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            walkNode(item);
          }
        } else if (child && typeof child === 'object' && child.type) {
          walkNode(child);
        }
      }
    };

    // Walk the entire AST
    walkNode(ast);

    // Check each scope for duplicates
    for (const [scope, declarations] of scopeDeclarations) {
      for (const [varName, lines] of declarations) {
        if (lines.length > 1) {
          this.issues.push({
            file: relativePath,
            variable: varName,
            lines: lines,
            count: lines.length
          });
        }
      }
    }
  }

  /**
   * Extract all binding names from a pattern (handles destructuring)
   */
  extractBindingNames(pattern, callback) {
    if (!pattern) return;
    
    switch (pattern.type) {
      case 'Identifier':
        callback(pattern.name, pattern.loc);
        break;
      case 'ObjectPattern':
        for (const prop of pattern.properties) {
          if (prop.type === 'RestElement') {
            this.extractBindingNames(prop.argument, callback);
          } else {
            this.extractBindingNames(prop.value, callback);
          }
        }
        break;
      case 'ArrayPattern':
        for (const elem of pattern.elements) {
          if (elem) {
            if (elem.type === 'RestElement') {
              this.extractBindingNames(elem.argument, callback);
            } else {
              this.extractBindingNames(elem, callback);
            }
          }
        }
        break;
      case 'RestElement':
        this.extractBindingNames(pattern.argument, callback);
        break;
      case 'AssignmentPattern':
        this.extractBindingNames(pattern.left, callback);
        break;
    }
  }

  getAllJSFiles(dir) {
    const files = [];
    const walk = (directory) => {
      try {
        const items = fs.readdirSync(directory);
        for (const item of items) {
          const fullPath = path.join(directory, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (!item.startsWith('.') && item !== 'node_modules') {
              walk(fullPath);
            }
          } else if (item.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch (e) {
        // Silently skip
      }
    };
    walk(dir);
    return files;
  }

  reportIssues() {
    console.error(`\n❌ FAST-FAIL: SAME-SCOPE DUPLICATE DECLARATIONS\n`);
    console.error(`   Found: ${this.issues.length} duplicate variable patterns\n`);

    // Group by file
    const byFile = {};
    this.issues.forEach(issue => {
      if (!byFile[issue.file]) {
        byFile[issue.file] = [];
      }
      byFile[issue.file].push(issue);
    });

    let fileNum = 1;
    for (const [file, issues] of Object.entries(byFile)) {
      console.error(`   ${fileNum}. ${file}`);
      issues.forEach(issue => {
        console.error(`      ⚠️  "${issue.variable}" declared ${issue.count} times in same scope`);
        console.error(`          Lines: ${issue.lines.join(', ')}`);
      });
      fileNum++;
    }
    
    console.error('\n   These are TRUE duplicates in the same scope - they will cause runtime errors.');
    console.error('   Fix: Rename one of the declarations or refactor the scope.\n');
  }
}

async function main() {
  const detector = new ScopeAwareDuplicateDetector();
  const result = await detector.run();
  
  if (!result.passed) {
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Detection error:', err);
  process.exit(1);
});
