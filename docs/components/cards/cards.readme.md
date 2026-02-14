# Cards Components Documentation
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/components/cards/cards.readme.md)

## Overview
The Cards component library provides 19 specialized card variants for displaying content in organized, visually appealing containers. All card components inherit from the base card behavior and use semantic HTML.

---

## Component Variants

| Component | Custom Tag | Description |
|-----------|------------|-------------|
| [card](./card.md) | `<wb-card>` | Base card component |
| [cardimage](./cardimage.md) | `<wb-cardimage>` | Card with featured image |
| [cardvideo](./cardvideo.md) | `<wb-cardvideo>` | Card with video player |
| [cardbutton](./cardbutton.md) | `<wb-cardbutton>` | Card with action buttons |
| [cardhero](./cardhero.md) | `<wb-cardhero>` | Hero banner card |
| [cardprofile](./cardprofile.md) | `<wb-cardprofile>` | User profile card |
| [cardpricing](./cardpricing.md) | `<wb-cardpricing>` | Pricing plan card |
| [cardstats](./cardstats.md) | `<wb-cardstats>` | Statistics display |
| [cardtestimonial](./cardtestimonial.md) | `<wb-cardtestimonial>` | Quote/testimonial |
| [cardproduct](./cardproduct.md) | `<wb-cardproduct>` | E-commerce product |
| [cardnotification](./cardnotification.md) | `<wb-cardnotification>` | Alert/notification |
| [cardfile](./cardfile.md) | `<wb-cardfile>` | File download card |
| [cardlink](./cardlink.md) | `<wb-cardlink>` | Clickable link card |
| [cardhorizontal](./cardhorizontal.md) | `<wb-cardhorizontal>` | Horizontal layout |
| [cardoverlay](./cardoverlay.md) | `<wb-cardoverlay>` | Image with overlay |
| [cardexpandable](./cardexpandable.md) | `<wb-cardexpandable>` | Expandable content |
| [cardminimizable](./cardminimizable.md) | `<wb-cardminimizable>` | Minimizable window |
| [carddraggable](./carddraggable.md) | `<wb-carddraggable>` | Draggable card |
| [cardportfolio](./cardportfolio.md) | `<wb-cardportfolio>` | Portfolio/contact |

---

## Common Attributes

All card components support these base attributes:

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
<wb-card title="Card Title" subtitle="Card subtitle">
  <p>Card content goes here.</p>
</wb-card>
```

### Elevated Card
```html
<wb-card title="Elevated Card" elevated>
  <p>This card has shadow elevation.</p>
</wb-card>
```

### Clickable Card
```html
<wb-card title="Clickable Card" clickable>
  <p>This card responds to clicks.</p>
</wb-card>
```

---

## Architecture

All card variants inherit from the base `card` behavior and extend functionality for specific use cases:

- **Base Structure**: Uses semantic `<article>` elements
- **Styling**: CSS custom properties for theming
- **Accessibility**: Proper ARIA roles and keyboard navigation
- **Responsive**: Mobile-first design with flexible layouts

---

## Schema
- See: [src/wb-models/card.schema.json](../../src/wb-models/card.schema.json)
- Defines base properties shared by all card variants

---

## Implementation
- **Base Behavior**: [src/wb-viewmodels/card.js](../../src/wb-viewmodels/card.js)
- **Styles**: [src/styles/components/card.css](../../src/styles/components/card.css)
- **Tests**: Component tests in `tests/behaviors/ui/card.spec.ts`

---

## See Also
- [Cards Index](./cards.index.md) - Detailed architecture overview
- [Base Card Documentation](./card.md) - Complete API reference
