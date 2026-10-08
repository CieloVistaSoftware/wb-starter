# Textarea

A plain `<textarea>` gets the form styling, and optionally grows with its content (`autosize`) and shows a character count against `maxLength` (`showCount`).

## Usage

<div x-demo>
<textarea
  placeholder="What changed in this release?"
  name="notes"
  rows="3"></textarea>
</div>

No attribute needed on `<textarea>`. Don't add `x-textarea` to it (#746).

`<textarea x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | text | — | Field label |
| `placeholder` | text | — | Placeholder text |
| `value` | text | — | Text value |
| `name` | text | — | Form field name |
| `rows` | `number` | `3` | Visible rows |
| `maxLength` | `number` | `0` | Max character limit |
| `showCount` | `boolean` | `false` | Show character count |
| `autosize` | `boolean` | `false` | Auto-resize to content |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `required` | `boolean` | `false` | Required field |
| `resize` | `none` · `vertical` · `horizontal` · `both` | `vertical` |  |
| `variant` | `default` · `success` · `error` | `default` |  |

## Methods

- `getValue()` — Gets current value
- `setValue()` — Sets value
- `clear()` — Clears the textarea
- `focus()` — Focuses the textarea
- `blur()` — Removes focus
- `select()` — Selects all text
- `enable()` — Enables the textarea
- `disable()` — Disables the textarea

<sub>Schema: [`textarea.schema.json`](../../src/wb-models/textarea.schema.json)</sub>
