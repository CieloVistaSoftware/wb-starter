# Grid - wb-starter v3.0

CSS Grid layout with a mobile-first auto-fit default, optional fixed rows, alternating-row striping, and generated header cells.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-grid>` |
| Behavior | `grid` |
| Semantic | `<div>` (structural/CSS-only -- no schema, no `$methods`/`$view`) |
| Root CSS Class | *(none added by JS -- `x-grid` is styled as a tag selector; see below)* |
| Category | Layout |

`grid()` (`src/wb-viewmodels/layouts.js`) is a plain structural behavior driven entirely by attributes, applied as inline styles.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | string | `"3"` | Used to pick a sensible default min-width per column count (`2`→280px, `3`→250px, `4`→200px, `5`→180px, `6`→150px) when `min-width` isn't set |
| `min-width` | string | *(computed from `columns`)* | Explicit column min-width -- overrides the `columns`-based default |
| `rows` | string | `""` | When set, fixes `grid-template-rows: repeat(N, auto)` |
| `gap` | string | `"1rem"` | Gap between cells |
| `align` | string | `""` | `align-items` |
| `justify` | string | `""` | `justify-items` |
| `center` | boolean | `false` | Shorthand: centers items both ways and centers text |
| `background` | string | `""` | Inline background |
| `alt-rows` | boolean | `false` | Zebra-stripes even children |
| `headers` | string | `""` | Comma-separated header labels, injected as `.x-grid__header` cells |

## Usage

### Custom Element (Auto-Fit, 3 Columns)

<div x-demo>
<div x-grid>
  <article title="A">Card A</article>
  <article title="B">Card B</article>
  <article title="C">Card C</article>
</div>
</div>

### Explicit Column Count

```html
<div x-grid
  columns="4"
  gap="0.75rem">
  <span x-badge label="1"></span>
  <span x-badge label="2"></span>
  <span x-badge label="3"></span>
  <span x-badge label="4"></span>
</div>
```

### Alternating Row Stripes

```html
<div x-grid
  columns="2"
  alt-rows>
  <div>Row 1, Col 1</div>
  <div>Row 1, Col 2</div>
  <div>Row 2, Col 1</div>
  <div>Row 2, Col 2</div>
</div>
```

### Generated Headers

```html
<div x-grid
  columns="3"
  headers="Name, Role, Status">
  <div>Alice</div>
  <div>Admin</div>
  <div>Active</div>
  <div>Bob</div>
  <div>Editor</div>
  <div>Active</div>
</div>
```

### Centered Content

```html
<div x-grid
  columns="3"
  center>
  <span x-badge label="One"></span>
  <span x-badge label="Two"></span>
  <span x-badge label="Three"></span>
</div>
```

### Native `<div>` (Enhanced)

```html
<!-- x-grid works on any element -->
<div
  x-grid
  columns="2">
  <span x-badge label="A"></span>
  <span x-badge label="B"></span>
</div>
```

## Generated Structure

```html
<div x-grid
  style="display:grid;
         gap:1rem;
         grid-template-columns:repeat(auto-fit, minmax(min(250px, 100%), 1fr));">
  <!-- headers, when provided -->
  <div class="x-grid__header">Name</div>
  <div class="x-grid__header">Role</div>
  <!-- original children, unmodified -->
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `x-grid` (tag selector) | Always | Default `display:grid` + 3-column auto-fit template (first-paint fallback, before/independent of JS) |
| `.x-grid--alt-rows` | `alt-rows` | Zebra-stripes even children via `--bg-secondary` |
| `.x-grid__header` | `headers` set | Generated header cell styling |

## Methods

None. `grid()` returns a cleanup function that removes `.x-grid--alt-rows`, and attaches no API to the element.

## Events

None. `<div x-grid>` dispatches no custom events.

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--bg-secondary` | `.x-grid--alt-rows` even-row background | -- |
| `--border-color` | `.x-grid__header` bottom border | -- |
| `--text-secondary` | `.x-grid__header` text color | -- |

Column count, gap, and min-width are set directly from attributes as inline styles (not themeable custom properties) once `grid()` runs; the `x-grid` tag-selector default above is what paints before JS executes.

## Accessibility

`<div x-grid>` is a purely presentational layout container -- it sets no ARIA role or attributes. When used to lay out tabular data, consider pairing it with real table semantics (see the [Table component](../semantics/table.md)) instead, or add `role="table"`/`role="row"`/`role="cell"` to the grid and its children yourself.
