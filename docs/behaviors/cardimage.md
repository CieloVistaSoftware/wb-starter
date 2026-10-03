# Image Card

`x-cardimage` renders a card led by an image from `src`, with a title, subtitle and caption under it. `aspect` fixes the image ratio, and `href` makes the whole card a link.

## Usage

<div x-demo>
<article x-cardimage
  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Fishing_Boats_-_Howth_Harbour_%28288805840%29.jpg/1280px-Fishing_Boats_-_Howth_Harbour_%28288805840%29.jpg"
  alt="Fishing boats at the harbour wall"
  title="Harbour at first light"
  caption="Shot on the 6am walk-around."></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `/images/placeholder.svg` | Image source URL |
| `alt` | `string` | — | Image alt text (accessibility) |
| `title` | `string` | — | Card title |
| `subtitle` | `string` | — | Card subtitle |
| `caption` | `string` | — | Image caption (displayed below image) |
| `href` | `string` | `#` | Link URL (makes card clickable) |
| `aspect` | `16/9` · `4/3` · `1/1` · `3/2` · `21/9` · `auto` | `16/9` | Image aspect ratio |
| `position` | `top` · `bottom` · `left` · `right` | `top` | Image position relative to content |
| `fit` | `cover` · `contain` · `fill` · `none` | `cover` | Image object-fit mode |
| `loading` | `lazy` · `eager` | `lazy` | Image loading strategy |
| `variant` | `default` · `elevated` · `bordered` · `minimal` | `default` | Visual style variant |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setImage()` — Changes the image source
- `preload()` — Preloads the image

<sub>Schema: [`cardimage.schema.json`](../../src/wb-models/cardimage.schema.json)</sub>
