# Card Component Documentation

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

### cardlink with AutoInject

The `cardlink` variant has special autoInject support. With `autoInject: true`:

```html
<!-- This automatically becomes a cardlink -->
<article data-href="/page" data-title="My Page" data-badge="NEW"></article>
```

Supported attributes:
- `data-href` - Link destination (required for autoInject)
- `data-title` - Card title
- `data-description` - Card description
- `data-icon` - Icon before title
- `data-badge` - Badge text
- `data-badge-variant` - Badge style: `glass` (default) or `gradient`
- `data-target` - Link target: `_self` (default) or `_blank`

**Note:** Plain `<article>` elements without `data-href` remain semantic articles.

---

## Schema
- See: [src/behaviors/ui/schema/card.schema.json](../src/behaviors/ui/schema/card.schema.json)
- Defines base properties, styles, and test scenarios for all card types.
- Specialized schemas (e.g., [cardimage.schema.json](../src/behaviors/ui/schema/cardimage.schema.json), [cardbutton.schema.json](../src/behaviors/ui/schema/cardbutton.schema.json)) extend this base for unique features.

---

## Implementation
- Source: [src/behaviors/ui/card.js](../src/behaviors/ui/card.js)
- Playwright tests: [src/behaviors/ui/card.spec.ts](../src/behaviors/ui/card.spec.ts)
- The card behavior is applied via the `data-wb="card"` attribute.
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
<div data-wb="card" data-variant="primary" data-hoverable data-clickable>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>
```

> **Developer Tip:** In VS Code, type `data-wb="` (including the quote) to trigger IntelliSense and see a dropdown list of all available behaviors.
>
> ![IntelliSense Demo](assets/images/intellisense-demo.png)
> *(Please save your screenshot to `docs/assets/images/intellisense-demo.png` to see it here)*

**Attribute Definitions:**
- `data-wb="card"`: Activates the card behavior for this element.
- `data-variant="primary"`: Sets the card variant (e.g., primary, secondary, default). If omitted, `wb-card--default` is used.
- `data-hoverable`: Adds the `wb-card--hoverable` class for hover effects. Omit or set to `false` to disable.
- `data-clickable`: Adds the `wb-card--clickable` class for click interaction styling.

---

## Test Coverage
- Playwright integration tests: `src/behaviors/ui/card.spec.ts`
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
December 13, 2025
