# Overlay Card

`x-cardoverlay` renders a card whose title and subtitle sit on top of a background `image`, with a gradient behind the text to keep it readable. `position` puts the text at the top, centre or bottom.

## Usage

<div x-demo>
<article x-cardoverlay
  image="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Price_Building_illuminated_at_night_in_Quebec_City.jpg/1280px-Price_Building_illuminated_at_night_in_Quebec_City.jpg"
  title="Night shift"
  subtitle="City desk, 02:00"
  position="bottom"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `image` | URL | — | Background image URL |
| `title` | text | — | Overlay title |
| `subtitle` | text | — | Overlay subtitle |
| `position` | `top` · `center` · `bottom` | `bottom` | Content position |
| `xalign` | `left` · `center` · `right` | `left` | Horizontal text alignment (x-axis) |
| `gradient` | `boolean` | `true` | Show gradient overlay for text readability |
| `height` | CSS length | `300px` | Card height (CSS value) |
| `variant` | `default` · `dark` · `light` · `blur` | `default` | Visual style variant |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setImage()` — Changes background image

<sub>Schema: [`cardoverlay.schema.json`](../../src/wb-models/cardoverlay.schema.json)</sub>
