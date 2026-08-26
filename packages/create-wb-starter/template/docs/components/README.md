# wb-starter v3.0 - Component Library

## Overview

The wb-starter provides 41+ components using **Light DOM architecture** and the **WBServices** pattern. Components are **composed, not subclassed**: a `<wb-*>` tag maps to a behavior function that decorates the element in place, and shared structure comes from semantic HTML, helper functions, and design tokens. Everything ships as ES Modules.

## Architecture (v3.0)

This is a **dispatch** diagram, not a class hierarchy. Nothing below inherits from
WBServices — the registry looks up which behavior function to run, then that function
decorates the element that is already in the page.

```
┌─────────────────────────────────────────────────────────┐
│                    WBServices                            │
│  Central registry: tag/attribute  →  behavior function   │
└─────────────────────────────────────────────────────────┘
                           │  looks up + calls
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
     card(el)          search(el)         modal(el)      ← behavior functions
         │                 │                 │
         ▼ decorates       ▼ decorates       ▼ decorates
   ┌──────────┐      ┌──────────┐      ┌──────────┐
   │ x-card  │      │ x-search│      │ x-modal │      ← elements in Light DOM
   └──────────┘      └──────────┘      └──────────┘
         ▲                 ▲                 ▲
         └─────────────────┴─────────────────┘
      any element may also stack x-* behaviors (x-ripple,
      x-tooltip, …) — capability adds up, it does not cascade
      down from a parent class
```

### Key Principles

1. **Custom Elements**: All components use `<wb-*>` tags
2. **Light DOM Only**: No Shadow DOM - styles cascade naturally
3. **Composition, Not Inheritance**: capability is applied by behavior functions `(element, options)` — there is no component base class to subclass
4. **ES Modules Only**: No CommonJS (require/module.exports)
5. **Schema-Driven**: JSON schemas define component properties

## Component Categories

### Cards (19 variants)
All card variants are independent components that share structure via semantic HTML and composition (no base class).

| Component | Custom Tag | Description |
|-----------|------------|-------------|
| card | `<article>` | Card component |
| cardimage | `<div x-cardimage>` | Card with featured image |
| cardvideo | `<div x-cardvideo>` | Card with video player |
| cardbutton | `<div x-cardbutton>` | Card with action buttons |
| cardhero | `<div x-cardhero>` | Hero banner card |
| cardprofile | `<div x-cardprofile>` | User profile card |
| cardpricing | `<div x-cardpricing>` | Pricing plan card |
| cardstats | `<div x-cardstats>` | Statistics display |
| cardtestimonial | `<div x-cardtestimonial>` | Quote/testimonial |
| cardproduct | `<div x-cardproduct>` | E-commerce product |
| cardnotification | `<div x-cardnotification>` | Alert/notification |
| cardfile | `<div x-cardfile>` | File download card |
| cardlink | `<div x-cardlink>` | Clickable link card |
| cardhorizontal | `<div x-cardhorizontal>` | Horizontal layout |
| cardoverlay | `<div x-cardoverlay>` | Image with overlay |
| cardexpandable | `<div x-cardexpandable>` | Expandable content |
| cardminimizable | `<div x-cardminimizable>` | Minimizable window |
| carddraggable | `<div x-carddraggable>` | Draggable card |
| cardportfolio | `<div x-cardportfolio>` | Portfolio/contact |

### Form Components
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| input | `<div x-input>` | Text input field |
| textarea | `<textarea>` | Multi-line text |
| checkbox | `<div x-checkbox>` | Checkbox input |
| switch | `<div x-switch>` | Toggle switch |
| select | `<select>` | Dropdown select |
| search | `<div x-searchfield>` | Search input with results |
| rating | `<span x-rating>` | Star rating |

### Navigation Components
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| tabs | `<div x-tabs>` | Tabbed interface |
| drawer | `<div x-drawer>` | Slide-in drawer |
| navbar | `<div x-navbar>` | Navigation bar |

