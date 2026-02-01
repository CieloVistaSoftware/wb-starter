# Card Image - wb-starter v3.0

Card with a featured image. Uses `<figure>` for semantic image containment.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardimage>` |
| Behavior | `cardimage` |
| Semantic | `<article>` + `<figure>` |
| Base Class | `wb-card wb-card-image` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | `""` | Image URL |
| `alt` | string | `""` | Image alt text |
| `aspect` | string | `"16/9"` | Aspect ratio |
| `position` | string | `"top"` | Image position: `top`, `bottom` |
| `fit` | string | `"cover"` | Object fit: `cover`, `contain`, `fill` |

## Usage

### Basic Image Card

```html
<wb-cardimage 
  src="/images/hero.jpg" 
  alt="Hero image"
  title="Featured Image">
  Optional content below the image.
</wb-cardimage>
```

### With Custom Aspect Ratio

```html
<wb-cardimage 
  src="/images/square.jpg"
  alt="Square image"
  aspect="1/1"
  title="Square Image Card">
</wb-cardimage>
```

### Image at Bottom

```html
<wb-cardimage 
  src="/images/footer.jpg"
  position="bottom"
  title="Image Below Content">
  Content appears above the image.
</wb-cardimage>
```

## Generated Structure

```html
<article class="wb-card wb-card-image">
  <figure class="wb-card__figure" style="aspect-ratio: 16/9">
    <img src="..." alt="..." loading="lazy">
  </figure>
  <header class="wb-card__header">
    <h3 class="wb-card__title">Title</h3>
  </header>
  <main class="wb-card__main">Content</main>
</article>
```

## Schema

Location: `src/wb-models/cardimage.schema.json`
