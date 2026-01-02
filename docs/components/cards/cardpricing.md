# Card Pricing

A pricing tier card displaying plan information, features, and call-to-action. Essential for pricing pages and subscription offerings.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `cardpricing` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card--pricing` |
| Category | Cards |
| Icon | 💰 |

## Inheritance

```
article (semantic) → card.base → cardpricing
```

Card Pricing **IS-A** card, inheriting semantic structure.

### Containment (HAS-A)

| Element | HTML | Description |
|---------|------|-------------|
| Price | `<data>` | Semantic price element |
| Features | `<ul> > <li>` | List of plan features |
| CTA | `<footer> > <a>` | Call-to-action button |

## Properties

### Inherited from Card Base

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `elevated` | boolean | `false` | Add drop shadow |
| `hoverable` | boolean | `true` | Enable hover effects |

### Card Pricing Specific

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `plan` | string | `""` | Plan name |
| `price` | string | `""` | Price amount |
| `period` | string | `"/month"` | Billing period |
| `features` | string | `""` | Comma-separated feature list |
| `cta` | string | `"Get Started"` | CTA button text |
| `ctaHref` | string | `"#"` | CTA button link |
| `featured` | boolean | `false` | Highlight as featured plan |

## Usage

### Basic Pricing Card

<article data-wb="cardpricing"
         data-plan="Basic"
         data-price="$9">
</article>

```html
<article data-wb="cardpricing"
         data-plan="Basic"
         data-price="$9">
</article>
```

### Pricing with Period

<article data-wb="cardpricing"
         data-plan="Pro"
         data-price="$29"
         data-period="/month">
</article>

```html
<article data-wb="cardpricing"
         data-plan="Pro"
         data-price="$29"
         data-period="/month">
</article>
```

### Pricing with Features

<article data-wb="cardpricing"
         data-plan="Pro"
         data-price="$29"
         data-features="10 Projects,Unlimited Storage,Priority Support">
</article>

```html
<article data-wb="cardpricing"
         data-plan="Pro"
         data-price="$29"
         data-features="10 Projects,Unlimited Storage,Priority Support">
</article>
```

### Featured Plan

<article data-wb="cardpricing"
         data-plan="Business"
         data-price="$99"
         data-period="/month"
         data-features="Unlimited Projects,Dedicated Support,Custom Integrations"
         data-featured="true">
</article>

```html
<article data-wb="cardpricing"
         data-plan="Business"
         data-price="$99"
         data-period="/month"
         data-features="Unlimited Projects,Dedicated Support,Custom Integrations"
         data-featured="true">
</article>
```

### Full Pricing Card

<article data-wb="cardpricing"
         data-plan="Enterprise"
         data-price="$299"
         data-period="/month"
         data-features="Everything in Business,SLA Guarantee,On-premise Option,24/7 Phone Support"
         data-cta="Contact Sales"
         data-cta-href="/contact"
         data-elevated="true">
</article>

```html
<article data-wb="cardpricing"
         data-plan="Enterprise"
         data-price="$299"
         data-period="/month"
         data-features="Everything in Business,SLA Guarantee,On-premise Option,24/7 Phone Support"
         data-cta="Contact Sales"
         data-cta-href="/contact"
         data-elevated="true">
</article>
```

## Structure

<article class="wb-card wb-card--pricing">
  <!-- Plan header -->
  <header class="wb-card__header">
    <h3 class="wb-card__plan">Pro</h3>
  </header>
  
  <!-- Pricing display -->
  <div class="wb-card__price">
    <data class="wb-card__amount" value="29">$29</data>
    <span class="wb-card__period">/month</span>
  </div>
  
  <!-- Features list -->
  <ul class="wb-card__features">
    <li>10 Projects</li>
    <li>Unlimited Storage</li>
    <li>Priority Support</li>
  </ul>
  
  <!-- CTA in footer -->
  <footer class="wb-card__footer">
    <a href="#" class="wb-card__cta">Get Started</a>
  </footer>
</article>

```html
<article class="wb-card wb-card--pricing">
  <!-- Plan header -->
  <header class="wb-card__header">
    <h3 class="wb-card__plan">Pro</h3>
  </header>
  
  <!-- Pricing display -->
  <div class="wb-card__price">
    <data class="wb-card__amount" value="29">$29</data>
    <span class="wb-card__period">/month</span>
  </div>
  
  <!-- Features list -->
  <ul class="wb-card__features">
    <li>10 Projects</li>
    <li>Unlimited Storage</li>
    <li>Priority Support</li>
  </ul>
  
  <!-- CTA in footer -->
  <footer class="wb-card__footer">
    <a href="#" class="wb-card__cta">Get Started</a>
  </footer>
</article>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-card--pricing` | Pricing variant styling |
| `.wb-card--featured` | Featured plan highlight |
| `.wb-card__plan` | Plan name |
| `.wb-card__price` | Price container |
| `.wb-card__amount` | Price value |
| `.wb-card__period` | Billing period |
| `.wb-card__features` | Features list |
| `.wb-card__cta` | Call-to-action button |

## Semantic HTML

### Price Element

The price uses the `<data>` element for machine-readability:

```html
<data class="wb-card__amount" value="29">$29</data>
```

### Features List

Features use semantic `<ul>` and `<li>`:

```html
<ul class="wb-card__features">
  <li>Feature one</li>
  <li>Feature two</li>
</ul>
```

### CTA Link

CTA is an `<a>` element in the footer:

```html
<footer>
  <a href="/signup" class="wb-card__cta">Get Started</a>
