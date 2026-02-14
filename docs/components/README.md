# wb-starter v3.0 - Component Library

## Overview

The wb-starter provides 41+ components using **Light DOM architecture** and the **WBServices** pattern. All components use proper HTMLElement inheritance and ES Modules.

## Architecture (v3.0)

```
┌─────────────────────────────────────────────────────────┐
│                    WBServices                            │
│  Central service registry for component initialization   │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐      ┌──────────┐
   │ wb-card  │      │ wb-search│      │ wb-modal │
   │  (Light  │      │  (Light  │      │  (Light  │
   │   DOM)   │      │   DOM)   │      │   DOM)   │
   └──────────┘      └──────────┘      └──────────┘
```

### Key Principles

1. **Custom Elements**: All components use `<wb-*>` tags
2. **Light DOM Only**: No Shadow DOM - styles cascade naturally
3. **HTMLElement Inheritance**: Proper class-based architecture
4. **ES Modules Only**: No CommonJS (require/module.exports)
5. **Schema-Driven**: JSON schemas define component properties

## Component Categories

### Cards (19 variants)
All card variants inherit from `cardBase` using semantic HTML.

| Component | Custom Tag | Description |
|-----------|------------|-------------|
| card | `<wb-card>` | Base card component |
| cardimage | `<wb-cardimage>` | Card with featured image |
| cardvideo | `<wb-cardvideo>` | Card with video player |
| cardbutton | `<wb-cardbutton>` | Card with action buttons |
| cardhero | `<wb-cardhero>` | Hero banner card |
| cardprofile | `<wb-cardprofile>` | User profile card |
| cardpricing | `<wb-cardpricing>` | Pricing plan card |
| cardstats | `<wb-cardstats>` | Statistics display |
| cardtestimonial | `<wb-cardtestimonial>` | Quote/testimonial |
| cardproduct | `<wb-cardproduct>` | E-commerce product |
| cardnotification | `<wb-cardnotification>` | Alert/notification |
| cardfile | `<wb-cardfile>` | File download card |
| cardlink | `<wb-cardlink>` | Clickable link card |
| cardhorizontal | `<wb-cardhorizontal>` | Horizontal layout |
| cardoverlay | `<wb-cardoverlay>` | Image with overlay |
| cardexpandable | `<wb-cardexpandable>` | Expandable content |
| cardminimizable | `<wb-cardminimizable>` | Minimizable window |
| carddraggable | `<wb-carddraggable>` | Draggable card |
| cardportfolio | `<wb-cardportfolio>` | Portfolio/contact |

### Form Components
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| input | `<wb-input>` | Text input field |
| textarea | `<wb-textarea>` | Multi-line text |
| checkbox | `<wb-checkbox>` | Checkbox input |
| switch | `<wb-switch>` | Toggle switch |
| select | `<wb-select>` | Dropdown select |
| search | `<wb-search>` | Search input with results |
| rating | `<wb-rating>` | Star rating |

### Navigation Components
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| tabs | `<wb-tabs>` | Tabbed interface |
| drawer | `<wb-drawer>` | Slide-in drawer |
| navbar | `<wb-navbar>` | Navigation bar |

### Feedback Components
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| alert | `<wb-alert>` | Alert message |
| toast | `<wb-toast>` | Toast notification |
| spinner | `<wb-spinner>` | Loading spinner |
| skeleton | `<wb-skeleton>` | Loading skeleton |
| progress | `<wb-progress>` | Progress bar |

### Effects
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| confetti | `<wb-confetti>` | Confetti animation |
| fireworks | `<wb-fireworks>` | Fireworks effect |
| snow | `<wb-snow>` | Snow animation |

### Overlay Components
| Component | Custom Tag | Description |
|-----------|------------|-------------|
| dialog | `<wb-dialog>` | Modal dialog |
| tooltip | `<wb-tooltip>` | Tooltip popup |
| dropdown | `<wb-dropdown>` | Dropdown menu |

## Usage Patterns

### Custom Element (Recommended)

```html
<wb-card title="My Card" subtitle="Description">
  Card content goes here
</wb-card>

<wb-search placeholder="Search for content..." variant="glass" size="large">
</wb-search>
```

### Attribute-Based (Shortest)

```html
<wb-card title="My Card" elevated clickable>
  Content here
</wb-card>

<wb-search placeholder="Search..." debounce="300">
  <!-- Search results will appear here -->
</wb-search>
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
│   ├── wb-search.js
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
  "baseClass": "wb-component",
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

Web Behaviors (WB) components use proper semantic HTML:

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
- [Base Card](./cards/card.md)
- [Search Component](../search.md)
- [Semantic Elements](./semantic/semantic.index.md)
- [Effects](./effects/)
