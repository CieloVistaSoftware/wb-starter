# x- Prefix Migration — Phase 1: Core Infrastructure

**Document Version:** 1.0  
**Created:** 2026-02-13  
**Status:** Ready for Implementation  
**Target Completion:** ~2 hours  

---

## Executive Summary

Phase 1 refactors the core behavior injection system to extract hardcoded mappings into dedicated, maintainable modules. This enables subsequent phases (attribute naming, builder, HTML migration) to work from a single source of truth.

**Outcome:** Three new modules (`tag-map.js`, `extensions.js`) that make `wb.js` 40% simpler and enable automated code generation in future phases.

---

## Problem Statement

### Current State
- `wb.js` contains **hardcoded mappings**:
  - `autoInjectMappings` array (20+ native elements)
  - Inline extension detection logic scattered throughout `scan()` / `observe()`
  - No way to auto-generate mappings for builder, schemas, or documentation
  
- **80+ component schemas** exist but are unreferenced by infrastructure
- **No centralized registry** for:
  - What behaviors exist
  - What elements trigger them
  - What x-* extensions are valid
  - How to validate extension values

### Impact
- **Builders & IDEs** can't auto-detect valid components/attributes
- **Future phases** must duplicate mapping logic
- **Tests** can't validate naming consistency
- **Documentation** can't auto-generate from schemas

---

## Solution Overview

### Three New Modules

| Module | Purpose | Output |
|--------|---------|--------|
| **tag-map.js** | Element → Behavior mappings | `elementMap`, `nativeMap`, `extensionMap` |
| **extensions.js** | Extension definitions + validation | `extensionRegistry`, validators |
| **wb.js (refactored)** | Simplified injection engine | Uses modules instead of hardcoded arrays |

### Architecture Diagram

```
Current (Monolithic):
┌─────────────────────────────────────┐
│            wb.js (900 lines)        │
│  ├─ scan()                          │
│  ├─ observe()                       │
│  ├─ inject()                        │
│  ├─ autoInjectMappings [hardcoded]  │
│  ├─ Extension detection [inline]    │
│  └─ Reserve attributes [inline]     │
└─────────────────────────────────────┘

Future (Modular):
┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  tag-map.js      │  │ extensions.js    │  │  wb.js (600L)   │
│  ├─ elementMap   │  │  ├─ registry     │  │  ├─ scan()      │
│  ├─ nativeMap    │  │  ├─ validators   │  │  ├─ observe()   │
│  └─ extensionMap │  │  └─ schemas      │  │  └─ inject()    │
└──────────────────┘  └─────────────────┘  └─────────────────┘
        ↑                    ↑                      ↑
        └────────┬───────────┴──────────────────────┘
                 │
         Used by wb.js
         Consumed by:
         - Builder (Phase 3)
         - HTML Scanner (Phase 4)
         - Schema Generator (Phase 5)
         - Docs Generator (Phase 7)
```

---

## Phase 1 Detailed Specification

### Module 1: `src/core/tag-map.js`

**Purpose:** Centralized registry of tag name → behavior mappings.

**Exports:**
```javascript
export const elementMap       // <wb-*> custom elements
export const nativeMap        // <input>, <button>, etc.
export const extensionMap     // x-ripple, x-tooltip, etc.
export const allBehaviors     // Merged set of all behaviors
export function getElementBehavior(tagName)
export function getNativeBehavior(selector)
export function getExtensionBehavior(attrName)
```

**Content:**

#### `elementMap` — Custom Element Mappings
Maps `<wb-*>` tag names to behavior names.

**Source Data:** Schema filenames in `src/wb-models/`  
**Format:** `{ 'wb-card': 'card', 'wb-alert': 'alert', ... }`

