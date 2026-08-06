# Switcher - wb-starter v3.0

A responsive layout that switches between a horizontal row and a stacked
column based on available space, with no media query — each child's
`flex-basis` is computed from `threshold` so the row wraps once children would
get too narrow.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `switcher` |
| Attribute | `x-switcher` |
| Applies to | a container and its direct children |
| Category | Layout |
| Source | `src/wb-viewmodels/layouts.js` |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `threshold` | `threshold` | string | `"30rem"` | Container width below which children stack; used in each child's computed `flex-basis` |
| `gap` | `gap` | string | `"1rem"` | Gap between children |
| `limit` | `limit` | number | `4` | Parsed from the attribute but currently not applied anywhere in the layout logic — reserved for a future max-columns cap |

## Usage

### Default

<wb-demo>
<div x-switcher>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
</wb-demo>

### Lower threshold (switches to a row sooner)

<wb-demo>
<div x-switcher threshold="15rem" gap="0.5rem">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-switcher` | Always | Marker class for targeting/testing; the flex-wrap layout is applied inline |

## Accessibility

`switcher` only changes visual arrangement — children keep their DOM order
whether they're rendered as a row or a stacked column, so tab order and
screen-reader reading order are unaffected by the current layout state.

## Source

[src/wb-viewmodels/layouts.js](../../../src/wb-viewmodels/layouts.js)
