# Navbar

Navigation bar with brand, links, and responsive menu

## Type — decorates a semantic element

`x-navbar` is the **nav behavior**. It attaches to `<nav>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<nav x-navbar brand="wb-starter" brand-href="#" tagline="Zero build"></nav>
```

### On a different element

Use `x-navbar` when the host is not a `<nav>` and you want the same behavior:

```html
<div x-navbar>
  …
</div>
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
