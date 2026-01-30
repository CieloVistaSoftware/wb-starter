# Context Menu - Web Behaviors (WB) Framework v3.0

Right-click context menus with smart positioning, keyboard navigation, and customizable items.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-contextmenu>` |
| Behavior | `contextmenu` |
| Base Class | `wb-contextmenu` |
| Schema | `src/wb-models/contextmenu.schema.json` |
| Category | Overlay |

## Features

- **Smart Positioning** - Automatically adjusts to stay within viewport
- **Keyboard Navigation** - Full arrow key, Enter, Escape support
- **Separators** - Visual dividers between item groups
- **Icons & Shortcuts** - Display icons and keyboard hints
- **Danger Items** - Red styling for destructive actions
- **Submenus** - Nested menu support (coming soon)

---

## Basic Usage

### HTML Trigger

```html
<div data-wb="contextmenu" 
     data-wb-items='[
       {"id": "edit", "label": "Edit", "icon": "✏️"},
       {"id": "duplicate", "label": "Duplicate", "icon": "📋"},
       {"separator": true},
       {"id": "delete", "label": "Delete", "icon": "🗑️", "danger": true}
     ]'>
  Right-click this element
</div>
```

### JavaScript API

```javascript
// Import the context menu module
import { showContextMenu, hideContextMenu } from './wb-viewmodels/contextmenu.js';

// Show at specific coordinates
element.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  showContextMenu(e.clientX, e.clientY, [
    { id: 'edit', label: 'Edit', icon: '✏️' },
    { id: 'copy', label: 'Copy', icon: '📋', shortcut: 'Ctrl+C' },
    { separator: true },
    { id: 'delete', label: 'Delete', icon: '🗑️', danger: true }
  ]);
});
```

---

## Item Configuration

### Item Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier for selection events |
| `label` | string | Display text |
| `icon` | string | Emoji or icon prefix |
| `shortcut` | string | Keyboard shortcut hint (display only) |
| `disabled` | boolean | Disable interaction |
| `danger` | boolean | Red styling for destructive actions |
| `separator` | boolean | Render as horizontal line |
| `submenu` | array | Nested menu items |

### Examples

```javascript
const items = [
  // Basic item
  { id: 'save', label: 'Save' },
  
  // With icon
  { id: 'copy', label: 'Copy', icon: '📋' },
  
  // With shortcut hint
  { id: 'paste', label: 'Paste', icon: '📥', shortcut: 'Ctrl+V' },
  
  // Disabled item
  { id: 'undo', label: 'Undo', icon: '↩️', disabled: true },
  
  // Separator
  { separator: true },
  
  // Danger item
  { id: 'delete', label: 'Delete', icon: '🗑️', danger: true }
];
```

---

## Smart Positioning

The context menu uses smart positioning to always stay visible:

```
┌─────────────────────────────────────────┐
│                Viewport                  │
│                                         │
│    Click here → ┌──────────┐            │
│                 │ Menu     │ ← Appears  │
│                 │ Items    │   below    │
│                 └──────────┘            │
│                                         │
│              ┌──────────┐ ← Click here  │
│   Appears → │ Menu     │               │
│   above     │ Items    │               │
│             └──────────┘               │
│─────────────────────────────────────────│
│ 10px margin maintained from all edges   │
└─────────────────────────────────────────┘
```

### Positioning Rules

1. **Prefer below-right** of click point
2. **No room below?** Position above click point
3. **No room right?** Position to the left
4. **Minimum 10px** margin from viewport edges

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` Arrow Up | Focus previous item |
| `↓` Arrow Down | Focus next item |
| `Enter` | Select focused item |
| `Escape` | Close menu |
| `Home` | Focus first item |
| `End` | Focus last item |

---

## Events

### wb:contextmenu:show

Fired when menu opens.

```javascript
document.addEventListener('wb:contextmenu:show', (e) => {
  console.log('Menu opened at:', e.detail.x, e.detail.y);
});
```

### wb:contextmenu:hide

Fired when menu closes.

```javascript
document.addEventListener('wb:contextmenu:hide', () => {
  console.log('Menu closed');
});
```

### wb:contextmenu:select

Fired when item is selected.

```javascript
document.addEventListener('wb:contextmenu:select', (e) => {
  const { id, label, item } = e.detail;
  
  switch (id) {
    case 'edit':
      editItem();
      break;
    case 'delete':
      deleteItem();
      break;
  }
});
```

---

## CSS Custom Properties

