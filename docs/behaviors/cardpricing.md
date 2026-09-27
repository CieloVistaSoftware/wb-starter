# Pricing Card

`x-cardpricing` renders one pricing tier: the plan name, price and period, a short description, a feature list from comma-separated `features`, and a call-to-action button. Set `featured` on the plan you want to stand out.

## Usage

<div x-demo>
<article x-cardpricing
  plan="Team"
  price="$18"
  period="per user / month"
  description="For teams that need shared history and SSO."
  features="Unlimited projects,Audit log,SSO,Priority support"></article>
</div>

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

<sub>Schema: [`cardpricing.schema.json`](../../src/wb-models/cardpricing.schema.json)</sub>
