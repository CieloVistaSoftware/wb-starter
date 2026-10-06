# Navbar

Every `<nav>` picks up navbar; no `x-navbar` attribute needed (#958). A plain `<nav>` of links gets the site's link look (theme colour, underline on hover) and keeps its own layout. Give it a `brand`, `logo`, `items`, `sticky` or `variant` and it becomes the site header: the `brand` (and optional `logo`) linking to `brand-href`, a `tagline`, and links from `items`, collapsing into a menu button on narrow screens. On a non-`<nav>` host, write `x-navbar`. A `<nav>` that names another behavior (`x-breadcrumb`, `x-scrollalong`) gets only that one.

## Usage

<div x-demo>
<nav brand="wb-starter" brand-href="#" tagline="Zero build"></nav>
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
