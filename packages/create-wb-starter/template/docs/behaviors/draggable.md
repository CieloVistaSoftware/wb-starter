# Draggable

Make an element draggable.

## Type — new capability

`x-draggable` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-draggable axis="both">Drag me anywhere in the stage.</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `axis` | `x` · `y` · `both` | `both` |  |
| `handle` | `string` | — | Selector for drag handle |

## Live example

See `x-draggable` on the [Behaviors showcase](/?page=behaviors) — search for `x-draggable` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/draggable.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
