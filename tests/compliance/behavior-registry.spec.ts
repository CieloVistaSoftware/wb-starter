import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * BEHAVIOR REGISTRY INTEGRITY TEST
 * ================================
 * Ensures that the behavior registry (index.js) only references files that actually exist.
 * This prevents runtime "Module not found" errors by catching them at the compliance tier.
 */

test.describe('Behavior Registry Integrity', () => {
  const BEHAVIORS_DIR = path.join(process.cwd(), 'src', 'behaviors');
  const JS_DIR = path.join(BEHAVIORS_DIR, 'js');
  const INDEX_PATH = path.join(BEHAVIORS_DIR, 'index.js');

  // Helper to extract the behaviorModules object from index.js source
  // We do this via regex/parsing to avoid needing to run the code (which might fail)
  function extractBehaviorModules(source: string): Record<string, string> {
    // Look for: const behaviorModules = { ... };
    // This is a simplified parser that assumes the object is defined in one block
    const match = source.match(/const behaviorModules = ({[\s\S]*?});/);
    if (!match) throw new Error('Could not find behaviorModules definition in index.js');
    
    // We need to make the string valid JSON-ish to parse it
    // 1. Remove comments
    let jsonStr = match[1].replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    // 2. Quote keys (e.g. hero: -> "hero":)
    jsonStr = jsonStr.replace(/([a-zA-Z0-9_-]+):/g, '"$1":');
    // 3. Quote values (already quoted, but ensure single quotes become double)
    jsonStr = jsonStr.replace(/'/g, '"');
    // 4. Remove trailing commas
    jsonStr = jsonStr.replace(/,(\s*})/g, '$1');

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse behaviorModules object:', e);
      // Fallback: Manual regex extraction for each line
      const modules: Record<string, string> = {};
      const lines = match[1].split('\n');
      for (const line of lines) {
        const lineMatch = line.match(/['"]?([a-zA-Z0-9_-]+)['"]?:\s*['"]([a-zA-Z0-9_/-]+)['"]/);
        if (lineMatch) {
          modules[lineMatch[1]] = lineMatch[2];
        }
      }
      return modules;
    }
  }

  test('index.js exists', () => {
    expect(fs.existsSync(INDEX_PATH)).toBe(true);
  });

  test('all referenced behavior modules exist on disk', () => {
    const indexSource = fs.readFileSync(INDEX_PATH, 'utf-8');
    const modules = extractBehaviorModules(indexSource);
    
    const missingFiles: string[] = [];
    const checkedPaths = new Set<string>();

    for (const [behavior, modulePath] of Object.entries(modules)) {
      // modulePath is relative to src/behaviors/js/ and without extension
      // e.g. 'semantics/table' -> src/behaviors/js/semantics/table.js
      const fullPath = path.join(JS_DIR, `${modulePath}.js`);
      
      if (!checkedPaths.has(fullPath)) {
        checkedPaths.add(fullPath);
        if (!fs.existsSync(fullPath)) {
          missingFiles.push(`${behavior} -> ${modulePath}.js`);
        }
      }
    }

    expect(missingFiles, `
      CRITICAL: The following behavior modules are referenced in index.js but DO NOT EXIST on disk.
      This will cause runtime crashes.
      
      Missing files:
      ${missingFiles.join('\n      ')}
    `).toEqual([]);
  });

  test('no duplicate behavior keys in registry', () => {
    const indexSource = fs.readFileSync(INDEX_PATH, 'utf-8');
    // We can't use the object parser for this because JSON.parse/Object keys de-dupes automatically.
    // We need to scan the source text.
    
    const match = indexSource.match(/const behaviorModules = ({[\s\S]*?});/);
    if (!match) return; // Should be caught by previous test
    
    const content = match[1];
    const keys = new Set<string>();
    const duplicates: string[] = [];
    
    const lines = content.split('\n');
    for (const line of lines) {
      // Match key: 'value' or key: 'value'
      const keyMatch = line.match(/^\s*['"]?([a-zA-Z0-9_-]+)['"]?:\s*['"]/);
      if (keyMatch) {
        const key = keyMatch[1];
        if (keys.has(key)) {
          duplicates.push(key);
        }
        keys.add(key);
      }
    }
    
    expect(duplicates, `Duplicate behavior keys found in registry: ${duplicates.join(', ')}`).toEqual([]);
  });
});