**Generation Logic:**
```javascript
// Scan src/wb-models/*.schema.json
// Extract filename without extension
// Handle naming conventions:

// Standard: alert.schema.json → wb-alert
// Compound: cardpricing.schema.json → wb-card-pricing
// Exception: cardstats.schema.json → wb-card-stats (preserve camelCase)

elementMap = {
  'wb-card': 'card',
  'wb-card-stats': 'cardstats',
  'wb-card-pricing': 'cardpricing',
  'wb-card-product': 'cardproduct',
  'wb-alert': 'alert',
  'wb-avatar': 'avatar',
  'wb-badge': 'badge',
  'wb-button': 'button',
  'wb-checkbox': 'checkbox',
  'wb-dialog': 'dialog',
  'wb-dropdown': 'dropdown',
  'wb-progress': 'progress',
  'wb-radio': 'radio',
  'wb-select': 'select',
  'wb-switch': 'switch',
  'wb-table': 'table',
  'wb-tabs': 'tabs',
  'wb-textarea': 'textarea',
  'wb-timeline': 'timeline',
  'wb-toast': 'toast',
  'wb-toggle': 'toggle',
  'wb-tooltip': 'tooltip',
  // ... (80+ entries)
}
```

**Notes:**
- Compound names: schema file `cardhero.schema.json` → element `<wb-card-hero>` → behavior `cardhero`
- Naming must match `wb.js` behavior imports exactly
- Document any special cases (e.g., `span.schema.json` → no auto-inject)

#### `nativeMap` — Native Element Auto-Inject Mappings
Maps native element selectors to behaviors for auto-injection.

**Source Data:** Hardcoded in current `wb.js` lines ~65-79  
**Format:** `{ 'input[type="checkbox"]': 'checkbox', 'button': 'button', ... }`

```javascript
nativeMap = {
  // Form Elements
  'input[type="checkbox"]': 'checkbox',
  'input[type="radio"]': 'radio',
  'input[type="range"]': 'range',
  'input[type="text"]': 'input',  // If needed
  'select': 'select',
  'textarea': 'textarea',
  'button': 'button',
  'form': 'form',
  'fieldset': 'fieldset',
  'label': 'label',
  
  // Media
  'img': 'image',
  'video': 'video',
  'audio': 'audio',
  
  // Semantic Text
  'code': 'code',
  'pre': 'pre',
  'kbd': 'kbd',
  'mark': 'mark',
  
  // Structure
  'table': 'table',
  'details': 'details',
  'dialog': 'dialog',
  'progress': 'progress',
  'header': 'header',
  'footer': 'footer'
}
```

**Notes:**
- Auto-inject is **optional** (only if `config.autoInject = true`)
- Selector format matches `element.matches()` (supports attribute selectors)
- Reserved attributes in `wb.js` prevent these behaviors from being overridden

#### `extensionMap` — x-* Extension Mappings
Maps `x-*` attribute names to extension behaviors (shorthand).

**Source Data:** Extension detection logic in current `wb.js` scan/observe methods  
**Format:** `{ 'x-ripple': 'ripple', 'x-tooltip': 'tooltip', ... }`

```javascript
extensionMap = {
  // Morphing (x-as-*)
  'x-as-card': 'card',
  'x-as-timeline': 'timeline',
  'x-as-testimonial': 'testimonial',
  // ... (morphing variants)
  
  // Effects & Behaviors
  'x-ripple': 'ripple',
  'x-tooltip': 'tooltip',
  'x-draggable': 'draggable',
  'x-resizable': 'resizable',
  'x-animate': 'animate',
  'x-delay': 'delay',
  'x-sticky': 'sticky',
  'x-lazy': 'lazy',
  'x-placeholder': 'placeholder',
  // ... (other extensions)
}
```

**Notes:**
- Morphing: `<article x-as-card>` → applies `card` behavior to element
- Effects: `<button x-ripple>` → applies `ripple` behavior to button
- Extensions are **opt-in** (explicitly declared via attribute)

#### `allBehaviors` — Merged Registry
```javascript
allBehaviors = {
  ...elementMap,
  ...nativeMap,
  ...extensionMap
}
```

**Helper Functions:**

