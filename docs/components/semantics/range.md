# Range Component Design & User Guide

## 1. Design Philosophy

The `range` component improves the `<input type="range">` slider by adding contextual information that is often missing: the current value and the min/max bounds. This makes the slider more usable for precise input without requiring custom JavaScript from the developer.

### Key Features
- **Value Display**: Real-time update of the selected value.
- **Bound Labels**: Displays min and max values at the ends.
- **Formatting**: Supports prefixes (e.g., "$") and suffixes (e.g., "%").

## 2. User Guide

### Basic Usage
Add `data-wb="range"` to an `<input type="range">`.

```html
<input type="range" data-wb="range" min="0" max="100">
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-show-value` | Boolean | `false` | Show current value above slider. |
| `data-show-labels` | Boolean | `false` | Show min/max labels below slider. |
| `data-value-prefix` | String | `''` | Prefix for value (e.g., "$"). |
| `data-value-suffix` | String | `''` | Suffix for value (e.g., "%"). |

## 3. Examples

### Example 1: Percentage Slider
A slider showing the percentage value.

```html
<input 
  type="range" 
  data-wb="range" 
  data-show-value="true" 
  data-value-suffix="%" 
  min="0" 
  max="100">
```

### Example 2: Price Range
A slider with currency formatting and bounds.

```html
<input 
  type="range" 
  data-wb="range" 
  data-show-value="true" 
  data-show-labels="true" 
  data-value-prefix="$" 
  min="10" 
  max="1000">
```

## 4. Why It Works
The component wraps the input in a container and injects an `<output>` element for the value and `<span>` elements for the labels. It attaches an `input` event listener to the range slider to update the text content of the `<output>` element in real-time.
