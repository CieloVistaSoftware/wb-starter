# TIER 4 Functional Test Analysis
## WB Behaviors Library - Gap Analysis

Generated: December 29, 2025

---

## Executive Summary

After analyzing all behavior schemas and existing test files, significant gaps exist in functional testing coverage. While **schema validation** (TIER 1-3) is solid, **TIER 4 functional tests** (actual user interactions in browser) are incomplete or missing for most behaviors.

---

## Current Test Architecture

```
tests/
├── behaviors/ui/          # UI behavior tests (some deprecated)
├── compliance/            # Schema validation & static analysis ✅
└── regression/            # Regression tests
```

**What Works:**
- `schema-validation.spec.ts` - Validates JSON structure ✅
- `source-schema-compliance.spec.ts` - JS ↔ Schema alignment ✅
- `behavior-registry.spec.ts` - 100+ behaviors registered ✅

**What's Missing:**
- Actual browser-based functional tests for interactions
- No test runner that executes `test.functional` from schemas
- Many schemas have empty/incomplete `functional` sections

---

## Schema Coverage Analysis

### Schemas WITH Functional Tests Defined

| Schema | buttons | interactions | keyboard | visual | dismiss |
|--------|---------|--------------|----------|--------|---------|
| button | ✅ | ✅ | ✅ | ✅ | - |
| toast | ✅ | ✅ | ✅ | ✅ | - |
| dropdown | ✅ | ✅ | ✅ | ✅ | - |
| checkbox | - | ✅ | ✅ | ✅ | - |
| input | - | ✅ | ✅ | ✅ | - |
| select | - | ✅ | ✅ | ✅ | - |

### Schemas MISSING Functional Tests

| Schema | Issue |
|--------|-------|
| **tabs** | No `functional` section at all |
| **tooltip** | No `functional` section - CRITICAL (hover-based!) |
| **dialog** | No `functional` section - needs focus trap, ESC close |
| **drawer** | No `functional` section |
| **switch** | Marked as "not yet implemented" |
| **rating** | No `functional` section |
| **progress** | No `functional` section |
| **skeleton** | No `functional` section |
| **spinner** | No `functional` section |
| **All card variants** | Most have no functional tests |

---

## Critical Missing Test Categories

### 1. **Hover State Tests** (HIGH PRIORITY)
Currently **ZERO** hover tests exist in any schema.

Components needing hover tests:
- `tooltip` - Shows on hover, hides on mouse leave
- `button` - Hover state styling
- `dropdown` - Hover to open (optional mode)
- All cards - Hover reveals overlay/actions
- `rating` - Hover preview

**Example missing test:**
```json
{
  "name": "tooltip shows on hover",
  "setup": "<span data-wb=\"tooltip\" data-tooltip=\"Help text\">Hover me</span>",
  "action": "hover",
  "expect": {
    "selector": ".wb-tooltip",
    "visible": true
  }
}
```

### 2. **Focus Trap Tests** (HIGH PRIORITY)
Dialogs and modals need focus trap testing:

