# x-floatinglabel Behavior

Turns a field's placeholder into a label that floats above the field once it
has focus or a value. See
[src/wb-viewmodels/floatinglabel.js](../../src/wb-viewmodels/floatinglabel.js).

- **Type:** Modifier
- **Root CSS class:** `x-floating-label`
- **Schema:** [floatinglabel.schema.json](../../src/wb-models/floatinglabel.schema.json)

## Usage

The label text comes from the field's `placeholder`, or from a `label`
attribute if there's no placeholder — either way, the placeholder is cleared
once the label is built:

```html
<input type="email" x-floatinglabel placeholder="Email address">
```

<div x-demo>
<input type="email" x-floatinglabel placeholder="Email address">
</div>

<div x-demo>
<input type="text" x-floatinglabel label="Full name">
</div>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `placeholder` | string | — | Used as the label text if present (checked first). |
| `label` | string | — | Fallback label text when there's no `placeholder`. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `x-floating-label` | wrapper `<div>` | always |
| `x-floating-label__label` | the generated `<label>` | always |
| `x-floating-label--active` | wrapper `<div>` | the field has a value or is focused |

## Events

None — the behavior listens to the field's native `focus`/`blur`/`input` events; it doesn't dispatch any of its own.

- [Schema](../../src/wb-models/floatinglabel.schema.json)
- [Source](../../src/wb-viewmodels/floatinglabel.js)
