# Input Component Design & User Guide

## 1. Design Philosophy

The `input` component enhances the standard `<input>` field by wrapping it in a flexible container. This allows for features that are impossible with a naked input element, such as internal icons (prefix/suffix), clear buttons, and complex validation states, while maintaining the native input's accessibility and behavior.

### Key Features
- **Prefix/Suffix**: Add icons or text inside the input box.
- **Clearable**: One-click button to clear the field.
- **Validation States**: Visual feedback for success and error states.
- **Seamless Wrapping**: Automatically wraps the input without breaking layout.

## 2. User Guide

### Basic Usage
Add `data-wb="input"` to an `<input>` element.

```html
<input data-wb="input" type="text" placeholder="Enter text...">
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-variant` | String | `''` | Validation state: `success`, `error`. |
| `data-clearable` | Boolean | `false` | Show a clear (X) button when text is present. |
| `data-prefix` | String | `''` | Text/Icon to show at the start. |
| `data-suffix` | String | `''` | Text/Icon to show at the end. |

## 3. Examples

### Example 1: Search Field
A search input with a search icon and a clear button.

```html
<input 
  data-wb="input" 
  type="text" 
  placeholder="Search..." 
  data-prefix="🔍" 
  data-clearable="true">
```

### Example 2: Currency Input
An input formatted for currency entry.

```html
<input 
  data-wb="input" 
  type="number" 
  data-prefix="$" 
  data-suffix="USD">
```

## 4. Why It Works
The component creates a wrapper `div` and moves the input inside it. It then injects `span` elements for the prefix/suffix and a `button` for the clear action. The wrapper uses `display: flex` to align everything horizontally, simulating a single cohesive input control.
