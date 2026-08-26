# Header

Page header with logo, title, and optional navigation

## Type — decorates a semantic element

`x-header` is the **header behavior**. It attaches to `<header>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<!-- Plain semantic HTML. The behavior is injected automatically -->
<!-- because the element itself implies it. No attribute needed. -->
<header title="Field notes" subtitle="Everything that happened this week" badge="New"></header>
```

### On a different element

Use `x-header` when the host is not a `<header>` and you want the same behavior:

```html
<div x-header>
  …
</div>
```

> Do not write `<header x-header>`. The element already injects it, and the redundant attribute can suppress the behavior (#746).

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
