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
      // v3 schemas use `schemaFor`; the schema-builder treats it as `behavior`.
      // The runner used to only honor `behavior`, so ~89% of components (97 of
      // 109, all using `schemaFor`) were silently SKIPPED and never tested —
      // which is why functional regressions (switch, alert, card, …) shipped.
      if (!schema.behavior && (schema as any).schemaFor) {
        schema.behavior = (schema as any).schemaFor;
      }
      // Only load schemas with a behavior/schemaFor (true component schemas).
      if (!schema.behavior) {
        console.log(`Skipping non-component schema: ${file}`);
        continue;
      }
      // schemaType is the project-wide "is this a real single-element
      // component" signal (see tests/compliance/schema-validation.spec.ts,
      // which already tiers on it: 'component' [default] vs 'base' /
      // 'definition' / 'behavior' / 'page'). This runner used to test EVERY
      // schema with a behavior/schemaFor as if it were a live <wb-*> custom
      // element -- but behavior.schema.json (schemaType 'behavior': the
      // master metadata catalog for ALL behaviors), home-page.schema.json
      // (schemaType 'page': a page-layout composition), search-index.schema.json
      // and views.schema.json (schemaType 'definition': data-file formats for
      // the search index / views registry, not components) all declare
      // schemaFor for cross-referencing purposes but were never meant to be
      // instantiated as <div>/<div>/<div>/
      // <div> tags -- no such custom elements exist. Testing them here
      // generated fake tags, then reported real elements/classes/children as
      // "missing" for structures that were never supposed to exist.
      if (schema.schemaType && schema.schemaType !== 'component') {
        console.log(`Skipping non-component schema (schemaType=${schema.schemaType}): ${file}`);
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

// Generate HTML for testing.
// 4.0.0: components are GONE, so there is no <div> tag to generate. A
// hyphenated tag with no registration is an HTMLUnknownElement -- it parses,
// renders inline and unstyled, and never becomes the behavior, which made
// every compliance assertion below report a real behavior as non-compliant
// (73 of them).
//
// The host is now a neutral <div> carrying the behavior as an attribute,
// which is the only form that still exists. Where the schema names a real
// semantic element, that still wins: <article variant="x"> reaches the
// behavior through auto-injection, and testing the semantic host is more
// faithful than forcing a div on it.
function generateHtml(behavior: string, props: Record<string, any>, content: string = 'Test Content', tagName?: string): string {
  const bare = behavior.replace(/^wb-/, '');
  // An explicit semantic element from the schema wins; otherwise a neutral
  // host carrying x-<behavior>.
  const semantic = tagName && tagName !== 'div' ? tagName : null;
  const tag = semantic || 'div';
  let attrs = semantic ? '' : ` x-${bare}`;

  if (tag === 'input' && behavior === 'checkbox') {
    attrs += ' type="checkbox"';
  }

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase(); // plain attr (no data-)
    if (typeof value === 'boolean') {
      if (value) attrs += ` ${attrName}`;
    } else {
      attrs += ` ${attrName}="${value}"`;
    }
  }
  return `<${tag}${attrs}>${content}</${tag}>`;
}

/**
 * Values to exercise for a property that declares no explicit `permutations`.
 *
 * John: "if schema changes so does the tests... we should have no gaps in
 * tests due to that."
 *
 * CHECK 5 used to require a hand-written `permutations` block and skip the
 * property otherwise. NOT ONE of the 639 declared properties across 149
 * schemas has that block, so the property-permutation check exercised exactly
 * nothing -- a 100% gap, silently, while the suite reported green for it.
 *
 * The schema already states what the legal values are. Deriving from what is
 * declared means adding an enum value adds a test case, with nothing to
 * remember and nothing to keep in sync.
 */
function derivedPermutationValues(propDef: PropertyDef): any[] {
  if (Array.isArray(propDef.enum) && propDef.enum.length) return propDef.enum;
  if (propDef.type === 'boolean') return [true, false];

  // A non-enum string or number is free text. The declared default and example
  // are the only values the schema actually vouches for -- anything invented
  // here would be testing our imagination rather than the contract.
  const vouched = [propDef.default, (propDef as any).example]
    .filter((v) => v !== undefined && v !== null && v !== '');
  return [...new Set(vouched)];
}

