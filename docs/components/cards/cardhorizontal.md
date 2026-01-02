# Card Horizontal Component

## Overview
The `cardhorizontal` component arranges the image and content side-by-side instead of vertically. It is ideal for list views, search results, or featured articles.

## Internals & Lifecycle

### Initialization
1.  **Layout Direction**:
    - Default: `flex-direction: row` (Image Left).
    - If `data-image-position="right"`: `flex-direction: row-reverse`.
2.  **Image Sizing**:
    - The image container (`figure`) is set to a fixed width defined by `data-image-width` (default `40%`).
    - `flex-shrink: 0` is applied to prevent the image from squishing.
3.  **Content Alignment**:
    - The content area uses `display: flex` and `flex-direction: column`.
    - `justify-content: center` is applied to vertically center the text relative to the image.

### DOM Structure

<article class="wb-card wb-card--horizontal" style="flex-direction: row;">
  <!-- Image Container -->
  <figure style="width: 40%; flex-shrink: 0;">
    <img src="..." style="object-fit: cover; height: 100%;">
  </figure>
  
  <!-- Content Container -->
  <div class="wb-card__horizontal-content">
    <h3 class="wb-card__title">Title</h3>
    <p class="wb-card__subtitle">Subtitle</p>
    <div class="wb-card__horiz-body">Content...</div>
  </div>
</article>

```html
<article class="wb-card wb-card--horizontal" style="flex-direction: row;">
  <!-- Image Container -->
  <figure style="width: 40%; flex-shrink: 0;">
    <img src="..." style="object-fit: cover; height: 100%;">
  </figure>
  
  <!-- Content Container -->
  <div class="wb-card__horizontal-content">
    <h3 class="wb-card__title">Title</h3>
    <p class="wb-card__subtitle">Subtitle</p>
    <div class="wb-card__horiz-body">Content...</div>
  </div>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-image` | string | required | URL of the image. |
| `data-image-position` | enum | `left` | Position of the image: `left` or `right`. |
| `data-image-width` | string | `40%` | CSS width of the image column. |

## Usage Example

<div data-wb="cardhorizontal" 
     data-title="Blog Post Title"
     data-subtitle="Published yesterday"
     data-content="A brief excerpt of the article goes here..."
     data-image="/assets/thumb.jpg" 
     data-image-position="left"
     data-image-width="30%">
</div>

```html
<div data-wb="cardhorizontal" 
     data-title="Blog Post Title"
     data-subtitle="Published yesterday"
     data-content="A brief excerpt of the article goes here..."
     data-image="/assets/thumb.jpg" 
     data-image-position="left"
     data-image-width="30%">
</div>
```
