# Card Component Documentation

## Overview
The Card component is a flexible UI container for displaying grouped content. It supports multiple variants, interactive features, and can be extended with images, buttons, and more.

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

---

## Usage Example
```html
<div data-wb="card" data-variant="primary" data-hoverable data-clickable>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>
```

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
