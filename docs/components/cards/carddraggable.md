# Card Draggable - WB Framework v3.0

Draggable/moveable card with mouse drag support.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-carddraggable>` |
| Behavior | `carddraggable` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card-draggable wb-card--draggable` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `constrain` | string | `"none"` | Constraint: `none`, `parent` |
| `axis` | string | `"both"` | Axis: `both`, `x`, `y` |
| `snapToGrid` | number | `0` | Grid snap size (0 = disabled) |

## Usage

### Basic Draggable

```html
<wb-carddraggable title="Drag Me">
  Drag this card around.
</wb-carddraggable>
```

### Constrained to Parent

```html
<div style="position: relative; width: 500px; height: 400px;">
  <wb-carddraggable 
    title="Bounded Card"
    constrain="parent">
    Cannot drag outside parent.
  </wb-carddraggable>
</div>
```

### Horizontal Only

```html
<wb-carddraggable 
  title="Horizontal"
  axis="x">
  Only moves left/right.
</wb-carddraggable>
```

### Snap to Grid

```html
<wb-carddraggable 
  title="Grid Snap"
  snapToGrid="20">
  Snaps to 20px grid.
</wb-carddraggable>
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
const card = document.querySelector('wb-carddraggable');

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
| `.wb-card--draggable` | Always |
| `.wb-card--dragging` | While dragging |

## Schema

Location: `src/wb-models/carddraggable.schema.json`
