# WB-Starter v3.0 Standards

## Overview

WB v3.0 uses **custom elements** (`<wb-*>`) instead of the legacy `x-behavior` attribute pattern.

### Behaviors vs. Components

A **behavior** is just a plain JavaScript function — `(element, options) => cleanup` — that
attaches capability to an element already on the page. A **component** is the same kind of
function, except it also owns the element's DOM structure (it builds header/body/footer,
not just decorates what's there). Both are exported from `src/wb-viewmodels/*.js` and run
through the exact same dispatch path (`WB.inject()`); "component" and "behavior" describe
what the function *does* to the element, not two different mechanisms.

That function can attach to an element three different ways:

1. **`<wb-*>` custom element** — `<wb-card>`, `<wb-modal>`, `<wb-cardhero>`. The tag itself
   names the component; the element owns its DOM structure.
2. **`x-*` attribute** — `<button x-ripple>`, `<span x-tooltip="Hint">`. An explicit opt-in
   that enhances an element you didn't have to create specially — any existing tag can carry
   one.
3. **Plain semantic HTML, no attribute at all** — `<input>`, `<table sortable>`,
   `<details>`. WB.scan() recognizes the *tag itself* and attaches the matching behavior
   automatically. See **Autoinject**, below.

### Properties without an `x-` prefix

Once a behavior is attached (by any of the three paths above), the *configuration*
attributes it reads are plain, clean names — never `x-`-prefixed, never `data-`-prefixed
(`data-*` is accepted as a fallback for back-compat, but the bare name is canonical). This
trips people up on the semantic/autoinject elements especially, since there's no `x-`
anywhere on the tag to signal "this attribute is special." The confirmed set, by element:

| Element | Bare attributes |
|---|---|
| `<input>` | `variant`, `prefix`, `suffix`, `clearable` |
| `<select>` | `clearable` |
| `<textarea>` | `autosize`, `show-count`, `max-length`, `max-rows`, `min-rows`, `size` |
| `<button>` | `variant`, `size`, `icon`, `icon-position`, `loading` |
| `<table>` | `sortable`, `searchable`, `selectable`, `striped`, `hover`, `bordered`, `compact`, `copyable` |
| `<details>` | `summary`, `open` |
| `<dialog>` | `title`, `content`, `size`, `modal-title`, `modal-content`, `modal-size`, `slot` |
| `<progress>` | `value`, `max`, `label`, `variant`, `size`, `indeterminate`, `show-value`, `show-label`, `striped`, `animated` |
| `<img>` | `zoomable`, `lazy`, `aspect-ratio`, `fallback`, `placeholder` |
| `<figure>` | `zoom`, `lightbox`, `caption`, `caption-position` |
| `<video>` | `src`, `controls`, `poster`, `playsinline`, `autoplay`, `loop`, `muted` |
| `<form>` | `ajax`, `validate` |
| `<label>` (used as `x-label` on another element) | `label-position`, `required`, `optional` |
| `<wb-*>` components generally | `title`, `subtitle`, `variant`, `xalign`, `yalign`, `hoverable`, `clickable`, `icon` (see Property Reference below) |

### Autoinject

Autoinject is what lets `<input>`, `<table sortable>`, and friends work with **zero** special
attributes. `src/core/tag-map.js` exports a `nativeMap` — a lookup from plain tag name (or a
more specific selector like `input[type="checkbox"]`) straight to a behavior name:

```javascript
export const nativeMap = {
  'input[type="checkbox"]': 'checkbox',
  'input[type="radio"]': 'radio',
  'input[type="range"]': 'range',
  'input': 'input',
  'select': 'select',
  'textarea': 'textarea',
  'button': 'button',
  'form': 'form',
  'fieldset': 'fieldset',
  'label': 'label',
  'article': 'card',
  'img': 'image',
  'video': 'video',
  'audio': 'audio',
  'figure': 'figure',
  'code': 'code',
  'pre': 'pre',
  'kbd': 'kbd',
  'mark': 'mark',
  'table': 'table',
  'details': 'details',
  'dialog': 'dialog',
  'progress': 'progress',
  'header': 'header',
  'footer': 'footer'
};
```

When `WB.scan()` walks the DOM (both `wb.js` and `wb-lazy.js` implement this), every element
it finds is checked against `nativeMap` by tag name first. A match runs that behavior with no
attribute required at all — `<input>` alone gets the `input()` behavior; `<table sortable>`
gets `table()`. Two rules keep this from misfiring:

- **Order matters.** `getNativeBehavior()` returns on the first selector match, so the
  specific `input[type="checkbox"]`/`[type="radio"]`/`[type="range"]` entries are checked
  *before* the generic `'input': 'input'` fallback — a checkbox still gets `checkbox()`, not
  the generic input wrapper.
- **Opt-in behaviors always win.** If an element already carries a *different*, more specific
  `x-{behavior}` attribute (`x-password`, `x-search`, `x-autocomplete`, …), autoinject skips
  its generic fallback entirely — you never get both the generic `input()` wrapper and the
  explicit one double-applied to the same element.

