# Card Video - wb-starter v3.0

Card with an embedded video player. Uses `<video>` element with accessibility considerations.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardvideo>` |
| Behavior | `cardvideo` |
| Semantic | `<article>` + `<figure>` + `<video>` |
| Base Class | `wb-card wb-card-video` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | `""` | Video URL |
| `poster` | string | `""` | Poster image URL |
| `autoplay` | boolean | `false` | Auto-play video |
| `muted` | boolean | `false` | Start muted |
| `loop` | boolean | `false` | Loop playback |
| `controls` | boolean | `true` | Show controls |

## Usage

### Basic Video Card

```html
<wb-cardvideo 
  src="/videos/demo.mp4" 
  poster="/images/poster.jpg"
  title="Demo Video"
  controls>
</wb-cardvideo>
```

### Autoplay (Muted)

```html
<wb-cardvideo 
  src="/videos/background.mp4"
  autoplay
  muted
  loop
  title="Background Video">
</wb-cardvideo>
```

## Accessibility

Videos without captions will display a warning indicator. Add `<track>` elements for captions:

```html
<wb-cardvideo src="/video.mp4" title="Accessible Video">
  <track kind="captions" src="/captions.vtt" srclang="en" label="English">
</wb-cardvideo>
```

## Schema

Location: `src/wb-models/cardvideo.schema.json`
