# File Card

`x-cardfile` renders a file entry as a card: an icon chosen from the extension of `filename`, the file size and date, and a download link to `href`. Use it for attachments and downloads.

## Usage

<div x-demo>
<article x-cardfile filename="quarterly-report.pdf" size="2.4 MB" date="2026-08-14" href="#"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `filename` | `string` | — | File name. Its extension picks the icon (#1117). |
| `file-type` | `pdf` · `doc` · `image` · `video` · `audio` · `zip` · `file` | derived from `filename` | OVERRIDE only. The icon normally comes from the filename's extension; set this when the name cannot say the type (no extension, or a `.bin` that really is a video). Contradicting the extension is honoured, but produces a self-contradicting example (#1114). |
| `size` | `string` | — | File size (e.g., 2.4 MB) |
| `date` | `string` | — | File date |
| `href` | `string` | `#` | Download URL |
| `downloadable` | `boolean` | `true` | Show download link |
| `variant` | `default` · `compact` · `elevated` | `default` |  |
| `hover-text` | `string` | — | Alias for `tooltip` -- hover text shown as a themed WB tooltip (x-tooltip / tooltip.js), not the native browser title tooltip (#283). |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `download()` — Triggers download

<sub>Schema: [`cardfile.schema.json`](../../src/wb-models/cardfile.schema.json)</sub>
