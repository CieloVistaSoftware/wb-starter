# Product Card

E-commerce product card with image, price, rating, and CTA

Applies to `<article>`, and to any element carrying `x-cardproduct`.

## Usage

```html
<article x-cardproduct>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `image` | `string` | — | Product image URL |
| `title` | `string` | — | Product name |
| `description` | `string` | — | Product description |
| `price` | `string` | — | Current price |
| `original-price` | `string` | — | Original price (shows discount) |
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

## Live example

See `x-cardproduct` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardproduct` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardproduct.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
