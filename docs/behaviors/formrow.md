# x-formrow Behavior

Styles a form field wrapper as a row, optionally laid out inline. See
[src/wb-viewmodels/formrow.js](../../src/wb-viewmodels/formrow.js).

- **Root CSS class:** `x-formrow`
- **Schema:** [formrow.schema.json](../../src/wb-models/formrow.schema.json)

## Usage

<div x-demo>
<div x-formrow>
  <label>Name</label>
  <input type="text" placeholder="Jane Doe">
</div>
</div>

Add `data-inline` (plain `data-*` attribute, not `x-*`) to lay the label and
control out on one line instead of stacked:

<div x-demo>
<div x-formrow data-inline>
  <label>Email</label>
  <input type="email" placeholder="you@example.com">
</div>
</div>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `data-inline` | boolean (presence) | `false` | Applies `x-formrow--inline` for a horizontal label/control layout. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `x-formrow` | the host element | always |
| `x-formrow--inline` | the host element | `data-inline` present |

## Events

None.

- [Schema](../../src/wb-models/formrow.schema.json)
- [Source](../../src/wb-viewmodels/formrow.js)
