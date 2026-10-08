/**
 * SOURCE-SCHEMA COMPLIANCE - Static Analysis
 * ==========================================
 * Validates JS source code matches schema requirements.
 */

import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';
import {
  ROOT, PATHS, readFile, fileExists, getJsFiles, getSchemaFiles, loadSchema,
  extractFunction, createsElement
} from '../base';

// Schemas that don't have JS functions -- these document/describe the
// SYSTEM rather than a single behavioral component, so they can never have
// a matching `export function <behavior>()` (#344 triage):
//   - button: no dedicated JS function (native <button> + attribute
//     behaviors handle it)
//   - css-oop: documents CSS architecture rules, not a component
//   - behaviors: "Master schema defining all behavior metadata" -- meta,
//     documents the behavior SYSTEM itself, same as css-oop
//   - home-page: schemaType "page" -- composes other components (cardhero,
//     cardstats, etc.) via $layout; the page has no behavior of its own
const NON_FUNCTIONAL_SCHEMAS = ['button', 'css-oop', 'behaviors', 'home-page'];

// Function name mappings -- kept in sync with the REAL runtime alias table,
// wb-viewmodels/index.js's `exportAliases` (#344: this map had silently
// drifted out of sync with that table, causing source-schema-compliance to
// report "fix-card"/"drawer-layout" as missing functions even though both
// already have real, working, runtime-registered implementations --
// fixCard() in fix-card.js and drawerLayout() in layouts.js -- just under a
// camelCase export name the hyphenated schema.behavior string can never
// literally match without this map).
/**
 * Behavior name -> exported function name. #344: this was a hand copy of the
 * runtime's table and drifted (copybutton -> copyButton and searchfield ->
 * searchField were reported "missing" while index.js resolved them fine), so
 * it now READS src/wb-viewmodels/index.js's exportAliases. Only names that
 * table does not carry are listed here.
 */
function runtimeExportAliases(): Record<string, string> {
  const src = readFile(path.join(PATHS.behaviorsJs, 'index.js'));
  const block = src.match(/const exportAliases = \{([\s\S]*?)\n\};/);
  const out: Record<string, string> = {};
  if (!block) return out;
  const code = block[1].replace(/\/\/.*$/gm, '');
  for (const m of code.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"](\w+)['"]/g)) out[m[1]] = m[2];
  return out;
}

const FUNCTION_NAME_MAP: Record<string, string> = {
  ...runtimeExportAliases(),
  // fix-card.js registers its default export as fixCard.
  'fix-card': 'fixCard',
  // semantics/dialog.js: `export { dialog as modal }` -- x-modal IS dialog().
  'modal': 'dialog',
};

function getAllJsSource(): string {
  return getJsFiles(PATHS.behaviorsJs)
    .map(f => readFile(path.join(PATHS.behaviorsJs, f)))
    .join('\n');
}

test.describe('Source-Schema: Duplicate Variable Detection', () => {
  
  // #344: "no duplicate const/let declarations in JS files" is retired. A real
  // duplicate in one scope is a SyntaxError, so loaded code cannot hold one;
  // the line-and-brace counter merged separate block scopes, and all 38 of
  // its hits on 2026-10-07 were legal (an if/else each declaring `figure`).
  // The bug it once surfaced, reading a name that was never declared
  // (cardminimizable's `footer`), is ESLint's no-undef, and
  // tests/compliance/lint-has-no-errors.spec.ts lints the whole repository
  // at zero errors, parse errors included.

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
    expect(issues.length, `${issues.length} missing functions`).toBeLessThanOrEqual(0) /* #344: pinned at the 2026-10-07 count; lower it as you fix, never raise it */;
  });
});

// #344: "functions add baseClass from schema" is retired. It asserted the rule
// #913 removed (no mandatory host class; behaviors inject classes where a
// stylesheet needs one), so it could only count behaviors for doing the right
// thing. The reasoning is at tests/behaviors/permutation-compliance.spec.ts,
// CHECK 1. compliance.baseClass stays in the schemas as a class-name source.

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
    
    expect(issues.length, 'Too many missing required children').toBeLessThanOrEqual(0) /* #344: pinned at the 2026-10-07 count; lower it as you fix, never raise it */;
  });
});

