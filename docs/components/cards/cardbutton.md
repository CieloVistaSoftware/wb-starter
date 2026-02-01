# Card Button - wb-starter v3.0

Card with action buttons in the footer.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardbutton>` |
| Behavior | `cardbutton` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card-button` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `primary` | string | `""` | Primary button text |
| `secondary` | string | `""` | Secondary button text |
| `primaryHref` | string | `""` | Primary button URL |
| `secondaryHref` | string | `""` | Secondary button URL |

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
