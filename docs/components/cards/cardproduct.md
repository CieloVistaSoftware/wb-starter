# Card Product - WB Framework v3.0

E-commerce product card with image, pricing, and add-to-cart functionality.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardproduct>` |
| Behavior | `cardproduct` |
| Semantic | `<article>` + `<figure>` + `<data>` |
| Base Class | `wb-card wb-product` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | `""` | Product image URL |
| `price` | string | `""` | Current price |
| `originalPrice` | string | `""` | Original price (for sales) |
| `badge` | string | `""` | Badge text (e.g., "Sale") |
| `rating` | string | `""` | Star rating |
| `reviews` | string | `""` | Review count |
| `cta` | string | `"Add to Cart"` | CTA button text |
| `description` | string | `""` | Product description |

## Usage

### Basic Product

```html
<wb-cardproduct 
  title="Wireless Headphones"
  image="/images/headphones.jpg"
  price="$99.99">
</wb-cardproduct>
```

### With Sale Price

```html
<wb-cardproduct 
  title="Premium Headphones"
  image="/images/headphones.jpg"
  price="$79.99"
  originalPrice="$99.99"
  badge="Sale">
</wb-cardproduct>
```

### With Rating

```html
<wb-cardproduct 
  title="Bluetooth Speaker"
  image="/images/speaker.jpg"
  price="$49.99"
  rating="4.5"
  reviews="128"
  description="Portable wireless speaker with 24-hour battery">
</wb-cardproduct>
```

## Events

### wb:cardproduct:addtocart

Fired when CTA button is clicked:

```javascript
document.querySelector('wb-cardproduct').addEventListener('wb:cardproduct:addtocart', (e) => {
  console.log('Product:', e.detail.title);
  console.log('Price:', e.detail.price);
  console.log('ID:', e.detail.id);
});
```

## Schema

Location: `src/wb-models/cardproduct.schema.json`
