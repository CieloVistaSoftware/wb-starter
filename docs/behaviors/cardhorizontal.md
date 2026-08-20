# Horizontal Card

Card with horizontal layout - image on side, content on other

Applies to `<article>`, and to any element carrying `x-cardhorizontal`.

## Usage

```html
<article x-cardhorizontal>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `image` | `string` | — | Image URL |
| `image-alt` | `string` | — | Image alt text |
| `image-position` | `left` · `right` | `left` | Image position |
| `image-width` | `string` | `40%` | Image width (CSS value) |
| `title` | `string` | — | Card title |
| `subtitle` | `string` | — | Card subtitle |
| `variant` | `default` · `elevated` · `bordered` · `minimal` | `default` | Visual style variant |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setImage()` — Changes the image

## Live example

See `x-cardhorizontal` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardhorizontal` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardhorizontal.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