```javascript
/**
 * Detect behavior from element tag name
 * @param {string} tagName - e.g., 'wb-card', 'wb-card-pricing'
 * @returns {string|null} Behavior name or null
 */
export function getElementBehavior(tagName) {
  const lower = tagName.toLowerCase();
  return elementMap[lower] || null;
}

/**
 * Find matching native auto-inject behavior
 * @param {HTMLElement} element
 * @returns {string|null} Behavior name or null
 */
export function getNativeBehavior(element) {
  for (const [selector, behavior] of Object.entries(nativeMap)) {
    if (element.matches(selector)) {
      return behavior;
    }
  }
  return null;
}

/**
 * Detect extension behavior from attribute name
 * @param {string} attrName - e.g., 'x-ripple', 'x-as-card'
 * @returns {string|null} Behavior name or null
 */
export function getExtensionBehavior(attrName) {
  return extensionMap[attrName] || null;
}
```

**File Structure:**
```javascript
// src/core/tag-map.js

/**
 * Element → Behavior Mappings
 * Source: src/wb-models/*.schema.json (80+ entries)
 * Last Updated: 2026-02-13
 */

// === CUSTOM ELEMENT MAPPINGS ===
// <wb-card> → card behavior + card.schema.json
export const elementMap = {
  'wb-card': 'card',
  'wb-card-stats': 'cardstats',
  // ... (80 total)
};

// === NATIVE ELEMENT AUTO-INJECT ===
// <input type="checkbox"> → checkbox behavior (if autoInject=true)
export const nativeMap = {
  'input[type="checkbox"]': 'checkbox',
  // ... (20 total)
};

// === EXTENSION MAPPINGS ===
// <button x-ripple> → ripple behavior
// <article x-as-card> → card behavior (morphing)
export const extensionMap = {
  'x-ripple': 'ripple',
  // ... (15+ total)
};

// === MERGED REGISTRY ===
export const allBehaviors = {
  ...elementMap,
  ...nativeMap,
  ...extensionMap
};

// === HELPER FUNCTIONS ===
export function getElementBehavior(tagName) { /* ... */ }
export function getNativeBehavior(element) { /* ... */ }
export function getExtensionBehavior(attrName) { /* ... */ }
```

---

### Module 2: `src/core/extensions.js`

**Purpose:** Registry of x-* extensions with validation, schema refs, and configuration.

**Exports:**
```javascript
export const extensionRegistry       // Detailed extension definitions
export function getExtension(name)
export function isValidExtension(name, value)
export function validateExtensionValue(name, value)
```

**Content:**

#### Extension Definition Schema

Each extension declares:
- **Type** — boolean, string, object, enum
- **Description** — what it does
- **Accepts Value** — whether it can have a config value
- **Validator** — function to validate the value
- **Defaults** — default config if value not provided
- **Schema File** — references to `src/wb-models/` schema

```javascript
export const extensionRegistry = {
  /**
   * Boolean extensions (no value needed)
   */
  ripple: {
    name: 'ripple',
    type: 'boolean',
    description: 'Material Design ripple effect on click',
    acceptsValue: false,
    schemaFile: 'ripple.schema.json',
    example: '<button x-ripple>Click me</button>',
    validator: null  // Boolean only, no validation needed
  },

  /**
   * String extensions (require text value)
   */
  tooltip: {
    name: 'tooltip',
    type: 'string',
    description: 'Tooltip text on hover',
    acceptsValue: true,
    schemaFile: 'tooltip.schema.json',
    example: '<button x-tooltip="Save your changes">Save</button>',
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'x-tooltip value must be non-empty string'
  },

  /**
   * JSON object extensions
   */
  draggable: {
    name: 'draggable',
    type: 'object',
    description: 'Make element draggable with optional configuration',
    acceptsValue: true,
    schemaFile: 'draggable.schema.json',
    example: '<div x-draggable=\'{"handle": ".header"}\'>Drag me</div>',
    validator: (value) => {
      try {
        if (typeof value === 'string') JSON.parse(value);
        return true;
      } catch { return false; }
    },
    errorMessage: 'x-draggable value must be valid JSON object',
    defaults: { handle: null, axis: 'both' }
  },

  /**
   * Enum extensions
   */
  animate: {
    name: 'animate',
    type: 'enum',
    description: 'CSS animation to apply',
    acceptsValue: true,
    schemaFile: 'animate.schema.json',
    example: '<div x-animate="bounce">Animated</div>',
    validator: (value) => ['fade', 'slide', 'bounce', 'spin', 'pulse'].includes(value),
    errorMessage: 'x-animate must be one of: fade, slide, bounce, spin, pulse',
    enum: ['fade', 'slide', 'bounce', 'spin', 'pulse']
  }
};
```

