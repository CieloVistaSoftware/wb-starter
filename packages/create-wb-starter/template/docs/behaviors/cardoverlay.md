# Overlay Card

Card with text overlaid on background image

Applies to `<article>`, and to any element carrying `x-cardoverlay`.

## Usage

```html
<article x-cardoverlay>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `image` | `string` | — | Background image URL |
| `title` | `string` | — | Overlay title |
| `subtitle` | `string` | — | Overlay subtitle |
| `position` | `top` · `center` · `bottom` | `bottom` | Content position |
| `xalign` | `left` · `center` · `right` | `left` | Horizontal text alignment (x-axis) |
| `gradient` | `boolean` | `true` | Show gradient overlay for text readability |
| `height` | `string` | `300px` | Card height (CSS value) |
| `variant` | `default` · `dark` · `light` · `blur` | `default` | Visual style variant |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setImage()` — Changes background image

## Live example

See `x-cardoverlay` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardoverlay` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardoverlay.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
