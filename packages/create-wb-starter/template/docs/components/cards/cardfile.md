# Card File - wb-starter v3.0

File/document download card with file type icons.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardfile>` |
| Behavior | `cardfile` |
| Semantic | `<article>` + `<figure>` |
| Root CSS Class | `x-card x-card-file` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `filename` | string | `""` | File name |
| `type` | string | `"file"` | Type: `pdf`, `doc`, `image`, `video`, `audio`, `zip`, `file` |
| `size` | string | `""` | File size (e.g., "2.5 MB") |
| `date` | string | `""` | Date modified |
| `downloadable` | boolean | `true` | Show download button |
| `href` | string | `""` | Download URL |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<div x-cardfile
  filename="Annual Report.pdf"
  type="pdf"
  size="2.5 MB">
</div>
</div>

## Usage

### Basic File Card

```html
<div x-cardfile
  filename="Annual Report.pdf"
  type="pdf"
  size="2.5 MB">
</div>
```

### Downloadable File

```html
<div x-cardfile
  filename="Project Assets.zip"
  type="zip"
  size="15.3 MB"
  date="Jan 10, 2024"
  href="/downloads/assets.zip"
  downloadable>
</div>
```

### Image File

```html
<div x-cardfile
  filename="hero-banner.jpg"
  type="image"
  size="850 KB"
  date="Dec 5, 2023">
</div>
```

## File Type Icons

| Type | Icon |
|------|------|
| pdf | 📄 |
| doc | 📝 |
| image | 🖼️ |
| video | 🎬 |
| audio | 🎵 |
| zip | 📦 |
| file | 📁 |

## Schema

Location: `src/wb-models/cardfile.schema.json`
