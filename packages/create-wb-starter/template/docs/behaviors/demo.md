# Demo Container

A container that renders children normally in a CSS grid and shows the raw HTML as a syntax-highlighted, auto-formatted code sample below. Uses fetch for raw page source, formatHtml for consistent 2-space indentation, and textContent to prevent browser inflation.

Applies to `<div>`, and to any element carrying `x-demo`.

## Usage

```html
<div x-demo>
  …
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
