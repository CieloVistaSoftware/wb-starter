# Horizontal Card

`x-cardhorizontal` renders a card with the image beside the text instead of above it; `imagePosition` picks the side and `imageWidth` how much of the card it takes. Use it for list-style layouts where cards are wide and short.

## Usage

<div x-demo>
<article x-cardhorizontal
  image="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Hiking_to_the_Ice_Lakes._San_Juan_National_Forest%2C_Colorado.jpg/1280px-Hiking_to_the_Ice_Lakes._San_Juan_National_Forest%2C_Colorado.jpg"
  imageAlt="Trail to the Ice Lakes, San Juan National Forest"
  title="Ridge loop, 8km"
  subtitle="Moderate · 3h"></article>
</div>

Anything written between the tags becomes the card's body, under the title:

<div x-demo>
<article x-cardhorizontal
  image="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mountains_in_snow%2C_Mountain_lake%2C_Chola_Valley%2C_Nepal%2C_Himalayas.jpg/1280px-Mountains_in_snow%2C_Mountain_lake%2C_Chola_Valley%2C_Nepal%2C_Himalayas.jpg"
  imageAlt="Snow-capped peaks above a mountain lake"
  title="Summit push, 14km"
  subtitle="Hard · 6h">
  The last kilometre is exposed scree; turn back in high wind.
</article>
</div>

## Image position

The image sits on the left unless told otherwise. Writing `imagePosition="left"`
says so explicitly and renders the same way:

<div x-demo>
<article x-cardhorizontal
  image="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Fishing_Boats_-_Howth_Harbour_%28288805840%29.jpg/1280px-Fishing_Boats_-_Howth_Harbour_%28288805840%29.jpg"
  imageAlt="Fishing boats in Howth Harbour"
  imagePosition="left"
  title="Harbour walk, 3km"
  subtitle="Easy · 1h">
  Flat all the way; the café at the far end opens at eight.
</article>
</div>

`imagePosition="right"` swaps the sides, which suits a list where the text
should line up on the left edge:

<div x-demo>
<article x-cardhorizontal
  image="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Panoramic_Overview_from_Glacier_Point_over_Yosemite_Valley_2013_Alternative.jpg/1280px-Panoramic_Overview_from_Glacier_Point_over_Yosemite_Valley_2013_Alternative.jpg"
  imageAlt="Yosemite Valley from Glacier Point"
  imagePosition="right"
  title="Sunrise viewpoint, 5km"
  subtitle="Moderate · 2h">
  Start an hour before sunrise; the viewpoint faces due east.
</article>
</div>

## Image width

`imageWidth` is any CSS width, measured against the card. The default is `40%`;
a photograph that carries the story can take more of the row:

<div x-demo>
<article x-cardhorizontal
  image="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Tarfala_valley_panorama.jpg/1280px-Tarfala_valley_panorama.jpg"
  imageAlt="The Tarfala valley"
  imageWidth="60%"
  title="Valley panorama"
  subtitle="Photo stop">
  The widest view on the route.
</article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `image` | URL | — | Image URL |
| `imageAlt` | text | — | Image alt text |
| `imagePosition` | `left` · `right` | `left` | Image position |
| `imageWidth` | CSS length | `40%` | Image width (CSS value) |
| `title` | text | — | Card title |
| `subtitle` | text | — | Card subtitle |
| `variant` | `default` · `elevated` · `bordered` · `minimal` | `default` | Visual style variant |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setImage()` — Changes the image

<sub>Schema: [`cardhorizontal.schema.json`](../../src/wb-models/cardhorizontal.schema.json)</sub>
