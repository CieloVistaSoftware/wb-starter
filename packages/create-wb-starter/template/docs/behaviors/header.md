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

### Declining it

A `<header>` **is** the header behavior, so it arrives with the element. To keep the semantic element and decline the behavior, add `x-ignore`:

```html
<header x-ignore>
  <!-- a plain header: no behavior is injected -->
</header>
```

Reaching for a different element instead is the wrong fix — it trades correct HTML for a workaround. See [escape hatches](../escape-hatches.md).


## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `icon` | `string` | `this is the icon` | Logo icon (emoji or text) |
| `title` | `string` | `this is the title` | Header title |
| `subtitle` | `string` | `this is the subtitle` | Subtitle text |
| `badge` | `string` | `this is the badge` | Badge text (e.g., version) |
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
