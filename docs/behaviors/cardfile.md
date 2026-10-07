# File Card

`x-cardfile` renders a file entry as a card: an icon chosen from the extension of `filename`, the file size and date, and a download link to `href`. Use it for attachments and downloads.

## Usage

<div x-demo>
<article x-cardfile filename="quarterly-report.pdf" size="2.4 MB" date="2026-08-14" href="#"></article>
</div>

## One example per file type

The icon comes from the filename's extension; there is no separate type attribute to write, or to get out of step with the name. An extension the table does not know gets the generic file icon.

<div x-demo>
<article x-cardfile filename="quarterly-report.pdf" size="2.4 MB"></article>
</div>

<div x-demo>
<article x-cardfile filename="meeting-notes.docx" size="480 KB"></article>
</div>

<div x-demo>
<article x-cardfile filename="architecture-diagram.png" size="2.4 MB"></article>
</div>

<div x-demo>
<article x-cardfile filename="product-walkthrough.mp4" size="58 MB"></article>
</div>

<div x-demo>
<article x-cardfile filename="interview-recording.m4a" size="12 MB"></article>
</div>

<div x-demo>
<article x-cardfile filename="release-assets.zip" size="104 MB"></article>
</div>

<div x-demo>
<article x-cardfile filename="sensor-capture.bin" size="31 MB"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `filename` | file name with extension | — | File name. Its extension picks the icon, and it is the only way to say what kind of file it is (#1119). |
| `size` | text, e.g. `2.4 MB` | — | File size (e.g., 2.4 MB) |
| `date` | date | — | File date |
| `href` | URL | `#` | Download URL |
| `downloadable` | `boolean` | `true` | Show download link |
| `variant` | `default` · `compact` · `elevated` | `default` |  |
| `hoverText` | text | — | Alias for `tooltip` -- hover text shown as a themed WB tooltip (x-tooltip / tooltip.js), not the native browser title tooltip (#283). |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `download()` — Triggers download

<sub>Schema: [`cardfile.schema.json`](../../src/wb-models/cardfile.schema.json)</sub>