Autoinject only fires when `WB.init({ autoInject: true })` — the default — is used; passing
`autoInject: false` disables it and every element needs an explicit `x-*` attribute or
`wb-*` tag instead.

Every demo and `.md` doc in this project follows
[Demos & Documentation Standards](./DEMOS-AND-DOCS-STANDARDS.md) when showing any of the
above in action — live `<wb-demo>` blocks (not static code fences), one code sample per
rendered element, vertical/highlighted code with no horizontal scrollbars, themed Markdown,
composition over inheritance, mobile-first.

---

## Naming Conventions

### Components: `<wb-componentname>`

All components use the `wb-` prefix as custom element tags:

```html
<!-- v3.0 Syntax -->
<wb-card title="Hello">Content</wb-card>
<wb-modal id="my-modal">...</wb-modal>
<wb-badge variant="success">New</wb-badge>
<wb-cardhero
  title="Welcome"
  xalign="center">
</wb-cardhero>
```

### Behaviors: `x-behaviorname`

Behaviors (enhancements to existing elements) use the `x-` prefix as attributes:

```html
<!-- v3.0 Syntax -->
<button x-ripple>Click me</button>
<span x-tooltip="Helpful tip">Hover me</span>
<div x-animate="fadeIn">Animated</div>
<nav x-sticky>Sticky nav</nav>
```

### Properties: Clean Names (NO prefix)

Properties on custom elements use **clean attribute names** - no `data-` or `x-` prefix:

```html
<!-- CORRECT: Clean property names -->
<wb-card
  title="Hello"
  variant="glass"
  hoverable>
  <!-- WRONG: Don't use data- prefix -->
  <wb-card
    title="Hello"
    variant="glass">
```

---

## Property Reference

| Property | Type | Values | Description |
|----------|------|--------|-------------|
| `title` | string | any | Title text |
| `subtitle` | string | any | Subtitle text |
| `variant` | string | `default`, `glass`, `float`, etc. | Visual style variant |
| `xalign` | string | `left`, `center`, `right` | Horizontal alignment |
| `yalign` | string | `top`, `middle`, `bottom` | Vertical alignment |
| `hoverable` | boolean | present/absent | Enable hover effect |
| `clickable` | boolean | present/absent | Enable click behavior |
| `icon` | string | emoji or icon class | Icon to display |

---

## File Structure

### 1. Schema Files: `src/wb-models/{name}.schema.json`

Each component has a schema that defines its properties and DOM structure:

```
src/wb-models/
├── card.schema.json        → <wb-card>
├── cardhero.schema.json    → <wb-cardhero>
├── cardimage.schema.json   → <wb-cardimage>
├── modal.schema.json       → <wb-modal>
├── badge.schema.json       → <wb-badge>
└── index.json              → Schema registry
```

### 2. Behavior Files: `src/wb-viewmodels/{name}.js`

JavaScript behavior functions that add interactivity:

```
src/wb-viewmodels/
├── card.js       → exports: card, cardhero, cardimage, etc.
├── modal.js      → exports: modal
├── badge.js      → exports: badge
└── index.js      → Behavior registry
```

### 3. Style Files: `src/styles/components/{name}.css`

Component-specific CSS:

```
src/styles/components/
├── card.css
├── modal.css
├── badge.css
└── ...
```

---

## JavaScript API

### Behavior Function Signature

```javascript
// src/wb-viewmodels/card.js

/**
 * Card component behavior
 * @param {HTMLElement} element - The <wb-card> element
 * @param {Object} options - Configuration from attributes
 */
export function card(element, options = {}) {
  const config = {
    title: element.getAttribute('title') || options.title || '',
    variant: element.getAttribute('variant') || options.variant || 'default',
    xalign: element.getAttribute('xalign') || options.xalign || 'left',
    hoverable: element.hasAttribute('hoverable'),
    clickable: element.hasAttribute('clickable'),
    ...options
  };
  
  // Apply base class
  element.classList.add('wb-card');
  
  // Apply variant class
  if (config.variant !== 'default') {
    element.classList.add(`wb-card--${config.variant}`);
  }
  
  // Apply alignment
  if (config.xalign !== 'left') {
    element.classList.add(`wb-card--xalign-${config.xalign}`);
  }
  
  // Build DOM structure if needed
  // ...
  
  // Return API
  return {
    show: () => element.hidden = false,
    hide: () => element.hidden = true,
    toggle: () => element.hidden = !element.hidden
  };
}
```

### Variant Functions

Each variant is a separate exported function:

```javascript
// src/wb-viewmodels/card.js

// base card
export function card(element, options) {}

// hero variant
export function cardhero(element, options) {}

// image variant
export function cardimage(element, options) {}

// glass variant
export function cardglass(element, options) {}

// profile variant
export function cardprofile(element, options) {}
```

### Creating Components Programmatically

