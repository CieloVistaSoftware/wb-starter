> **OBSOLETE — superseded by
> [`remove-wb-prefix-authoring-surface.md`](remove-wb-prefix-authoring-surface.md) (decided).**
> This document proposes *more* `wb-*` tags; the project is instead moving to an `x-*`
> attribute-based authoring surface (dual-maintained alongside existing `wb-*` tags
> indefinitely, no forced migration). The layout behaviors below are still worth exposing —
> just as `x-grid`, `x-flex`, `x-stack`, etc. on whatever semantic tag the author already
> chose, not as new custom tags. Kept here for historical reference only.

# Proposed Custom HTML Tags for Layouts

This document outlines a set of proposed custom HTML tags to expose the existing layout behaviors as semantic elements. This aligns with the "Pseudo-Custom Elements" (PCE) architecture.

## 1. Structural Layouts

These tags handle the arrangement of child elements.

| Tag | Behavior | Description | Implementation Config |
| :--- | :--- | :--- | :--- |
| `<div x-grid>` | `grid` | Standard CSS Grid layout. Supports `columns`, `gap`, `min-width`. | `{ selector: 'x-grid', behavior: 'grid' }` |
| `<div x-flex>` | `flex` | Flexbox layout. Supports `direction`, `wrap`, `justify`, `align`. | `{ selector: 'x-flex', behavior: 'flex' }` |
| `<div x-stack>` | `stack` | Vertical stack of items with consistent spacing. | `{ selector: 'x-stack', behavior: 'stack' }` |
| `<div x-cluster>` | `cluster` | Horizontal group of items (buttons, tags) that wrap automatically. | `{ selector: 'x-cluster', behavior: 'cluster' }` |
| `<div x-container>` | `container` | Versatile container. Can be a stack, row, or grid depending on configuration. | `{ selector: 'x-container', behavior: 'container' }` |

## 2. Page Layouts

These tags are designed for high-level page structure.

| Tag | Behavior | Description | Implementation Config |
| :--- | :--- | :--- | :--- |
| `<div x-sidebarlayout>` | `sidebarlayout` | Main content area with a fixed-width side panel. | `{ selector: 'x-sidebar', behavior: 'sidebarlayout' }` |
| `<div x-center>` | `center` | Centered content column with max-width (great for articles). | `{ selector: 'x-center', behavior: 'center' }` |
| `<div x-cover>` | `cover` | Full-screen "Hero" section that vertically centers its content. | `{ selector: 'x-cover', behavior: 'cover' }` |
| `<div x-masonry>` | `masonry` | Pinterest-style staggered grid layout. | `{ selector: 'x-masonry', behavior: 'masonry' }` |
| `<div x-switcher>` | `switcher` | Responsive layout that switches from horizontal to vertical based on container width. | `{ selector: 'x-switcher', behavior: 'switcher' }` |

## 3. Specialty Layouts

Specialized layout patterns for specific UI needs.

| Tag | Behavior | Description | Implementation Config |
| :--- | :--- | :--- | :--- |
| `<div x-reel>` | `reel` | Horizontal scrolling carousel (like Instagram stories). | `{ selector: 'x-reel', behavior: 'reel' }` |
| `<div x-frame>` | `frame` | Enforces a specific aspect ratio (16:9, 4:3) for media content. | `{ selector: 'x-frame', behavior: 'frame' }` |
| `<div x-sticky>` | `sticky` | Sticks an element to the top/bottom of the viewport while scrolling. | `{ selector: 'x-sticky', behavior: 'sticky' }` |
| `<div x-drawer>` | `drawerLayout` | Collapsible side drawer (off-canvas menu). | `{ selector: 'x-drawer', behavior: 'drawerLayout' }` |
| `<span x-icon>` | `icon` | Inline-flex layout for aligning SVG icons with text. | `{ selector: 'x-icon', behavior: 'icon' }` |

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

x-grid, x-flex, x-stack, x-cluster, x-container,
x-sidebar, x-center, x-cover, x-masonry, x-switcher,
x-reel, x-frame, x-sticky, x-drawer, x-icon {
  display: block;
}
```
