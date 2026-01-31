/**
 * Base Test Utilities for WB Behaviors
 * =====================================
 * Common validation functions, file utilities, and test helpers
 * used across all test suites. Import what you need.
 * 
 * Usage:
 *   import { getHtmlFiles, loadSchema, assertValidDate } from '../base';
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Page, Locator } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const ROOT = process.cwd();

export const PATHS = {
  src: path.join(ROOT, 'src'),
  data: path.join(ROOT, 'data'),
  pages: path.join(ROOT, 'pages'),
  demos: path.join(ROOT, 'demos'),
  public: path.join(ROOT, 'public'),
  schemas: path.join(ROOT, 'src/wb-models'),
  behaviorsJs: path.join(ROOT, 'src/wb-viewmodels'),
  behaviorsCss: path.join(ROOT, 'src/behaviors/css'),
  styles: path.join(ROOT, 'src/styles'),
} as const;

export const DATA_FILES = {
  fixes: path.join(PATHS.data, 'fixes.json'),
  components: path.join(PATHS.data, 'components.json'),
  propertyConfig: path.join(PATHS.data, 'propertyconfig.json'),
  behaviorInventory: path.join(PATHS.data, 'behavior-inventory.json'),
} as const;

export const EXCLUDE_DIRS = [
  'node_modules', '.git', 'dist', 'build', 'coverage', 
  'test-results', '.playwright-artifacts'
];

// ═══════════════════════════════════════════════════════════════════════════
// FILE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Read file contents as string
 */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Write file with content
 */
export function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

/**
 * Read and parse JSON file
 */
export function readJson<T = any>(filePath: string): T | null {
  try {
    return JSON.parse(readFile(filePath));
  } catch {
    return null;
  }
}

/**
 * Write JSON file with formatting
 */
export function writeJson(filePath: string, data: any): void {
  writeFile(filePath, JSON.stringify(data, null, 2));
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE SCANNING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all files with specific extensions recursively
 */
export function getFiles(
  dir: string, 
  extensions: string[], 
  fileList: string[] = []
): string[] {
  if (!fs.existsSync(dir)) return fileList;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        getFiles(fullPath, extensions, fileList);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  
  return fileList;
}

/**
 * Get all HTML files from a directory (recursive)
 */
export function getHtmlFiles(dir: string = ROOT): string[] {
  return getFiles(dir, ['.html']);
}

/**
 * Get all CSS files from a directory (recursive)
 */
export function getCssFiles(dir: string = ROOT): string[] {
  return getFiles(dir, ['.css']);
}

/**
 * Get all JS files from a directory (recursive)
 */
export function getJsFiles(dir: string = PATHS.behaviorsJs): string[] {
  if (!fs.existsSync(dir)) return [];
  
  const files: string[] = [];
  
  function scan(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.name.endsWith('.js')) {
        files.push(path.relative(dir, fullPath));
      }
    }
  }
  
  scan(dir);
  return files;
}

/**
 * Get all schema files
 */
