# Repeater

Behavior applied with x-repeater.

## Type — new capability

`x-repeater` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-repeater>
  <div>Row template — add and remove copies of this block.</div>
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `count` | `string` | `0` | Read by repeater(). |

## Live example

See `x-repeater` on the [Behaviors showcase](/?page=behaviors) — search for `x-repeater` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/repeater.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
