# Code Theme - wb-starter v3.0

A dropdown that switches the syntax-highlighting theme used by every `highlight.js`
code block on the page — applies immediately on selection, and keeps every
`x-codetheme` instance on a page in sync.

It was called `x-codecontrol` until #668. The old attribute still works and runs
the same behavior; new markup should use `x-codetheme`.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `codetheme` |
| Attribute | `x-codetheme` |
| Attribute form | `<div x-codetheme>` |
| Applies to | any container element |
| Category | Content |
| Schema | `src/wb-models/codetheme.schema.json` |
| Source | `src/wb-viewmodels/codetheme.js` |

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

<div x-demo>
<div x-codetheme></div>
</div>

### Small, no label

<div x-demo>
<div x-codetheme size="sm" show-label="false"></div>
</div>

### Flat list (no category groups), non-persisting

<div x-demo>
<div x-codetheme show-category="false" persist="false"></div>
</div>

### On a plain `<div>`

<div x-demo>
<div x-codetheme size="lg"></div>
</div>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `.x-codetheme` | Always | Marker class on the host element |
| `.x-codetheme__wrapper` | Always | Inline-flex row holding the label and select |
| `.x-codetheme__label` | `show-label` is not `"false"` | The "Code:" label |
| `.x-codetheme__select` | Always | The theme `<select>` dropdown |

## Events

| Event | Fires when | `detail` | Bubbles |
|-------|-----------|----------|---------|
| `x:codetheme:change` | The active theme changes (selection or incoming sync) | `{ theme, name, category }` | Yes |

```javascript
document.querySelector('[x-codetheme]').addEventListener('x:codetheme:change', (e) => {
  console.log('Theme is now', e.detail.theme, e.detail.name);
});
```

Every `x-codetheme` instance on the page also listens for a `document`-level
`x:codetheme:sync` event, so selecting a theme in one instance updates every other
instance (and the shared `<link data-highlight-theme>` stylesheet) without a page
reload.

## Methods

| Method | Description |
|--------|--------------|
| `element.wbCodeTheme.getTheme()` | Returns the current theme id |
| `element.wbCodeTheme.setTheme(themeId)` | Applies a theme by id programmatically |
| `element.wbCodeTheme.getThemes()` | Returns the full list of available themes |
| `element.wbCodeTheme.getThemesByCategory(category)` | Returns themes filtered by category |

## Accessibility

The label is a real `<label>` wrapping/preceding a native `<select>`, so it's
keyboard-operable and announced normally by screen readers. Each `<option>` carries
a `title` with a short human-readable description of the theme. `show-label="false"`
removes the visible label text with no `aria-label` fallback — keep the label
visible (or add your own `aria-label` on the container) if the control needs to be
identifiable without visual context.

## Source

[src/wb-viewmodels/codetheme.js](../../src/wb-viewmodels/codetheme.js)
