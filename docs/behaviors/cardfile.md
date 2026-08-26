# File Card

File display card with icon, name, size, and download

## Type — decorates a semantic element

`x-cardfile` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardfile filename="quarterly-report.pdf" file-type="pdf" size="2.4 MB" date="2026-08-14" href="#"></article>
```

### On a different element

Use `x-cardfile` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardfile>
  …
</div>
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
