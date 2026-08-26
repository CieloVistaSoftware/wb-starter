# Horizontal Card

Card with horizontal layout - image on side, content on other

## Type — decorates a semantic element

`x-cardhorizontal` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardhorizontal
  image="https://picsum.photos/seed/trail/320/240"
  image-alt="Pine trail at dawn"
  image-position="start"
  title="Ridge loop, 8km"
  subtitle="Moderate · 3h"></article>
```

### On a different element

Use `x-cardhorizontal` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardhorizontal>
  …
</div>
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
