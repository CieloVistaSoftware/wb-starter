/**
 * BEHAVIOR REGISTRY INTEGRITY TEST
 * ================================
 * Ensures behavior registry only references files that exist.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { PATHS, readFile, fileExists } from '../base';

const INDEX_PATH = path.join(PATHS.src, 'wb-viewmodels', 'index.js');
const JS_DIR = path.join(PATHS.src, 'wb-viewmodels');

function extractBehaviorModules(source: string): Record<string, string> {
  const match = source.match(/const behaviorModules = ({[\s\S]*?});/);
  if (!match) throw new Error('Could not find behaviorModules definition');
  
  let jsonStr = match[1].replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  jsonStr = jsonStr.replace(/([a-zA-Z0-9_-]+):/g, '"$1":');
  jsonStr = jsonStr.replace(/'/g, '"');
  jsonStr = jsonStr.replace(/,(\s*})/g, '$1');

  try {
    return JSON.parse(jsonStr);
  } catch {
    const modules: Record<string, string> = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
      const lineMatch = line.match(/['"]?([a-zA-Z0-9_-]+)['"]?:\s*['"]([a-zA-Z0-9_/-]+)['"]/);
      if (lineMatch) modules[lineMatch[1]] = lineMatch[2];
    }
    return modules;
  }
}

test.describe('Behavior Registry Integrity', () => {

  test('index.js exists', () => {
    expect(fileExists(INDEX_PATH)).toBe(true);
  });

  test('all referenced behavior modules exist on disk', () => {
    const indexSource = readFile(INDEX_PATH);
    const modules = extractBehaviorModules(indexSource);
    
    const missingFiles: string[] = [];
    const checkedPaths = new Set<string>();

    for (const [behavior, modulePath] of Object.entries(modules)) {
      const fullPath = path.join(JS_DIR, `${modulePath}.js`);
      
      if (!checkedPaths.has(fullPath)) {
        checkedPaths.add(fullPath);
        if (!fileExists(fullPath)) {
          missingFiles.push(`${behavior} -> ${modulePath}.js`);
        }
      }
    }

    expect(missingFiles, `Missing behavior module files:\n${missingFiles.join('\n')}`).toEqual([]);
  });

  test('no duplicate behavior keys in registry', () => {
    const indexSource = readFile(INDEX_PATH);
    const match = indexSource.match(/const behaviorModules = ({[\s\S]*?});/);
    if (!match) return;
    
    const keys = new Set<string>();
    const duplicates: string[] = [];
    
    for (const line of match[1].split('\n')) {
      const keyMatch = line.match(/^\s*['"]?([a-zA-Z0-9_-]+)['"]?:\s*['"]/);
      if (keyMatch) {
        if (keys.has(keyMatch[1])) duplicates.push(keyMatch[1]);
        keys.add(keyMatch[1]);
      }
    }
    
    expect(duplicates, `Duplicate behavior keys: ${duplicates.join(', ')}`).toEqual([]);
  });
});
