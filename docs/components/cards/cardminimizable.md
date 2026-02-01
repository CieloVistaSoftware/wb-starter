# Card Minimizable - wb-starter v3.0

Card that can be minimized like a window.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardminimizable>` |
| Behavior | `cardminimizable` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card-minimizable wb-card--minimizable` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minimized` | boolean | `false` | Initial minimized state |

## Usage

### Basic Minimizable

```html
<wb-cardminimizable 
  title="Dashboard Widget">
  Widget content here.
</wb-cardminimizable>
```

### Initially Minimized

```html
<wb-cardminimizable 
  title="Collapsed Widget"
  minimized>
  This content is hidden initially.
</wb-cardminimizable>
```

## Events

### wb:cardminimizable:toggle

```javascript
document.querySelector('wb-cardminimizable').addEventListener('wb:cardminimizable:toggle', (e) => {
  console.log('Minimized:', e.detail.minimized);
});
```

## JavaScript API

```javascript
const card = document.querySelector('wb-cardminimizable');

// Control minimization
card.wbCardMinimizable.minimize();
card.wbCardMinimizable.expand();
card.wbCardMinimizable.toggle();

// Get state
console.log(card.wbCardMinimizable.minimized);
```

## Accessibility

- Minimize button has `aria-expanded` attribute
- Minimize button has `aria-label` for screen readers
- Keyboard: `Enter` or `Space` toggles state

## CSS Classes

| Class | Applied When |
|-------|--------------|
| `.wb-card--minimizable` | Always |
| `.wb-card--minimized` | When minimized |

## Schema

Location: `src/wb-models/cardminimizable.schema.json`
