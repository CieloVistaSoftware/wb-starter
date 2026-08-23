# PCE (Pseudo-Custom Elements) - WB-Starter v3.0

> **Version:** 3.0  
> **Updated:** 2026-01-14

## Overview

PCE (Pseudo-Custom Elements) allows you to use **semantic tag names** instead of generic divs with behavior attributes. WB v3.0 supports two naming conventions that are functionally equivalent.

## Naming Conventions

### 1. WB Namespace (Recommended)
```html
<wb-cardprofile name="Sarah"></div>
<wb-cardhero title="Welcome"></article>
<articlestats value="1,234"></div>
```

### 2. Noun-First Aliases (Also Supported)
```html
<profile-card name="Sarah"></profile-card>
<hero-card title="Welcome"></hero-card>
<stats-card value="1,234"></stats-card>
```

### 3. Behavior Attribute (Traditional)
```html
<div
  x-behavior="cardprofile"
  name="Sarah">
</div>
```

All three are equivalent and produce the same result.

---

## WB v3.0 Architecture

| Feature | Description |
|---------|-------------|
| **Light DOM Only** | No Shadow DOM - elements enhanced in standard DOM |
| **Lazy Loading** | Behaviors loaded on-demand via IntersectionObserver |
| **WBServices Pattern** | Dependency injection for shared services |
| **Composition over Inheritance** | Capability is applied by behavior functions `(element, options)`; no component base class |
| **x-behavior Attribute** | Standard attribute for behavior declaration |

---

## Component Registry

### Card Components

| Tag (wb-*) | Tag (noun-first) | Behavior | Description |
|------------|------------------|----------|-------------|
| `<article>` | `<basic-card>` | `card` | Basic card container |
| `<div x-cardprofile>` | `<profile-card>` | `cardprofile` | User profiles with avatar, bio |
| `<article x-cardhero>` | `<hero-card>` | `cardhero` | Large banner/hero sections |
| `<articlestats>` | `<stats-card>` | `cardstats` | Dashboard statistics |
| `<div x-cardtestimonial>` | `<testimonial-card>` | `cardtestimonial` | User quotes with ratings |
| `<article x-cardvideo>` | `<video-card>` | `cardvideo` | Video content with controls |
| `<div x-cardfile>` | `<file-card>` | `cardfile` | File download/preview |
| `<div x-cardnotification>` | `<notification-card>` | `cardnotification` | Alert/Notice blocks |
| `<article x-cardimage>` | `<image-card>` | `cardimage` | Image with title/caption |
| `<div x-cardoverlay>` | `<overlay-card>` | `cardoverlay` | Image with text overlay |
| `<div x-cardportfolio>` | `<portfolio-card>` | `cardportfolio` | Portfolio/contact card |
| `<div x-cardlink>` | `<link-card>` | `cardlink` | Clickable link card |
| `<div x-cardhorizontal>` | `<horizontal-card>` | `cardhorizontal` | Side-by-side layout |
| `<div x-cardbutton>` | - | `cardbutton` | Card with button actions |
| `<div x-cardexpandable>` | - | `cardexpandable` | Expandable/collapsible |
| `<div x-cardminimizable>` | - | `cardminimizable` | Minimizable to title bar |
| `<div x-carddraggable>` | - | `carddraggable` | Draggable card |

### Layout Components

| Tag | Behavior | Description |
|-----|----------|-------------|
| `<wb-grid>` | `grid` | CSS Grid layout system |
| `<wb-flex>` | `flex` | Flexbox layout wrapper |
| `<div x-stack>` | `stack` | Vertical stacking layout |
| `<div x-cluster>` | `cluster` | Horizontal cluster with wrapping |
| `<wb-container>` | `container` | Centered content wrapper |
| `<wb-sidebar>` | `sidebarlayout` | Sidebar + main content |
| `<wb-center>` | `center` | Center content vertically/horizontally |
| `<wb-cover>` | `cover` | Full viewport cover |
| `<wb-masonry>` | `masonry` | Masonry grid layout |
| `<wb-switcher>` | `switcher` | Responsive row/column switch |
| `<wb-reel>` | `reel` | Horizontal scrolling |
| `<wb-frame>` | `frame` | Aspect ratio container |
| `<div x-sticky>` | `sticky` | Sticky positioning |
| `<div x-drawer>` | `drawerLayout` | Drawer/off-canvas |

### Feedback Components

