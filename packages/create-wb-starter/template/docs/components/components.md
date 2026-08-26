
# wb-starter v3.0 - Component Library

## Overview

The wb-starter provides 41+ components built on **composition**: Light-DOM custom
elements (`<wb-*>`) whose capabilities come from small, stackable `x-*` behaviors
rather than a class hierarchy. No build step, no Shadow DOM, no framework lock-in.

### Key Principles

1. **Composition over inheritance**: capabilities come from stacking `x-*` behaviors on any element — not from subclassing a base component
2. **Custom Elements**: components are plain `<wb-*>` tags
3. **Light DOM Only**: no Shadow DOM — styles cascade, and everything stays inspectable and themeable
4. **ES Modules Only**: no CommonJS (require/module.exports)
5. **Schema-Driven**: JSON schemas define component properties

## Why composition is a better design

Traditional component libraries lean on **inheritance**: a base `Component` class,
subclasses for every variant, and wrapper components (`<RippleButton>`,
`<TooltipButton>`) to combine features. That model is rigid — features can't be mixed
freely, and every new combination needs a new class.

wb-starter uses **composition** instead. A component is a plain `<wb-*>` element, and
you add capabilities by stacking `x-*` behaviors:

<div x-demo>
<button variant="primary" x-ripple x-tooltip="Saved to your account" x-toast message="Saved!" type="success">Save</button>
</div>

Each `x-` attribute adds one capability. They **compose** — stack as many as you want,
in any order, with no wrapper components and no JavaScript. And because behaviors
attach to *any* element, the same `x-ripple` / `x-tooltip` works on a button, a card,
an image, or a plain `<div>`.

**Why it's a fantastic design:**

- **No build step** — open an HTML file and it works. No bundler, no compile.
- **Mix and match** — any behavior on any element; no combinatorial explosion of variant classes.
- **No lock-in** — components are standard custom elements; nothing ties you to a framework.
- **Light DOM** — no Shadow DOM, so styles cascade, dev-tools show real elements, and everything is themeable (20+ themes, zero hardcoded colors).
- **Schema-first** — components are described in data, so tooling and AI can generate and validate them deterministically.
- **Testable & portable** — behaviors are pure functions over an element; components behave like standard DOM nodes.

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
   │ x-card  │      │ x-search│      │ x-modal │
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
│   ├── x-search.js
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

## Component Categories

### Cards (19 variants)
All card variants are independent components that share structure via semantic HTML and composition (no base class).

| Component | Custom Tag | Description | Doc Link |
|-----------|------------|-------------|---------|
| card | `<article>` | Card component | [card.md](./cards/card.md) |
| cardimage | `<div x-cardimage>` | Card with featured image | [cardimage.md](./cards/cardimage.md) |
| cardvideo | `<div x-cardvideo>` | Card with video player | [cardvideo.md](./cards/cardvideo.md) |
| cardbutton | `<div x-cardbutton>` | Card with action buttons | [cardbutton.md](./cards/cardbutton.md) |
| cardhero | `<div x-cardhero>` | Hero banner card | [cardhero.md](./cards/cardhero.md) |
| cardprofile | `<div x-cardprofile>` | User profile card | [cardprofile.md](./cards/cardprofile.md) |
| cardpricing | `<div x-cardpricing>` | Pricing plan card | [cardpricing.md](./cards/cardpricing.md) |
| cardstats | `<div x-cardstats>` | Statistics display | [cardstats.md](./cards/cardstats.md) |
| cardtestimonial | `<div x-cardtestimonial>` | Quote/testimonial | [cardtestimonial.md](./cards/cardtestimonial.md) |
| cardproduct | `<div x-cardproduct>` | E-commerce product | [cardproduct.md](./cards/cardproduct.md) |
| cardnotification | `<div x-cardnotification>` | Alert/notification | [cardnotification.md](./cards/cardnotification.md) |
| cardfile | `<div x-cardfile>` | File download card | [cardfile.md](./cards/cardfile.md) |
| cardlink | `<div x-cardlink>` | Clickable link card | [cardlink.md](./cards/cardlink.md) |
| cardhorizontal | `<div x-cardhorizontal>` | Horizontal layout | [cardhorizontal.md](./cards/cardhorizontal.md) |
| cardoverlay | `<div x-cardoverlay>` | Image with overlay | [cardoverlay.md](./cards/cardoverlay.md) |
| cardexpandable | `<div x-cardexpandable>` | Expandable content | [cardexpandable.md](./cards/cardexpandable.md) |
| cardminimizable | `<div x-cardminimizable>` | Minimizable window | [cardminimizable.md](./cards/cardminimizable.md) |
| carddraggable | `<div x-carddraggable>` | Draggable card | [carddraggable.md](./cards/carddraggable.md) |
| cardportfolio | `<div x-cardportfolio>` | Portfolio/contact | [cardportfolio.md](./cards/cardportfolio.md) |

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

## Component Creation & Initialization: Step-by-Step

This section explains, with code samples, how WB components are created and initialized in the browser.

---

### 1. Add the Component Tag to HTML

Write your component in HTML using the <wb-*> tag:

```html
<article
  title="Welcome"
  subtitle="This is a card.">
  Card content goes here.
</article>
```

### 2. Include the Bootstrap Script

Add the WB bootstrap loader to your HTML (usually in <head> or before </body>):

```html
<script
  type="module"
  src="../src/core/wb-bootstrap.js">
</script>
```

### 3. Bootstrap Scans and Registers Components

When the page loads, wb-bootstrap.js calls the WB.init({ scan: true }) function, which:
- Scans the DOM for all <wb-*> tags
- For each, loads its schema, logic, and styles
- Registers the custom element (if not already registered)

### 4. Behaviors via x-* Attributes (Optional)

You can enhance any element (including <wb-*> components) with x-* behaviors:

```html
<article
  x-ripple
  x-tooltip="Card info"
  title="With Behaviors">
  Card with ripple and tooltip.
</article>
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
    <script
      type="module"
      src="../src/core/wb-bootstrap.js">
    </script>
  </head>

  <body>
    <article
      x-ripple
      title="Demo Card">
      Hello, world!
    </article>
  </body>

</html>
```

---

## Documentation Files

- [Cards Overview](./cards/cards.index.md)
- [Card](./cards/card.md)
- [Search Component](../search.md)
- [Semantic Elements](./semantic/semantic.index.md)
- [Effects](./effects/README.md)
- [Semantic Elements](./semantic/semantic.index.md)
