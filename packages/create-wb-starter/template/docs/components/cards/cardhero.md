# Card Hero - wb-starter v3.0

Full-width hero banner card with background image/gradient and CTAs.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardhero>` |
| Behavior | `cardhero` |
| Semantic | `<article>` |
| Root CSS Class | `x-card x-hero` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

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
| `variant` | string | `"default"` | Visual style: `default`, `cosmic`, `split`, `minimal`, `gradient` |

### Attribute-only example

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo full-width>
<div x-cardhero
  pretitle="100 Behaviors"
  title='Build <span class="x-gradient-text">stunning UIs</span>'
  subtitle="just HTML — no build step"
  cta="Explore Behaviors"
  cta-href="#behaviors"
  variant="cosmic">
</div>
</div>

> Tip: `title` accepts HTML (so `x-gradient-text` can be used) — you do not need to use slots.

## Usage

### Basic Hero

With no `background` supplied, the behavior renders its own themed
gradient (`hero.css`'s `x-cardhero:not([background])` rule) -- there is no
`/images/hero-bg.jpg` asset in this repo, and pointing this example at one
that doesn't exist just 404s silently (#534).

<div x-demo full-width>
<div x-cardhero
  title="Welcome to Our Site"
  subtitle="Build something amazing">
</div>
</div>

### With CTAs

<div x-demo full-width>
<div x-cardhero
  title="Get Started Today"
  subtitle="Join thousands of happy users"
  cta="Sign Up Free"
  cta-href="/signup"
  cta-secondary="Learn More"
  cta-secondary-href="/about">
</div>
</div>

### Left Aligned

<div x-demo full-width>
<div x-cardhero
  title="Left Aligned Hero"
  xalign="left"
  height="500px">
</div>
</div>

### With Gradient Background

<div x-demo full-width>
<div x-cardhero
  title="Gradient Hero"
  background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
</div>
</div>

### Property Combinations

Each example below adds one more property on top of the last, so you can see
exactly what each one changes in isolation:

<div x-demo full-width>
<div x-cardhero
  title="Title only"
  height="260px">
</div>
</div>

<div x-demo full-width>
<div x-cardhero
  title="Title + subtitle"
  subtitle="Adding a subtitle"
  height="260px">
</div>
</div>

<div x-demo full-width>
<div x-cardhero
  title="Title + subtitle + cta"
  subtitle="Adding a primary CTA"
  cta="Click Me"
  cta-href="#"
  height="260px">
</div>
</div>

<div x-demo full-width>
<div x-cardhero
  title="Title + subtitle + cta + variant"
  subtitle="Now with variant=cosmic"
  cta="Click Me"
  cta-href="#"
  variant="cosmic"
  height="260px">
</div>
</div>

<div x-demo full-width>
<div x-cardhero
  title="Same, with overlay disabled"
  subtitle="overlay=false removes the legibility scrim"
  cta="Click Me"
  cta-href="#"
  variant="cosmic"
  overlay="false"
  height="260px">
</div>
</div>

<div x-demo full-width>
<div x-cardhero
  title="Same, left aligned"
  subtitle="xalign=left instead of the default center"
  cta="Click Me"
  cta-href="#"
  variant="cosmic"
  xalign="left"
  height="260px">
</div>
</div>

## Generated Structure

```html
<article class="x-card x-hero">
  <div class="x-card__overlay"></div>
  <div class="x-card__hero-content">
    <div class="x-card__hero-pretitle">Pretitle</div>
    <h3 class="x-card__title x-card__hero-title">Title</h3>
    <p class="x-card__subtitle x-card__hero-subtitle">Subtitle</p>
    <div class="x-card__cta-group">
      <a class="x-btn x-btn--primary x-btn--lg">CTA</a>
      <a class="x-btn x-btn--outline-light x-btn--lg">Secondary</a>
    </div>
  </div>
</article>
```

## Schema

Location: `src/wb-models/cardhero.schema.json`
