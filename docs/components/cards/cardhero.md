# Card Hero - wb-starter v3.0

Full-width hero banner card with background image/gradient and CTAs.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardhero>` |
| Behavior | `cardhero` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-hero` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `background` | string | gradient | Background image URL or CSS gradient |
| `overlay` | boolean | `true` | Dark overlay for text readability |
| `xalign` | string | `"center"` | Text alignment: `left`, `center`, `right` |
| `height` | string | `"400px"` | Hero height |
| `pretitle` | string | `""` | Text above title (badge / count) |
| `title` | string | `""` | Hero headline (HTML allowed) |
| `subtitle` | string | `""` | Hero subheadline |
| `content` | string | `""` | HTML content rendered inside the hero (use instead of slots) |
| `cta` | string | `""` | Primary CTA button text |
| `ctaHref` | string | `"#"` | Primary CTA URL |
| `ctaSecondary` | string | `""` | Secondary CTA text |
| `ctaSecondaryHref` | string | `"#"` | Secondary CTA URL |

### Attribute-only example
```html
<wb-cardhero
  background="/images/hero.jpg"
  pretitle="100 Components"
  title='Build <span class="wb-gradient-text">stunning UIs</span>'
  subtitle="just HTML — no build step"
  cta="Explore Components"
  cta-href="#components"
  variant="cosmic"></wb-cardhero>
```

> Tip: `title` accepts HTML (so `wb-gradient-text` can be used) — you do not need to use slots.

## Usage

### Basic Hero

```html
<wb-cardhero 
  title="Welcome to Our Site"
  subtitle="Build something amazing"
  background="/images/hero-bg.jpg">
</wb-cardhero>
```

### With CTAs

```html
<wb-cardhero 
  title="Get Started Today"
  subtitle="Join thousands of happy users"
  cta="Sign Up Free"
  ctaHref="/signup"
  ctaSecondary="Learn More"
  ctaSecondaryHref="/about">
</wb-cardhero>
```

### Left Aligned

```html
<wb-cardhero 
  title="Left Aligned Hero"
  xalign="left"
  height="500px">
</wb-cardhero>
```

### With Gradient Background

```html
<wb-cardhero 
  title="Gradient Hero"
  background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
</wb-cardhero>
```

### Using Slots (HTML in Title)

```html
<wb-cardhero background="/images/hero.jpg">
  <h1 slot="title">Rich <em>HTML</em> Title</h1>
  <p slot="subtitle">Subtitle with <strong>formatting</strong></p>
</wb-cardhero>
```

## Generated Structure

```html
<article class="wb-card wb-hero">
  <div class="wb-card__overlay"></div>
  <div class="wb-card__hero-content">
    <div class="wb-card__hero-pretitle">Pretitle</div>
    <h3 class="wb-card__title wb-card__hero-title">Title</h3>
    <p class="wb-card__subtitle wb-card__hero-subtitle">Subtitle</p>
    <div class="wb-card__cta-group">
      <a class="wb-btn wb-btn--primary wb-btn--lg">CTA</a>
      <a class="wb-btn wb-btn--outline-light wb-btn--lg">Secondary</a>
    </div>
  </div>
</article>
```

## Schema

Location: `src/wb-models/cardhero.schema.json`
