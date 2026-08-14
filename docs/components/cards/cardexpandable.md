# Card Expandable - wb-starter v3.0

Card with expandable/collapsible content.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardexpandable>` |
| Behavior | `cardexpandable` |
| Semantic | `<article>` |
| Root CSS Class | `wb-card wb-card-expandable` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `expanded` | boolean | `false` | Initial expanded state |
| `maxHeight` | string | `"100px"` | Collapsed height |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardexpandable
  title="Read More"
  max-height="80px">
  <p>This is a long content that will be truncated when collapsed...</p>
  <p>More content here...</p>
  <figure>
    <img src="https://picsum.photos/800/600?random=cardexpandable1" alt="Example expanded content image" style="width: 100%; border-radius: 4px;">
    <figcaption>Figures work like any other collapsed content — hidden until expanded.</figcaption>
  </figure>
</wb-cardexpandable>
</wb-demo>

## Usage

### Basic Expandable

```html
<wb-cardexpandable
  title="Read More"
  max-height="80px">
  <p>This is a long content that will be truncated when collapsed...</p>
  <p>More content here...</p>
  <figure>
    <img src="https://picsum.photos/800/600?random=cardexpandable2" alt="Example expanded content image" style="width: 100%; border-radius: 4px;">
    <figcaption>Hidden until expanded.</figcaption>
  </figure>
</wb-cardexpandable>
```

### Initially Expanded

```html
<wb-cardexpandable
  title="Details"
  expanded>
  <p>All content is visible by default because <code>expanded</code> is set — but there's still enough content here to collapse. Click Show Less below to see it happen: this paragraph and everything after it hides, leaving just the first couple of lines and the collapsed height.</p>
  <p>This second paragraph exists specifically so the content is tall enough to actually demonstrate the collapse — a card with barely any content never visibly changes when toggled, which defeats the point of the example.</p>
  <figure>
    <img src="https://picsum.photos/800/600?random=cardexpandable3" alt="Example expanded content image" style="width: 100%; border-radius: 4px;">
    <figcaption>Also hidden when collapsed, even though the card starts expanded.</figcaption>
  </figure>
</wb-cardexpandable>
```

## Events

### wb:cardexpandable:toggle

Click Show More/Show Less below to see the event fire live, as JSON, in the log
panel `<wb-demo>` generates automatically from the `events` attribute.

<wb-demo events="wb:cardexpandable:toggle">
<wb-cardexpandable
  title="Read More"
  max-height="80px">
  <p>This is a long content that will be truncated when collapsed...</p>
  <p>More content here...</p>
  <figure>
    <img src="https://picsum.photos/800/600?random=cardexpandable4" alt="Example expanded content image" style="width: 100%; border-radius: 4px;">
    <figcaption>Hidden until expanded.</figcaption>
  </figure>
</wb-cardexpandable>
</wb-demo>

## JavaScript API

```javascript
const card = document.querySelector('wb-cardexpandable');

// Control expansion
card.wbCardExpandable.expand();
card.wbCardExpandable.collapse();
card.wbCardExpandable.toggle();

// Get state
console.log(card.wbCardExpandable.expanded);
```

## Accessibility

- Button has `aria-expanded` attribute
- Button has `aria-controls` pointing to content
- Keyboard: `Enter` or `Space` toggles expansion

## Schema

Location: `src/wb-models/cardexpandable.schema.json`
