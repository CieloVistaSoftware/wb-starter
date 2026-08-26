# Textarea

Multi-line text input with autosize and character count

## Type — new capability

`x-textarea` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<textarea
  placeholder="What changed in this release?"
  name="notes"
  rows="3"></textarea>
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
