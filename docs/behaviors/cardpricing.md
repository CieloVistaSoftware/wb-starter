# Pricing Card

Pricing tier card with plan name, price, features list, and CTA

## Type — decorates a semantic element

`x-cardpricing` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardpricing
  plan="Team"
  price="$18"
  period="per user / month"
  description="For teams that need shared history and SSO."
  features="Unlimited projects,Audit log,SSO,Priority support"></article>
```

### On a different element

Use `x-cardpricing` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardpricing>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `plan` | `string` | — | Plan name (e.g., Basic, Pro, Enterprise) |
| `price` | `string` | — | Price amount (e.g., $29) |
| `period` | `string` | `/month` | Billing period (e.g., /month, /year) |
| `description` | `string` | — | Short plan description |
| `features` | `string` | — | Comma-separated list of features |
| `cta` | `string` | `Get Started` | Call-to-action button text |
| `cta-href` | `string` | `#` | Call-to-action link URL |
| `featured` | `boolean` | `false` | Highlight as featured/recommended plan |
| `variant` | `default` · `bordered` · `elevated` · `minimal` | `default` | Visual style variant |

## Methods

- `show()` — Shows the pricing card
- `hide()` — Hides the pricing card
- `toggle()` — Toggles visibility
- `setFeatured()` — Sets or removes featured state
- `updatePrice()` — Updates the price and period

## Live example

See `x-cardpricing` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardpricing` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardpricing.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
