# Card Pricing - wb-starter v3.0

Pricing plan card for SaaS/subscription services.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardpricing>` |
| Behavior | `cardpricing` |
| Semantic | `<article>` |
| Root CSS Class | `wb-card wb-pricing` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `plan` | string | `"Basic Plan"` | Plan name |
| `price` | string | `"$0"` | Price display |
| `period` | string | `"/month"` | Billing period |
| `features` | string | `""` | Comma-separated features |
| `cta` | string | `"Get Started"` | CTA button text |
| `ctaHref` | string | `"#"` | CTA button URL |
| `featured` | boolean | `false` | Highlight as featured |
| `background` | string | `""` | Background image URL |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardpricing
  plan="Starter"
  price="$9"
  period="/month"
  features="5 projects, Email support, 1GB storage"
  cta="Start Free Trial">
</wb-cardpricing>
</wb-demo>

## Usage

### Basic Pricing Card

```html
<wb-cardpricing
  plan="Starter"
  price="$9"
  period="/month"
  features="5 projects, Email support, 1GB storage"
  cta="Start Free Trial">
</wb-cardpricing>
```

### Featured Plan

```html
<wb-cardpricing
  plan="Professional"
  price="$29"
  period="/month"
  features="Unlimited projects, Priority support, 100GB storage, API access"
  cta="Get Started"
  featured>
</wb-cardpricing>
```

### Annual Pricing

```html
<wb-cardpricing
  plan="Enterprise"
  price="$299"
  period="/year"
  features="Everything in Pro, Custom integrations, Dedicated support, SLA"
  cta="Contact Sales"
  ctaHref="/contact">
</wb-cardpricing>
```

## Generated Structure

```html
<article class="wb-card wb-pricing">
  <header class="wb-card__header">
    <h3 class="wb-card__title wb-card__plan">Plan Name</h3>
  </header>
  <main class="wb-card__main">
    <div class="wb-card__price-wrap">
      <span class="wb-card__amount">$29</span>
      <span class="wb-card__period">/month</span>
    </div>
    <ul class="wb-card__features">
      <li class="wb-card__feature">✓ Feature 1</li>
      <li class="wb-card__feature">✓ Feature 2</li>
    </ul>
  </main>
  <footer class="wb-card__footer">
    <a
      class="wb-card__cta"
      href="#">
      Get Started
    </a>
  </footer>
</article>
```

## Schema

Location: `src/wb-models/cardpricing.schema.json`
