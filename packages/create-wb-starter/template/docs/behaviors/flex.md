# Flex

Behavior applied with x-flex.

## Type — new capability

`x-flex` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-flex gap="1rem">
  <div>First</div><div>Second</div><div>Third</div>
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `direction` | `string` | `row` | Flex direction: `row` (default) or `column`, plus the `-reverse` forms. Maps to CSS `flex-direction`. |
| `wrap` | `string` | `wrap` | Whether items wrap onto more lines: `wrap` (default) or `nowrap`. Maps to CSS `flex-wrap`. |
| `justify` | `string` | `flex-start` | Distribution along the main axis — `flex-start` (default), `center`, `space-between`, and the rest of CSS `justify-content`. |
| `align` | `string` | `stretch` | Alignment across the cross axis — `stretch` (default), `center`, `flex-start`, and the rest of CSS `align-items`. |
| `gap` | `string` | `1rem` | Space between items, as a CSS length. Defaults to `1rem`. |

## Live example

See `x-flex` on the [Behaviors showcase](/?page=behaviors) — search for `x-flex` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/flex.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
