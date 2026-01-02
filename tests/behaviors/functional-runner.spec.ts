/**
 * TIER 4: FUNCTIONAL TEST RUNNER
 * ==============================
 * Reads test.functional from each schema and executes in browser with Playwright.
 * 
 * This is the keystone piece that enables schema-driven functional testing.
 * Tests are defined in JSON schemas, executed here in Playwright.
 * 
 * Test Categories:
 * - buttons: Click tests for button elements
 * - interactions: General click/action tests
 * - keyboard: Keyboard navigation tests
 * - hover: Mouse hover state tests
 * - visual: CSS class/style assertions
 * - dismiss: Close/hide behavior tests
 * - focus: Focus management tests
 * - disabled: Disabled state tests
 * 
 * @see data/FUNCTIONAL-TEST-ANALYSIS.md for gap analysis
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ROOT = process.cwd();
const SCHEMA_DIR = path.join(ROOT, 'src/behaviors/schema');

// Behaviors to skip (not implemented or special cases)
const SKIP_BEHAVIORS = ['switch', 'builder'];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TestExpectation {
  selector?: string;
  visible?: boolean;
  hidden?: boolean;
  exists?: boolean;
  hasClass?: string | string[];
  notClass?: string | string[];
  textContains?: string;
  attribute?: Record<string, string>;
  style?: Record<string, string>;
  styleContains?: Record<string, string>;
  event?: string | null;
  focused?: string;
  checked?: boolean;
  value?: string;
}

interface ButtonTest {
  name: string;
  setup: string;
  selector: string;
  expect: TestExpectation;
  expectEvent?: string;
}

interface InteractionTest {
  name: string;
  setup: string;
  action: 'click' | 'dblclick' | 'focus' | 'blur' | 'selectOption';
  selector?: string;
  value?: string;
  expect: TestExpectation;
}

interface KeyboardTest {
  name: string;
  setup: string;
  key: string;
  selector?: string;
  precondition?: { focused?: string };
  expect: TestExpectation;
}

interface HoverTest {
  name: string;
  setup: string;
  selector?: string;
  expect: TestExpectation;
  unhover?: TestExpectation;
}

interface VisualTest {
  name: string;
  setup: string;
  action?: 'click' | 'hover';
  selector?: string;
  expect: TestExpectation;
  checks?: Array<{
    selector: string;
    style?: string;
    notEmpty?: boolean;
    hasClass?: string;
  }>;
}

interface DismissTest {
  name: string;
  setup: string;
  selector: string;
  action?: 'click' | 'press';
  key?: string;
  expect?: TestExpectation;
}

interface FocusTest {
  name: string;
  setup: string;
  action?: 'click' | 'tab';
  selector?: string;
  expect: { focused: string };
}

interface DisabledTest {
  name: string;
  setup: string;
  action: 'click' | 'press';
  selector?: string;
  key?: string;
  expect: TestExpectation;
}

interface FunctionalTests {
  buttons?: ButtonTest[];
  interactions?: InteractionTest[];
  keyboard?: KeyboardTest[];
  hover?: HoverTest[];
  visual?: VisualTest[];
  dismiss?: DismissTest[];
  focus?: FocusTest[];
  disabled?: DisabledTest[];
}

interface Schema {
  behavior: string;
  title?: string;
  test?: {
    skip?: boolean;
    skipReason?: string;
    setup?: string[];
    functional?: FunctionalTests;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getSchemaFiles(): string[] {
  if (!fs.existsSync(SCHEMA_DIR)) return [];
  return fs.readdirSync(SCHEMA_DIR)
    .filter(f => f.endsWith('.schema.json') && !f.includes('.base.'))
    .filter(f => !f.startsWith('_'));
}

function loadSchema(filename: string): Schema | null {
  try {
    const content = fs.readFileSync(path.join(SCHEMA_DIR, filename), 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function getSchemasWithFunctionalTests(): Array<{ file: string; schema: Schema }> {
  const results: Array<{ file: string; schema: Schema }> = [];
  
  for (const file of getSchemaFiles()) {
    const schema = loadSchema(file);
    if (!schema?.behavior) continue;
    if (schema.test?.skip) continue;
    if (SKIP_BEHAVIORS.includes(schema.behavior)) continue;
    if (!schema.test?.functional) continue;
    
    // Check if functional has any actual tests
    const functional = schema.test.functional;
    const hasTests = 
      (functional.buttons?.length ?? 0) > 0 ||
      (functional.interactions?.length ?? 0) > 0 ||
      (functional.keyboard?.length ?? 0) > 0 ||
      (functional.hover?.length ?? 0) > 0 ||
      (functional.visual?.length ?? 0) > 0 ||
      (functional.dismiss?.length ?? 0) > 0 ||
      (functional.focus?.length ?? 0) > 0 ||
      (functional.disabled?.length ?? 0) > 0;
    
    if (hasTests) {
      results.push({ file, schema });
    }
  }
  
  return results;
}

/**
 * Setup test container with HTML - uses the same pattern as permutation-compliance.spec.ts
 * Navigates to index.html first, then injects test HTML via evaluate
 */
