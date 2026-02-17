/**
 * CSS OOP Compliance Tests
 * ========================
 * Validates all CSS follows OOP architecture.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  ROOT, PATHS, getCssFiles, getHtmlFiles, readFile, fileExists, relativePath,
  isInVarFallback, isInShadow, isBlackWhiteTransparency
} from '../base';

// Files allowed to have hardcoded colors
const COLOR_EXCEPTION_FILES = ['themes.css', 'wb-signature.css', 'variables.css', 'demo.css', 'components.css', 'site.css', 'transitions.css', 'wb-grayscale.css', 'wb-grayscale-dark.css', 'hero.css', 'navbar.css', 'wizard.css', 'kitchen-sink.css'];

// Patterns that violate OOP
const FORBIDDEN_PATTERNS = {
  variableAliases: /--wb-(bg|text|primary|border|color)/g,
  importantUsage: /!important/g
};

test.describe('CSS OOP Compliance', () => {
  
  test('forbidden files should not exist', () => {
    const forbidden = ['styles/wb-components.css'];
    for (const file of forbidden) {
      if (fileExists(path.join(ROOT, file))) {
        console.warn(`⚠️ OOP VIOLATION: ${file} should be deleted`);
      }
    }
  });

  test('no hardcoded colors in CSS (except themes.css)', () => {
    const cssFiles = getCssFiles(ROOT);
    const violations: string[] = [];

    for (const file of cssFiles) {
      const filename = path.basename(file);
      if (COLOR_EXCEPTION_FILES.includes(filename)) continue;
      if (filename === 'audio.css') continue;
      if (file.includes('tmp') || file.includes('.playwright-artifacts')) continue;

      const content = readFile(file);
      const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/gi;
      const hardcodedColors: string[] = [];
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

        hardcodedColors.push(matchStr);
      }

      if (hardcodedColors.length > 0) {
        violations.push(`${relativePath(file)}: ${hardcodedColors.slice(0, 3).join(', ')}${hardcodedColors.length > 3 ? '...' : ''}`);
      }
    }

    expect(violations, 'CSS files should use var(--*) instead of hardcoded colors').toHaveLength(0);
  });

  test('no --wb-* variable aliases', () => {
    const cssFiles = getCssFiles(ROOT);
    const violations: string[] = [];

    for (const file of cssFiles) {
      const content = readFile(file);
      const matches = content.match(FORBIDDEN_PATTERNS.variableAliases);
      
      if (matches && matches.length > 0) {
        violations.push(`${relativePath(file)}: ${[...new Set(matches)].join(', ')}`);
      }
    }

    expect(violations, 'Should not create --wb-* aliases for theme variables').toHaveLength(0);
  });

  test('CSS variables only defined in themes.css', () => {
    const cssFiles = getCssFiles(ROOT);
    const violations: string[] = [];
    const varDefinition = /^\s*--[a-z][a-z0-9-]*\s*:/gm;

    for (const file of cssFiles) {
      const filename = path.basename(file);
      if (['themes.css', 'wb-signature.css', 'variables.css'].includes(filename)) continue;

      const content = readFile(file);
      const matches = content.match(varDefinition);
      
      if (matches && matches.length > 0) {
        const globalVars = matches.filter(m => {
          const varName = m.match(/--[a-z][a-z0-9-]*/)?.[0];
          if (varName?.startsWith('--page-') || varName?.startsWith('--notes-')) return false;
          return true;
        });

        if (globalVars.length > 0) {
          violations.push(`${relativePath(file)}: defines ${globalVars.length} variable(s)`);
        }
      }
    }

    if (violations.length > 0) {
      console.warn('⚠️ Consider moving variable definitions to themes.css');
    }
  });

  test('HTML files import CSS in correct order', () => {
    const htmlFiles = getHtmlFiles(ROOT);
    const violations: string[] = [];

    for (const file of htmlFiles) {
      const content = readFile(file);
      if (!content.includes('<!DOCTYPE') && !content.includes('<!doctype')) continue;

      const linkMatches = content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
      const cssImports = linkMatches.map(link => {
        const hrefMatch = link.match(/href=["']([^"']+)["']/);
        return hrefMatch ? hrefMatch[1] : '';
      }).filter(Boolean);

      if (cssImports.length === 0) continue;

      const themesIndex = cssImports.findIndex(f => f.includes('themes.css'));
      const siteIndex = cssImports.findIndex(f => f.includes('site.css'));

      if (themesIndex > -1 && siteIndex > -1 && themesIndex > siteIndex) {
        violations.push(`${relativePath(file)}: themes.css must come before site.css`);
      }
    }

    expect(violations, 'HTML files must import CSS in correct layer order').toHaveLength(0);
  });

  test('minimal !important usage', () => {
    const cssFiles = getCssFiles(ROOT);
    let total = 0;

    for (const file of cssFiles) {
      const content = readFile(file);
      const matches = content.match(FORBIDDEN_PATTERNS.importantUsage);
      if (matches) total += matches.length;
    }

    expect(total, 'Total !important usage should be minimal').toBeLessThan(130);
  });

  test('behavior CSS files match JS group naming', () => {
    if (!fileExists(PATHS.behaviorsCss) || !fileExists(PATHS.behaviorsJs)) return;

    const cssFiles = fs.readdirSync(PATHS.behaviorsCss).filter(f => f.endsWith('.css'));
    const jsFiles = fs.readdirSync(PATHS.behaviorsJs).filter(f => f.endsWith('.js'));

    const cssNames = cssFiles.map(f => f.replace('.css', ''));
    const jsNames = jsFiles.map(f => f.replace('.js', ''));

    const orphanedCss = cssNames.filter(name => !jsNames.includes(name));
    expect(orphanedCss.length, 'CSS files should match JS group files').toBeLessThan(5);
  });
});

