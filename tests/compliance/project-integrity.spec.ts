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
    
    if (issues.count > 0) {
        console.log('Broken JS imports found:');
        issues.all.forEach(i => console.log(i));
    }
    issues.expectEmpty('Broken JS imports found');
  });

  test('all HTML resource links point to existing files', () => {
    const htmlFiles = [
      ...getFiles(PATHS.pages, ['.html']),
      ...getFiles(PATHS.public, ['.html']),
      ...getFiles(PATHS.demos, ['.html'])
    ];
    
    const issues = new IssueCollector();
    
    for (const file of htmlFiles) {
      const content = stripDynamicContent(readFile(file));
      
      const linkRegex = /(?:src|href)=['"]([^'"]+)['"]/g;
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
        
        let targetPath = linkPath.startsWith('/')
          ? path.join(ROOT, linkPath)
          : path.join(path.dirname(file), linkPath);
        
        targetPath = targetPath.split('?')[0].split('#')[0];
        
        if (!fileExists(targetPath)) {
          issues.add(`${relativePath(file)}: links to missing file '${linkPath}'`);
        }
      }
    }
    
    if (issues.count > 0) {
        console.log('Broken HTML links found:');
        issues.all.forEach(i => console.log(i));
    }
    issues.expectEmpty('Broken HTML links found');
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
    
    // Warn but don't break - these are optimization suggestions
    if (issues.count > 0) {
      console.warn(`Found ${issues.count} redundant data-wb attributes:`);
      issues.all.slice(0, 5).forEach(i => console.warn(`  - ${i}`));
    }
    issues.expectLessThan(50, 'Too many redundant data-wb attributes');
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
    
    issues.expectEmpty('Unknown behaviors used in HTML');
  });
});
