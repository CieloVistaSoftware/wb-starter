# Gallery

Behavior applied with x-gallery.

## Type — new capability

`x-gallery` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-gallery columns="4">
        <img src="images/placeholder.svg" alt="Gallery 1">
        <img src="images/placeholder.svg" alt="Gallery 2">
        <img src="images/placeholder.svg" alt="Gallery 3">
        <img src="images/placeholder.svg" alt="Gallery 4">
      </div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `columns` | `string` | `3` | Number of columns in the grid. Defaults to `3`. |
| `size` | `string` | — | Fixed thumbnail size (e.g. `150px`), independent of the column count — use it when you want uniform tiles rather than columns dividing the width. |
| `gap` | `string` | `1rem` | Space between items, as a CSS length. Defaults to `1rem`. |
| `lightbox` | `string` | — | Clicking any item opens it full-size in a lightbox. |

## Live example

See `x-gallery` on the [Behaviors showcase](/?page=behaviors) — search for `x-gallery` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/gallery.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
