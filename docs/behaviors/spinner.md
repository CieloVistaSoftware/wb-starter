# Spinner

Loading spinner indicator

Applies to `<div>`, and to any element carrying `x-spinner`.

## Usage

```html
<div x-spinner>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` | `md` |  |
| `variant` | `default` · `primary` · `success` · `warning` · `error` | `primary` |  |
| `speed` | `slow` · `medium` · `fast` | `medium` |  |
| `label` | `string` | `Loading` | Accessible label |

## Methods

- `show()` — Shows the spinner
- `hide()` — Hides the spinner

## Accessibility

- **role** — status
- **ariaLabel** — dynamic from label

## Live example

See `x-spinner` on the [Behaviors showcase](/?page=behaviors) — search for `x-spinner` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/spinner.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
