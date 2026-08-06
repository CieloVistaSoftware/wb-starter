# Reel - wb-starter v3.0

A horizontally scrolling row with CSS scroll-snap — each child snaps into
place as the user scrolls or swipes, the way a carousel of cards often works
without any JavaScript drag logic.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `reel` |
| Attribute | `x-reel` |
| Applies to | a container and its direct children |
| Category | Layout |
| Source | `src/wb-viewmodels/layouts.js` |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `itemWidth` | `item-width` | string | `"auto"` | When set to a length (e.g. `200px`), applied as a fixed `width` on every child; `"auto"` leaves each child's natural width |
| `gap` | `gap` | string | `"1rem"` | Gap between items |

The container gets `display: flex`, `overflow-x: auto`, and
`scroll-snap-type: x mandatory`. Every direct child gets `flex-shrink: 0` and
`scroll-snap-align: start`.

## Usage

### Auto-width items

<wb-demo>
<div x-reel>
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
  <div>Card 4</div>
  <div>Card 5</div>
</div>
</wb-demo>

### Fixed item width

<wb-demo>
<div x-reel item-width="150px" gap="0.5rem">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-reel` | Always | Marker class for targeting/testing; the scroll-snap flex layout is applied inline |

## Accessibility

A reel is keyboard-scrollable by default once it can receive focus (arrow
keys / Tab move focus to focusable children inside it, and the browser
scrolls the container into view). If the reel's children are not natively
focusable (e.g. plain `<div>` cards with no links or buttons inside), add
`tabindex="0"` and a descriptive `aria-label` to the reel container so
keyboard and screen-reader users can still reach and scroll it.

## Source

[src/wb-viewmodels/layouts.js](../../../src/wb-viewmodels/layouts.js)
