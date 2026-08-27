# Hero Card

Hero banner with background image, title, subtitle, and optional CTA

## Type — decorates a semantic element

`x-cardhero` is the **section behavior**. It attaches to `<section>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<section x-cardhero
  pretitle="Release 3.0"
  title="Zero build. Real behaviors."
  subtitle="Light DOM, no shadow boundaries, no class hierarchy."
  cta="Read the guide"
  cta-href="#"
  height="320px"></section>
```

### On a different element

Use `x-cardhero` when the host is not a `<section>` and you want the same behavior:

```html
<div x-cardhero>
  …
</div>
```

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

## Live example

See `x-cardhero` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardhero` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardhero.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
