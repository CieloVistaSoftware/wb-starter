# Select

Enhanced select dropdown with search, clear, and multi-select

Applies to `<div>`, and to any element carrying `x-select`.

## Usage

```html
<div x-select>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Select label |
| `placeholder` | `string` | `Select...` | Placeholder text |
| `options` | `string` | — | Options as JSON [{value, label}] |
| `value` | `string` | — | Selected value |
| `name` | `string` | — | Form field name |
| `searchable` | `boolean` | `false` | Enable search |
| `clearable` | `boolean` | `false` | Enable clear button |
| `multiple` | `boolean` | `false` | Allow multiple selection |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required field |
| `size` | `sm` · `md` · `lg` | `md` |  |
| `variant` | `default` · `success` · `error` | `default` |  |

## Events

- `wb:select:change` — Selection changed
- `wb:select:open` — Dropdown opened
- `wb:select:close` — Dropdown closed

## Methods

- `getValue()` — Gets selected value(s)
- `setValue()` — Sets selected value(s)
- `clear()` — Clears selection
- `open()` — Opens dropdown
- `close()` — Closes dropdown
- `toggle()` — Toggles dropdown
- `focus()` — Focuses the select
- `enable()` — Enables the select
- `disable()` — Disables the select
- `setOptions()` — Updates options

## Live example

See `x-select` on the [Behaviors showcase](/?page=behaviors) — search for `x-select` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/select.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
