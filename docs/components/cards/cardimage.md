# Card Image

An image card component with optional title and subtitle. Perfect for galleries, portfolios, and media-rich content.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `cardimage` |
| Semantic | `<article>` |
| Base Class | `wb-card` |
| Category | Cards |
| Icon | 🖼️ |

## Inheritance

```
article (semantic) → card.base → cardimage
```

Card Image **IS-A** card, inheriting all base properties.
Card Image **HAS-A** figure element containing the image.

## Properties

### Inherited from Card Base

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `""` | Card title below/above image |
| `subtitle` | string | `""` | Subtitle below title |
| `elevated` | boolean | `false` | Add drop shadow |
| `hoverable` | boolean | `true` | Enable hover effects |

### Card Image Specific

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | **required** | Image source URL |
| `alt` | string | `""` | Image alt text (accessibility) |
| `aspect` | enum | `"16/9"` | Image aspect ratio |
| `position` | enum | `"top"` | Image position relative to content |
| `fit` | enum | `"cover"` | Image object-fit mode |

### Aspect Ratio Options

| Value | Description |
|-------|-------------|
| `16/9` | Widescreen (default) |
| `4/3` | Standard |
| `1/1` | Square |
| `3/2` | Classic photo |
| `21/9` | Ultra-wide |

### Position Options

| Value | Description |
|-------|-------------|
| `top` | Image above content (default) |
| `bottom` | Image below content |

### Fit Options

| Value | Description |
|-------|-------------|
| `cover` | Fill container, crop if needed (default) |
| `contain` | Fit within container, may letterbox |
| `fill` | Stretch to fill |
| `none` | Natural size |

## Usage

### Basic Image Card

```html
<article data-wb="cardimage" data-src="photo.jpg"></article>
```

### Image with Title

```html
<article data-wb="cardimage" 
         data-src="photo.jpg" 
         data-title="Beautiful Sunset"
         data-alt="Orange sunset over mountains">
</article>
```

### Image with Full Details

```html
<article data-wb="cardimage" 
         data-src="photo.jpg"
         data-alt="Product photo"
         data-title="Product Name"
         data-subtitle="Category"
         data-aspect="1/1"
         data-position="top"
         data-fit="cover">
</article>
```

### Square Image Card

```html
<article data-wb="cardimage" 
         data-src="avatar.jpg"
         data-aspect="1/1"
         data-title="Team Member">
</article>
```

### Image at Bottom

```html
<article data-wb="cardimage" 
         data-src="diagram.png"
         data-position="bottom"
         data-title="How It Works"
         data-subtitle="Step-by-step guide">
</article>
```

## Structure

```html
<article class="wb-card wb-card--image">
  <!-- Image in semantic figure -->
  <figure class="wb-card__figure">
    <img src="photo.jpg" 
         alt="Description" 
         class="wb-card__image"
         style="aspect-ratio: 16/9; object-fit: cover;">
  </figure>
  
  <!-- Header (when title is set) -->
  <header class="wb-card__header">
    <h3 class="wb-card__title">Title</h3>
    <p class="wb-card__subtitle">Subtitle</p>
  </header>
</article>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-card` | Base card styling |
| `.wb-card--image` | Image card variant |
| `.wb-card__figure` | Figure container |
| `.wb-card__image` | Image element |

## Containment (HAS-A)

| Element | Selector | Description |
|---------|----------|-------------|
| Figure | `figure.wb-card__figure` | Semantic container for image |
| Image | `img.wb-card__image` | The actual image |
| Header | `header.wb-card__header` | Title and subtitle (inherited) |

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Alt text | Set via `data-alt` attribute |
| Figure | Uses semantic `<figure>` element |
| Decorative images | Use empty alt (`data-alt=""`) |

### Good Alt Text Examples

```html
<!-- Informative -->
<article data-wb="cardimage" 
         data-src="chart.png"
         data-alt="Sales increased 25% in Q4 2024">
</article>

<!-- Decorative (empty alt) -->
<article data-wb="cardimage" 
         data-src="pattern.jpg"
         data-alt="">
</article>
```

## Builder Integration

### Sidebar

```
📁 Cards
└── 🖼️ Card Image
```

### Property Panel

| Group | Properties |
|-------|------------|
| Image | src, alt, aspect, position, fit |
| Content | title, subtitle |
| Style | elevated, hoverable |

### Defaults

```json
{
  "src": "",
  "alt": "",
  "aspect": "16/9",
  "position": "top",
  "fit": "cover",
  "title": "",
  "subtitle": ""
}
```

## Test Matrix

| Combination | Expected |
|-------------|----------|
| `src="test.jpg"` | Image displayed in figure |
| `src="test.jpg" alt="Test"` | Image has alt attribute |
| `src="test.jpg" title="Title"` | Header with title |
| `src="test.jpg" title="T" subtitle="S"` | Header with both |
| `src="test.jpg" aspect="1/1"` | Square aspect ratio |
| `src="test.jpg" position="bottom"` | Image after content |

## Examples

### Photo Gallery Card

```html
<article data-wb="cardimage"
         data-src="https://picsum.photos/400/300"
         data-alt="Random nature photo"
         data-title="Nature Collection"
         data-subtitle="12 photos"
         data-aspect="4/3">
</article>
```

### Product Card

```html
<article data-wb="cardimage"
         data-src="product.jpg"
         data-alt="Blue wireless headphones"
         data-title="Wireless Headphones"
         data-subtitle="$99.99"
         data-aspect="1/1"
         data-elevated="true">
</article>
```

### Blog Post Card

```html
<article data-wb="cardimage"
         data-src="blog-header.jpg"
         data-alt="Person typing on laptop"
         data-title="Getting Started with Web Components"
         data-subtitle="5 min read"
         data-aspect="16/9">
</article>
```

## Related

- [Card](./card.md) - Base card component
- [Card Hero](./cardhero.md) - Background image card
- [Card Overlay](./cardoverlay.md) - Text over image
- [Figure Element](../semantic/figure.md) - Semantic figure
