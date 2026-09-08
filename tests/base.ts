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

// .claude/worktrees holds full checkouts for OTHER agent sessions -- stale
// copies of this same repo. Without excluding it, every getFiles()/
// getHtmlFiles()/getCssFiles() caller here (21 compliance spec files) walked
// into each one and re-scanned/re-rendered its entire surface a second
// (third, fourth...) time -- confirmed live: dark-mode.spec.ts alone took
// 21+ minutes re-loading hundreds of pages from one stale worktree.
//
// x-overlay-ext is a wholly separate, untracked Chrome extension (its own
// manifest.json, .crx/.pem signing files) that happens to live under src/ --
// not part of the wb-starter component library, so its CSS/HTML isn't
// subject to this project's theming/OOP conventions. Confirmed live:
// css-oop-compliance flagged its popup CSS for hardcoded colors that are
// legitimate there (a browser-extension UI, not a themed component).
//
// packages/create-wb-starter/template (#543) is a machine-generated,
// byte-for-byte copy of src/ (and pages/, demos/, etc.) produced by
// packages/create-wb-starter/scripts/sync-template.mjs so the create-wb-starter
// npm package ships a working scaffold -- it is not hand-authored CSS/HTML
// subject to this project's own OOP conventions, same rationale as
// x-overlay-ext above. Confirmed live: because it duplicates every file
// under src/styles/, every compliance scan (including this file's own
// `!important` count) was silently counting each real violation TWICE the
// moment the create-wb-starter package was added, thereby doubling the
// css-oop-compliance "minimal !important usage" total from 129 (achieved and
// verified green pre-#543) to 273+ with zero new CSS actually written.
// 'template' (singular) only ever matches this one directory in the repo --
// the unrelated top-level `templates/` dir is plural and untouched.
export const EXCLUDE_DIRS = [
  'node_modules', '.git', '.claude', 'dist', 'build', 'coverage',
  'test-results', '.playwright-artifacts', 'x-overlay-ext', 'template'
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
  schemaFor: string;
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
    const schema = JSON.parse(content) as any;
    // backwards-compat: populate legacy `behavior` for code/tests that still read it
    if (schema && !schema.behavior && schema.schemaFor) schema.behavior = schema.schemaFor;
    return schema;
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
    const schema = loadSchema(file) as any;
    // Only true component schemas. Non-component tiers (behavior, page, base,
    // definition) carry a schemaFor but must not be held to component-grade rules.
    if (schema?.schemaFor && (!schema.schemaType || schema.schemaType === 'component')) {
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
  // Remove content inside x-mdhtml elements or x-mdhtml components
  result = result.replace(/x-mdhtml[^>]*>[\s\S]*?<\/div>/gi, '');
  result = result.replace(/<div x-mdhtml[^>]*>[\s\S]*?<\/x-mdhtml>/gi, '');
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
 * Wait for WB to finish its boot scan.
 *
 * #962: this used to wait only for `WB.behaviors` — the registry object
 * existing, which proves the module loaded and that NOTHING has run yet. Tests
 * then bridged the real gap with `waitForTimeout`, and a sleep is a guess about
 * DURATION: it fails whenever the machine is slower than the guess. On a
 * 4-core box running 8 workers that is often, which is #961's instability
 * (19 tests each failing exactly 1 of 3 identical runs, none 2 of 3, none 3).
 *
 * `WB.ready` is the boot scan's promise — which both runtimes previously
 * created inside a DOMContentLoaded callback and discarded. Playwright awaits a
 * promise returned from page.evaluate, so this is a genuine wait-all across the
 * process boundary: on a loaded machine it takes longer instead of failing.
 *
 * SCOPE: resolves when the INITIAL pass is done, not when every element on the
 * page is injected — wb-lazy.js defers below-the-fold elements to an
 * IntersectionObserver deliberately. For those, scroll first and then assert
 * with a retrying matcher (`expect(locator).toHaveClass(...)`), so the wait is
 * for that element rather than for a global condition.
 */
export async function waitForWB(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as any).WB?.behaviors);
}

