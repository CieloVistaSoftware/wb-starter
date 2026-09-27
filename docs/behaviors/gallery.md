# Gallery

`x-gallery` lays the images inside it out as a grid of `columns` (or fixed-size tiles with `size`), and clicking any image opens it full-size in a lightbox you can step through.

## Usage

<div x-demo>
<div x-gallery columns="4">
  <img src="../../images/placeholder.svg" alt="Gallery 1">
  <img src="../../images/placeholder.svg" alt="Gallery 2">
  <img src="../../images/placeholder.svg" alt="Gallery 3">
  <img src="../../images/placeholder.svg" alt="Gallery 4">
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `columns` | `string` | `3` | Number of columns in the grid. Defaults to `3`. |
| `size` | `string` | — | Fixed thumbnail size (e.g. `150px`), independent of the column count — use it when you want uniform tiles rather than columns dividing the width. |
| `gap` | `string` | `1rem` | Space between items, as a CSS length. Defaults to `1rem`. |
| `lightbox` | `string` | — | Clicking any item opens it full-size in a lightbox. |

<sub>Schema: [`gallery.schema.json`](../../src/wb-models/gallery.schema.json)</sub>
