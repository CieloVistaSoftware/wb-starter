# File Card

File display card with icon, name, size, and download

Applies to `<article>`, and to any element carrying `x-cardfile`.

## Usage

```html
<article x-cardfile>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `filename` | `string` | — | File name |
| `file-type` | `pdf` · `doc` · `image` · `video` · `audio` · `zip` · `file` | `file` | File type for icon |
| `size` | `string` | — | File size (e.g., 2.4 MB) |
| `date` | `string` | — | File date |
| `href` | `string` | — | Download URL |
| `downloadable` | `boolean` | `true` | Show download link |
| `variant` | `default` · `compact` · `elevated` | `default` |  |
| `hover-text` | `string` | — | Alias for `tooltip` -- hover text shown as a themed WB tooltip (x-tooltip / tooltip.js), not the native browser title tooltip (#283). |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `download()` — Triggers download

## Live example

See `x-cardfile` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardfile` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardfile.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
