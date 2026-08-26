# Button Card

Card with action buttons in footer

## Type — decorates a semantic element

`x-cardbutton` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardbutton
  title="Upgrade to Team"
  content="Shared workspaces, audit history and SSO."
  primary="Start free trial"
  secondary="Compare plans"></article>
```

### On a different element

Use `x-cardbutton` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardbutton>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title |
| `content` | `string` | — | Card content/description |
| `primary` | `string` | — | Primary button text |
| `primary-href` | `string` | — | Primary button link URL |
| `secondary` | `string` | — | Secondary button text |
| `secondary-href` | `string` | — | Secondary button link URL |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:cardbutton:primary` — Primary button clicked
- `wb:cardbutton:secondary` — Secondary button clicked

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility

## Live example

See `x-cardbutton` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardbutton` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardbutton.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