async function setupTestPage(page: Page, setupHtml: string): Promise<void> {
  // Navigate to index.html which has WB loaded
  await page.goto('index.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 5000 });
  
  // Remove any existing test container
  await page.evaluate(() => {
    document.getElementById('test-container')?.remove();
  });
  
  // Inject the test HTML and scan it
  await page.evaluate(async (html: string) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = html;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
  }, setupHtml);
  
  // Small delay for behavior initialization
  await page.waitForTimeout(100);
}

/**
 * Resolve selector - handles "element" keyword
 */
function resolveSelector(selector: string | undefined, behavior: string): string {
  if (!selector || selector === 'element') {
    return `[data-wb="${behavior}"]`;
  }
  return selector;
}

/**
 * Assert expectations on page
 */
async function assertExpectations(
  page: Page, 
  expect_: TestExpectation, 
  behavior: string,
  testName: string
): Promise<void> {
  const selector = resolveSelector(expect_.selector, behavior);
  
  // Visibility checks
  if (expect_.visible === true) {
    await expect(page.locator(selector).first(), `${testName}: ${selector} should be visible`).toBeVisible();
  }
  if (expect_.visible === false || expect_.hidden === true) {
    await expect(page.locator(selector).first(), `${testName}: ${selector} should be hidden`).toBeHidden();
  }
  
  // Existence check
  if (expect_.exists === true) {
    await expect(page.locator(selector).first(), `${testName}: ${selector} should exist`).toBeAttached();
  }
  if (expect_.exists === false) {
    await expect(page.locator(selector), `${testName}: ${selector} should not exist`).toHaveCount(0);
  }
  
  // Class checks
  if (expect_.hasClass) {
    const classes = Array.isArray(expect_.hasClass) ? expect_.hasClass : [expect_.hasClass];
    for (const cls of classes) {
      await expect(page.locator(selector).first(), `${testName}: should have class ${cls}`).toHaveClass(new RegExp(cls));
    }
  }
  if (expect_.notClass) {
    const classes = Array.isArray(expect_.notClass) ? expect_.notClass : [expect_.notClass];
    for (const cls of classes) {
      await expect(page.locator(selector).first(), `${testName}: should NOT have class ${cls}`).not.toHaveClass(new RegExp(cls));
    }
  }
  
  // Text content check
  if (expect_.textContains) {
    await expect(page.locator(selector).first(), `${testName}: should contain text`).toContainText(expect_.textContains);
  }
  
  // Attribute checks
  if (expect_.attribute) {
    for (const [attr, value] of Object.entries(expect_.attribute)) {
      await expect(page.locator(selector).first(), `${testName}: should have ${attr}="${value}"`).toHaveAttribute(attr, value);
    }
  }
  
  // Style checks
  if (expect_.style) {
    for (const [prop, value] of Object.entries(expect_.style)) {
      const actualValue = await page.locator(selector).first().evaluate((el, p) => {
        return getComputedStyle(el).getPropertyValue(p) || (el as HTMLElement).style.getPropertyValue(p);
      }, prop);
      expect(actualValue, `${testName}: style.${prop} should be ${value}`).toBe(value);
    }
  }
  
  // Style contains (partial match)
  if (expect_.styleContains) {
    for (const [prop, value] of Object.entries(expect_.styleContains)) {
      const actualValue = await page.locator(selector).first().evaluate((el, p) => {
        return getComputedStyle(el).getPropertyValue(p) || (el as HTMLElement).style.getPropertyValue(p);
      }, prop);
      expect(actualValue, `${testName}: style.${prop} should contain ${value}`).toContain(value);
    }
  }
  
  // Focus check
  if (expect_.focused) {
    const focusedSelector = resolveSelector(expect_.focused, behavior);
    await expect(page.locator(focusedSelector).first(), `${testName}: ${focusedSelector} should be focused`).toBeFocused();
  }
  
  // Checked state
  if (expect_.checked !== undefined) {
    if (expect_.checked) {
      await expect(page.locator(selector).first(), `${testName}: should be checked`).toBeChecked();
    } else {
      await expect(page.locator(selector).first(), `${testName}: should not be checked`).not.toBeChecked();
    }
  }
  
  // Value check
  if (expect_.value !== undefined) {
    await expect(page.locator(selector).first(), `${testName}: should have value`).toHaveValue(expect_.value);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GENERATION
// ═══════════════════════════════════════════════════════════════════════════

const schemasWithTests = getSchemasWithFunctionalTests();

// Report what we found
test.describe('Functional Test Runner', () => {
  test('schema discovery', () => {
    console.log(`\n📋 Found ${schemasWithTests.length} schemas with functional tests:`);
    for (const { file, schema } of schemasWithTests) {
      const f = schema.test!.functional!;
      const counts = [
        f.buttons?.length ? `${f.buttons.length} buttons` : null,
        f.interactions?.length ? `${f.interactions.length} interactions` : null,
        f.keyboard?.length ? `${f.keyboard.length} keyboard` : null,
        f.hover?.length ? `${f.hover.length} hover` : null,
        f.visual?.length ? `${f.visual.length} visual` : null,
        f.dismiss?.length ? `${f.dismiss.length} dismiss` : null,
        f.focus?.length ? `${f.focus.length} focus` : null,
        f.disabled?.length ? `${f.disabled.length} disabled` : null,
      ].filter(Boolean).join(', ');
      console.log(`  • ${schema.behavior}: ${counts}`);
    }
    expect(schemasWithTests.length).toBeGreaterThan(0);
  });
});

// Generate tests for each schema
for (const { file, schema } of schemasWithTests) {
  const behavior = schema.behavior;
  const functional = schema.test!.functional!;
  
  test.describe(`Functional: ${behavior}`, () => {
    
    // ═══════════════════════════════════════════════════════════════════
    // BUTTON TESTS
    // ═══════════════════════════════════════════════════════════════════
    if (functional.buttons?.length) {
      test.describe('buttons', () => {
        for (const btn of functional.buttons!) {
          test(btn.name, async ({ page }) => {
            await setupTestPage(page, btn.setup);
            
            const selector = resolveSelector(btn.selector, behavior);
            
            // Set up event listener if expecting event
            if (btn.expect.event || btn.expectEvent) {
              const eventName = btn.expect.event || btn.expectEvent;
              await page.evaluate((evtName) => {
                (window as any).__eventFired__ = false;
                document.addEventListener(evtName!, () => {
                  (window as any).__eventFired__ = true;
                });
              }, eventName);
            }
            
            // Click the button
            await page.click(selector);
            await page.waitForTimeout(50);
            
            // Check event fired
            if (btn.expect.event) {
              const eventFired = await page.evaluate(() => (window as any).__eventFired__);
              expect(eventFired, `Event ${btn.expect.event} should fire`).toBe(true);
            }
            
            // Check other expectations
            await assertExpectations(page, btn.expect, behavior, btn.name);
          });
        }
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INTERACTION TESTS
    // ═══════════════════════════════════════════════════════════════════
    if (functional.interactions?.length) {
      test.describe('interactions', () => {
        for (const interaction of functional.interactions!) {
          test(interaction.name, async ({ page }) => {
            await setupTestPage(page, interaction.setup);
            
            const selector = resolveSelector(interaction.selector, behavior);
            
            // Set up event listener if needed
            if (interaction.expect.event) {
              await page.evaluate((evtName) => {
                (window as any).__eventFired__ = false;
                document.addEventListener(evtName!, () => {
                  (window as any).__eventFired__ = true;
                }, true);
              }, interaction.expect.event);
            }
            
            // Perform action
            switch (interaction.action) {
              case 'click':
                await page.click(selector);
                break;
              case 'dblclick':
                await page.dblclick(selector);
                break;
              case 'focus':
                await page.focus(selector);
                break;
              case 'blur':
                await page.locator(selector).blur();
                break;
              case 'selectOption':
                await page.selectOption(selector, interaction.value || '');
                break;
            }
            
            await page.waitForTimeout(100);
            
            // Check event fired
            if (interaction.expect.event) {
              const eventFired = await page.evaluate(() => (window as any).__eventFired__);
              expect(eventFired, `Event ${interaction.expect.event} should fire`).toBe(true);
            }
            
            await assertExpectations(page, interaction.expect, behavior, interaction.name);
          });
        }
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // KEYBOARD TESTS
    // ═══════════════════════════════════════════════════════════════════
    if (functional.keyboard?.length) {
      test.describe('keyboard', () => {
        for (const kb of functional.keyboard!) {
          test(kb.name, async ({ page }) => {
            await setupTestPage(page, kb.setup);
            
            // Handle preconditions (e.g., focus first)
            if (kb.precondition?.focused) {
              const focusSelector = resolveSelector(kb.precondition.focused, behavior);
              await page.focus(focusSelector);
            } else if (kb.selector) {
              // Focus the target element first
              const selector = resolveSelector(kb.selector, behavior);
              await page.focus(selector);
            } else {
              // Focus the main element
              await page.focus(`[data-wb="${behavior}"]`);
            }
            
            await page.waitForTimeout(50);
            
            // Set up event listener
            if (kb.expect.event) {
              await page.evaluate((evtName) => {
                (window as any).__eventFired__ = false;
                document.addEventListener(evtName!, () => {
                  (window as any).__eventFired__ = true;
                });
              }, kb.expect.event);
            }
            
            // Press the key
            await page.keyboard.press(kb.key);
            await page.waitForTimeout(100);
            
            // Check event
            if (kb.expect.event) {
              const eventFired = await page.evaluate(() => (window as any).__eventFired__);
              expect(eventFired, `Event ${kb.expect.event} should fire on ${kb.key}`).toBe(true);
            }
            
            await assertExpectations(page, kb.expect, behavior, kb.name);
          });
        }
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // HOVER TESTS
    // ═══════════════════════════════════════════════════════════════════
    if (functional.hover?.length) {
      test.describe('hover', () => {
        for (const hv of functional.hover!) {
          test(hv.name, async ({ page }) => {
            await setupTestPage(page, hv.setup);
            
            const selector = resolveSelector(hv.selector, behavior);
            
            // Hover over element
            await page.hover(selector);
            await page.waitForTimeout(300); // Allow for hover delay
            
            await assertExpectations(page, hv.expect, behavior, hv.name);
            
            // Test unhover if specified
            if (hv.unhover) {
              // Move mouse away
              await page.mouse.move(0, 0);
              await page.waitForTimeout(300);
              
              await assertExpectations(page, hv.unhover, behavior, `${hv.name} (unhover)`);
            }
          });
        }
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // VISUAL TESTS
    // ═══════════════════════════════════════════════════════════════════
    if (functional.visual?.length) {
      test.describe('visual', () => {
        for (const vis of functional.visual!) {
          test(vis.name, async ({ page }) => {
            await setupTestPage(page, vis.setup);
            
            // Perform action if specified
            if (vis.action) {
              const selector = resolveSelector(vis.selector, behavior);
              if (vis.action === 'click') {
                await page.click(selector);
              } else if (vis.action === 'hover') {
                await page.hover(selector);
              }
              await page.waitForTimeout(100);
            }
            
            await assertExpectations(page, vis.expect, behavior, vis.name);
            
            // Additional checks array
            if (vis.checks?.length) {
              for (const check of vis.checks) {
                const checkSelector = resolveSelector(check.selector, behavior);
                
                if (check.style && check.notEmpty) {
                  const value = await page.locator(checkSelector).first().evaluate((el, prop) => {
                    return getComputedStyle(el).getPropertyValue(prop);
                  }, check.style);
                  expect(value, `${vis.name}: ${checkSelector}.${check.style} should not be empty`).toBeTruthy();
                }
                
                if (check.hasClass) {
                  await expect(page.locator(checkSelector).first()).toHaveClass(new RegExp(check.hasClass));
                }
              }
            }
          });
        }
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // DISMISS TESTS
    // ═══════════════════════════════════════════════════════════════════
    if (functional.dismiss?.length) {
      test.describe('dismiss', () => {
        for (const dismiss of functional.dismiss!) {
          test(dismiss.name, async ({ page }) => {
            await setupTestPage(page, dismiss.setup);
            
            const selector = resolveSelector(dismiss.selector, behavior);
            
            // Perform dismiss action
            if (dismiss.action === 'click') {
              await page.click(selector);
            } else if (dismiss.action === 'press' && dismiss.key) {
              await page.focus(selector);
              await page.keyboard.press(dismiss.key);
            } else if (dismiss.key) {
              await page.keyboard.press(dismiss.key);
            }
            
            await page.waitForTimeout(100);
            
            if (dismiss.expect) {
              await assertExpectations(page, dismiss.expect, behavior, dismiss.name);
            }
          });
        }
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // FOCUS TESTS
    // ═══════════════════════════════════════════════════════════════════
    if (functional.focus?.length) {
      test.describe('focus', () => {
        for (const focus of functional.focus!) {
          test(focus.name, async ({ page }) => {
            await setupTestPage(page, focus.setup);
            
            if (focus.action === 'click' && focus.selector) {
              const selector = resolveSelector(focus.selector, behavior);
              await page.click(selector);
            } else if (focus.action === 'tab') {
              await page.keyboard.press('Tab');
            }
            
            await page.waitForTimeout(50);
            
            const focusSelector = resolveSelector(focus.expect.focused, behavior);
            await expect(page.locator(focusSelector).first()).toBeFocused();
          });
        }
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // DISABLED STATE TESTS
    // ═══════════════════════════════════════════════════════════════════
    if (functional.disabled?.length) {
      test.describe('disabled', () => {
        for (const dis of functional.disabled!) {
          test(dis.name, async ({ page }) => {
            await setupTestPage(page, dis.setup);
            
            const selector = resolveSelector(dis.selector, behavior);
            
            // Set up event listener to verify event does NOT fire
            if (dis.expect.event === null) {
              await page.evaluate(() => {
                (window as any).__eventFired__ = false;
                document.addEventListener('click', () => {
                  (window as any).__eventFired__ = true;
                }, true);
              });
            }
            
            // Attempt action
            if (dis.action === 'click') {
              await page.click(selector, { force: true });
            } else if (dis.action === 'press' && dis.key) {
              await page.focus(selector);
              await page.keyboard.press(dis.key);
            }
            
            await page.waitForTimeout(50);
            
            // Verify event did NOT fire
            if (dis.expect.event === null) {
              const eventFired = await page.evaluate(() => (window as any).__eventFired__);
              expect(eventFired, 'Event should NOT fire on disabled element').toBe(false);
            }
            
            await assertExpectations(page, dis.expect, behavior, dis.name);
          });
        }
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY TEST
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Functional Test Summary', () => {
  test('coverage report', () => {
    let totalTests = 0;
    const coverage: Record<string, number> = {
      buttons: 0,
      interactions: 0,
      keyboard: 0,
      hover: 0,
      visual: 0,
      dismiss: 0,
      focus: 0,
      disabled: 0,
    };
    
    for (const { schema } of schemasWithTests) {
      const f = schema.test!.functional!;
      coverage.buttons += f.buttons?.length ?? 0;
      coverage.interactions += f.interactions?.length ?? 0;
      coverage.keyboard += f.keyboard?.length ?? 0;
      coverage.hover += f.hover?.length ?? 0;
      coverage.visual += f.visual?.length ?? 0;
      coverage.dismiss += f.dismiss?.length ?? 0;
      coverage.focus += f.focus?.length ?? 0;
      coverage.disabled += f.disabled?.length ?? 0;
    }
    
    totalTests = Object.values(coverage).reduce((a, b) => a + b, 0);
    
    console.log('\n📊 Functional Test Coverage:');
    console.log(`   Total: ${totalTests} tests across ${schemasWithTests.length} behaviors`);
    console.log('   By category:');
    for (const [cat, count] of Object.entries(coverage)) {
      const bar = '█'.repeat(Math.ceil(count / 2)) || '░';
      console.log(`     ${cat.padEnd(12)}: ${String(count).padStart(3)} ${bar}`);
    }
    
    // Warn about missing categories
    const missing: string[] = [];
    if (coverage.hover === 0) missing.push('hover (CRITICAL for tooltip!)');
    if (coverage.focus === 0) missing.push('focus');
    if (coverage.disabled === 0) missing.push('disabled');
    
    if (missing.length) {
      console.log('\n   ⚠️  Missing test categories:', missing.join(', '));
    }
    
    expect(totalTests).toBeGreaterThan(0);
  });
});
