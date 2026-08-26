# Overlay Card

Card with text overlaid on background image

## Type — decorates a semantic element

`x-cardoverlay` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardoverlay
  image="https://picsum.photos/seed/city/480/320"
  title="Night shift"
  subtitle="City desk, 02:00"
  position="bottom"></article>
```

### On a different element

Use `x-cardoverlay` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardoverlay>
  …
</div>
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
