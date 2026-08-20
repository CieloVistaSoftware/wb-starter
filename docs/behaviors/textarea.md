# Textarea

Multi-line text input with autosize and character count

Applies to `<div>`, and to any element carrying `x-textarea`.

## Usage

```html
<div x-textarea>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Field label |
| `placeholder` | `string` | — | Placeholder text |
| `value` | `string` | — | Text value |
| `name` | `string` | — | Form field name |
| `rows` | `number` | `3` | Visible rows |
| `max-length` | `number` | `0` | Max character limit |
| `show-count` | `boolean` | `false` | Show character count |
| `autosize` | `boolean` | `false` | Auto-resize to content |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `required` | `boolean` | `false` | Required field |
| `resize` | `none` · `vertical` · `horizontal` · `both` | `vertical` |  |
| `variant` | `default` · `success` · `error` | `default` |  |

## Events

- `input` — Fired on input
- `change` — Fired on change

## Methods

- `getValue()` — Gets current value
- `setValue()` — Sets value
- `clear()` — Clears the textarea
- `focus()` — Focuses the textarea
- `blur()` — Removes focus
- `select()` — Selects all text
- `enable()` — Enables the textarea
- `disable()` — Disables the textarea

## Live example

See `x-textarea` on the [Behaviors showcase](/?page=behaviors) — search for `x-textarea` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/textarea.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
