# Horizontal Card

`x-cardhorizontal` renders a card with the image beside the text instead of above it; `image-position` picks the side and `image-width` how much of the card it takes. Use it for list-style layouts where cards are wide and short.

## Usage

<div x-demo>
<article x-cardhorizontal
  image="/images/placeholder-forest.svg"
  image-alt="Pine trail at dawn"
  title="Ridge loop, 8km"
  subtitle="Moderate · 3h"></article>
</div>

Anything written between the tags becomes the card's body, under the title:

<div x-demo>
<article x-cardhorizontal
  image="/images/placeholder-mountain.svg"
  image-alt="Summit cairn above the tree line"
  title="Summit push, 14km"
  subtitle="Hard · 6h">
  The last kilometre is exposed scree; turn back in high wind.
</article>
</div>

## Image position

The image sits on the left unless told otherwise. Writing `image-position="left"`
says so explicitly and renders the same way:

<div x-demo>
<article x-cardhorizontal
  image="/images/placeholder-waves.svg"
  image-alt="Waves breaking on the harbour wall"
  image-position="left"
  title="Harbour walk, 3km"
  subtitle="Easy · 1h">
  Flat all the way; the café at the far end opens at eight.
</article>
</div>

`image-position="right"` swaps the sides, which suits a list where the text
should line up on the left edge:

<div x-demo>
<article x-cardhorizontal
  image="/images/placeholder-sunrise.svg"
  image-alt="Sunrise over the eastern ridge"
  image-position="right"
  title="Sunrise viewpoint, 5km"
  subtitle="Moderate · 2h">
  Start an hour before sunrise; the viewpoint faces due east.
</article>
</div>

## Image width

`image-width` is any CSS width, measured against the card. The default is `40%`;
a photograph that carries the story can take more of the row:

<div x-demo>
<article x-cardhorizontal
  image="/images/placeholder-scene.svg"
  image-alt="Valley panorama from the col"
  image-width="60%"
  title="Valley panorama"
  subtitle="Photo stop">
  The widest view on the route.
</article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `image` | `string` | — | Image URL |
| `image-alt` | `string` | — | Image alt text |
| `image-position` | `left` · `right` | `left` | Image position |
| `image-width` | `string` | `40%` | Image width (CSS value) |
| `title` | `string` | — | Card title |
| `subtitle` | `string` | — | Card subtitle |
| `variant` | `default` · `elevated` · `bordered` · `minimal` | `default` | Visual style variant |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setImage()` — Changes the image

<sub>Schema: [`cardhorizontal.schema.json`](../../src/wb-models/cardhorizontal.schema.json)</sub>
