# Card Minimizable - wb-starter v3.0

Card that can be minimized like a window.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardminimizable>` |
| Behavior | `cardminimizable` |
| Semantic | `<article>` |
| Root CSS Class | `x-card x-card-minimizable x-card--minimizable` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minimized` | boolean | `false` | Initial minimized state |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-cardminimizable title="Dashboard Widget"> Widget content here. </div>
</div>

## Usage

### Basic Minimizable

```html
<div x-cardminimizable title="Dashboard Widget"> Widget content here. </div>
```

### Initially Minimized

```html
<div x-cardminimizable
  title="Collapsed Widget"
  minimized>
  This content is hidden initially.
</div>
```

## Events

### wb:cardminimizable:toggle

```javascript
document.querySelector('x-cardminimizable').addEventListener('wb:cardminimizable:toggle', (e) => {
  console.log('Minimized:', e.detail.minimized);
});
```

## JavaScript API

```javascript
const card = document.querySelector('x-cardminimizable');

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
| `.x-card--minimizable` | Always |
| `.x-card--minimized` | When minimized |

## Schema

Location: `src/wb-models/cardminimizable.schema.json`