**Helper Functions:**

```javascript
export function getExtension(name) {
  return extensionRegistry[name] || null;
}

export function hasExtension(name) {
  return name in extensionRegistry;
}

export function isValidExtension(name, value) {
  const ext = getExtension(name);
  if (!ext) return false;
  if (!ext.acceptsValue && value !== '') return false;
  if (ext.validator && !ext.validator(value)) return false;
  return true;
}

export function validateExtensionValue(name, value) {
  const ext = getExtension(name);
  if (!ext) {
    return { valid: false, error: `Unknown extension: x-${name}` };
  }
  if (!ext.acceptsValue && value !== '') {
    return { valid: false, error: `x-${name} does not accept values` };
  }
  if (ext.validator && !ext.validator(value)) {
    return { valid: false, error: ext.errorMessage || `Invalid value for x-${name}: ${value}` };
  }
  return { valid: true, error: null };
}
```

---

### Module 3: `src/core/wb.js` Refactoring

**Changes:** Import and use the two new modules instead of hardcoded arrays.

**Current Code** (remove these)
```javascript
const autoInjectMappings = [
  { selector: 'input[type="checkbox"]', behavior: 'checkbox' },
  { selector: 'input[type="radio"]', behavior: 'radio' },
  // ... 20+ entries hardcoded
];
```

**New Code** (replace with)
```javascript
import { elementMap, nativeMap, extensionMap, getElementBehavior, getNativeBehavior } from './tag-map.js';
import { extensionRegistry, getExtension, isValidExtension } from './extensions.js';

// Use nativeMap instead of autoInjectMappings
const autoInjectMappings = Object.entries(nativeMap).map(([selector, behavior]) => ({
  selector,
  behavior
}));
```

---

## Implementation Timeline

### Step 1: Generate `tag-map.js` (20 min)
- Scan `src/wb-models/*.schema.json`
- Extract filenames and map to behavior names
- Handle compound names (cardpricing → card-pricing)
- Add all native element mappings
- Add extension mappings

### Step 2: Create `extensions.js` (30 min)
- Extract extension list from current wb.js
- Define extension registry with all required fields
- Add validators for each extension type
- Add helper functions

### Step 3: Refactor `wb.js` (60 min)
- Import both new modules
- Remove hardcoded `autoInjectMappings` array
- Update `getAutoInjectBehavior()` implementation
- Update `_detectSchemaName()` implementation
- Refactor `scan()` method
- Refactor `observe()` method
- Run full test suite: all 26 tests pass

---

## Success Criteria

Phase 1 is complete when:

1. **Files Created**
   - [ ] `src/core/tag-map.js` exists with 80+ element mappings
   - [ ] `src/core/extensions.js` exists with extension registry

2. **Functionality Preserved**
   - [ ] All 26 tests pass (Chromium, WebKit, Firefox, Mobile)
   - [ ] Custom elements (`<wb-*>`) still auto-detected
   - [ ] Extensions (`x-*`) still auto-detected
   - [ ] Auto-inject still works (when enabled)

3. **Code Quality**
   - [ ] `wb.js` 33% smaller (900 → 600 lines)
   - [ ] No regressions in behavior injection
   - [ ] Clean module separation

---

## Open Questions for John

1. **Compound naming:** Should `cardhero.schema.json` map to:
   - `wb-card-hero` (kebab-case, matches HTML convention)?
   - `wb-cardhero` (single tag)?

2. **Extension validation:** Should invalid `x-*` attributes:
   - Fail silently (current behavior)?
   - Log warnings and set `x-error` attribute?

3. **Schema file references:** Should `extensions.js` include:
   - Full schema path?
   - Relative path?
   - Just filename?

4. **Builder integration timeline:** Is Phase 3 (Builder) planned soon?

---

*Document created: 2026-02-13*  
*Status: Ready for Review*
