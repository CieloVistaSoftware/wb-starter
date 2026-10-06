# Cover - wb-starter v3.0

A full-height (or custom-height) flex column that vertically centers its
content, with a `<header>` child pinned to the top and a `<footer>` child pinned
to the bottom — the classic hero/splash-screen layout.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `cover` |
| Attribute | `x-cover` |
| Applies to | any container |
| Category | Layout |
| Source | `src/wb-viewmodels/layouts.js` |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `minHeight` | `minHeight` | string | `"100vh"` | Minimum height of the cover container |
| `padding` | `padding` | string | `"1rem"` | Padding around the container's content |

The container becomes a `display: flex; flex-direction: column` box. When it
has a `<header>` or `<footer>` child, those stay pinned to the container's
edges and every child between them is centered as one group. With neither, the
whole content is centered. No marker attribute is needed.

## Usage

### Header and footer pinned, content centered

<div x-demo>
<div x-cover minHeight="300px">
  <header>Top content</header>
  <h2>Vertically centered content</h2>
  <footer>Bottom content</footer>
</div>
</div>

### Custom padding

<div x-demo>
<div x-cover minHeight="200px" padding="2rem">
  <p>Centered, with extra padding around the whole container.</p>
</div>
</div>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-cover` | Always | Marker class for targeting/testing; the flex layout and centering are applied inline |

## Accessibility

`cover` is purely visual — it repositions content, not DOM order, so reading
order for assistive technology matches source order regardless of which
element is visually centered. If the cover contains a heading, keep normal
heading-level nesting (don't skip levels just because the heading is visually
prominent).

## Source

[src/wb-viewmodels/layouts.js](../../src/wb-viewmodels/layouts.js)
