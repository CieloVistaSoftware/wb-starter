# Card Horizontal - wb-starter v3.0

Card with side-by-side image and content layout.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardhorizontal>` |
| Behavior | `cardhorizontal` |
| Semantic | `<article>` + `<figure>` |
| Root CSS Class | `wb-card wb-card-horizontal` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | `""` | Image URL |
| `imagePosition` | string | `"left"` | Position: `left`, `right` |
| `imageWidth` | string | `"40%"` | Image width |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardhorizontal
  title="Feature Title"
  subtitle="Feature description"
  image="https://picsum.photos/seed/cardhorizontal-feature/1000/800">
  Detailed content here.
</wb-cardhorizontal>
</wb-demo>

## Usage

### Basic Horizontal Card

```html
<wb-cardhorizontal
  title="Feature Title"
  subtitle="Feature description"
  image="https://picsum.photos/seed/cardhorizontal-basic/1000/800">
  Detailed content here.
</wb-cardhorizontal>
```

### Image on Right

```html
<wb-cardhorizontal
  title="Right Image"
  image="https://picsum.photos/seed/cardhorizontal-right/1000/800"
  image-position="right">
  Content appears on the left.
</wb-cardhorizontal>
```

### Custom Image Width

```html
<wb-cardhorizontal
  title="Large Image"
  image="https://picsum.photos/seed/cardhorizontal-wide/1000/800"
  image-width="60%">
  Narrower content area.
</wb-cardhorizontal>
```

## Generated Structure

```html
<article
  class="wb-card wb-card-horizontal"
  style="flex-direction: row">
  <figure
    class="wb-card__figure"
    style="width: 40%">
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
