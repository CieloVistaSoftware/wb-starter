# Cart

`x-cart` is a shopping cart that remembers what Add to Cart added. It shows how
many items it holds, and opens to list them with a remove button each, the
total, and Clear. The cart is kept in `localStorage`, so it is still there after
a reload.

Click **Add to Cart** on the product below, then open the cart.

<div x-demo columns="1">
<div x-cart></div>
<article x-cardproduct
  image="https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/S%C5%82uchawki_referencyjne_K-701_firmy_AKG.jpg/500px-S%C5%82uchawki_referencyjne_K-701_firmy_AKG.jpg"
  title="Field headphones"
  description="Closed-back, 32Ω, folds flat."
  price="$149"></article>
</div>

## What it does

- Every [`x-cardproduct`](cardproduct.md) Add to Cart click on the page lands in
  the cart. Adding the same product again raises its quantity instead of
  listing it twice.
- The cart shows its item count. Open it to see each item with its quantity and
  price, remove one, see the total, or clear the cart.
- Every `x-cart` on the page shows the same contents, and so does an `x-cart`
  open in another tab.

Anything can add to the cart, not only product cards: dispatch
`wb:cardproduct:addtocart` with `{ title, price, id }`, or call
`element.wbCart.add({ title, price, id })`.

## Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `key` | text | `wb-cart` | The `localStorage` key the cart is kept under. Carts with the same key show the same contents; give two carts different keys to keep them apart. |

## Methods

On `element.wbCart`:

| Method | What it does |
|---|---|
| `add(item)` | Add `{ title, price, id }`; the same product again raises its quantity |
| `remove(id)` | Remove an item by its id (or its title when it has no id) |
| `clear()` | Empty the cart |
| `items()` | The items, each `{ id, title, price, qty }` |
| `count()` | How many items, counting quantities |

## Events

- `wb:cart:change` — fired whenever the contents change, with
  `{ items, count, total }`.

## Notes

- A product is identified by its `id` when it has one, otherwise by its title.
- The total is the sum of each price times its quantity, written with the
  currency mark of the first priced item (`$149` → `$`).

<sub>Schema: [`cart.schema.json`](../../src/wb-models/cart.schema.json)</sub>
