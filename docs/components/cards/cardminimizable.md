# Card Minimizable - wb-starter v3.0

Card that can be minimized like a window.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardminimizable>` |
| Behavior | `cardminimizable` |
| Semantic | `<article>` |
| Root CSS Class | `wb-card wb-card-minimizable wb-card--minimizable` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minimized` | boolean | `false` | Initial minimized state |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardminimizable title="Dashboard Widget"> Widget content here. </wb-cardminimizable>
</wb-demo>

## Usage

### Basic Minimizable

```html
<wb-cardminimizable title="Dashboard Widget"> Widget content here. </wb-cardminimizable>
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
