# Center - wb-starter v3.0

Horizontally centers an element's content, either by constraining and
centering the box itself (default) or by centering its children with flexbox
(`intrinsic`).

## Overview

| Property | Value |
|----------|-------|
| Behavior | `center` |
| Attribute | `x-center` |
| Applies to | any element |
| Category | Layout |
| Source | `src/wb-viewmodels/layouts.js` |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `maxWidth` | `max-width` | string | `""` (none) | Caps the element's width; combined with `margin-left`/`margin-right: auto` to center the box |
| `gutters` | `gutters` | string | `"1rem"` | Left/right padding, so content never touches the viewport edge |
| `intrinsic` | `intrinsic` | boolean | `false` | Switches to `display: flex; flex-direction: column; align-items: center` — centers children by their own width instead of constraining the box |

`intrinsic` is a boolean flag: when present, `maxWidth`/`gutters` are not applied
(the element centers its children instead of centering itself).

## Usage

### Constrained width (default)

<wb-demo>
<div x-center max-width="400px">
  <p>This block is capped at 400px and centered on the page, with 1rem of gutter padding on each side.</p>
</div>
</wb-demo>

### Custom gutters

<wb-demo>
<div x-center max-width="300px" gutters="2rem">
  <p>Wider gutters around a narrower column.</p>
</div>
</wb-demo>

### Intrinsic centering

<wb-demo>
<div x-center intrinsic>
  <button>Centered by content width</button>
</div>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-center` | Always | Marker class for targeting/testing; carries no built-in styling of its own — all sizing is applied inline by the behavior |

## Accessibility

`center` is purely visual — it does not add or change any ARIA roles or
attributes. Centering content does not affect reading order or keyboard
navigation, since no DOM elements are reordered or hidden.

## Source

[src/wb-viewmodels/layouts.js](../../../src/wb-viewmodels/layouts.js)
