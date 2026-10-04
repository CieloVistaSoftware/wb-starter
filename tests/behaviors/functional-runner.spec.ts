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

import { test, expect, Page } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';
import { wbIdle } from '../base';

/**
 * After a click, key, hover or focus: let the page react, without guessing a
 * duration (#962). Waits for any injection the action started (WB.settled),
 * then two animation frames so synchronous handlers and the style recalc they
 * cause have run. The retrying assertions that follow wait for anything slower
 * (a debounce, a transition); this is what lets a NEGATIVE assertion ("should
 * not have class") see a wrong state the action produced at once.
 */
async function afterAction(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const wb = (window as any).WB;
    if (typeof wb?.settled === 'function') await wb.settled({ timeout: 10000 });
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ROOT = process.cwd();
const SCHEMA_DIR = path.join(ROOT, 'src/wb-models');

// Behaviors to skip (not implemented or special cases)
const SKIP_BEHAVIORS = ['switch'];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Step {
  action: 'click' | 'dblclick' | 'focus' | 'blur' | 'selectOption' | 'mousedown' | 'mouseup' | 'mousemove' | 'keypress' | 'call' | 'type' | 'fill';
  selector?: string;
  key?: string;
  value?: string;
  position?: { x: number, y: number };
  delta?: { x: number, y: number };
  method?: string;
}

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
  detail?: any;
  focused?: string;
  checked?: boolean;
  value?: string;
  checks?: {
    visible?: boolean;
    hidden?: boolean;
    exists?: boolean;
    hasClass?: string | string[];
    notHasClass?: string | string[];
    textContains?: string;
    attribute?: Record<string, string>;
    style?: Record<string, string>;
    focused?: boolean;
    checked?: boolean;
    value?: string;
    positionYUnchanged?: boolean;
    positionXUnchanged?: boolean;
  };
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
  action?: 'click' | 'dblclick' | 'focus' | 'blur' | 'selectOption' | 'type' | 'fill';
  steps?: Step[];
  selector?: string;
  value?: string;
  expect: TestExpectation;
}

interface KeyboardTest {
  name: string;
  setup: string;
  key?: string;
  steps?: Step[];
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
    const schema = JSON.parse(content);
    // Schemas name their behavior in `schemaFor` (schema.schema.json's field;
    // no schema has carried a top-level `behavior` for a long time). Reading
    // only `behavior` discovered 0 of the 12 schemas that define functional
    // tests, so this runner executed nothing and its guard reported 0.
    if (schema && !schema.behavior && typeof schema.schemaFor === 'string') {
      schema.behavior = schema.schemaFor.replace(/^x-/, '');
    }
    return schema;
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
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  
  // Remove any existing test container
  await page.evaluate(() => {
    document.getElementById('test-container')?.remove();
  });
  
  // Inject the test HTML and scan it
  await page.evaluate(async (html: string) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = html;
    // Mark the setup's own root before any behavior runs: a behavior may wrap
    // or restructure it, but the element keeps its attributes. See
    // resolveSelector() for why "element" needs this.
    container.firstElementChild?.setAttribute('fr-root', '');
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
  }, setupHtml);
  
  // Wait for the runtime to say injection has finished, not a guessed 100ms (#962).
  await wbIdle(page);
}

/**
 * Resolve selector - handles "element" keyword
 */
function resolveSelector(selector: string | undefined): string {
  // "element" means the element the setup wrote. It used to become
  // `[x-${behavior}]`, which stopped matching when 4.0.0 moved native
  // elements to auto-injection: the button schema's own setup is a bare
  // `<button>`, so every button test waited 30s for an `[x-button]` that
  // nothing writes any more. The marker is the setup's root, whatever the
  // authoring form.
  //
  // Any other selector is scoped to the test container: the fixture page is
  // the real index.html, whose own search box is the first `input` in the
  // document, so an unscoped `input` asserted focus on the site header.
  if (!selector || selector === 'element' || (selector as unknown) === true) {
    return FR_ROOT;
  }
  return `#test-container ${selector}`;
}

const FR_ROOT = '#test-container [fr-root]';

/**
 * The form control a value-level step or check means when it names no
 * selector: the root itself if it is one, else the first control inside it.
 * `<div x-input>` / `<div x-checkbox>` / `<div x-searchfield>` are containers
 * that BUILD their <input>, so typing into, or reading `checked` off, the div
 * itself can never work ("Not a checkbox", "Not an input element").
 */
