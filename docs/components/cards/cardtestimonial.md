# Card Testimonial Component

## Overview
The `cardtestimonial` component is designed to display user feedback, reviews, or quotes. It includes built-in support for star ratings, author attribution, and avatars.

## Internals & Lifecycle

### Initialization
1.  **Content Extraction**: If `data-quote` is not provided, it attempts to use the element's `textContent` as the quote.
2.  **Visual Construction**:
    - **Quote Icon**: Injects a large, decorative quotation mark (opacity 0.3) at the top.
    - **Rating Logic**: Parses `data-rating` as an integer. Generates a string of filled (★) and empty (☆) stars to match a 5-star scale.
    - **Author Layout**: Creates a flex container to align the avatar (circle cropped) next to the author name and role.

### DOM Structure

<article class="wb-card wb-card--testimonial">
  <!-- Decorative Icon -->
  <div style="font-size:3rem;...">"</div>
  
  <!-- Quote Body -->
  <blockquote class="wb-card__quote">...</blockquote>
  
  <!-- Star Rating -->
  <div class="wb-card__rating">★★★★★</div>
  
  <!-- Author Section -->
  <div style="display:flex;...">
    <img class="wb-card__avatar" src="...">
    <div>
      <cite class="wb-card__author">Author Name</cite>
      <span class="wb-card__author-role">Job Title</span>
    </div>
  </div>
</article>

```html
<article class="wb-card wb-card--testimonial">
  <!-- Decorative Icon -->
  <div style="font-size:3rem;...">"</div>
  
  <!-- Quote Body -->
  <blockquote class="wb-card__quote">...</blockquote>
  
  <!-- Star Rating -->
  <div class="wb-card__rating">★★★★★</div>
  
  <!-- Author Section -->
  <div style="display:flex;...">
    <img class="wb-card__avatar" src="...">
    <div>
      <cite class="wb-card__author">Author Name</cite>
      <span class="wb-card__author-role">Job Title</span>
    </div>
  </div>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-quote` | string | textContent | The main testimonial text. |
| `data-author` | string | - | Name of the person giving the testimonial. |
| `data-role` | string | - | Job title or relationship (e.g., "CEO", "Customer"). |
| `data-avatar` | string | - | URL to the author's photo. |
| `data-rating` | number | - | Integer 1-5 for the star rating. |

## Usage Example

<div data-wb="cardtestimonial" 
     data-quote="This product completely changed our workflow. Highly recommended!" 
     data-author="Sarah Connor" 
     data-role="Director of Ops"
     data-avatar="/assets/sarah.jpg"
     data-rating="5">
</div>

```html
<div data-wb="cardtestimonial" 
     data-quote="This product completely changed our workflow. Highly recommended!" 
     data-author="Sarah Connor" 
     data-role="Director of Ops"
     data-avatar="/assets/sarah.jpg"
     data-rating="5">
</div>
```
