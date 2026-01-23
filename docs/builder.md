# WB Builder – The Heart of the Framework (2026)
> **Version:** 3.1.0  
> **Last Updated:** 2026-01-18  
> **Status:** Active
---
## Overview

WB Builder is the architectural core of WB Behaviors v3.0. It enables a no-build, schema-driven, Light DOM approach for modern web development. All UI, logic, and styling are defined by JSON schemas, ESM viewmodels, and global CSS.

---

## Page Builder Interface

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🏗️ WB Page Builder    [Refresh][Reset][Test][Settings]    │
├──────────┬─────────────────────────────────────┬────────────┤
│          │                                     │            │
│  LEFT    │         CANVAS VIEWPORT             │   RIGHT    │
│  PANEL   │                                     │   PANEL    │
│          │  ┌─────────────────────────────┐    │            │
│  Pages   │  │ Home     /pages/home.html   │    │ Properties │
│  Tree    │  │ [x] Header  [x] Footer      │    │            │
│          │  ├─────────────────────────────┤    │            │
│          │  │ HEADER section              │    │            │
│          │  ├─────────────────────────────┤    │            │
│          │  │ + Element  + Component      │    │            │
│          │  │                             │    │            │
│          │  │ MAIN content area           │    │            │
│          │  │                             │    │            │
│          │  ├─────────────────────────────┤    │            │
│          │  │ FOOTER section              │    │            │
│          │  └─────────────────────────────┘    │            │
│          │                                     │            │
└──────────┴─────────────────────────────────────┴────────────┘
```

### Page Header/Footer Options

Each page has **optional header and footer**:

```
Page: Home     /pages/home.html
[✓] Header    [✓] Footer
```

- **Checkboxes** toggle header/footer visibility per page
- Default: both enabled (`showHeader: true, showFooter: true`)
- Stored in page config, not global

---

## Component Overlay

Every component on canvas has an **overlay bar** with:

```
┌──────────────────────────────────────────────────────┐
│ <wb-card>  [+ Element][+ Component][👁️][</>]  [🗑️] │
├──────────────────────────────────────────────────────┤
│                                                      │
│     Component content here                           │
│     (click to select and edit in Properties Panel)   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Overlay Buttons

| Button | Action |
|--------|--------|
| **[+ Element]** | Shows dropdown to add HTML element as child |
| **[+ Component]** | Shows dropdown to add WB component as child |
| **[👁️]** | Render view (default) - shows rendered component |
| **[</>]** | HTML view - shows formatted HTML source |
| **[🗑️]** | Delete component and all children |

### View Mode Toggle

Two display modes accessible from overlay:

| Button | Mode | Description |
|--------|------|-------------|
| 👁️ | **Render** | Shows rendered component (default) |
| </> | **HTML** | Shows formatted HTML source |

### Component Nesting

Each component overlay has **[+ Element]** and **[+ Component]** buttons to add children:

