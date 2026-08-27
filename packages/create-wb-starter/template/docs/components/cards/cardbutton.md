# Card Button - wb-starter v3.0

Card with action buttons in the footer.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardbutton>` |
| Behavior | `cardbutton` |
| Semantic | `<article>` |
| Root CSS Class | `x-card x-card-button` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `primary` | string | `""` | Primary button text |
| `secondary` | string | `""` | Secondary button text |
| `primaryHref` | string | `""` | Primary button URL |
| `secondaryHref` | string | `""` | Secondary button URL |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-cardbutton
  title="Action Card"
  subtitle="Choose an action"
  primary="Submit"
  secondary="Cancel">
  Card content here.
</div>
</div>

## Usage

### Basic Button Card

```html
<div x-cardbutton
  title="Action Card"
  subtitle="Choose an action"
  primary="Submit"
  secondary="Cancel">
  Card content here.
</div>
```

### With Links

```html
<div x-cardbutton
  title="Learn More"
  primary="View Details"
  primaryHref="/details"
  secondary="Go Back"
  secondaryHref="/">
</div>
```

## Generated Structure

```html
<article class="x-card x-card-button">
  <header class="x-card__header">...</header>
  <main class="x-card__main">...</main>
  <footer class="x-card__btn-footer">
    <button class="x-card__btn x-card__btn--secondary">Cancel</button>
    <button class="x-card__btn x-card__btn--primary">Submit</button>
  </footer>
</article>
```

## Schema

Location: `src/wb-models/cardbutton.schema.json`