test.describe('Source-Schema: Card Border Compliance', () => {
  
  // #779: this used to demand `element.style.border =` in card.js -- an
  // inline style, which the no-inline-styles rule forbids outright. It only
  // ever passed on cardpricing's `featured` write, which had nothing to do
  // with the shared composition it claimed to check. What it was guarding --
  // every card gets a border -- is card.css's shared card rule, so that is
  // what is asserted now.
  test('shared card composition sets border', () => {
    const cardCssPath = path.join(ROOT, 'src', 'styles', 'behaviors', 'card.css');
    if (!fileExists(cardCssPath)) {
      test.skip();
      return;
    }

    const cardCss = readFile(cardCssPath);
    const sharedRule = cardCss.match(/\.x-card,\s*\narticle,[^{]*\{([^}]*)\}/);
    expect(sharedRule, 'card.css must declare the shared `.x-card, article, …` rule').not.toBeNull();
    expect(sharedRule![1], 'the shared card rule MUST set a border').toMatch(/\bborder:\s*1px solid/);
  });
});

test.describe('Source-Schema: Event Compliance', () => {
  
  // #344: every wb: event a schema declares is fired by the code. 47 were not
  // (2026-10-07): schemas promised dialog open/close, tooltip show/hide,
  // audio play/pause and more that nothing dispatched, and three named an
  // event the code fires under another name (chip dismiss/remove,
  // minimizable/cardminimizable, notification/cardnotification). The
  // schemas now declare what fires, so the count is exact.
  //
  // What counts as fired: the event name as a quoted literal anywhere in
  // src/ JavaScript, or one of the names a template below expands to. The
  // old check read only the exported function's body (extractFunction), so an
  // event fired from a helper in the same module counted as missing. Native
  // DOM events a schema documents (input, change, focus, blur, toggle) are the
  // browser's, not the behavior's, so only wb: names are held to this.
  test('every wb: event a schema declares is fired somewhere in src/', () => {
    const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name))
        : /\.m?js$/.test(e.name) ? [path.join(dir, e.name)] : []);
    const code = walk(path.join(ROOT, 'src')).map((f) => readFile(f)).join('\n');
    const literals = new Set([...code.matchAll(/['`](wb:[A-Za-z0-9:_-]+)['`]/g)].map((m) => m[1]));

    // Every `wb:${...}` template in src/, with the names it can produce. A new
    // template must be added here, and one that disappears must be removed, so
    // this list cannot drift from the code silently.
    const TEMPLATES: Record<string, string[]> = {
      'wb:${kind}:cancel': ['wb:confirm:cancel', 'wb:prompt:cancel'], // overlay.js openDialog(element, 'confirm'|'prompt')
      'wb:${kind}:ok': ['wb:confirm:ok', 'wb:prompt:ok'],
      'wb:cardbutton:${kind}': ['wb:cardbutton:primary', 'wb:cardbutton:secondary'], // card.js addActionButton
      'wb:${methodName}': [], // mvvm/schema-builder.js: one per $methods entry, not a schema event
    };
    const templatesInCode = [...new Set([...code.matchAll(/`(wb:[^`]*\$\{[^`]*)`/g)].map((m) => m[1]))].sort();
    expect(templatesInCode, 'wb: event templates in src/ (update TEMPLATES to match)').toEqual(Object.keys(TEMPLATES).sort());
    const fired = new Set([...literals, ...Object.values(TEMPLATES).flat()]);

    const issues: string[] = [];
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file) as any;
      if (!schema?.events) continue;
      for (const eventName of Object.keys(schema.events)) {
        if (eventName.startsWith('wb:') && !fired.has(eventName)) {
          issues.push(`${file}: declares "${eventName}", which nothing in src/ fires`);
        }
      }
    }
    expect(issues, 'Dispatch the event, or remove it from the schema (and its docs/behaviors page)').toEqual([]);
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
