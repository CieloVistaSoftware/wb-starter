# WB Builder Properties Panel

## Overview

The Properties Panel is the right-side panel in the WB Builder that allows users to edit component properties. It provides a structured, categorized view of all editable properties for the selected component.

## Initial State

**All sections start COLLAPSED.** The user must click on a section header (Header, Main, Footer) to expand it and see the templates within. This prevents overwhelming new users and lets them focus on one section at a time.

- No section is active/highlighted by default
- No filter hint is shown until user clicks a section
- Clicking a section header expands that section and shows its templates
- The canvas section becomes highlighted (green) when selected

## Panel Structure

```
┌─────────────────────────────────────────┐
│  🌳  ⚙️  🎨     ← Tab Icons (1.5rem)   │
├─────────────────────────────────────────┤
│                                         │
│  Component Name                    ❓   │
│                                         │
├─────────────────────────────────────────┤
│  🆔 Element ID              ▼  ←TOGGLE │
│  ├─ id: [auto-generated-id]            │
│                                         │
├─────────────────────────────────────────┤
│  📝 Content                 ▼  ←TOGGLE │
│  ├─ title: [input field]               │
│  ├─ subtitle: [input field]            │
│  └─ description: [textarea]            │
│                                         │
├─────────────────────────────────────────┤
│  🖼️ Media                   ▼  ←TOGGLE │
│  ├─ image: [file picker]               │
│  └─ imageAlt: [input field]            │
│                                         │
├─────────────────────────────────────────┤
│  📐 Layout                  ▼  ←TOGGLE │
│  ├─ variant: [select]                  │
│  └─ columns: [number]                  │
│                                         │
└─────────────────────────────────────────┘
```

## Collapsible Categories

### Feature Description

**Categories act as collapsible containers.** Clicking on any category header (like "Content", "Media", "Layout") toggles the visibility of all child properties within that category.

### Implementation

```javascript
// Category header with toggle functionality
<div class="prop-category">
  <div class="prop-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
    <span class="prop-category-label">📝 Content</span>
    <span class="prop-category-toggle">▼</span>
  </div>
  <div class="prop-category-body">
    <!-- Properties go here -->
  </div>
</div>
```

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.prop-category` | Container for a category group |
| `.prop-category-header` | Clickable header that toggles collapse |
| `.prop-category-label` | Category name with optional icon |
| `.prop-category-toggle` | Arrow indicator (▼ expanded, ▶ collapsed) |
| `.prop-category-body` | Container for properties (hidden when collapsed) |
| `.prop-category.collapsed` | State class that hides the body |

### Behavior

1. **Click header** → Toggle `.collapsed` class on parent
2. **Collapsed state** → `.prop-category-body` is hidden via CSS
3. **Arrow rotates** → ▼ when expanded, ▶ when collapsed
4. **Persisted?** → Currently no persistence (resets on component change)

## Tab Icons

The property panel tabs use **1.5rem** icons for clear visibility:

```html
<div class="panel-tabs">
  <button class="panel-tab active" style="font-size: 1.5rem;">🌳</button>
  <button class="panel-tab" style="font-size: 1.5rem;">⚙️</button>
  <button class="panel-tab" style="font-size: 1.5rem;">🎨</button>
</div>
```

| Tab | Icon | Purpose |
|-----|------|---------|
| Tree | 🌳 | Component tree view |
| Props | ⚙️ | Property editor |
| Style | 🎨 | Visual styling/decoration |

## Property UI Types

Properties render different controls based on their `ui` type in the schema:

| UI Type | Control | Description |
|---------|---------|-------------|
| `text` | `<input type="text">` | Single-line text |
| `number` | `<input type="number">` | Numeric input |
| `boolean` | Toggle switch | On/Off checkbox |
| `select` | `<select>` | Dropdown with options |
| `color` | `<input type="color">` | Color picker |
| `image` | File picker | Image upload with preview |
| `textarea` | `<textarea>` | Multi-line text |
| `canvasEditable` | Textarea | Edit on canvas or in panel |

## Schema Reference

The property configuration is defined in `/data/propertyconfig.json` with schema at `/data/propertyconfig.schema.json`.

### Category Definition

```json
{
  "categories": {
    "content": {
      "label": "📝 Content",
      "order": 1,
      "collapsed": false,
      "description": "Text and content properties"
    },
    "media": {
      "label": "🖼️ Media",
      "order": 2,
      "collapsed": false,
      "description": "Images, videos, and files"
    }
  }
}
```

### Property Definition

```json
{
  "properties": {
    "title": {
      "label": "Title",
      "ui": "canvasEditable",
      "default": "Title",
      "description": "Main heading text",
      "category": "content"
    }
  }
}
```

## Files

| File | Purpose |
|------|---------|
| `src/builder/builder-properties.js` | Property panel rendering |
| `data/propertyconfig.json` | Property definitions |
| `data/propertyconfig.schema.json` | JSON schema for validation |
| `public/builder.html` | Panel HTML structure |

## Global Functions

```javascript
window.updP(wrapperId, propName, value)  // Update a property
window.showDocs(behavior)                 // Show component docs
window.updateElementId(oldId, newId)      // Change element ID
```

## Integration

The properties panel integrates with:

1. **Canvas Selection** - Updates when user selects a component
2. **Tree Panel** - Syncs with tree selection
3. **Undo/Redo** - Property changes are tracked
4. **Live Preview** - Changes reflect immediately on canvas