```javascript
// Method 1: Using document.createElement
const card = document.createElement('wb-card');
card.setAttribute('title', 'My Card');
card.setAttribute('variant', 'glass');
card.textContent = 'Card content';
document.body.appendChild(card);

// WB.scan() will automatically process it
WB.scan();

// Method 2: Using WB.create (if available)
const card = WB.create('card', {
  title: 'My Card',
  variant: 'glass',
  content: 'Card content'
});
document.body.appendChild(card);
```

---

## Schema Structure

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "card.schema.json",
  "title": "Card",
  "description": "A flexible card component",
  
  "behavior": "card",
  "baseClass": "wb-card",
  
  "properties": {
    "title": {
      "type": "string",
      "description": "Card title"
    },
    "variant": {
      "type": "string",
      "enum": ["default", "glass", "float"],
      "default": "default",
      "appliesClass": "wb-card--{{value}}"
    },
    "xalign": {
      "type": "string",
      "enum": ["left", "center", "right"],
      "default": "left",
      "appliesClass": "wb-card--xalign-{{value}}"
    },
    "hoverable": {
      "type": "boolean",
      "default": false,
      "appliesClass": "wb-card--hoverable"
    }
  },
  
  "$view": [
    { "name": "header", "tag": "header", "class": "wb-card__header" },
    { "name": "title", "tag": "h3", "class": "wb-card__title", "parent": "header" },
    { "name": "body", "tag": "div", "class": "wb-card__body" }
  ],
  
  "$methods": {
    "show": { "description": "Shows the card" },
    "hide": { "description": "Hides the card" },
    "toggle": { "description": "Toggles visibility" }
  },
  
  "$cssAPI": {
    "--wb-card-padding": { "default": "1rem", "description": "Card padding" },
    "--wb-card-radius": { "default": "8px", "description": "Border radius" },
    "--wb-card-shadow": { "default": "0 2px 8px rgba(0,0,0,0.1)", "description": "Box shadow" }
  }
}
```

---

## CSS Class Naming (BEM)

| Component | Base Class | Modifier | Element |
|-----------|------------|----------|---------|
| `<wb-card>` | `.wb-card` | `.wb-card--glass` | `.wb-card__header` |
| `<wb-modal>` | `.wb-modal` | `.wb-modal--lg` | `.wb-modal__title` |
| `<wb-badge>` | `.wb-badge` | `.wb-badge--success` | `.wb-badge__icon` |

---

## Migration Guide

### Before (Legacy v2)
```html
<div
  x-card
  title="Hello"
  variant="glass">
  Content here
</div>
<button x-ripple>Click me</button>
<div
  x-cardhero
  title="Welcome"
  align="center"
  background="url(bg.jpg)">
</div>
```

### After (v3.0)
```html
<wb-card
  title="Hello"
  variant="glass">
  Content here
</wb-card>
<button x-ripple>Click me</button>
<wb-cardhero
  title="Welcome"
  xalign="center"
  background="url(bg.jpg)">
</wb-cardhero>
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────┐
│  WB v3.0 SYNTAX CHEAT SHEET                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  COMPONENTS (custom elements)                           │
│  ─────────────────────────────                          │
│  <wb-card title="..." variant="glass">                  │
│  <wb-modal id="my-modal">                               │
│  <wb-badge variant="success">                           │
│  <wb-cardhero xalign="center">                          │
│                                                         │
│  BEHAVIORS (attribute on existing elements)             │
│  ─────────────────────────────────────────              │
│  <button x-ripple>                                      │
│  <span x-tooltip="Tip text">                            │
│  <div x-animate="fadeIn">                               │
│  <header x-sticky>                                      │
│                                                         │
│  PROPERTIES (clean names, no prefix)                    │
│  ─────────────────────────────────────                  │
│  title="Hello"          ✓ CORRECT                       │
│  variant="glass"        ✓ CORRECT                       │
│  xalign="center"        ✓ CORRECT                       │
│  title="Hello"     ✗ WRONG (legacy)                │
│                                                         │
│  ALIGNMENT                                              │
│  ─────────                                              │
│  xalign="left|center|right"  (horizontal ←→)           │
│  yalign="top|middle|bottom"  (vertical ↑↓)             │
│                                                         │
│  FILE STRUCTURE                                         │
│  ──────────────                                         │
│  Schema:   src/wb-models/{name}.schema.json             │
│  Behavior: src/wb-viewmodels/{name}.js                  │
│  Style:    src/styles/components/{name}.css             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Component vs Behavior Decision Tree

```
Is this creating new DOM structure?
├── YES → Use <wb-*> custom element
│         Examples: <wb-card>, <wb-modal>, <wb-badge>
│
└── NO → Is this enhancing an existing element?
         ├── YES → Use x-* attribute
         │         Examples: x-ripple, x-tooltip, x-sticky
         │
         └── NO → Use utility class
                  Examples: .wb-glass, .wb-gradient-text
```
