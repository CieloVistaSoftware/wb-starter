#!/usr/bin/env node
/**
 * WB Framework - Scope-Aware Duplicate Detection
 * Runs as: npm run test:duplicates
 * Part of: npm test (compliance checks)
 * 
 * FAST-FAIL: Exits with code 1 if TRUE same-scope duplicates found
 * 
 * This detector properly understands JavaScript scoping:
 * - Function scope for var declarations
 * - Block scope for let/const declarations
 * - Different functions CAN reuse variable names (not duplicates)
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
  }

  async run() {
    console.log('\n🔍 WB Framework - Scope-Aware Duplicate Detection\n');
    
    const viewmodelsDir = path.join(PROJECT_DIR, 'src/wb-viewmodels');
    
    if (!fs.existsSync(viewmodelsDir)) {
      console.log('✅ No duplicates found (src/wb-viewmodels directory not found)');
      return { passed: true, duplicatesFound: 0 };
    }

    this.files = this.getAllJSFiles(viewmodelsDir);
    console.log(`📊 Scanning ${this.files.length} JavaScript files...\n`);

    for (const file of this.files) {
      this.scanFile(file);
    }

    const passed = this.issues.length === 0;
    
    if (!passed) {
      this.reportIssues();
    } else {
      console.log('✅ No same-scope duplicate variable declarations found!\n');
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
    } catch (e) {
      // Skip files with syntax errors (they'll fail elsewhere)
      console.warn(`   ⚠️  Parse error in ${relativePath}: ${e.message}`);
      return;
    }

    // Track scopes as a stack
    // Each scope is a Map of varName -> { kind, line }
    const scopeStack = [new Map()]; // Start with module scope

    const pushScope = () => {
      scopeStack.push(new Map());
    };

    const popScope = () => {
      scopeStack.pop();
    };

    const currentScope = () => scopeStack[scopeStack.length - 1];
    
    // For var, we need function scope (not block scope)
    const functionScope = () => {
      // Walk back to find nearest function scope (or module scope at index 0)
      for (let i = scopeStack.length - 1; i >= 0; i--) {
        if (scopeStack[i]._isFunctionScope || i === 0) {
          return scopeStack[i];
        }
      }
      return scopeStack[0];
    };

    const declareVariable = (name, kind, line) => {
      // var is function-scoped, let/const are block-scoped
      const scope = kind === 'var' ? functionScope() : currentScope();
      
      if (scope.has(name)) {
        const existing = scope.get(name);
        // Only report if it's a true redeclaration in same scope
        // var can be redeclared (though not recommended), let/const cannot
        if (kind !== 'var' || existing.kind !== 'var') {
          this.issues.push({
            file: relativePath,
            variable: name,
            kind,
            line,
            existingLine: existing.line,
            existingKind: existing.kind
          });
        }
      } else {
        scope.set(name, { kind, line });
      }
    };

    // Custom walker that tracks scopes
    const self = this;
    
    const scopeCreators = {
      FunctionDeclaration(node, state, c) {
        // Function name is in parent scope
        if (node.id) {
          declareVariable(node.id.name, 'function', node.loc.start.line);
        }
        pushScope();
        currentScope()._isFunctionScope = true;
        // Parameters are in function scope
        for (const param of node.params) {
          self.extractParamNames(param).forEach(name => {
            declareVariable(name, 'param', param.loc?.start.line || node.loc.start.line);
          });
        }
        c(node.body, state);
        popScope();
      },
      
      FunctionExpression(node, state, c) {
        pushScope();
        currentScope()._isFunctionScope = true;
        // Named function expression - name only visible inside
        if (node.id) {
          declareVariable(node.id.name, 'function', node.loc.start.line);
        }
        for (const param of node.params) {
          self.extractParamNames(param).forEach(name => {
            declareVariable(name, 'param', param.loc?.start.line || node.loc.start.line);
          });
        }
        c(node.body, state);
        popScope();
      },
      
      ArrowFunctionExpression(node, state, c) {
        pushScope();
        currentScope()._isFunctionScope = true;
        for (const param of node.params) {
          self.extractParamNames(param).forEach(name => {
            declareVariable(name, 'param', param.loc?.start.line || node.loc.start.line);
          });
        }
        if (node.body.type === 'BlockStatement') {
          c(node.body, state);
        } else {
          // Expression body - still walk it for nested functions
          c(node.body, state);
        }
        popScope();
      },
      
      BlockStatement(node, state, c) {
        pushScope();
        for (const stmt of node.body) {
          c(stmt, state);
        }
        popScope();
      },
      
      ForStatement(node, state, c) {
        pushScope();
        if (node.init) c(node.init, state);
        if (node.test) c(node.test, state);
        if (node.update) c(node.update, state);
        c(node.body, state);
        popScope();
      },
      
      ForInStatement(node, state, c) {
        pushScope();
        c(node.left, state);
        c(node.right, state);
        c(node.body, state);
        popScope();
      },
      
      ForOfStatement(node, state, c) {
        pushScope();
        c(node.left, state);
        c(node.right, state);
        c(node.body, state);
        popScope();
      },
      
      CatchClause(node, state, c) {
        pushScope();
        if (node.param) {
          self.extractParamNames(node.param).forEach(name => {
            declareVariable(name, 'catch', node.param.loc?.start.line || node.loc.start.line);
          });
        }
        c(node.body, state);
        popScope();
      },
      
      VariableDeclaration(node, state, c) {
        const kind = node.kind; // 'var', 'let', or 'const'
        for (const decl of node.declarations) {
          self.extractPatternNames(decl.id).forEach(name => {
            declareVariable(name, kind, decl.loc?.start.line || node.loc.start.line);
          });
          if (decl.init) {
            c(decl.init, state);
          }
        }
      },
      
      ClassDeclaration(node, state, c) {
        if (node.id) {
          declareVariable(node.id.name, 'class', node.loc.start.line);
        }
        if (node.superClass) c(node.superClass, state);
        c(node.body, state);
      },
      
      ImportDeclaration(node, state, c) {
        for (const spec of node.specifiers) {
          declareVariable(spec.local.name, 'import', spec.loc?.start.line || node.loc.start.line);
        }
      }
    };

    // Walk with our custom handlers
    walk.recursive(ast, null, scopeCreators, walk.base);
  }

  // Extract names from destructuring patterns
  extractPatternNames(pattern) {
    const names = [];
    
    const extract = (node) => {
      if (!node) return;
      
      switch (node.type) {
        case 'Identifier':
          names.push(node.name);
          break;
        case 'ObjectPattern':
          for (const prop of node.properties) {
            if (prop.type === 'RestElement') {
              extract(prop.argument);
            } else {
              extract(prop.value);
            }
          }
          break;
        case 'ArrayPattern':
          for (const elem of node.elements) {
            if (elem) extract(elem);
          }
          break;
        case 'RestElement':
          extract(node.argument);
          break;
        case 'AssignmentPattern':
          extract(node.left);
          break;
      }
    };
    
    extract(pattern);
    return names;
  }

  // Extract names from function parameters
  extractParamNames(param) {
    return this.extractPatternNames(param);
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
    console.error(`   Found: ${this.issues.length} true duplicate(s)\n`);

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
        console.error(`      ⚠️  "${issue.variable}" (${issue.kind}) at line ${issue.line}`);
        console.error(`          Already declared as ${issue.existingKind} at line ${issue.existingLine}`);
      });
      fileNum++;
    }
    console.error('');
  }
}

async function main() {
  const detector = new ScopeAwareDuplicateDetector();
  const result = await detector.run();
  
  if (!result.passed) {
    console.error(`\n   Fix: Rename the duplicate variable or use a different scope\n`);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Detection error:', err);
  process.exit(1);
});
