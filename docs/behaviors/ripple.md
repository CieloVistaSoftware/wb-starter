# Ripple - wb-starter v3.0

Material-style ripple effect: a circular wave expands from the press point (or the
element's center) on `mousedown`, then fades out.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `ripple` |
| Attribute | `x-ripple` |
| Attribute form | `<div x-ripple>` |
| Applies to | any element (buttons, cards, list items, ...) |
| Category | Effects |
| Schema | `src/wb-models/ripple.schema.json` |
| Source | `src/wb-viewmodels/ripple.js` |

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

<div x-demo>
<button x-ripple>Click me</button>
</div>

### Centered ripple

<div x-demo>
<button x-ripple ripple-centered>Centered ripple</button>
</div>

### Custom color and duration

<div x-demo>
<button x-ripple ripple-color="rgba(99, 102, 241, 0.5)" ripple-duration="900">Slow indigo ripple</button>
</div>

### On a plain `<div>`

<div x-demo>
<div x-ripple>A plain div with x-ripple</div>
</div>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-ripple` | Always, except on a literal `<div x-ripple>` host (matched by its tag selector instead in `effects.css`) | Adds `position: relative; overflow: hidden` so the wave stays contained |
| `.x-ripple__wave` | On each press | The expanding circle itself (a `<span>` appended and removed per click) |

## Accessibility

`ripple` is a purely visual press-feedback effect — it adds no ARIA roles or
attributes and does not change focus or keyboard behavior. It attaches to
`mousedown`, so keyboard-only activation (Enter/Space on a focused button) does not
trigger a ripple; this only affects the visual feedback, not the element's actual
click behavior.

## Source

[src/wb-viewmodels/ripple.js](../../src/wb-viewmodels/ripple.js)
