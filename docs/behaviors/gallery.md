# Gallery

Behavior applied with x-gallery.

## Type — new capability

`x-gallery` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-gallery columns="4">
        <img src="https://picsum.photos/200/200?r=gal1" alt="Gallery 1">
        <img src="https://picsum.photos/200/200?r=gal2" alt="Gallery 2">
        <img src="https://picsum.photos/200/200?r=gal3" alt="Gallery 3">
        <img src="https://picsum.photos/200/200?r=gal4" alt="Gallery 4">
      </div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `columns` | `string` | `3` | Read by gallery(). |
| `size` | `string` | — | Read by gallery(). |
| `gap` | `string` | `1rem` | Read by gallery(). |
| `lightbox` | `string` | — | Read by gallery(). |

## Live example

See `x-gallery` on the [Behaviors showcase](/?page=behaviors) — search for `x-gallery` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/gallery.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
