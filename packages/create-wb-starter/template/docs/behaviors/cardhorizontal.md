# Horizontal Card

`x-cardhorizontal` renders a card with the image beside the text instead of above it; `image-position` picks the side and `image-width` how much of the card it takes. Use it for list-style layouts where cards are wide and short.

## Usage

<div x-demo>
<article x-cardhorizontal
  image="/images/placeholder.svg"
  image-alt="Pine trail at dawn"
  image-position="start"
  title="Ridge loop, 8km"
  subtitle="Moderate · 3h"></article>
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