async function controlSelector(page: Page, selector: string | undefined): Promise<string> {
  if (selector && selector !== 'element') return resolveSelector(selector);
  const own = `${FR_ROOT}:is(input, select, textarea)`;
  if (await page.locator(own).count()) return own;
  const inner = `${FR_ROOT} :is(input, select, textarea)`;
  if (await page.locator(inner).count()) return inner;
  return FR_ROOT;
}

/**
 * Execute a sequence of steps
 */
async function runSteps(page: Page, steps: Step[]): Promise<void> {
  let lastMousePos = { x: 0, y: 0 };

  for (const step of steps) {
    const selector = resolveSelector(step.selector);
    
    switch (step.action) {
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
        await page.selectOption(selector, step.value || '');
        break;
      case 'mousedown':
        if (step.position) {
          lastMousePos = step.position;
          await page.mouse.move(step.position.x, step.position.y);
        } else if (selector) {
          const box = await page.locator(selector).first().boundingBox();
          if (box) {
            lastMousePos = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
            await page.mouse.move(lastMousePos.x, lastMousePos.y);
          }
        }
        await page.mouse.down();
        break;
      case 'mouseup':
        if (step.position) {
          await page.mouse.move(step.position.x, step.position.y);
        }
        await page.mouse.up();
        break;
      case 'mousemove':
        if (step.position) {
          lastMousePos = step.position;
          await page.mouse.move(step.position.x, step.position.y);
        } else if (step.delta) {
          lastMousePos = { x: lastMousePos.x + step.delta.x, y: lastMousePos.y + step.delta.y };
          await page.mouse.move(lastMousePos.x, lastMousePos.y);
        }
        break;
      case 'keypress':
        if (step.key) {
          await page.keyboard.press(step.key);
        }
        break;
      case 'call':
        if (step.method) {
          // e.g. element.wbCardExpandable.expand
          const parts = step.method.split('.');
          // parts[0] is 'element' (mapped to selector)
          // parts[1] is property on element (e.g. wbCardExpandable)
          // parts[2] is method name
          if (parts[0] === 'element' && parts.length >= 3) {
             await page.locator(selector).first().evaluate((el, args) => {
                const [_, prop, method] = args;
                if ((el as any)[prop] && typeof (el as any)[prop][method] === 'function') {
                  (el as any)[prop][method]();
                }
             }, parts);
          }
        }
        break;
      case 'type':
        await page.type(await controlSelector(page, step.selector), step.value || '');
        break;
      case 'fill':
        await page.fill(await controlSelector(page, step.selector), step.value || '');
        break;
    }
    await afterAction(page);
  }
}

/**
 * Assert expectations on page.
 *
 * #1092: returns how many assertions it actually made. Every check below is
 * optional, so a schema row whose `expect` names nothing this function knows
 * (an empty object, a typo'd key, or only the unimplemented
 * positionYUnchanged) asserted nothing and the generated test PASSED. The
 * callers add this count to their own and fail when the total is zero.
 */
