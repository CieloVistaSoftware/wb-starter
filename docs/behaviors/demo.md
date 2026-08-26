# Demo Container

A container that renders children normally in a CSS grid and shows the raw HTML as a syntax-highlighted, auto-formatted code sample below. Uses fetch for raw page source, formatHtml for consistent 2-space indentation, and textContent to prevent browser inflation.

## Type — new capability

`x-demo` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-demo columns="2">
  <button>
  no attributes
</button>
  <button>
  no attributes
</button>
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `columns` | `integer` | `1` | Number of grid columns for children (1-6) |

## Live example

See `x-demo` on the [Behaviors showcase](/?page=behaviors) — search for `x-demo` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/demo.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
