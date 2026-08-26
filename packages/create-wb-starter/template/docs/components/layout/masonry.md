# Masonry - wb-starter v3.0

Pinterest-style masonry grid using native CSS multi-column layout — items flow
top-to-bottom within a column, then wrap to the next column, with no gaps
between items of different heights.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `masonry` |
| Attribute | `x-masonry` |
| Applies to | any container element |
| Category | Layout |
| Source | `src/wb-viewmodels/layouts.js` |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `columns` | `columns` | number | `3` | Number of columns (sets `column-count`) |
| `gap` | `gap` | string | `"1rem"` | Space between columns and between stacked items within a column |

Every direct child also gets `break-inside: avoid` (so an item is never split
across two columns) and `margin-bottom` equal to `gap`.

## Usage

### Default (3 columns)

<div x-demo>
<div x-masonry>
  <div>Item 1</div>
  <div>Item 2<br>Item 2 has<br>extra lines<br>of content.</div>
  <div>Item 3</div>
  <div>Item 4</div>
  <div>Item 5<br>Also taller<br>than the rest.</div>
  <div>Item 6</div>
</div>
</div>

### Two columns with a wider gap

<div x-demo>
<div x-masonry columns="2" gap="2rem">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
</div>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-masonry` | Always | Marker class for targeting/testing; the column layout itself is set via inline `column-count`/`column-gap` |

## Accessibility

Masonry only changes the *visual* order in which items wrap into columns — it
does not reorder the DOM, so screen reader and keyboard tab order stay in
source order regardless of the visual column an item lands in.

## Source

[src/wb-viewmodels/layouts.js](../../../src/wb-viewmodels/layouts.js)
