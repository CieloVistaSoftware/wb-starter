# Card Video - wb-starter v3.0

Card with an embedded video player. Uses `<video>` element with accessibility considerations.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardvideo>` |
| Behavior | `cardvideo` |
| Semantic | `<article>` + `<figure>` + `<video>` |
| Root CSS Class | `x-card x-card-video` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | `""` | Video URL |
| `poster` | string | `""` | Poster image URL |
| `autoplay` | boolean | `false` | Auto-play video |
| `muted` | boolean | `false` | Start muted |
| `loop` | boolean | `false` | Loop playback |
| `controls` | boolean | `true` | Show controls |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-cardvideo
  src="/videos/demo.mp4"
  poster="https://picsum.photos/seed/poster/800/450"
  title="Demo Video"
  controls>
</div>
</div>

## Usage

### Basic Video Card

```html
<div x-cardvideo
  src="/videos/demo.mp4"
  poster="https://picsum.photos/seed/poster/800/450"
  title="Demo Video"
  controls>
</div>
```

### Autoplay (Muted)

```html
<div x-cardvideo
  src="/videos/background.mp4"
  autoplay
  muted
  loop
  title="Background Video">
</div>
```

## Accessibility

Videos without captions will display a warning indicator. Add `<track>` elements for captions:

```html
<div x-cardvideo
  src="/video.mp4"
  title="Accessible Video">
  <track
    kind="captions"
    src="/captions.vtt"
    srclang="en"
    label="English">
</div>
```

## Schema

Location: `src/wb-models/cardvideo.schema.json`
