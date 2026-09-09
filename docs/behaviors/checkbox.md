# Checkbox

Checkbox input with label and custom styling

## Type — semantic, and available as an attribute

`tag-map.js` maps `input[type="checkbox"]` to this behavior, so a plain checkbox
gets it with nothing added — the element already says what it is.

### How to write it

```html
<input type="checkbox" name="full-suite" checked>
<label for="full-suite">Run the full suite before pushing</label>
```

That is the form to reach for. The behavior styles the control, keeps the native
checked/indeterminate state, and leaves the element a real form control, so it
posts and validates like any other.

### On a different element

Use `x-checkbox` when the host is not an `<input type="checkbox">` and you want
the same behavior — it builds its own control and label from the attributes:

```html
<div x-checkbox label="Run the full suite before pushing" name="full-suite" checked></div>
```

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

## Live example

See `x-checkbox` on the [Behaviors showcase](/?page=behaviors) — search for `x-checkbox` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/checkbox.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
