# Resizable

Make an element resizable.

## Type — new capability

`x-resizable` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-resizable handles="se">
  Grab the corner and resize this panel.
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `handles` | `string` | `se` |  |

## Live example

See `x-resizable` on the [Behaviors showcase](/?page=behaviors) — search for `x-resizable` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/resizable.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
