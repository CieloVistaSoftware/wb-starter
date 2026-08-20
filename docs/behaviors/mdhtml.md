# Markdown to HTML

Renders Markdown content as HTML, either from inline content or external source

Applies to `<div>`, and to any element carrying `x-mdhtml`.

## Usage

```html
<div x-mdhtml>
  …
</div>
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
