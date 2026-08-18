# Card Profile - wb-starter v3.0

User profile card with avatar, name, role, and bio.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardprofile>` |
| Behavior | `cardprofile` |
| Semantic | `<article>` |
| Root CSS Class | `wb-card wb-card--profile` |
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

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardprofile
  name="John Doe"
  role="Software Engineer"
  avatar="https://picsum.photos/seed/avatar/200/200">
</wb-cardprofile>
</wb-demo>

## Usage

### Basic Profile

```html
<wb-cardprofile
  name="John Doe"
  role="Software Engineer"
  avatar="https://picsum.photos/seed/avatar/200/200">
</wb-cardprofile>
```

### With Bio and Cover

```html
<wb-cardprofile
  name="Jane Smith"
  role="Product Designer"
  avatar="https://picsum.photos/seed/jane/200/200"
  cover="https://picsum.photos/seed/cover/800/500"
  bio="Passionate about creating beautiful, user-friendly interfaces.">
</wb-cardprofile>
```

## Generated Structure

```html
<article class="wb-card wb-card--profile">
  <figure
    class="wb-card__figure wb-card__cover"
    style="background-image: url(...)">
  </figure>
  <header class="wb-card__profile-content">
    <img
      class="wb-card__avatar"
      src="..."
      alt="...">
    <h3 class="wb-card__title wb-card__name">Name</h3>
    <p class="wb-card__subtitle wb-card__role">Role</p>
    <p class="wb-card__bio">Bio text...</p>
  </header>
</article>
```

## Schema

Location: `src/wb-models/cardprofile.schema.json`
