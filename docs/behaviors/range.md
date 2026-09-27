# Range Behavior Design & User Guide

## 1. Design Philosophy

The `range` behavior improves the `<input type="range">` slider by adding contextual information that is often missing: the current value and the min/max bounds. This makes the slider more usable for precise input without requiring custom JavaScript from the developer.

### Key Features
- **Value Display**: Real-time update of the selected value.
- **Bound Labels**: Displays min and max values at the ends.
- **Formatting**: Supports prefixes (e.g., "$") and suffixes (e.g., "%").

## 2. User Guide

### Basic Usage
A plain `<input type="range">` gets this behavior automatically; there is no attribute to add. Writing `x-range` on it is redundant (#746).

<div x-demo>
<input
  type="range"
  min="0"
  max="100">
</div>

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `show-value` | Boolean | `false` | Show current value above slider. |
| `show-labels` | Boolean | `false` | Show min/max labels below slider. |
| `value-prefix` | String | `''` | Prefix for value (e.g., "$"). |
| `value-suffix` | String | `''` | Suffix for value (e.g., "%"). |

## 3. Examples

### Example 1: Percentage Slider
A slider showing the percentage value.

<div x-demo>
<input
  type="range"
  show-value="true"
  value-suffix="%"
  min="0"
  max="100">
</div>

### Example 2: Price Range
A slider with currency formatting and bounds.

<div x-demo>
<input
  type="range"
  show-value="true"
  show-labels="true"
  value-prefix="$"
  min="10"
  max="1000">
</div>

## 4. Why It Works
The behavior wraps the input in a container and injects an `<output>` element for the value and `<span>` elements for the labels. It attaches an `input` event listener to the range slider to update the text content of the `<output>` element in real-time.