### Menu Container

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-contextmenu-bg` | `var(--bg-secondary)` | Background color |
| `--wb-contextmenu-border` | `1px solid var(--border-color)` | Border |
| `--wb-contextmenu-radius` | `8px` | Border radius |
| `--wb-contextmenu-shadow` | `0 10px 30px rgba(0,0,0,0.3)` | Shadow |
| `--wb-contextmenu-padding` | `0.5rem` | Inner padding |
| `--wb-contextmenu-min-width` | `180px` | Minimum width |
| `--wb-contextmenu-max-width` | `320px` | Maximum width |
| `--wb-contextmenu-z-index` | `10000` | Stack order |

### Menu Items

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-contextmenu-item-padding` | `0.75rem` | Item padding |
| `--wb-contextmenu-item-radius` | `4px` | Item border radius |
| `--wb-contextmenu-item-color` | `var(--text-primary)` | Text color |
| `--wb-contextmenu-item-hover-bg` | `var(--bg-tertiary)` | Hover background |
| `--wb-contextmenu-item-active-bg` | `var(--primary)` | Active/selected background |
| `--wb-contextmenu-item-danger-color` | `#ef4444` | Danger item color |
| `--wb-contextmenu-item-disabled-opacity` | `0.5` | Disabled opacity |

### Separators & Shortcuts

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-contextmenu-separator-color` | `var(--border-color)` | Separator line color |
| `--wb-contextmenu-separator-margin` | `0.5rem 0` | Separator margins |
| `--wb-contextmenu-shortcut-color` | `var(--text-muted)` | Shortcut text color |
| `--wb-contextmenu-shortcut-font` | `0.75rem monospace` | Shortcut font |

### Animations

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-contextmenu-enter-animation` | `contextmenuFadeIn 0.15s ease` | Open animation |
| `--wb-contextmenu-exit-animation` | `contextmenuFadeOut 0.1s ease` | Close animation |

---

## Styling Examples

### Custom Theme

```css
.wb-contextmenu {
  --wb-contextmenu-bg: #0f172a;
  --wb-contextmenu-border: 1px solid #334155;
  --wb-contextmenu-radius: 12px;
  --wb-contextmenu-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}
```

### Light Mode

```css
[data-theme="light"] .wb-contextmenu {
  --wb-contextmenu-bg: #ffffff;
  --wb-contextmenu-border: 1px solid #e5e7eb;
  --wb-contextmenu-item-color: #1f2937;
  --wb-contextmenu-item-hover-bg: #f3f4f6;
}
```

### Compact Mode

```css
.wb-contextmenu--compact {
  --wb-contextmenu-item-padding: 0.5rem 0.75rem;
  --wb-contextmenu-min-width: 150px;
  --wb-contextmenu-radius: 6px;
}
```

---

## Builder Integration

The context menu is used in the WB Builder for component operations:

```javascript
// Builder context menu example
function showComponentContextMenu(e, component) {
  e.preventDefault();
  
  const isNavbar = isNavbarComponent(component);
  
  const items = [
    { id: 'edit', label: 'Edit Properties', icon: '✏️' },
    { id: 'duplicate', label: 'Duplicate', icon: '📋' },
    { separator: true },
    { id: 'move-up', label: 'Move Up', icon: '⬆️' },
    { id: 'move-down', label: 'Move Down', icon: '⬇️' },
  ];
  
  // Conditional items for navbar
  if (isNavbar) {
    items.splice(2, 0, 
      { id: 'add-nav-item', label: 'Add Nav Item', icon: '➕' },
      { separator: true }
    );
  }
  
  items.push(
    { separator: true },
    { id: 'delete', label: 'Delete', icon: '🗑️', danger: true }
  );
  
  showContextMenu(e.clientX, e.clientY, items);
}
```

---

## Accessibility

- **Role**: `menu` on container, `menuitem` on items
- **Focus Management**: First item receives focus on open
- **Keyboard**: Full navigation support
- **Screen Readers**: Proper ARIA labels and states

```html
<!-- Generated structure -->
<div class="wb-contextmenu" role="menu" aria-label="Context menu">
  <button class="wb-contextmenu__item" role="menuitem" tabindex="-1">
    <span class="wb-contextmenu__icon">✏️</span>
    <span class="wb-contextmenu__label">Edit</span>
    <kbd class="wb-contextmenu__shortcut">Ctrl+E</kbd>
  </button>
  <hr class="wb-contextmenu__separator" role="separator">
  <button class="wb-contextmenu__item wb-contextmenu__item--danger" role="menuitem">
    <span class="wb-contextmenu__icon">🗑️</span>
    <span class="wb-contextmenu__label">Delete</span>
  </button>
</div>
```

---

## Best Practices

1. **Keep menus short** - 5-10 items max, use submenus for more
2. **Group related items** - Use separators between groups
3. **Consistent icons** - Use emoji or icon library consistently
4. **Clear danger items** - Always mark destructive actions
5. **Keyboard shortcuts** - Show hints for common actions
6. **Responsive** - Test on mobile (long-press trigger)

---

## Related Components

- [Dropdown](./dropdown.md) - Click-triggered dropdown menus
- [Tooltip](./tooltip.md) - Hover information overlays
- [Dialog](./dialog.md) - Modal dialogs
- [Drawer](./drawer.md) - Slide-in panels
