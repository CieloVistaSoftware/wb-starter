# Rating - WB Framework v3.0

Star rating component for displaying or collecting ratings.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-rating>` |
| Behavior | `rating` |
| Semantic | `<div>` (role="slider") |
| Base Class | `wb-rating` |
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

## Usage

### Custom Element

```html
<wb-rating value="3"></wb-rating>
```

### Data Attribute

```html
<div data-wb="rating" data-wb-value="4"></div>
```

### Read-Only Display

```html
<wb-rating value="4.5" half readonly></wb-rating>
```

### Interactive Input

```html
<wb-rating value="0" max="5"></wb-rating>
```

### Half Stars

```html
<wb-rating value="3.5" half></wb-rating>
```

### Custom Max

```html
<wb-rating value="7" max="10"></wb-rating>
```

### Sizes

```html
<wb-rating value="3" size="sm"></wb-rating>
<wb-rating value="3" size="md"></wb-rating>
<wb-rating value="3" size="lg"></wb-rating>
```

### Custom Icons

```html
<wb-rating value="3" icon="❤️"></wb-rating>
<wb-rating value="4" icon="👍"></wb-rating>
<wb-rating value="2" icon="🔥"></wb-rating>
```

### Disabled

```html
<wb-rating value="4" disabled></wb-rating>
```

## Generated Structure

```html
<div class="wb-rating" role="slider" aria-valuemin="0" aria-valuemax="5" aria-valuenow="3">
  <span class="wb-rating__star wb-rating__star--filled">★</span>
  <span class="wb-rating__star wb-rating__star--filled">★</span>
  <span class="wb-rating__star wb-rating__star--filled">★</span>
  <span class="wb-rating__star">★</span>
  <span class="wb-rating__star">★</span>
  <span class="wb-rating__value">3 / 5</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-rating` | Always | Base styling |
| `.wb-rating--readonly` | `readonly` | Read-only state |
| `.wb-rating--disabled` | `disabled` | Disabled state |
| `.wb-rating--sm` | `size="sm"` | Small size |
| `.wb-rating--md` | `size="md"` | Medium size |
| `.wb-rating--lg` | `size="lg"` | Large size |
| `.wb-rating__star--filled` | Star is filled | Filled star |
| `.wb-rating__star--half` | Half-filled star | Half star (when `half`) |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getValue()` | Gets current rating | `number` |
| `setValue(value)` | Sets rating value | - |
| `clear()` | Clears rating to 0 | - |
| `enable()` | Enables the rating | - |
| `disable()` | Disables the rating | - |

```javascript
const rating = document.querySelector('wb-rating');

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
| `--wb-rating-size` | `24px` | Star size |
| `--wb-rating-gap` | `2px` | Gap between stars |
| `--wb-rating-color` | `#fbbf24` | Filled star color |
| `--wb-rating-empty-color` | `#d1d5db` | Empty star color |
| `--wb-rating-hover-color` | `#f59e0b` | Hover color |

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
