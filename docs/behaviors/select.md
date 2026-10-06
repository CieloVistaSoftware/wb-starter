# Select

A plain `<select>` gets the form styling, with `variant` for validation state, `size`, and `clearable` for a button that resets it. Its `<option>` children stay the source of choices.

## Usage

<div x-demo>
<select name="branch">
  <option value="main">main</option>
  <option value="develop">develop</option>
  <option value="fix/706-dropdown">fix/706-dropdown</option>
</select>
</div>

No attribute needed on `<select>`. Don't add `x-select` to it (#746).

`<select>` is for choosing a value; a menu of actions is
[x-dropdown](dropdown.md). The `<div x-select options='…'>` form is deprecated:
write a `<select>` with `<option>` children
([the rule](../standards/V3-STANDARDS.md#choosing-a-value-or-an-action-select-or-x-dropdown), #682).

`<select x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

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

<sub>Schema: [`select.schema.json`](../../src/wb-models/select.schema.json)</sub>
