# Card Pricing - wb-starter v3.0

Pricing plan card for SaaS/subscription services.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardpricing>` |
| Behavior | `cardpricing` |
| Semantic | `<article>` |
| Root CSS Class | `x-card x-pricing` |
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

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<div x-cardpricing
  plan="Starter"
  price="$9"
  period="/month"
  features="5 projects, Email support, 1GB storage"
  cta="Start Free Trial">
</div>
</div>

## Usage

### Basic Pricing Card

```html
<div x-cardpricing
  plan="Starter"
  price="$9"
  period="/month"
  features="5 projects, Email support, 1GB storage"
  cta="Start Free Trial">
</div>
```

### Featured Plan

```html
<div x-cardpricing
  plan="Professional"
  price="$29"
  period="/month"
  features="Unlimited projects, Priority support, 100GB storage, API access"
  cta="Get Started"
  featured>
</div>
```

### Annual Pricing

```html
<div x-cardpricing
  plan="Enterprise"
  price="$299"
  period="/year"
  features="Everything in Pro, Custom integrations, Dedicated support, SLA"
  cta="Contact Sales"
  ctaHref="/contact">
</div>
```

## Generated Structure

```html
<article class="x-card x-pricing">
  <header class="x-card__header">
    <h3 class="x-card__title x-card__plan">Plan Name</h3>
  </header>
  <main class="x-card__main">
    <div class="x-card__price-wrap">
      <span class="x-card__amount">$29</span>
      <span class="x-card__period">/month</span>
    </div>
    <ul class="x-card__features">
      <li class="x-card__feature">✓ Feature 1</li>
      <li class="x-card__feature">✓ Feature 2</li>
    </ul>
  </main>
  <footer class="x-card__footer">
    <a
      class="x-card__cta"
      href="#">
      Get Started
    </a>
  </footer>
</article>
```

## Schema

Location: `src/wb-models/cardpricing.schema.json`
