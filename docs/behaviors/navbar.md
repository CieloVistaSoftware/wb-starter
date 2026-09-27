# Navbar

`x-navbar` builds a navigation bar in a `<nav>`: the `brand` (and optional `logo`) linking to `brand-href`, a `tagline`, and links from the `items` JSON, collapsing into a menu button on narrow screens.

## Usage

<div x-demo>
<nav x-navbar brand="wb-starter" brand-href="#" tagline="Zero build"></nav>
</div>

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

<sub>Schema: [`navbar.schema.json`](../../src/wb-models/navbar.schema.json)</sub>
