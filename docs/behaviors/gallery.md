# Gallery

`x-gallery` lays the images inside it out as a grid of `columns` (or fixed-size tiles with `size`), and clicking any image opens it full-size in a lightbox you can step through.

## Usage

<div x-demo>
<div x-gallery columns="4">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Panoramic_Overview_from_Glacier_Point_over_Yosemite_Valley_2013_Alternative.jpg/1280px-Panoramic_Overview_from_Glacier_Point_over_Yosemite_Valley_2013_Alternative.jpg" alt="Gallery 1">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Tip_of_the_fjord-Abstract.jpg/1280px-Tip_of_the_fjord-Abstract.jpg" alt="Gallery 2">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Utah_Dunes_Landscape_-_West_Desert_District.jpg/1280px-Utah_Dunes_Landscape_-_West_Desert_District.jpg" alt="Gallery 3">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Frederic_Edwin_Church_-_Aurora_Borealis_-_Google_Art_Project.jpg/1280px-Frederic_Edwin_Church_-_Aurora_Borealis_-_Google_Art_Project.jpg" alt="Gallery 4">
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
