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
| `plan` | text | — | Plan name (e.g., Basic, Pro, Enterprise) |
| `price` | text | — | Price amount (e.g., $29) |
| `period` | text | `/month` | Billing period (e.g., /month, /year) |
| `description` | text | — | Short plan description |
| `features` | comma-separated list | — | Comma-separated list of features |
| `cta` | text | `Get Started` | Call-to-action button text |
| `ctaHref` | URL | `#` | Call-to-action link URL |
| `featured` | `boolean` | `false` | Highlight as featured/recommended plan |
| `variant` | `default` · `bordered` · `elevated` · `minimal` | `default` | Visual style variant |

## Methods

- `show()` — Shows the pricing card
- `hide()` — Hides the pricing card
- `toggle()` — Toggles visibility
- `setFeatured()` — Sets or removes featured state
- `updatePrice()` — Updates the price and period

<sub>Schema: [`cardpricing.schema.json`](../../src/wb-models/cardpricing.schema.json)</sub>