// Get all permutation values for a property
function getPermutationValues(propDef: PropertyDef): any[] {
  const perm = propDef.permutations;
  if (!perm) return derivedPermutationValues(propDef);

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
    // `eager: true`, because the harness loads wb-lazy.js -- the LAZY runtime.
    // Without it, injection is deferred to an IntersectionObserver
    // (rootMargin 1200px), so a container appended below the fold never
    // initializes and every assertion reports the behavior as broken. That is
    // a defect in this probe, not in the behavior: the same markup renders
    // fully under wb.js. Confirmed by mounting <div x-card title="T"> on both
    // runtimes -- wb.js built the whole card, the lazy harness left the div
    // untouched.
    await (window as any).WB.scan(c, { eager: true });
  }, html);
  
  // Readiness, not a stopwatch.
  //
  // This was `waitForTimeout(100)`. It is called up to 7 times per test across
  // 146 tests, so it slept ~100 seconds per run doing nothing — and, worse, it
  // GUESSED. Under --workers=8 the guess is wrong: 28 of the 46 failures in a
  // load run were 30s timeouts and the rest were `[BASE CLASS] Missing`, i.e.
  // assertions that ran before the behavior had attached.
  //
  // `WB.scan()` is awaited above, but behaviors that load their module lazily
  // finish after it resolves. Wait for the observable RESULT instead: every
  // behavior with a base class writes it onto the host. Typical case returns
  // in a few ms — far faster than the old flat 100ms — and a slow machine
  // simply waits longer instead of failing.
  //
  // A handful of behaviors legitimately add no class, so this cannot be a hard
  // wait: it falls through after a short budget rather than hanging, and any
  // genuine "class never arrived" case still fails on the assertion below,
  // which is where that failure belongs.
  await page
    .waitForFunction(
      () => {
        const el = document.querySelector('#test-container > *');
        return !!el && (el.className || '').trim().length > 0;
      },
      null,
      // 120ms, not 2000. A 2s budget looked harmless because the fast path
      // was expected to dominate -- but many behaviors put their class on a
      // DESCENDANT, not on `#test-container > *`, so they hit the full
      // fallback SEVEN times per test. Measured: 46 -> 52 failures and
      // 6.5m -> 9.4m. Capping at ~the old sleep keeps the win (behaviors that
      // do mark the host return in a few ms) with no worse floor than before.
      { timeout: 120 },
    )
    .catch(() => { /* class-less behavior: let the assertion decide */ });

  return page.locator('#test-container > *').first();
}

const schemas = loadSchemas();

