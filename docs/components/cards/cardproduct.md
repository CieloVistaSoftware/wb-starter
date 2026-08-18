# Card Product - wb-starter v3.0

E-commerce product card with image, pricing, and add-to-cart functionality.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardproduct>` |
| Behavior | `cardproduct` |
| Semantic | `<article>` + `<figure>` + `<data>` |
| Root CSS Class | `wb-card wb-product` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

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

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardproduct
  title="Wireless Headphones"
  image="https://picsum.photos/seed/headphones/600/400"
  price="$99.99">
</wb-cardproduct>
</wb-demo>

## Usage

### Basic Product

```html
<wb-cardproduct
  title="Wireless Headphones"
  image="https://picsum.photos/seed/headphones/600/400"
  price="$99.99">
</wb-cardproduct>
```

### With Sale Price

```html
<wb-cardproduct
  title="Premium Headphones"
  image="https://picsum.photos/seed/headphones/600/400"
  price="$79.99"
  originalPrice="$99.99"
  badge="Sale">
</wb-cardproduct>
```

### With Rating

```html
<wb-cardproduct
  title="Bluetooth Speaker"
  image="https://picsum.photos/seed/speaker/600/400"
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

The same action is available programmatically through `wbCardProduct.addToCart()`:

```javascript
document.querySelector('wb-cardproduct').wbCardProduct.addToCart();
```

Both activation paths dispatch the bubbling `wb:cardproduct:addtocart` event with
`detail: { title, price, id }`. The CTA is a native button, so mouse, keyboard,
and assistive-technology activation use the same action.

## Schema

Location: `src/wb-models/cardproduct.schema.json`
