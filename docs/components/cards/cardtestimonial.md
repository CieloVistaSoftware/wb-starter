# Card Testimonial - wb-starter v3.0

Quote/testimonial card using semantic `<blockquote>` and `<cite>` elements.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardtestimonial>` |
| Behavior | `cardtestimonial` |
| Semantic | `<article>` + `<blockquote>` + `<cite>` |
| Base Class | `wb-card wb-testimonial` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quote` | string | `""` | Testimonial text |
| `author` | string | `""` | Author name |
| `role` | string | `""` | Author title/role |
| `avatar` | string | `""` | Author avatar URL |
| `rating` | number | `""` | Star rating (1-5) |

## Usage

### Basic Testimonial

```html
<wb-cardtestimonial 
  quote="This product changed my life!"
  author="Jane Doe"
  role="CEO, TechCorp">
</wb-cardtestimonial>
```

### With Avatar and Rating

```html
<wb-cardtestimonial 
  quote="Absolutely incredible experience. Would recommend to everyone."
  author="John Smith"
  role="Product Manager"
  avatar="/images/john.jpg"
  rating="5">
</wb-cardtestimonial>
```

## Generated Structure

```html
<article class="wb-card wb-testimonial">
  <div>"</div>
  <blockquote class="wb-card__quote">Quote text...</blockquote>
  <div class="wb-card__rating">★★★★★</div>
  <footer class="wb-card__footer">
    <img class="wb-card__avatar" src="...">
    <div>
      <cite class="wb-card__author">Author Name</cite>
      <span class="wb-card__author-role">Role</span>
    </div>
  </footer>
</article>
```

## Schema

Location: `src/wb-models/cardtestimonial.schema.json`
