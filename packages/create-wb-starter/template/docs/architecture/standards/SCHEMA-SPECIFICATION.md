# WB-Starter Schema Specification v3.0

**Version:** 3.1  
**Created:** 2026-01-05  
**Updated:** 2026-02-18  
**Status:** Active

---

## Table of Contents

- [Schema Types](#schema-types)
- [Page Schemas](#page-schemas)
- [Golden Rule](#golden-rule)
- [Schema Structure](#schema-structure)
- [Properties (Model)](#properties-model)
- [$view (View)](#view-view)
- [$methods (ViewModel)](#methods-viewmodel)
- [$cssAPI (CSS Custom Properties)](#cssapi-css-custom-properties)
- [Public vs Private Parts](#public-vs-private-parts)
- [Complete Example](#complete-example)
- [Test Configuration](#test-configuration)
- [Migration Guide](#migration-guide)

---

## Schema Types

Every `.schema.json` file has a `schemaType` that determines what's required:

| Type | Purpose | Required Fields |
|------|---------|----------------|
| `component` | Real components users interact with | title, description, properties, $view, $methods, behavior |
| `base` | Abstract schemas inherited by others | title, description, properties |
| `definition` | Pure reference documents | title, description |
| `page` | Page-level layout and content placement | title, description, pageRules, $layout |

Component schemas define **what a component is**. Page schemas define **how components are arranged on a page**.

---

## Page Schemas

Page schemas (`schemaType: "page"`) define layout, rules, and content placement for an entire page.

### pageRules

Page-level rules that govern generation and validation:

```json
"pageRules": {
  "showcase": false,
  "fragment": true,
  "noInlineStyles": true,
  "noPageSpecificCSS": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `showcase` | boolean | If true, all sections wrap in `wb-demo` (shows source code). False for production pages. |
| `fragment` | boolean | Page is a fragment — no DOCTYPE/html/head/body. Server shell wraps it. |
| `noInlineStyles` | boolean | No inline styles allowed on any element. |
| `noPageSpecificCSS` | boolean | No page-specific CSS file. All styling from component CSS. |

### $layout — Row-Based Layout System

Pages are built from **rows stacked vertically**. Each row is a **grid** with a defined shape.

```json
"$layout": {
  "gap": "2rem",
  "maxWidth": "1200px",
  "rows": [
    { "columns": 1, "width": "full-bleed", "content": ["hero"] },
    { "columns": 1, "width": "900px", "content": ["stats"] },
    { "columns": 3, "width": "1200px", "content": ["card1", "card2", "card3"] },
    { "columns": 2, "ratio": "60/40", "content": ["notifications", "audio"] }
  ]
}
```

#### Layout-Level Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `gap` | string | `"2rem"` | Vertical gap between rows AND horizontal gap between columns. |
| `maxWidth` | string | `"1200px"` | Default max-width for contained rows. Individual rows can override. |
| `rows` | array | — | Ordered list of layout rows. Each row stacks on top of the next. |

#### Row Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `columns` | integer | — | Number of columns: 1, 2, or 3. Collapses to 1 on mobile. |
| `rows` | integer | (auto) | Number of rows. If omitted, rows expand as content fills cells. |
| `direction` | string | `"row"` | Fill order: `"row"` = left to right then down. `"column"` = top to bottom then right. |
| `ratio` | string | (equal) | Column width ratio. Examples: `"50/50"`, `"70/30"`, `"33/33/33"`, `"25/50/25"`. |
| `width` | string | contained | `"full-bleed"` = edge to edge. A CSS value (e.g. `"900px"`) = contained with max-width. |
| `align` | string | `"stretch"` | Vertical alignment of items: `"top"`, `"center"`, `"bottom"`, `"stretch"`. |
| `gap` | string | (inherit) | Override gap for this row only. |
| `content` | array | — | Section names placed in this row. Must match `$view` or `properties` section names. |

#### Grid Shape: Fixed vs Auto

**Fixed shape** — define exact rows × columns. Content maps to cells:
```json
{ "columns": 3, "rows": 2, "content": ["a", "b", "c", "d", "e", "f"] }
```
Result (direction: row): `a b c / d e f`

**Auto-flow** — define columns only, rows expand as needed:
```json
{ "columns": 3, "content": ["a", "b", "c", "d", "e", "f", "g", "h", "i"] }
```
Result (direction: row): `a b c / d e f / g h i`

#### Fill Direction

`direction` controls how content fills the grid:

**`"row"`** (default) — fill left to right, then next row:
```
a b c
d e f
g h i
```

**`"column"`** — fill top to bottom, then next column:
```
a d g
b e h
c f i
```

#### Layout Primitives

All layouts reduce to grid configuration:

| Pattern | Grid Equivalent |
|---------|-----------------|
| Stack (vertical) | `columns: 1, direction: "column"` |
| Row (horizontal) | `columns: N, rows: 1, direction: "row"` |
| Grid (2D) | `columns: N, direction: "row"` or `"column"` |
| 2-col with ratio | `columns: 2, ratio: "60/40"` |
| Full-bleed section | `columns: 1, width: "full-bleed"` |

#### Mobile-First Behavior

All multi-column rows collapse to single column on small viewports. This is automatic — no configuration needed. The `columns` value defines the **desktop** layout. Mobile is always 1 column.

#### Example: Home Page

```json
"$layout": {
  "gap": "2rem",
  "maxWidth": "1200px",
  "rows": [
    { "columns": 1, "width": "full-bleed", "content": ["hero"] },
    { "columns": 1, "width": "900px", "content": ["stats"] },
    { "columns": 1, "width": "1200px", "content": ["features"] },
    { "columns": 2, "ratio": "60/40", "width": "1200px", "content": ["notifications", "audio"] }
  ]
}
```

### Page Test Assertions

Page schemas include test sections for layout validation:

```json
"test": {
  "site": {
    "layout": {
      "noWbDemo": true,
      "noInlineStyles": true,
      "isFragment": true,
      "sectionOrder": ["hero", "stats", "features", "notifications", "audio"]
    },
    "mobileFirst": {
      "breakpoint": 375,
      "noOverflow": true,
      "gridCollapses": true,
      "noHorizontalScroll": true
    },
    "fluent": {
      "noDashedBorders": true,
      "noBuilderBackground": true,
      "noForcedMinHeight": true,
      "minSectionGap": 16,
      "maxSectionGap": 150
    }
  }
}
```

---

## Golden Rule

> **Attribute name = what it is for**  
> **Schema = where it goes**

Users provide simple attribute values. The schema defines how those values become DOM structure. **Users should never need to know component internals.**

```html
<!-- ✅ CLEAN: User just sets values -->
<wb-hero
  title="Explore"
  subtitle="Your journey"
  cta="Launch">
</wb-hero>
<!-- ❌ UGLY: User must know internal slots -->
<wb-hero>
  <h1 slot="title">Explore</h1>
  <p slot="subtitle">Your journey</p>
</wb-hero>
```

| Content Type | Use | Example |
|--------------|-----|---------|
| Simple text | **Attributes** | `title="Hello"` |
| Enum choices | **Attributes** | `variant="cosmic"` |
| Boolean flags | **Attributes** | `elevated` |
| Arbitrary rich content | **Body only** | `<wb-card>Any HTML</wb-card>` |

---

## Schema Structure

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "component.schema.json",
  "title": "Component Name",
  "description": "Component description",
  
  "behavior": "component",
  "baseClass": "wb-component",
  
  "semanticElement": {
    "tagName": "article",
    "implicitRole": "article"
  },
  
  "properties": { },
  "$view": [ ],
  "$methods": { },
  "$cssAPI": { },
  
  "test": { },
  "_metadata": { }
}
```

### Top-Level Properties

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| `behavior` | ✅ | string | Behavior name (kebab-case) |
| `baseClass` | ✅ | string | Base CSS class (BEM block) |
| `title` | ✅ | string | Human-readable name |
| `description` | ✅ | string | Component description |
| `semanticElement` | 🔶 | object | Default HTML element mapping |
| `properties` | ✅ | object | Model - data inputs (attributes) |
| `$view` | ✅ | array | View - DOM structure |
| `$methods` | ✅ | object | ViewModel - callable functions |
| `$cssAPI` | 🔶 | object | Public CSS custom properties |
| `test` | 🔶 | object | Test configuration |
| `_metadata` | 🔶 | object | Categorization, icons, etc. |

---

## Properties (Model)

The `properties` section defines **data inputs** - the attributes users provide.

```json
{
  "properties": {
    "title": {
      "type": "string",
      "description": "Card title displayed in header",
      "default": ""
    },
    "variant": {
      "type": "string",
      "description": "Visual style variant",
      "enum": ["default", "glass", "bordered", "flat"],
      "default": "default"
    },
    "elevated": {
      "type": "boolean",
      "description": "Add drop shadow",
      "default": false,
      "appliesClass": "wb-card--elevated"
    },
    "dismissible": {
      "type": "boolean",
      "description": "Can be dismissed",
      "default": false
    }
  }
}
```

### Property Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✅ | `"string"`, `"boolean"`, `"number"`, `"integer"`, `"array"`, `"object"` |
| `description` | string | ✅ | Human-readable description (for docs/IDE) |
| `default` | any | ✅ | Default value when attribute is absent. Every property MUST have a default. |
| `enum` | array | 🔶 | Valid values (for dropdowns). Defines the complete set of allowed values. |
| `minimum` | number | 🔶 | Minimum allowed value (for `number`/`integer` types) |
| `maximum` | number | 🔶 | Maximum allowed value (for `number`/`integer` types) |
| `appliesClass` | string | 🔶 | CSS class applied when truthy |
| `required` | boolean | 🔶 | Is this attribute required? |

### Property Constraint Rules

1. **`default` is mandatory.** Every property must declare a `default`. A property with no default is an invalid schema — the engine cannot determine baseline behavior without it.
2. **`enum` defines the universe.** If a property has `enum`, those are the ONLY valid values. No other value should be accepted.
3. **`boolean` implies `[true, false]`.** Any `type: "boolean"` property has exactly two valid states.
4. **`minimum` + `maximum` define the range.** For `number`/`integer` types, these define the valid boundaries. If either is missing, the range is open on that side.
5. **No constraints = invalid.** Every property must have at least `type` + `default`. Properties with no type information are schema errors.

### Naming Rules

| ✅ Use | ❌ Avoid | Why |
|--------|---------|-----|
| `variant` | `type` | Conflicts with native `type` attribute |
| `heading` | `title` | Native `title` creates browser tooltip |
| `src` | - | Native attribute, use for URLs |
| `dismissible` | `closable` | More descriptive |

---

## $view (View)

The `$view` section defines **DOM structure** - what gets rendered.

```json
{
  "$view": [
    { 
      "name": "header", 
      "tag": "header",
      "public": true,
      "createdWhen": "title OR subtitle"
    },
    { 
      "name": "title", 
      "tag": "h3", 
      "parent": "header",
      "public": true,
      "content": "{{title}}",
      "createdWhen": "title"
    },
    { 
      "name": "subtitle", 
      "tag": "p", 
      "parent": "header",
      "public": true,
      "content": "{{subtitle}}",
      "createdWhen": "subtitle"
    },
    {
      "name": "wrapper",
      "tag": "div",
      "public": false,
      "description": "Internal layout wrapper"
    },
    { 
      "name": "main", 
      "tag": "main",
      "parent": "wrapper",
      "public": true,
      "required": true,
      "content": "{{body}}"
    },
    { 
      "name": "footer", 
      "tag": "footer",
      "public": true,
      "content": "{{footer}}",
      "createdWhen": "footer"
    }
  ]
}
```

### $view Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Part identifier → generates class |
| `tag` | string | ✅ | HTML element (lowercase) |
| `parent` | string | 🔶 | Nest inside another part (by name) |
| `content` | string | 🔶 | Template with `{{prop}}` interpolation |
| `required` | boolean | 🔶 | Always create this element |
| `createdWhen` | string | 🔶 | Conditional creation expression |
| `public` | boolean | 🔶 | Is this part of the public API? (default: `true`) |
| `class` | string | 🔶 | Additional CSS classes |
| `description` | string | 🔶 | Documentation for this part |

### Creation Logic

| Condition | Element Created? |
|-----------|------------------|
| `"required": true` | ✅ Always |
| `"createdWhen": "prop"` | If `prop` is truthy |
| `"createdWhen": "A OR B"` | If A or B is truthy |
| `"createdWhen": "A AND B"` | If A and B are truthy |
| *(none of above)* | If `content` would have value |

### Class Generation

| `name` | `baseClass` | Generated Class |
|--------|-------------|-----------------|
| `header` | `wb-card` | `wb-card__header` |
| `title` | `wb-card` | `wb-card__title` |
| `wrapper` (private) | `wb-card` | `wb-card__-wrapper` |

---

## $methods (ViewModel)

The `$methods` section defines **callable functions** bound to the element.

```json
{
  "$methods": {
    "show": {
      "description": "Shows the component",
      "params": []
    },
    "hide": {
      "description": "Hides the component",
      "params": []
    },
    "toggle": {
      "description": "Toggles visibility",
      "params": []
    },
    "update": {
      "description": "Updates component properties",
      "params": ["options"],
      "returns": "void"
    },
    "dismiss": {
      "description": "Dismisses and removes the component",
      "params": [],
      "returns": "Promise"
    }
  }
}
```

### $methods Item Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | What the method does |
| `params` | array | Parameter names |
| `returns` | string | Return type (optional) |

### Standard Methods

All components should implement these base methods:

| Method | Description |
|--------|-------------|
| `show()` | Shows the component |
| `hide()` | Hides the component |
| `toggle()` | Toggles visibility |
| `update(options)` | Updates properties |

---

## $cssAPI (CSS Custom Properties)

The `$cssAPI` section defines **public CSS custom properties** for theming/customization.

```json
{
  "$cssAPI": {
    "--wb-card-padding": {
      "default": "1rem",
      "description": "Internal padding"
    },
    "--wb-card-radius": {
      "default": "8px",
      "description": "Border radius"
    },
    "--wb-card-shadow": {
      "default": "none",
      "description": "Box shadow (applied when elevated)"
    },
    "--wb-card-header-bg": {
      "default": "transparent",
      "description": "Header background color"
    },
    "--wb-card-border": {
      "default": "1px solid var(--border-color, #e0e0e0)",
      "description": "Border style"
    }
  }
}
```

### Why $cssAPI?

CSS is inherently public - anyone can target any selector. `$cssAPI` documents:

1. **What's stable** - These variables won't change names
2. **What's customizable** - Official extension points
3. **Default values** - What you get out of the box

### Usage

```css
/* ✅ GOOD: Uses public CSS API */
wb-card {
  --wb-card-padding: 2rem;
  --wb-card-header-bg: #f5f5f5;
  --wb-card-radius: 16px;
}

/* ⚠️ FRAGILE: Targets internal structure (may break) */
.wb-card__header {
  background: #f5f5f5;
}

/* ❌ BAD: Targets private part (will break) */
.wb-card__-wrapper {
  display: flex;
}
```

### $cssAPI Item Fields

| Field | Type | Description |
|-------|------|-------------|
| `default` | string | Default CSS value |
| `description` | string | What this property controls |
| `type` | string | Optional: `color`, `length`, `number`, etc. |

---

## Public vs Private Parts

### The Principle

| Type | Class Pattern | Documented | Stable | Can Target |
|------|---------------|------------|--------|------------|
| **Public** | `.wb-card__header` | ✅ Yes | ✅ Yes | ✅ Yes |
| **Private** | `.wb-card__-wrapper` | ❌ No | ❌ No | ⚠️ At your risk |

### Default Behavior

- **Default is PUBLIC** (`public: true`)
- **Explicit private** requires `"public": false`

### Naming Convention

```
Public:  .wb-{component}__{name}
Private: .wb-{component}__-{name}   ← Note the dash prefix
```

### Example

```json
{
  "$view": [
    { "name": "header", "tag": "header", "public": true },
    { "name": "layout", "tag": "div", "public": false },
    { "name": "title", "tag": "h3", "parent": "header", "public": true }
  ]
}
```

**Rendered:**
```html
<wb-card>
  <header class="wb-card__header"> <!-- Public: stable -->
    <h3 class="wb-card__title">Hello</h3> <!-- Public: stable -->
  </header>
  <div class="wb-card__-layout"> <!-- Private: may change --> ... </div>
</wb-card>
```

### Documentation Impact

| Public Parts | Private Parts |
|--------------|---------------|
| Appear in generated docs | Hidden from docs |
| Appear in IDE autocomplete | Hidden from autocomplete |
| Part of semantic versioning | Can change in minor versions |

---

## Complete Example

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "alert.schema.json",
  "title": "Alert",
  "description": "Alert component for displaying messages with severity levels",
  
  "behavior": "alert",
  "baseClass": "wb-alert",
  
  "semanticElement": {
    "tagName": "div",
    "implicitRole": "alert"
  },
  
  "properties": {
    "variant": {
      "type": "string",
      "description": "Alert severity/type",
      "enum": ["info", "success", "warning", "error"],
      "default": "info"
    },
    "title": {
      "type": "string",
      "description": "Alert title",
      "default": ""
    },
    "message": {
      "type": "string",
      "description": "Alert message content",
      "default": ""
    },
    "icon": {
      "type": "string",
      "description": "Icon (emoji or icon name)",
      "default": ""
    },
    "dismissible": {
      "type": "boolean",
      "description": "Can alert be dismissed",
      "default": false
    }
  },
  
  "$view": [
    {
      "name": "container",
      "tag": "div",
      "public": false,
      "required": true,
      "description": "Internal flex layout container"
    },
    {
      "name": "icon",
      "tag": "span",
      "parent": "container",
      "public": true,
      "content": "{{icon}}",
      "createdWhen": "icon"
    },
    {
      "name": "content",
      "tag": "div",
      "parent": "container",
      "public": true,
      "required": true
    },
    {
      "name": "title",
      "tag": "strong",
      "parent": "content",
      "public": true,
      "content": "{{title}}",
      "createdWhen": "title"
    },
    {
      "name": "message",
      "tag": "p",
      "parent": "content",
      "public": true,
      "content": "{{message}}"
    },
    {
      "name": "close",
      "tag": "button",
      "parent": "container",
      "public": true,
      "content": "✕",
      "createdWhen": "dismissible"
    }
  ],
  
  "$methods": {
    "show": {
      "description": "Shows the alert",
      "params": []
    },
    "hide": {
      "description": "Hides the alert",
      "params": []
    },
    "toggle": {
      "description": "Toggles visibility",
      "params": []
    },
    "dismiss": {
      "description": "Dismisses and removes the alert with animation",
      "params": [],
      "returns": "Promise"
    }
  },
  
  "$cssAPI": {
    "--wb-alert-padding": {
      "default": "1rem",
      "description": "Internal padding"
    },
    "--wb-alert-radius": {
      "default": "4px",
      "description": "Border radius"
    },
    "--wb-alert-icon-size": {
      "default": "1.25rem",
      "description": "Icon font size"
    },
    "--wb-alert-info-bg": {
      "default": "#e3f2fd",
      "description": "Info variant background"
    },
    "--wb-alert-success-bg": {
      "default": "#e8f5e9",
      "description": "Success variant background"
    },
    "--wb-alert-warning-bg": {
      "default": "#fff3e0",
      "description": "Warning variant background"
    },
    "--wb-alert-error-bg": {
      "default": "#ffebee",
      "description": "Error variant background"
    }
  },
  
  "test": {
    "setup": [
      "<wb-alert message=\"Test alert\"></wb-alert>",
      "<div x-behavior=\"alert\" message=\"Test\"></div>"
    ],
    "matrix": {
      "combinations": [
        { "variant": "info", "message": "Info message" },
        { "variant": "success", "message": "Success!" },
        { "variant": "warning", "title": "Warning", "message": "Be careful" },
        { "variant": "error", "message": "Error", "dismissible": true }
      ]
    }
  },
  
  "_metadata": {
    "category": "feedback",
    "icon": "🔔",
    "since": "1.0.0"
  }
}
```

---

## Test Configuration

The `test` section defines how the component is tested, including setup HTML and the permutation matrix.

```json
{
  "test": {
    "setup": [
      "<wb-alert message=\"Test alert\"></wb-alert>"
    ],
    "matrix": {
      "combinations": [
        { "variant": "info", "message": "Info message" },
        { "variant": "success", "message": "Success!" },
        { "variant": "warning", "title": "Warning", "message": "Be careful" },
        { "variant": "error", "message": "Error", "dismissible": true }
      ]
    }
  }
}
```

### Test Fields

| Field | Type | Description |
|-------|------|-------------|
| `setup` | array | HTML strings used to instantiate the component for testing |
| `matrix.combinations` | array | Array of attribute objects — each is one test permutation |

### Test Coverage Requirements

`test.matrix.combinations` is the **single source of truth** for what permutations are tested. The permutation engine validates completeness by comparing combinations against property constraints:

| Property Type | Expected Boundary Coverage |
|---------------|---------------------------|
| `enum` | Every enum value must appear in at least one combination |
| `boolean` | Both `true` and `false` must appear across combinations |
| `number`/`integer` with `minimum` + `maximum` | `minimum`, `default`, midpoint, and `maximum` must be covered |
| `number`/`integer` with only `minimum` or `maximum` | The defined bound + `default` must be covered |
| `string` (no enum) | `default` + at least one non-default value |

**Midpoint calculation:** For a property with `minimum: 0`, `maximum: 100`, `default: 50` — the midpoint is `(minimum + maximum) / 2 = 50`. If midpoint equals default, no extra test is needed. If they differ, both must be covered.

**Coverage gaps** are reported by the permutation engine, not silently ignored. Missing boundary coverage is a test deficiency, not a schema error.

---

## Migration Guide

### From Old Format (compliance)

**Before:**
```json
{
  "compliance": {
    "baseClass": "wb-alert",
    "requiredChildren": {
      ".wb-alert__content": {}
    },
    "optionalChildren": {
      ".wb-alert__icon": {},
      ".wb-alert__close": { "createdWhen": "dismissible=true" }
    }
  }
}
```

**After:**
```json
{
  "baseClass": "wb-alert",
  "$view": [
    { "name": "content", "tag": "div", "required": true },
    { "name": "icon", "tag": "span", "content": "{{icon}}", "createdWhen": "icon" },
    { "name": "close", "tag": "button", "content": "✕", "createdWhen": "dismissible" }
  ]
}
```

### Checklist

- [ ] Move `baseClass` to top level
- [ ] Convert `requiredChildren` → `$view` items with `"required": true`
- [ ] Convert `optionalChildren` → `$view` items with `"createdWhen"`
- [ ] Rename `type` → `variant` in properties
- [ ] Add `$methods` (show, hide, toggle, update)
- [ ] Add `$cssAPI` for customization points
- [ ] Mark internal parts as `"public": false`
- [ ] Use lowercase HTML tags

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│  SCHEMA STRUCTURE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  properties     →  Model      →  Data inputs (attributes)  │
│  $view          →  View       →  DOM structure             │
│  $methods       →  ViewModel  →  Callable functions        │
│  $cssAPI        →  Theme API  →  CSS custom properties     │
│                                                            │
├─────────────────────────────────────────────────────────────┤
│  PUBLIC vs PRIVATE                                         │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  public: true   →  .wb-card__header   →  Stable, documented │
│  public: false  →  .wb-card__-wrapper →  Internal, may change│
│                                                            │
├─────────────────────────────────────────────────────────────┤
│  CREATION LOGIC                                            │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  required: true        →  Always created                   │
│  createdWhen: "prop"   →  If prop is truthy                │
│  createdWhen: "A OR B" →  If A or B is truthy              │
│  (neither)             →  If content has value             │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Status

**All 54 component schemas have been converted to v3.0 format.**

| Category | Count | Schemas |
|----------|-------|--------|
| Cards | 20 | card, cardprofile, cardhero, cardimage, cardpricing, cardstats, cardtestimonial, cardhorizontal, cardlink, cardnotification, cardoverlay, cardproduct, cardvideo, cardbutton, cardexpandable, cardfile, cardportfolio, cardminimizable, carddraggable |
| Forms | 6 | button, input, checkbox, select, switch, textarea |
| Feedback | 10 | alert, badge, progress, toast, tooltip, avatar, spinner, skeleton, rating, chip |
| Overlay | 3 | dialog, drawer, dropdown |
| Navigation | 2 | navbar, tabs |
| Layout | 7 | details, sticky, scrollalong, drawerLayout, header, footer, table |
| Effects | 4 | ripple, confetti, fireworks, snow |
| Media | 1 | audio |
| Utility | 1 | notes |

### v3.0 Features Applied

All schemas now include:

- ✅ `$view` array with parent-child relationships
- ✅ `$methods` object with callable functions
- ✅ `$cssAPI` object with CSS custom properties
- ✅ `semanticElement` with HTML5 tag and implicit role
- ✅ `public`/`private` part designation
- ✅ `createdWhen` conditional creation logic
- ✅ Lowercase HTML tags (HTML5 standard)
- ✅ Accessibility attributes documented
- ✅ Events with `wb:*` namespace
- ✅ `_metadata` for categorization

---

*Document maintained by Cielo Vista Software*  
*Last updated: 2026-01-05*
