# Cards Components Documentation
[Edit this file](./cards.readme.md)

## Overview
The Cards component library provides 19 specialized card variants for displaying content in organized, visually appealing containers. All card components compose the shared `card` behavior and use semantic HTML.

---

## Component Variants

| Component | Custom Tag | Description |
|-----------|------------|-------------|
| [card](./card.md) | `<article>` | Card component |
| [cardimage](./cardimage.md) | `<article x-cardimage>` | Card with featured image |
| [cardvideo](./cardvideo.md) | `<article x-cardvideo>` | Card with video player |
| [cardbutton](./cardbutton.md) | `<div x-cardbutton>` | Card with action buttons |
| [cardhero](./cardhero.md) | `<article x-cardhero>` | Hero banner card |
| [cardprofile](./cardprofile.md) | `<div x-cardprofile>` | User profile card |
| [cardpricing](./cardpricing.md) | `<div x-cardpricing>` | Pricing plan card |
| [cardstats](./cardstats.md) | `<articlestats>` | Statistics display |
| [cardtestimonial](./cardtestimonial.md) | `<div x-cardtestimonial>` | Quote/testimonial |
| [cardproduct](./cardproduct.md) | `<div x-cardproduct>` | E-commerce product |
| [cardnotification](./cardnotification.md) | `<div x-cardnotification>` | Alert/notification |
| [cardfile](./cardfile.md) | `<div x-cardfile>` | File download card |
| [cardlink](./cardlink.md) | `<div x-cardlink>` | Clickable link card |
| [cardhorizontal](./cardhorizontal.md) | `<div x-cardhorizontal>` | Horizontal layout |
| [cardoverlay](./cardoverlay.md) | `<div x-cardoverlay>` | Image with overlay |
| [cardexpandable](./cardexpandable.md) | `<div x-cardexpandable>` | Expandable content |
| [cardminimizable](./cardminimizable.md) | `<div x-cardminimizable>` | Minimizable window |
| [carddraggable](./carddraggable.md) | `<div x-carddraggable>` | Draggable card |
| [cardportfolio](./cardportfolio.md) | `<div x-cardportfolio>` | Portfolio/contact |

---

## Common Attributes

All card components support these common attributes:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | "" | Card title |
| `subtitle` | string | "" | Card subtitle |
| `elevated` | boolean | false | Add shadow elevation |
| `clickable` | boolean | false | Make card clickable |
| `bordered` | boolean | false | Add border |
| `variant` | string | "default" | Visual variant |

---

## Usage Examples

### Basic Card
```html
<wb-card
  title="Card Title"
  subtitle="Card subtitle">
  <p>Card content goes here.</p>
</article>
```

### Elevated Card
```html
<wb-card
  title="Elevated Card"
  elevated>
  <p>This card has shadow elevation.</p>
</article>
```

### Clickable Card
```html
<wb-card
  title="Clickable Card"
  clickable>
  <p>This card responds to clicks.</p>
</article>
```

---

## Architecture

All card variants share the `card` behavior and compose additional functionality for specific use cases:

- **Base Structure**: Uses semantic `<article>` elements
- **Styling**: CSS custom properties for theming
- **Accessibility**: Proper ARIA roles and keyboard navigation
- **Responsive**: Mobile-first design with flexible layouts

---

## Schema
- See: [src/wb-models/card.schema.json](../../../src/wb-models/card.schema.json)
- Defines common properties shared by all card variants

---

## Implementation
- **Shared Behavior**: [src/wb-viewmodels/card.js](../../../src/wb-viewmodels/card.js)
- **Styles**: [src/styles/components/card.css](../../../src/styles/behaviors/card.css)
- **Tests**: Component tests in `tests/behaviors/ui/card.spec.ts`

---

## See Also
- [Cards Index](./cards.index.md) - Detailed architecture overview
- [Card Documentation](./card.md) - Complete API reference
