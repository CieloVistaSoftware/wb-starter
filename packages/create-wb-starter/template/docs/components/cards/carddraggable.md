# Card Draggable - wb-starter v3.0

Draggable/moveable card with mouse drag support.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-carddraggable>` |
| Behavior | `carddraggable` |
| Semantic | `<article>` |
| CSS Classes | `x-card x-card-draggable x-card--draggable` |
| Composes | `card` behavior + `draggable` |

## Properties

Includes all [card properties](./card.md), plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `constrain` | string | `"none"` | Constraint: `none`, `parent` |
| `axis` | string | `"both"` | Axis: `both`, `x`, `y` |
| `snapToGrid` | number | `0` | Grid snap size (0 = disabled) |

## Usage

### Basic Draggable

Rendered live below — drag it with your mouse. The source is shown underneath:

<div x-demo>
<div x-carddraggable title="Drag Me">Drag this card around.</div>
</div>

```html
<div x-carddraggable title="Drag Me"> Drag this card around. </div>
```

### Constrained to Parent

```html
<div style="position: relative; width: 500px; height: 400px;">
  <div x-carddraggable
    title="Bounded Card"
    constrain="parent">
    Cannot drag outside parent.
  </div>
</div>
```

### Horizontal Only

```html
<div x-carddraggable
  title="Horizontal"
  axis="x">
  Only moves left/right.
</div>
```

### Snap to Grid

```html
<div x-carddraggable
  title="Grid Snap"
  snapToGrid="20">
  Snaps to 20px grid.
</div>
```

## Events

### wb:carddraggable:dragstart
```javascript
card.addEventListener('wb:carddraggable:dragstart', (e) => {
  console.log('Started at:', e.detail.x, e.detail.y);
});
```

### wb:carddraggable:drag
```javascript
card.addEventListener('wb:carddraggable:drag', (e) => {
  console.log('Position:', e.detail.x, e.detail.y);
  console.log('Delta:', e.detail.deltaX, e.detail.deltaY);
});
```

### wb:carddraggable:dragend
```javascript
card.addEventListener('wb:carddraggable:dragend', (e) => {
  console.log('Ended at:', e.detail.x, e.detail.y);
});
```

## JavaScript API

```javascript
const card = document.querySelector('x-carddraggable');

// Set position
card.wbCardDraggable.setPosition(100, 50);

// Get position
const pos = card.wbCardDraggable.getPosition();
console.log(pos.x, pos.y);

// Reset position
card.wbCardDraggable.reset();
```

## CSS Classes

| Class | Applied When |
|-------|--------------|
| `.x-card--draggable` | Always |
| `.x-card--dragging` | While dragging |

## Schema

Location: `src/wb-models/carddraggable.schema.json`
