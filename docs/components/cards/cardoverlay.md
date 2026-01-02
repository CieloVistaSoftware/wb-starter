# Card Overlay Component

## Overview
The `cardoverlay` component creates a "hero-like" card where the content is overlaid on top of a background image. It is useful for featured content or visual navigation items.

## Internals & Lifecycle

### Initialization
1.  **Style Application**: 
    - Sets `position: relative` and `min-height` (default 300px).
    - Applies the background image via inline `background-image` style.
    - Sets `background-size: cover` and `background-position: center`.
2.  **Layout Logic**:
    - Uses Flexbox (`flex-direction: row`) to manage content positioning.
    - **Vertical Alignment**: Controlled via `align-items` based on the `data-position` attribute:
        - `top` -> `align-items: flex-start`
        - `center` -> `align-items: center`
        - `bottom` -> `align-items: flex-end`
3.  **Gradient Generation**: If `data-gradient` is true, it generates a linear gradient overlay to ensure text readability against the image.

### DOM Structure

<article class="wb-card wb-card--overlay-card wb-card--overlay-bottom" style="background-image: url(...)">
  <!-- Content Container -->
  <div class="wb-card__overlay-content">
    <h3 class="wb-card__title wb-card__overlay-title">Title</h3>
    <p class="wb-card__subtitle wb-card__overlay-subtitle">Subtitle</p>
  </div>
</article>

```html
<article class="wb-card wb-card--overlay-card wb-card--overlay-bottom" style="background-image: url(...)">
  <!-- Content Container -->
  <div class="wb-card__overlay-content">
    <h3 class="wb-card__title wb-card__overlay-title">Title</h3>
    <p class="wb-card__subtitle wb-card__overlay-subtitle">Subtitle</p>
  </div>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-image` | string | required | URL of the background image. |
| `data-height` | string | `300px` | CSS height value for the card. |
| `data-position` | enum | `bottom` | Content position: `top`, `center`, `bottom`. |
| `data-gradient` | boolean | `true` | Adds a text-protection gradient behind the content. |

## Usage Example

<div data-wb="cardoverlay" 
     data-image="/assets/landscape.jpg" 
     data-title="Mountain Retreat" 
     data-subtitle="Explore the peaks"
     data-position="bottom"
     data-gradient="true">
</div>

```html
<div data-wb="cardoverlay" 
     data-image="/assets/landscape.jpg" 
     data-title="Mountain Retreat" 
     data-subtitle="Explore the peaks"
     data-position="bottom"
     data-gradient="true">
</div>
```
