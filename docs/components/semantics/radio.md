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
Add `data-wb="radio"` to an `<input type="radio">`.

```html
<input type="radio" name="option" data-wb="radio">
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-label` | String | `''` | Text label to display. |
| `data-variant` | String | `default` | Color variant. |
| `data-size` | String | `md` | Size: `sm`, `md`, `lg`. |

## 3. Examples

### Example 1: Radio Group
A standard group of options.

```html
<input type="radio" name="plan" data-wb="radio" data-label="Free Plan" value="free">
<input type="radio" name="plan" data-wb="radio" data-label="Pro Plan" value="pro">
```

### Example 2: Large Selection
Larger targets for touch devices.

```html
<input 
  type="radio" 
  name="size" 
  data-wb="radio" 
  data-size="lg" 
  data-label="Extra Large">
```

## 4. Why It Works
Similar to the checkbox, it checks for a parent `<label>`. If missing, it creates one to wrap the input and the text. This ensures that clicking the text label selects the radio button. The custom styling is applied via CSS classes that override the default browser appearance using `appearance: none` (or similar techniques in the CSS).
