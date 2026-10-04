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
| `showValue` | Boolean | `false` | Show current value above slider. |
| `showLabels` | Boolean | `false` | Show min/max labels below slider. |
| `valuePrefix` | String | `''` | Prefix for value (e.g., "$"). |
| `valueSuffix` | String | `''` | Suffix for value (e.g., "%"). |

No attribute name carries a dash — only the `x-` behavior prefix does (#1125). These were `show-value`, `show-labels`, `value-prefix` and `value-suffix` until #1140; the old spellings are still read, so existing markup keeps working, but write the camelCase ones.

### Booleans are bare
Write the attribute to switch it on and leave it out to switch it off:

```html
<input type="range" showValue>          <!-- on  -->
<input type="range">                    <!-- off -->
```

`showValue="false"` and `showValue="0"` also mean off. Until #1140 they meant **on**, because the behavior only asked whether the attribute was present — so markup that said "false" did the opposite of what it said.

## 3. Examples

### Example 1: Percentage Slider
A slider showing the percentage value.

<div x-demo>
<input
  type="range"
  showValue
  valueSuffix="%"
  min="0"
  max="100">
</div>

### Example 2: Price Range
A slider with currency formatting and bounds.

<div x-demo>
<input
  type="range"
  showValue
  showLabels
  valuePrefix="$"
  min="10"
  max="1000">
</div>

## 4. Why It Works
The behavior wraps the input in a container and injects an `<output>` element for the value and `<span>` elements for the labels. It attaches an `input` event listener to the range slider to update the text content of the `<output>` element in real-time.

Options are read through `readFlag` / `readAttr` (`src/core/read-attr.js`), which is why the camelCase name, the older dashed name and a `data-` prefixed name all work, and why `"false"` is false.
