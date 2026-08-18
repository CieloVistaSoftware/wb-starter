# x-inputgroup Behavior

Groups an input with prepended/appended addons (currency symbols, units,
buttons) into one visually joined control. See
[src/wb-viewmodels/inputgroup.js](../../src/wb-viewmodels/inputgroup.js).

- **Type:** Modifier
- **Root CSS class:** `wb-input-group`
- **Schema:** [inputgroup.schema.json](../../src/wb-models/inputgroup.schema.json)

## Usage

Addons are marked with `data-prepend` / `data-append` on the child elements
themselves — the behavior finds them inside the host and classes them:

```html
<div x-inputgroup>
  <span data-prepend>$</span>
  <input type="number" placeholder="0.00">
  <span data-append>USD</span>
</div>
```

<wb-demo>
<div x-inputgroup>
  <span data-prepend>$</span>
  <input type="number" placeholder="0.00">
  <span data-append>USD</span>
</div>
</wb-demo>

A group only needs one side:

<wb-demo>
<div x-inputgroup>
  <span data-prepend>@</span>
  <input type="text" placeholder="username">
</div>
</wb-demo>

## Properties

None on the host element — `data-prepend`/`data-append` are markers on
descendant elements, not configuration attributes.

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `wb-input-group` | the host element | always |
| `wb-input-group__prepend` | the `[data-prepend]` child, if present | always (when present) |
| `wb-input-group__append` | the `[data-append]` child, if present | always (when present) |

## Events

None.

- [Schema](../../src/wb-models/inputgroup.schema.json)
- [Source](../../src/wb-viewmodels/inputgroup.js)
