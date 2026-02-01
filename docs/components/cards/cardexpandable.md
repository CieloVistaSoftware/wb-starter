# Card Expandable - wb-starter v3.0

Card with expandable/collapsible content.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardexpandable>` |
| Behavior | `cardexpandable` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card-expandable` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `expanded` | boolean | `false` | Initial expanded state |
| `maxHeight` | string | `"100px"` | Collapsed height |

## Usage

### Basic Expandable

```html
<wb-cardexpandable 
  title="Read More"
  maxHeight="80px">
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
