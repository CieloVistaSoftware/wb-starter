# Markdown to HTML

Renders Markdown content as HTML, either from inline content or external source

## Type — new capability

`x-mdhtml` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-mdhtml src="/docs/behaviors/dropdown.md"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | — | Path to external markdown file |
| `sanitize` | `boolean` | `true` |  |
| `gfm` | `boolean` | `true` |  |

## Live example

See `x-mdhtml` on the [Behaviors showcase](/?page=behaviors) — search for `x-mdhtml` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/mdhtml.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
