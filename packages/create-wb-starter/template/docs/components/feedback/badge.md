# Badge - wb-starter v3.0

Small label for status indicators, counts, or categories -- with color variants, sizes, pill/outline/dot/glow styles, and an optional remove button.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<span x-badge>` |
| Behavior | `badge` |
| Semantic | `<span role="status">` |
| Root CSS Class | `x-badge` |
| Category | Feedback |
| Schema | `src/wb-models/badge.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Badge text (children win over `label` if the element already has content) |
| `variant` | string | `"default"` | Color: `default`, `primary`, `secondary`, `success`, `warning`, `error`, `info`, `glass`, `gradient` |
| `size` | string | `"md"` | `xs`, `sm`, `md`, `lg` |
| `pill` | boolean | `false` | Fully rounded shape |
| `dot` | boolean | `false` | Renders as a small dot indicator. Bare `dot` alone has no text; `dot` + `label` shows both the dot and the label text together (e.g. "● Live") |
| `outline` | boolean | `false` | Transparent background with a colored border/text |
| `removable` | boolean | `false` | Adds a × button that removes the badge |
| `glow` | boolean | `false` | Soft pulsing halo in the badge's own variant color |
| `icon` | string | `""` | Leading icon/emoji shown before the label |

## Usage

### Custom Element

<div x-demo>
<span x-badge label="New"></span>
</div>

### Color Variants

```html
<span x-badge label="Default" variant="default"></span>
<span x-badge label="Primary" variant="primary"></span>
<span x-badge label="Success" variant="success"></span>
<span x-badge label="Warning" variant="warning"></span>
<span x-badge label="Error" variant="error"></span>
<span x-badge label="Info" variant="info"></span>
```

### Pill, Outline, Dot

```html
<span x-badge label="Pill" variant="primary" pill></span>
<span x-badge label="Outline" variant="primary" outline></span>
<span x-badge label="Live" variant="success" dot></span>
```

### Removable

```html
<span x-badge label="Tag" variant="info" removable></span>
```

### Glass and Gradient

```html
<span x-badge label="Glass" variant="glass"></span>
<span x-badge label="Premium" variant="gradient" pill icon="⭐"></span>
```

### Glow (draws attention)

```html
<span x-badge label="Live" variant="success" pill glow icon="🟢"></span>
```

### Sizes

```html
<span x-badge label="xs" size="xs"></span>
<span x-badge label="sm" size="sm"></span>
<span x-badge label="md" size="md"></span>
<span x-badge label="lg" size="lg"></span>
```

## Generated Structure

```html
<!-- text badge -->
<span x-badge class="x-badge--primary x-badge--pill">
  <span class="x-badge__icon">⭐</span>
  5
  <button class="x-badge__remove" aria-label="Remove">×</button>
</span>

<!-- dot badge -->
<span x-badge class="x-badge--success"></span>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-badge` | Always (also a tag selector: `x-badge`) | Base inline-flex chip styling |
| `.x-badge--{variant}` | Any `variant` | `gray`/`primary`/`secondary`/`success`/`warning`/`error`/`info`/`purple`/`pink`/`teal`/`orange` background+text color |
| `.x-badge--gradient` | `variant="gradient"` | Two-color gradient background |
| `.x-badge--glass` | `variant="glass"` | Translucent, blurred, animated sheen |
| `.x-badge--{xs,sm,md,lg}` | `size` | Padding/font-size scale |
| `.x-badge--pill` | `pill` | Full border radius |
| `.x-badge--dot` | `dot` | Collapses to an 8px colored circle (unless also `removable` or `label`) |
| `.x-badge__dot` | `dot` + (`removable` or `label`) | Small inline dot indicator (when the whole-element collapse is skipped) |
| `.x-badge__dot-label` | `dot` + `label` | The label text shown next to the dot indicator |
| `.x-badge--outline` | `outline` | Transparent background, colored border |
| `.x-badge--removable` | `removable` | Adds spacing for the remove button |
| `.x-badge--glow` | `glow` | Pulsing halo in the badge's own color |
| `.x-badge__icon` | `icon` set | Leading icon wrapper |
| `.x-badge__remove` | `removable` | The × remove button |

## Methods

`badge()` (`src/wb-viewmodels/feedback.js`) builds the DOM and wires the remove button directly. The methods below come from `badge.schema.json`'s `$methods`, bound generically by the schema builder. `show`/`hide`/`toggle`/`update` use the schema builder's real generic implementation; `remove` has no matching generic implementation and falls back to a stub that dispatches `wb:remove` -- use the built-in × button, or `element.remove()`, to actually remove a badge.

| Method | Description |
|--------|-------------|
| `show()` | Shows the badge |
| `hide()` | Hides the badge |
| `toggle()` | Toggles visibility |
| `remove()` | Declared remove action (generic stub -- dispatches `wb:remove`) |
| `update(label)` | Declared update action (generic stub unless overridden) |

```javascript
const badge = document.querySelector('x-badge');

badge.hide();
badge.show();
```

## Events

The built-in remove (×) button calls `element.remove()` directly and does not dispatch a custom event. `show()`/`hide()` (above) dispatch the generic `wb:show`/`wb:hide` events.

## CSS API

Badge colors come from real theme tokens read directly in `src/styles/behaviors/badge.css` (there are no `--x-badge-*` custom properties in the shipped CSS -- the badge-scoped tokens below are what the CSS actually reads):

| Variable | Used For | Description |
|----------|----------|--------------|
| `--badge-gray-bg` | Default variant background | Neutral surface |
| `--badge-primary` / `--badge-secondary` / `--badge-success` / `--badge-warning` / `--badge-error` / `--badge-info` / `--badge-purple` / `--badge-pink` / `--badge-teal` / `--badge-orange` | Variant backgrounds | Per-variant fill color |
| `--badge-on-color` | Saturated variant text | Text color on a saturated background |
| `--badge-on-light` | `warning` variant text | Dark text for the light warning background |
| `--badge-glass-bg` / `--badge-glass-border` / `--badge-glass-sheen` | `.x-badge--glass` | Translucent background, border, and shimmer sheen |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="status"` (semantic default) | Announces badge content changes politely |
| `aria-label="Remove"` | On the built-in remove button |

Keyboard support:
- The remove button is a real `<button>` and is reachable/activatable via Tab + Enter/Space.