### Feedback Components
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| alert | `<div x-alert>` | Alert message |
| toast | `<div x-toast>` | Toast notification |
| spinner | `<span x-spinner>` | Loading spinner |
| skeleton | `<div x-skeleton>` | Loading skeleton |
| progress | `<progress>` | Progress bar |

### Effects
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| confetti | `<div x-confetti>` | Confetti animation |
| fireworks | `<div x-fireworks>` | Fireworks effect |
| snow | `<div x-snow>` | Snow animation |

### Overlay Components
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| dialog | `<dialog>` | Modal dialog |
| tooltip | `<span x-tooltip>` | Tooltip popup |
| dropdown | `<div x-dropdown>` | Dropdown menu |

## Usage Patterns

### Custom Element (Recommended)

```html
<article
  title="My Card"
  subtitle="Description">
  Card content goes here
</article>
<div x-searchfield
  placeholder="Search for content..."
  variant="glass"
  size="large">
</div>
```

### Attribute-Based (Shortest)

```html
<article
  title="My Card"
  elevated
  clickable>
  Content here
</article>
<div x-searchfield
  placeholder="Search..."
  debounce="300">
  <!-- Search results will appear here -->
</div>
```

## File Structure (v3.0)

```
src/
├── wb-models/              # JSON schemas
│   ├── card.schema.json
│   ├── search.schema.json
│   ├── cardimage.schema.json
│   └── ...
├── wb-viewmodels/          # Component logic (JavaScript)
│   ├── card.js
│   ├── x-search.js
│   ├── search.js
│   └── ...
└── styles/
    └── components/         # Component CSS
        ├── card.css
        ├── search.css
        └── ...

docs/
└── components/             # Documentation
    ├── README.md           # This file
    ├── cards/              # Card component docs
    └── ...
```

## Schema Structure (v3.0)

Each component has a JSON schema in `src/wb-models/`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "component.schema.json",
  "title": "Component Name",
  "description": "Component description",
  "behavior": "componentname",
  "baseClass": "x-component",
  "semanticElement": {
    "tagName": "article",
    "implicitRole": "article"
  },
  "properties": {
    "title": {
      "type": "string",
      "description": "Title text",
      "default": ""
    }
  },
  "$view": [...],
  "$methods": {...},
  "$cssAPI": {...}
}
```

## Semantic HTML Foundation

WB-Starter components use proper semantic HTML:

| Element | Used By | Purpose |
|---------|---------|---------|
| `<article>` | Cards | Self-contained content |
| `<aside>` | Notifications, Sidebar | Supplementary content |
| `<figure>` | Image cards | Self-contained media |
| `<blockquote>` | Testimonials | Extended quotations |
| `<address>` | Portfolio | Contact information |
| `<data>` | Stats | Machine-readable values |
| `<nav>` | Tabs, Menu | Navigation links |
| `<dialog>` | Modal | Interactive dialogs |
| `<progress>` | Progress | Task completion |
| `<input>` | Search, Forms | User input fields |

## CSS Variables (Design Tokens)

All components use CSS variables for theming:

```css
/* Colors */
--text-primary: #f9fafb;
--text-secondary: #9ca3af;
--bg-primary: #0f172a;
--bg-secondary: #1f2937;
--bg-tertiary: #1e293b;
--border-color: #374151;
--primary: #6366f1;

/* Spacing */
--space-sm: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;

/* Shadows */
--shadow-elevated: 0 4px 12px rgba(0,0,0,0.15);
--shadow-hover: 0 8px 24px rgba(0,0,0,0.2);

/* Radius */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
```

## Documentation Files

- [Cards Overview](./cards/cards.index.md)
- [Card](./cards/card.md)
- [Search Component](../search.md)
- [Semantic Elements](./semantic/semantic.index.md)
- [Effects](./effects/README.md)