// CONSOLIDATED: ONE test per behavior validates EVERYTHING
test.describe('Component Compliance', () => {
  // A wall-clock budget, not a tolerance.
  //
  // Each of these 146 tests navigates, waits for WB, then builds and scans up
  // to SEVEN separate containers — it is the heaviest spec in the suite. At
  // --workers=8 that contends for CPU and the 30s default stops being a
  // measure of correctness and becomes a measure of how busy the machine is.
  //
  // Measured, same code, same run, only the budget changed:
  //   30s -> 100 passed, 46 failed, 18 of them "Test timeout exceeded"
  //   90s -> 109 passed, 37 failed,  0 timeouts
  //
  // So 9 tests were failing purely on the clock. The remaining 37 are real
  // assertion failures and are NOT masked by this — they fail either way.
  //
  // This is only legitimate because nothing here can hang: the four remaining
  // waitForTimeout(100) calls are bounded post-click settles (~400ms total per
  // test), so a larger budget cannot hide an infinite wait. Those four should
  // still become event waits; tracked separately.
  test.describe.configure({ timeout: 90_000 });

  for (const [behaviorName, schema] of schemas) {
    test(`${behaviorName}: comprehensive compliance`, async ({ page }) => {
      await page.goto('index.html');
      await page.waitForFunction(() => (window as any).WB?.behaviors);
      await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
      
      const allErrors: string[] = [];
      
      // ========== CHECK 1: Base Class ==========
      const baseHtml = schema.test?.setup?.[0] || generateHtml(behaviorName, {}, 'Test Content', schema.element);
      const element = await setupTestContainer(page, baseHtml);
      
      if (schema.compliance?.baseClass) {
        // #736 -- this generates its markup as the CUSTOM TAG (<div x-alert ...>),
        // and behaviors deliberately skip the redundant base class on a literal
        // custom-tag host because the stylesheet targets the tag directly -- the
        // #448 pattern, written down in the source:
        //
        //   // skip the redundant class on a literal <div x-alert> host (its own
        //   // tag selector already covers it), add it for every other host.
        //   if (element.tagName.toLowerCase() !== '[x-alert]') element.classList.add('[x-alert]');
        //
        // Measured: <div x-alert variant="warning"> -> "[x-alert] x-alert--warning",
        // <div x-alert variant="warning"> -> "x-alert--warning", and alert.css line
        // 10 is `[x-alert],`. Both are styled. Asserting the literal class failed
        // 50 behaviors for doing the right thing.
        //
        // What matters is that the element is COVERED by its base style, so the
        // tag counts. An attribute host missing the class is still a failure --
        // that is the #375 bug this check exists to catch.
        const covered = await element.evaluate(
          (el, cls) => el.classList.contains(cls) || el.tagName.toLowerCase() === cls,
          schema.compliance.baseClass,
        );
        if (!covered) {
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
        // Schema plumbing and sibling behavior tokens are not options.
        if (/^[$_]/.test(propName) || /^x-/.test(propName)) continue;

        // No `if (!propDef.permutations) continue;` any more -- that skipped
        // every one of the 639 declared properties, because none declares the
        // block. Values now come from the schema's own enum/boolean/default.
        const values = getPermutationValues(propDef);
        if (!values.length) continue;
        
        for (const value of values) {
          if (value === null && propDef.required) continue;
          
          const props: Record<string, any> = { [propName]: value };
          const html = generateHtml(behaviorName, props, 'Test Content', schema.element);
          
          const el = await setupTestContainer(page, html);
          
          // Check if component rendered - look for baseClass OR .x-ready class.
          //
          // `el` is a Playwright Locator, which has no `classList` -- the line
          // below used to read `el.classList.contains(...)` and threw
          // "Cannot read properties of undefined (reading 'contains')". It had
          // never run: this whole check was gated on a `permutations` block
          // that no schema declares, so a line that could not work sat here
          // looking correct. Turning the check on surfaced it 109 times.
          const hasBaseClass = schema.compliance?.baseClass
            ? await el.evaluate((e, cls) => e.classList.contains(cls), schema.compliance.baseClass)
            : true;
          const wbReady = await el.evaluate((e) => e.classList.contains('x-ready'));
          
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

          // "Initialized" = ANY sign the component was processed: its baseClass,
          // the x-schema marker, any wb-* class, or built child structure. (The
          // old check required the exact baseClass OR a non-existent .x-ready
          // class, so it failed working components — a false positive.)
          const initialized = await el.evaluate((e, cls) =>
            (cls ? e.classList.contains(cls) : false) ||
            e.hasAttribute('x-schema') ||
            e.classList.contains('x-ready') ||
            /\bwb-[a-z]/.test(e.className) ||
            e.children.length > 0,
          schema.compliance?.baseClass || '');

          if (!initialized) {
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
              // 'element'/'' mean "the component root itself" -- the same
              // convention runAssertions() (CHECK 5) and the visual check
              // (CHECK 9) already honor. Without this, any schema whose
              // button test targets the host element directly (e.g.
              // button.schema.json's own "Basic Click"/"Variant Classes",
              // since <button> IS the clickable button, no inner
              // selector to point at) got a literal `el.locator('element')`
              // CSS-tag lookup -- which never matches a real element named
              // <element> -- and failed every such test with a false
              // "Button not found".
              const btn = (btnTest.selector === 'element' || btnTest.selector === '')
                ? el
                : el.locator(btnTest.selector);
              const btnCount = (btnTest.selector === 'element' || btnTest.selector === '') ? 1 : await btn.count();

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
              // No selector (input.schema.json's "Error State"/"Helper Text",
              // among others) means "the component root itself", same as the
              // explicit 'element' convention CHECK 5/7 use -- `el.locator(undefined)`
              // isn't a no-op, it's a hard Playwright error ("Cannot read
              // properties of undefined (reading '_frame')"), which is why
              // these always landed as a [VISUAL] ... Error rather than a
              // real pass/fail on the class/style check that was intended.
              const noSelector = !visTest.expect.selector || visTest.expect.selector === 'element';
              const target = noSelector ? el : el.locator(visTest.expect.selector).first();

              // Check classes. Schemas overwhelmingly write hasClass as a
              // single string (card.schema.json's "Basic Card" -> ".x-card",
              // etc.) -- only accepting an array here meant `for...of` silently
              // iterated the STRING'S CHARACTERS instead ('w','b','-','c'...),
              // checking for nonsense one-letter classes and reporting them
              // as "missing".
              if (visTest.expect.hasClass) {
                const classes = Array.isArray(visTest.expect.hasClass) ? visTest.expect.hasClass : [visTest.expect.hasClass];
                for (const cls of classes) {
                  // #736, same rule as CHECK 1: a custom-tag host is styled by
                  // its TAG selector, so behaviors skip the redundant base class
                  // there (card.js:230 for this exact case). card.schema.json's
                  // "Basic Card" sets up a <article> and expects ".x-card" --
                  // covered by the tag, absent as a class, and correct either way.
                  const covered = await target.evaluate(
                    (el, c) => el.classList.contains(c) || el.tagName.toLowerCase() === c,
                    cls,
                  );
                  if (!covered) {
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
      await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
      
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
