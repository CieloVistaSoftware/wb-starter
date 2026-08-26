# Drawer Components - wb-starter v3.0

Two distinct drawer types with different purposes.

## 1. Drawer Layout (`<div x-drawer-layout>`)

A structural sidebar container that pushes content or sits alongside it.

### Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-drawer-layout>` |
| Behavior | `drawerLayout` |
| Root CSS Class | `x-drawer-layout` |
| Schema | `src/wb-models/drawerLayout.schema.json` |

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `position` | string | `"left"` | Side: `left`, `right`, `top`, `bottom` |
| `width` | string | `"250px"` | Expanded width (left/right) |
| `height` | string | `"250px"` | Expanded height (top/bottom) |
| `minWidth` | string | `"1rem"` | Collapsed width |
| `minHeight` | string | `"1rem"` | Collapsed height |
| `maxWidth` | string | `"50vw"` | Maximum width |
| `maxHeight` | string | `"50vh"` | Maximum height |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<div x-drawer-layout
  position="left"
  width="300px">
  <h3>Sidebar</h3>
  <nav>Navigation content...</nav>
</div>
</div>

### With Data Attributes

```html
<div
  x-drawer-layout
  position="left"
  width="300px">
  Drawer content...
</div>
```

---

## 2. Drawer Overlay (`<div x-drawer>`)

A modal panel that slides in over page content.

### Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-drawer>` |
| Behavior | `drawer` |
| Root CSS Class | `x-drawer` |
| Schema | `src/wb-models/drawer.schema.json` |

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `"Drawer"` | Header title |
| `content` | string | `""` | HTML content |
| `position` | string | `"right"` | Slide direction: `left`, `right` |
| `width` | string | `"320px"` | Panel width |

### Usage

```html
<button
  x-drawer
  title="Settings"
  content="<p>Settings content...</p>">
  Open Settings
</button>
```

### JavaScript API

```javascript
import { drawer } from './wb-viewmodels/overlay.js';

const button = document.querySelector('#my-btn');
drawer(button, {
  title: 'My Drawer',
  content: 'Content here',
  position: 'left'
});
```

## Events

### wb:drawer:open
```javascript
drawer.addEventListener('wb:drawer:open', (e) => {
  console.log('Drawer opened:', e.detail.title);
});
```

### wb:drawer:close
```javascript
drawer.addEventListener('wb:drawer:close', () => {
  console.log('Drawer closed');
});
```
