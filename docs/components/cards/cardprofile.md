# Card Profile - wb-starter v3.0

User profile card with avatar, name, role, and bio.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardprofile>` |
| Behavior | `cardprofile` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card--profile` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `avatar` | string | `""` | Avatar image URL |
| `name` | string | `""` | Person's name |
| `role` | string | `""` | Job title/role |
| `bio` | string | `""` | Biography text |
| `cover` | string | `""` | Cover/banner image URL |

## Usage

### Basic Profile

```html
<wb-cardprofile 
  name="John Doe"
  role="Software Engineer"
  avatar="/images/avatar.jpg">
</wb-cardprofile>
```

### With Bio and Cover

```html
<wb-cardprofile 
  name="Jane Smith"
  role="Product Designer"
  avatar="/images/jane.jpg"
  cover="/images/cover.jpg"
  bio="Passionate about creating beautiful, user-friendly interfaces.">
</wb-cardprofile>
```

## Generated Structure

```html
<article class="wb-card wb-card--profile">
  <figure class="wb-card__figure wb-card__cover" style="background-image: url(...)">
  </figure>
  <header class="wb-card__profile-content">
    <img class="wb-card__avatar" src="..." alt="...">
    <h3 class="wb-card__title wb-card__name">Name</h3>
    <p class="wb-card__subtitle wb-card__role">Role</p>
    <p class="wb-card__bio">Bio text...</p>
  </header>
</article>
```

## Schema

Location: `src/wb-models/cardprofile.schema.json`
