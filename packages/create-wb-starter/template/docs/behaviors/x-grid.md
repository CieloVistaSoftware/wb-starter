# x-grid

A responsive CSS Grid layout — items auto-fit into columns based on a
minimum item width, so the column count collapses naturally on narrow
screens without a media query.

- **Type:** Behavior (works as `<div x-grid>` or `x-grid` on any element)
- **Source:** [`grid()` in `src/wb-viewmodels/layouts.js`](../../src/wb-viewmodels/layouts.js)

## Basic Usage

<div x-demo>
<div x-grid columns="3">
  <div>Cell 1</div>
  <div>Cell 2</div>
  <div>Cell 3</div>
</div>
</div>

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|--------------|
| `columns` | number | `3` | Target column count. Columns auto-collapse on narrow viewports — this sets the minimum item width used for that collapse (2→280px, 3→250px, 4→200px, 5→180px, 6→150px), not a hard column count. |
| `rows` | number | *(auto)* | Explicit row track count (`grid-template-rows: repeat(N, auto)`). Omit to let rows grow automatically as content is added. |
| `gap` | string | `1rem` | Any CSS gap value. |
| `min-width` | string | *(computed from `columns`)* | Overrides the auto-computed minimum item width used for column collapse. |
| `align` | string | *(none)* | `align-items` — vertical alignment of each cell's content. |
| `justify` | string | *(none)* | `justify-items` — horizontal alignment of each cell's content. |
| `center` | boolean | `false` | Shorthand for `align="center" justify="center"` plus centered text — the common case of "center everything in every cell." |
| `background` | string | *(none)* | Any CSS background value (a `var(--…)` token, not a literal color). |
| `alt-rows` | boolean | `false` | Zebra-stripes even-position children using `var(--bg-secondary)`. |
| `headers` | string | *(none)* | Comma-separated column labels, rendered as a header row prepended before the grid's own content. |

## Column Count

<div x-demo>
<div x-grid columns="4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</div>
</div>

## Explicit Rows

<div x-demo>
<div x-grid columns="2" rows="2">
  <div>A</div>
  <div>B</div>
  <div>C</div>
  <div>D</div>
</div>
</div>

## Centered Content

<div x-demo>
<div x-grid center>
  <div>Centered</div>
  <div>Content</div>
</div>
</div>

## Background

<div x-demo>
<div x-grid background="var(--bg-tertiary)">
  <div>On a themed background</div>
</div>
</div>

## Alternating Row Colors

<div x-demo>
<div x-grid
  columns="1"
  alt-rows>
  <div>Row 1</div>
  <div>Row 2</div>
  <div>Row 3</div>
  <div>Row 4</div>
</div>
</div>

## Column Headers

<div x-demo>
<div x-grid
  columns="3"
  headers="Name,Age,Email">
  <div>Alice</div>
  <div>30</div>
  <div>alice@example.com</div>
  <div>Bob</div>
  <div>25</div>
  <div>bob@example.com</div>
</div>
</div>

## Mixed: Data Table Style

Headers, alt-rows, and a fixed column count combine into a lightweight
data-table look without a real `<table>`.

<div x-demo>
<div x-grid
  columns="3"
  headers="Product,Price,Stock"
  alt-rows
  gap="0">
  <div>Widget</div>
  <div>$9.99</div>
  <div>42</div>
  <div>Gadget</div>
  <div>$19.99</div>
  <div>7</div>
  <div>Gizmo</div>
  <div>$14.99</div>
  <div>0</div>
</div>
</div>

## Notes

- `xalign` is a **card** property (aligns a card's own content left/center/right) — it is not a grid property. Use `align`/`justify`/`center` for grid content alignment instead.
- `alt-rows` stripes every other **child element** in DOM order, not visual grid rows — with a fixed `columns` count this lines up with actual rows (as in the examples above); with the default auto-fit column count it stripes by item position instead.
