# Icon - wb-starter v3.0

A small layout helper for pairing an inline `<svg>` icon with adjacent text —
sets up an inline-flex row with consistent spacing and sizes the first `<svg>`
child found inside it.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `icon` |
| Attribute | `x-icon` |
| Applies to | any element containing an `<svg>` |
| Category | Layout |
| Source | `src/wb-viewmodels/layouts.js` |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `size` | `size` | string | `"1em"` | Width/height applied to the element's first `<svg>` descendant |
| `space` | `space` | string | `"0.5em"` | Gap between the icon and any adjacent text/content |

The host element becomes `display: inline-flex; align-items: center`. If no
`<svg>` is found inside it, only the flex layout and gap are applied — the
size option has nothing to size.

## Usage

### Default size

<div x-demo>
<span x-icon>
  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>
  Label text
</span>
</div>

### Larger icon, wider spacing

<div x-demo>
<span x-icon size="2em" space="1em">
  <svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"></rect></svg>
  Larger icon with more space
</span>
</div>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-icon` | Always | Marker class for targeting/testing; the inline-flex layout and icon sizing are applied inline |

## Accessibility

A decorative icon placed next to text should be hidden from assistive
technology with `aria-hidden="true"` on the `<svg>` so it isn't announced
redundantly alongside the adjacent label text. If the icon conveys meaning on
its own (no accompanying text), give it an accessible name instead — e.g. a
`<title>` element inside the SVG, or `role="img"` with `aria-label` on the
`<svg>`.

## Source

[src/wb-viewmodels/layouts.js](../../../src/wb-viewmodels/layouts.js)