```
┌──────────────────────────────────────────────────────┐
│ <wb-card>  [+ Element][+ Component][👁️][</>]  [🗑️] │
├──────────────────────────────────────────────────────┤
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │ <wb-grid>  [+ Element][+ Component]...  [🗑️] │   │  ← Nested
│   ├──────────────────────────────────────────────┤   │
│   │     Grid content here                            │   │
│   └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Benefits:**
- **Auto-Generated IDs** - Every element gets a unique ID (e.g., `div-1705612345678-a3x9`)
- **Encapsulation** - Child components belong to parent
- **Hierarchical removal** - Delete parent removes all children
- **Visual nesting** - Clear parent/child relationships with distinct borders
- **Click to Edit** - Click any component content to see ALL its attributes in Properties Panel

| Button | Action |
|--------|--------|
| **[+ Element]** | Add HTML element (div, p, span, etc.) as child |
| **[+ Component]** | Add WB component (grid, card, etc.) as child |
| **[🗑️]** | Delete this component AND all its children |

```javascript
// Toggle programmatically
EditorToolbar.setViewMode('el-123456', 'html');   // Show HTML
EditorToolbar.setViewMode('el-123456', 'render'); // Show rendered
```

---

## Properties Panel

### Design Principles

1. **FLAT DISPLAY** - Categories and options always visible
2. **NO COLLAPSING** - Everything expanded by default
3. **NO HIDING** - Don't bury options in submenus

### Panel Structure

```
┌─────────────────────────────────┐
│ 🧩 <wb-card>                    │
│ #el-1705612345678               │
│                                 │
│ Card component description      │
├─────────────────────────────────┤
│ 🎨 Appearance                   │
│   variant  [default ▼]          │
│   size     [md ▼]               │
├─────────────────────────────────┤
│ 📐 Layout                       │
│   columns  [3 ▼]                │
│   gap      [1rem    ]           │
├─────────────────────────────────┤
│ 🏷️ HTML                         │
│   id       [        ]           │
│   class    [        ]           │
├─────────────────────────────────┤
│ 📝 Content                      │
│   [textarea for text content]   │
└─────────────────────────────────┘
```

### Category Icons

| Icon | Category | Contains |
|------|----------|----------|
| 🎨 | Appearance | variant, size, color, theme |
| 📐 | Layout | columns, gap, width, height, align, justify |
| 🔗 | Media | src, href, url, image, icon |
| 📝 | Content | title, subtitle, text, description |
| ⚙️ | State | disabled, readonly, checked, expanded |
| 🏷️ | HTML | id, class (standard attributes) |

### Input Types

| Attribute Type | Control |
|----------------|---------|
| Enum (options) | `<select>` dropdown |
| Boolean | `<input type="checkbox">` |
| Number | `<input type="number">` |
| Text/CSS | `<input type="text">` |
| Content | `<textarea>` |

---

## Dropdown Menus

### Design: FLAT Layout

Dropdowns show **category + items** without nesting:

```
┌─────────────────────────┐
│ 📦 Structure            │
│ <div> <section> <nav>   │
├─────────────────────────┤
│ 📝 Text                 │
│ <p> <h1> <h2> <span>    │
├─────────────────────────┤
│ 🔗 Inline               │
│ <a> <strong> <em>       │
└─────────────────────────┘
```

**NOT** nested submenus like:
```
❌ Structure ►  (hover to expand)
```

### Element Categories

| Category | Elements |
|----------|----------|
| 📦 Structure | div, section, article, main, header, footer, nav, aside |
| 📝 Text | p, h1-h4, span, blockquote, pre |
| 🔗 Inline | a, strong, em, code, mark |
| 📋 Lists | ul, ol, li |
| 📊 Table | table, tr, th, td |
| 📝 Forms | form, input, textarea, select, button, label |
| 🖼️ Media | img, video, audio, iframe |

### Component Categories

| Category | Components |
|----------|------------|
| Layout | wb-grid, wb-flex, wb-stack, wb-container, wb-sidebar |
| Content | wb-card, wb-tabs, wb-cardhero, wb-cardprofile |
| Page | wb-header, wb-footer |

---

## Dev Mode Behavior

### NO Notifications

In development mode, the builder operates silently:

- ❌ No toast messages
- ❌ No alert() dialogs
- ❌ No prompt() dialogs
- ❌ No confirmation popups
- ✅ Console logging only
- ✅ Inline editing

### Actions Are Immediate

| Action | Old Behavior | Dev Mode |
|--------|--------------|----------|
| Delete component | "Are you sure?" | Immediate delete |
| Add x-attribute | prompt() for value | Add empty, edit in panel |
| Create page | prompt() for name | Auto-generate name |
| Invalid input | alert() error | Console warning |

---

## Core Philosophy

### Zero-Build Architecture

No build tools required. WB Builder works directly in the browser using native ES modules and JSON-driven schemas.

```html
<!-- This just works. No compilation needed. -->
<wb-card title="Hello World" elevated>
  <p>Your content here</p>
