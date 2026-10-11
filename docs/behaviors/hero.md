# Hero

`x-hero` styles a section as a page hero: large centred heading and lead text on a full-width band. `variant="cosmic"` switches to the dark starfield look.

## Usage

<figure x-demo>
<div x-hero>
  <h1>Ship the markup, not the toolchain</h1>
  <p>Behaviors decorate real elements in light DOM — no build, no shadow roots.</p>
</div>
</figure>

### Golden ratio

`goldenRatio` shapes the band as a landscape golden rectangle, 1.618 times as wide as it is tall, in place of the usual 400px minimum height. The heading and lead text keep their sizes.

<figure x-demo>
<div x-hero goldenRatio>
  <h1>Hello.</h1>
</div>
</figure>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `` · `default` · `cosmic` | `default` |  |
| `goldenRatio` | `boolean` | `false` | Shape the hero band as a landscape golden rectangle: width / height = 1.618, through `aspect-ratio: var(--aspect-golden)`. The width stays whatever the layout gives it and the height follows. Replaces the 400px minimum height; content taller than that still grows the band. Text sizes are unchanged. Bare attribute. |

<sub>Schema: [`hero.schema.json`](../../src/wb-models/hero.schema.json)</sub>
