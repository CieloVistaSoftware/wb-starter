# wb-starter v3.0 - MVVM Architecture

## Overview

Web Behaviors (WB) starter v3.0 implements a **Schema-Driven MVVM Architecture** that eliminates the need for build steps while providing a robust, type-safe component system. This document describes the architecture, migration status, and implementation details.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER WRITES HTML                        │
├─────────────────────────────────────────────────────────────┤
│  <wb-card title="Hello">Content</wb-card>                  │
│                        OR                                   │
│  <button x-ripple>Click</button>  (behaviors)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    WB.init() Pipeline                       │
│  1. Load schemas from /src/wb-models/*.schema.json         │
│  2. Scan DOM for wb-* elements                             │
│  3. Process through Schema Builder                         │
│  4. Apply behaviors from wb-viewmodels                     │
│  5. Auto-load CSS from /src/styles/components              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MVVM LAYERS                              │
├─────────────────────────────────────────────────────────────┤
│  MODEL (properties in schema)                               │
│  - Type definitions, defaults, enums                       │
│  - Attribute → property mapping                            │
├─────────────────────────────────────────────────────────────┤
│  VIEW ($view in schema)                                     │
│  - DOM structure defined declaratively                     │
│  - Light DOM only - no Shadow DOM                          │
│  - BEM classes: {baseClass}__{name}                        │
├─────────────────────────────────────────────────────────────┤
│  VIEWMODEL (wb-viewmodels/*.js)                            │
│  - Behavior functions that enhance elements                │
│  - Event handlers, state management                        │
│  - $methods binding for callable APIs                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Light DOM Architecture

WB v3.0 uses **Light DOM exclusively**. No Shadow DOM.

**Benefits:**
- CSS works naturally (no piercing)
- DevTools show real DOM structure
- Screen readers understand content
- Query selectors work as expected

```html
<!-- User writes this -->
<wb-card title="Hello">Content</wb-card>

<!-- DOM becomes (Light DOM) -->
<wb-card title="Hello" class="wb-card">
  <header class="wb-card__header">
    <h3 class="wb-card__title">Hello</h3>
  </header>
  <main class="wb-card__body">Content</main>
</wb-card>
```

### 2. Schema-First Development

Every component is defined by a JSON schema that serves as the single source of truth:

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
    { "name": "header", "tag": "header", "createdWhen": "title" },
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

### 3. Golden Rule: Attributes Over Slots

> **Attribute name = what it is for**  
> **Schema = where it goes**

```html
<!-- ✅ CLEAN: User sets attributes -->
<wb-card title="Hello" subtitle="World" elevated>
  <p>Content here</p>
</wb-card>

<!-- ❌ DON'T: Force users to know internals -->
<wb-card>
  <h3 slot="title">Hello</h3>
  <p slot="subtitle">World</p>
  <p>Content here</p>
</wb-card>
```

### 4. Behaviors vs Components

| Type | Tag | Purpose | Example |
|------|-----|---------|---------|
| **Component** | `<wb-*>` | Creates new DOM structure | `<wb-card title="Hi">` |
| **Behavior** | `x-*` attribute | Enhances existing element | `<button x-ripple>` |

## File Structure

```
src/
├── core/
│   ├── wb.js                    # Main WB initialization
│   ├── mvvm/
│   │   └── schema-builder.js    # DOM generation from schemas
│   ├── config.js                # Global configuration
│   └── pubsub.js                # Event system
│
├── wb-models/                   # JSON Schemas (41+ components)
│   ├── card.schema.json
│   ├── cardimage.schema.json
│   ├── modal.schema.json
│   └── ...
│
├── wb-viewmodels/               # Behavior implementations
│   ├── index.js                 # Lazy-loading registry
│   ├── card.js                  # Card family behaviors
│   ├── feedback.js              # Badge, toast, progress, etc.
│   ├── navigation.js            # Navbar, tabs, pagination
│   ├── semantics/               # HTML5 semantic enhancements
│   │   ├── code.js              # <code> highlighting
│   │   ├── pre.js               # <pre> formatting
│   │   └── ...
│   └── ...
│
└── styles/
    ├── themes.css               # 23 theme definitions
    ├── site.css                 # Site-wide styles
    └── components/              # Per-component CSS (auto-loaded)
        ├── card.css
        ├── modal.css
        └── ...
```

## Schema Properties Reference

### Root Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `$component` | Component identifier | `"card"` |
| `$tagName` | Custom element tag | `"wb-card"` |
| `behavior` | Viewmodel function name | `"card"` |
| `baseClass` | BEM block class | `"wb-card"` |

### $view Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `name` | Part identifier → BEM element | `"header"` → `.wb-card__header` |
| `tag` | HTML element (lowercase) | `"header"`, `"main"`, `"footer"` |
| `parent` | Nest inside another part | `"parent": "header"` |
| `content` | Template interpolation | `"{{title}}"` or `"{{slot}}"` |
| `createdWhen` | Conditional creation | `"title OR subtitle"` |
| `required` | Always create | `true` |
| `class` | Additional classes | `"custom-class"` |

### $methods Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `description` | Method documentation | `"Shows the card"` |
| `params` | Parameter names | `["options"]` |
| `returns` | Return type | `"Promise<void>"` |

### $cssAPI Properties

Documents CSS custom properties for theming:

```json
"$cssAPI": {
  "--wb-card-padding": "Internal padding (default: 1.5rem)",
  "--wb-card-radius": "Border radius (default: 8px)",
  "--wb-card-bg": "Background color"
}
```

## Migration Status

### ✅ Complete (v3.0 Core)

- [x] Schema Builder integrated into WB.init()
- [x] Light DOM architecture enforced
- [x] CSS auto-loading from /src/styles/components
- [x] 41+ component schemas created
- [x] Lazy-loading behavior registry
- [x] Cross-browser support infrastructure
- [x] Feature detection (no UA sniffing)
- [x] Custom Elements Manifest for VS Code

### ✅ Components Migrated

| Category | Components | Status |
|----------|------------|--------|
| Cards | 19 variants (card, cardimage, cardvideo, etc.) | ✅ |
| Feedback | badge, toast, progress, spinner, avatar, skeleton | ✅ |
| Navigation | tabs, accordion, breadcrumb, pagination, steps | ✅ |
| Overlays | modal, drawer, lightbox, popover, confirm | ✅ |
| Forms | input, select, checkbox, radio, switch, rating | ✅ |
| Media | gallery, youtube, audio, video | ✅ |
| Semantics | code, pre, table, details, kbd | ✅ |

### 🔄 Ongoing

- [ ] Remove remaining innerHTML patterns in viewmodels
- [ ] Complete $methods binding for all components
- [ ] Auto-generate Playwright tests from schemas
- [ ] VS Code extension for IntelliSense

## Usage Examples

### Basic Component

```html
<wb-card title="Hello World" elevated>
  <p>Card content goes here.</p>
</wb-card>
```

### With Behaviors

```html
<wb-card title="Interactive Card" x-draggable x-ripple>
  <p>This card is draggable with ripple effect.</p>
</wb-card>
```

### Behavior Only (No Component)

```html
<button x-ripple x-tooltip="Click to save">
  💾 Save
</button>
```

### CSS Customization

```css
/* Override via CSS variables */
wb-card {
  --wb-card-padding: 2rem;
  --wb-card-radius: 16px;
  --wb-card-bg: var(--bg-tertiary);
}
```

## Testing Strategy

### Schema-Driven Tests

Since schemas define the contract, tests can be auto-generated:

```javascript
// Auto-generated from card.schema.json
test('card with title shows header', async () => {
  const card = await renderComponent('wb-card', { title: 'Test' });
  expect(card.querySelector('.wb-card__header')).toBeTruthy();
});

