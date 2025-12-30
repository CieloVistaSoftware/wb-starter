import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * PROJECT INTEGRITY & LINK CHECKING
 * =================================
 * Deep validation of project structure to catch "missing file" errors
 * that slip through standard tests.
 * 
 * Checks:
 * 1. JS Imports: All 'import' statements in .js files point to existing files.
 * 2. HTML Resources: All <script>, <link>, <img> tags point to existing files.
 * 3. HTML Behaviors: All data-wb="..." attributes reference valid registered behaviors.
 */

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const PAGES_DIR = path.join(ROOT_DIR, 'pages');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DEMOS_DIR = path.join(ROOT_DIR, 'demos');

// Helper: Recursively get all files of specific extensions
function getFiles(dir: string, extensions: string[], fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getFiles(filePath, extensions, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

// Helper: Extract behavior names from index.js
function getRegisteredBehaviors(): Set<string> {
  const indexPath = path.join(SRC_DIR, 'behaviors', 'index.js');
  const content = fs.readFileSync(indexPath, 'utf-8');
  const behaviors = new Set<string>();
  
  // Match keys in behaviorModules object
  const match = content.match(/const behaviorModules = ({[\s\S]*?});/);
  if (match) {
    // Use a global regex to find all keys in the object body
    const keyRegex = /^\s*['"]?([a-zA-Z0-9_-]+)['"]?:\s*['"]/gm;
    let keyMatch;
    // We need to match against the content block, but the regex needs to handle multiple per line
    // Simpler approach: split by comma and match keys
    const body = match[1];
    // Remove comments
    const cleanBody = body.replace(/\/\/.*$/gm, '');
    
    // Match "key: 'value'" pattern
    const entryRegex = /['"]?([a-zA-Z0-9_\-\/]+)['"]?\s*:\s*['"]/g;
    
    while ((keyMatch = entryRegex.exec(cleanBody)) !== null) {
      behaviors.add(keyMatch[1]);
    }
  }
  return behaviors;
}

test.describe('Project Integrity', () => {
  
  // 1. JS IMPORT INTEGRITY
  test('all JS imports resolve to existing files', () => {
    const jsFiles = getFiles(SRC_DIR, ['.js']);
    const missingImports: string[] = [];
    
    // Known false positives (e.g. imports inside template strings)
    const ignoredImports = [
      '../src/core/wb-lazy.js' // Used in preview HTML template string
    ];
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const dir = path.dirname(file);
      
      // Match import ... from '...' and export ... from '...'
      // Regex captures the path inside quotes
      const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        if (ignoredImports.includes(importPath)) continue;

        // Skip node_modules imports (bare specifiers)
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          continue; 
        }
        
        // Resolve path
        let targetPath;
        if (importPath.startsWith('/')) {
          // Root relative
          targetPath = path.join(ROOT_DIR, importPath);
        } else {
          // Relative to file
          targetPath = path.join(dir, importPath);
        }
        
        // Check existence (try exact, then .js, then /index.js)
        const exists = fs.existsSync(targetPath) || 
                       fs.existsSync(targetPath + '.js') || 
                       fs.existsSync(path.join(targetPath, 'index.js'));
                       
        if (!exists) {
          const relFile = path.relative(ROOT_DIR, file);
          missingImports.push(`${relFile}: imports missing file '${importPath}'`);
        }
      }
    }
    
    expect(missingImports, `Broken JS imports found:\n${missingImports.join('\n')}`).toEqual([]);
  });

  // 2. HTML RESOURCE INTEGRITY
  test('all HTML resource links (script, link, img) point to existing files', () => {
    const htmlFiles = [
      ...getFiles(PAGES_DIR, ['.html']),
      ...getFiles(PUBLIC_DIR, ['.html']),
      ...getFiles(DEMOS_DIR, ['.html'])
    ];
    
    const brokenLinks: string[] = [];
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Match src="..." and href="..."
      const linkRegex = /(?:src|href)=['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const linkPath = match[1];
        
        // Skip external links, anchors, data URIs, and template variables
        if (linkPath.startsWith('http') || 
            linkPath.startsWith('#') || 
            linkPath.startsWith('data:') ||
            linkPath.startsWith('mailto:') ||
            linkPath.startsWith('javascript:') ||
            linkPath.includes('${') ||
            linkPath.includes('{{')) {
          continue;
        }
        
        // Resolve path
        let targetPath;
        if (linkPath.startsWith('/')) {
          targetPath = path.join(ROOT_DIR, linkPath);
        } else {
          targetPath = path.join(path.dirname(file), linkPath);
        }
        
        // Remove query strings / hashes
        targetPath = targetPath.split('?')[0].split('#')[0];
        
        if (!fs.existsSync(targetPath)) {
          const relFile = path.relative(ROOT_DIR, file);
          brokenLinks.push(`${relFile}: links to missing file '${linkPath}'`);
        }
      }
    }
    
    expect(brokenLinks, `Broken HTML links found:\n${brokenLinks.join('\n')}`).toEqual([]);
  });

  // 3. BEHAVIOR USAGE INTEGRITY
  test('all data-wb attributes in HTML reference valid behaviors', () => {
    const validBehaviors = getRegisteredBehaviors();
    const htmlFiles = [
      ...getFiles(PAGES_DIR, ['.html']),
      ...getFiles(PUBLIC_DIR, ['.html']),
      ...getFiles(DEMOS_DIR, ['.html'])
    ];
    
    const unknownBehaviors: string[] = [];
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Match data-wb="..."
      const wbRegex = /data-wb=['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = wbRegex.exec(content)) !== null) {
        const behaviors = match[1].split(/\s+/); // Handle multiple behaviors "foo bar"
        
        for (const b of behaviors) {
          if (b && !validBehaviors.has(b)) {
            const relFile = path.relative(ROOT_DIR, file);
            unknownBehaviors.push(`${relFile}: uses unknown behavior '${b}'`);
          }
        }
      }
    }
    
    // Filter out known "dynamic" or "test" behaviors if any
    const realUnknowns = unknownBehaviors.filter(msg => !msg.includes('test-'));
    
    expect(realUnknowns, `Unknown behaviors used in HTML:\n${realUnknowns.join('\n')}`).toEqual([]);
  });
});
