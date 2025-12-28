# Dialog Component Design & User Guide

## 1. Design Philosophy

The `dialog` (or `modal`) component leverages the native HTML5 `<dialog>` element to provide a robust, accessible modal system. By using the native element, we gain built-in accessibility features like focus trapping, screen reader support, and standard keyboard navigation (ESC to close) without complex JavaScript polyfills.

### Key Features
- **Semantic Structure**: Uses `<header>`, `<main>`, and `<footer>` within the dialog.
- **Native Accessibility**: `aria-modal`, `aria-labelledby`, and focus management are handled by the browser.
- **Backdrop Support**: Uses the native `::backdrop` pseudo-element for dimming the background.
- **Size Variants**: Pre-defined sizes for consistent UI.

## 2. User Guide

### Basic Usage
Add `data-wb="dialog"` (or `data-wb="modal"`) to any element that should trigger the dialog. The dialog itself is created dynamically.

```html
<button 
  data-wb="dialog" 
  data-title="Welcome" 
  data-content="Hello World!">
  Open Dialog
</button>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-title` | String | `Dialog` | Title displayed in the header. |
| `data-content` | String | `''` | HTML content for the body. |
| `data-size` | String | `md` | Size: `sm`, `md`, `lg`, `xl`. |

### Events
- `wb:dialog:ok`: Fired on the trigger element when the "OK" button is clicked.

## 3. Examples

### Example 1: Confirmation Modal
A simple confirmation dialog.

```html
<button 
  data-wb="modal" 
  data-title="Confirm Action" 
  data-content="Are you sure you want to proceed?" 
  data-size="sm">
  Delete Item
</button>
```

### Example 2: Large Info Modal
A larger modal for displaying detailed information.

```html
<button 
  data-wb="modal" 
  data-title="Terms of Service" 
  data-content="<p>Full terms here...</p>" 
  data-size="lg">
  Read Terms
</button>
```

## 4. Why It Works
The component listens for a click on the trigger element. When clicked, it dynamically constructs a `<dialog>` element with the specified content and appends it to the `<body>`. It then calls the native `dialog.showModal()` method. When closed, the element is removed from the DOM to keep the page clean.
