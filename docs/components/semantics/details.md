# Details Component Design & User Guide

## 1. Design Philosophy

The `details` component enhances the native HTML5 `<details>` and `<summary>` elements. It provides a consistent, styled accordion interface without breaking native browser functionality. It adds smooth animations and custom events, which are missing from the default implementation.

### Key Features
- **Native Foundation**: Uses standard HTML5 semantics for accessibility.
- **Custom Styling**: Replaces default browser markers with custom icons.
- **Animation**: Smooth expansion and collapse transitions.
- **Events**: Dispatches `wb:details:toggle` events for state tracking.

## 2. User Guide

### Basic Usage
The `details` behavior is automatically injected into `<details>` elements.

```html
<details>
  <summary>More Info</summary>
  <p>Hidden content here.</p>
</details>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-open` | Boolean | `false` | Open the details by default. |
| `data-animated` | Boolean | `true` | Enable smooth transitions. |
| `data-summary` | String | `Details` | Summary text (if creating from non-details element). |

### API Methods
Access via `element.wbDetails`:
- `toggle()`: Toggle state.
- `open()`: Open.
- `close()`: Close.
- `isOpen`: Boolean property.

## 3. Examples

### Example 1: Standard Accordion
A standard expandable section.

```html
<details>
  <summary>System Requirements</summary>
  <ul>
    <li>Node.js 14+</li>
    <li>2GB RAM</li>
  </ul>
</details>
```

### Example 2: Auto-Conversion
Converting a `div` into a details element.

```html
<div data-wb="details" data-summary="Click to Reveal">
  <p>This content was hidden inside a div!</p>
</div>
```

## 4. Why It Works
If the target element is not a `<details>` tag, the component replaces it with one, preserving the original content. It injects a custom marker icon into the `<summary>` and uses CSS transitions on the icon rotation to indicate state. The native `toggle` event is listened to for syncing the UI.
