# Badge - wb-starter v3.0

Small label for status indicators, counts, or categories -- with color variants, sizes, pill/outline/dot/glow styles, and an optional remove button.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-badge>` |
| Behavior | `badge` |
| Semantic | `<span role="status">` |
| Root CSS Class | `<div x-badge>` |
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

<wb-demo>
<wb-badge label="New"></div>
</wb-demo>

### Color Variants

```html
<wb-badge label="Default" variant="default"></div>
<wb-badge label="Primary" variant="primary"></div>
<wb-badge label="Success" variant="success"></div>
<wb-badge label="Warning" variant="warning"></div>
<wb-badge label="Error" variant="error"></div>
<wb-badge label="Info" variant="info"></div>
```

### Pill, Outline, Dot

```html
<wb-badge label="Pill" variant="primary" pill></div>
<wb-badge label="Outline" variant="primary" outline></div>
<wb-badge label="Live" variant="success" dot></div>
```

### Removable

```html
<wb-badge label="Tag" variant="info" removable></div>
```

### Glass and Gradient

```html
<wb-badge label="Glass" variant="glass"></div>
<wb-badge label="Premium" variant="gradient" pill icon="⭐"></div>
```

### Glow (draws attention)

```html
<wb-badge label="Live" variant="success" pill glow icon="🟢"></div>
```

### Sizes

```html
<wb-badge label="xs" size="xs"></div>
<wb-badge label="sm" size="sm"></div>
<wb-badge label="md" size="md"></div>
<wb-badge label="lg" size="lg"></div>
```

## Generated Structure

```html
<!-- text badge -->
<wb-badge class="wb-badge--primary wb-badge--pill">
  <span class="wb-badge__icon">⭐</span>
  5
  <button class="wb-badge__remove" aria-label="Remove">×</button>
</div>

<!-- dot badge -->
<wb-badge class="wb-badge--success"></div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-badge` | Always (also a tag selector: `<div x-badge>`) | Base inline-flex chip styling |
| `.wb-badge--{variant}` | Any `variant` | `gray`/`primary`/`secondary`/`success`/`warning`/`error`/`info`/`purple`/`pink`/`teal`/`orange` background+text color |
| `.wb-badge--gradient` | `variant="gradient"` | Two-color gradient background |
| `.wb-badge--glass` | `variant="glass"` | Translucent, blurred, animated sheen |
| `.wb-badge--{xs,sm,md,lg}` | `size` | Padding/font-size scale |
| `.wb-badge--pill` | `pill` | Full border radius |
| `.wb-badge--dot` | `dot` | Collapses to an 8px colored circle (unless also `removable` or `label`) |
| `.wb-badge__dot` | `dot` + (`removable` or `label`) | Small inline dot indicator (when the whole-element collapse is skipped) |
| `.wb-badge__dot-label` | `dot` + `label` | The label text shown next to the dot indicator |
| `.wb-badge--outline` | `outline` | Transparent background, colored border |
| `.wb-badge--removable` | `removable` | Adds spacing for the remove button |
| `.wb-badge--glow` | `glow` | Pulsing halo in the badge's own color |
| `.wb-badge__icon` | `icon` set | Leading icon wrapper |
| `.wb-badge__remove` | `removable` | The × remove button |

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
const badge = document.querySelector('wb-badge');

badge.hide();
badge.show();
```

## Events

The built-in remove (×) button calls `element.remove()` directly and does not dispatch a custom event. `show()`/`hide()` (above) dispatch the generic `wb:show`/`wb:hide` events.

## CSS API

Badge colors come from real theme tokens read directly in `src/styles/behaviors/badge.css` (there are no `--wb-badge-*` custom properties in the shipped CSS -- the badge-scoped tokens below are what the CSS actually reads):

| Variable | Used For | Description |
|----------|----------|--------------|
| `--badge-gray-bg` | Default variant background | Neutral surface |
| `--badge-primary` / `--badge-secondary` / `--badge-success` / `--badge-warning` / `--badge-error` / `--badge-info` / `--badge-purple` / `--badge-pink` / `--badge-teal` / `--badge-orange` | Variant backgrounds | Per-variant fill color |
| `--badge-on-color` | Saturated variant text | Text color on a saturated background |
| `--badge-on-light` | `warning` variant text | Dark text for the light warning background |
| `--badge-glass-bg` / `--badge-glass-border` / `--badge-glass-sheen` | `.wb-badge--glass` | Translucent background, border, and shimmer sheen |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="status"` (semantic default) | Announces badge content changes politely |
| `aria-label="Remove"` | On the built-in remove button |

Keyboard support:
- The remove button is a real `<button>` and is reachable/activatable via Tab + Enter/Space.