- Focus moves into dialog on open
- Tab cycles within dialog (doesn't escape)
- Shift+Tab reverse cycles
- Focus returns to trigger on close

**Example missing test:**
```json
{
  "name": "dialog traps focus",
  "setup": "<button data-wb=\"dialog\" data-dialog-title=\"Test\">Open</button>",
  "steps": [
    { "action": "click" },
    { "action": "press", "key": "Tab" },
    { "expect": { "focused": ".wb-dialog button:first-child" } }
  ]
}
```

### 3. **Disabled State Interaction Tests** (MEDIUM PRIORITY)
Disabled elements should NOT respond to clicks/keys.

Components needing disabled tests:
- `button` - Click should do nothing
- `checkbox` - Should not toggle
- `input` - Should not accept input
- `select` - Should not open dropdown
- `switch` - Should not toggle
- `tabs` - Disabled tab should not activate

**Example missing test:**
```json
{
  "name": "disabled button ignores click",
  "setup": "<button data-wb=\"button\" disabled>Disabled</button>",
  "action": "click",
  "expect": {
    "event": null,
    "selector": "button",
    "notClass": "active"
  }
}
```

### 4. **Keyboard Navigation Tests** (HIGH PRIORITY)
Many components define keyboard in schema but don't test it.

| Component | Arrow Keys | Enter/Space | Escape | Tab |
|-----------|------------|-------------|--------|-----|
| tabs | ❌ Missing | ❌ Missing | - | ❌ Missing |
| dropdown | ❌ Missing | ❌ Missing | ✅ | ❌ Missing |
| select | ❌ Missing | ✅ | ❌ Missing | ✅ |
| dialog | - | - | ❌ Missing | ❌ Missing |
| drawer | - | - | ❌ Missing | - |
| rating | ❌ Missing | ✅ | - | ❌ Missing |

**Example missing test:**
```json
{
  "name": "ArrowRight moves to next tab",
  "setup": "<div data-wb=\"tabs\">...</div>",
  "precondition": { "focused": ".wb-tabs__tab:first-child" },
  "key": "ArrowRight",
  "expect": {
    "focused": ".wb-tabs__tab:nth-child(2)"
  }
}
```

### 5. **Animation/Transition Tests** (LOW PRIORITY)
Verify animations complete before asserting state:
- Toast fade-in/fade-out
- Dialog backdrop fade
- Dropdown slide-down
- Collapse expand/contract

### 6. **Outside Click Tests** (MEDIUM PRIORITY)
Components that should close on outside click:
- `dropdown` - Close when clicking outside
- `dialog` - Close when clicking backdrop
- `tooltip` - Hide when clicking elsewhere
- `drawer` - Close when clicking overlay

**Example missing test:**
```json
{
  "name": "dropdown closes on outside click",
  "setup": "<div data-wb=\"dropdown\" class=\"open\">...</div><button id=\"outside\">Other</button>",
  "action": "click",
  "selector": "#outside",
  "expect": {
    "selector": ".wb-dropdown-menu",
    "visible": false
  }
}
```

---

## Recommended Test Runner Implementation

Create `tests/behaviors/functional-runner.spec.ts`:

```typescript
/**
 * TIER 4 Functional Test Runner
 * Reads test.functional from each schema and executes in browser
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCHEMA_DIR = 'src/behaviors/schema';

interface FunctionalTest {
  name: string;
  setup: string;
  action?: 'click' | 'hover' | 'focus' | 'press';
  selector?: string;
  key?: string;
  expect: {
    selector?: string;
    visible?: boolean;
    hasClass?: string[];
    event?: string;
    focused?: string;
  };
}

// Load all schemas with functional tests
function getSchemasWithFunctionalTests() {
  const schemas = [];
  const files = fs.readdirSync(SCHEMA_DIR).filter(f => f.endsWith('.schema.json'));
  
  for (const file of files) {
    const schema = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf-8'));
    if (schema.test?.functional && !schema.test?.skip) {
      schemas.push({ file, schema });
    }
  }
  return schemas;
}

// Execute each functional test category
for (const { file, schema } of getSchemasWithFunctionalTests()) {
  const behavior = schema.behavior;
  const functional = schema.test.functional;
  
  test.describe(`Functional: ${behavior}`, () => {
    
    // Button click tests
    for (const btn of functional.buttons || []) {
      test(`${btn.name}`, async ({ page }) => {
        await page.setContent(`<html><body>${btn.setup}</body></html>`);
        await page.click(btn.selector || 'element');
        // Assert expectations...
      });
    }
    
    // Keyboard tests
    for (const kb of functional.keyboard || []) {
      test(`${kb.name}`, async ({ page }) => {
        await page.setContent(`<html><body>${kb.setup}</body></html>`);
        await page.keyboard.press(kb.key);
        // Assert expectations...
      });
    }
    
    // Hover tests
    for (const hv of functional.hover || []) {
      test(`${hv.name}`, async ({ page }) => {
        await page.setContent(`<html><body>${hv.setup}</body></html>`);
        await page.hover(hv.selector);
        // Assert expectations...
      });
    }
  });
}
```

---

## Priority Action Items

### Phase 1: Critical Gaps (Week 1)
1. Add `functional.hover` tests to **tooltip** schema
2. Add `functional.keyboard` tests to **tabs** schema (Arrow navigation)
3. Add `functional.dismiss` tests to **dialog** schema (ESC close, backdrop click)
4. Create functional test runner that reads schemas

### Phase 2: Interaction Coverage (Week 2)
1. Add disabled state tests to all interactive components
2. Add focus trap tests to dialog/drawer
3. Add outside click tests to dropdown/dialog/tooltip
4. Add form submission tests to input/select/checkbox

### Phase 3: Edge Cases (Week 3)
1. Animation completion tests
2. Rapid interaction tests (double-click, spam keys)
3. Touch device tests (tap, swipe)
4. Responsive behavior tests

---

## Metrics

| Category | Current | Target |
|----------|---------|--------|
| Schemas with functional tests | ~6/50 | 40/50 |
| Hover tests defined | 0 | 15+ |
| Keyboard nav tests | ~10 | 50+ |
| Disabled state tests | 0 | 20+ |
| Focus trap tests | 0 | 5+ |
| Outside click tests | 0 | 10+ |

---

## Files to Create/Modify

1. **NEW**: `tests/behaviors/functional-runner.spec.ts`
2. **MODIFY**: `tooltip.schema.json` - Add functional.hover tests
3. **MODIFY**: `tabs.schema.json` - Add functional.keyboard tests
4. **MODIFY**: `dialog.schema.json` - Add functional.keyboard + dismiss tests
5. **MODIFY**: `dropdown.schema.json` - Add Arrow key tests
6. **NEW**: `tests/behaviors/hover-states.spec.ts` - Dedicated hover tests
7. **NEW**: `tests/behaviors/keyboard-nav.spec.ts` - Dedicated keyboard tests
8. **NEW**: `tests/behaviors/disabled-states.spec.ts` - Disabled interaction tests

---

## Conclusion

The schema infrastructure is excellent - properties, permutations, and assertions are well-defined. The gap is **execution**: no test runner currently reads `test.functional` and runs actual browser tests.

**Recommended approach:**
1. Build the functional test runner first
2. Then systematically add missing `functional` sections to schemas
3. Use schema-driven approach for consistency

This maintains the "one source of truth" philosophy while enabling comprehensive TIER 4 coverage.
