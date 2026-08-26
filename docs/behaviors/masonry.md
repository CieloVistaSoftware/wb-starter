# Masonry

Behavior applied with x-masonry.

## Type — new capability

`x-masonry` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-masonry columns="3" gap="0.75rem">
  <img src="https://picsum.photos/seed/m1/300/220" alt="">
  <img src="https://picsum.photos/seed/m2/300/320" alt="">
  <img src="https://picsum.photos/seed/m3/300/180" alt="">
  <img src="https://picsum.photos/seed/m4/300/260" alt="">
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `columns` | `string` | `3` | Read by masonry(). |
| `gap` | `string` | `1rem` | Read by masonry(). |

## Live example

See `x-masonry` on the [Behaviors showcase](/?page=behaviors) — search for `x-masonry` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/masonry.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