</wb-card>
```

### Light DOM Only

All components use Light DOM (never Shadow DOM). This ensures:
- CSS works naturally (no piercing)
- Query selectors work as expected
- Screen readers see real DOM
- DevTools show actual elements

### Schema-First Development

Every component is defined by a JSON schema (see `src/wb-models/`). The schema is the single source of truth for structure, attributes, CSS API, and methods.

---

## Architecture Layers

### Layer 1: Schemas (`src/wb-models/*.schema.json`)

```json
{
  "$component": "card",
  "$tagName": "wb-card",
  "$description": "A versatile card container",
  "$attributes": {
    "title": { "type": "string" },
    "elevated": { "type": "boolean" }
  }
}
```

### Layer 2: ViewModels (`src/wb-viewmodels/*.js`)

```javascript
export function card(element, options = {}) {
  // Behavior logic
  return () => { /* cleanup */ };
}
```

### Layer 3: Styles (`src/styles/components/*.css`)

```css
.wb-card {
  --wb-card-padding: 1.5rem;
  --wb-card-radius: 8px;
  padding: var(--wb-card-padding);
  border-radius: var(--wb-card-radius);
}
```

---

## The Builder Pipeline

```
1. HTML Parser sees <wb-card>
   ↓
2. WB.init() scans for wb-* elements
   ↓
3. Schema Builder loads card.schema.json
   ↓
4. DOM is generated from $view definition
   ↓
5. Attributes are bound to element properties
   ↓
6. Behavior function (card.js) is called
   ↓
7. CSS auto-loads from /src/styles/components/card.css
   ↓
8. Component is ready to use
```

---

## Behavior System

170+ behaviors that enhance any HTML element:

```html
<button x-ripple>Click Me</button>
<div x-draggable>Move me</div>
<span x-tooltip="Hello!">Hover me</span>
<section x-fade-in>Appears on scroll</section>
```

---

## Key Benefits

| For Developers | For AI | For Performance |
|----------------|--------|-----------------|
| No build step | Deterministic output | No VDOM overhead |
| Standard HTML | Self-documenting | Lazy loading |
| Incremental adoption | Predictable structure | Minimal footprint |
| DevTools friendly | Schema validation | Direct DOM |

---

## File Locations

```
src/builder/
├── builder-editor-toolbar.js   # Main toolbar logic
├── builder-pages.js            # Page management
├── builder-export.js           # Save/Export
├── builder-state.js            # State management
└── views/
    ├── canvas-view.html        # Canvas with header/footer
    ├── properties-panel.html   # Right panel
    └── top-bar.html            # Action buttons

data/
├── custom-elements.json        # Component schema (908KB)
└── propertyconfig.json         # Property definitions
```

---

## API Reference

### EditorToolbar

```javascript
// Insert elements
EditorToolbar.insertElement('div');
EditorToolbar.insertComponent('wb-card');

// Selection
EditorToolbar.selectElement(wrapper);
EditorToolbar.removeElement('el-123');

// View modes
EditorToolbar.setViewMode('el-123', 'html');
EditorToolbar.setViewMode('el-123', 'render');

// Attributes
EditorToolbar.updateElementAttr('el-123', 'class', 'my-class');
EditorToolbar.updateElementContent('el-123', 'New text');
```

### Page Functions

```javascript
// Toggle header/footer
togglePageSection('header', true);   // Show header
togglePageSection('footer', false);  // Hide footer

// Update page property
updatePageProperty('showHeader', false);
```

---

## References

- `docs/builder-properties.md` - Property panel details
- `docs/PAGE-BUILDER-RULES.md` - Content rules
- `docs/MVVM-MIGRATION.md` - Architecture
- `BUILDER_SPECS.md` - Full specification

---

**Welcome to the No-Build Revolution.**
