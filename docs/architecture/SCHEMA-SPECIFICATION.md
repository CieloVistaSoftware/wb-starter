# WB Schema Specification v3.0

**Version:** 3.0  
**Created:** 2026-01-05  
**Status:** Active

---

## Table of Contents

- [Golden Rule](#golden-rule)
- [Schema Structure](#schema-structure)
- [Properties (Model)](#properties-model)
- [$view (View)](#view-view)
- [$methods (ViewModel)](#methods-viewmodel)
- [$cssAPI (CSS Custom Properties)](#cssapi-css-custom-properties)
- [Public vs Private Parts](#public-vs-private-parts)
- [Complete Example](#complete-example)
- [Migration Guide](#migration-guide)

---

## Golden Rule

> **Attribute name = what it is for**  
> **Schema = where it goes**

Users provide simple attribute values. The schema defines how those values become DOM structure. **Users should never need to know component internals.**

```html
<!-- ✅ CLEAN: User just sets values -->
<wb-hero title="Explore" subtitle="Your journey" cta="Launch"></wb-hero>

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

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `"string"`, `"boolean"`, `"number"`, `"array"`, `"object"` |
| `description` | string | Human-readable description (for docs/IDE) |
| `default` | any | Default value if not provided |
| `enum` | array | Valid values (for dropdowns) |
| `appliesClass` | string | CSS class applied when truthy |
| `required` | boolean | Is this attribute required? |

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
  <header class="wb-card__header">        <!-- Public: stable -->
    <h3 class="wb-card__title">Hello</h3> <!-- Public: stable -->
  </header>
  <div class="wb-card__-layout">          <!-- Private: may change -->
    ...
  </div>
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
      "description": "Alert title"
    },
    "message": {
      "type": "string",
      "description": "Alert message content"
    },
    "icon": {
      "type": "string",
      "description": "Icon (emoji or icon name)"
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
      "<div data-wb=\"alert\" data-message=\"Test\"></div>"
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
