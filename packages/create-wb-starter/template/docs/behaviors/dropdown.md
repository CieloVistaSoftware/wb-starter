# dropdown

Click (or hover) to open a menu — from either a comma-separated `items` list or
real child `<a>`/`<button>`/`<div>` elements. Implemented by `dropdown()` in
[src/wb-viewmodels/dropdown.js](../../src/wb-viewmodels/dropdown.js).

## Overview

| Property | Value |
|----------|-------|
| Attribute | `x-dropdown` |
| Attribute form | `<div x-dropdown>` |
| Behavior function | `dropdown()` — `src/wb-viewmodels/dropdown.js` |
| Semantic element | `<div implicitRole="menu">` |
| Root CSS Class | `<div x-dropdown>` (plus `x-dropdown-trigger` on the host itself) |
| Category | Overlay |
| Schema | [dropdown.schema.json](../../src/wb-models/dropdown.schema.json) — declares `closeOnOutside`/`offset` properties the JS never reads; outside-click-to-close is always on unconditionally, it isn't configurable |

## Properties

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `items` | string | `""` | Comma-separated list of menu item labels (e.g. `"Profile,Settings,Logout"`). Ignored if the host already has real `<a>`/`<button>`/`<div>` children |
| `label` | string | `""` | Trigger button text. If set (or the host has real child items), a dedicated `<button class="x-dropdown__trigger">` is built; otherwise the host's own text content is the clickable trigger |
| `position` | string | `"bottom-start"` | `bottom-start`, `bottom-end`, `top-start`, `top-end` — sets which corner the menu opens from |
| `close-on-select` | boolean | `true` (unless the value is literally `"false"`) | Whether choosing a menu item closes the dropdown |
| `trigger` | string | `"click"` | `click` or `hover`. In hover mode there's a 150ms close delay so the pointer can travel from the trigger into the menu |

## Usage

### Items list

<div x-demo>
<button x-dropdown items="Profile,Settings,Logout" label="Account"></button>
</div>

### Real child links, open on the right edge

<div x-demo>
<div x-dropdown label="Actions" position="bottom-end">
  <a href="#edit">Edit</a>
  <a href="#duplicate">Duplicate</a>
  <a href="#delete">Delete</a>
</div>
</div>

### Hover trigger

<div x-demo>
<button x-dropdown items="Home,Docs,Support" label="Menu" trigger="hover"></button>
</div>

### Host text as its own trigger (no `label`, no child items)

<div x-demo>
<button x-dropdown items="Item A,Item B">Click me ▾</button>
</div>

## CSS Classes

`dropdown()` sets almost all of the trigger/menu positioning and colors via
**inline styles** written directly in `dropdown.js`, not the classes below —
`src/styles/behaviors/dropdown.css`'s own `.x-dropdown-menu`/`.x-dropdown-item`
selectors (singular hyphen) are stale and don't match anything this behavior
actually creates (it builds `x-dropdown__menu`/`x-dropdown__item`, BEM-style).
The classes below are the ones genuinely applied and meaningfully stylable.

| Class | Applied to | Description |
|-------|-----------|-------------|
| `<div x-dropdown>` | host isn't already a `<div x-dropdown>` tag | Marker class (`x-dropdown.css`'s tag selector covers real `<div x-dropdown>` hosts) |
| `.x-dropdown-trigger` | host, always | Button-like affordance (background/border/padding/cursor) for when the host's own text is the trigger |
| `.x-dropdown__trigger` | the generated trigger `<button>` | Only exists when `label` is set or there are real child items |
| `.x-dropdown__menu` | the generated menu `<div>` | Positioned via inline styles; visibility toggled via inline `display` |
| `.x-dropdown__item` | each menu item (generated from `items`, or moved-in child elements) | `role="menuitem"` |
| `.open` | host, while the menu is visible | Toggled alongside the inline `display` |

## Events

| Event | Fires when | `detail` |
|-------|-----------|----------|
| `wb:dropdown:select` | a menu item is clicked | `{ value, href }` — `value` is the item's trimmed text, `href` is the link URL or `null` |

```javascript
document.querySelector('[x-dropdown]').addEventListener('wb:dropdown:select', (e) => {
  console.log('Chosen:', e.detail.value);
});
```

- [Demo](../../demos/site/overlays.html#dropdown-dropdown)
- [Schema](../../src/wb-models/dropdown.schema.json)
