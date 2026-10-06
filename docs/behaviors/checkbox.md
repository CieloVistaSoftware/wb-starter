# Checkbox

Checkbox input with label and custom styling

## Usage

<div x-demo>
<input type="checkbox" name="full-suite" checked>
<label for="full-suite">Run the full suite before pushing</label>
</div>

That is the form to reach for. The behavior styles the control, keeps the native
checked/indeterminate state, and leaves the element a real form control, so it
posts and validates like any other.

### On a different element

Use `x-checkbox` when the host is not an `<input type="checkbox">` and you want
the same behavior — it builds its own control and label from the attributes:

<div x-demo>
<div x-checkbox label="Run the full suite before pushing" name="full-suite" checked></div>
</div>

Prefer the native form. Reaching for a `<div>` when `<input type="checkbox">`
says it better trades correct HTML for a workaround: the div version has to
re-create focus, keyboard toggling and form participation that the real control
already has.

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Label text |
| `checked` | `boolean` | `false` | Checked state |
| `disabled` | `boolean` | `false` | Disabled state |
| `indeterminate` | `boolean` | `false` | Indeterminate state |
| `name` | `string` | — | Form field name |
| `value` | `string` | — | Form field value |
| `required` | `boolean` | `false` | Required field |
| `size` | `sm` · `md` · `lg` | `md` |  |
| `variant` | `default` · `primary` · `success` | `default` |  |

## Events

- `wb:checkbox:change` — Fired when state changes

## Methods

- `check()` — Checks the checkbox
- `uncheck()` — Unchecks the checkbox
- `toggle()` — Toggles checked state
- `isChecked()` — Returns checked state
- `enable()` — Enables the checkbox
- `disable()` — Disables the checkbox

<sub>Schema: [`checkbox.schema.json`](../../src/wb-models/checkbox.schema.json)</sub>
