# Horizontal Card

`x-cardhorizontal` renders a card with the image beside the text instead of above it; `imagePosition` picks the side and `imageWidth` how much of the card it takes. Use it for list-style layouts where cards are wide and short.

## Usage

<div x-demo>
<article x-cardhorizontal
  image="/images/placeholder-forest.svg"
  imageAlt="Pine trail at dawn"
  title="Ridge loop, 8km"
  subtitle="Moderate · 3h"></article>
</div>

Anything written between the tags becomes the card's body, under the title:

<div x-demo>
<article x-cardhorizontal
  image="/images/placeholder-mountain.svg"
  imageAlt="Summit cairn above the tree line"
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
  image="/images/placeholder-waves.svg"
  imageAlt="Waves breaking on the harbour wall"
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
  image="/images/placeholder-sunrise.svg"
  imageAlt="Sunrise over the eastern ridge"
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
  image="/images/placeholder-scene.svg"
  imageAlt="Valley panorama from the col"
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
