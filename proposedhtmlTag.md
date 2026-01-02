# Proposed Custom HTML Tags for Layouts

This document outlines a set of proposed custom HTML tags to expose the existing layout behaviors as semantic elements. This aligns with the "Pseudo-Custom Elements" (PCE) architecture.

## 1. Structural Layouts

These tags handle the arrangement of child elements.

| Tag | Behavior | Description | Implementation Config |
| :--- | :--- | :--- | :--- |
| `<wb-grid>` | `grid` | Standard CSS Grid layout. Supports `columns`, `gap`, `min-width`. | `{ selector: 'wb-grid', behavior: 'grid' }` |
| `<wb-flex>` | `flex` | Flexbox layout. Supports `direction`, `wrap`, `justify`, `align`. | `{ selector: 'wb-flex', behavior: 'flex' }` |
| `<wb-stack>` | `stack` | Vertical stack of items with consistent spacing. | `{ selector: 'wb-stack', behavior: 'stack' }` |
| `<wb-cluster>` | `cluster` | Horizontal group of items (buttons, tags) that wrap automatically. | `{ selector: 'wb-cluster', behavior: 'cluster' }` |
| `<wb-container>` | `container` | Versatile container. Can be a stack, row, or grid depending on configuration. | `{ selector: 'wb-container', behavior: 'container' }` |

## 2. Page Layouts

These tags are designed for high-level page structure.

| Tag | Behavior | Description | Implementation Config |
| :--- | :--- | :--- | :--- |
| `<wb-sidebar>` | `sidebarlayout` | Main content area with a fixed-width side panel. | `{ selector: 'wb-sidebar', behavior: 'sidebarlayout' }` |
| `<wb-center>` | `center` | Centered content column with max-width (great for articles). | `{ selector: 'wb-center', behavior: 'center' }` |
| `<wb-cover>` | `cover` | Full-screen "Hero" section that vertically centers its content. | `{ selector: 'wb-cover', behavior: 'cover' }` |
| `<wb-masonry>` | `masonry` | Pinterest-style staggered grid layout. | `{ selector: 'wb-masonry', behavior: 'masonry' }` |
| `<wb-switcher>` | `switcher` | Responsive layout that switches from horizontal to vertical based on container width. | `{ selector: 'wb-switcher', behavior: 'switcher' }` |

## 3. Specialty Layouts

Specialized layout patterns for specific UI needs.

| Tag | Behavior | Description | Implementation Config |
| :--- | :--- | :--- | :--- |
| `<wb-reel>` | `reel` | Horizontal scrolling carousel (like Instagram stories). | `{ selector: 'wb-reel', behavior: 'reel' }` |
| `<wb-frame>` | `frame` | Enforces a specific aspect ratio (16:9, 4:3) for media content. | `{ selector: 'wb-frame', behavior: 'frame' }` |
| `<wb-sticky>` | `sticky` | Sticks an element to the top/bottom of the viewport while scrolling. | `{ selector: 'wb-sticky', behavior: 'sticky' }` |
| `<wb-drawer>` | `drawerLayout` | Collapsible side drawer (off-canvas menu). | `{ selector: 'wb-drawer', behavior: 'drawerLayout' }` |
| `<wb-icon>` | `icon` | Inline-flex layout for aligning SVG icons with text. | `{ selector: 'wb-icon', behavior: 'icon' }` |

---

## Implementation Context

To enable these tags, these config objects need to be added to the `customElementMappings` array in `src/core/wb-lazy.js`.

```javascript
// src/core/wb-lazy.js

const customElementMappings = [
  // ... existing card mappings ...
  
  // Insert the config objects from the tables above here
];
```

### CSS Requirements

For these custom elements to behave correctly before the JavaScript loads (to minimize Cumulative Layout Shift), we should add a basic display rule to the global CSS:

```css
/* src/styles/site.css */

wb-grid, wb-flex, wb-stack, wb-cluster, wb-container,
wb-sidebar, wb-center, wb-cover, wb-masonry, wb-switcher,
wb-reel, wb-frame, wb-sticky, wb-drawer, wb-icon {
  display: block;
}
```
