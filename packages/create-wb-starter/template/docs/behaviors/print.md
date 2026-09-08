# Print

Behavior applied with x-print.

## Type — new capability

`x-print` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="secondary" x-print>
  x-print · variant: secondary
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `target` | `string` | — | Read by print(). |
| `label` | `string` | `🖨️ Print` | Read by print(). |

## Live example

See `x-print` on the [Behaviors showcase](/?page=behaviors) — search for `x-print` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/print.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
