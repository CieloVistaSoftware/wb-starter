# Card Components

All card variants inherit from the base `card` component and use the `<article>` semantic element (with exceptions noted).

## Inheritance Model

```
card (base)
├── cardimage      - Card with featured image
├── cardvideo      - Card with video player
├── cardbutton     - Card with action buttons
├── cardhero       - Full-width hero card with background
├── cardprofile    - User profile card
├── cardpricing    - Pricing plan card
├── cardstats      - Statistics/metric card
├── cardtestimonial - Quote/testimonial card (uses <blockquote>)
├── cardproduct    - E-commerce product card
├── cardnotification - Alert/notification card (uses <aside>)
├── cardfile       - File/document card
├── cardlink       - Clickable link card
├── cardhorizontal - Side-by-side layout card
├── cardoverlay    - Image with text overlay
├── cardexpandable - Expandable/collapsible content
├── cardminimizable - Minimizable card
├── carddraggable  - Draggable/movable card
└── cardportfolio  - Portfolio/contact card (uses <address>)
```

## Base Card Properties (inherited by all)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | 'Card Title' | Main heading (canvas-editable) |
| `subtitle` | string | 'Card subtitle' | Secondary text (canvas-editable) |
| `footer` | string | 'Card footer' | Footer text (canvas-editable) |
| `elevated` | boolean | false | Add drop shadow |
| `clickable` | boolean | false | Make card clickable |
| `href` | string | '' | URL when clickable |
| `hoverText` | string | '' | Tooltip on hover |

## Semantic Element Usage

| Card Variant | Primary Element | Secondary Elements |
|--------------|----------------|-------------------|
| card (base) | `<article>` | `<header>`, `<main>`, `<footer>` |
| cardtestimonial | `<article>` | `<blockquote>`, `<cite>`, `<figure>` |
| cardnotification | `<aside>` | - |
| cardportfolio | `<article>` | `<address>`, `<figure>` |
| cardstats | `<article>` | `<data>` |
| cardfile | `<article>` | `<figure>`, `<figcaption>`, `<time>` |
| cardproduct | `<article>` | `<figure>`, `<data>` |
| cardimage | `<article>` | `<figure>`, `<figcaption>` |
| cardvideo | `<article>` | `<figure>`, `<video>` |

## Documentation Files

### Base & Common
- [card.md](./card.md) - Base card component
- [cardbutton.md](./cardbutton.md) - Card with action buttons
- [cardimage.md](./cardimage.md) - Card with featured image
- [cardvideo.md](./cardvideo.md) - Card with video

### Profile & Contact
- [cardprofile.md](./cardprofile.md) - User profile card
- [cardportfolio.md](./cardportfolio.md) - Portfolio/contact card

### Commerce
- [cardpricing.md](./cardpricing.md) - Pricing plan card
- [cardproduct.md](./cardproduct.md) - Product card

### Content
- [cardhero.md](./cardhero.md) - Hero card
- [cardoverlay.md](./cardoverlay.md) - Overlay card
- [cardhorizontal.md](./cardhorizontal.md) - Horizontal layout
- [cardtestimonial.md](./cardtestimonial.md) - Testimonial card
- [cardstats.md](./cardstats.md) - Statistics card

### Utility
- [cardfile.md](./cardfile.md) - File/document card
- [cardlink.md](./cardlink.md) - Link card
- [cardnotification.md](./cardnotification.md) - Notification card
- [cardexpandable.md](./cardexpandable.md) - Expandable card
- [cardminimizable.md](./cardminimizable.md) - Minimizable card
- [carddraggable.md](./carddraggable.md) - Draggable card

## Schema Files

Each card has a corresponding schema in `/src/behaviors/schema/`:
- `card.schema.json`
- `cardimage.schema.json`
- etc.
