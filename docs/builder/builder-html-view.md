# Builder Component HTML View

## Overview

Each component dropped into the builder canvas has a **Show HTML** button (`{ }`) that displays the raw HTML code of that component. This helps developers inspect and understand the generated markup.

## Feature Details

### Show HTML Button

Located in the component overlay (top bar of each dropped component), next to the delete button.

**Button States:**
- **Default (inactive):** Purple button showing `{ }` 
- **Active (HTML visible):** Green button, HTML code panel expanded below component

### Usage

1. Drop any component onto the canvas
2. Click the `{ }` button in the component's overlay bar
3. The visual preview hides and formatted HTML code appears
4. Click again to toggle back to visual preview

### HTML View Panel

- **Location:** Below the component overlay, replaces visual content when active
- **Max Height:** 300px with scroll for longer content
- **Formatting:** Auto-indented HTML with syntax-friendly monospace font
- **Read-only:** For inspection only, not editable

## CSS Classes

| Class | Description |
|-------|-------------|
| `.component-overlay-actions` | Container for action buttons (HTML, Delete) |
| `.component-html-btn` | The Show HTML toggle button |
| `.component-html-btn.active` | Active state when HTML is visible |
| `.component-html-view` | Container for the HTML code display |
| `.component-html-code` | The `<pre>` element with formatted code |

## JavaScript API

```javascript
// Toggle HTML view for a component
toggleComponentHtml(componentId, event);

// Available globally on window object
window.toggleComponentHtml('comp-0', null);
```

## Implementation Files

- **JavaScript:** `src/builder/builder-components.js`
  - `toggleComponentHtml()` - Toggle function
  - `formatHtml()` - HTML formatting helper
  - `escapeHtml()` - HTML entity escaping
  
- **CSS:** `src/styles/builder.css`
  - Button styles (`.component-html-btn`)
  - HTML view panel styles (`.component-html-view`)

## Related Tests

See `tests/compliance/builder-html-view.spec.ts` for compliance tests.
