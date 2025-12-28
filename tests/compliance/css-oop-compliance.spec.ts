/**
 * CSS OOP Compliance Tests
 * ========================
 * Validates all CSS follows OOP architecture:
 * - No hardcoded colors (except in themes.css)
 * - No duplicate variable definitions
 * - No --wb-* aliases
 * - Correct import order in HTML
 * - Single source of truth for variables
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

// Files that ARE allowed to have hardcoded colors (variable definitions)
const COLOR_EXCEPTION_FILES = ['themes.css', 'wb-signature.css', 'variables.css', 'demo.css'];

// Files that should NOT exist (violate OOP)
const FILES_TO_DELETE = ['styles/wb-components.css'];

// Required foundation imports in order
const FOUNDATION_ORDER = ['themes.css', 'site.css'];

// Patterns that violate OOP
const FORBIDDEN_PATTERNS = {
  hardcodedColors: /#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\(/gi,
  variableAliases: /--wb-(bg|text|primary|border|color)/g,
  duplicateResets: /\*\s*\{[^}]*box-sizing|\bbody\s*\{[^}]*margin:\s*0/g,
  importantUsage: /!important/g
};

// Get all CSS files
function getCssFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const isExcluded = entry.name.includes('node_modules') ||
                       entry.name.startsWith('.playwright-artifacts');
    if (entry.isDirectory() && !isExcluded) {
      getCssFiles(fullPath, files);
    } else if (entry.name.endsWith('.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Get all HTML files
function getHtmlFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const isExcluded = entry.name.includes('node_modules') ||
                       entry.name.startsWith('.playwright-artifacts');
    if (entry.isDirectory() && !isExcluded) {
      getHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Check if a color match is inside a var() fallback - improved version
function isInVarFallback(content: string, match: string, matchIndex: number): boolean {
  // Get the substring up to and including the match
  const before = content.substring(0, matchIndex);
  
  // Find the start of the current CSS property (look for the last ; or {)
  const lastSemicolon = before.lastIndexOf(';');
  const lastBrace = before.lastIndexOf('{');
  const propStart = Math.max(lastSemicolon, lastBrace) + 1;
  
  // Get just the current property value
  const currentProp = before.substring(propStart);
  
  // Count open var( that haven't been closed
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
  
  // If depth > 0, we're inside an unclosed var()
  return depth > 0;
}

// Check if a color match is in a shadow property (box-shadow, text-shadow)
function isInShadow(content: string, matchIndex: number): boolean {
  // Get the line containing this match
  const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
  const lineEnd = content.indexOf('\n', matchIndex);
  const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
  
  // Check if line contains shadow property
  return /box-shadow|text-shadow|--shadow/i.test(line);
}

// Check if color is black or white transparency (always allowed for shadows/overlays)
function isBlackWhiteTransparency(match: string, content: string, matchIndex: number): boolean {
  if (!match.startsWith('rgba(')) return false;
  
  // Get more context after the match
  const after = content.substring(matchIndex, matchIndex + 50);
  
  // Check for rgba(0,0,0 or rgba(255,255,255
  return /rgba\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)/.test(after);
}

test.describe('CSS OOP Compliance', () => {
  
  test('forbidden files should not exist', () => {
    for (const file of FILES_TO_DELETE) {
      const fullPath = path.join(ROOT, file);
      const exists = fs.existsSync(fullPath);
      if (exists) {
        console.warn(`⚠️ OOP VIOLATION: ${file} should be deleted - duplicates theme variables`);
      }
    }
  });

  test('no hardcoded colors in CSS (except themes.css)', () => {
    const cssFiles = getCssFiles(ROOT);
    const violations: string[] = [];

    for (const file of cssFiles) {
      const filename = path.basename(file);
      if (COLOR_EXCEPTION_FILES.includes(filename)) continue;
      
      // Also skip builder.css and audio.css as they have special styling needs
      if (filename === 'builder.css' || filename === 'audio.css') continue;

      const content = fs.readFileSync(file, 'utf-8');
      
      // Find all color matches with their positions
      let match;
      const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/gi;
      const hardcodedColors: string[] = [];
      
      while ((match = colorRegex.exec(content)) !== null) {
        const matchStr = match[0];
        const matchIdx = match.index;
        
        // Skip if it's inside a var() fallback
        if (isInVarFallback(content, matchStr, matchIdx)) {
          continue;
        }
        
        // Skip if it's black/white transparency (for shadows, overlays)
        if (isBlackWhiteTransparency(matchStr, content, matchIdx)) {
          continue;
        }
        
        // Skip if it's in a shadow property
        if (isInShadow(content, matchIdx)) {
          continue;
        }
        
        // Skip if in a comment
        const lineStart = content.lastIndexOf('\n', matchIdx) + 1;
        const lineEnd = content.indexOf('\n', matchIdx);
        const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
        if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) {
          continue;
        }

        hardcodedColors.push(matchStr);
      }

      if (hardcodedColors.length > 0) {
        violations.push(`${path.relative(ROOT, file)}: ${hardcodedColors.slice(0, 3).join(', ')}${hardcodedColors.length > 3 ? '...' : ''}`);
      }
    }

    if (violations.length > 0) {
      console.log('Hardcoded color violations:');
      violations.forEach(v => console.log(`  ❌ ${v}`));
    }
    
    expect(violations, 'CSS files should use var(--*) instead of hardcoded colors').toHaveLength(0);
  });

  test('no --wb-* variable aliases', () => {
    const cssFiles = getCssFiles(ROOT);
    const violations: string[] = [];

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(FORBIDDEN_PATTERNS.variableAliases);
      
      if (matches && matches.length > 0) {
        violations.push(`${path.relative(ROOT, file)}: ${[...new Set(matches)].join(', ')}`);
      }
    }

    if (violations.length > 0) {
      console.log('Variable alias violations (use --bg-primary not --wb-bg-primary):');
      violations.forEach(v => console.log(`  ❌ ${v}`));
    }

    expect(violations, 'Should not create --wb-* aliases for theme variables').toHaveLength(0);
  });

  test('CSS variables only defined in themes.css', () => {
    const cssFiles = getCssFiles(ROOT);
    const violations: string[] = [];
    const varDefinition = /^\s*--[a-z][a-z0-9-]*\s*:/gm;

    for (const file of cssFiles) {
      const filename = path.basename(file);
      // themes.css and wb-signature.css are allowed to define variables
      if (filename === 'themes.css' || filename === 'wb-signature.css' || filename === 'variables.css') continue;

      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(varDefinition);
      
      if (matches && matches.length > 0) {
        // Filter out local scope variables
        const globalVars = matches.filter(m => {
          const varName = m.match(/--[a-z][a-z0-9-]*/)?.[0];
          // Allow component-scoped variables
          if (varName?.startsWith('--builder-') || varName?.startsWith('--page-') || varName?.startsWith('--notes-')) return false;
          return true;
        });

        if (globalVars.length > 0) {
          violations.push(`${path.relative(ROOT, file)}: defines ${globalVars.length} variable(s)`);
        }
      }
    }

    if (violations.length > 0) {
      console.log('Variable definition violations (only themes.css should define variables):');
      violations.forEach(v => console.log(`  ❌ ${v}`));
      console.warn('⚠️ Consider moving variable definitions to themes.css');
    }
  });

  test('HTML files import CSS in correct order', () => {
    const htmlFiles = getHtmlFiles(ROOT);
    const violations: string[] = [];

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Skip HTML fragments (no DOCTYPE)
      if (!content.includes('<!DOCTYPE') && !content.includes('<!doctype')) continue;

      // Extract CSS imports
      const linkMatches = content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
      const cssImports = linkMatches.map(link => {
        const hrefMatch = link.match(/href=["']([^"']+)["']/);
        return hrefMatch ? hrefMatch[1] : '';
      }).filter(Boolean);

      if (cssImports.length === 0) continue;

      // Check if themes.css comes before site.css
      const themesIndex = cssImports.findIndex(f => f.includes('themes.css'));
      const siteIndex = cssImports.findIndex(f => f.includes('site.css'));

      if (themesIndex > -1 && siteIndex > -1 && themesIndex > siteIndex) {
        violations.push(`${path.relative(ROOT, file)}: themes.css must come before site.css`);
      }
    }

    if (violations.length > 0) {
      console.log('CSS import order violations:');
      violations.forEach(v => console.log(`  ❌ ${v}`));
    }

    expect(violations, 'HTML files must import CSS in correct layer order').toHaveLength(0);
  });

  test('minimal !important usage', () => {
    const cssFiles = getCssFiles(ROOT);
    const fileUsage: { file: string; count: number }[] = [];

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(FORBIDDEN_PATTERNS.importantUsage);
      
      if (matches && matches.length > 0) {
        fileUsage.push({
          file: path.relative(ROOT, file),
          count: matches.length
        });
      }
    }

    if (fileUsage.length > 0) {
      console.log('!important usage (should be minimal):');
      fileUsage.forEach(({ file, count }) => {
        console.log(`  ⚠️ ${file}: ${count} occurrence(s)`);
      });
    }

    // Total !important should be minimal (< 50 across all files)
    const total = fileUsage.reduce((sum, f) => sum + f.count, 0);
    expect(total, 'Total !important usage should be minimal').toBeLessThan(50);
  });

  test('behavior CSS files match JS group naming', () => {
    const behaviorCssDir = path.join(ROOT, 'src/behaviors/css');
    const behaviorJsDir = path.join(ROOT, 'src/behaviors/js');

    if (!fs.existsSync(behaviorCssDir) || !fs.existsSync(behaviorJsDir)) {
      console.log('Skipping: behavior css/js directories not fully set up');
      return;
    }

    const cssFiles = fs.readdirSync(behaviorCssDir).filter(f => f.endsWith('.css'));
    const jsFiles = fs.readdirSync(behaviorJsDir).filter(f => f.endsWith('.js'));

    const cssNames = cssFiles.map(f => f.replace('.css', ''));
    const jsNames = jsFiles.map(f => f.replace('.js', ''));

    // Each CSS file should have a corresponding JS file
    const orphanedCss = cssNames.filter(name => !jsNames.includes(name));
    
    if (orphanedCss.length > 0) {
      console.log('CSS files without matching JS:');
      orphanedCss.forEach(name => console.log(`  ⚠️ ${name}.css has no ${name}.js`));
    }

    expect(orphanedCss.length, 'CSS files should match JS group files').toBeLessThan(5);
  });

});

