# Ripple - wb-starter v3.0

Material-style ripple effect: a circular wave expands from the press point (or the
element's center) on `mousedown`, then fades out.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `ripple` |
| Attribute | `x-ripple` |
| Custom Tag | `<wb-ripple>` |
| Applies to | any element (buttons, cards, list items, ...) |
| Category | Effects |
| Schema | `src/wb-models/ripple.schema.json` |
| Source | `src/wb-viewmodels/ripple.js` |

Both forms run the same behavior: `<button x-ripple>` and `<wb-ripple>` are
equivalent — the tag form is registered in the tag map
([`src/core/tag-map.js`](../../src/core/tag-map.js)) and dispatches to the identical
`ripple()` function. `autoInject` is on by default site-wide
([`src/core/config.js`](../../src/core/config.js)), so `x-ripple` activates without
any manual `WB.scan()` call.

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `color` | `ripple-color` | string | `"rgba(255, 255, 255, 0.4)"` | Color of the ripple wave |
| `duration` | `ripple-duration` | number (ms) | `600` | How long the ripple animation runs |
| `centered` | `ripple-centered` (presence, boolean) | boolean | `false` | Start the ripple from the element's center instead of the press position |

`centered` is a presence attribute — add the bare `ripple-centered` to enable it,
there's no `="true"`/`="false"` value to set.

## Usage

### Default (click position)

<wb-demo>
<button x-ripple>Click me</button>
</wb-demo>

### Centered ripple

<wb-demo>
<button x-ripple ripple-centered>Centered ripple</button>
</wb-demo>

### Custom color and duration

<wb-demo>
<button x-ripple ripple-color="rgba(99, 102, 241, 0.5)" ripple-duration="900">Slow indigo ripple</button>
</wb-demo>

### Custom Tag

<wb-demo>
<wb-ripple>Same behavior via the &lt;wb-ripple&gt; custom tag</wb-ripple>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-ripple` | Always, except on a literal `<wb-ripple>` host (matched by its tag selector instead in `effects.css`) | Adds `position: relative; overflow: hidden` so the wave stays contained |
| `.wb-ripple__wave` | On each press | The expanding circle itself (a `<span>` appended and removed per click) |

## Accessibility

`ripple` is a purely visual press-feedback effect — it adds no ARIA roles or
attributes and does not change focus or keyboard behavior. It attaches to
`mousedown`, so keyboard-only activation (Enter/Space on a focused button) does not
trigger a ripple; this only affects the visual feedback, not the element's actual
click behavior.

## Source

[src/wb-viewmodels/ripple.js](../../src/wb-viewmodels/ripple.js)
