# Button Component Design & User Guide

## 1. Design Philosophy

The `button` component enhances the standard `<button>` element with a robust design system. It supports multiple variants (primary, secondary, danger, etc.), sizes, and states (loading, disabled). The goal is to provide a consistent, accessible, and interactive button system that requires minimal CSS classes.

### Key Features
- **Variants**: Pre-defined styles for common use cases.
- **Sizes**: Small, medium, and large sizing options.
- **Loading State**: Built-in spinner support that disables interaction.
- **Icons**: Easy icon injection with positioning support.
- **Accessibility**: Automatically handles `disabled` and `aria` attributes.

## 2. User Guide

### Basic Usage
Add `data-wb="button"` to any `<button>` element.

```html
<button data-wb="button">Click Me</button>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-variant` | String | `primary` | Style variant: `primary`, `secondary`, `success`, `danger`, `warning`, `ghost`, `link`. |
| `data-size` | String | `md` | Size: `sm`, `md`, `lg`. |
| `data-icon` | String | `''` | Icon character or emoji to display. |
| `data-icon-position` | String | `left` | Position of the icon: `left`, `right`. |
| `data-loading` | Boolean | `false` | Show loading spinner. |
| `data-disabled` | Boolean | `false` | Disable the button. |

## 3. Examples

### Example 1: Variant Showcase
Different button styles for various contexts.

```html
<button data-wb="button" data-variant="primary">Save Changes</button>
<button data-wb="button" data-variant="danger">Delete</button>
<button data-wb="button" data-variant="ghost">Cancel</button>
```

### Example 2: Loading State with Icon
A button that shows a loading spinner and an icon.

```html
<button 
  data-wb="button" 
  data-variant="success" 
  data-icon="💾" 
  data-loading="true">
  Saving...
</button>
```

## 4. Why It Works
The component wraps the button's content to inject icons and spinners without destroying the original text. It uses CSS variables for theming, allowing for easy global customization. The `loading` state manages the `disabled` attribute to prevent double-submissions while providing visual feedback.