| Tag | Behavior | Description |
|-----|----------|-------------|
| `<div x-spinner>` | `spinner` | Loading spinner |
| `<div x-avatar>` | `avatar` | User avatar |
| `<div x-badge>` | `badge` | Status badge |
| `<div x-alert>` | `alert` | Alert/feedback message |
| `<progress>` | `progress` | Progress bar |
| `<div x-rating>` | `rating` | Star rating |
| `<nav x-tabs>` | `tabs` | Tabbed interface |
| `<div x-switch>` | `switch` | Toggle switch |

### Other Components

| Tag | Behavior | Description |
|-----|----------|-------------|
| `<wb-icon>` | `icon` | Icon display |
| `<div x-mdhtml>` | `mdhtml` | Markdown to HTML |
| `<div x-codecontrol>` | `codecontrol` | Code theme selector |
| `<div x-collapse>` | `collapse` | Collapsible content |
| `<div x-darkmode>` | `darkmode` | Dark mode toggle |
| `<div x-dropdown>` | `dropdown` | Dropdown menu |
| `<header>` | `header` | Page header |
| `<footer>` | `footer` | Page footer |
| `<div x-globe>` | `globe` | 3D globe visualization |
| `<div x-stagelight>` | `stagelight` | Spotlight effect |
| `<div x-repeater>` | `repeater` | Data repeater |
| `<div x-control>` | `control` | Form control wrapper |

---

## How It Works

```
1. Detection
   └── IntersectionObserver sees <div x-cardprofile> in viewport
   
2. Lookup
   └── customElementMappings finds: { selector: 'wb-cardprofile', behavior: 'cardprofile' }
   
3. Dynamic Import
   └── import('/src/wb-viewmodels/cardprofile.js') - only if not cached
   
4. Hydration
   └── cardprofile(element, options) enhances the element in-place
```

---

## Registry Configuration

The registry is defined in `src/core/wb-lazy.js`:

```javascript
const customElementMappings = [
  // wb-* prefix (primary)
  { selector: 'wb-card', behavior: 'card' },
  { selector: 'wb-cardprofile', behavior: 'cardprofile' },
  { selector: 'wb-cardhero', behavior: 'cardhero' },
  { selector: 'wb-cardstats', behavior: 'cardstats' },
  // ...
  
  // noun-first aliases
  { selector: 'profile-card', behavior: 'cardprofile' },
  { selector: 'hero-card', behavior: 'cardhero' },
  { selector: 'stats-card', behavior: 'cardstats' },
  // ...
];
```

---

## Adding New PCE Components

1. **Add mapping** to `customElementMappings` in `src/core/wb-lazy.js`:
   ```javascript
   { selector: 'wb-mycomponent', behavior: 'mycomponent' },
   { selector: 'my-component', behavior: 'mycomponent' },  // optional alias
   ```

2. **Create behavior** in `src/wb-viewmodels/mycomponent.js`:
   ```javascript
   export function mycomponent(element, options = {}) {
     // Enhance element
     element.classList.add("wb-ready");
     
     return () => {
       // Cleanup function
     };
   }
   
   export default mycomponent;
   ```

3. **Register in index** at `src/wb-viewmodels/index.js`:
   ```javascript
   export { mycomponent } from './mycomponent.js';
   ```

4. **Add schema** (optional) at `src/wb-models/mycomponent.schema.json`

5. **Update VS Code IntelliSense** (optional):
   ```bash
   node scripts/generate-custom-elements.js
   ```

---

## Performance

| Metric | Traditional | PCE + Lazy Loading |
|--------|-------------|-------------------|
| Initial JS Load | ~200KB | ~15KB (core only) |
| Time to Interactive | ~2s | ~0.3s |
| Component Load | All upfront | On-demand |
| Memory Usage | High | Low (only visible) |

---

## Testing

```bash
# Run PCE-specific tests
npx playwright test tests/behaviors/pce.spec.ts
npx playwright test tests/behaviors/pce-demo.spec.ts

# View test page
# http://localhost:3000/demos/pce-test.html
```

---

## Migration from Legacy Syntax

### Before (deprecated)
```html
<div
  x-card
  title="Hello">
  Content
</div>
```

### After (v3.0)
```html
<wb-card title="Hello">Content</article>
```

Or with behavior attribute:
```html
<article
  x-behavior="card"
  title="Hello">
  Content
</article>
```

---

## Related Documentation

- WB Architecture
- [Attribute Naming Standard](./architecture/standards/ATTRIBUTE-NAMING-STANDARD.md)
- [Escape Hatches](./escape-hatches.md)
- [Custom Elements Manifest](/data/custom-elements.json)
