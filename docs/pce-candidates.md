# PCE (Pseudo-Custom Elements) – WB v3.0 (2026)

> **Version:** 3.0.0  
> **Last Updated:** 2026-01-17  
> **Status:** Active


## Overview

PCE (Pseudo-Custom Elements) enables semantic, schema-driven HTML using either the `wb-*` namespace or noun-first aliases. All PCEs are fully supported in WB v3.0 and are functionally equivalent to their behavior-attribute counterparts.


---

## Naming Conventions


### 1. WB Namespace (Recommended)
```html
<wb-cardprofile data-name="Sarah"></wb-cardprofile>
<wb-cardhero data-title="Welcome"></wb-cardhero>
<wb-cardstats data-value="1,234"></wb-cardstats>
```


### 2. Noun-First Aliases (Also Supported)
```html
<profile-card data-name="Sarah"></profile-card>
<hero-card data-title="Welcome"></hero-card>
<stats-card data-value="1,234"></stats-card>
```


### 3. Behavior Attribute (Traditional)
```html
<div x-behavior="cardprofile" data-name="Sarah"></div>
```


All three are equivalent and produce the same result. Use the `wb-*` form for maximum compatibility and future-proofing.

---


---

## WB v3.0 Architecture

| Feature | Description |
|---------|-------------|
| **Light DOM Only** | No Shadow DOM - elements enhanced in standard DOM |
| **Lazy Loading** | Behaviors loaded on-demand via IntersectionObserver |
| **WBServices Pattern** | Dependency injection for shared services |
| **HTMLElement Inheritance** | Components extend HTMLElement properly |
| **x-behavior Attribute** | Standard attribute for behavior declaration |

---


---

## Component Registry

### Card Components

| Tag (wb-*) | Tag (noun-first) | Behavior | Description |
|------------|------------------|----------|-------------|
| `<wb-card>` | `<basic-card>` | `card` | Basic card container |
| `<wb-cardprofile>` | `<profile-card>` | `cardprofile` | User profiles with avatar, bio |
| `<wb-cardhero>` | `<hero-card>` | `cardhero` | Large banner/hero sections |
| `<wb-cardstats>` | `<stats-card>` | `cardstats` | Dashboard statistics |
| `<wb-cardtestimonial>` | `<testimonial-card>` | `cardtestimonial` | User quotes with ratings |
| `<wb-cardvideo>` | `<video-card>` | `cardvideo` | Video content with controls |
| `<wb-cardfile>` | `<file-card>` | `cardfile` | File download/preview |
| `<wb-cardnotification>` | `<notification-card>` | `cardnotification` | Alert/Notice blocks |
| `<wb-cardimage>` | `<image-card>` | `cardimage` | Image with title/caption |
| `<wb-cardoverlay>` | `<overlay-card>` | `cardoverlay` | Image with text overlay |
| `<wb-cardportfolio>` | `<portfolio-card>` | `cardportfolio` | Portfolio/contact card |
| `<wb-cardlink>` | `<link-card>` | `cardlink` | Clickable link card |
| `<wb-cardhorizontal>` | `<horizontal-card>` | `cardhorizontal` | Side-by-side layout |
| `<wb-cardbutton>` | - | `cardbutton` | Card with button actions |
| `<wb-cardexpandable>` | - | `cardexpandable` | Expandable/collapsible |
| `<wb-cardminimizable>` | - | `cardminimizable` | Minimizable to title bar |
| `<wb-carddraggable>` | - | `carddraggable` | Draggable card |

### Layout Components

