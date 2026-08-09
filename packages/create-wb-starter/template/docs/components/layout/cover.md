# Cover - wb-starter v3.0

A full-height (or custom-height) flex column that vertically centers one
designated "principal" child, with any other children pushed to the top and
bottom — the classic hero/splash-screen layout.

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
| `minHeight` | `min-height` | string | `"100vh"` | Minimum height of the cover container |
| `padding` | `padding` | string | `"1rem"` | Padding around the container's content |

The container becomes a `display: flex; flex-direction: column` box. Any
descendant marked with the `data-principal` attribute gets `margin-top: auto`
and `margin-bottom: auto`, which pushes it to vertical center while other
children (e.g. a header above it, a footer below it) stay pinned to the
container's edges.

## Usage

### Basic cover with a centered principal element

<wb-demo>
<div x-cover min-height="300px">
  <header>Top content</header>
  <div data-principal>
    <h2>Vertically centered principal content</h2>
  </div>
  <footer>Bottom content</footer>
</div>
</wb-demo>

### Custom padding

<wb-demo>
<div x-cover min-height="200px" padding="2rem">
  <div data-principal>
    <p>Centered, with extra padding around the whole container.</p>
  </div>
</div>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-cover` | Always | Marker class for targeting/testing; the flex layout and centering are applied inline |

## Accessibility

`cover` is purely visual — it repositions content, not DOM order, so reading
order for assistive technology matches source order regardless of which
element is visually centered. If the cover contains a heading, keep normal
heading-level nesting (don't skip levels just because the heading is visually
prominent).

## Source

[src/wb-viewmodels/layouts.js](../../../src/wb-viewmodels/layouts.js)
