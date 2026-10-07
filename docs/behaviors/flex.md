# Flex

`x-flex` makes the element a flex container and sets `direction`, `wrap`, `justify`, `align` and `gap` from attributes, so a row or column layout needs no CSS. Use `x-stack` for a plain vertical column and `x-cluster` for wrapping chips.

## Usage

<div x-demo>
<div x-flex gap="1rem" justify="space-between">
  <div style="padding:0.5rem 1rem;border:1px solid var(--border-color)">First</div>
  <div style="padding:0.5rem 1rem;border:1px solid var(--border-color)">Second</div>
  <div style="padding:0.5rem 1rem;border:1px solid var(--border-color)">Third</div>
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `direction` | `row` · `column` · `row-reverse` · `column-reverse` | `row` | Flex direction: `row` (default) or `column`, plus the `-reverse` forms. Maps to CSS `flex-direction`. |
| `wrap` | `wrap` · `nowrap` · `wrap-reverse` | `wrap` | Whether items wrap onto more lines: `wrap` (default) or `nowrap`. Maps to CSS `flex-wrap`. |
| `justify` | `flex-start` · `center` · `flex-end` · `space-between` · `space-around` · `space-evenly` | `flex-start` | Distribution along the main axis — `flex-start` (default), `center`, `space-between`, and the rest of CSS `justify-content`. |
| `align` | `flex-start` · `center` · `flex-end` · `stretch` · `baseline` | `stretch` | Alignment across the cross axis — `stretch` (default), `center`, `flex-start`, and the rest of CSS `align-items`. |
| `gap` | CSS length | `1rem` | Space between items, as a CSS length. Defaults to `1rem`. |

<sub>Schema: [`flex.schema.json`](../../src/wb-models/flex.schema.json)</sub>
