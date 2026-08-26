# Scrollable - wb-starter v3.0

Turns an element into a scrollable region with an optional size cap, so its
content scrolls internally instead of growing the page.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `scrollable` |
| Attribute | `x-scrollable` |
| Applies to | any element |
| Category | Layout |
| Source | `src/wb-viewmodels/layouts.js` |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `direction` | `direction` | string | `"both"` | Which axis scrolls: `vertical`, `horizontal`, or `both` |
| `maxHeight` | `max-height` | string | `""` (none) | Caps height and sets `overflow-y: auto` when `direction` is `vertical` or `both` |
| `maxWidth` | `max-width` | string | `""` (none) | Caps width and sets `overflow-x: auto` when `direction` is `horizontal` or `both` |

## Usage

### Vertical scroll with a height cap

<div x-demo>
<div x-scrollable direction="vertical" max-height="120px">
  <p>Line one of a long block of content.</p>
  <p>Line two.</p>
  <p>Line three.</p>
  <p>Line four.</p>
  <p>Line five — by now the content overflows the 120px cap and scrolls.</p>
</div>
</div>

### Horizontal scroll with a width cap

<div x-demo>
<div x-scrollable direction="horizontal" max-width="250px">
  <div style="display:flex; gap:1rem;">
    <span>Panel 1</span>
    <span>Panel 2</span>
    <span>Panel 3</span>
    <span>Panel 4</span>
  </div>
</div>
</div>

### Both axes (default)

<div x-demo>
<div x-scrollable max-height="120px" max-width="250px">
  <div style="width:400px;">
    <p>This content is wider and taller than the caps in both directions, so it scrolls both ways.</p>
  </div>
</div>
</div>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-scrollable` | Always | Marker class for targeting/testing; overflow and size caps are applied inline |

## Accessibility

A scrollable region built from an arbitrary `<div>` is not natively reachable
by keyboard the way a native scrollable landmark is. If the region can gain
focus (e.g. via `tabindex="0"`) and contains meaningful, potentially
overflowing content, add a descriptive `aria-label` or `aria-labelledby` so
assistive technology announces it as a scrollable region rather than a plain
group of static content.

## Source

[src/wb-viewmodels/layouts.js](../../../src/wb-viewmodels/layouts.js)
