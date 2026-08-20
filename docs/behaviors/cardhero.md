# Hero Card

Hero banner with background image, title, subtitle, and optional CTA

Applies to `<section>`, and to any element carrying `x-cardhero`.

## Usage

```html
<section x-cardhero>
  …
</section>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `background` | `string` | — | Background image URL |
| `title` | `string` | — | Hero headline |
| `pretitle` | `string` | — | Small label or count shown above the title (e.g. '100 Components') |
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

## Live example

See `x-cardhero` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardhero` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardhero.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
