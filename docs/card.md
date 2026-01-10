# Card Component Documentation
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/card.md)

## Overview
The Card component is a flexible UI container for displaying grouped content. It is the foundation for **19 specialized variants**, ranging from simple content containers to complex interactive elements like draggable cards, product displays, and portfolios.

---

## Variants
There are 19 distinct card behaviors available. All inherit from the base `card` behavior but provide specialized rendering and logic:

| Category | Behaviors |
|----------|-----------|
| **Base** | `card` |
| **Media** | `cardimage`, `cardvideo`, `cardoverlay`, `cardhero` |
| **Content** | `cardprofile`, `cardtestimonial`, `cardstats`, `cardfile`, `cardnotification` |
| **Commerce** | `cardproduct`, `cardpricing` |
| **Layout** | `cardhorizontal`, `cardbutton`, `cardlink` |
| **Interactive** | `carddraggable`, `cardexpandable`, `cardminimizable`, `cardportfolio` |

### cardlink

To create a card that acts as a link, use the `<card-link>` custom element:

```html
<card-link data-href="/page" data-title="My Page" data-badge="NEW"></card-link>
```

Supported attributes:
- `data-href` - Link destination (required)
- `data-title` - Card title
- `data-description` - Card description
- `data-icon` - Icon before title
- `data-badge` - Badge text
- `data-badge-variant` - Badge style: `glass` (default) or `gradient`
- `data-target` - Link target: `_self` (default) or `_blank`

---

## Schema
- See: [src/wb-models/card.schema.json](../src/wb-models/card.schema.json)
- Defines base properties, styles, and test scenarios for all card types.
- Specialized schemas (e.g., [src/wb-models/cardimage.schema.json](../src/wb-models/cardimage.schema.json)) extend this base for unique features.

---

## Implementation
- Source: [src/wb-viewmodels/card.js](../src/wb-viewmodels/card.js)
- Playwright tests: [tests/behaviors/ui/card.spec.ts](../tests/behaviors/ui/card.spec.ts)
- The card behavior is automatically applied to `<wb-card>` elements or `<article>` elements (if auto-inject is enabled).
- Always adds the `wb-card` class.
- Always adds the `wb-card--default` class if no variant is specified.
- Supports additional classes for hoverable, clickable, elevated, and custom variants.

### Semantic HTML Relationship
The card component is designed to work seamlessly with semantic HTML.
- **Preferred Tag:** `<article>` (represents a self-contained composition)
- **Alternative Tag:** `<section>` (represents a generic section)
- **Fallback Tag:** `<div>` (generic container)

When using `<article>` or `<section>`, the component will automatically enhance existing `<header>`, `<main>`, and `<footer>` children instead of overwriting them, preserving your semantic structure.

---

## Usage Example
```html
<wb-card data-variant="primary" data-hoverable data-clickable>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</wb-card>
```

> **Developer Tip:** In VS Code, type `<wb-card` to trigger IntelliSense and see available attributes.

**Attribute Definitions:**
- `data-variant="primary"`: Sets the card variant (e.g., primary, secondary, default). If omitted, `wb-card--default` is used.
- `data-hoverable`: Adds the `wb-card--hoverable` class for hover effects. Omit or set to `false` to disable.
- `data-clickable`: Adds the `wb-card--clickable` class for click interaction styling.

---

## Test Coverage
- Playwright integration tests: `tests/behaviors/ui/card.spec.ts`
- Tests are run using `index.html` as the entry point, with test cards injected dynamically.
- All tests must pass before documentation is updated.
- Tests cover:
  - Rendering and base classes
  - Hoverable, clickable, and elevated states
  - Default and custom variants

---

## Styles
- Base class: `wb-card`
- Default variant: `wb-card--default`
- Other variants: `wb-card--[variant]`
- Additional: `wb-card--hoverable`, `wb-card--clickable`, `wb-card--elevated`

---

## Extending
- To create a new card type, extend the base schema and add only unique properties and tests.
- Update this documentation when new features or variants are added.

---

## Last Updated
January 9, 2026
