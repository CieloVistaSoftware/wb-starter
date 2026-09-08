# Card Behavior Documentation
[Edit this file](./card.md)

## Overview
The Card behavior is a flexible UI container for displaying grouped content. It is the foundation for **19 specialized variants**, ranging from simple content containers to complex interactive elements like draggable cards, product displays, and portfolios.

---

## Variants
There are 19 distinct card behaviors available. All share the `card` behavior but provide specialized rendering and logic:

| Category | Behaviors |
|----------|-----------|
| **Core** | `card` |
| **Media** | `cardimage`, `cardvideo`, `cardoverlay`, `cardhero` |
| **Content** | `cardprofile`, `cardtestimonial`, `cardstats`, `cardfile`, `cardnotification` |
| **Commerce** | `cardproduct`, `cardpricing` |
| **Layout** | `cardhorizontal`, `cardbutton`, `cardlink` |
| **Interactive** | `carddraggable`, `cardexpandable`, `cardminimizable`, `cardportfolio` |

### cardlink

To create a card that acts as a link, use the `<div x-cardlink>` custom element:

```html
<div x-cardlink
  href="/page"
  title="My Page"
  badge="NEW">
</div>
```

Supported attributes:
- `href` - Link destination (required)
- `title` - Card title
- `description` - Card description
- `icon` - Icon before title
- `badge` - Badge text
- `badge-variant` - Badge style: `glass` (default) or `gradient`
- `target` - Link target: `_self` (default) or `_blank`

---

## Schema
- See: [src/wb-models/card.schema.json](../src/wb-models/card.schema.json)
- Defines shared properties, styles, and test scenarios for all card types.
- Specialized schemas (e.g., [src/wb-models/cardimage.schema.json](../src/wb-models/cardimage.schema.json)) build on these shared properties for unique features.

---

## Implementation
- Source: [src/wb-viewmodels/card.js](../src/wb-viewmodels/card.js)
- Playwright tests: [tests/behaviors/ui/card.spec.ts](../tests/cards/card-examples-demo.spec.ts)
- The card behavior is automatically applied to `<article>` elements or `<article>` elements (if auto-inject is enabled).
- Always adds the `<article>` class.
- Always adds the `x-card--default` class if no variant is specified.
- Supports additional classes for hoverable, clickable, elevated, and custom variants.

### Semantic HTML Relationship
The card behavior is designed to work seamlessly with semantic HTML.
- **Preferred Tag:** `<article>` (represents a self-contained composition)
- **Alternative Tag:** `<section>` (represents a generic section)
- **Fallback Tag:** `<div>` (generic container)

When using `<article>` or `<section>`, the behavior will automatically enhance existing `<header>`, `<main>`, and `<footer>` children instead of overwriting them, preserving your semantic structure.

---

## Usage Example
<div x-demo>
<article
  variant="primary"
  hoverable
  clickable>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</article>
</div>

> **Developer Tip:** In VS Code, type `<article` to trigger IntelliSense and see available attributes.

**Attribute Definitions:**
- `variant="primary"`: Sets the card variant (e.g., primary, secondary, default). If omitted, `x-card--default` is used.
- `hoverable`: Adds the `x-card--hoverable` class for hover effects. Omit or set to `false` to disable.
- `clickable`: Adds the `x-card--clickable` class for click interaction styling.

---

## Test Coverage
- Playwright integration tests: `tests/behaviors/ui/card.spec.ts`
- Tests are run using `index.html` as the entry point, with test cards injected dynamically.
- All tests must pass before documentation is updated.
- Tests cover:
  - Rendering and root CSS classes
  - Hoverable, clickable, and elevated states
  - Default and custom variants

---

## Styles
- Root class: `<article>` (applied by the card behavior, not inherited)
- Default variant: `x-card--default`
- Other variants: `x-card--[variant]`
- Additional: `x-card--hoverable`, `x-card--clickable`, `x-card--elevated`

---

## Extending
- To create a new card type, start from the shared card schema and add only unique properties and tests.
- Update this documentation when new features or variants are added.

---

## Last Updated
January 9, 2026
