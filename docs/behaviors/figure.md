# Figure

A plain `<figure>` gets image handling: clicking the image opens it in a lightbox (write `lightbox="false"` to stop that), `caption` sets the `<figcaption>` text, and `caption-position="overlay"` lays the caption across the bottom of the image.

## Usage

<div x-demo>
<figure>
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Golden_Gate_Bridge_at_sunset_1.jpg/1280px-Golden_Gate_Bridge_at_sunset_1.jpg" alt="Suspension bridge in fog">
  <figcaption>The 6am crossing, before the fog lifted.</figcaption>
</figure>
</div>

No attribute needed on `<figure>`. Don't add `x-figure` to it (#746).

`<figure x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `caption-position` | `string` | `bottom` | Where the caption sits: `bottom` (default) places it beneath the image; `overlay` positions it absolutely across the bottom of the image on a translucent dark bar. |
| `zoom` | `boolean` | `false` | Clicking the image opens it at full size. Bare attribute. |
| `lightbox` | `string` | — | Open the image in a lightbox on click. **On by default** — this is opt-OUT, so write `lightbox="false"` to disable it. |
| `caption` | `string` | — | Caption text. Sets the `<figcaption>` content, creating one if the figure has none. |

<sub>Schema: [`figure.schema.json`](../../src/wb-models/figure.schema.json)</sub>
