# Drawer Components

The system provides two distinct types of "Drawer" components, each serving a different purpose:

1. **Drawer Layout (`drawerLayout`)**: A structural sidebar container that pushes content or sits alongside it. It can be collapsed and expanded.
2. **Drawer Overlay (`drawer`)**: A temporary modal panel that slides in over the page content when triggered by a button.

---

## 1. Drawer Layout (`drawerLayout`)

The Drawer Layout is a container component used to build sidebar layouts. It sits in the document flow and can be toggled between a full width and a collapsed "sliver" state.

### Usage

```html
<div data-wb="drawerLayout" data-position="left" data-width="300px">
  <!-- Drawer Content Goes Here -->
  <h3>Sidebar</h3>
  <nav>...</nav>
</div>
```

### Configuration Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-position` | `left` | Which side the drawer is on. Options: `left`, `right`, `top`, `bottom`. |
| `data-width` | `250px` | The width of the drawer when fully open (for left/right). |
| `data-height` | `250px` | The height of the drawer when fully open (for top/bottom). |
| `data-min-width` | `1rem` | The width of the drawer when collapsed (for left/right). |
| `data-min-height` | `1rem` | The height of the drawer when collapsed (for top/bottom). |
| `data-max-width` | `50vw` | The maximum width the drawer can grow to. |
| `data-max-height` | `50vh` | The maximum height the drawer can grow to. |

### Behavior

- **Toggle Button**: Automatically generates a toggle arrow button on the edge of the drawer.
- **Collapsing**: When clicked, the drawer shrinks to `data-min-width` or `data-min-height` (default `1rem`). Content is hidden.
- **Expanding**: When clicked again, it restores to `data-width` or `data-height`.
- **Direction**: 
  - If `position="left"`, the arrow points `◀` (collapse) or `▶` (expand).
  - If `position="right"`, the arrow points `▶` (collapse) or `◀` (expand).
  - If `position="top"`, the arrow points `▲` (collapse) or `▼` (expand).
  - If `position="bottom"`, the arrow points `▼` (collapse) or `▲` (expand).

---

## 2. Drawer Overlay (`drawer`)

The Drawer Overlay is an **Action** behavior. It is attached to a button or element that, when clicked, triggers a modal panel to slide in from the side of the screen. This panel exists outside the normal page flow (in the `body`).

### Usage

```html
<button data-wb="drawer" 
        data-drawer-title="Settings" 
        data-drawer-content="<p>Settings content...</p>">
  Open Settings
</button>
```

### Configuration Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-drawer-title` | `Drawer` | The title displayed in the header of the overlay. |
| `data-drawer-content` | (empty) | HTML content to display inside the drawer body. |
| `data-position` | `right` | Which side the drawer slides in from. Options: `left`, `right`. |
| `data-width` | `320px` | The width of the overlay panel. |

### JavaScript Usage

You can also trigger drawers programmatically:

```javascript
import { drawer } from './behaviors/js/overlay.js';

const myButton = document.querySelector('#my-btn');
drawer(myButton, {
  title: 'My Custom Drawer',
  content: 'Hello World',
  position: 'left'
});
```

---

## Schemas

### Drawer Layout Schema (`drawerLayout.schema.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Drawer Layout",
  "description": "Collapsible sidebar layout container",
  "behavior": "drawerLayout",
  "properties": {
    "position": {
      "type": "string",
      "description": "Side of the screen the drawer is attached to",
      "enum": ["left", "right"],
      "default": "left"
    },
    "width": {
      "type": "string",
      "description": "Width of the drawer when expanded",
      "default": "250px"
    },
    "minWidth": {
      "type": "string",
      "description": "Width of the drawer when collapsed",
      "default": "1rem"
    },
    "maxWidth": {
      "type": "string",
      "description": "Maximum width of the drawer",
      "default": "50vw"
    }
  }
}
```

### Drawer Overlay Schema (`drawer.schema.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Drawer Overlay",
  "description": "Button-triggered slide-out panel overlay",
  "behavior": "drawer",
  "properties": {
    "title": {
      "type": "string",
      "description": "Drawer title displayed in header",
      "default": "Drawer"
    },
    "content": {
      "type": "string",
      "description": "Drawer body content (HTML allowed)",
      "default": "Drawer content"
    },
    "position": {
      "type": "string",
      "description": "Side to slide in from",
      "enum": ["left", "right"],
      "default": "right"
    },
    "width": {
      "type": "string",
      "description": "Width of the drawer panel",
      "default": "320px"
    }
  }
}
```
