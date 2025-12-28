# Checkbox Component Design & User Guide

## 1. Design Philosophy

The `checkbox` component modernizes the native `<input type="checkbox">` by wrapping it in a custom UI while maintaining native accessibility. It solves the common problem of styling checkboxes consistently across browsers and adds support for the "indeterminate" state often used in nested lists.

### Key Features
- **Custom Styling**: Replaces browser defaults with a consistent design.
- **Label Integration**: Automatically wraps the input in a label if text is provided.
- **Indeterminate State**: Visual support for the "partially checked" state.
- **Sizes & Variants**: Configurable size and color themes.

## 2. User Guide

### Basic Usage
Add `data-wb="checkbox"` to an `<input type="checkbox">`.

```html
<input type="checkbox" data-wb="checkbox" />
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-label` | String | `''` | Text label to display next to the checkbox. |
| `data-variant` | String | `default` | Color variant. |
| `data-size` | String | `md` | Size: `sm`, `md`, `lg`. |
| `data-indeterminate` | Boolean | `false` | Set the checkbox to indeterminate state. |

## 3. Examples

### Example 1: Labeled Checkbox
A checkbox with an associated label.

```html
<input 
  type="checkbox" 
  data-wb="checkbox" 
  data-label="I agree to the terms" 
  data-variant="primary" 
/>
```

### Example 2: Indeterminate State
Useful for "Select All" functionality where only some items are selected.

```html
<input 
  type="checkbox" 
  data-wb="checkbox" 
  data-label="Select All" 
  data-indeterminate="true" 
/>
```

## 4. Why It Works
The component checks if the input is already inside a `<label>`. If not, and a `data-label` is provided, it creates a wrapper `<label>` element and moves the input inside it. This ensures the text is clickable to toggle the checkbox. The `indeterminate` property is set via JavaScript, as there is no HTML attribute for it.