async function assertExpectations(
  page: Page,
  expect_: TestExpectation,
  behavior: string,
  testName: string
): Promise<number> {
  let asserted = 0;
  const selector = resolveSelector(expect_.selector);

  // Merge nested checks into top level for easier processing
  const checks = expect_.checks || {};
  const merged = { ...expect_, ...checks };

  // Visibility checks
  if (merged.visible === true) {
    await expect(page.locator(selector).first(), `${testName}: ${selector} should be visible`).toBeVisible();
    asserted++;
  }
  if (merged.visible === false || merged.hidden === true) {
    await expect(page.locator(selector).first(), `${testName}: ${selector} should be hidden`).toBeHidden();
    asserted++;
  }

  // Existence check
  if (merged.exists === true) {
    await expect(page.locator(selector).first(), `${testName}: ${selector} should exist`).toBeAttached();
    asserted++;
  }
  if (merged.exists === false) {
    await expect(page.locator(selector), `${testName}: ${selector} should not exist`).toHaveCount(0);
    asserted++;
  }

  // Class checks
  if (merged.hasClass) {
    const classes = Array.isArray(merged.hasClass) ? merged.hasClass : [merged.hasClass];
    for (const cls of classes) {
      await expect(page.locator(selector).first(), `${testName}: should have class ${cls}`).toHaveClass(new RegExp(cls));
      asserted++;
    }
  }
  if (merged.notClass || merged.notHasClass) {
    const classes = Array.isArray(merged.notClass || merged.notHasClass) ? (merged.notClass || merged.notHasClass) : [merged.notClass || merged.notHasClass];
    for (const cls of classes) {
      if (cls) {
        await expect(page.locator(selector).first(), `${testName}: should NOT have class ${cls}`).not.toHaveClass(new RegExp(cls));
        asserted++;
      }
    }
  }

  // Text content check
  if (merged.textContains) {
    await expect(page.locator(selector).first(), `${testName}: should contain text`).toContainText(merged.textContains);
    asserted++;
  }

  // Attribute checks
  if (merged.attribute) {
    for (const [attr, value] of Object.entries(merged.attribute)) {
      await expect(page.locator(selector).first(), `${testName}: should have ${attr}="${value}"`).toHaveAttribute(attr, value);
      asserted++;
    }
  }
  
  // Style checks -- POLLED (#962): a computed style read once races any CSS
  // transition the action started. Re-read until it matches or times out.
  const styleOf = (p: string) => page.locator(selector).first().evaluate((el, prop) =>
    getComputedStyle(el).getPropertyValue(prop) || (el as HTMLElement).style.getPropertyValue(prop), p);
  if (merged.style) {
    for (const [prop, value] of Object.entries(merged.style)) {
      // Handle special checks like <=150px
      if (typeof value === 'string' && (value.startsWith('<=') || value.startsWith('>='))) {
        const op = value.substring(0, 2);
        const num = parseFloat(value.substring(2));
        const poll = expect.poll(async () => parseFloat(await styleOf(prop)),
          { message: `${testName}: style.${prop} should be ${op} ${num}` });
        if (op === '<=') { await poll.toBeLessThanOrEqual(num); asserted++; }
        if (op === '>=') { await poll.toBeGreaterThanOrEqual(num); asserted++; }
      } else {
        await expect.poll(() => styleOf(prop), { message: `${testName}: style.${prop} should be ${value}` }).toBe(value);
        asserted++;
      }
    }
  }

  // Style contains (partial match)
  if (merged.styleContains) {
    for (const [prop, value] of Object.entries(merged.styleContains)) {
      await expect.poll(() => styleOf(prop), { message: `${testName}: style.${prop} should contain ${value}` }).toContain(value);
      asserted++;
    }
  }

  // Focus check
  if (merged.focused) {
    if (typeof merged.focused === 'string') {
        const focusedSelector = resolveSelector(merged.focused);
        await expect(page.locator(focusedSelector).first(), `${testName}: ${focusedSelector} should be focused`).toBeFocused();
        asserted++;
    } else if (merged.focused === true) {
        await expect(page.locator(selector).first(), `${testName}: should be focused`).toBeFocused();
        asserted++;
    }
  }

  // Checked state
  if (merged.checked !== undefined) {
    const control = await controlSelector(page, expect_.selector);
    if (merged.checked) {
      await expect(page.locator(control).first(), `${testName}: should be checked`).toBeChecked();
    } else {
      await expect(page.locator(control).first(), `${testName}: should not be checked`).not.toBeChecked();
    }
    asserted++;
  }

  // Value check
  if (merged.value !== undefined) {
    const control = await controlSelector(page, expect_.selector);
    await expect(page.locator(control).first(), `${testName}: should have value`).toHaveValue(merged.value);
    asserted++;
  }

  // Position checks (for drag)
  if (merged.positionYUnchanged) {
     // This is hard to check without history, but we can check if top is same as initial?
     // Or maybe we just check if it's 0 or something?
     // For now, let's skip or implement if we can track it.
     // #1092: deliberately NOT counted in `asserted` -- it checks nothing.
  }

  return asserted;
}

/**
 * #1092: the precondition every generated test ends with. A schema row that
 * produced zero assertions is a test that cannot fail; say which row it was.
 */
