# Radio Component Design & User Guide

## 1. Design Philosophy

The `radio` component modernizes the `<input type="radio">` element. Like the checkbox component, it focuses on providing a consistent, custom appearance while maintaining the native radio group behavior and accessibility.

### Key Features
- **Custom Styling**: Replaces browser defaults with a clean, scalable design.
- **Label Integration**: Automatically wraps input in a label for better click targets.
- **Size Variants**: Configurable sizes for different contexts.
- **Group Logic**: Works seamlessly with native `name` attributes for grouping.

## 2. User Guide

### Basic Usage
Add `x-radio` to an `<input type="radio">`.

```html
<input
  type="radio"
  name="option"
  x-radio>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | String | `''` | Text label to display. |
| `variant` | String | `default` | Color variant. |
| `size` | String | `md` | Size: `sm`, `md`, `lg`. |

## 3. Examples

### Example 1: Radio Group
A standard group of options.

```html
<input
  type="radio"
  name="plan"
  x-radio
  label="Free Plan"
  value="free">
<input
  type="radio"
  name="plan"
  x-radio
  label="Pro Plan"
  value="pro">
```

### Example 2: Large Selection
Larger targets for touch devices.

```html
<input
  type="radio"
  name="size"
  x-radio
  size="lg"
  label="Extra Large">
```

## 4. Why It Works
Similar to the checkbox, it checks for a parent `<label>`. If missing, it creates one to wrap the input and the text. This ensures that clicking the text label selects the radio button. The custom styling is applied via CSS classes that override the default browser appearance using `appearance: none` (or similar techniques in the CSS).
