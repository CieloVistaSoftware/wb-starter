# Masonry

`x-masonry` flows its children into `columns` like a newspaper, so items of different heights pack without gaps. Use it for image walls and cards of uneven length.

## Usage

<div x-demo>
<div x-masonry columns="3" gap="0.75rem">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Price_Building_illuminated_at_night_in_Quebec_City.jpg/1280px-Price_Building_illuminated_at_night_in_Quebec_City.jpg" alt="">
  <img src="https://upload.wikimedia.org/wikipedia/commons/7/79/Joseph_Wright_of_Derby_%281734-1797%29_-_A_Moonlight_with_a_Lighthouse%2C_Coast_of_Tuscany_-_N05882_-_National_Gallery.jpg" alt="">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Aerial_view_of_path_and_trees%2C_Monsanto_Forest_Park%2C_Lisbon%2C_Portugal_julesvernex2.jpg/1280px-Aerial_view_of_path_and_trees%2C_Monsanto_Forest_Park%2C_Lisbon%2C_Portugal_julesvernex2.jpg" alt="">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lavender_field_on_Hvar.JPG/1280px-Lavender_field_on_Hvar.JPG" alt="">
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `columns` | `string` | `3` | Number of masonry columns. Defaults to `3`. |
| `gap` | `string` | `1rem` | Space between items, as a CSS length. Defaults to `1rem`. |

<sub>Schema: [`masonry.schema.json`](../../src/wb-models/masonry.schema.json)</sub>
