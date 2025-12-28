# Progress Component Design & User Guide

## 1. Design Philosophy

The `progress` component transforms the native `<progress>` element into a highly customizable visual indicator. It overcomes the notorious difficulty of styling progress bars across different browsers and adds modern features like animations, indeterminate states, and embedded labels.

### Key Features
- **Cross-Browser Styling**: Consistent look on WebKit, Gecko, and Blink.
- **Animations**: Striped animations for active states.
- **Indeterminate Mode**: Animated state for unknown durations.
- **Embedded Labels**: Text overlay showing the percentage.
- **Contextual Colors**: Support for success, warning, danger, etc.

## 2. User Guide

### Basic Usage
Add `data-wb="progress"` to a `<progress>` element.

```html
<progress data-wb="progress" value="50" max="100"></progress>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-value` | Number | `0` | Current value. |
| `data-max` | Number | `100` | Maximum value. |
| `data-variant` | String | `primary` | Color: `primary`, `success`, `warning`, `danger`, `info`. |
| `data-size` | String | `md` | Height: `sm`, `md`, `lg`, `xl`. |
| `data-show-label` | Boolean | `false` | Show percentage text. |
| `data-animated` | Boolean | `true` | Animate the bar texture. |
| `data-indeterminate` | Boolean | `false` | Indeterminate state. |

### API Methods
Access via `element.wbProgress`:
- `setValue(v)`: Update value.
- `setMax(m)`: Update max.
- `setIndeterminate(bool)`: Toggle indeterminate state.

## 3. Examples

### Example 1: File Upload
A labeled progress bar for a task.

```html
<progress 
  data-wb="progress" 
  value="75" 
  max="100" 
  data-show-label="true" 
  data-variant="success">
</progress>
```

### Example 2: Loading Spinner Alternative
An indeterminate bar for loading states.

```html
<progress 
  data-wb="progress" 
  data-indeterminate="true" 
  data-variant="info">
</progress>
```

## 4. Why It Works
The component injects a `<style>` block into the document head to handle the complex vendor-specific pseudo-elements (`::-webkit-progress-bar`, `::-moz-progress-bar`, etc.). This ensures the styles are applied correctly without polluting the global CSS. The indeterminate animation uses CSS keyframes to slide a gradient back and forth.
