# Card Testimonial - wb-starter v3.0

Quote/testimonial card using semantic `<blockquote>` and `<cite>` elements.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardtestimonial>` |
| Behavior | `cardtestimonial` |
| Semantic | `<article>` + `<blockquote>` + `<cite>` |
| Root CSS Class | `wb-card wb-testimonial` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quote` | string | `""` | Testimonial text |
| `author` | string | `""` | Author name |
| `role` | string | `""` | Author title/role |
| `avatar` | string | `""` | Author avatar URL |
| `rating` | number | `""` | Star rating (1-5) |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardtestimonial
  quote="This product changed my life!"
  author="Jane Doe"
  role="CEO, TechCorp">
</div>
</wb-demo>

## Usage

### Basic Testimonial

```html
<wb-cardtestimonial
  quote="This product changed my life!"
  author="Jane Doe"
  role="CEO, TechCorp">
</div>
```

### With Avatar and Rating

```html
<wb-cardtestimonial
  quote="Absolutely incredible experience. Would recommend to everyone."
  author="John Smith"
  role="Product Manager"
  avatar="https://picsum.photos/seed/john/200/200"
  rating="5">
</div>
```

## Generated Structure

```html
<article class="wb-card wb-testimonial">
  <div>"</div>
  <blockquote class="wb-card__quote">Quote text...</blockquote>
  <div class="wb-card__rating">★★★★★</div>
  <footer class="wb-card__footer">
    <img
      class="wb-card__avatar"
      src="...">
    <div>
      <cite class="wb-card__author">Author Name</cite>
      <span class="wb-card__author-role">Role</span>
    </div>
  </footer>
</article>
```

## Schema

Location: `src/wb-models/cardtestimonial.schema.json`