</footer>
```

## Interactions

### CTA Button

| Event | Behavior |
|-------|----------|
| Click | Navigate to `ctaHref` |
| Hover | Brightness and lift effect |

```css
.wb-card__cta:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
```

### Featured Card

Featured cards receive visual emphasis:

```css
.wb-card--featured {
  border: 2px solid var(--primary);
  transform: scale(1.02);
}
```

## Accessibility

| Element | Implementation |
|---------|----------------|
| Plan name | H3 heading |
| Price | `<data>` with value attribute |
| Features | Semantic list |
| CTA | Focusable link |

## Builder Integration

### Sidebar

```
📁 Cards
└── 💰 Card Pricing
```

### Property Panel

| Group | Properties |
|-------|------------|
| Plan | plan, featured |
| Pricing | price, period |
| Features | features |
| Action | cta, ctaHref |
| Style | elevated |

### Defaults

```json
{
  "plan": "Basic",
  "price": "$9",
  "period": "/month",
  "features": "",
  "cta": "Get Started",
  "ctaHref": "#",
  "featured": false
}
```

## Test Matrix

| Combination | Expected |
|-------------|----------|
| `plan="Basic" price="$9"` | Plan name and price |
| `plan="Pro" price="$29" featured="true"` | Featured styling |
| `plan="Pro" price="$29" features="A,B,C"` | Features list |
| `plan="Pro" price="$29" cta="Subscribe"` | Custom CTA text |

## Examples

### Three-Tier Pricing

<div style="display: flex; gap: 1rem; align-items: stretch;">
  <!-- Basic -->
  <article data-wb="cardpricing"
           data-plan="Basic"
           data-price="$9"
           data-period="/month"
           data-features="5 Projects,1GB Storage,Email Support"
           data-cta="Start Free">
  </article>
  
  <!-- Pro (Featured) -->
  <article data-wb="cardpricing"
           data-plan="Pro"
           data-price="$29"
           data-period="/month"
           data-features="25 Projects,10GB Storage,Priority Support,API Access"
           data-cta="Get Pro"
           data-featured="true">
  </article>
  
  <!-- Enterprise -->
  <article data-wb="cardpricing"
           data-plan="Enterprise"
           data-price="$99"
           data-period="/month"
           data-features="Unlimited Projects,Unlimited Storage,24/7 Support,Custom Integrations,SLA"
           data-cta="Contact Sales">
  </article>
</div>

```html
<div style="display: flex; gap: 1rem; align-items: stretch;">
  <!-- Basic -->
  <article data-wb="cardpricing"
           data-plan="Basic"
           data-price="$9"
           data-period="/month"
           data-features="5 Projects,1GB Storage,Email Support"
           data-cta="Start Free">
  </article>
  
  <!-- Pro (Featured) -->
  <article data-wb="cardpricing"
           data-plan="Pro"
           data-price="$29"
           data-period="/month"
           data-features="25 Projects,10GB Storage,Priority Support,API Access"
           data-cta="Get Pro"
           data-featured="true">
  </article>
  
  <!-- Enterprise -->
  <article data-wb="cardpricing"
           data-plan="Enterprise"
           data-price="$99"
           data-period="/month"
           data-features="Unlimited Projects,Unlimited Storage,24/7 Support,Custom Integrations,SLA"
           data-cta="Contact Sales">
  </article>
</div>
```

### Annual Pricing

<article data-wb="cardpricing"
         data-plan="Annual Pro"
         data-price="$290"
         data-period="/year"
         data-features="Save $58,All Pro Features,Priority Onboarding"
         data-cta="Save 17%"
         data-featured="true">
</article>

```html
<article data-wb="cardpricing"
         data-plan="Annual Pro"
         data-price="$290"
         data-period="/year"
         data-features="Save $58,All Pro Features,Priority Onboarding"
         data-cta="Save 17%"
         data-featured="true">
</article>
```

### Free Tier

<article data-wb="cardpricing"
         data-plan="Free"
         data-price="$0"
         data-period=""
         data-features="1 Project,100MB Storage,Community Support"
         data-cta="Sign Up Free">
</article>

```html
<article data-wb="cardpricing"
         data-plan="Free"
         data-price="$0"
         data-period=""
         data-features="1 Project,100MB Storage,Community Support"
         data-cta="Sign Up Free">
</article>
```

### Custom/Contact

<article data-wb="cardpricing"
         data-plan="Custom"
         data-price="Custom"
         data-period=""
         data-features="Tailored Solution,Volume Discounts,Dedicated Account Manager"
         data-cta="Request Quote"
         data-cta-href="/contact">
</article>

```html
<article data-wb="cardpricing"
         data-plan="Custom"
         data-price="Custom"
         data-period=""
         data-features="Tailored Solution,Volume Discounts,Dedicated Account Manager"
         data-cta="Request Quote"
         data-cta-href="/contact">
</article>
```

## Features Formatting

Features are specified as a comma-separated string:

```html
data-features="Feature 1,Feature 2,Feature 3"
```

This generates:

```html
<ul class="wb-card__features">
  <li>Feature 1</li>
  <li>Feature 2</li>
  <li>Feature 3</li>
</ul>
```

### Feature Tips

- Keep features concise (2-5 words each)
- Lead with most valuable features
- Use parallel structure ("5 Projects" not "You get 5 projects")
- Limit to 5-7 features for readability

## Related

- [Card](./card.md) - Base card component
- [Card Button](./cardbutton.md) - Card with action buttons
- [Card Stats](./cardstats.md) - Statistics display
