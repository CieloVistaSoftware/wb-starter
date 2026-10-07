# Ratio

`x-ratio` gives the element a fixed aspect ratio from `ratio` (`16:9`, `4x3` or `1/1` all work) and makes a direct image, video or iframe child cover it. Use it to reserve space for media before it loads.

## Usage

<div x-demo>
<div x-ratio ratio="16:9" style="max-width:320px">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Aerial_View%2C_A_coastline_of_Hailing_Island%2C_Yangjiang_City.jpg/1280px-Aerial_View%2C_A_coastline_of_Hailing_Island%2C_Yangjiang_City.jpg" alt="Coastline from the air">
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `ratio` | ratio, e.g. `16/9` | `16x9` | The aspect ratio the frame holds its child to, applied as the `--x-frame-ratio` custom property. The behavior's own default is `16/9`. NOTE: this schema declares a default of `16x9`, which the code never produces — the two disagree and the code is authoritative. |

<sub>Schema: [`ratio.schema.json`](../../src/wb-models/ratio.schema.json)</sub>
