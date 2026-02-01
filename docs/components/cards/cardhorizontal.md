# Card Horizontal - wb-starter v3.0

Card with side-by-side image and content layout.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardhorizontal>` |
| Behavior | `cardhorizontal` |
| Semantic | `<article>` + `<figure>` |
| Base Class | `wb-card wb-card-horizontal` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | `""` | Image URL |
| `imagePosition` | string | `"left"` | Position: `left`, `right` |
| `imageWidth` | string | `"40%"` | Image width |

## Usage

### Basic Horizontal Card

```html
<wb-cardhorizontal 
  title="Feature Title"
  subtitle="Feature description"
  image="/images/feature.jpg">
  Detailed content here.
</wb-cardhorizontal>
```

### Image on Right

```html
<wb-cardhorizontal 
  title="Right Image"
  image="/images/feature.jpg"
  imagePosition="right">
  Content appears on the left.
</wb-cardhorizontal>
```

### Custom Image Width

```html
<wb-cardhorizontal 
  title="Large Image"
  image="/images/wide.jpg"
  imageWidth="60%">
  Narrower content area.
</wb-cardhorizontal>
```

## Generated Structure

```html
<article class="wb-card wb-card-horizontal" style="flex-direction: row">
  <figure class="wb-card__figure" style="width: 40%">
    <img src="...">
  </figure>
  <div class="wb-card__horizontal-content">
    <h3 class="wb-card__title">Title</h3>
    <p class="wb-card__subtitle">Subtitle</p>
    <div class="wb-card__horiz-body">Content</div>
  </div>
</article>
```

## Schema

Location: `src/wb-models/cardhorizontal.schema.json`