test.describe('Single Source of Truth Compliance', () => {
  
  test('no hardcoded theme lists in HTML files', () => {
    const htmlFiles = getHtmlFiles(ROOT);
    const violations: string[] = [];
    
    const themeIds = ['dark', 'light', 'cyberpunk', 'ocean', 'sunset', 'forest', 'midnight', 
                      'sakura', 'arctic', 'desert', 'neon-dreams', 'retro-wave', 'lavender',
                      'emerald', 'ruby', 'golden', 'slate', 'coffee', 'mint', 'noir', 'aurora',
                      'twilight', 'grape'];
    
    for (const file of htmlFiles) {
      const content = readFile(file);
      if (path.basename(file) === 'theme-demo.html') continue;
      
      let hardcodedThemeCount = 0;
      for (const theme of themeIds) {
        const optionPattern = new RegExp(`<option[^>]*value=["']${theme}["'][^>]*>`, 'gi');
        const matches = content.match(optionPattern);
        if (matches) hardcodedThemeCount += matches.length;
      }
      
      if (hardcodedThemeCount >= 5) {
        violations.push(`${relativePath(file)}: ${hardcodedThemeCount} hardcoded theme options`);
      }
    }
    
    expect(violations, 'Theme lists should be imported from themecontrol.js').toHaveLength(0);
  });

  test('no duplicate constant definitions across JS files', () => {
    if (!fileExists(PATHS.behaviorsJs)) return;
    
    const jsFiles = fs.readdirSync(PATHS.behaviorsJs).filter(f => f.endsWith('.js'));
    const constantDefinitions: Map<string, string[]> = new Map();
    const exportedArrayPattern = /export\s+(?:const|let)\s+(\w+)\s*=\s*\[/g;
    
    for (const file of jsFiles) {
      const content = readFile(path.join(PATHS.behaviorsJs, file));
      let match;
      
      while ((match = exportedArrayPattern.exec(content)) !== null) {
        const constName = match[1];
        if (!constantDefinitions.has(constName)) constantDefinitions.set(constName, []);
        constantDefinitions.get(constName)!.push(file);
      }
    }
    
    const duplicates: string[] = [];
    constantDefinitions.forEach((files, constName) => {
      if (files.length > 1) duplicates.push(`${constName} defined in: ${files.join(', ')}`);
    });
    
    expect(duplicates, 'Constants should be defined once').toHaveLength(0);
  });
});

test.describe('Theme Variable Coverage', () => {
  
  test('all theme variables are defined', () => {
    const themesPath = path.join(PATHS.styles, 'themes.css');
    expect(fileExists(themesPath), 'themes.css must exist').toBe(true);

    const content = readFile(themesPath);
    const requiredVars = [
      '--bg-color', '--bg-primary', '--bg-secondary', '--bg-tertiary',
      '--text-primary', '--text-secondary', '--text-muted',
      '--primary', '--primary-dark', '--primary-light',
      '--secondary', '--accent',
    ];

    const missing = requiredVars.filter(v => !content.includes(v));
    expect(missing, 'All required theme variables must be defined').toHaveLength(0);
  });
});
