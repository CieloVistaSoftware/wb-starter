# Rating - wb-starter v3.0

Star rating component for displaying or collecting ratings.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<span x-rating>` |
| Behavior | `rating` |
| Semantic | `<div>` (role="slider") |
| Root CSS Class | `x-rating` |
| Category | Feedback |
| Schema | `src/wb-models/rating.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | number | `0` | Current rating value (0-max) |
| `max` | number | `5` | Maximum rating |
| `readonly` | boolean | `false` | Display only, not interactive |
| `disabled` | boolean | `false` | Disabled state |
| `half` | boolean | `false` | Allow half-star ratings |
| `size` | string | `"md"` | Size: `sm`, `md`, `lg` |
| `icon` | string | `"★"` | Custom icon (emoji or symbol) |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<span x-rating value="3"></span>
</div>

## Usage

### Custom Element

```html
<span x-rating value="3"></span>
```

### Data Attribute

```html
<div
  x-rating
  value="4">
</div>
```

### Read-Only Display

```html
<span x-rating
  value="4.5"
  half
  readonly>
</span>
```

### Interactive Input

```html
<span x-rating
  value="0"
  max="5">
</span>
```

### Half Stars

```html
<span x-rating
  value="3.5"
  half>
</span>
```

### Custom Max

```html
<span x-rating
  value="7"
  max="10">
</span>
```

### Sizes

```html
<span x-rating
  value="3"
  size="sm">
</span>
<span x-rating
  value="3"
  size="md">
</span>
<span x-rating
  value="3"
  size="lg">
</span>
```

### Custom Icons

```html
<span x-rating
  value="3"
  icon="❤️">
</span>
<span x-rating
  value="4"
  icon="👍">
</span>
<span x-rating
  value="2"
  icon="🔥">
</span>
```

### Disabled

```html
<span x-rating
  value="4"
  disabled>
</span>
```

## Generated Structure

```html
<div
  class="x-rating"
  role="slider"
  aria-valuemin="0"
  aria-valuemax="5"
  aria-valuenow="3">
  <span class="x-rating__star x-rating__star--filled">★</span>
  <span class="x-rating__star x-rating__star--filled">★</span>
  <span class="x-rating__star x-rating__star--filled">★</span>
  <span class="x-rating__star">★</span>
  <span class="x-rating__star">★</span>
  <span class="x-rating__value">3 / 5</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-rating` | Always | Base styling |
| `.x-rating--readonly` | `readonly` | Read-only state |
| `.x-rating--disabled` | `disabled` | Disabled state |
| `.x-rating--sm` | `size="sm"` | Small size |
| `.x-rating--md` | `size="md"` | Medium size |
| `.x-rating--lg` | `size="lg"` | Large size |
| `.x-rating__star--filled` | Star is filled | Filled star |
| `.x-rating__star--half` | Half-filled star | Half star (when `half`) |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getValue()` | Gets current rating | `number` |
| `setValue(value)` | Sets rating value | - |
| `clear()` | Clears rating to 0 | - |
| `enable()` | Enables the rating | - |
| `disable()` | Disables the rating | - |

```javascript
const rating = document.querySelector('x-rating');

// Get/set value
const value = rating.getValue();
rating.setValue(4.5);

// Clear
rating.clear();

// Enable/disable
rating.disable();
rating.enable();
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:rating:change` | Rating changed | `{ value: number, previousValue: number }` |

```javascript
rating.addEventListener('wb:rating:change', (e) => {
  console.log('New rating:', e.detail.value);
  console.log('Previous rating:', e.detail.previousValue);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-rating-size` | `24px` | Star size |
| `--x-rating-gap` | `2px` | Gap between stars |
| `--x-rating-color` | `#fbbf24` | Filled star color |
| `--x-rating-empty-color` | `#d1d5db` | Empty star color |
| `--x-rating-hover-color` | `#f59e0b` | Hover color |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `slider` | Always |
| `aria-valuemin` | `0` | Always |
| `aria-valuemax` | Dynamic from `max` | Always |
| `aria-valuenow` | Dynamic from `value` | Always |
| `aria-label` | `"Rating"` | Always |

Keyboard support (when interactive):
- `←/↓` - Decrease rating
- `→/↑` - Increase rating
- `Home` - Set to minimum
- `End` - Set to maximum

## Schema

Location: `src/wb-models/rating.schema.json`