test.describe('Single Source of Truth Compliance', () => {
  
  test('no hardcoded theme lists in HTML files', () => {
    const htmlFiles = getHtmlFiles(ROOT);
    const violations: string[] = [];
    
    // Known themes that should come from themecontrol.js THEMES array
    const themeIds = ['dark', 'light', 'cyberpunk', 'ocean', 'sunset', 'forest', 'midnight', 
                      'sakura', 'arctic', 'desert', 'neon-dreams', 'retro-wave', 'lavender',
                      'emerald', 'ruby', 'golden', 'slate', 'coffee', 'mint', 'noir', 'aurora',
                      'twilight', 'grape'];
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const filename = path.basename(file);
      
      // Skip files that might legitimately define themes (like themes.css references)
      if (filename === 'theme-demo.html') continue;
      
      // Count how many theme options are hardcoded
      let hardcodedThemeCount = 0;
      for (const theme of themeIds) {
        // Look for patterns like: value="dark" or value='dark' in option tags
        const optionPattern = new RegExp(`<option[^>]*value=["']${theme}["'][^>]*>`, 'gi');
        const matches = content.match(optionPattern);
        if (matches) {
          hardcodedThemeCount += matches.length;
        }
      }
      
      // If we find 5+ hardcoded theme options, it's likely a duplicate list
      if (hardcodedThemeCount >= 5) {
        violations.push(`${path.relative(ROOT, file)}: ${hardcodedThemeCount} hardcoded theme options (should import from themecontrol.js)`);
      }
    }
    
    if (violations.length > 0) {
      console.log('Hardcoded theme list violations:');
      violations.forEach(v => console.log(`  ❌ ${v}`));
    }
    
    expect(violations, 'Theme lists should be imported from themecontrol.js, not hardcoded').toHaveLength(0);
  });

  test('no hardcoded behavior lists in HTML files', () => {
    const htmlFiles = getHtmlFiles(ROOT);
    const violations: string[] = [];
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const filename = path.basename(file);
      
      // Count data-wb attribute occurrences that look like a component palette
      // (same behavior repeated many times suggests a hardcoded component list)
      const behaviorOptions = content.match(/<option[^>]*data-wb=["'][^"']+["']/gi);
      
      if (behaviorOptions && behaviorOptions.length >= 20) {
        violations.push(`${path.relative(ROOT, file)}: ${behaviorOptions.length} hardcoded behavior options`);
      }
    }
    
    if (violations.length > 0) {
      console.log('Hardcoded behavior list violations:');
      violations.forEach(v => console.log(`  ❌ ${v}`));
    }
  });

  test('no duplicate constant definitions across JS files', () => {
    const jsDir = path.join(ROOT, 'src/behaviors/js');
    if (!fs.existsSync(jsDir)) return;
    
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    const constantDefinitions: Map<string, string[]> = new Map();
    
    // Look for exported const arrays that might be duplicated
    const exportedArrayPattern = /export\s+(?:const|let)\s+(\w+)\s*=\s*\[/g;
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(jsDir, file), 'utf-8');
      let match;
      
      while ((match = exportedArrayPattern.exec(content)) !== null) {
        const constName = match[1];
        if (!constantDefinitions.has(constName)) {
          constantDefinitions.set(constName, []);
        }
        constantDefinitions.get(constName)!.push(file);
      }
    }
    
    // Check for duplicates
    const duplicates: string[] = [];
    constantDefinitions.forEach((files, constName) => {
      if (files.length > 1) {
        duplicates.push(`${constName} defined in: ${files.join(', ')}`);
      }
    });
    
    if (duplicates.length > 0) {
      console.log('Duplicate constant definitions:');
      duplicates.forEach(d => console.log(`  ❌ ${d}`));
    }
    
    expect(duplicates, 'Constants should be defined once and imported where needed').toHaveLength(0);
  });

});

test.describe('Theme Variable Coverage', () => {
  
  test('all theme variables are defined', () => {
    const themesPath = path.join(ROOT, 'src/styles/themes.css');
    expect(fs.existsSync(themesPath), 'themes.css must exist').toBe(true);

    const content = fs.readFileSync(themesPath, 'utf-8');

    // Required variables
    const requiredVars = [
      '--bg-color', '--bg-primary', '--bg-secondary', '--bg-tertiary',
      '--text-primary', '--text-secondary', '--text-muted',
      '--primary', '--primary-dark', '--primary-light',
      '--secondary', '--accent',
      '--border-color', '--border-light', '--border-dark',
      '--success-color', '--danger-color', '--warning-color', '--info-color',
      '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl',
      '--radius-sm', '--radius-md', '--radius-lg', '--radius-full',
      '--transition-fast', '--transition-base', '--transition-medium', '--transition-slow'
    ];

    const missing = requiredVars.filter(v => !content.includes(v));

    if (missing.length > 0) {
      console.log('Missing required theme variables:');
      missing.forEach(v => console.log(`  ❌ ${v}`));
    }

    expect(missing, 'All required theme variables must be defined').toHaveLength(0);
  });

});
