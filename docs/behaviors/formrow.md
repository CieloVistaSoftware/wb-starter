# x-formrow Behavior

Styles a form field wrapper as a row, optionally laid out inline. See
[src/wb-viewmodels/formrow.js](../../src/wb-viewmodels/formrow.js).

- **Type:** Modifier
- **Root CSS class:** `wb-form-row`
- **Schema:** [formrow.schema.json](../../src/wb-models/formrow.schema.json)

## Usage

```html
<div x-formrow>
  <label>Name</label>
  <input type="text" placeholder="Jane Doe">
</div>
```

<wb-demo>
<div x-formrow>
  <label>Name</label>
  <input type="text" placeholder="Jane Doe">
</div>
</wb-demo>

Add `data-inline` (plain `data-*` attribute, not `x-*`) to lay the label and
control out on one line instead of stacked:

<wb-demo>
<div x-formrow data-inline>
  <label>Email</label>
  <input type="email" placeholder="you@example.com">
</div>
</wb-demo>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `data-inline` | boolean (presence) | `false` | Applies `wb-form-row--inline` for a horizontal label/control layout. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `wb-form-row` | the host element | always |
| `wb-form-row--inline` | the host element | `data-inline` present |

## Events

None.

- [Schema](../../src/wb-models/formrow.schema.json)
- [Source](../../src/wb-viewmodels/formrow.js)
