# Product Card

`x-cardproduct` renders a shop product card with an image, name, description, price (struck-through `originalPrice` when discounted), star rating and an add-to-cart button that fires `wb:cardproduct:addtocart`.

## Usage

<div x-demo>
<article x-cardproduct
  image="/images/placeholder.svg"
  title="Field headphones"
  description="Closed-back, 32Ω, folds flat."
  price="$149"
  originalPrice="$189"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `image` | `string` | — | Product image URL |
| `title` | `string` | — | Product name |
| `description` | `string` | — | Product description |
| `price` | `string` | — | Current price |
| `originalPrice` | `string` | — | Original price (shows discount) |
| `badge` | `string` | — | Badge text (Sale, New, etc.) |
| `rating` | `number` | `0` | Product rating (0-5) |
| `reviews` | `number` | `0` | Number of reviews |
| `cta` | `string` | `Add to Cart` | CTA button text |
| `featured` | `boolean` | `false` | Highlight as featured |
| `variant` | `default` · `compact` · `horizontal` · `minimal` | `default` | Visual style variant |

## Events

- `wb:cardproduct:addtocart` — Fired when add to cart is clicked

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `addToCart()` — Triggers add to cart action
- `updatePrice()` — Updates the price
- `setBadge()` — Sets the badge text

<sub>Schema: [`cardproduct.schema.json`](../../src/wb-models/cardproduct.schema.json)</sub>
