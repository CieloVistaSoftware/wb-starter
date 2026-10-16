# Hero Card

`x-cardhero` renders a large banner card with an optional small `pretitle`, a headline, a subtitle and up to two call-to-action buttons, over an optional `background` image. Put it at the top of a page or section; `variant` switches between the stock looks.

## Usage

<figure x-demo>
<section x-cardhero
  pretitle="Release 3.0"
  title="Zero build. Real behaviors."
  subtitle="Light DOM, no shadow boundaries, no class hierarchy."
  cta="Read the guide"
  ctaHref="#"
  height="320px"></section>
</figure>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `background` | URL | — | Background image URL |
| `title` | text | — | Hero headline |
| `pretitle` | text | — | Small label or count shown above the title (e.g. '100 Behaviors') |
| `subtitle` | text | — | Hero tagline/subheadline |
| `content` | text or HTML | — | HTML content rendered in the hero content area (allows attribute-only usage instead of slots) |
| `cta` | text | — | Call-to-action button text |
| `ctaHref` | URL | `#` | Call-to-action link URL |
| `ctaSecondary` | text | — | Secondary CTA text |
| `ctaSecondaryHref` | URL | `#` | Secondary CTA URL |
| `variant` | `default` · `cosmic` · `split` · `minimal` · `gradient` | `default` | Visual style variant |
| `xalign` | `left` · `center` · `right` | `center` | Horizontal content alignment (x-axis) |
| `overlay` | `boolean` | `true` | Show gradient overlay for text readability |
| `fullHeight` | `boolean` | `false` | Make hero full viewport height |
| `headingLevel` | `1` · `2` · `3` · `4` · `5` · `6` | `3` | Which heading tag the title is, `<h1>` to `<h6>` |

`headingLevel` is document structure only: it changes the title's tag, not its
size or style, so all six levels look the same. Use `1` when the hero is the
page's main heading, and a lower level when the hero sits inside a section.
Screen readers and search engines read the tag; the reader sees one design. On
the Behaviors page, each `headingLevel` row shows the tag it renders.

## Methods

- `show()` — Shows the hero
- `hide()` — Hides the hero
- `toggle()` — Toggles hero visibility
- `animate()` — Triggers hero entrance animation
- `setBackground()` — Changes the background image

<sub>Schema: [`cardhero.schema.json`](../../src/wb-models/cardhero.schema.json)</sub>
