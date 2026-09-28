# x-floatinglabel Behavior

Turns a field's placeholder into a label that floats above the field once it
has focus or a value. See
[src/wb-viewmodels/floatinglabel.js](../../src/wb-viewmodels/floatinglabel.js).

- **Root CSS class:** `x-floating-label`
- **Schema:** [floatinglabel.schema.json](../../src/wb-models/floatinglabel.schema.json)

## Usage

The label text comes from the field's `placeholder`, or from a `label`
attribute if there's no placeholder — either way, the placeholder is cleared
once the label is built:

<div x-demo>
<input type="email" x-floatinglabel placeholder="Email address">
</div>

<div x-demo>
<input type="text" x-floatinglabel label="Full name">
</div>

Or put it on a container that already holds the field and its own `<label>` —
the container becomes the wrapper and that label is the one that floats:

<div x-demo>
<div x-floatinglabel>
  <input type="text" id="fl-doc-project" placeholder=" ">
  <label for="fl-doc-project">Project name</label>
</div>
</div>

Works on `<input>`, `<textarea>` and `<select>`. At rest the label sits inside
the field like a placeholder; focused or filled, it rises onto the top border
and shrinks (styles: `src/styles/behaviors/floatinglabel.css`). A `<select>`
always shows a value, so its label is always risen.

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
| `x-floating-label--input` / `--textarea` / `--select` | wrapper `<div>` | always — which kind of field it holds |

## Events

None — the behavior listens to the field's native `focus`/`blur`/`input` events; it doesn't dispatch any of its own.

- [Schema](../../src/wb-models/floatinglabel.schema.json)
- [Source](../../src/wb-viewmodels/floatinglabel.js)
