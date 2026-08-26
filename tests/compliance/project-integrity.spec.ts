import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { 
  getFiles, getHtmlFiles, readFile, fileExists, 
  stripDynamicContent, stripCodeExamples,
  ROOT, PATHS, relativePath, IssueCollector 
} from '../base';

/**
 * PROJECT INTEGRITY & LINK CHECKING
 * =================================
 * Deep validation of project structure to catch "missing file" errors.
 */

// Helper: Extract behavior names from index.js
function getRegisteredBehaviors(): Set<string> {
  const indexPath = path.join(PATHS.src, 'wb-viewmodels', 'index.js');
  const content = readFile(indexPath);
  const behaviors = new Set<string>();
  
  const match = content.match(/const behaviorModules = ({[\s\S]*?});/);
  if (match) {
    const cleanBody = match[1].replace(/\/\/.*$/gm, '');
    const entryRegex = /['"]?([a-zA-Z0-9_\-\/]+)['"]?\s*:\s*['"]/g;
    let keyMatch;
    
    while ((keyMatch = entryRegex.exec(cleanBody)) !== null) {
      behaviors.add(keyMatch[1]);
    }
  }
  return behaviors;
}

test.describe('Project Integrity', () => {
  
  test('all JS imports resolve to existing files', () => {
    const jsFiles = getFiles(PATHS.src, ['.js']);
    const issues = new IssueCollector();
    
    const ignoredImports = [
      '../src/core/wb-lazy.js', 
      './src/core/wb-lazy.js',
      '../core/wb-lazy.js'
    ];
    
    for (const file of jsFiles) {
      const content = readFile(file);
      const dir = path.dirname(file);
      
      const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        if (ignoredImports.includes(importPath)) continue;
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;
        
        let targetPath = importPath.startsWith('/')
          ? path.join(ROOT, importPath)
          : path.join(dir, importPath);
        
        const exists = fileExists(targetPath) || 
                       fileExists(targetPath + '.js') || 
                       fileExists(path.join(targetPath, 'index.js'));
                       
        if (!exists) {
          issues.add(`${relativePath(file)}: imports missing file '${importPath}'`);
        }
      }
    }
    
    // #863: this used to call issues.expectEmpty(), which throws carrying ONLY
    // the header string -- the collected list went to console.log and was lost
    // in CI output. Assert with expect() so the offending imports ride on the
    // failure itself, and so the "every test contains at least one expect()"
    // gate can see that this test asserts at all.
    expect(
      issues.all,
      `Broken JS imports found:\n${issues.all.join('\n')}`,
    ).toEqual([]);
  });

  test('all HTML resource links point to existing files', () => {
    const htmlFiles = [
      ...getFiles(PATHS.pages, ['.html']),
      ...getFiles(PATHS.public, ['.html']),
      ...getFiles(PATHS.demos, ['.html'])
    ];
    
    const issues = new IssueCollector();
    
    for (const file of htmlFiles) {
      const content = stripCodeExamples(stripDynamicContent(readFile(file)));
      
      // Negative lookbehind prevents matching data-src, x-src, etc.
      const linkRegex = /(?<![\w-])(?:src|href)=['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const linkPath = match[1];
        
        if (linkPath.startsWith('http') || 
            linkPath.startsWith('#') || 
            linkPath.startsWith('data:') ||
            linkPath.startsWith('mailto:') ||
            linkPath.startsWith('javascript:') ||
            linkPath.includes('${') ||
            linkPath.includes('{{') ||
            linkPath.includes('&lt;') ||
            linkPath.includes('&gt;')) {
          continue;
        }
        
        // Resolve against BOTH the file's own dir and the site root. Pages under
        // pages/ are injected into the SPA shell (base = site root), so a link
        // like "demos/sample.wav" resolves from root at runtime, not from
        // pages/. Standalone pages (public/, demos/) resolve from their own dir.
        // A file that exists under either base is valid.
        const clean = linkPath.split('?')[0].split('#')[0];
        const candidates = clean.startsWith('/')
          ? [path.join(ROOT, clean)]
          : [path.join(path.dirname(file), clean), path.join(ROOT, clean)];

        if (!candidates.some((c) => fileExists(c))) {
          issues.add(`${relativePath(file)}: links to missing file '${linkPath}'`);
        }
      }
    }
    
    // #872: this test was missed when #863 converted its two siblings above.
    // issues.expectEmpty('Broken HTML links found') throws carrying ONLY that
    // header, so the paths went to console.log and were lost in CI output --
    // you learned that links were broken but never which. It was also
    // invisible to the "every test contains at least one expect()" gate, which
    // matches /expect\s*[.(]/ on the body and cannot see an assertion hidden
    // behind a method name like `issues.expectEmpty`.
    //
    // Asserted at zero, not baselined. Measured: 3, all pointing at a
    // `wb-views-demo` that no longer exists (pages/demos.html,
    // demos/index.html, demos/registry-browser.html) — see #872.
    expect(
      issues.all,
      `${issues.count} broken HTML resource links:\n${issues.all.join('\n')}`,
    ).toEqual([]);
  });

  test('no redundant data-wb attributes on auto-injected semantic elements', () => {
    const htmlFiles = [
      ...getFiles(PATHS.pages, ['.html']),
      ...getFiles(PATHS.public, ['.html']),
      ...getFiles(PATHS.demos, ['.html'])
    ];
    
    const issues = new IssueCollector();
    
    const autoInjectMap: Record<string, string> = {
      'button': 'button', 'input': 'input', 'textarea': 'textarea',
      'select': 'select', 'details': 'details', 'dialog': 'dialog',
      'figure': 'figure', 'video': 'video', 'audio': 'audio',
      'table': 'table', 'kbd': 'kbd', 'mark': 'mark'
    };
    
    const inputTypeMap: Record<string, string> = {
      'checkbox': 'checkbox', 'radio': 'radio', 'range': 'range'
    };
    
    for (const file of htmlFiles) {
      const content = stripCodeExamples(readFile(file));
      const relFile = relativePath(file);
      
      for (const [element, behavior] of Object.entries(autoInjectMap)) {
        const regex = new RegExp(
          `<${element}\\b[^>]*\\bdata-wb=["'][^"']*\\b${behavior}\\b[^"']*["'][^>]*>`, 'gi'
        );
        const matches = content.match(regex);
        if (matches) {
          for (const match of matches) {
            issues.add(`${relFile}: <${element} data-wb="${behavior}"> is redundant (auto-injected)`);
          }
        }
      }
      
      for (const [inputType, behavior] of Object.entries(inputTypeMap)) {
        const regex = new RegExp(
          `<input\\b[^>]*\\btype=["']${inputType}["'][^>]*\\bdata-wb=["'][^"']*\\b${behavior}\\b[^"']*["'][^>]*>`, 'gi'
        );
        const matches = content.match(regex);
        if (matches) {
          for (const match of matches) {
            issues.add(`${relFile}: <input type="${inputType}" data-wb="${behavior}"> is redundant`);
          }
        }
      }
    }
    
    // #872: was `issues.expectLessThan(50, …)` plus a console.warn, with a
    // MEASURED count of 0. A 50-wide ceiling on a rule with zero violations is
    // 50 free regressions, and the title claims NO redundant attributes, not
    // fewer than fifty — so the ratchet comes down to 0, which is where the
    // codebase already is. This is a tightening; it must only ever come down
    // further, never back up.
    //
    // The old form was also invisible to the "every test contains at least one
    // expect()" gate: `issues.expectLessThan` does not match /expect\s*[.(]/.
    expect(
      issues.all,
      `${issues.count} redundant data-wb attributes — these behaviors are auto-injected `
      + `from the tag/type, so naming them again does nothing:\n${issues.all.join('\n')}`,
    ).toEqual([]);
  });

  test('all data-wb attributes reference valid behaviors', () => {
    const validBehaviors = getRegisteredBehaviors();
    const htmlFiles = [
      ...getFiles(PATHS.pages, ['.html']),
      ...getFiles(PATHS.public, ['.html']),
      ...getFiles(PATHS.demos, ['.html'])
    ];
    
    const issues = new IssueCollector();
    
    const ignoredPatterns = [
      /^\$\{/, /^behavior-/, /\//, /^test-/, /^ul$/, /^ol$/, /^dl$/, /^\.\.\.$/
    ];
    
    for (const file of htmlFiles) {
      const content = stripDynamicContent(readFile(file));
      
      const wbRegex = /data-wb=['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = wbRegex.exec(content)) !== null) {
        const behaviors = match[1].split(/\s+/);
        
        for (const b of behaviors) {
          if (ignoredPatterns.some(pattern => pattern.test(b))) continue;
          
          if (b && !validBehaviors.has(b)) {
            issues.add(`${relativePath(file)}: uses unknown behavior '${b}'`);
          }
        }
      }
    }
    
    // #863: same as the imports test above -- expectEmpty() threw with only a
    // header and dropped the list. Assert the collected violations directly so
    // the unknown behaviour names appear in the failure.
    expect(
      issues.all,
      `Unknown behaviors used in HTML:\n${issues.all.join('\n')}`,
    ).toEqual([]);
  });
});
