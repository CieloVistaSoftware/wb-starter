# Figure

A plain `<figure>` gets image handling: clicking the image opens it in a lightbox (write `lightbox="false"` to stop that), `caption` sets the `<figcaption>` text, and `captionPosition="overlay"` lays the caption across the bottom of the image.

## Usage

<div x-demo>
<figure>
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Golden_Gate_Bridge_at_sunset_1.jpg/1280px-Golden_Gate_Bridge_at_sunset_1.jpg" alt="Suspension bridge in fog">
  <figcaption>The 6am crossing, before the fog lifted.</figcaption>
</figure>
</div>

No attribute needed on `<figure>`. Don't add `x-figure` to it (#746).

`<figure x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Controlling size

**Set the figure's `width`.** The image shrinks to fit and the caption wraps at the same width. A bare number is pixels; any CSS length works (`20rem`, `50%`). A figure never grows past its container.

<div x-demo>
<figure width="320">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Golden_Gate_Bridge_at_sunset_1.jpg/1280px-Golden_Gate_Bridge_at_sunset_1.jpg" alt="Suspension bridge at sunset, in a 320 pixel figure">
  <figcaption>The whole figure, caption included, is 320 pixels wide.</figcaption>
</figure>
</div>

**Set the image's shape on the `<img>`.** A figure has no height of its own: it is as tall as its image plus its caption. Give the image both `width` and `height`, or an `aspectRatio`, and it is cropped to that shape (see [Img](img.md#controlling-size)).

<div x-demo>
<figure width="240">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Golden_Gate_Bridge_at_sunset_1.jpg/1280px-Golden_Gate_Bridge_at_sunset_1.jpg" width="240" height="240" alt="Suspension bridge at sunset, cropped square">
  <figcaption>Cropped to a 240 by 240 square.</figcaption>
</figure>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `captionPosition` | `string` | `bottom` | Where the caption sits: `bottom` (default) places it beneath the image; `overlay` positions it absolutely across the bottom of the image on a translucent dark bar. |
| `zoom` | `boolean` | `false` | Clicking the image opens it at full size. Bare attribute. |
| `lightbox` | `string` | — | Open the image in a lightbox on click. **On by default** — this is opt-OUT, so write `lightbox="false"` to disable it. |
| `caption` | `string` | — | Caption text. Sets the `<figcaption>` content, creating one if the figure has none. |
| `width` | `string` | — | Width of the whole figure, image and caption together. A bare number is pixels (`width="320"`); any CSS length works (`20rem`, `50%`). Capped at the container's width. |

<sub>Schema: [`figure.schema.json`](../../src/wb-models/figure.schema.json)</sub>
