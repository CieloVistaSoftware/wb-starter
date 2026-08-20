# Checkbox

Checkbox input with label and custom styling

Applies to `<div>`, and to any element carrying `x-checkbox`.

## Usage

```html
<div x-checkbox>
  …
</div>
```

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

## Live example

See `x-checkbox` on the [Behaviors showcase](/?page=behaviors) — search for `x-checkbox` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/checkbox.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
