# Code Control - wb-starter v3.0

A dropdown that switches the syntax-highlighting theme used by every `highlight.js`
code block on the page — applies immediately on selection, and keeps every
`x-codecontrol` instance on a page in sync.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `codecontrol` |
| Attribute | `x-codecontrol` |
| Custom Tag | `<wb-codecontrol>` |
| Applies to | any container element |
| Category | Content |
| Schema | `src/wb-models/codecontrol.schema.json` |
| Source | `src/wb-viewmodels/codecontrol.js` |

Both forms run the same behavior: `<div x-codecontrol>` and `<wb-codecontrol>` are
equivalent — the tag form is registered in the tag map
([`src/core/tag-map.js`](../../src/core/tag-map.js)) and dispatches to the identical
`codecontrol()` function. `autoInject` is on by default site-wide
([`src/core/config.js`](../../src/core/config.js)), so `x-codecontrol` activates
without any manual `WB.scan()` call.

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `default` | `default` | string (theme id) | `"atom-one-dark"` | Initial theme when nothing is persisted yet |
| `showLabel` | `show-label` | boolean | `true` | Shows the "Code:" label before the dropdown |
| `showCategory` | `show-category` | boolean | `true` | Groups the dropdown's options into `<optgroup>`s (Minimal/Dark/Light/Special) |
| `persist` | `persist` | boolean | `true` | Saves the selected theme to `localStorage` (`x-code-theme`) and restores it on load |
| `size` | `size` | `xs` \| `sm` \| `md` \| `lg` | `"md"` | Control size (font size, padding, min-width) |

## Usage

### Default

<wb-demo>
<div x-codecontrol></div>
</wb-demo>

### Small, no label

<wb-demo>
<div x-codecontrol size="sm" show-label="false"></div>
</wb-demo>

### Flat list (no category groups), non-persisting

<wb-demo>
<div x-codecontrol show-category="false" persist="false"></div>
</wb-demo>

### Custom Tag

<wb-demo>
<wb-codecontrol size="lg"></wb-codecontrol>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `.x-codecontrol` | Always | Marker class on the host element |
| `.x-codecontrol__wrapper` | Always | Inline-flex row holding the label and select |
| `.x-codecontrol__label` | `show-label` is not `"false"` | The "Code:" label |
| `.x-codecontrol__select` | Always | The theme `<select>` dropdown |

## Events

| Event | Fires when | `detail` | Bubbles |
|-------|-----------|----------|---------|
| `x:codetheme:change` | The active theme changes (selection or incoming sync) | `{ theme, name, category }` | Yes |

```javascript
document.querySelector('[x-codecontrol]').addEventListener('x:codetheme:change', (e) => {
  console.log('Theme is now', e.detail.theme, e.detail.name);
});
```

Every `x-codecontrol` instance on the page also listens for a `document`-level
`x:codetheme:sync` event, so selecting a theme in one instance updates every other
instance (and the shared `<link data-highlight-theme>` stylesheet) without a page
reload.

## Methods

| Method | Description |
|--------|--------------|
| `element.wbCodeControl.getTheme()` | Returns the current theme id |
| `element.wbCodeControl.setTheme(themeId)` | Applies a theme by id programmatically |
| `element.wbCodeControl.getThemes()` | Returns the full list of available themes |
| `element.wbCodeControl.getThemesByCategory(category)` | Returns themes filtered by category |

## Accessibility

The label is a real `<label>` wrapping/preceding a native `<select>`, so it's
keyboard-operable and announced normally by screen readers. Each `<option>` carries
a `title` with a short human-readable description of the theme. `show-label="false"`
removes the visible label text with no `aria-label` fallback — keep the label
visible (or add your own `aria-label` on the container) if the control needs to be
identifiable without visual context.

## Source

[src/wb-viewmodels/codecontrol.js](../../src/wb-viewmodels/codecontrol.js)