| Tag | Behavior | Description |
|-----|----------|-------------|
| `<wb-grid>` | `grid` | CSS Grid layout system |
| `<wb-flex>` | `flex` | Flexbox layout wrapper |
| `<wb-stack>` | `stack` | Vertical stacking layout |
| `<wb-cluster>` | `cluster` | Horizontal cluster with wrapping |
| `<wb-container>` | `container` | Centered content wrapper |
| `<wb-sidebar>` | `sidebarlayout` | Sidebar + main content |
| `<wb-center>` | `center` | Center content vertically/horizontally |
| `<wb-cover>` | `cover` | Full viewport cover |
| `<wb-masonry>` | `masonry` | Masonry grid layout |
| `<wb-switcher>` | `switcher` | Responsive row/column switch |
| `<wb-reel>` | `reel` | Horizontal scrolling |
| `<wb-frame>` | `frame` | Aspect ratio container |
| `<wb-sticky>` | `sticky` | Sticky positioning |
| `<wb-drawer>` | `drawerLayout` | Drawer/off-canvas |

### Feedback Components

| Tag | Behavior | Description |
|-----|----------|-------------|
| `<wb-spinner>` | `spinner` | Loading spinner |
| `<wb-avatar>` | `avatar` | User avatar |
| `<wb-badge>` | `badge` | Status badge |
| `<wb-alert>` | `alert` | Alert/feedback message |
| `<wb-progress>` | `progress` | Progress bar |
| `<wb-rating>` | `rating` | Star rating |
| `<wb-tabs>` | `tabs` | Tabbed interface |
| `<wb-switch>` | `switch` | Toggle switch |

### Other Components

| Tag | Behavior | Description |
|-----|----------|-------------|
| `<wb-icon>` | `icon` | Icon display |
| `<wb-mdhtml>` | `mdhtml` | Markdown to HTML |
| `<wb-codecontrol>` | `codecontrol` | Code theme selector |
| `<wb-collapse>` | `collapse` | Collapsible content |
| `<wb-darkmode>` | `darkmode` | Dark mode toggle |
| `<wb-dropdown>` | `dropdown` | Dropdown menu |
| `<wb-header>` | `header` | Page header |
| `<wb-footer>` | `footer` | Page footer |
| `<wb-globe>` | `globe` | 3D globe visualization |
| `<wb-stagelight>` | `stagelight` | Spotlight effect |
| `<wb-repeater>` | `repeater` | Data repeater |
| `<wb-control>` | `control` | Form control wrapper |

---


---

## How It Works

```
1. Detection
   └── IntersectionObserver sees <wb-cardprofile> in viewport
   
2. Lookup
   └── customElementMappings finds: { selector: 'wb-cardprofile', behavior: 'cardprofile' }
   
3. Dynamic Import
   └── import('/src/wb-viewmodels/cardprofile.js') - only if not cached
   
4. Hydration
   └── cardprofile(element, options) enhances the element in-place
```

---


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
     element.dataset.wbReady = 'mycomponent';
     
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


---

## Performance

| Metric | Traditional | PCE + Lazy Loading |
|--------|-------------|-------------------|
| Initial JS Load | ~200KB | ~15KB (core only) |
| Time to Interactive | ~2s | ~0.3s |
| Component Load | All upfront | On-demand |
| Memory Usage | High | Low (only visible) |

---


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


---

## Migration from Legacy Syntax

### Before (deprecated)
```html
<div data-wb="card" data-title="Hello">Content</div>
```

### After (v3.0)
```html
<wb-card data-title="Hello">Content</wb-card>
```

Or with behavior attribute:
```html
<article x-behavior="card" data-title="Hello">Content</article>
```

---


---

## References & Related Documentation

- See docs/builder/pages.md for schema-driven page builder rules
- See docs/plans/_today/TODO.md for current priorities
- See docs/builder.md for builder architecture
- See docs/plans/MVVM-MIGRATION.md for migration and architecture
- See docs/PAGE-BUILDER-RULES.md for content rules

- [WB Architecture](/docs/architecture/wb_internals.md)
- [Attribute Naming Standard](/docs/architecture/ATTRIBUTE-NAMING-STANDARD.md)
- [Escape Hatches](/docs/escape-hatches.md)
- [Custom Elements Manifest](/data/custom-elements.json)
