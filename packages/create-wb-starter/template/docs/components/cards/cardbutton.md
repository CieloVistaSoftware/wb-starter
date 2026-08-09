# Card Button - wb-starter v3.0

Card with action buttons in the footer.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardbutton>` |
| Behavior | `cardbutton` |
| Semantic | `<article>` |
| Root CSS Class | `wb-card wb-card-button` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `primary` | string | `""` | Primary button text |
| `secondary` | string | `""` | Secondary button text |
| `primaryHref` | string | `""` | Primary button URL |
| `secondaryHref` | string | `""` | Secondary button URL |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardbutton
  title="Action Card"
  subtitle="Choose an action"
  primary="Submit"
  secondary="Cancel">
  Card content here.
</wb-cardbutton>
</wb-demo>

## Usage

### Basic Button Card

```html
<wb-cardbutton
  title="Action Card"
  subtitle="Choose an action"
  primary="Submit"
  secondary="Cancel">
  Card content here.
</wb-cardbutton>
```

### With Links

```html
<wb-cardbutton
  title="Learn More"
  primary="View Details"
  primaryHref="/details"
  secondary="Go Back"
  secondaryHref="/">
</wb-cardbutton>
```

## Generated Structure

```html
<article class="wb-card wb-card-button">
  <header class="wb-card__header">...</header>
  <main class="wb-card__main">...</main>
  <footer class="wb-card__btn-footer">
    <button class="wb-card__btn wb-card__btn--secondary">Cancel</button>
    <button class="wb-card__btn wb-card__btn--primary">Submit</button>
  </footer>
</article>
```

## Schema

Location: `src/wb-models/cardbutton.schema.json`
