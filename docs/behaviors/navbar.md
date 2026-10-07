# Navbar

Every `<nav>` picks up navbar; no `x-navbar` attribute needed (#958). A plain `<nav>` of links gets the site's link look (theme colour, underline on hover) and keeps its own layout. Give it a `brand`, `logo`, `items`, `sticky` or `variant` and it becomes the site header: the `brand` (and optional `logo`) linking to `brandHref`, a `tagline`, and links from `items`, collapsing into a menu button on narrow screens. On a non-`<nav>` host, write `x-navbar`. A `<nav>` that names another behavior (`x-breadcrumb`, `x-scrollalong`) gets only that one.

## Usage

<div x-demo>
<nav brand="wb-starter" brandHref="#" tagline="Zero build"></nav>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `brand` | text | — | Brand text |
| `brandHref` | URL | `/` | Brand link URL |
| `logo` | URL | — | Logo image URL |
| `logoSize` | number of pixels | `32` | Logo size in pixels |
| `tagline` | text | — | Brand tagline or subtitle |
| `items` | JSON array of {label, href} | — | Navigation items as JSON [{label, href}] |
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
