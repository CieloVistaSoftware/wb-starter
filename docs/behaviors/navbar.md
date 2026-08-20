# Navbar

Navigation bar with brand, links, and responsive menu

Applies to `<nav>`, and to any element carrying `x-navbar`.

## Usage

```html
<nav x-navbar>
  …
</nav>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `brand` | `string` | — | Brand text |
| `brand-href` | `string` | `/` | Brand link URL |
| `logo` | `string` | — | Logo image URL |
| `logo-size` | `string` | `32` | Logo size in pixels |
| `tagline` | `string` | — | Brand tagline or subtitle |
| `items` | `string` | — | Navigation items as JSON [{label, href}] |
| `sticky` | `boolean` | `false` | Sticky positioning |
| `variant` | `default` · `dark` · `transparent` | `default` |  |

## Methods

- `openMenu()` — Opens mobile menu
- `closeMenu()` — Closes mobile menu
- `toggleMenu()` — Toggles mobile menu

## Accessibility

- **role** — navigation
- **ariaLabel** — Main navigation

## Live example

See `x-navbar` on the [Behaviors showcase](/?page=behaviors) — search for `x-navbar` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/navbar.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