export function getSchemaFiles(): string[] {
  if (!fs.existsSync(PATHS.schemas)) return [];
  return fs.readdirSync(PATHS.schemas)
    .filter(f => f.endsWith('.schema.json') && !f.includes('.base.') && f !== 'views.schema.json' && f !== 'behavior.schema.json' && f !== 'behaviors-showcase.schema.json' && f !== 'search-index.schema.json');
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export interface Schema {
  $schema?: string;
  title?: string;
  description?: string;
  behavior: string;
  properties?: Record<string, any>;
  compliance?: {
    baseClass: string;
    parentClass?: string;
    requiredChildren?: Record<string, any>;
    optionalChildren?: Record<string, any>;
    styles?: Record<string, any>;
  };
  interactions?: Record<string, any>;
  accessibility?: Record<string, any>;
  events?: Record<string, any>;
  test?: {
    setup?: string[];
    matrix?: any;
    functional?: any;
  };
}

/**
 * Load and parse a schema file
 */
export function loadSchema(filename: string): Schema | null {
  try {
    const content = fs.readFileSync(path.join(PATHS.schemas, filename), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Get all component schemas as a Map
 */
export function getComponentSchemas(): Map<string, Schema> {
  const schemas = new Map<string, Schema>();
  for (const file of getSchemaFiles()) {
    const schema = loadSchema(file);
    if (schema?.behavior) {
      schemas.set(file, schema);
    }
  }
  return schemas;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if string is a valid date
 */
export function isValidDate(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date.toString() !== 'Invalid Date';
}

/**
 * Assert that a field contains a valid date
 */
export function assertValidDate(
  value: string | undefined | null,
  fieldName: string,
  context?: string
): void {
  const prefix = context ? `${context}: ` : '';
  
  if (!value) {
    throw new Error(`${prefix}Missing '${fieldName}' field`);
  }
  
  const date = new Date(value);
  if (date.toString() === 'Invalid Date') {
    throw new Error(`${prefix}Invalid '${fieldName}' date: ${value}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT STRIPPING (for static analysis)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strip script tags and dynamic content from HTML
 */
export function stripDynamicContent(html: string): string {
  let result = html;
  // Remove <script>...</script> blocks
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove content inside data-wb="mdhtml" elements or wb-mdhtml components
  result = result.replace(/data-wb=['"]mdhtml['"][^>]*>[\s\S]*?<\/div>/gi, '');
  result = result.replace(/<wb-mdhtml[^>]*>[\s\S]*?<\/wb-mdhtml>/gi, '');
  // Remove markdown code blocks
  result = result.replace(/```[\s\S]*?```/g, '');
  return result;
}

/**
 * Strip code examples (pre, code blocks)
 */
export function stripCodeExamples(html: string): string {
  let result = html;
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '');
  result = result.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '');
  result = result.replace(/```[\s\S]*?```/g, '');
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANALYSIS HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a color match is inside a var() fallback
 */
export function isInVarFallback(content: string, match: string, matchIndex: number): boolean {
  const before = content.substring(0, matchIndex);
  const lastSemicolon = before.lastIndexOf(';');
  const lastBrace = before.lastIndexOf('{');
  const propStart = Math.max(lastSemicolon, lastBrace) + 1;
  const currentProp = before.substring(propStart);
  
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
  
  return depth > 0;
}

/**
 * Check if a color match is in a shadow property
 */
export function isInShadow(content: string, matchIndex: number): boolean {
  const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
  const lineEnd = content.indexOf('\n', matchIndex);
  const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return /box-shadow|text-shadow|--shadow/i.test(line);
}

/**
 * Check if color is black/white transparency (always allowed)
 */
export function isBlackWhiteTransparency(match: string, content: string, matchIndex: number): boolean {
  if (!match.startsWith('rgba(')) return false;
  const after = content.substring(matchIndex, matchIndex + 50);
  return /rgba\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)/.test(after);
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE CODE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract a function body from source code
 */
export function extractFunction(source: string, funcName: string): string | null {
  const exportPattern = new RegExp(
    `export\\s+(?:async\\s+|default\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{`,
    'g'
  );
  
  const match = exportPattern.exec(source);
  if (!match) return null;
  
  const startIdx = match.index;
  let braceCount = 0;
  let endIdx = startIdx;
  let i = startIdx;
  
  while (i < source.length) {
    const char = source[i];
    const prevChar = i > 0 ? source[i - 1] : '';
    
    if (prevChar === '\\') { i++; continue; }
    
    // Handle template literals
    if (char === '`') {
      i++;
      while (i < source.length) {
        if (source[i] === '\\') { i += 2; continue; }
        if (source[i] === '`') { i++; break; }
        if (source[i] === '$' && source[i + 1] === '{') {
          i += 2;
          let exprBraces = 1;
          while (i < source.length && exprBraces > 0) {
            if (source[i] === '{') exprBraces++;
            if (source[i] === '}') exprBraces--;
            i++;
          }
          continue;
        }
        i++;
      }
      continue;
    }
    
    // Handle strings
    if (char === '"' || char === "'") {
      const quote = char;
      i++;
      while (i < source.length) {
        if (source[i] === '\\') { i += 2; continue; }
        if (source[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }
    
    // Handle comments
    if (char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length - 1 && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    
    // Count braces
    if (char === '{') braceCount++;
    if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIdx = i + 1;
        break;
      }
    }
    
    i++;
  }
  
  return source.substring(startIdx, endIdx);
}

/**
 * Check if function creates an element with given tag
 */
export function createsElement(funcBody: string, tagName: string): boolean {
  const pattern = new RegExp(`createElement\\s*\\(\\s*['"\`]${tagName}['"\`]\\s*\\)`, 'i');
  return pattern.test(funcBody);
}

/**
 * Check if function adds a class
 */
export function addsClass(funcBody: string, className: string): boolean {
  const pattern1 = new RegExp(`classList\\.add\\s*\\(\\s*['"\`]${className}['"\`]`, 'i');
  const pattern2 = new RegExp(`className\\s*[+=].*['"\`].*${className}`, 'i');
  return pattern1.test(funcBody) || pattern2.test(funcBody);
}

/**
 * Check if function sets a style property
 */
export function setsStyle(funcBody: string, styleProp: string): boolean {
  const pattern = new RegExp(`\\.style\\.${styleProp}\\s*=`, 'i');
  return pattern.test(funcBody);
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYWRIGHT TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wait for WB Behaviors to initialize
 */
export async function waitForWB(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as any).WB?.behaviors);
}

/**
 * Setup a test container with HTML and scan for behaviors
 */
export async function setupTestContainer(page: Page, html: string): Promise<Locator> {
  await page.evaluate(() => {
    document.getElementById('test-container')?.remove();
  });
  
  await page.evaluate(async (h: string) => {
    const c = document.createElement('div');
    c.id = 'test-container';
    c.innerHTML = h;
    document.body.appendChild(c);
    
    if ((window as any).WB?.scan) {
      await (window as any).WB.scan(c);
    }
  }, html);
  
  await page.waitForTimeout(150);
  
  return page.locator('#test-container > *').first();
}

/**
 * Standard page setup for behavior tests
 */
export async function setupBehaviorTest(page: Page): Promise<void> {
  await page.goto('index.html');
  await waitForWB(page);
}

/**
 * Robust scroll helper for Playwright tests.
 * - retries `scrollIntoViewIfNeeded()`
 * - falls back to `element.scrollIntoView()` when needed
 * - waits for visibility with retries to reduce flaky timing failures
 */
export async function safeScrollIntoView(
  el: Locator,
  opts: { timeoutMs?: number; maxRetries?: number } = {}
): Promise<void> {
  const timeout = opts.timeoutMs ?? 1500;
  const maxRetries = opts.maxRetries ?? 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Prefer the native helper where supported
      await el.scrollIntoViewIfNeeded();
      await el.waitFor({ state: 'visible', timeout });
      return;
    } catch (err) {
      // JS fallback + short wait then retry
      try {
        await el.evaluate((node: Element) => {
          (node as HTMLElement).scrollIntoView({ block: 'center' });
        });
        await el.waitFor({ state: 'visible', timeout });
        return;
      } catch (err2) {
        if (attempt === maxRetries - 1) throw err2;
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }
}

/**
 * Get relative path from ROOT
 */
export function relativePath(fullPath: string): string {
  return path.relative(ROOT, fullPath);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST RESULT COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Collect issues during test and format for assertion
 */
export class IssueCollector {
  private issues: string[] = [];
  
  add(message: string): void {
    this.issues.push(message);
  }
  
  get count(): number {
    return this.issues.length;
  }
  
  get all(): string[] {
    return [...this.issues];
  }
  
  format(header?: string): string {
    if (this.issues.length === 0) return '';
    const h = header ? `${header}:\n` : '';
    return h + this.issues.join('\n');
  }
  
  expectEmpty(message?: string): void {
    if (this.issues.length > 0) {
      throw new Error(message || this.format());
    }
  }
  
  expectLessThan(max: number, message?: string): void {
    if (this.issues.length >= max) {
      throw new Error(message || `Expected less than ${max} issues:\n${this.format()}`);
    }
  }
}
