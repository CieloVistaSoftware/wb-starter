# Card File - wb-starter v3.0

File/document download card with file type icons.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardfile>` |
| Behavior | `cardfile` |
| Semantic | `<article>` + `<figure>` |
| Base Class | `wb-card wb-card-file` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `filename` | string | `""` | File name |
| `type` | string | `"file"` | Type: `pdf`, `doc`, `image`, `video`, `audio`, `zip`, `file` |
| `size` | string | `""` | File size (e.g., "2.5 MB") |
| `date` | string | `""` | Date modified |
| `downloadable` | boolean | `true` | Show download button |
| `href` | string | `""` | Download URL |

## Usage

### Basic File Card

```html
<wb-cardfile 
  filename="Annual Report.pdf"
  type="pdf"
  size="2.5 MB">
</wb-cardfile>
```

### Downloadable File

```html
<wb-cardfile 
  filename="Project Assets.zip"
  type="zip"
  size="15.3 MB"
  date="Jan 10, 2024"
  href="/downloads/assets.zip"
  downloadable>
</wb-cardfile>
```

### Image File

```html
<wb-cardfile 
  filename="hero-banner.jpg"
  type="image"
  size="850 KB"
  date="Dec 5, 2023">
</wb-cardfile>
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
