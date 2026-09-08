# Input

Text input field with label, helper text, and validation states

## Type — new capability

`x-input` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<input
  variant="error"
  placeholder="owner/name"
  name="repo"
  type="text">
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Input label text |
| `placeholder` | `string` | — | Placeholder text |
| `value` | `string` | — | Input value |
| `name` | `string` | — | Form field name |
| `input-type` | `text` · `email` · `password` · `number` · `tel` · `url` · `search` · `date` · `time` · `datetime-local` | `text` | HTML input type |
| `helper` | `string` | — | Helper text below input |
| `error` | `string` | — | Error message (shows error state) |
| `variant` | `default` · `success` · `error` | `default` | Visual validation state |
| `size` | `sm` · `md` · `lg` | `md` | Input size |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `required` | `boolean` | `false` | Required field |
| `icon` | `string` | — | Icon (emoji or icon name) |
| `icon-position` | `start` · `end` | `start` | Icon position |
| `clearable` | `boolean` | `false` | Show clear button when has value |

## Events

- `input` — Fired when value changes
- `change` — Fired when value is committed
- `focus` — Fired when input receives focus
- `blur` — Fired when input loses focus

## Methods

- `getValue()` — Gets the current input value
- `setValue()` — Sets the input value
- `clear()` — Clears the input value
- `focus()` — Focuses the input
- `blur()` — Removes focus from input
- `select()` — Selects all text in input
- `setError()` — Sets error state and message
- `clearError()` — Clears error state
- `validate()` — Validates the input value
- `enable()` — Enables the input
- `disable()` — Disables the input

## Accessibility

- **role** — textbox
- **ariaRequired** — dynamic when required
- **ariaInvalid** — dynamic when error
- **ariaDescribedBy** — helper or error text id

## Live example

See `x-input` on the [Behaviors showcase](/?page=behaviors) — search for `x-input` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/input.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
