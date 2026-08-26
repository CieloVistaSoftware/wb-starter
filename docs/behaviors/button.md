# Button

Interactive button with variants, sizes, and optional icon

## Type — decorates a semantic element

`x-button` is the **button behavior**. It attaches to `<button>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<!-- Plain semantic HTML. The behavior is injected automatically -->
<!-- because the element itself implies it. No attribute needed. -->
<button variant="primary" icon="download" size="md">
  variant: primary · icon: download · size: md
</button>
```

### On a different element

Use `x-button` when the host is not a `<button>` and you want the same behavior:

```html
<div x-button>
  …
</div>
```

> Do not write `<button x-button>`. The element already injects it, and the redundant attribute can suppress the behavior (#746).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Button text |
| `icon` | `star` · `check` · `close` · `warning` · `info` · `error` · `heart` · `search` · `edit` · `trash` · `plus` · `minus` · `home` · `settings` · `download` · `upload` · `arrow_right` · `arrow_left` · `copy` · `save` | — | Icon name from built-in library, or any emoji/text |
| `icon-position` | `start` · `end` | `start` | Icon position relative to label |
| `variant` | `primary` · `secondary` · `success` · `warning` · `error` · `ghost` · `outline` · `link` | `primary` | Visual style variant |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` | `md` | Button size |
| `disabled` | `boolean` | `false` | Disabled state |
| `loading` | `boolean` | `false` | Loading state with spinner |
| `full-width` | `boolean` | `false` | Full width button |
| `icon-only` | `boolean` | `false` | Icon-only button (square) |
| `href` | `string` | — | Destination URL. Turns the control into a real link — required for variant="link" to mean anything. |
| `target` | `_self` · `_blank` | `_self` | Where to open href |

## Events

- `wb:button:click` — Fired when the button is activated (mouse click, Enter, or Space)

## Methods

- `enable()` — Enables the button
- `disable()` — Disables the button
- `startLoading()` — Shows loading state
- `stopLoading()` — Hides loading state
- `click()` — Programmatically clicks the button
- `focus()` — Focuses the button
- `blur()` — Removes focus from button

## Accessibility

- **role** — button
- **ariaDisabled** — dynamic when disabled

## Live example

See `x-button` on the [Behaviors showcase](/?page=behaviors) — search for `x-button` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/button.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
