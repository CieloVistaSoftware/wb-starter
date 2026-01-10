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
The `dialog` behavior is automatically injected into `<dialog>` elements.

```html
<dialog>
  <header>
    <h2>Title</h2>
    <button onclick="this.closest('dialog').close()">×</button>
  </header>
  <main>
    <p>Content</p>
  </main>
  <footer>
    <button onclick="this.closest('dialog').close()">Close</button>
  </footer>
</dialog>
```

### Trigger Usage (Dynamic)
Add `data-wb="dialog"` to a button to create a dialog dynamically.

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

### Example 1: Semantic Dialog
A standard HTML5 dialog.

```html
<button onclick="document.getElementById('my-dialog').showModal()">Open</button>

<dialog id="my-dialog">
  <h3>Hello!</h3>
  <p>This is a native dialog.</p>
  <button onclick="this.closest('dialog').close()">Close</button>
</dialog>
```

### Example 2: Dynamic Confirmation Modal
A simple confirmation dialog triggered by a button.

```html
<button 
  data-wb="modal" 
  data-title="Confirm Action" 
  data-content="Are you sure you want to proceed?" 
  data-size="sm">
  Delete Item
</button>
```

## 4. Why It Works
The component listens for a click on the trigger element. When clicked, it dynamically constructs a `<dialog>` element with the specified content and appends it to the `<body>`. It then calls the native `dialog.showModal()` method. When closed, the element is removed from the DOM to keep the page clean.