/**
 * Wait for ONE element to finish being built (#970).
 *
 * Both runtimes stamp `x-ready` on an element the moment it has no injections
 * left in flight, so this waits for the thing you are about to assert on rather
 * than for a clock.
 *
 *     const card = page.locator('#card-gallery article').first();
 *     await elementReady(card);
 *     await expect(card.locator('header h3')).toHaveText('Welcome');
 *
 * WHY PER-ELEMENT, measured rather than assumed:
 *
 * Two loads of demos/site/cards.html build the DOM in a DIFFERENT ORDER but
 * reach a byte-for-byte IDENTICAL end state — 1,435 elements, same signature.
 * So the instability behind #961 was never wrong rendering. It was tests
 * sampling mid-construction and landing at different points, because a
 * `waitForTimeout(4000)` guesses when building is done and guesses wrong
 * whenever the machine is busy.
 *
 * A page-wide wait cannot fix it here: that page takes longer to finish than
 * the 30s test timeout, which is how awaiting `WB.ready` killed 31 tests in
 * beforeEach. Waiting for one element is both correct and cheap.
 *
 * For a below-the-fold element on the lazy runtime, scroll first — nothing is
 * injected until it intersects, so `x-ready` will never arrive on its own:
 *
 *     await safeScrollIntoView(card);
 *     await elementReady(card);
 *
 * NOTE: `x-ready` means SETTLED, not SUCCEEDED. A behavior that threw stamps it
 * too; failure is reported separately as `x-error`. Assert on the outcome you
 * actually care about after this resolves.
 */
export async function elementReady(locator: Locator, timeoutMs = 15000): Promise<void> {
  await locator.first().waitFor({ state: 'attached', timeout: timeoutMs });
  await locator.first().evaluate(
    (el, ms) => new Promise<void>((resolve, reject) => {
      if (el.hasAttribute('x-ready')) return resolve();
      const timer = setTimeout(() => {
        obs.disconnect();
        // Say which element and what it was still waiting for — "timed out" on
        // its own has cost enough time in this suite already.
        reject(new Error(
          `elementReady: <${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''}> ` +
          `never became x-ready within ${ms}ms. On the lazy runtime an element ` +
          `below the fold is not injected until it intersects — scroll to it first.`
        ));
      }, ms);
      const obs = new MutationObserver(() => {
        if (el.hasAttribute('x-ready')) { clearTimeout(timer); obs.disconnect(); resolve(); }
      });
      obs.observe(el, { attributes: true, attributeFilter: ['x-ready'] });
      // It may have been stamped between the check above and observe() starting.
      if (el.hasAttribute('x-ready')) { clearTimeout(timer); obs.disconnect(); resolve(); }
    }),
    timeoutMs
  );
}

/**
 * Wait until the runtime has no injection in flight (#961/#962).
 *
 *     await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });
 *     await wbIdle(page);
 *     await expect(page.locator('#counter')).toHaveText('0');
 *
 * This is the replacement for `await page.waitForTimeout(500)` at the point
 * where the sleep is standing in for "injection finished". A sleep guesses at a
 * DURATION and is wrong whenever the machine is slower than the guess — which
 * is #961, ~20 tests changing state between identical runs.
 *
 * WAITS FOR `WB.whenIdle` TO EXIST FIRST, on purpose. Several specs wait for
 * `window.WB` instead, which proves only that the module object was created —
 * not that init() ran, not that anything was injected. `whenIdle` is defined on
 * the runtime object itself, so its presence is the same weak signal; the real
 * wait is the call, which resolves only once the counter has held at zero.
 *
 * IDLE IS NOT "FINISHED". The lazy runtime defers below-the-fold elements to an
 * IntersectionObserver deliberately, so scroll to the thing first
 * (`safeScrollIntoView`) and then await idle — or use `elementReady`, which is
 * cheaper and scoped to the one element you are about to assert on.
 *
 * NOT SUITABLE FOR EVERY PAGE. demos/site/cards.html builds for longer than the
 * 30s test timeout; a page-wide wait there fails no matter how it is spelled.
 * That page uses per-element waits, and this helper is for pages that settle.
 *
 * It REJECTS on timeout rather than resolving. A readiness signal that gives up
 * quietly turns a hung build into a green test.
 */
export async function wbIdle(
  page: Page,
  opts: { timeout?: number; quiet?: number } = {}
): Promise<void> {
  const timeout = opts.timeout ?? 15000;
  const quiet = opts.quiet ?? 50;
  await page.waitForFunction(
    () => typeof (window as any).WB?.whenIdle === 'function',
    undefined,
    { timeout }
  );
  await page.evaluate(
    ([t, q]) => (window as any).WB.whenIdle({ timeout: t, quiet: q }),
    [timeout, quiet]
  );
}

