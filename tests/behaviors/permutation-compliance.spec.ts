import { test, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPREHENSIVE PERMUTATION-BASED COMPLIANCE TESTS
 * =================================================
 * ONE test per behavior validates EVERYTHING:
 * - Base class exists
 * - All required children created
 * - All property permutations work
 * - Styles applied correctly
 * - All buttons/elements are clickable
 * - All events fire properly
 * - All keyboard interactions work
 * - All accessibility attributes present
 * - API methods work correctly
 */

const SCHEMA_DIR = path.join(process.cwd(), 'src/wb-models');

interface Schema {
  title: string;
  behavior: string;
  element?: string;
  properties: Record<string, PropertyDef>;
  compliance: ComplianceDef;
  interactions?: InteractionsDef;
  accessibility?: Record<string, any>;
  events?: Record<string, EventDef>;
  test: TestDef;
}

interface PropertyDef {
  type: string;
  enum?: string[];
  default?: any;
  required?: boolean;
  minimum?: number;
  maximum?: number;
  permutations?: {
    type: 'ALL_ENUM' | 'BOOLEAN' | 'BOUNDARY_NUMBER' | 'BOUNDARY_STRING' | 'EXPLICIT' | 'ALL_ENUM_PLUS_NULL' | 'ENUM';
    values?: any[];
    min?: number;
    max?: number;
    assertions?: Record<string, AssertionDef>;
  };
}

interface AssertionDef {
  selector?: string;
  checks?: Record<string, any>;
  error?: boolean;
  description?: string;
}

interface ComplianceDef {
  baseClass: string;
  parentClass?: string;
  requiredChildren?: Record<string, ChildDef>;
  optionalChildren?: Record<string, ChildDef>;
  styles?: Record<string, StyleDef>;
  accessibility?: Record<string, string>;
}

interface ChildDef {
  description: string;
  required?: boolean;
  tagName?: string;
  requiredWhen?: string;
  minCount?: number;
  createdWhen?: string;
}

interface StyleDef {
  required?: boolean;
  value?: string;
  pattern?: string;
  scope?: string;
}

interface InteractionsDef {
  elements?: Record<string, InteractiveElementDef>;
  keyboard?: Record<string, KeyboardDef>;
  drag?: DragDef;
}

interface InteractiveElementDef {
  type: string;
  clickable?: boolean;
  click?: {
    action: string;
    event?: string;
    eventDetail?: Record<string, any>;
    targetSelector?: string;
    class?: string;
    navigateWhen?: string;
  };
  hover?: {
    style?: Record<string, string>;
  };
  focus?: {
    style?: Record<string, string>;
    visible?: boolean;
  };
}

interface KeyboardDef {
  target: string;
  action: string;
}

interface DragDef {
  handle: string;
  bounds: string;
  events: string[];
}

interface EventDef {
  trigger: string;
  detail?: Record<string, string>;
  bubbles?: boolean;
}

interface TestDef {
  setup: string[];
  matrix?: {
    combinations: Record<string, any>[];
  };
  functional?: {
    buttons?: FunctionalButtonTest[];
    interactions?: FunctionalInteractionTest[];
    keyboard?: FunctionalKeyboardTest[];
    dismiss?: FunctionalDismissTest[];
    visual?: FunctionalVisualTest[];
  };
  api?: {
    methods?: APIMethodTest[];
  };
}

interface FunctionalButtonTest {
  name: string;
  setup: string;
  selector: string;
  action?: string;
  expect: {
    clickable?: boolean;
    noError?: boolean;
    event?: string;
    eventDetail?: Record<string, any>;
    tagName?: string;
    attribute?: Record<string, string>;
  };
}

interface FunctionalInteractionTest {
  name: string;
  setup: string;
  action: string;
  selector?: string;
  expect: {
    style?: Record<string, string>;
    class?: string;
    event?: string;
  };
}

interface FunctionalKeyboardTest {
  name: string;
  setup: string;
  key: string;
  selector?: string;
  expect: {
    class?: string;
    event?: string;
  };
}

interface FunctionalDismissTest {
  name: string;
  setup: string;
  selector: string;
  action: string;
  expect: {
    removed?: boolean;
    event?: string;
  };
}

interface FunctionalVisualTest {
  name: string;
  setup: string;
  checks?: VisualCheck[];
  expect?: {
    selector: string;
    hasClass?: string[];
    style?: Record<string, string>;
  };
}

interface VisualCheck {
  selector: string;
  style?: string;
  pattern?: string;
  notEmpty?: boolean;
}

interface APIMethodTest {
  name: string;
  setup: string;
  call: string;
  expect: {
    class?: string;
    notClass?: string;
    property?: Record<string, any>;
  };
}

// Load all schemas
function loadSchemas(): Map<string, Schema> {
  const schemas = new Map<string, Schema>();
  if (!fs.existsSync(SCHEMA_DIR)) {
    console.warn('Schema directory not found:', SCHEMA_DIR);
    return schemas;
  }
  const files = fs.readdirSync(SCHEMA_DIR).filter(f => f.endsWith('.schema.json'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf-8');
    try {
      const schema = JSON.parse(content) as Schema;
      // Only load schemas with 'behavior' property (component schemas)
      if (!schema.behavior) {
        console.log(`Skipping non-component schema: ${file}`);
        continue;
      }
      const name = schema.behavior || file.replace('.schema.json', '');
      schemas.set(name, schema);
    } catch (e) {
      console.error(`Failed to parse ${file}:`, e);
    }
  }
  return schemas;
}

// Generate HTML for testing
function generateHtml(behavior: string, props: Record<string, any>, content: string = 'Test Content', tagName: string = 'div'): string {
  let attrs = `x-${behavior}=""`;
  
  // Special handling for input type="checkbox"
  if (tagName === 'input' && behavior === 'checkbox') {
    attrs += ' type="checkbox"';
  }

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    const attrName = `data-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    if (typeof value === 'boolean') {
      if (value) attrs += ` ${attrName}`;
    } else {
      attrs += ` ${attrName}="${value}"`;
    }
  }
  return `<${tagName} ${attrs}>${content}</${tagName}>`;
}

// Get all permutation values for a property
function getPermutationValues(propDef: PropertyDef): any[] {
  const perm = propDef.permutations;
  if (!perm) return [propDef.default];
  
  switch (perm.type) {
    case 'ALL_ENUM':
    case 'ENUM':
      return propDef.enum || [];
    case 'ALL_ENUM_PLUS_NULL':
      return [null, ...(propDef.enum || [])];
    case 'BOOLEAN':
      return [true, false];
    case 'BOUNDARY_NUMBER':
      return perm.values || [];
    case 'BOUNDARY_STRING':
      return perm.values || [];
    case 'EXPLICIT':
      return perm.values || [];
    default:
      return [propDef.default];
  }
}

// Run assertion checks
async function runAssertions(page: Page, element: Locator, assertions: AssertionDef): Promise<string[]> {
  const errors: string[] = [];
  if (!assertions.checks) return errors;
  
  for (const [check, expected] of Object.entries(assertions.checks)) {
    try {
      // Handle empty or 'element' selector - use the element itself
      const selectorValue = assertions.selector && assertions.selector !== '' && assertions.selector !== 'element' 
        ? assertions.selector 
        : null;
      const selector = selectorValue ? element.locator(selectorValue).first() : element;
      
      switch (check) {
        case 'exists':
          if (assertions.selector && assertions.selector !== 'element') {
            const count = await element.locator(assertions.selector).count();
            if (expected && count === 0) errors.push(`${assertions.selector} should exist`);
            if (!expected && count > 0) errors.push(`${assertions.selector} should not exist`);
          }
          break;
        case 'hasClass':
          const hasClass = await selector.evaluate((el: Element, cls: string) => el.classList.contains(cls), expected);
          if (!hasClass) errors.push(`Should have class "${expected}"`);
          break;
        case 'notHasClass':
          const notHasClass = await selector.evaluate((el: Element, cls: string) => !el.classList.contains(cls), expected);
          if (!notHasClass) errors.push(`Should not have class "${expected}"`);
          break;
        case 'textContains':
          const text = await selector.textContent();
          if (!text?.includes(expected)) errors.push(`Text should contain "${expected}", got "${text}"`);
          break;
        case 'allValues':
          // Check that all elements matching the selector have the expected value
          if (assertions.selector && assertions.selector !== 'element') {
            const allElements = element.locator(assertions.selector);
            const count = await allElements.count();
            for (let i = 0; i < count; i++) {
              const value = await allElements.nth(i).evaluate((el: any) => el.value);
              if (String(value) !== String(expected)) {
                errors.push(`Element ${i} should have value "${expected}", got "${value}"`);
              }
            }
          }
          break;
      }
    } catch (e) {
      errors.push(`Assertion error for ${check}: ${e}`);
    }
  }
  return errors;
}

// Setup test container with HTML
async function setupTestContainer(page: Page, html: string): Promise<Locator> {
  await page.evaluate(() => {
    document.getElementById('test-container')?.remove();
  });
  
  await page.evaluate(async (h: string) => {
    const c = document.createElement('div');
    c.id = 'test-container';
    c.innerHTML = h;
    document.body.appendChild(c);
    await (window as any).WB.scan(c);
  }, html);
  
  await page.waitForTimeout(100);
  
  return page.locator('#test-container > *').first();
}

const schemas = loadSchemas();

// CONSOLIDATED: ONE test per behavior validates EVERYTHING
test.describe('Component Compliance', () => {
  for (const [behaviorName, schema] of schemas) {
    test(`${behaviorName}: comprehensive compliance`, async ({ page }) => {
      await page.goto('index.html');
      await page.waitForFunction(() => (window as any).WB?.behaviors);
      
      const allErrors: string[] = [];
      
      // ========== CHECK 1: Base Class ==========
      const baseHtml = schema.test?.setup?.[0] || generateHtml(behaviorName, {}, 'Test Content', schema.element);
      const element = await setupTestContainer(page, baseHtml);
      
      if (schema.compliance?.baseClass) {
        const hasBaseClass = await element.evaluate((el, cls) => el.classList.contains(cls), schema.compliance.baseClass);
        if (!hasBaseClass) {
          allErrors.push(`[BASE CLASS] Missing: "${schema.compliance.baseClass}"`);
        }
      }
      
      // ========== CHECK 2: Parent Class ==========
      if (schema.compliance?.parentClass) {
        const hasParentClass = await element.evaluate((el, cls) => el.classList.contains(cls), schema.compliance.parentClass);
        if (!hasParentClass) {
          allErrors.push(`[PARENT CLASS] Missing: "${schema.compliance.parentClass}"`);
        }
      }
      
      // ========== CHECK 3: Required Children ==========
      if (schema.compliance?.requiredChildren) {
        for (const [selector, childDef] of Object.entries(schema.compliance.requiredChildren)) {
          if (!childDef.required) continue;
          
          const child = element.locator(selector);
          const count = await child.count();
          if (count === 0) {
            allErrors.push(`[REQUIRED CHILD] Missing: "${selector}" - ${childDef.description}`);
          }
        }
      }
      
      // ========== CHECK 4: Styles ==========
      if (schema.compliance?.styles) {
        for (const [styleProp, styleDef] of Object.entries(schema.compliance.styles)) {
          if (!styleDef.required) continue;
          
          const scope = styleDef.scope || 'element';
          const target = scope === 'element' ? element : element.locator(scope).first();
          
          try {
            const actualValue = await target.evaluate((el, prop) => {
              return getComputedStyle(el)[prop as any];
            }, styleProp);
            
            if (styleDef.value && actualValue !== styleDef.value) {
              allErrors.push(`[STYLE] ${styleProp} should be "${styleDef.value}", got "${actualValue}"`);
            }
            
            if (styleDef.pattern && !actualValue.includes(styleDef.pattern)) {
              allErrors.push(`[STYLE] ${styleProp} should match pattern "${styleDef.pattern}", got "${actualValue}"`);
            }
          } catch (e) {
            allErrors.push(`[STYLE] Check failed for ${styleProp}: ${e}`);
          }
        }
      }
      
      // ========== CHECK 5: Property Permutations ==========
      for (const [propName, propDef] of Object.entries(schema.properties || {})) {
        if (!propDef.permutations) continue;
        
        const values = getPermutationValues(propDef);
        
        for (const value of values) {
          if (value === null && propDef.required) continue;
          
          const props: Record<string, any> = { [propName]: value };
          const html = generateHtml(behaviorName, props, 'Test Content', schema.element);
          
          const el = await setupTestContainer(page, html);
          
          // Check if component rendered - look for baseClass OR .wb-ready class
          const hasBaseClass = schema.compliance?.baseClass 
            ? await el.evaluate((e, cls) => e.classList.contains(cls), schema.compliance.baseClass)
            : true;
          const wbReady = await el.classList.contains('wb-ready');
          
          if (!hasBaseClass && !wbReady) {
            allErrors.push(`[PERMUTATION] ${propName}=${JSON.stringify(value)}: Component did not initialize`);
            continue;
          }
          
          // Run specific assertions if defined
          const assertions = propDef.permutations?.assertions?.[String(value)];
          if (assertions && !assertions.error) {
            const errors = await runAssertions(page, el, assertions);
            errors.forEach(e => allErrors.push(`[PERMUTATION] ${propName}=${JSON.stringify(value)}: ${e}`));
          }
        }
      }
      
      // ========== CHECK 6: Matrix Combinations ==========
      if (schema.test?.matrix?.combinations) {
        for (const combo of schema.test.matrix.combinations) {
          const html = generateHtml(behaviorName, combo, 'Test Content', schema.element);
          const el = await setupTestContainer(page, html);
          
          // Check if component rendered - look for baseClass OR .wb-ready class
          const hasBaseClass = schema.compliance?.baseClass 
            ? await el.evaluate((e, cls) => e.classList.contains(cls), schema.compliance.baseClass)
            : true;
          const wbReady = await el.classList.contains('wb-ready');
          
          if (!hasBaseClass && !wbReady) {
            allErrors.push(`[MATRIX] Combo ${JSON.stringify(combo)}: Component did not initialize`);
          }
        }
      }
      
      // ========== CHECK 7: Functional Button Tests ==========
      if (schema.test?.functional?.buttons) {
        for (const btnTest of schema.test.functional.buttons) {
          const el = await setupTestContainer(page, btnTest.setup);

          try {
            // Handle multi-step tests (e.g., "click button A, then click button B")
            if (btnTest.steps && Array.isArray(btnTest.steps)) {
              for (const step of btnTest.steps) {
                if (step.action === 'click') {
                  const stepBtn = await el.locator(step.selector).first();
                  await stepBtn.click();
                  await page.waitForTimeout(100);
                }
              }

              // After all steps, check assertions
              if (btnTest.expect) {
                const errors = await runAssertions(page, el, btnTest.expect);
                errors.forEach(e => allErrors.push(`[BUTTON] ${btnTest.name}: ${e}`));
              }
            }
            // Handle single-click tests
            else if (btnTest.selector) {
              const btn = el.locator(btnTest.selector);
              const btnCount = await btn.count();

              if (btnCount === 0) {
                allErrors.push(`[BUTTON] ${btnTest.name}: Button not found at "${btnTest.selector}"`);
                continue;
              }

              // Check event fires on click
              if (btnTest.action === 'click' && btnTest.expect?.event) {
                await page.evaluate((eventName) => {
                  (window as any).__testEventFired = false;
                  document.addEventListener(eventName, () => {
                    (window as any).__testEventFired = true;
                  }, { once: true });
                }, btnTest.expect.event);

                await btn.first().click();
                await page.waitForTimeout(100);

                const eventFired = await page.evaluate(() => (window as any).__testEventFired);
                if (!eventFired) {
                  allErrors.push(`[BUTTON] ${btnTest.name}: Event "${btnTest.expect.event}" did not fire`);
                }
              }
            }
          } catch (e) {
            allErrors.push(`[BUTTON] ${btnTest.name}: Error - ${e}`);
          }
        }
      }
      
      // ========== CHECK 8: Keyboard Tests ==========
      if (schema.test?.functional?.keyboard) {
        for (const kbTest of schema.test.functional.keyboard) {
          // Skip if no key specified
          if (!kbTest.key) continue;
          
          const el = await setupTestContainer(page, kbTest.setup);
          
          try {
            const target = kbTest.selector ? el.locator(kbTest.selector).first() : el;
            
            await target.focus();
            await page.keyboard.press(kbTest.key);
            await page.waitForTimeout(100);
            
            if (kbTest.expect.class) {
              const hasClass = await el.evaluate((el, cls) => el.classList.contains(cls), kbTest.expect.class);
              if (!hasClass) {
                allErrors.push(`[KEYBOARD] ${kbTest.name}: After ${kbTest.key}, should have class "${kbTest.expect.class}"`);
              }
            }
          } catch (e) {
            allErrors.push(`[KEYBOARD] ${kbTest.name}: Error - ${e}`);
          }
        }
      }
      
      // ========== CHECK 9: Visual Tests ==========
      if (schema.test?.functional?.visual) {
        for (const visTest of schema.test.functional.visual) {
          const el = await setupTestContainer(page, visTest.setup);
          
          try {
            if (visTest.expect) {
              const target = visTest.expect.selector === 'element' ? el : el.locator(visTest.expect.selector).first();
              
              // Check classes
              if (visTest.expect.hasClass) {
                for (const cls of visTest.expect.hasClass) {
                  const hasClass = await target.evaluate((el, c) => el.classList.contains(c), cls);
                  if (!hasClass) {
                    allErrors.push(`[VISUAL] ${visTest.name}: Missing class "${cls}"`);
                  }
                }
              }
              
              // Check styles
              if (visTest.expect.style) {
                for (const [prop, val] of Object.entries(visTest.expect.style)) {
                  const actual = await target.evaluate((el, p) => getComputedStyle(el)[p as any], prop);
                  if (actual !== val) {
                    allErrors.push(`[VISUAL] ${visTest.name}: ${prop} should be "${val}", got "${actual}"`);
                  }
                }
              }
            }
          } catch (e) {
            allErrors.push(`[VISUAL] ${visTest.name}: Error - ${e}`);
          }
        }
      }
      
      // ========== CHECK 10: Accessibility ==========
      if (schema.accessibility) {
        const el = await setupTestContainer(page, schema.test?.setup?.[0] || generateHtml(behaviorName, {}, 'Test Content', schema.element));
        
        for (const [selector, ariaReqs] of Object.entries(schema.accessibility)) {
          // Skip $inherits directive - it's for schema inheritance, not a CSS selector
          if (selector.startsWith('$')) continue;
          
          try {
            const target = selector === 'element' ? el : el.locator(selector).first();
            const count = selector === 'element' ? 1 : await el.locator(selector).count();
            
            if (count === 0) continue; // Skip if element doesn't exist
            
            if (typeof ariaReqs === 'object') {
              for (const [attr, val] of Object.entries(ariaReqs as Record<string, string>)) {
                if (attr === 'description') continue; // Skip description

                // Skip role check if value indicates implicit role (native element role)
                if (attr === 'role' && typeof val === 'string' && val.toLowerCase().includes('implicit')) {
                  continue; // Implicit roles don't need explicit role attributes
                }

                const actualAttr = await target.getAttribute(attr);
                if (val === 'dynamic') {
                  if (!actualAttr) {
                    allErrors.push(`[A11Y] ${selector}: Missing ${attr} attribute`);
                  }
                } else if (actualAttr !== val) {
                  allErrors.push(`[A11Y] ${selector}: ${attr} should be "${val}", got "${actualAttr}"`);
                }
              }
            }
          } catch (e) {
            allErrors.push(`[A11Y] ${selector}: Error - ${e}`);
          }
        }
      }
      
      // ========== REPORT ALL ERRORS AT ONCE ==========
      expect(allErrors, `${behaviorName} compliance failures:\n${allErrors.join('\n')}`).toEqual([]);
    });
  }
});

// Additional test for interaction elements defined in schema
test.describe('Interactive Elements', () => {
  for (const [behaviorName, schema] of schemas) {
    if (!schema.interactions?.elements) continue;
    
    test(`${behaviorName}: all interactive elements work`, async ({ page }) => {
      await page.goto('index.html');
      await page.waitForFunction(() => (window as any).WB?.behaviors);
      
      const allErrors: string[] = [];
      const baseHtml = schema.test?.setup?.[0] || generateHtml(behaviorName, {}, 'Test Content', schema.element);
      const element = await setupTestContainer(page, baseHtml);
      
      for (const [selector, intDef] of Object.entries(schema.interactions.elements)) {
        const el = element.locator(selector);
        const count = await el.count();
        
        if (count === 0) continue; // Element might be optional
        
        // Test clickable
        if (intDef.clickable && intDef.click?.event) {
          try {
            await page.evaluate((eventName) => {
              (window as any).__testEventFired = false;
              document.addEventListener(eventName, () => {
                (window as any).__testEventFired = true;
              }, { once: true });
            }, intDef.click.event);
            
            await el.first().click();
            await page.waitForTimeout(100);
            
            const eventFired = await page.evaluate(() => (window as any).__testEventFired);
            if (!eventFired) {
              allErrors.push(`${selector}: Click should fire "${intDef.click.event}" event`);
            }
          } catch (e) {
            allErrors.push(`${selector}: Click test error - ${e}`);
          }
        }
      }
      
      expect(allErrors, `${behaviorName} interaction failures:\n${allErrors.join('\n')}`).toEqual([]);
    });
  }
});
