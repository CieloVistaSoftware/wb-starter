# Image Card

Card with featured image and optional title/subtitle

Applies to `<article>`, and to any element carrying `x-cardimage`.

## Usage

```html
<article x-cardimage>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `https://picsum.photos/seed/cardimage/600/400` | Image source URL |
| `alt` | `string` | — | Image alt text (accessibility) |
| `title` | `string` | — | Card title |
| `subtitle` | `string` | — | Card subtitle |
| `caption` | `string` | — | Image caption (displayed below image) |
| `href` | `string` | — | Link URL (makes card clickable) |
| `aspect` | `16/9` · `4/3` · `1/1` · `3/2` · `21/9` · `auto` | `16/9` | Image aspect ratio |
| `position` | `top` · `bottom` · `left` · `right` | `top` | Image position relative to content |
| `fit` | `cover` · `contain` · `fill` · `none` | `cover` | Image object-fit mode |
| `loading` | `lazy` · `eager` | `lazy` | Image loading strategy |
| `variant` | `default` · `elevated` · `bordered` · `minimal` | `default` | Visual style variant |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setImage()` — Changes the image source
- `preload()` — Preloads the image

## Live example

See `x-cardimage` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardimage` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardimage.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
