# Card Portfolio - wb-starter v3.0

Portfolio/contact card using semantic `<address>` element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardportfolio>` |
| Behavior | `cardportfolio` |
| Semantic | `<article>` + `<address>` |
| Root CSS Class | `wb-card wb-portfolio` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | `""` | Person's name |
| `title` | string | `""` | Job title |
| `company` | string | `""` | Company name |
| `bio` | string | `""` | Biography |
| `avatar` | string | `""` | Avatar image URL |
| `cover` | string | `""` | Cover image URL |
| `location` | string | `""` | Location |
| `email` | string | `""` | Email address |
| `phone` | string | `""` | Phone number |
| `website` | string | `""` | Website URL |
| `linkedin` | string | `""` | LinkedIn URL |
| `twitter` | string | `""` | Twitter URL |
| `github` | string | `""` | GitHub URL |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardportfolio
  name="John Doe"
  title="Senior Developer"
  company="TechCorp"
  avatar="https://picsum.photos/seed/john/200/200">
</div>
</wb-demo>

## Usage

### Basic Portfolio

```html
<wb-cardportfolio
  name="John Doe"
  title="Senior Developer"
  company="TechCorp"
  avatar="https://picsum.photos/seed/john/200/200">
</div>
```

### Full Profile

```html
<wb-cardportfolio
  name="Jane Smith"
  title="Product Designer"
  company="DesignCo"
  avatar="https://picsum.photos/seed/jane/200/200"
  cover="https://picsum.photos/seed/cover/800/500"
  bio="Passionate about creating beautiful, user-friendly experiences."
  location="San Francisco, CA"
  email="jane@example.com"
  phone="+1 555-123-4567"
  website="https://janesmith.com"
  linkedin="https://linkedin.com/in/janesmith"
  twitter="https://twitter.com/janesmith"
  github="https://github.com/janesmith">
</div>
```

### Minimal Contact

```html
<wb-cardportfolio
  name="Alex Johnson"
  email="alex@example.com"
  phone="+1 555-987-6543">
</div>
```

## Generated Structure

```html
<article class="wb-card wb-portfolio">
  <figure class="wb-card__figure wb-card__portfolio-cover">
  </figure>
  <header>
    <img class="wb-card__portfolio-avatar">
    <h2 class="wb-card__portfolio-name">Name</h2>
    <p class="wb-card__portfolio-title">Title</p>
    <p class="wb-card__portfolio-company">Company</p>
    <p class="wb-card__portfolio-location">📍 Location</p>
    <p class="wb-card__portfolio-bio">Bio...</p>
  </header>
  <address>
    <a class="wb-card__portfolio-email">📧 email</a>
    <a class="wb-card__portfolio-phone">📱 phone</a>
    <a class="wb-card__portfolio-website">🌐 website</a>
  </address>
  <div class="wb-card__portfolio-social">
    <a>💼</a> <!-- LinkedIn -->
    <a>🐦</a> <!-- Twitter -->
    <a>🐙</a> <!-- GitHub -->
  </div>
</article>
```

## Schema

Location: `src/wb-models/cardportfolio.schema.json`
