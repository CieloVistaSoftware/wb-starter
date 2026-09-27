# Hero Card

`x-cardhero` renders a large banner card with an optional small `pretitle`, a headline, a subtitle and up to two call-to-action buttons, over an optional `background` image. Put it at the top of a page or section; `variant` switches between the stock looks.

## Usage

<div x-demo>
<section x-cardhero
  pretitle="Release 3.0"
  title="Zero build. Real behaviors."
  subtitle="Light DOM, no shadow boundaries, no class hierarchy."
  cta="Read the guide"
  cta-href="#"
  height="320px"></section>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `background` | `string` | — | Background image URL |
| `title` | `string` | — | Hero headline |
| `pretitle` | `string` | — | Small label or count shown above the title (e.g. '100 Behaviors') |
| `subtitle` | `string` | — | Hero tagline/subheadline |
| `content` | `string` | — | HTML content rendered in the hero content area (allows attribute-only usage instead of slots) |
| `cta` | `string` | — | Call-to-action button text |
| `cta-href` | `string` | `#` | Call-to-action link URL |
| `cta-secondary` | `string` | — | Secondary CTA text |
| `cta-secondary-href` | `string` | `#` | Secondary CTA URL |
| `variant` | `default` · `cosmic` · `split` · `minimal` · `gradient` | `default` | Visual style variant |
| `xalign` | `left` · `center` · `right` | `center` | Horizontal content alignment (x-axis) |
| `overlay` | `boolean` | `true` | Show gradient overlay for text readability |
| `full-height` | `boolean` | `false` | Make hero full viewport height |

## Methods

- `show()` — Shows the hero
- `hide()` — Hides the hero
- `toggle()` — Toggles hero visibility
- `animate()` — Triggers hero entrance animation
- `setBackground()` — Changes the background image

<sub>Schema: [`cardhero.schema.json`](../../src/wb-models/cardhero.schema.json)</sub>