function expectRowAsserted(asserted: number, behavior: string, category: string, name: string): void {
  expect(asserted, `${behavior} ${category} "${name}": the schema row asserted nothing -- its expect names no check this runner implements`).toBeGreaterThan(0);
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
            
            const selector = resolveSelector(btn.selector);
            
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
            await afterAction(page);
            
            // Check event fired
            let asserted = 0;
            if (btn.expect.event) {
              // Polled: search fires wb:search after its 300ms debounce, so a
              // fixed 100ms wait read "never fired" for an event that was due.
              await expect.poll(() => page.evaluate(() => (window as any).__eventFired__),
                { message: `Event ${btn.expect.event} should fire`, timeout: 3000 }).toBe(true);
              asserted++;
            }

            // Check other expectations
            asserted += await assertExpectations(page, btn.expect, behavior, btn.name);
            // #1092: a row whose checks were all optional-and-absent passed empty.
            expectRowAsserted(asserted, behavior, 'buttons', btn.name);
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
            
            // Set up event listener if needed
            if (interaction.expect.event) {
              await page.evaluate((evtName) => {
                (window as any).__eventFired__ = false;
                document.addEventListener(evtName!, () => {
                  (window as any).__eventFired__ = true;
                }, true);
              }, interaction.expect.event);
            }
            
            // Execute steps
            if (interaction.steps) {
              await runSteps(page, interaction.steps);
            } else if (interaction.action) {
               // Backwards compatibility for simple action
               await runSteps(page, [{
                 action: interaction.action,
                 selector: interaction.selector,
                 value: interaction.value
               }]);
            }
            
            await afterAction(page);
            
            // Check event fired
            let asserted = 0;
            if (interaction.expect.event) {
              // Polled: search fires wb:search after its 300ms debounce, so a
              // fixed 100ms wait read "never fired" for an event that was due.
              await expect.poll(() => page.evaluate(() => (window as any).__eventFired__),
                { message: `Event ${interaction.expect.event} should fire`, timeout: 3000 }).toBe(true);
              asserted++;
            }

            asserted += await assertExpectations(page, interaction.expect, behavior, interaction.name);
            // #1092: a row whose checks were all optional-and-absent passed empty.
            expectRowAsserted(asserted, behavior, 'interactions', interaction.name);
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
              const focusSelector = resolveSelector(kb.precondition.focused);
              await page.focus(focusSelector);
            } else if (kb.selector) {
              // Focus the target element first
              const selector = resolveSelector(kb.selector);
              await page.focus(selector);
            } else {
              // Focus the main element -- or, for a container behavior, the
              // control it built (`[x-${behavior}]` matched nothing once
              // native hosts stopped carrying the attribute).
              await page.focus(await controlSelector(page, undefined));
            }
            
            await afterAction(page);
            
            // Set up event listener
            if (kb.expect.event) {
              await page.evaluate((evtName) => {
                (window as any).__eventFired__ = false;
                document.addEventListener(evtName!, () => {
                  (window as any).__eventFired__ = true;
                });
              }, kb.expect.event);
            }
            
            // Execute steps if present, otherwise just press key
            if (kb.steps) {
               await runSteps(page, kb.steps);
            } else if (kb.key) {
               await page.keyboard.press(kb.key);
            }
            
            await afterAction(page);
            
            // Check event
            let asserted = 0;
            if (kb.expect.event) {
              // Polled: search fires wb:search after its 300ms debounce, so a
              // fixed 100ms wait read "never fired" for an event that was due.
              await expect.poll(() => page.evaluate(() => (window as any).__eventFired__),
                { message: `Event ${kb.expect.event} should fire on ${kb.key}`, timeout: 3000 }).toBe(true);
              asserted++;
            }

            asserted += await assertExpectations(page, kb.expect, behavior, kb.name);
            // #1092: a row whose checks were all optional-and-absent passed empty.
            expectRowAsserted(asserted, behavior, 'keyboard', kb.name);
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
            
            const selector = resolveSelector(hv.selector);
            
            // Hover over element
            await page.hover(selector);
            await afterAction(page);
            
            let asserted = await assertExpectations(page, hv.expect, behavior, hv.name);

            // Test unhover if specified
            if (hv.unhover) {
              // Move mouse away
              await page.mouse.move(0, 0);
              await afterAction(page);

              asserted += await assertExpectations(page, hv.unhover, behavior, `${hv.name} (unhover)`);
            }
            // #1092: a row whose checks were all optional-and-absent passed empty.
            expectRowAsserted(asserted, behavior, 'hover', hv.name);
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
              const selector = resolveSelector(vis.selector);
              if (vis.action === 'click') {
                await page.click(selector);
              } else if (vis.action === 'hover') {
                await page.hover(selector);
              }
              await afterAction(page);
            }
            
            let asserted = await assertExpectations(page, vis.expect, behavior, vis.name);

            // Additional checks array
            if (vis.checks?.length) {
              for (const check of vis.checks) {
                const checkSelector = resolveSelector(check.selector);

                if (check.style && check.notEmpty) {
                  const value = await page.locator(checkSelector).first().evaluate((el, prop) => {
                    return getComputedStyle(el).getPropertyValue(prop);
                  }, check.style);
                  expect(value, `${vis.name}: ${checkSelector}.${check.style} should not be empty`).toBeTruthy();
                  asserted++;
                }

                if (check.hasClass) {
                  await expect(page.locator(checkSelector).first()).toHaveClass(new RegExp(check.hasClass));
                  asserted++;
                }
              }
            }
            // #1092: a row whose checks were all optional-and-absent passed empty.
            expectRowAsserted(asserted, behavior, 'visual', vis.name);
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
            
            const selector = resolveSelector(dismiss.selector);
            
            // Perform dismiss action
            if (dismiss.action === 'click') {
              await page.click(selector);
            } else if (dismiss.action === 'press' && dismiss.key) {
              await page.focus(selector);
              await page.keyboard.press(dismiss.key);
            } else if (dismiss.key) {
              await page.keyboard.press(dismiss.key);
            }
            
            await afterAction(page);
            
            // #1092: a dismiss row with no `expect` used to skip this and PASS
            // with zero assertions. Every row must say what dismissed means.
            expect(dismiss.expect, `${behavior} dismiss "${dismiss.name}": the schema row has no expect`).toBeTruthy();
            const asserted = await assertExpectations(page, dismiss.expect!, behavior, dismiss.name);
            expectRowAsserted(asserted, behavior, 'dismiss', dismiss.name);
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
            
            if (focus.action === 'click') {
              // No selector means the element itself: the checkbox, input and
              // search focus tests name none, so nothing was ever clicked and
              // "should be focused" was asserted on an untouched page.
              const selector = focus.selector
                ? resolveSelector(focus.selector)
                : await controlSelector(page, undefined);
              // x-checkbox's real <input> is visually hidden with
              // pointer-events:none; a user clicks the drawn box, i.e. the
              // host. Click the control where it can be clicked, else the host.
              const clickable = await page.locator(selector).first()
                .click({ trial: true, timeout: 1000 }).then(() => true, () => false);
              await page.click(clickable ? selector : FR_ROOT);
            } else if (focus.action === 'tab') {
              await page.keyboard.press('Tab');
            }
            
            await afterAction(page);
            
            const focusSelector = resolveSelector(focus.expect.focused);
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
            
            const selector = resolveSelector(dis.selector);
            
            // Set up event listener to verify event does NOT fire
            if (dis.expect.event === null) {
              // Only a click that reaches the element under test counts. A
              // document-wide listener also heard the forced click land on
              // whatever lies under a disabled control -- which is exactly
              // what a disabled control is supposed to let happen.
              //
              // "The element" here is the control that would act: a disabled
              // <button> itself, or the <input> an x-checkbox host forwards
              // its clicks to. The host <div> receiving the click is not the
              // checkbox acting.
              const control = await controlSelector(page, undefined);
              await page.evaluate((sel) => {
                (window as any).__eventFired__ = false;
                const target = document.querySelector(sel);
                document.addEventListener('click', (e) => {
                  if (target && e.target === target) (window as any).__eventFired__ = true;
                }, true);
              }, control);
            }
            
            // Attempt action
            if (dis.action === 'click') {
              await page.click(selector, { force: true });
            } else if (dis.action === 'press' && dis.key) {
              await page.focus(selector);
              await page.keyboard.press(dis.key);
            }
            
            await afterAction(page);
            
            // Verify event did NOT fire
            let asserted = 0;
            if (dis.expect.event === null) {
              const eventFired = await page.evaluate(() => (window as any).__eventFired__);
              expect(eventFired, 'Event should NOT fire on disabled element').toBe(false);
              asserted++;
            }

            asserted += await assertExpectations(page, dis.expect, behavior, dis.name);
            // #1092: a row whose checks were all optional-and-absent passed empty.
            expectRowAsserted(asserted, behavior, 'disabled', dis.name);
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
