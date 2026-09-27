# Input

A plain `<input>` gets the form styling: `variant` shows a success or error state, `size` sets the scale, and `clearable` adds a button that empties it. `label`, `helper` and `error` add text around the field.

## Usage

<div x-demo>
<input
  variant="error"
  placeholder="owner/name"
  name="repo"
  type="text">
</div>

No attribute needed on `<input>`. Don't add `x-input` to it (#746).

`<input x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

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

<sub>Schema: [`input.schema.json`](../../src/wb-models/input.schema.json)</sub>
