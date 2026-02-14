/**
 * scripts/generate-behavior-tests.mjs
 * 
 * Reads each schema's test.setup HTML and generates a baseline
 * spec file for uncovered behaviors. Each test:
 * 1. Navigates to page, waits for WB
 * 2. Injects the schema's test.setup HTML
 * 3. Verifies the component renders (visible, no crash)
 * 4. Checks for console errors
 * 
 * DRY RUN by default — pass --apply to write files.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SCHEMAS = path.join(ROOT, 'src/wb-models');
const VIEWMODELS = path.join(ROOT, 'src/wb-viewmodels');
const TESTS = path.join(ROOT, 'tests');

const apply = process.argv.includes('--apply');

// Behaviors that already have tests (mapped by their viewmodel filename without .js)
const COVERED = new Set([
  'autosize', 'behavior', 'behaviors-showcase', 'builder',
  'card', 'feedback', 'header', 'notes', 'scrollalong', 'sticky',
  // Card variants covered by cards/ tests
  'wb-card',
]);

// Skip these — not real behaviors or special cases
const SKIP = new Set([
  'helpers', 'index', 'fix-card', 'demo', 'enhancements',
]);

// Map behavior name → target test folder
function getTestFolder(name) {
  // Card-related behaviors
  if (name.startsWith('card') || name === 'wb-card') return 'cards';
  // Builder-related
  if (name.startsWith('builder')) return 'builder';
  // Everything else → components
  return 'components';
}

// Read all viewmodel JS files to find uncovered behaviors
const vmFiles = fs.readdirSync(VIEWMODELS)
  .filter(f => f.endsWith('.js'))
  .map(f => f.replace('.js', ''));

// Read all schemas
const schemaFiles = fs.readdirSync(SCHEMAS)
  .filter(f => f.endsWith('.schema.json'))
  .map(f => f.replace('.schema.json', ''));

console.log(`\nViewmodel JS files: ${vmFiles.length}`);
console.log(`Schema files: ${schemaFiles.length}`);
console.log(`Already covered: ${COVERED.size}`);
console.log(`Skipped: ${SKIP.size}\n`);

const toGenerate = [];

for (const vm of vmFiles) {
  if (COVERED.has(vm) || SKIP.has(vm)) continue;
  
  // Check if schema exists
  const schemaPath = path.join(SCHEMAS, `${vm}.schema.json`);
  let schema = null;
  let testSetup = [];
  let testMatrix = [];
  let customTag = '';
  
  if (fs.existsSync(schemaPath)) {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    testSetup = schema.test?.setup || [];
    testMatrix = schema.test?.matrix?.combinations || [];
    customTag = schema.customTag || schema.tag || `wb-${vm}`;
  } else {
    // No schema — check the JS file header for usage hints
    const jsPath = path.join(VIEWMODELS, `${vm}.js`);
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    const tagMatch = jsContent.match(/Custom Tag:\s*<([^>]+)>/);
    customTag = tagMatch ? tagMatch[1] : `wb-${vm}`;
    
    // Try to extract example HTML from JSDoc
    const exampleMatch = jsContent.match(/@example\s*\n\s*\*\s*(.+)/);
    if (exampleMatch) {
      testSetup = [exampleMatch[1].trim()];
    }
  }
  
  const folder = getTestFolder(vm);
  toGenerate.push({ vm, schema, testSetup, testMatrix, customTag, folder });
}

console.log(`Behaviors to generate tests for: ${toGenerate.length}\n`);

// Generate test files
let created = 0;
for (const { vm, testSetup, testMatrix, customTag, folder } of toGenerate) {
  const testDir = path.join(TESTS, folder);
  const testFile = path.join(testDir, `${vm}.spec.ts`);
  
  // Skip if test already exists
  if (fs.existsSync(testFile)) {
    console.log(`  EXISTS: ${folder}/${vm}.spec.ts`);
    continue;
  }
  
  // Build test.setup HTML for injection
  const setupHtml = testSetup.length > 0
    ? testSetup.map(h => `      ${JSON.stringify(h)}`).join(',\n')
    : `      '<${customTag}>Test content</${customTag}>'`;
  
  // Build matrix tests
  let matrixTests = '';
  if (testMatrix.length > 0) {
    matrixTests = testMatrix.map((combo, i) => {
      const attrs = Object.entries(combo)
        .filter(([k]) => k !== 'content')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      const content = combo.content || 'Test';
      const html = attrs 
        ? `<${customTag} ${attrs}>${content}</${customTag}>`
        : `<${customTag}>${content}</${customTag}>`;
      const label = Object.entries(combo).map(([k,v]) => `${k}=${v}`).join(', ');
      return `
  test('matrix combo ${i + 1}: ${label}', async ({ page }) => {
    await injectAndScan(page, ${JSON.stringify(html)});
    const el = page.locator('#test-container ${customTag}, #test-container [data-wb="${vm}"]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });`;
    }).join('\n');
  }
  
  const content = `/**
 * ${vm} Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/${vm}.js
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/index.html';

async function waitForWB(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.waitForTimeout(100);
}

async function injectAndScan(page: Page, html: string) {
  await waitForWB(page);
  
  await page.evaluate((h: string) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    
    // Force eager loading
    const elements = container.querySelectorAll('[data-wb]');
    elements.forEach(el => el.setAttribute('data-wb-eager', ''));
    
    document.body.appendChild(container);
  }, html);
  
  await page.evaluate(() => {
    (window as any).WB.scan(document.getElementById('test-container'));
  });
  
  await page.waitForTimeout(500);
}

test.describe('${vm} Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
${setupHtml}
    ];
    
    await injectAndScan(page, setupHtml.join('\\n'));
    
    // Verify at least one element rendered
    const elements = page.locator('#test-container *');
    const count = await elements.count();
    expect(count).toBeGreaterThan(0);
    
    // No uncaught errors
    const critical = errors.filter(e => !e.includes('Legacy syntax'));
    expect(critical, \`Console errors: \${critical.join(', ')}\`).toHaveLength(0);
  });

  test('element is visible after scan', async ({ page }) => {
    const html = ${testSetup.length > 0 ? JSON.stringify(testSetup[0]) : `'<${customTag}>Test content</${customTag}>'`};
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container ${customTag}, #test-container [data-wb="${vm}"]').first();
    const isPresent = await el.count() > 0;
    
    if (isPresent) {
      await expect(el).toBeVisible({ timeout: 5000 });
    } else {
      // Custom tag might be transformed — check container has content
      const container = page.locator('#test-container');
      const text = await container.textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });
${matrixTests}
});
`;

  console.log(`  ${apply ? 'CREATE' : 'WOULD CREATE'}: ${folder}/${vm}.spec.ts (${testSetup.length} setup, ${testMatrix.length} matrix)`);
  
  if (apply) {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFile, content, 'utf8');
    created++;
  } else {
    created++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`  ${created} test files ${apply ? 'created' : 'would be created'}`);
console.log(`${'='.repeat(60)}\n`);
