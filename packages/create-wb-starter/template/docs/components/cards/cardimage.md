# Card Image - wb-starter v3.0

Card with a featured image. Uses `<figure>` for semantic image containment.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardimage>` |
| Behavior | `cardimage` |
| Semantic | `<article>` + `<figure>` |
| Root CSS Class | `x-card x-card-image` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | `""` | Image URL |
| `alt` | string | `""` | Image alt text |
| `aspect` | string | `"16/9"` | Aspect ratio |
| `position` | string | `"top"` | Image position: `top`, `bottom` |
| `fit` | string | `"cover"` | Object fit: `cover`, `contain`, `fill` |

## Usage

### Basic Image Card

<div x-demo>
<div x-cardimage
  src="https://picsum.photos/seed/hero/400/225"
  alt="Hero image"
  title="Featured Image"
  content="Optional content below the image.">
</div>
</div>

### With Custom Aspect Ratio

<div x-demo>
<div x-cardimage
  src="https://picsum.photos/seed/square/300/300"
  alt="Square image"
  aspect="1/1"
  title="Square Image Card">
</div>
</div>

### Image at Bottom

<div x-demo>
<div x-cardimage
  src="https://picsum.photos/seed/footer/400/225"
  position="bottom"
  title="Image Below Content"
  content="Content appears above the image.">
</div>
</div>

## Generated Structure

```html
<article class="x-card x-card-image">
  <figure
    class="x-card__figure"
    style="aspect-ratio: 16/9">
    <img
      src="..."
      alt="..."
      loading="lazy">
  </figure>
  <header class="x-card__header">
    <h3 class="x-card__title">Title</h3>
  </header>
  <main class="x-card__main">Content</main>
</article>
```

## Schema

Location: `src/wb-models/cardimage.schema.json`
