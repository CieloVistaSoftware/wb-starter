# Drawer Components - WB Framework v3.0

Two distinct drawer types with different purposes.

## 1. Drawer Layout (`<wb-drawer-layout>`)

A structural sidebar container that pushes content or sits alongside it.

### Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-drawer-layout>` |
| Behavior | `drawerLayout` |
| Base Class | `wb-drawer-layout` |
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

### Usage

```html
<wb-drawer-layout position="left" width="300px">
  <h3>Sidebar</h3>
  <nav>Navigation content...</nav>
</wb-drawer-layout>
```

### With Data Attributes

```html
<div data-wb="drawerLayout" data-wb-position="left" data-wb-width="300px">
  Drawer content...
</div>
```

---

## 2. Drawer Overlay (`<wb-drawer>`)

A modal panel that slides in over page content.

### Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-drawer>` |
| Behavior | `drawer` |
| Base Class | `wb-drawer` |
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
<button data-wb="drawer" 
        data-wb-title="Settings" 
        data-wb-content="<p>Settings content...</p>">
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
