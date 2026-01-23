# WB Behaviors v3.0 - Behavior System
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/WB_BEHAVIOR_SYSTEM.md)

> **Version:** 3.0.0  
> **Last Updated:** 2026-01-20  
> **Architecture:** Schema-Driven MVVM, Light DOM Only

---

## Table of Contents

1. [Overview](#overview)
2. [Key Concepts: Components vs Behaviors](#key-concepts-components-vs-behaviors)
3. [Component System (`<wb-*>` Tags)](#component-system-wb--tags)
4. [Behavior System (`x-*` Attributes)](#behavior-system-x--attributes)
5. [Schema-Driven Architecture](#schema-driven-architecture)
6. [The WB.init() Pipeline](#the-wbinit-pipeline)
7. [Creating Custom Behaviors](#creating-custom-behaviors)
8. [Creating Custom Components](#creating-custom-components)
9. [Best Practices](#best-practices)
10. [Migration from v2.x](#migration-from-v2x)

---

## Overview

WB Framework v3.0 is a **schema-driven, Light DOM** architecture for building web applications. It provides two complementary systems:

| System | Syntax | Purpose |
|--------|--------|---------|
| **Components** | `<wb-card>`, `<wb-modal>` | Create new DOM structures |
| **Behaviors** | `x-ripple`, `x-tooltip` | Enhance existing elements |

**Key Principles:**
- 🏗️ **Light DOM Only** - No Shadow DOM, CSS works naturally
- 📋 **Schema-First** - JSON schemas define component structure
- 🔧 **Progressive Enhancement** - Start with semantic HTML
- 📦 **No Build Required** - Pure ESM, runs in browser

---

## Key Concepts: Components vs Behaviors

### Components (`<wb-*>`)

Components **create new DOM structures** from schemas:

```html
<!-- User writes: -->
<wb-card title="Hello World" elevated>
  <p>Card content here.</p>
</wb-card>

<!-- DOM becomes: -->
<wb-card title="Hello World" elevated class="wb-card wb-card--elevated">
  <header class="wb-card__header">
    <h3 class="wb-card__title">Hello World</h3>
  </header>
  <main class="wb-card__main">
    <p>Card content here.</p>
  </main>
</wb-card>
```

### Behaviors (`x-*`)

Behaviors **enhance existing elements** without changing structure:

```html
<!-- User writes: -->
<button x-ripple x-tooltip="Click to save">Save</button>

<!-- Same button, now with ripple effect and tooltip behavior -->
<button x-ripple x-tooltip="Click to save" class="wb-button" data-wb-ready="ripple tooltip">
  Save
</button>
```

### When to Use Which

| Use Case | Solution |
|----------|----------|
| Need new DOM structure | Component (`<wb-card>`) |
| Enhance native element | Behavior (`x-ripple`) |
| Add interactivity to existing HTML | Behavior |
| Create reusable UI patterns | Component |
| Progressive enhancement | Behavior |

---

## Component System (`<wb-*>` Tags)

### How Components Work

1. **User declares** a custom element: `<wb-card title="Hi">`
2. **Schema Builder** loads the component's JSON schema
3. **$view rules** generate the internal DOM structure
4. **Viewmodel** adds interactivity and API methods
5. **CSS auto-loads** from `/src/styles/components/`

### Component Declaration

```html
<!-- Basic component -->
<wb-card title="My Card">
  <p>Content goes here</p>
</wb-card>

<!-- With attributes -->
<wb-card 
  title="Premium Plan" 
  subtitle="Best value"
  variant="glass"
  elevated
  badge="Popular">
  <p>Feature list...</p>
</wb-card>

<!-- Nested components -->
<wb-card title="Dashboard">
  <wb-stats value="1,234" label="Users" icon="👥"></wb-stats>
  <wb-stats value="$45K" label="Revenue" icon="💰"></wb-stats>
</wb-card>
```

### Available Components (41+)

| Category | Components |
|----------|------------|
| **Cards** | card, cardimage, cardvideo, cardhero, cardprofile, cardpricing, cardstats, cardtestimonial, cardproduct, cardnotification, cardfile, cardlink, cardhorizontal, cardoverlay, cardexpandable, cardminimizable, carddraggable, cardportfolio |
| **Feedback** | badge, toast, progress, spinner, avatar, skeleton |
| **Navigation** | tabs, accordion, breadcrumb, pagination, steps, navbar |
| **Overlays** | modal, drawer, lightbox, popover, confirm |
| **Forms** | input, select, checkbox, radio, switch, rating |
| **Media** | gallery, youtube, audio, video |
| **Layout** | grid, stack, cluster, row, column |

---

## Behavior System (`x-*` Attributes)

### How Behaviors Work

1. **User adds** `x-{behavior}` attribute to any element
2. **WB.scan()** detects the attribute during initialization
3. **Behavior function** enhances the element in place
4. **Cleanup function** is stored for later removal

### Behavior Declaration

```html
<!-- Single behavior -->
<button x-ripple>Click Me</button>

<!-- Multiple behaviors -->
<button x-ripple x-tooltip="Save changes">Save</button>

<!-- Behavior with config value -->
<div x-tooltip="Hello world">Hover me</div>

<!-- Morph syntax (x-as-*) for layout transformation -->
<div x-as-card>This div behaves like a card</div>
```

### Auto-Injection

Certain semantic HTML elements receive behaviors automatically:

```html
<!-- These get behaviors automatically when autoInject is enabled -->
<button>Automatically gets button behavior</button>
<form>Automatically gets form behavior</form>
<img src="..." alt="...">  <!-- Gets image behavior -->
<code>const x = 1;</code>  <!-- Gets code highlighting -->
<pre>...</pre>              <!-- Gets pre formatting -->
```

**Opt-out** with `x-ignore`:

```html
<button x-ignore>No automatic behavior</button>
```

### Available Behaviors

| Category | Behaviors |
|----------|-----------|
| **Interaction** | ripple, tooltip, popover, dropdown, clipboard |
| **Animation** | fade, slide, shake, bounce |
| **Form** | validate, mask, autocomplete |
| **Media** | lazy, zoomable, lightbox |
| **Semantic** | code, pre, kbd, mark, table, details |

---

## Schema-Driven Architecture

### Schema Location

All component schemas live in `/src/wb-models/*.schema.json`

### Schema Structure

```json
{
  "$component": "card",
  "$tagName": "wb-card",
  "behavior": "card",
  "baseClass": "wb-card",
  
  "properties": {
    "title": { "type": "string", "description": "Card header text" },
    "elevated": { "type": "boolean", "default": false },
    "variant": { "enum": ["default", "glass", "bordered"] }
  },
  
  "$view": [
    { "name": "header", "tag": "header", "createdWhen": "title OR subtitle" },
    { "name": "title", "tag": "h3", "parent": "header", "content": "{{title}}" },
    { "name": "body", "tag": "main", "required": true, "content": "{{slot}}" }
  ],
  
  "$methods": {
    "show": { "description": "Shows the card" },
    "hide": { "description": "Hides the card" }
  },
  
  "$cssAPI": {
    "--wb-card-padding": "Internal padding",
    "--wb-card-radius": "Border radius"
  }
}
```

### $view Rules

| Property | Purpose | Example |
|----------|---------|---------|
| `name` | BEM element name | `"header"` → `.wb-card__header` |
| `tag` | HTML element | `"header"`, `"main"`, `"footer"` |
| `parent` | Nest inside another part | `"parent": "header"` |
| `content` | Template interpolation | `"{{title}}"` or `"{{slot}}"` |
| `createdWhen` | Conditional creation | `"title OR subtitle"` |
| `required` | Always create | `true` |

---

## The WB.init() Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     WB.init() Called                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Load Schemas from /src/wb-models/*.schema.json         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. WB.scan() - Process existing DOM                       │
│     • Find <wb-*> elements → Process through Schema Builder │
│     • Find [x-*] attributes → Inject behaviors             │
│     • Auto-inject semantic elements (if enabled)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. WB.observe() - Watch for new elements                  │
│     • MutationObserver tracks childList + attributes       │
│     • New wb-* elements processed through schema builder   │
│     • New x-* attributes trigger behavior injection        │
└─────────────────────────────────────────────────────────────┘
```

### Initialization Options

```javascript
import WB from './src/core/wb.js';

WB.init({
  scan: true,           // Scan existing elements
  observe: true,        // Watch for new elements
  theme: 'dark',        // Set theme
  debug: false,         // Debug logging
  autoInject: false,    // Auto-inject semantic behaviors
  prefix: 'x',          // Attribute prefix (x-ripple)
  useSchemas: true,     // Enable schema processing
  schemaPath: '/src/wb-models'  // Schema location
});
```

---

## Creating Custom Behaviors

### Behavior Anatomy

```javascript
// src/wb-viewmodels/my-behavior.js

/**
 * MyBehavior - Description of what this behavior does
 * Usage: <element x-mybehavior="config">
 */
export function mybehavior(element, options = {}) {
  // 1. Merge config from options + data attributes
  const config = {
    color: options.color || element.dataset.color || 'blue',
    speed: options.speed || element.dataset.speed || '300ms',
    ...options
  };

  // 2. Add identifying class
  element.classList.add('wb-mybehavior');

  // 3. Implement the behavior
  element.style.transition = `all ${config.speed}`;
  
  // 4. Add event listeners
  const handleClick = () => {
    element.style.color = config.color;
  };
  element.addEventListener('click', handleClick);

  // 5. Attach API (optional)
  element.wbMyBehavior = {
    setColor: (color) => { element.style.color = color; },
    reset: () => { element.style.color = ''; }
  };

  // 6. Mark as ready
  element.dataset.wbReady = (element.dataset.wbReady || '') + ' mybehavior';

  // 7. Return cleanup function (REQUIRED)
  return () => {
    element.classList.remove('wb-mybehavior');
    element.removeEventListener('click', handleClick);
    delete element.wbMyBehavior;
  };
}

export default { mybehavior };
```

### Register the Behavior

```javascript
// src/wb-viewmodels/index.js
import { mybehavior } from './my-behavior.js';

export const behaviors = {
  // ... existing behaviors ...
  mybehavior,
};
```

### Use in HTML

```html
<div x-mybehavior data-color="red" data-speed="500ms">
  Click me to change color
</div>
```

---

## Creating Custom Components

### Step 1: Create Schema

```json
// src/wb-models/mycomponent.schema.json
{
  "$component": "mycomponent",
  "$tagName": "wb-mycomponent",
  "behavior": "mycomponent",
  "baseClass": "wb-mycomponent",
  
  "properties": {
    "title": { "type": "string", "required": true },
    "icon": { "type": "string", "default": "⭐" }
  },
  
  "$view": [
    { "name": "icon", "tag": "span", "content": "{{icon}}" },
    { "name": "title", "tag": "h3", "content": "{{title}}" },
    { "name": "body", "tag": "main", "content": "{{slot}}", "required": true }
  ]
}
```

### Step 2: Create Viewmodel

```javascript
// src/wb-viewmodels/mycomponent.js

export function mycomponent(element, options = {}) {
  const config = {
    title: options.title || element.getAttribute('title') || '',
    icon: options.icon || element.getAttribute('icon') || '⭐',
    ...options
  };

  // Schema Builder already created the DOM structure
  // We just add interactivity here
  
  element.classList.add('wb-mycomponent');
  
  // Find schema-built elements
  const titleEl = element.querySelector('.wb-mycomponent__title');
  const iconEl = element.querySelector('.wb-mycomponent__icon');
  
  // Add interactivity
  if (iconEl) {
    iconEl.style.cursor = 'pointer';
    iconEl.addEventListener('click', () => {
      element.dispatchEvent(new CustomEvent('wb:mycomponent:iconclick', {
        bubbles: true,
        detail: { icon: config.icon }
      }));
    });
  }

  // API
  element.wbMyComponent = {
    setTitle: (text) => { if (titleEl) titleEl.textContent = text; },
    setIcon: (icon) => { if (iconEl) iconEl.textContent = icon; }
  };

  element.dataset.wbReady = 'mycomponent';

  return () => {
    element.classList.remove('wb-mycomponent');
    delete element.wbMyComponent;
  };
}
```

### Step 3: Create CSS

```css
/* src/styles/components/mycomponent.css */
.wb-mycomponent {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  padding: var(--space-md, 1rem);
  background: var(--bg-secondary);
  border-radius: var(--radius-md, 8px);
}

.wb-mycomponent__icon {
  font-size: 1.5rem;
}

.wb-mycomponent__title {
  margin: 0;
  color: var(--text-primary);
}

.wb-mycomponent__body {
  flex: 1;
  color: var(--text-secondary);
}
```

### Step 4: Register in Index

```javascript
// src/wb-viewmodels/index.js
import { mycomponent } from './mycomponent.js';

export const behaviors = {
  // ... existing ...
  mycomponent,
};
```

---

## Best Practices

### 1. Always Return Cleanup Functions

```javascript
// ✅ Good
export function mybehavior(element) {
  const handler = () => console.log('clicked');
  element.addEventListener('click', handler);
  
  return () => {
    element.removeEventListener('click', handler);
  };
}

// ❌ Bad - Memory leak
export function mybehavior(element) {
  element.addEventListener('click', () => console.log('clicked'));
  // No cleanup!
}
```

### 2. Use BEM Class Naming

```javascript
// ✅ Good
element.classList.add('wb-card');
element.classList.add('wb-card--elevated');
element.classList.add('wb-card__header');

// ❌ Bad
element.classList.add('card');
element.classList.add('elevated');
```

### 3. Prefer Attributes Over Slots

```html
<!-- ✅ Good - Clean attribute API -->
<wb-card title="Hello" subtitle="World">
  <p>Content</p>
</wb-card>

<!-- ❌ Avoid - Forces users to know internals -->
<wb-card>
  <h3 slot="title">Hello</h3>
  <p slot="subtitle">World</p>
  <p>Content</p>
</wb-card>
```

### 4. Use Light DOM Only

```javascript
// ✅ Good - Light DOM
const header = document.createElement('header');
header.className = 'wb-card__header';
element.appendChild(header);

// ❌ Never use Shadow DOM
const shadow = element.attachShadow({ mode: 'open' }); // NO!
```

### 5. Mark Elements as Ready

```javascript
// ✅ Good - Track applied behaviors
element.dataset.wbReady = (element.dataset.wbReady || '') + ' mybehavior';

// Check if already applied
if (element.dataset.wbReady?.includes('mybehavior')) {
  return; // Already initialized
}
```

---

## Migration from v2.x

### ⚠️ Breaking Changes

| v2.x Syntax | v3.0 Syntax | Notes |
|-------------|-------------|-------|
| `data-wb="card"` | `<wb-card>` | Use custom elements |
| `data-wb="ripple"` | `x-ripple` | Use `x-*` prefix |
| `WBBaseComponent` | Direct HTMLElement | No base class |
| Shadow DOM | Light DOM | No encapsulation |
| Manual DOM | Schema `$view` | Declarative structure |

### Migration Examples

```html
<!-- v2.x (deprecated) -->
<div data-wb="card" data-title="Hello">Content</div>

<!-- v3.0 -->
<wb-card title="Hello">Content</wb-card>
```

```html
<!-- v2.x (deprecated) -->
<button data-wb="ripple tooltip" data-tooltip="Click me">Save</button>

<!-- v3.0 -->
<button x-ripple x-tooltip="Click me">Save</button>
```

### Legacy Detection

v3.0 will **log errors** when detecting `data-wb` usage:

```
[WB] Legacy syntax data-wb="card" detected on <div>. Please use <wb-card> instead.
```

---

## Related Documentation

- **[MVVM Migration Guide](./plans/MVVM-MIGRATION.md)** - Full v3.0 architecture details
- **[Behaviors Reference](./behaviors-reference.md)** - All available behaviors
- **[Component Schemas](../src/wb-models/)** - JSON schema definitions
- **[CSS Standards](./css-standards.md)** - Styling guidelines

---

**Last Updated:** 2026-01-20 | **Version:** 3.0.0
