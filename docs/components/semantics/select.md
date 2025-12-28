# Select Component Design & User Guide

## 1. Design Philosophy

The `select` component enhances the native `<select>` element with consistent styling across browsers. While it maintains the native dropdown behavior for maximum accessibility (especially on mobile), it adds hooks for searchability and clearability.

### Key Features
- **Unified Styling**: Consistent appearance on all platforms.
- **Searchable Hook**: Class marker for searchable variants.
- **API Access**: Helper methods for getting/setting values.

## 2. User Guide

### Basic Usage
Add `data-wb="select"` to a `<select>` element.

```html
<select data-wb="select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-searchable` | Boolean | `false` | Mark as searchable (styling only). |
| `data-placeholder` | String | `Select...` | Placeholder text. |

### API Methods
Access via `element.wbSelect`:
- `getValue()`: Get selected value.
- `setValue(v)`: Set value.
- `clear()`: Deselect all.

## 3. Examples

### Example 1: Styled Dropdown
A standard dropdown with custom styles.

```html
<select data-wb="select">
  <option value="1">One</option>
  <option value="2">Two</option>
</select>
```

### Example 2: Searchable Indicator
Visually distinct to indicate search capability.

```html
<select data-wb="select" data-searchable="true">
  <!-- options -->
</select>
```

## 4. Why It Works
The component applies CSS classes to override the default browser border, background, and padding. It exposes a JavaScript API (`wbSelect`) to make programmatic manipulation easier, abstracting away the native DOM properties.
