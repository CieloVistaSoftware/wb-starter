# x-fieldset Behavior

Styles a `<fieldset>` and, optionally, makes it collapsible by clicking its
`<legend>`. See [src/wb-viewmodels/fieldset.js](../../src/wb-viewmodels/fieldset.js).

- **Type:** Modifier
- **Root CSS class:** `wb-fieldset`
- **Schema:** [fieldset.schema.json](../../src/wb-models/fieldset.schema.json)
- **Auto-inject:** `<fieldset>` is in `nativeMap` (`src/core/config.js` has
  `autoInject: true` site-wide), so a bare `<fieldset>` gets the `wb-fieldset`
  class automatically — `x-fieldset` is only required to opt into the
  `collapsible` behavior.

## Usage

The collapsible flags read `data-collapsible` / `data-collapsed` (plain
`data-*` attributes, not `x-*`):

```html
<fieldset data-collapsible>
  <legend>Shipping details</legend>
  <input type="text" placeholder="Address line 1">
</fieldset>
```

<wb-demo>
<fieldset data-collapsible>
  <legend>Shipping details</legend>
  <input type="text" placeholder="Address line 1">
</fieldset>
</wb-demo>

Add `data-collapsed` to start collapsed:

<wb-demo>
<fieldset data-collapsible data-collapsed>
  <legend>Advanced options</legend>
  <input type="text" placeholder="Coupon code">
</fieldset>
</wb-demo>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `data-collapsible` | boolean (presence) | `false` | Makes the `<legend>` clickable to toggle collapse. Requires a real `<legend>` child. |
| `data-collapsed` | boolean (presence) | `false` | Starts the fieldset collapsed. Only meaningful with `data-collapsible`. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `wb-fieldset` | the `<fieldset>` | always |
| `wb-fieldset__legend` | the `<legend>` | `data-collapsible` present |
| `wb-fieldset__legend--collapsible` | the `<legend>` | `data-collapsible` present |
| `wb-fieldset--collapsed` | the `<fieldset>` | collapsed (toggled by clicking the legend) |

## Events

None.

- [Schema](../../src/wb-models/fieldset.schema.json)
- [Demo](../../demos/site/forms.html#x-fieldset-collapsible-fieldset)
- [Source](../../src/wb-viewmodels/fieldset.js)