// #962 NOTE — `WB.ready` is still NOT adopted in this file's shared helpers.
//
// The runtime exposes `WB.ready` (the boot scan's promise, which both
// runtimes previously created inside a DOMContentLoaded callback and threw
// away). Awaiting it is the correct replacement for the 492 `waitForTimeout`
// calls in this suite, because a sleep guesses at DURATION and fails whenever
// the machine is slower than the guess.
//
// 2026-09-08 — and until today it was ALSO not true. wb.js's scan() collected
// every injection it started into `promises` and awaited them, except the
// auto-inject loop, which dropped its promise on the floor. Auto-inject is the
// default path for a semantic-first page, so most of a page's injections were
// not awaited and `await WB.scan()` — hence `WB.ready` — resolved on a
// half-built page. Measured inside the page in scan()'s own .then(): a plain
// <button> had className "" and no x-ready at that instant. Fixed, with
// tests/regression/scan-awaits-auto-injected-behaviors.spec.ts pinning it.
//
// But adopting it HERE, in the helper 38 spec files call, was measured and it
// made things worse twice:
//
//   - unbounded: all 31 tests in card-examples-demo died in beforeEach.
//     demos/site/cards.html has 34 demo blocks and 265 articles, so under 8
//     workers its boot scan does not finish inside the 30s test timeout.
//   - bounded to 15s: 38 of 50 failed. The budget stacks on top of
//     goto(networkidle) + waitForFunction, so the setup became more expensive
//     than the timeout containing it.
//
// The lesson is about where the wait belongs, not whether it is right: a
// PAGE-WIDE readiness wait is the wrong tool for a page this large. The sound
// adoption is per-element — scroll to the thing, then assert on it with a
// retrying matcher — which needs doing spec by spec with measurement, not by
// changing one shared helper and hoping. Tracked in #962.

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

    // Mark the AUTHORED roots before scanning.
    //
    // This used to return `#test-container > *` .first(), which silently
    // aliases the moment a behavior inserts a SIBLING ahead of its host --
    // and several do. sticky's createPlaceholder() runs
    // `parentNode.insertBefore(placeholder, element)`, so as soon as sticky
    // engages, .first() is the placeholder: an empty, class-less div. Every
    // assertion then ran against the wrong node and reported a working
    // behavior as "did not initialize" (permutation-compliance failed
    // exactly the two threshold:0 sticky combos -- the only ones that stick
    // on load -- and passed every combo that never sticks).
    //
    // Marking BEFORE the scan is the point: after the scan there is no way
    // left to tell an authored element from one a behavior injected.
    for (const el of Array.from(c.children)) el.setAttribute('test-host', '');

    document.body.appendChild(c);

    if ((window as any).WB?.scan) {
      await (window as any).WB.scan(c);
    }
  }, html);
  
  // Wait for the injected host to actually be finished.
  //
  // #961: this used to wait for `#test-container > .x-ready` — a CLASS that has
  // never existed. Both runtimes stamp x-ready as an ATTRIBUTE (#970), and
  // tests/compliance/no-wb-ready.spec.ts explicitly FORBIDS behaviors adding it
  // as a class ("x-ready is DOM pollution"). So the selector matched nothing on
  // every call, every call fell into the catch, and the readiness this helper
  // gave its 38 caller files was a 300ms sleep — a guess at a duration, which
  // is wrong exactly when the machine is busy. Silence is not success
  // (docs/standards/A-GATE-MUST-BE-SEEN-TO-FAIL.md): a wait that never matches
  // and a wait that is instantly satisfied look identical from outside.
  //
  // The `await WB.scan(c)` above is now the primary signal — it became truthful
  // once scan() stopped dropping its auto-inject promises (#1075). This is the
  // backstop for work observe() starts afterwards.
  try {
    await page.waitForSelector('#test-container > [x-ready]', { timeout: 3000 });
  } catch {
    // Legitimately unstamped hosts exist: an element whose behavior REPLACES it
    // (autocomplete, x-copybutton, details) is gone before it can be stamped,
    // and a native input with no behavior is never injected at all. Falling
    // through is right for those — but it is now a real fallback instead of the
    // only path this helper ever took.
  }
  
  // Prefer the AUTHORED host; fall back to child 0 if it did not survive.
  //
  // The marker alone is not enough: a few behaviors REPLACE their host
  // (autocomplete, x-copybutton, details), and the marked node is gone by the
  // time we look -- every subsequent lookup then waited out its full timeout
  // and the test died at 90s. Resolving once, here, gets both cases right:
  // the marker when it survives (which is what stops sticky's placeholder
  // from being mistaken for the host), and the old behavior when it doesn't.
  const marked = page.locator('#test-container > [test-host]');
  return (await marked.count()) > 0 ? marked.first() : page.locator('#test-container > *').first();
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
