# Product Card

E-commerce product card with image, price, rating, and CTA

## Type — decorates a semantic element

`x-cardproduct` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardproduct
  image="/images/placeholder.svg"
  title="Field headphones"
  description="Closed-back, 32Ω, folds flat."
  price="$149"
  original-price="$189"></article>
```

### On a different element

Use `x-cardproduct` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardproduct>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `image` | `string` | `this is the image` | Product image URL |
| `title` | `string` | `this is the title` | Product name |
| `description` | `string` | `this is the description` | Product description |
| `price` | `string` | `this is the price` | Current price |
| `original-price` | `string` | `this is the original price` | Original price (shows discount) |
| `badge` | `string` | `this is the badge` | Badge text (Sale, New, etc.) |
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