test('card without title hides header', async () => {
  const card = await renderComponent('wb-card', {});
  expect(card.querySelector('.wb-card__header')).toBeFalsy();
});
```

### Compliance Tests

Automated tests verify all components meet standards:

- Base class present
- Proper ARIA attributes
- Keyboard accessibility
- Theme compatibility

## Debugging

### Console Logging

```javascript
WB.init({ debug: true }); // Enable verbose logging
```

### Inspect Schemas

```javascript
// Get loaded schema
const schema = WB.schema.getSchema('card');
console.log(schema);

// List all schemas
console.log(WB.schema.registry);
```

### Check Applied Behaviors

```javascript
// See what behaviors are on an element
const card = document.querySelector('wb-card');
console.log(card.classList.contains("wb-ready")); // Lists applied behaviors
```

## Resources

- [Builder Documentation](/docs/builder.md) - The heart of wb-starter
- [Behaviors Reference](/docs/behaviors-reference.md) - All 170+ behaviors
- [Theme System](/docs/themes.md) - 23 themes and customization
- [Testing Strategy](/docs/testing-strategy.md) - How to test components

## Changelog

### v3.0.0 (Current)
- Light DOM architecture (no Shadow DOM)
- Schema-driven DOM generation
- CSS auto-loading
- 41+ component schemas
- 170+ behaviors
- Cross-browser support
- Custom Elements Manifest

### v2.x
- Mixed Shadow/Light DOM
- Manual DOM construction
- Behavior-only system

### v1.x
- Initial behavior injection system
