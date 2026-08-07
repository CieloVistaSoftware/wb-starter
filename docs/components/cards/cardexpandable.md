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
</wb-cardexpandable>
```

### Initially Expanded

```html
<wb-cardexpandable
  title="Details"
  expanded>
  All content visible by default.
</wb-cardexpandable>
```

## Events

### wb:cardexpandable:toggle

```javascript
document.querySelector('wb-cardexpandable').addEventListener('wb:cardexpandable:toggle', (e) => {
  console.log('Expanded:', e.detail.expanded);
});
```

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
