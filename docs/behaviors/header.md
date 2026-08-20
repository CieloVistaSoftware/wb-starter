# Header

Page header with logo, title, and optional navigation

Applies to `<header>`, and to any element carrying `x-header`.

## Usage

```html
<header x-header>
  …
</header>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `icon` | `string` | — | Logo icon (emoji or text) |
| `title` | `string` | — | Header title |
| `subtitle` | `string` | — | Subtitle text |
| `badge` | `string` | — | Badge text (e.g., version) |
| `logo-href` | `string` | `/` | Logo link URL |
| `sticky` | `boolean` | `false` | Sticky at top |

## Methods

- `setTitle()` — Updates title
- `setIcon()` — Updates icon
- `setBadge()` — Updates badge

## Accessibility

- **role** — banner

## Live example

See `x-header` on the [Behaviors showcase](/?page=behaviors) — search for `x-header` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/header.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
