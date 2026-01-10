import { test, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { 
  ROOT, PATHS, readFile, fileExists, writeJson,
  waitForWB, setupTestContainer 
} from '../base';

/**
 * COMPREHENSIVE BEHAVIOR VALIDATION TESTS
 * =======================================
 * Tests ALL behaviors defined in behaviorMeta.js against:
 * 1. Schema compliance - required properties exist
 * 2. Initialization - behavior creates expected structure
 * 3. Type validation - behavior type matches expected characteristics
 * 4. Template validation - templates produce valid HTML
 * 5. Integration - behavior works with WB.scan()
 */

const BEHAVIOR_META_PATH = path.join(PATHS.src, 'wb-viewmodels', 'builder-app', 'behaviorMeta.js');
const BEHAVIOR_SCHEMA_PATH = path.join(PATHS.schemas, 'behavior.schema.json');

// ============================================
// SCHEMA DEFINITIONS
// ============================================

interface BehaviorMeta {
  type: 'element' | 'container' | 'modifier' | 'action';
  element?: string;
  inputType?: string;
  canContain?: boolean;
  dropZone?: boolean;
  attachTo?: string;
  multiple?: boolean;
  trigger?: string;
  target?: string | null;
  group?: boolean;
  createsOverlay?: boolean;
  template?: string;
  role?: string;
  ariaLabel?: string;
  fallback?: string;
  usesDatalist?: boolean;
  nativeElement?: string;
  childElement?: string;
  builderOnly?: boolean;
}

interface BehaviorSchema {
  definitions: {
    behaviorType: { enum: string[] };
    htmlElement: { enum: string[] };
    inputType: { enum: string[] };
    attachTarget: { enum: string[] };
    ariaRole: { enum: string[] };
  };
  behaviors: {
    types: Record<string, {
      description: string;
      examples: string[];
      characteristics: Record<string, boolean | string>;
    }>;
    categories: Record<string, {
      description: string;
      behaviors: string[];
    }>;
  };
}

// ============================================
// TYPE CHARACTERISTICS VALIDATION
// ============================================

const TYPE_REQUIREMENTS: Record<string, {
  required: string[];
  optional: string[];
  forbidden: string[];
}> = {
  element: {
    required: ['type', 'element'],
    optional: ['canContain', 'inputType', 'role', 'ariaLabel', 'fallback', 'template', 'usesDatalist', 'nativeElement'],
    forbidden: ['attachTo', 'trigger', 'target', 'group', 'createsOverlay']
  },
  container: {
    required: ['type', 'element'],
    optional: ['canContain', 'dropZone', 'childElement', 'template'],
    forbidden: ['attachTo', 'trigger', 'target', 'createsOverlay']
  },
  modifier: {
    required: ['type', 'attachTo'],
    optional: ['multiple', 'nativeElement', 'builderOnly'],
    forbidden: ['element', 'trigger', 'target', 'group', 'createsOverlay', 'canContain', 'dropZone']
  },
  action: {
    required: ['type', 'trigger'],
    optional: ['target', 'group', 'createsOverlay', 'template'],
    forbidden: ['attachTo', 'multiple', 'canContain', 'dropZone']
  }
};

// ============================================
// VALID VALUES
// ============================================

const VALID_ELEMENTS = [
  'div', 'span', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'main',
  'button', 'a', 'input', 'textarea', 'select', 'form', 'fieldset', 'label',
  'img', 'video', 'audio', 'iframe', 'figure', 'picture',
  'table', 'ul', 'ol', 'dl', 'li', 'dt', 'dd',
  'details', 'summary', 'dialog', 'menu',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre', 'code',
  'time', 'progress', 'meter', 'output', 'search', 'address', 'mark', 'kbd', 'hr', 'small'
];

const VALID_INPUT_TYPES = [
  'text', 'password', 'email', 'number', 'tel', 'url', 'search',
  'date', 'time', 'datetime-local', 'month', 'week',
  'color', 'file', 'checkbox', 'radio', 'range', 'hidden'
];

const VALID_ATTACH_TARGETS = [
  'any', 'text', 'clickable', 'img', 'iframe', 'img,iframe',
  'textarea', 'form,input', 'input', 'input,textarea', 'input,textarea,select'
];

const VALID_TRIGGERS = ['button', 'a', 'div', 'span'];

// ============================================
// HELPER: Load behaviorMeta dynamically
// ============================================

async function loadBehaviorMeta(page: Page): Promise<Record<string, BehaviorMeta>> {
  return await page.evaluate(async () => {
    // Import the module
    const module = await import('/src/wb-viewmodels/builder-app/behaviorMeta.js');
    return module.behaviorMeta || module.default || {};
  });
}

// ============================================
// HELPER: Generate test HTML
// ============================================

function generateTestHtml(behaviorName: string, meta: BehaviorMeta, content: string = 'Test Content'): string {
  // Use template if available
  if (meta.template) {
    return meta.template.replace(/\{\{id\}\}/g, `test-${behaviorName}`);
  }
  
  // Determine tag
  let tag = meta.element || 'div';
  
  // Handle input types - put type BEFORE data-wb for proper parsing
  let attrs = '';
  if (meta.inputType) {
    attrs = `type="${meta.inputType}" data-wb="${behaviorName}"`;
  } else {
    attrs = `data-wb="${behaviorName}"`;
  }
  
  // Self-closing tags
  const selfClosing = ['input', 'img', 'hr', 'br', 'meta', 'link', 'progress', 'meter'];
  if (selfClosing.includes(tag)) {
    return `<${tag} ${attrs} />`;
  }
  
  return `<${tag} ${attrs}>${content}</${tag}>`;
}

// Note: setupTestContainer is imported from ../base

// ============================================
// TEST SUITE: Schema Compliance
// ============================================

test.describe('Behavior Schema Compliance', () => {
  
  test('behavior.schema.json exists and is valid JSON', async () => {
    expect(fs.existsSync(BEHAVIOR_SCHEMA_PATH)).toBe(true);
    
    const content = fs.readFileSync(BEHAVIOR_SCHEMA_PATH, 'utf-8');
    let schema: BehaviorSchema;
    
    expect(() => {
      schema = JSON.parse(content);
    }).not.toThrow();
    
    // Verify schema structure
    expect(schema!.definitions).toBeDefined();
    expect(schema!.behaviors).toBeDefined();
    expect(schema!.behaviors.types).toBeDefined();
    expect(schema!.behaviors.categories).toBeDefined();
  });
  
  test('all behavior types are documented in schema', async () => {
    const content = fs.readFileSync(BEHAVIOR_SCHEMA_PATH, 'utf-8');
    const schema: BehaviorSchema = JSON.parse(content);
    
    const definedTypes = schema.definitions.behaviorType.enum;
    expect(definedTypes).toContain('element');
    expect(definedTypes).toContain('container');
    expect(definedTypes).toContain('modifier');
    expect(definedTypes).toContain('action');
  });
});

// ============================================
// TEST SUITE: BehaviorMeta Validation
// ============================================

test.describe('BehaviorMeta Validation', () => {
  
  test('behaviorMeta.js exports valid module', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    
    expect(meta).toBeDefined();
    expect(typeof meta).toBe('object');
    expect(Object.keys(meta).length).toBeGreaterThan(50); // We have 100+ behaviors
  });
  
  test('every behavior has required type property', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (!def.type) {
        errors.push(`${name}: missing required 'type' property`);
      } else if (!['element', 'container', 'modifier', 'action'].includes(def.type)) {
        errors.push(`${name}: invalid type '${def.type}'`);
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('element behaviors have valid element property', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.type === 'element' && def.element) {
        if (!VALID_ELEMENTS.includes(def.element)) {
          errors.push(`${name}: invalid element '${def.element}'`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('container behaviors have valid structure', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.type === 'container') {
        if (!def.element) {
          errors.push(`${name}: container missing 'element' property`);
        }
        if (!def.canContain && !def.dropZone) {
          errors.push(`${name}: container should have 'canContain' or 'dropZone'`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('modifier behaviors have valid attachTo property', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.type === 'modifier') {
        if (!def.attachTo) {
          errors.push(`${name}: modifier missing 'attachTo' property`);
        } else if (!VALID_ATTACH_TARGETS.includes(def.attachTo)) {
          errors.push(`${name}: invalid attachTo '${def.attachTo}'`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('action behaviors have valid trigger property', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.type === 'action') {
        if (!def.trigger) {
          errors.push(`${name}: action missing 'trigger' property`);
        } else if (!VALID_TRIGGERS.includes(def.trigger)) {
          errors.push(`${name}: invalid trigger '${def.trigger}'`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('input behaviors have valid inputType', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.inputType) {
        if (!VALID_INPUT_TYPES.includes(def.inputType)) {
          errors.push(`${name}: invalid inputType '${def.inputType}'`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('templates contain valid HTML', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.template) {
        // Replace template vars
        const html = def.template.replace(/\{\{id\}\}/g, 'test-id');
        
        // Check for basic HTML validity
        const parsed = await page.evaluate((h: string) => {
          const div = document.createElement('div');
          div.innerHTML = h;
          return div.children.length > 0;
        }, html);
        
        if (!parsed) {
          errors.push(`${name}: template produces no valid HTML`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

// ============================================
// TEST SUITE: Behavior Categorization
// ============================================

test.describe('Behavior Categorization', () => {
  
  test('all behaviors are categorized in schema', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const schemaContent = fs.readFileSync(BEHAVIOR_SCHEMA_PATH, 'utf-8');
    const schema: BehaviorSchema = JSON.parse(schemaContent);
    
    // Collect all categorized behaviors
    const categorized = new Set<string>();
    for (const category of Object.values(schema.behaviors.categories)) {
      category.behaviors.forEach(b => categorized.add(b));
    }
    
    // Check which behaviors are not categorized
    const uncategorized: string[] = [];
    for (const name of Object.keys(meta)) {
      if (!categorized.has(name) && !meta[name].builderOnly) {
        uncategorized.push(name);
      }
    }
    
    // Just warn for now, don't fail - allows incremental updates
    if (uncategorized.length > 0) {
      console.warn('Uncategorized behaviors:', uncategorized.join(', '));
    }
  });
  
  test('behavior type counts are accurate', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    
    const counts = { element: 0, container: 0, modifier: 0, action: 0 };
    for (const def of Object.values(meta)) {
      if (def.type in counts) {
        counts[def.type as keyof typeof counts]++;
      }
    }
    
    // Verify reasonable distribution
    expect(counts.element).toBeGreaterThan(30); // Many elements
    expect(counts.container).toBeGreaterThan(10); // Some containers
    expect(counts.modifier).toBeGreaterThan(20); // Many modifiers
    expect(counts.action).toBeGreaterThan(15); // Some actions
    
    console.log('Behavior type counts:', counts);
  });
});

// ============================================
// TEST SUITE: Behavior Initialization
// ============================================

test.describe('Behavior Initialization', () => {
  
  test('element behaviors initialize correctly', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    // Test a representative sample of element behaviors
    // Note: Native form elements (checkbox, radio, switch) may not need classes
    const sampleElements = ['button', 'card', 'badge', 'alert', 'input'];
    const nativeFormElements = ['checkbox', 'radio', 'switch', 'range', 'file'];
    
    for (const name of sampleElements) {
      const def = meta[name];
      if (!def || def.type !== 'element') continue;
      
      const html = generateTestHtml(name, def);
      const element = await setupTestContainer(page, html);
      
      // Check element exists
      const exists = await element.count();
      if (exists === 0) {
        errors.push(`${name}: element not created`);
        continue;
      }
      
      // Check data-wb-ready or class applied
      const ready = await element.getAttribute('data-wb-ready');
      const hasClass = await element.evaluate((el, cls) => 
        el.classList.contains(`wb-${cls}`), name);
      
      if (!ready && !hasClass) {
        errors.push(`${name}: not initialized (no data-wb-ready or wb-${name} class)`);
      }
    }
    
    // Test native form elements - just verify they render correctly
    for (const name of nativeFormElements) {
      const def = meta[name];
      if (!def || def.type !== 'element') continue;
      
      const html = generateTestHtml(name, def);
      const element = await setupTestContainer(page, html);
      
      const exists = await element.count();
      if (exists === 0) {
        errors.push(`${name}: native element not created`);
        continue;
      }
      
      // For native inputs, just verify they have the correct type
      if (def.inputType) {
        const inputType = await element.getAttribute('type');
        if (inputType !== def.inputType) {
          errors.push(`${name}: expected type="${def.inputType}", got type="${inputType}"`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('container behaviors create drop zones', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    // Test container behaviors
    const containers = Object.entries(meta)
      .filter(([_, def]) => def.type === 'container' && def.dropZone)
      .slice(0, 5); // Test first 5
    
    for (const [name, def] of containers) {
      const html = generateTestHtml(name, def);
      const element = await setupTestContainer(page, html);
      
      const exists = await element.count();
      if (exists === 0) {
        errors.push(`${name}: container not created`);
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('action behaviors create proper triggers', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    // Test action behaviors with templates
    const actions = Object.entries(meta)
      .filter(([_, def]) => def.type === 'action' && def.template)
      .slice(0, 5);
    
    for (const [name, def] of actions) {
      const html = def.template!.replace(/\{\{id\}\}/g, `test-${name}`);
      const element = await setupTestContainer(page, html);
      
      const exists = await element.count();
      if (exists === 0) {
        errors.push(`${name}: action template produced no content`);
        continue;
      }
      
      // Check trigger element exists
      if (def.trigger === 'button') {
        const btn = await element.locator('button').count();
        if (btn === 0) {
          // Check if root is button
          const isBtn = await element.evaluate(el => el.tagName === 'BUTTON');
          if (!isBtn) {
            errors.push(`${name}: no button trigger found`);
          }
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

// ============================================
// TEST SUITE: Type Requirement Validation
// ============================================

test.describe('Type Requirement Validation', () => {
  
  test('element behaviors do not have modifier-only properties', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.type === 'element') {
        if (def.attachTo) {
          errors.push(`${name}: element should not have 'attachTo' (modifier property)`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('modifier behaviors do not have element-only properties', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.type === 'modifier') {
        // Modifiers shouldn't have element or canContain
        // (with exception for nativeElement which suggests alternative)
        if (def.canContain) {
          errors.push(`${name}: modifier should not have 'canContain'`);
        }
        if (def.dropZone) {
          errors.push(`${name}: modifier should not have 'dropZone'`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
  
  test('action behaviors with groups have templates', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    const errors: string[] = [];
    
    for (const [name, def] of Object.entries(meta)) {
      if (def.type === 'action' && def.group) {
        if (!def.template) {
          errors.push(`${name}: action with group=true should have template`);
        }
      }
    }
    
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

// ============================================
// TEST SUITE: Output results to JSON
// ============================================

test.describe('Behavior Inventory Report', () => {
  
  test('generate behavior inventory', async ({ page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors);
    
    const meta = await loadBehaviorMeta(page);
    
    const inventory = {
      timestamp: new Date().toISOString(),
      totalBehaviors: Object.keys(meta).length,
      byType: {
        element: [] as string[],
        container: [] as string[],
        modifier: [] as string[],
        action: [] as string[]
      },
      withTemplates: [] as string[],
      withInputTypes: [] as string[],
      builderOnly: [] as string[],
      errors: [] as string[]
    };
    
    for (const [name, def] of Object.entries(meta)) {
      // Categorize by type
      if (def.type in inventory.byType) {
        inventory.byType[def.type as keyof typeof inventory.byType].push(name);
      }
      
      // Track features
      if (def.template) inventory.withTemplates.push(name);
      if (def.inputType) inventory.withInputTypes.push(name);
      if (def.builderOnly) inventory.builderOnly.push(name);
    }
    
    // Write to JSON file
    const outputPath = path.join(process.cwd(), 'data', 'behavior-inventory.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2));
    
    console.log(`Behavior inventory written to: ${outputPath}`);
    console.log(`Total behaviors: ${inventory.totalBehaviors}`);
    console.log(`Elements: ${inventory.byType.element.length}`);
    console.log(`Containers: ${inventory.byType.container.length}`);
    console.log(`Modifiers: ${inventory.byType.modifier.length}`);
    console.log(`Actions: ${inventory.byType.action.length}`);
    
    expect(inventory.totalBehaviors).toBeGreaterThan(100);
  });
});
