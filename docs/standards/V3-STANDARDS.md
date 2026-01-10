# WB Framework v3.0 Standards

## Overview

WB v3.0 uses **custom elements** (`<wb-*>`) instead of the legacy `data-wb` attribute pattern.

---

## Naming Conventions

### Components: `<wb-componentname>`

All components use the `wb-` prefix as custom element tags:

```html
<!-- v3.0 Syntax -->
<wb-card title="Hello">Content</wb-card>
<wb-modal id="my-modal">...</wb-modal>
<wb-badge variant="success">New</wb-badge>
<wb-cardhero title="Welcome" xalign="center"></wb-cardhero>
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
<wb-card title="Hello" variant="glass" hoverable>

<!-- WRONG: Don't use data- prefix -->
<wb-card data-title="Hello" data-variant="glass">
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

export function card(element, options) { /* base card */ }
export function cardhero(element, options) { /* hero variant */ }
export function cardimage(element, options) { /* image variant */ }
export function cardglass(element, options) { /* glass variant */ }
export function cardprofile(element, options) { /* profile variant */ }
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
<div data-wb="card" data-title="Hello" data-variant="glass">
  Content here
</div>

<button data-wb="ripple">Click me</button>

<div data-wb="cardhero" 
     data-title="Welcome" 
     data-align="center"
     data-background="url(bg.jpg)">
</div>
```

### After (v3.0)
```html
<wb-card title="Hello" variant="glass">
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
│  data-title="Hello"     ✗ WRONG (legacy)                │
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
