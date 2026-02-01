# WB Builder - The Heart of the Framework

## Overview

The WB Builder is the architectural core of wb-starter v3.0. It represents a paradigm shift from traditional web component development to a **declarative, schema-driven approach** that eliminates build steps while maintaining enterprise-grade functionality.

## Core Philosophy

### Zero-Build Architecture

Unlike frameworks that require webpack, vite, or other bundlers, WB Builder works directly in the browser:

```html
<!-- This just works. No compilation needed. -->
<wb-card title="Hello World" elevated>
  <p>Your content here</p>
</wb-card>
```

### Light DOM Only

wb-starter uses Light DOM exclusively. This means:
- **CSS works naturally** - No piercing shadow boundaries
- **JavaScript access** - Query selectors work as expected
- **Accessibility** - Screen readers see real DOM structure
- **Debugging** - DevTools show actual elements

### Schema-First Development

Every component is defined by a JSON schema that describes:
- **Attributes** - What data the component accepts
- **View** - How the DOM structure is generated
- **CSS API** - What custom properties can style it
- **Methods** - What actions the component exposes

## Architecture Layers

### Layer 1: Schemas (`src/wb-models/*.schema.json`)

Schemas define the **contract** for each component:

```json
{
  "$component": "card",
  "$tagName": "wb-card",
  "$description": "A versatile card container",
  "$attributes": {
    "title": { "type": "string", "description": "Card header text" },
    "elevated": { "type": "boolean", "description": "Add shadow" }
  },
  "$view": {
    "tag": "article",
    "class": "wb-card",
    "children": [
      { "tag": "header", "class": "wb-card__header", "$if": "title" },
      { "tag": "div", "class": "wb-card__body", "$slot": true }
    ]
  }
}
```

### Layer 2: ViewModels (`src/wb-viewmodels/*.js`)

ViewModels contain the **behavior logic**:

```javascript
export function card(element, options = {}) {
  // Apply interactive behaviors
  // Handle events
  // Manage state
  return () => { /* cleanup */ };
}
```

### Layer 3: Styles (`src/styles/components/*.css`)

Component-specific CSS using **CSS Custom Properties**:

```css
.wb-card {
  --wb-card-padding: 1.5rem;
  --wb-card-radius: 8px;
  --wb-card-bg: var(--bg-secondary);
  
  padding: var(--wb-card-padding);
  border-radius: var(--wb-card-radius);
  background: var(--wb-card-bg);
}
```

## The Builder Pipeline

When you write `<wb-card>`, here's what happens:

```
1. HTML Parser sees <wb-card>
   ↓
2. WB.init() scans for wb-* elements
   ↓
3. Schema Builder loads card.schema.json
   ↓
4. DOM is generated from $view definition
   ↓
5. Attributes are bound to element properties
   ↓
6. Behavior function (card.js) is called
   ↓
7. CSS auto-loads from /src/styles/components/card.css
   ↓
8. Component is ready to use
```

## Behavior System

Beyond components, WB provides **170+ behaviors** that enhance any HTML element:

```html
<!-- Add ripple effect to any element -->
<button x-ripple>Click Me</button>

<!-- Make any element draggable -->
<div x-draggable>Move me around</div>

<!-- Add tooltip to anything -->
<span x-tooltip="Hello!">Hover me</span>

<!-- Animate on scroll -->
<section x-fade-in>Content appears</section>
```

## Key Benefits

### For Developers
- **No build step** - Edit, save, refresh
- **Standard HTML** - Use existing knowledge
- **Incremental adoption** - Add behaviors one at a time
- **DevTools friendly** - Debug real DOM

### For AI Integration
- **Deterministic output** - Schemas produce consistent DOM
- **Self-documenting** - Schemas describe capabilities
- **Predictable structure** - AI can generate valid components

### For Performance
- **No VDOM overhead** - Direct DOM manipulation
- **Lazy loading** - Behaviors load on demand
- **Minimal footprint** - Only load what you use

## Getting Started

### 1. Include WB in your HTML

```html
<script type="module">
  import WB from './src/core/wb.js';
  WB.init();
</script>
```

### 2. Use Components

```html
<wb-card title="My First Card" elevated>
  <p>Welcome to wb-starter!</p>
</wb-card>
```

### 3. Add Behaviors

```html
<button class="btn" x-ripple x-tooltip="Save your work">
  💾 Save
</button>
```

### 4. Customize with CSS Variables

```css
:root {
  --wb-card-bg: #1a1a2e;
  --wb-card-radius: 16px;
}
```

## Advanced Usage

### Creating Custom Components

1. Create a schema: `src/wb-models/mywidget.schema.json`
2. Create a behavior: `src/wb-viewmodels/mywidget.js`
3. Register in `src/wb-viewmodels/index.js`
4. Use: `<wb-mywidget>`

### Composing Behaviors

```html
<!-- Multiple behaviors on one element -->
<div x-draggable x-resizable x-fade-in>
  A draggable, resizable, animated container
</div>
```

### Event Communication

```javascript
// Components communicate via pubsub
WB.pubsub.subscribe('card:selected', (data) => {
  console.log('Card selected:', data);
});
```

## The WB Difference

| Traditional | wb-starter |
|------------|--------------|
| npm install | Just include the script |
| webpack/vite config | Zero config |
| Shadow DOM isolation | Light DOM integration |
| Framework lock-in | Standard HTML |
| Build on every change | Edit and refresh |
| Complex state management | Simple data attributes |

## Philosophy Statement

> "The browser is already a component runtime. wb-starter embraces this reality instead of fighting it. We don't compile, transpile, or bundle - we enhance."

WB Builder represents our belief that modern web development has become unnecessarily complex. By leveraging native browser capabilities and a declarative schema system, we've created a framework that's both powerful and approachable.

**Welcome to the No-Build Revolution.**
