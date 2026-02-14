
# wb-starter v3.0 - Component Library

## Overview

The wb-starter provides 41+ components using **Light DOM architecture** and the **WBServices** pattern. All components use proper HTMLElement inheritance and ES Modules.

### Key Principles

1. **Custom Elements**: All components use `<wb-*>` tags
2. **Light DOM Only**: No Shadow DOM - styles cascade naturally
3. **HTMLElement Inheritance**: Proper class-based architecture
4. **ES Modules Only**: No CommonJS (require/module.exports)
5. **Schema-Driven**: JSON schemas define component properties

## Architecture (v3.0)
[WBServices](../wbservices.md)
```
┌─────────────────────────────────────────────────────────┐
│                    WBServices                           │
│  Central service registry for component initialization  │
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


└── components/             # Documentation
    ├── components.readme.md # This file
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

## Component Categories

### Cards (19 variants)
All card variants inherit from `cardBase` using semantic HTML.

| Component | Custom Tag | Description | Doc Link |
|-----------|------------|-------------|---------|
| card | `<wb-card>` | Base card component | [card.md](./cards/card.md) |
| cardimage | `<wb-cardimage>` | Card with featured image | [cardimage.md](./cards/cardimage.md) |
| cardvideo | `<wb-cardvideo>` | Card with video player | [cardvideo.md](./cards/cardvideo.md) |
| cardbutton | `<wb-cardbutton>` | Card with action buttons | [cardbutton.md](./cards/cardbutton.md) |
| cardhero | `<wb-cardhero>` | Hero banner card | [cardhero.md](./cards/cardhero.md) |
| cardprofile | `<wb-cardprofile>` | User profile card | [cardprofile.md](./cards/cardprofile.md) |
| cardpricing | `<wb-cardpricing>` | Pricing plan card | [cardpricing.md](./cards/cardpricing.md) |
| cardstats | `<wb-cardstats>` | Statistics display | [cardstats.md](./cards/cardstats.md) |
| cardtestimonial | `<wb-cardtestimonial>` | Quote/testimonial | [cardtestimonial.md](./cards/cardtestimonial.md) |
| cardproduct | `<wb-cardproduct>` | E-commerce product | [cardproduct.md](./cards/cardproduct.md) |
| cardnotification | `<wb-cardnotification>` | Alert/notification | [cardnotification.md](./cards/cardnotification.md) |
| cardfile | `<wb-cardfile>` | File download card | [cardfile.md](./cards/cardfile.md) |
| cardlink | `<wb-cardlink>` | Clickable link card | [cardlink.md](./cards/cardlink.md) |
| cardhorizontal | `<wb-cardhorizontal>` | Horizontal layout | [cardhorizontal.md](./cards/cardhorizontal.md) |
| cardoverlay | `<wb-cardoverlay>` | Image with overlay | [cardoverlay.md](./cards/cardoverlay.md) |
| cardexpandable | `<wb-cardexpandable>` | Expandable content | [cardexpandable.md](./cards/cardexpandable.md) |
| cardminimizable | `<wb-cardminimizable>` | Minimizable window | [cardminimizable.md](./cards/cardminimizable.md) |
| carddraggable | `<wb-carddraggable>` | Draggable card | [carddraggable.md](./cards/carddraggable.md) |
| cardportfolio | `<wb-cardportfolio>` | Portfolio/contact | [cardportfolio.md](./cards/cardportfolio.md) |

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

## Component Creation & Initialization: Step-by-Step

This section explains, with code samples, how WB components are created and initialized in the browser.

---

### 1. Add the Component Tag to HTML

Write your component in HTML using the <wb-*> tag:

```html
<wb-card title="Welcome" subtitle="This is a card.">
  Card content goes here.
</wb-card>
```

### 2. Include the Bootstrap Script

Add the WB bootstrap loader to your HTML (usually in <head> or before </body>):

```html
<script type="module" src="../src/core/wb-bootstrap.js"></script>
```

### 3. Bootstrap Scans and Registers Components

When the page loads, wb-bootstrap.js calls the WB.init({ scan: true }) function, which:
- Scans the DOM for all <wb-*> tags
- For each, loads its schema, logic, and styles
- Registers the custom element (if not already registered)

### 4. Behaviors via x-* Attributes (Optional)

You can enhance any element (including <wb-*> components) with x-* behaviors:

```html
<wb-card x-ripple x-tooltip="Card info" title="With Behaviors">
  Card with ripple and tooltip.
</wb-card>
```

The scanner finds all x-* attributes and injects the corresponding behavior logic from the behaviors registry.

### 5. Result: Live, Enhanced Components

After initialization, all <wb-*> tags are fully functional custom elements, and any x-* behaviors are active.

---

#### Full Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WB Component Example</title>
  <script type="module" src="../src/core/wb-bootstrap.js"></script>
</head>
<body>
  <wb-card x-ripple title="Demo Card">Hello, world!</wb-card>
</body>
</html>
```

---

## Documentation Files

- [Cards Overview](./cards/cards.index.md)
- [Base Card](./cards/card.md)
- [Search Component](../search.md)
- [Semantic Elements](./semantic/semantic.index.md)
- [Effects](./effects/)
- [Semantic Elements](./semantic/semantic.index.md)
