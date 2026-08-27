# Card Profile - wb-starter v3.0

User profile card with avatar, name, role, and bio.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardprofile>` |
| Behavior | `cardprofile` |
| Semantic | `<article>` |
| Root CSS Class | `x-card x-card--profile` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `avatar` | string | `""` | Avatar image URL |
| `name` | string | `""` | Person's name |
| `role` | string | `""` | Job title/role |
| `bio` | string | `""` | Biography text |
| `cover` | string | `""` | Cover/banner image URL |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-cardprofile
  name="John Doe"
  role="Software Engineer"
  avatar="https://picsum.photos/seed/avatar/200/200">
</div>
</div>

## Usage

### Basic Profile

```html
<div x-cardprofile
  name="John Doe"
  role="Software Engineer"
  avatar="https://picsum.photos/seed/avatar/200/200">
</div>
```

### With Bio and Cover

```html
<div x-cardprofile
  name="Jane Smith"
  role="Product Designer"
  avatar="https://picsum.photos/seed/jane/200/200"
  cover="https://picsum.photos/seed/cover/800/500"
  bio="Passionate about creating beautiful, user-friendly interfaces.">
</div>
```

## Generated Structure

```html
<article class="x-card x-card--profile">
  <figure
    class="x-card__figure x-card__cover"
    style="background-image: url(...)">
  </figure>
  <header class="x-card__profile-content">
    <img
      class="x-card__avatar"
      src="..."
      alt="...">
    <h3 class="x-card__title x-card__name">Name</h3>
    <p class="x-card__subtitle x-card__role">Role</p>
    <p class="x-card__bio">Bio text...</p>
  </header>
</article>
```

## Schema

Location: `src/wb-models/cardprofile.schema.json`
